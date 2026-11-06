import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  generateBase32Secret,
  formatSecretForDisplay,
  generateOTPAuthUrl,
} from "@/lib/totp";
import { generateQRCodeSVG } from "@/lib/qr";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate new secret for user
    const secret = generateBase32Secret(20);
    const formattedSecret = formatSecretForDisplay(secret);
    const otpauthUrl = generateOTPAuthUrl(user.email, secret);
    const qrSvg = generateQRCodeSVG(otpauthUrl);

    // Save temporary unconfirmed secret to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
      },
    });

    return NextResponse.json({
      secret,
      formattedSecret,
      otpauthUrl,
      qrSvg,
      issuer: "Mindoro State University",
      accountName: user.email,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Microsoft Authenticator setup." },
      { status: 500 }
    );
  }
}

