import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`kiosk_track:${clientIp}`, {
      limit: 20,
      windowMs: 60000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many tracking requests. Please wait a minute." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = sanitizeText(searchParams.get("code") || "", 50).toUpperCase();

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid application tracking code." },
        { status: 400 }
      );
    }

    // RA 10173 Privacy: Select ONLY non-PII workflow status fields (no name, email, address, income, or ID)
    const application = await prisma.application.findUnique({
      where: { trackingCode: code },
      select: {
        trackingCode: true,
        status: true,
        batchNumber: true,
        submittedAt: true,
        reviewedAt: true,
        call: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          error:
            "No application found with that tracking code. Double-check the code or proceed to the TDP Assistance counter.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      application: {
        trackingCode: application.trackingCode,
        status: application.status,
        batchNumber: application.batchNumber,
        callTitle: application.call?.title ?? "TDP Application",
        submittedAt: application.submittedAt.toISOString(),
        reviewedAt: application.reviewedAt
          ? application.reviewedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Kiosk tracking lookup error:", error);
    return NextResponse.json(
      { error: "Failed to check application status" },
      { status: 500 }
    );
  }
}

