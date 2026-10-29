import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    const whereClause: any = {};
    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    }
    if (callId) {
      whereClause.callId = callId;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        call: true,
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId, formData } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 });
    }

    // Verify call exists and deadline is still open
    const targetCall = await prisma.applicantCall.findUnique({
      where: { id: callId },
    });

    if (!targetCall || !targetCall.isActive) {
      return NextResponse.json(
        { error: "This applicant call is closed or does not exist." },
        { status: 400 }
      );
    }

    if (new Date(targetCall.deadline) < new Date()) {
      return NextResponse.json(
        { error: "The deadline for this TDP grant call has already passed." },
        { status: 400 }
      );
    }

    // Check if student already submitted to this call
    const existing = await prisma.application.findFirst({
      where: { callId, studentId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted an application for this call." },
        { status: 409 }
      );
    }

    // Generate unique tracking code e.g. MINSU-TDP-2026-A1B2C
    const trackingCode = `MINSU-TDP-${new Date().getFullYear()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const application = await prisma.application.create({
      data: {
        callId,
        studentId: user.id,
        formData: formData || {},
        trackingCode,
      },
      include: { call: true },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Submit application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
