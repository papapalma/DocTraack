import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isMinimumAge,
  isValidGWA,
  isValidIncome,
  isValidPersonName,
  isValidPhilippineMobile,
  isValidStudentId,
  normalizePhilippineMobile,
  safeJsonObject,
  sanitizeText,
} from "@/lib/validation";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT" && user.role !== "STAFF" && user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    const batch = searchParams.get("batch");

    const whereClause: Record<string, unknown> = {};
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
      take: 200,
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

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Forbidden: Only students can submit scholarship applications" },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`apply:${user.id}:${clientIp}`, {
      limit: 15,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many application attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": Math.ceil(rl.resetMs / 1000).toString() },
        }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const callId = typeof body.callId === "string" ? body.callId.trim() : "";
    const rawFormData = body.formData;
    const formData =
      rawFormData && typeof rawFormData === "object" && !Array.isArray(rawFormData)
        ? (rawFormData as Record<string, unknown>)
        : null;

    if (!callId || !formData) {
      return NextResponse.json(
        { error: "Call ID and application form data are required" },
        { status: 400 }
      );
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
    const rawSid = formData.student_id_number ?? formData.student_id;
    const studentIdNumber = typeof rawSid === "string" ? rawSid.trim().toUpperCase() : "";
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

    const userProfile = (studentUser?.studentProfile as Record<string, unknown>) || {};
    const previousAppData = (studentReg?.formData as Record<string, unknown>) || {};

    const regData: Record<string, unknown> = {
      ...userProfile,
      ...previousAppData,
    };

    const strField = (obj: Record<string, unknown>, key: string): string =>
      typeof obj[key] === "string" ? (obj[key] as string) : "";

    const registeredStudentId = (
      strField(regData, "student_id") || strField(regData, "student_id_number")
    )
      .trim()
      .toUpperCase();

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
      const [otherAppClaimed, otherUserClaimed] = await Promise.all([
        prisma.application.findFirst({
          where: {
            NOT: { studentId: user.id },
            OR: [
              { formData: { path: ["student_id"], equals: studentIdNumber } },
              { formData: { path: ["student_id_number"], equals: studentIdNumber } },
            ],
          },
          select: { id: true },
        }),
        prisma.user.findFirst({
          where: {
            NOT: { id: user.id },
            OR: [
              { studentProfile: { path: ["student_id"], equals: studentIdNumber } },
              { studentProfile: { path: ["student_id_number"], equals: studentIdNumber } },
            ],
          },
          select: { id: true },
        }),
      ]);
      if (otherAppClaimed || otherUserClaimed) {
        return NextResponse.json(
          { error: `The Student ID "${studentIdNumber}" is already registered to another account.` },
          { status: 403 }
        );
      }
    }

    // Validate Dual-Scale GWA (1.00 <= GWA <= 3.00 OR 75 <= GWA <= 100)
    const gwaRaw = formData.latest_gwa;
    const gwaCheck = isValidGWA(typeof gwaRaw === "string" || typeof gwaRaw === "number" ? gwaRaw : "");
    if (!gwaCheck.valid) {
      return NextResponse.json(
        { error: gwaCheck.message || "Invalid GWA." },
        { status: 400 }
      );
    }

    // Validate Positive Family Income (> 0)
    const incomeRaw = formData.family_monthly_income;
    const incomeCheck = isValidIncome(typeof incomeRaw === "string" || typeof incomeRaw === "number" ? incomeRaw : "");
    if (!incomeCheck.valid) {
      return NextResponse.json(
        { error: incomeCheck.message || "Monthly family gross income must be greater than 0." },
        { status: 400 }
      );
    }

    // Validate Philippine Contact Number
    const rawContact = strField(formData, "contact_number");
    if (rawContact && !isValidPhilippineMobile(rawContact)) {
      return NextResponse.json(
        { error: "Contact number must be a valid 11-digit Philippine mobile number (09XXXXXXXXX)." },
        { status: 400 }
      );
    }

    const rawBirthdate = strField(formData, "birthdate") || strField(regData, "birthdate");
    if (rawBirthdate) {
      const ageCheck = isMinimumAge(rawBirthdate, 15);
      if (!ageCheck.valid) {
        return NextResponse.json(
          { error: ageCheck.message || "Applicant must be at least 15 years old." },
          { status: 400 }
        );
      }
    }

    // Extract names, falling back to user.name if needed
    let givenName = sanitizeText(strField(regData, "given_name") || strField(formData, "given_name"), 60);
    let lastName = sanitizeText(strField(regData, "last_name") || strField(formData, "last_name"), 60);
    const middleName = sanitizeText(strField(regData, "middle_name") || strField(formData, "middle_name"), 60);
    const extName = sanitizeText(strField(regData, "ext_name") || strField(formData, "ext_name"), 20);

    if (!givenName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 1) {
        givenName = sanitizeText(parts[0], 60);
        lastName = sanitizeText(parts[0], 60);
      } else {
        lastName = sanitizeText(parts[parts.length - 1], 60);
        givenName = sanitizeText(parts.slice(0, parts.length - 1).join(" "), 60);
      }
    }

    if ((givenName && !isValidPersonName(givenName)) || (lastName && !isValidPersonName(lastName))) {
      return NextResponse.json(
        { error: "Given Name and Last Name must contain valid name characters." },
        { status: 400 }
      );
    }

    const campusVal = sanitizeText(
      strField(formData, "campus") || strField(formData, "hei_campus") || strField(regData, "campus") || strField(regData, "hei_campus") || "Main Campus (Alcate)",
      100
    );
    const courseVal = sanitizeText(
      strField(formData, "program_course") || strField(formData, "course_degree") || strField(regData, "program_course") || strField(regData, "course_degree"),
      120
    );
    const yearLevelVal = sanitizeText(
      strField(formData, "year_level") || strField(regData, "year_level") || "1st Year",
      20
    );
    const rawGender = (strField(formData, "gender") || strField(regData, "gender") || "M").trim();
    const safeGender = ["M", "F", "Male", "Female"].includes(rawGender) ? rawGender : "M";

    const sanitizedFormData = {
      student_id: studentIdNumber,
      student_id_number: studentIdNumber,
      given_name: givenName,
      last_name: lastName,
      middle_name: middleName,
      ext_name: extName,
      gender: safeGender,
      birthdate: sanitizeText(rawBirthdate, 20),
      street_barangay: sanitizeText(strField(formData, "street_barangay") || strField(regData, "street_barangay"), 120),
      town_city: sanitizeText(strField(formData, "town_city") || strField(regData, "town_city"), 80),
      province: sanitizeText(strField(formData, "province") || strField(regData, "province") || "Oriental Mindoro", 80),
      zipcode: sanitizeText(strField(formData, "zipcode") || strField(regData, "zipcode") || "5200", 20),
      campus: campusVal,
      hei_campus: campusVal,
      hei_uii: sanitizeText(strField(formData, "hei_uii") || strField(regData, "hei_uii") || "4060", 20),
      hei_name: sanitizeText(strField(formData, "hei_name") || strField(regData, "hei_name") || "Mindoro State University", 120),
      program_course: courseVal,
      course_degree: courseVal,
      year_level: yearLevelVal,
      contact_number: rawContact
        ? normalizePhilippineMobile(rawContact)
        : sanitizeText(strField(regData, "contact_number"), 20),
      latest_gwa: gwaCheck.normalized,
      family_monthly_income: incomeCheck.value,
      email: user.email,
      father_last_name: sanitizeText(strField(formData, "father_last_name") || strField(regData, "father_last_name"), 60),
      father_given_name: sanitizeText(strField(formData, "father_given_name") || strField(regData, "father_given_name"), 60),
      father_middle_name: sanitizeText(strField(formData, "father_middle_name") || strField(regData, "father_middle_name"), 60),
      father_contact_number: sanitizeText(strField(formData, "father_contact_number") || strField(regData, "father_contact_number") || strField(regData, "parent_contact_number"), 30),
      father_email: sanitizeText(strField(formData, "father_email") || strField(regData, "father_email") || strField(regData, "parent_email"), 80),
      mother_last_name: sanitizeText(strField(formData, "mother_last_name") || strField(regData, "mother_last_name"), 60),
      mother_given_name: sanitizeText(strField(formData, "mother_given_name") || strField(regData, "mother_given_name"), 60),
      mother_middle_name: sanitizeText(strField(formData, "mother_middle_name") || strField(regData, "mother_middle_name"), 60),
      mother_contact_number: sanitizeText(strField(formData, "mother_contact_number") || strField(regData, "mother_contact_number"), 30),
      mother_email: sanitizeText(strField(formData, "mother_email") || strField(regData, "mother_email"), 80),
      parent_contact_number: sanitizeText(strField(formData, "parent_contact_number") || strField(regData, "parent_contact_number") || strField(formData, "father_contact_number") || strField(regData, "father_contact_number"), 30),
      parent_email: sanitizeText(strField(formData, "parent_email") || strField(regData, "parent_email") || strField(formData, "father_email") || strField(regData, "father_email"), 80),
    };

    // Generate unique batch-coded tracking code e.g. MINSU-TDP-2026-B1-A1B2C
    const trackingCode = `MINSU-TDP-${now.getFullYear()}-B${targetCall.batchNumber}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          callId,
          studentId: user.id,
          batchNumber: targetCall.batchNumber,
          formData: sanitizedFormData,
          trackingCode,
        },
        include: { call: true },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          studentProfile: sanitizedFormData,
        },
      });
      await writeAuditTx(tx, {
        actorId: user.id,
        action: "APPLICATION_SUBMITTED",
        entity: "application",
        entityId: created.id,
        req,
        details: {
          trackingCode,
          callId,
          batchNumber: targetCall.batchNumber,
        },
      });
      return created;
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
