import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { logAudit, writeAuditTx } from "@/lib/audit";
import {
  checkRateLimit,
  clearFailures,
  getClientIp,
  isLockedOut,
  recordFailure,
} from "@/lib/rate-limit";
import { isValidEmail, safeJsonObject } from "@/lib/validation";
import { verifyTOTPWithStep, verifyRecoveryCode } from "@/lib/totp";
import { Role } from "@/types";

const DUMMY_PASSWORD_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8l1Q1w9y1Q1w9y1Q1w9y1Q1w9y1Q1w";
const GENERIC_AUTH_ERROR =
  "Invalid email, password, or Authenticator verification code.";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${clientIp}`, {
      limit: 10,
      windowMs: 60000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts. Please wait 1 minute before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const rawEmail = body.email;
    const password = body.password;
    const code = body.code;
    const authMode = body.authMode === "totp" ? "totp" : "password";

    if (typeof rawEmail !== "string" || !rawEmail.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const accountLockKey = `login-acct:${normalizedEmail}`;
    const lockState = isLockedOut(accountLockKey);
    if (lockState.locked) {
      return NextResponse.json(
        {
          error:
            "Too many failed authentication attempts for this account. Please wait before trying again.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(lockState.retryAfterSec) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.active) {
      await verifyPassword("timing_equalization_pad", DUMMY_PASSWORD_HASH);
      recordFailure(accountLockKey, 5, 5 * 60 * 1000);
      await logAudit({
        actorId: user?.id ?? null,
        action: "USER_LOGIN_FAILED",
        entity: "user",
        entityId: user?.id ?? normalizedEmail,
        req,
        details: {
          email: normalizedEmail,
          reason: !user ? "unknown_account" : "inactive_account",
        },
      });
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    if (authMode === "totp") {
      // Passwordless Authenticator quick-login mode (strict per-account lockout + replay guard)
      if (typeof code !== "string" || !code.trim()) {
        return NextResponse.json(
          { error: "Authenticator code is required" },
          { status: 400 }
        );
      }

      const totpLockKey = `login-totp:${normalizedEmail}`;
      const totpLock = isLockedOut(totpLockKey);
      if (totpLock.locked) {
        return NextResponse.json(
          {
            error:
              "Too many invalid Authenticator attempts. Please wait before trying again.",
          },
          {
            status: 429,
            headers: { "Retry-After": String(totpLock.retryAfterSec) },
          }
        );
      }

      if (!user.twoFactorSecret || !user.twoFactorEnabled) {
        recordFailure(totpLockKey, 5, 5 * 60 * 1000);
        await logAudit({
          actorId: user.id,
          action: "USER_LOGIN_TOTP_FAILED",
          entity: "user",
          entityId: user.id,
          req,
          details: { email: user.email, reason: "2fa_not_enabled" },
        });
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }

      const totpResult = verifyTOTPWithStep(code, user.twoFactorSecret);
      let isValid =
        totpResult.valid &&
        totpResult.matchedStep !== null &&
        (user.lastTotpStep === null || totpResult.matchedStep > user.lastTotpStep);
      let usedRecoveryCode = false;
      let remainingHashedCodes = user.twoFactorRecoveryCodes;

      if (
        !isValid &&
        user.twoFactorRecoveryCodes &&
        user.twoFactorRecoveryCodes.length > 0
      ) {
        const recoveryCheck = await verifyRecoveryCode(
          code,
          user.twoFactorRecoveryCodes
        );
        if (recoveryCheck.valid) {
          isValid = true;
          usedRecoveryCode = true;
          remainingHashedCodes = recoveryCheck.remainingHashedCodes;
        }
      }

      if (!isValid) {
        recordFailure(totpLockKey, 5, 5 * 60 * 1000);
        recordFailure(accountLockKey, 5, 5 * 60 * 1000);
        await logAudit({
          actorId: user.id,
          action: "USER_LOGIN_TOTP_FAILED",
          entity: "user",
          entityId: user.id,
          req,
          details: { email: user.email, reason: "invalid_or_replayed_code" },
        });
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }

      try {
        await prisma.$transaction(async (tx) => {
          if (usedRecoveryCode) {
            const updated = await tx.user.updateMany({
              where: {
                id: user.id,
                twoFactorRecoveryCodes: {
                  equals: user.twoFactorRecoveryCodes,
                },
              },
              data: { twoFactorRecoveryCodes: remainingHashedCodes },
            });
            if (updated.count === 0) {
              throw new Error("CONCURRENT_RECOVERY_CODE");
            }
          } else if (totpResult.matchedStep !== null) {
            const updated = await tx.user.updateMany({
              where: {
                id: user.id,
                OR: [
                  { lastTotpStep: null },
                  { lastTotpStep: { lt: totpResult.matchedStep } },
                ],
              },
              data: { lastTotpStep: totpResult.matchedStep },
            });
            if (updated.count === 0) {
              throw new Error("REPLAYED_TOTP");
            }
          }

          await writeAuditTx(tx, {
            actorId: user.id,
            action: usedRecoveryCode
              ? "USER_LOGIN_RECOVERY_CODE"
              : "USER_LOGIN_TOTP",
            entity: "user",
            entityId: user.id,
            req,
            details: {
              email: user.email,
              role: user.role,
              method: usedRecoveryCode
                ? "recovery_code"
                : "microsoft_authenticator",
            },
          });
        });
      } catch {
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }

      clearFailures(totpLockKey);
      clearFailures(accountLockKey);
      await createSession(user.id, user.role as Role);

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          twoFactorEnabled: user.twoFactorEnabled,
          authenticatorLocked: user.authenticatorLocked,
        },
      });
    }

    // Standard Password Login (+ mandatory second-factor TOTP when 2FA is enabled)
    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      recordFailure(accountLockKey, 5, 5 * 60 * 1000);
      await logAudit({
        actorId: user.id,
        action: "USER_LOGIN_FAILED",
        entity: "user",
        entityId: user.id,
        req,
        details: { email: user.email, reason: "invalid_password" },
      });
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    let twoFactorUsed = false;
    let usedRecoveryCode = false;

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Prompt Step 2 only AFTER password succeeds so 2FA status is never disclosed pre-auth
      if (typeof code !== "string" || !code.trim()) {
        return NextResponse.json({
          requiresTwoFactor: true,
          message:
            "Enter the 6-digit Microsoft Authenticator code or recovery code to complete sign in.",
        });
      }

      const totpResult = verifyTOTPWithStep(code, user.twoFactorSecret);
      let secondFactorValid =
        totpResult.valid &&
        totpResult.matchedStep !== null &&
        (user.lastTotpStep === null || totpResult.matchedStep > user.lastTotpStep);
      let remainingHashedCodes = user.twoFactorRecoveryCodes;

      if (
        !secondFactorValid &&
        user.twoFactorRecoveryCodes &&
        user.twoFactorRecoveryCodes.length > 0
      ) {
        const recoveryCheck = await verifyRecoveryCode(
          code,
          user.twoFactorRecoveryCodes
        );
        if (recoveryCheck.valid) {
          secondFactorValid = true;
          usedRecoveryCode = true;
          remainingHashedCodes = recoveryCheck.remainingHashedCodes;
        }
      }

      if (!secondFactorValid) {
        recordFailure(accountLockKey, 5, 5 * 60 * 1000);
        await logAudit({
          actorId: user.id,
          action: "USER_LOGIN_2FA_FAILED",
          entity: "user",
          entityId: user.id,
          req,
          details: { email: user.email, reason: "invalid_second_factor" },
        });
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }

      twoFactorUsed = true;

      try {
        await prisma.$transaction(async (tx) => {
          if (usedRecoveryCode) {
            const updated = await tx.user.updateMany({
              where: {
                id: user.id,
                twoFactorRecoveryCodes: {
                  equals: user.twoFactorRecoveryCodes,
                },
              },
              data: { twoFactorRecoveryCodes: remainingHashedCodes },
            });
            if (updated.count === 0) {
              throw new Error("CONCURRENT_RECOVERY_CODE");
            }
          } else if (totpResult.matchedStep !== null) {
            const updated = await tx.user.updateMany({
              where: {
                id: user.id,
                OR: [
                  { lastTotpStep: null },
                  { lastTotpStep: { lt: totpResult.matchedStep } },
                ],
              },
              data: { lastTotpStep: totpResult.matchedStep },
            });
            if (updated.count === 0) {
              throw new Error("REPLAYED_TOTP");
            }
          }
        });
      } catch {
        return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
      }
    }

    clearFailures(accountLockKey);
    await createSession(user.id, user.role as Role);

    await logAudit({
      actorId: user.id,
      action: "USER_LOGIN",
      entity: "user",
      entityId: user.id,
      req,
      details: {
        email: user.email,
        role: user.role,
        method: twoFactorUsed
          ? usedRecoveryCode
            ? "password+recovery_code"
            : "password+microsoft_authenticator"
          : "password",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        twoFactorEnabled: user.twoFactorEnabled,
        authenticatorLocked: user.authenticatorLocked,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
