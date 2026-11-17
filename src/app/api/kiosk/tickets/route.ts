import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ensureQueueBootstrap, issueWalkInTicket } from "@/lib/queue";
import { isValidPersonName, isValidStudentId, sanitizeText } from "@/lib/validation";
import { generateQRCodeSVG } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const config = await ensureQueueBootstrap();
    const clientIp = getClientIp(req);

    // Kiosk-aware rate limiter: generous for shared lobby terminals when bypass is enabled
    const limit = config.rateLimitBypassEnabled ? 180 : 30;
    const rateCheck = checkRateLimit(`kiosk_ticket:${clientIp}`, {
      limit,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Too many queue tickets issued from this terminal. Please ask TDP staff for assistance.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const serviceId = sanitizeText(String(body.serviceId || ""), 64);
    if (!serviceId) {
      return NextResponse.json(
        { error: "Please select a service category." },
        { status: 400 }
      );
    }

    const campus = body.campus ? sanitizeText(String(body.campus), 80) : null;
    const priority = body.priority === "PRIORITY" ? "PRIORITY" : "REGULAR";
    const priorityReason = body.priorityReason
      ? sanitizeText(String(body.priorityReason), 60)
      : null;

    const rawVisitorName = body.visitorName
      ? sanitizeText(String(body.visitorName), 80)
      : "";
    if (rawVisitorName && !isValidPersonName(rawVisitorName)) {
      return NextResponse.json(
        { error: "Name must contain valid letters and punctuation only." },
        { status: 400 }
      );
    }

    const rawStudentId = body.studentIdNo
      ? sanitizeText(String(body.studentIdNo), 25).toUpperCase()
      : "";
    if (rawStudentId && !isValidStudentId(rawStudentId)) {
      return NextResponse.json(
        {
          error:
            "Student ID must be 6 to 25 alphanumeric characters (e.g., 2024-00123-BC).",
        },
        { status: 400 }
      );
    }

    const trackingCodeRef = body.trackingCodeRef
      ? sanitizeText(String(body.trackingCodeRef), 40).toUpperCase()
      : null;

    const issued = await issueWalkInTicket({
      campus,
      serviceId,
      priority,
      priorityReason,
      visitorName: rawVisitorName || null,
      studentIdNo: rawStudentId || null,
      trackingCodeRef,
    });

    const origin = req.nextUrl.origin;
    const qrPath = `/kiosk/ticket/${issued.publicLookupToken}`;
    const qrFullUrl = `${origin}${qrPath}`;
    const qrSvg = generateQRCodeSVG(qrFullUrl, {
      size: 168,
      color: "#123F17",
      bgColor: "#FFFFFF",
      quietZone: 3,
    });

    return NextResponse.json(
      {
        ...issued,
        qrTrackerUrl: qrPath,
        qrSvg,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SERVICE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Selected queue service is currently unavailable." },
          { status: 404 }
        );
      }
      if (error.message === "SERVICE_CAMPUS_MISMATCH") {
        return NextResponse.json(
          { error: "Selected service is not offered at this campus." },
          { status: 400 }
        );
      }
    }
    console.error("Issue kiosk ticket error:", error);
    return NextResponse.json(
      { error: "Failed to issue walk-in queue ticket." },
      { status: 500 }
    );
  }
}

