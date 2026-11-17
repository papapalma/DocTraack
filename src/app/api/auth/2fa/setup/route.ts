import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieFlags, getCurrentUser, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  generateBase32Secret,
  formatSecretForDisplay,
  generateOTPAuthUrl,
  verifyTOTPWithStep,
  verifyRecoveryCode,
} from "@/lib/totp";
import {
  TWO_FA_PENDING_COOKIE_NAME,
  signScopedToken,
} from "@/lib/edge-session";
import { generateQRCodeSVG } from "@/lib/qr";
import { safeJsonObject } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`2fa-setup:${user.id}:${clientIp}`, {
      limit: 5,
      windowMs: 60000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many authenticator setup attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorRecoveryCodes: true,
        authenticatorLocked: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reconfiguration of an active/locked authenticator requires explicit re-authentication
    if (dbUser.twoFactorEnabled || dbUser.authenticatorLocked) {
      const body = await safeJsonObject(req);
      const currentPassword =
        typeof body?.currentPassword === "string" ? body.currentPassword : "";
      const currentCode =
        typeof body?.currentCode === "string" ? body.currentCode.trim() : "";

      let reauthenticated = false;
      if (currentPassword) {
        reauthenticated = await verifyPassword(
          currentPassword,
          dbUser.passwordHash
        );
      }
      if (!reauthenticated && currentCode && dbUser.twoFactorSecret) {
        if (verifyTOTPWithStep(currentCode, dbUser.twoFactorSecret).valid) {
          reauthenticated = true;
        } else if (dbUser.twoFactorRecoveryCodes.length > 0) {
          const rc = await verifyRecoveryCode(
            currentCode,
            dbUser.twoFactorRecoveryCodes
          );
          if (rc.valid) reauthenticated = true;
        }
      }

      if (!reauthenticated) {
        return NextResponse.json(
          {
            error:
              "Re-authentication required: enter your current password or active Authenticator code to reconfigure 2FA.",
            requiresReauth: true,
          },
          { status: 403 }
        );
      }
    }

    // Generate pending secret without overwriting active DB secret until verified in /api/auth/2fa/enable
    const secret = generateBase32Secret(20);
    const formattedSecret = formatSecretForDisplay(secret);
    const otpauthUrl = generateOTPAuthUrl(user.email, secret);
    const qrSvg = generateQRCodeSVG(otpauthUrl);

    const pendingToken = await signScopedToken(
      { userId: user.id, secret },
      "pending_2fa_setup",
      10 * 60 * 1000
    );

    const cookieStore = await cookies();
    cookieStore.set(
      TWO_FA_PENDING_COOKIE_NAME,
      pendingToken,
      getAuthCookieFlags(new Date(Date.now() + 10 * 60 * 1000))
    );

    await logAudit({
      actorId: user.id,
      action: "USER_2FA_SETUP_INITIATED",
      entity: "user",
      entityId: user.id,
      req,
      details: { reconfiguration: dbUser.twoFactorEnabled },
    });

    return NextResponse.json(
      {
        secret,
        formattedSecret,
        otpauthUrl,
        qrSvg,
        issuer: "Mindoro State University",
        accountName: user.email,
      },
      {
        headers: { "Cache-Control": "no-store, private" },
      }
    );
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Microsoft Authenticator setup." },
      { status: 500 }
    );
  }
}
