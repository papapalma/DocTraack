import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, createSession } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { verifyTOTPWithStep, generateRecoveryCodes } from "@/lib/totp";
import {
  checkRateLimit,
  clearFailures,
  getClientIp,
  isLockedOut,
  recordFailure,
} from "@/lib/rate-limit";
import {
  TWO_FA_PENDING_COOKIE_NAME,
  TWO_FA_SETUP_COOKIE_NAME,
  verifyScopedToken,
} from "@/lib/edge-session";
import { encryptSecret } from "@/lib/secret-box";
import { safeJsonObject } from "@/lib/validation";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`2fa-enable:${clientIp}`, {
      limit: 10,
      windowMs: 60000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 1 minute." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const body = await safeJsonObject(req);
    const code = body?.code;
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "A 6-digit verification code is required." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionUser = await getCurrentUser();
    const setupCookie = cookieStore.get(TWO_FA_SETUP_COOKIE_NAME)?.value;
    const pendingCookie = cookieStore.get(TWO_FA_PENDING_COOKIE_NAME)?.value;

    let targetUserId: string | null = null;
    let isRegistrationFlow = false;

    if (sessionUser) {
      targetUserId = sessionUser.id;
    } else if (setupCookie) {
      const verifiedSetup = await verifyScopedToken<{ userId?: unknown }>(
        setupCookie,
        "initial_2fa_lock"
      );
      if (verifiedSetup && typeof verifiedSetup.userId === "string") {
        targetUserId = verifiedSetup.userId;
        isRegistrationFlow = true;
      }
    }

    // Never trust arbitrary client-supplied userId without session or signed setup cookie
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User session not found. Please log in or register." },
        { status: 401 }
      );
    }

    const lockKey = `2fa-enable-acct:${targetUserId}`;
    const lockState = isLockedOut(lockKey);
    if (lockState.locked) {
      return NextResponse.json(
        { error: "Too many invalid verification attempts. Please wait." },
        {
          status: 429,
          headers: { "Retry-After": String(lockState.retryAfterSec) },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Unable to verify authenticator configuration." },
        { status: 400 }
      );
    }

    // Registration setup token may only complete an un-enrolled account
    if (isRegistrationFlow && (user.twoFactorEnabled || user.authenticatorLocked)) {
      return NextResponse.json(
        { error: "Account authenticator is already configured." },
        { status: 403 }
      );
    }

    // Use verified pending secret cookie if user initiated reconfiguration via /2fa/setup
    let secretToVerify = user.twoFactorSecret;
    let pendingSecretToCommit: string | null = null;

    if (sessionUser && pendingCookie) {
      const parsedPending = await verifyScopedToken<{
        userId?: unknown;
        secret?: unknown;
      }>(pendingCookie, "pending_2fa_setup");
      if (
        parsedPending &&
        parsedPending.userId === user.id &&
        typeof parsedPending.secret === "string"
      ) {
        secretToVerify = parsedPending.secret;
        pendingSecretToCommit = encryptSecret(parsedPending.secret);
      }
    }

    if (!secretToVerify) {
      return NextResponse.json(
        {
          error:
            "No Microsoft Authenticator configuration found. Please start setup again.",
        },
        { status: 400 }
      );
    }

    const totpResult = verifyTOTPWithStep(code, secretToVerify);
    if (
      !totpResult.valid ||
      totpResult.matchedStep === null ||
      (!pendingSecretToCommit &&
        user.lastTotpStep !== null &&
        totpResult.matchedStep <= user.lastTotpStep)
    ) {
      recordFailure(lockKey, 5, 5 * 60 * 1000);
      return NextResponse.json(
        {
          error:
            "Invalid or expired 6-digit code. Please enter the current code shown in Microsoft Authenticator.",
        },
        { status: 400 }
      );
    }

    const { plainCodes, hashedCodes } = await generateRecoveryCodes(8);
    const encryptedSecret =
      pendingSecretToCommit ?? encryptSecret(secretToVerify);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: encryptedSecret,
          twoFactorEnabled: true,
          authenticatorLocked: true,
          twoFactorRecoveryCodes: hashedCodes,
          lastTotpStep: totpResult.matchedStep,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          twoFactorEnabled: true,
          authenticatorLocked: true,
        },
      });

      await writeAuditTx(tx, {
        actorId: updated.id,
        action: "USER_2FA_ENABLED",
        entity: "user",
        entityId: updated.id,
        req,
        details: {
          email: updated.email,
          twoFactorType: "MICROSOFT_AUTHENTICATOR",
          reconfigured: Boolean(pendingSecretToCommit),
        },
      });

      return updated;
    });

    clearFailures(lockKey);
    cookieStore.delete(TWO_FA_SETUP_COOKIE_NAME);
    cookieStore.delete(TWO_FA_PENDING_COOKIE_NAME);

    if (!sessionUser) {
      await createSession(updatedUser.id, updatedUser.role as Role);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Microsoft Authenticator successfully linked and locked.",
        recoveryCodes: plainCodes,
        user: updatedUser,
      },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while enabling Microsoft Authenticator.",
      },
      { status: 500 }
    );
  }
}
