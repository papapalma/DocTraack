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
    const studentIdNumber = (formData?.student_id_number || formData?.student_id || "").trim().toUpperCase();
    if (!studentIdNumber || !isValidStudentId(studentIdNumber)) {
      return NextResponse.json(
        { error: "A valid MinSU Student ID number is required (e.g. 2024-00123-BC)." },
        { status: 400 }
      );
    }

    // Ensure student cannot use another student's registered Student ID
    const studentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { studentProfile: true, name: true, email: true },
    });

    const studentReg = await prisma.application.findFirst({
      where: { studentId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    const userProfile = (studentUser?.studentProfile as Record<string, any>) || {};
    const previousAppData = (studentReg?.formData as Record<string, any>) || {};

    // Harmonize persistent registration profile with any previous application
    const regData: Record<string, any> = {
      ...userProfile,
      ...previousAppData,
    };

    const registeredStudentId = (regData.student_id || regData.student_id_number || "").trim().toUpperCase();

    if (registeredStudentId) {
      if (studentIdNumber !== registeredStudentId) {
        return NextResponse.json(
          {
            error: `Identity mismatch: The submitted Student ID (${studentIdNumber}) does not match your registered Student ID (${registeredStudentId}). You cannot submit under another student's profile.`,
          },
          { status: 403 }
        );
      }
    } else {
      const otherClaimed = await prisma.application.findFirst({
        where: {
          NOT: { studentId: user.id },
          OR: [
            { formData: { path: ["student_id"], equals: studentIdNumber } },
            { formData: { path: ["student_id_number"], equals: studentIdNumber } },
          ],
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

    // Extract names, falling back to user.name if needed
    let givenName = regData.given_name || formData?.given_name || "";
    let lastName = regData.last_name || formData?.last_name || "";
    let middleName = regData.middle_name || formData?.middle_name || "";
    let extName = regData.ext_name || formData?.ext_name || "";

    if (!givenName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 1) {
        givenName = parts[0];
        lastName = parts[0];
      } else {
        lastName = parts[parts.length - 1];
        givenName = parts.slice(0, parts.length - 1).join(" ");
      }
    }

    const campusVal = formData?.campus || formData?.hei_campus || regData.campus || regData.hei_campus || "Main Campus (Alcate)";
    const courseVal = formData?.program_course || formData?.course_degree || regData.program_course || regData.course_degree || "";
    const yearLevelVal = formData?.year_level || regData.year_level || "1st Year";

    const sanitizedFormData = {
      ...regData,
      ...formData,
      student_id: studentIdNumber,
      student_id_number: studentIdNumber,
      given_name: givenName,
      last_name: lastName,
      middle_name: middleName,
      ext_name: extName,
      gender: formData?.gender || regData.gender || "M",
      birthdate: formData?.birthdate || regData.birthdate || "",
      street_barangay: formData?.street_barangay || regData.street_barangay || "",
      town_city: formData?.town_city || regData.town_city || "",
      province: formData?.province || regData.province || "Oriental Mindoro",
      zipcode: formData?.zipcode || regData.zipcode || "5200",
      campus: campusVal,
      hei_campus: campusVal,
      hei_uii: formData?.hei_uii || regData.hei_uii || "4060",
      hei_name: formData?.hei_name || regData.hei_name || "Mindoro State University",
      program_course: courseVal,
      course_degree: courseVal,
      year_level: yearLevelVal,
      contact_number: formData?.contact_number
        ? normalizePhilippineMobile(formData.contact_number)
        : regData.contact_number || "",
      latest_gwa: gwaCheck.normalized,
      family_monthly_income: incomeCheck.value,
      email: user.email,
      father_last_name: formData?.father_last_name || regData.father_last_name || "",
      father_given_name: formData?.father_given_name || regData.father_given_name || "",
      father_middle_name: formData?.father_middle_name || regData.father_middle_name || "",
      father_contact_number: formData?.father_contact_number || regData.father_contact_number || regData.parent_contact_number || "",
      father_email: formData?.father_email || regData.father_email || regData.parent_email || "",
      mother_last_name: formData?.mother_last_name || regData.mother_last_name || "",
      mother_given_name: formData?.mother_given_name || regData.mother_given_name || "",
      mother_middle_name: formData?.mother_middle_name || regData.mother_middle_name || "",
      mother_contact_number: formData?.mother_contact_number || regData.mother_contact_number || "",
      mother_email: formData?.mother_email || regData.mother_email || "",
      parent_contact_number: formData?.parent_contact_number || regData.parent_contact_number || formData?.father_contact_number || regData.father_contact_number || "",
      parent_email: formData?.parent_email || regData.parent_email || formData?.father_email || regData.father_email || "",
    };

    // Generate unique batch-coded tracking code e.g. MINSU-TDP-2026-B1-A1B2C
    const trackingCode = `MINSU-TDP-${now.getFullYear()}-B${targetCall.batchNumber}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const [application] = await prisma.$transaction([
      prisma.application.create({
        data: {
          callId,
          studentId: user.id,
          batchNumber: targetCall.batchNumber,
          formData: sanitizedFormData,
          trackingCode,
        },
        include: { call: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          studentProfile: sanitizedFormData,
        },
      }),
    ]);

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
