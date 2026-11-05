import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  isValidGWA,
  isValidIncome,
  isValidPhilippineMobile,
  isValidStudentId,
  normalizePhilippineMobile,
} from "@/lib/validation";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    const batch = searchParams.get("batch");

    const whereClause: any = {};
    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    }
    if (callId) {
      whereClause.callId = callId;
    }
    if (batch && batch !== "ALL") {
      const parsedBatch = parseInt(batch, 10);
      if (!isNaN(parsedBatch)) {
        whereClause.batchNumber = parsedBatch;
      }
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

    // Verify call exists
    const targetCall = await prisma.applicantCall.findUnique({
      where: { id: callId },
    });

    if (!targetCall || !targetCall.isActive) {
      return NextResponse.json(
        { error: "This applicant call is closed or does not exist." },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(targetCall.startDate);
    const deadline = new Date(targetCall.deadline);

    // Enforce time window
    if (now < startDate) {
      return NextResponse.json(
        {
          error: `The application window for Batch ${targetCall.batchNumber} has not opened yet. It opens on ${startDate.toLocaleDateString()}.`,
        },
        { status: 400 }
      );
    }

    if (now > deadline) {
      return NextResponse.json(
        {
          error: `The application deadline for Batch ${targetCall.batchNumber} has passed (${deadline.toLocaleDateString()}).`,
        },
        { status: 400 }
      );
    }

    // Eligibility check: If already accepted in another batch this academic term, disallow new application
    const alreadyAccepted = await prisma.application.findFirst({
      where: {
        studentId: user.id,
        status: "ACCEPTED",
      },
      include: { call: true },
    });

    if (alreadyAccepted) {
      return NextResponse.json(
        {
          error: `You are already an accepted TDP grantee under Batch ${alreadyAccepted.batchNumber} (Ref: ${alreadyAccepted.trackingCode}). Re-application for another batch is not permitted for this academic term.`,
        },
        { status: 409 }
      );
    }

    // Check if student already submitted to this call
    const existing = await prisma.application.findFirst({
      where: { callId, studentId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `You have already submitted an application for Batch ${targetCall.batchNumber} (Ref: ${existing.trackingCode}).`,
        },
        { status: 409 }
      );
    }

    // Security & Anti-Impersonation Check: Validate Student ID ownership
    const studentIdNumber = (formData?.student_id_number || "").trim().toUpperCase();
    if (!studentIdNumber || !isValidStudentId(studentIdNumber)) {
      return NextResponse.json(
        { error: "A valid MinSU Student ID number is required (e.g. 2024-00123-BC)." },
        { status: 400 }
      );
    }

    // Ensure student cannot use another student's registered Student ID
    const studentReg = await prisma.application.findFirst({
      where: { studentId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    if (studentReg) {
      const regData = (studentReg.formData as any) || {};
      if (regData.student_id && studentIdNumber !== String(regData.student_id).trim().toUpperCase()) {
        return NextResponse.json(
          {
            error: `Identity mismatch: The submitted Student ID (${studentIdNumber}) does not match your registered Student ID (${regData.student_id}). You cannot submit under another student's profile.`,
          },
          { status: 403 }
        );
      }
    } else {
      const otherClaimed = await prisma.application.findFirst({
        where: {
          formData: { path: ["student_id"], equals: studentIdNumber },
          NOT: { studentId: user.id },
        },
      });
      if (otherClaimed) {
        return NextResponse.json(
          { error: `The Student ID "${studentIdNumber}" is already registered to another account.` },
          { status: 403 }
        );
      }
    }

    // Validate Dual-Scale GWA (1.00 <= GWA <= 3.00 OR 75 <= GWA <= 100)
    const gwaCheck = isValidGWA(formData?.latest_gwa);
    if (!gwaCheck.valid) {
      return NextResponse.json(
        { error: gwaCheck.message || "Invalid GWA." },
        { status: 400 }
      );
    }

    // Validate Positive Family Income (> 0)
    const incomeCheck = isValidIncome(formData?.family_monthly_income);
    if (!incomeCheck.valid) {
      return NextResponse.json(
        { error: incomeCheck.message || "Monthly family gross income must be greater than 0." },
        { status: 400 }
      );
    }

    // Validate Philippine Contact Number
    if (formData?.contact_number && !isValidPhilippineMobile(formData.contact_number)) {
      return NextResponse.json(
        { error: "Contact number must be a valid 11-digit Philippine mobile number (09XXXXXXXXX)." },
        { status: 400 }
      );
    }

    const sanitizedFormData = {
      ...formData,
      student_id_number: studentIdNumber,
      contact_number: formData?.contact_number ? normalizePhilippineMobile(formData.contact_number) : "",
      latest_gwa: gwaCheck.normalized,
      family_monthly_income: incomeCheck.value,
    };

    // Generate unique batch-coded tracking code e.g. MINSU-TDP-2026-B1-A1B2C
    const trackingCode = `MINSU-TDP-${now.getFullYear()}-B${targetCall.batchNumber}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const application = await prisma.application.create({
      data: {
        callId,
        studentId: user.id,
        batchNumber: targetCall.batchNumber,
        formData: sanitizedFormData,
        trackingCode,
      },
      include: { call: true },
    });

    await logAudit({
      actorId: user.id,
      action: "APPLICATION_SUBMITTED",
      entity: "application",
      entityId: application.id,
      details: {
        trackingCode,
        callId,
        batchNumber: targetCall.batchNumber,
      },
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
