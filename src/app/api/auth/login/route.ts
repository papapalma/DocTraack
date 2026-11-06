import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { verifyTOTP, verifyRecoveryCode } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting: max 5 login attempts per minute per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${clientIp}`, { limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please wait 1 minute before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const { email, password, code, authMode = "password" } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or credentials" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Account is disabled. Please contact the administrator." },
        { status: 403 }
      );
    }

    if (authMode === "totp") {
      // Login with Microsoft Authenticator 6-digit TOTP code (or 8-character recovery code)
      if (!code || typeof code !== "string" || code.trim() === "") {
        return NextResponse.json(
          { error: "Authenticator code is required" },
          { status: 400 }
        );
      }

      if (!user.twoFactorSecret || !user.twoFactorEnabled) {
        return NextResponse.json(
          {
            error: "Microsoft Authenticator is not configured for this account. Please sign in with your password.",
          },
          { status: 400 }
        );
      }

      let isValid = verifyTOTP(code, user.twoFactorSecret);
      let usedRecoveryCode = false;

      // If TOTP fails, check if the input is an emergency recovery code (e.g. 8 hex characters or formatted XXXX-XXXX)
      if (!isValid && user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.length > 0) {
        const recoveryCheck = await verifyRecoveryCode(code, user.twoFactorRecoveryCodes);
        if (recoveryCheck.valid) {
          isValid = true;
          usedRecoveryCode = true;
          // Invalidate the used recovery code
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorRecoveryCodes: recoveryCheck.remainingHashedCodes },
          });
        }
      }

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired Authenticator code. Please check your Microsoft Authenticator app." },
          { status: 401 }
        );
      }

      // Create session in database & set cookie
      await createSession(user.id);

      await logAudit({
        actorId: user.id,
        action: usedRecoveryCode ? "USER_LOGIN_RECOVERY_CODE" : "USER_LOGIN_TOTP",
        entity: "user",
        entityId: user.id,
        details: { email: user.email, role: user.role, method: usedRecoveryCode ? "recovery_code" : "microsoft_authenticator" },
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
    } else {
      // Standard Password Login
      if (!password) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Create session in database & set cookie
      await createSession(user.id);

      await logAudit({
        actorId: user.id,
        action: "USER_LOGIN",
        entity: "user",
        entityId: user.id,
        details: { email: user.email, role: user.role, method: "password" },
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
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
