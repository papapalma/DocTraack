import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { verifyTOTP, generateRecoveryCodes } from "@/lib/totp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`2fa-enable:${clientIp}`, { limit: 10, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, userId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "A 6-digit verification code is required." },
        { status: 400 }
      );
    }

    // Determine target user (either specified by userId or from current session)
    let targetUserId = userId;
    if (!targetUserId) {
      const sessionUser = await getCurrentUser();
      targetUserId = sessionUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User session not found. Please log in or register." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "User not found or account disabled." },
        { status: 404 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "No Microsoft Authenticator configuration found. Please start setup again." },
        { status: 400 }
      );
    }

    // Verify 6-digit TOTP code
    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired 6-digit code. Please enter the current code shown in Microsoft Authenticator." },
        { status: 400 }
      );
    }

    // Generate 8 emergency backup recovery codes
    const { plainCodes, hashedCodes } = await generateRecoveryCodes(8);

    // Update user state to enabled and locked
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        authenticatorLocked: true,
        twoFactorRecoveryCodes: hashedCodes,
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

    // Create full authenticated session cookie
    await createSession(updatedUser.id);

    // Audit Log
    await logAudit({
      actorId: updatedUser.id,
      action: "USER_2FA_ENABLED",
      entity: "user",
      entityId: updatedUser.id,
      details: { email: updatedUser.email, twoFactorType: "MICROSOFT_AUTHENTICATOR" },
    });

    return NextResponse.json({
      success: true,
      message: "Microsoft Authenticator successfully linked and locked.",
      recoveryCodes: plainCodes,
      user: updatedUser,
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while enabling Microsoft Authenticator." },
      { status: 500 }
    );
  }
}

