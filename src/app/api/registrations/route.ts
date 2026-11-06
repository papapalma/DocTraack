import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role, ApplicationStatus } from "@prisma/client";
import {
  isValidEmail,
  validatePassword,
  sanitizeText,
  isValidPhilippineMobile,
  normalizePhilippineMobile,
  isValidStudentId,
  isMinimumAge,
  isValidPersonName,
  isValidGWA,
  isValidIncome,
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
    const statusFilter = searchParams.get("status") as ApplicationStatus | null;
    const batchFilter = searchParams.get("batch");

    // Students only see their own application
    if (user.role === Role.STUDENT) {
      const applications = await prisma.application.findMany({
        where: { studentId: user.id },
        include: {
          call: true,
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      });

      const application = applications[0] || null;
      const isLockedStudentId = applications.some(
        (app) => app.status === ApplicationStatus.ACCEPTED
      );

      // Extract harmonized profile data
      const d = (application?.formData as any) || {};

      let givenName = d.given_name || "";
      let lastName = d.last_name || "";
      let middleName = d.middle_name || "";
      let extName = d.ext_name || "";

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

      const harmonizedProfile = {
        student_id: d.student_id || d.student_id_number || "",
        student_id_number: d.student_id_number || d.student_id || "",
        given_name: givenName,
        middle_name: middleName,
        last_name: lastName,
        ext_name: extName,
        gender: d.gender || "M",
        birthdate: d.birthdate || "",
        course_degree: d.course_degree || d.program_course || "",
        program_course: d.program_course || d.course_degree || "",
        year_level: d.year_level || "1",
        hei_uii: d.hei_uii || "4060",
        hei_name: d.hei_name || "Mindoro State University",
        hei_campus: d.hei_campus || d.campus || "Main Campus (Alcate)",
        campus: d.campus || d.hei_campus || "Main Campus (Alcate)",
        street_barangay: d.street_barangay || "",
        town_city: d.town_city || "",
        province: d.province || "Oriental Mindoro",
        zipcode: d.zipcode || "5200",
        contact_number: d.contact_number || "",
        email: user.email,
        name: user.name,
        // Parents
        father_last_name: d.father_last_name || "",
        father_given_name: d.father_given_name || "",
        father_middle_name: d.father_middle_name || "",
        father_contact_number: d.father_contact_number || "",
        father_email: d.father_email || "",
        mother_last_name: d.mother_last_name || "",
        mother_given_name: d.mother_given_name || "",
        mother_middle_name: d.mother_middle_name || "",
        mother_contact_number: d.mother_contact_number || "",
        mother_email: d.mother_email || "",
        // Financials & Academics
        family_monthly_income: d.family_monthly_income || "",
        latest_gwa: d.latest_gwa || "",
      };

      return NextResponse.json({
        application,
        profile: harmonizedProfile,
        isLockedStudentId,
        allApplications: applications,
      });
    }

    // Staff and Director can view the validation queue
    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: any = {};
    if (statusFilter && Object.values(ApplicationStatus).includes(statusFilter)) {
      whereClause.status = statusFilter;
    }
    if (batchFilter && batchFilter !== "ALL") {
      const parsed = parseInt(batchFilter, 10);
      if (!isNaN(parsed)) {
        whereClause.batchNumber = parsed;
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
    console.error("Fetch registrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      // Identification & Name
      student_id,
      last_name,
      given_name,
      ext_name,
      middle_name,
      // Profile
      gender,
      birthdate,
      course_degree,
      year_level,
      // Address
      street_barangay,
      town_city,
      province,
      zipcode,
      // Contact
      contact_number,
      // HEI
      hei_uii,
      hei_name,
      hei_campus,
      // Parents
      father_last_name,
      father_given_name,
      father_middle_name,
      father_contact_number,
      father_email,
      mother_last_name,
      mother_given_name,
      mother_middle_name,
      mother_contact_number,
      mother_email,
      parent_contact_number,
      parent_email,
    } = body;

    // Validate account credentials
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return NextResponse.json(
        { error: passCheck.message || "Password must be at least 8 characters with letters & numbers" },
        { status: 400 }
      );
    }

    // Validate required Annex 1 fields
    if (!student_id || !last_name || !given_name) {
      return NextResponse.json(
        { error: "Student ID, Last Name, and Given Name are required." },
        { status: 400 }
      );
    }

    const cleanStudentId = sanitizeText(student_id, 30).trim().toUpperCase();
    if (!isValidStudentId(cleanStudentId)) {
      return NextResponse.json(
        { error: "Invalid Student ID format. MinSU IDs must be 6-25 alphanumeric characters with hyphens (e.g., 2024-00123-BC)." },
        { status: 400 }
      );
    }

    // Security & Anti-Impersonation: Ensure Student ID is not already claimed
    const existingWithStudentId = await prisma.application.findFirst({
      where: {
        OR: [
          {
            formData: {
              path: ["student_id"],
              equals: cleanStudentId,
            },
          },
          {
            formData: {
              path: ["student_id_number"],
              equals: cleanStudentId,
            },
          },
        ],
      },
    });
    if (existingWithStudentId) {
      return NextResponse.json(
        {
          error: `The Student ID "${cleanStudentId}" is already registered to an existing account. Please sign in or contact the TDP Coordinator if you believe this is an error.`,
        },
        { status: 409 }
      );
    }

    // Validate person names
    if (!isValidPersonName(given_name) || !isValidPersonName(last_name)) {
      return NextResponse.json(
        { error: "Given Name and Last Name must contain only valid name characters (letters, hyphens, spaces)." },
        { status: 400 }
      );
    }

    // Validate birthdate & age >= 15
    const ageCheck = isMinimumAge(birthdate, 15);
    if (!ageCheck.valid) {
      return NextResponse.json(
        { error: ageCheck.message || "Applicant must be at least 15 years old." },
        { status: 400 }
      );
    }

    // Validate Philippine mobile number
    if (contact_number && !isValidPhilippineMobile(contact_number)) {
      return NextResponse.json(
        { error: "Contact number must be a valid 11-digit Philippine mobile number (e.g., 09171234567 or +639171234567)." },
        { status: 400 }
      );
    }
    const normalizedContact = contact_number ? normalizePhilippineMobile(contact_number) : "";

    if (!course_degree || !year_level) {
      return NextResponse.json(
        { error: "Degree Program and Year Level are required" },
        { status: 400 }
      );
    }

    if (!street_barangay || !town_city || !province) {
      return NextResponse.json(
        { error: "Complete permanent address (Barangay, City/Town, Province) is required" },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const fullName = `${given_name.trim()} ${middle_name ? middle_name.trim() + " " : ""}${last_name.trim()}${ext_name ? " " + ext_name.trim() : ""}`;

    // 1. Create the Student User
    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // 2. Prepare standardized Annex 1 payload with harmonized dual-keys
    const annex1FormData = {
      student_id: cleanStudentId,
      student_id_number: cleanStudentId,
      last_name: sanitizeText(last_name, 60),
      given_name: sanitizeText(given_name, 60),
      ext_name: ext_name ? sanitizeText(ext_name, 20) : "",
      middle_name: middle_name ? sanitizeText(middle_name, 60) : "",
      gender: gender || "M",
      birthdate: birthdate || "",
      course_degree: sanitizeText(course_degree, 120),
      program_course: sanitizeText(course_degree, 120),
      year_level: year_level || "1",
      street_barangay: sanitizeText(street_barangay, 120),
      town_city: sanitizeText(town_city, 80),
      province: sanitizeText(province, 80),
      zipcode: zipcode ? sanitizeText(zipcode, 20) : "",
      contact_number: normalizedContact,
      email: normalizedEmail,
      hei_uii: hei_uii ? sanitizeText(hei_uii, 20) : "4060",
      hei_name: hei_name ? sanitizeText(hei_name, 120) : "Mindoro State University - Bongabong Campus",
      hei_campus: hei_campus ? sanitizeText(hei_campus, 100) : "Bongabong Campus",
      campus: hei_campus ? sanitizeText(hei_campus, 100) : "Bongabong Campus",
      father_last_name: father_last_name ? sanitizeText(father_last_name, 60) : "",
      father_given_name: father_given_name ? sanitizeText(father_given_name, 60) : "",
      father_middle_name: father_middle_name ? sanitizeText(father_middle_name, 60) : "",
      father_contact_number: father_contact_number ? sanitizeText(father_contact_number, 30) : "",
      father_email: father_email ? sanitizeText(father_email, 80) : "",
      mother_last_name: mother_last_name ? sanitizeText(mother_last_name, 60) : "",
      mother_given_name: mother_given_name ? sanitizeText(mother_given_name, 60) : "",
      mother_middle_name: mother_middle_name ? sanitizeText(mother_middle_name, 60) : "",
      mother_contact_number: mother_contact_number ? sanitizeText(mother_contact_number, 30) : "",
      mother_email: mother_email ? sanitizeText(mother_email, 80) : "",
      parent_contact_number: parent_contact_number ? sanitizeText(parent_contact_number, 30) : "",
      parent_email: parent_email ? sanitizeText(parent_email, 80) : "",
    };

    // Find active call within open time window if exists
    const now = new Date();
    const activeCall = await prisma.applicantCall.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        deadline: { gte: now },
      },
      orderBy: { batchNumber: "asc" },
    });

    const assignedBatch = activeCall ? activeCall.batchNumber : 1;

    // Generate unique batch-prefixed tracking code
    const trackingCode = `MINSU-TDP-${now.getFullYear()}-B${assignedBatch}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    // 3. Create the Application record
    const application = await prisma.application.create({
      data: {
        studentId: newUser.id,
        callId: activeCall ? activeCall.id : null,
        batchNumber: assignedBatch,
        formData: annex1FormData,
        trackingCode,
        status: ApplicationStatus.SUBMITTED, // Pending Validation
      },
      include: {
        call: true,
      },
    });

    // 4. Create initial notification for student
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: "Annex 1 Registration Received",
        message: `Your TDP Annex 1 student registration (Ref: ${trackingCode}) was successfully submitted and is currently queued for Staff verification.`,
        link: "/portal",
      },
    });

    // 5. Audit Log
    await logAudit({
      actorId: newUser.id,
      action: "STUDENT_ANNEX1_REGISTER",
      entity: "application",
      entityId: application.id,
      details: { trackingCode, studentId: newUser.id },
    });

    // 6. Automatically sign the user in with a session
    await createSession(newUser.id);

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Continuous registration error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration. Please check your inputs and try again." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STUDENT) {
      return NextResponse.json(
        { error: "Forbidden: Only students can update their profile data" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      student_id,
      student_id_number,
      given_name,
      last_name,
      middle_name,
      ext_name,
      gender,
      birthdate,
      campus,
      hei_campus,
      course_degree,
      program_course,
      year_level,
      street_barangay,
      town_city,
      province,
      zipcode,
      contact_number,
      father_last_name,
      father_given_name,
      father_middle_name,
      father_contact_number,
      father_email,
      mother_last_name,
      mother_given_name,
      mother_middle_name,
      mother_contact_number,
      mother_email,
      family_monthly_income,
      latest_gwa,
    } = body;

    // Check if any application for this student is already ACCEPTED
    const acceptedApp = await prisma.application.findFirst({
      where: {
        studentId: user.id,
        status: ApplicationStatus.ACCEPTED,
      },
    });
    const isLockedStudentId = !!acceptedApp;

    // Retrieve the student's latest application (if any)
    const latestApp = await prisma.application.findFirst({
      where: { studentId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    const prevFormData = (latestApp?.formData as any) || {};
    const existingStudentId = (
      prevFormData.student_id ||
      prevFormData.student_id_number ||
      ""
    )
      .trim()
      .toUpperCase();

    // Determine target Student ID
    let finalStudentId = existingStudentId;
    const incomingRawId = student_id || student_id_number;
    if (incomingRawId) {
      const incomingId = sanitizeText(incomingRawId, 30).trim().toUpperCase();
      if (isLockedStudentId && existingStudentId && incomingId !== existingStudentId) {
        return NextResponse.json(
          {
            error:
              "Your Student ID number is locked because your Annex 1 grant registration has already been validated and accepted by Staff. Contact the TDP Office if a correction is needed.",
          },
          { status: 403 }
        );
      }

      if (!isValidStudentId(incomingId)) {
        return NextResponse.json(
          {
            error:
              "Invalid Student ID format. MinSU IDs must be 6-25 alphanumeric characters with hyphens (e.g. 2024-00123-BC).",
          },
          { status: 400 }
        );
      }

      // Check anti-impersonation collision against other users
      const otherClaimed = await prisma.application.findFirst({
        where: {
          NOT: { studentId: user.id },
          OR: [
            { formData: { path: ["student_id"], equals: incomingId } },
            { formData: { path: ["student_id_number"], equals: incomingId } },
          ],
        },
      });

      if (otherClaimed) {
        return NextResponse.json(
          { error: `The Student ID "${incomingId}" is already registered to another account.` },
          { status: 409 }
        );
      }

      finalStudentId = incomingId;
    }

    // Name validation
    if (given_name && !isValidPersonName(given_name)) {
      return NextResponse.json(
        { error: "Given name contains invalid characters." },
        { status: 400 }
      );
    }
    if (last_name && !isValidPersonName(last_name)) {
      return NextResponse.json(
        { error: "Last name contains invalid characters." },
        { status: 400 }
      );
    }

    // Contact number validation
    let normalizedContact = prevFormData.contact_number || "";
    if (contact_number !== undefined && contact_number !== "") {
      if (!isValidPhilippineMobile(contact_number)) {
        return NextResponse.json(
          {
            error:
              "Contact number must be a valid 11-digit Philippine mobile number (09XXXXXXXXX).",
          },
          { status: 400 }
        );
      }
      normalizedContact = normalizePhilippineMobile(contact_number);
    }

    // GWA validation
    let finalGwa = prevFormData.latest_gwa || "";
    if (latest_gwa !== undefined && latest_gwa !== "") {
      const gwaCheck = isValidGWA(latest_gwa);
      if (!gwaCheck.valid) {
        return NextResponse.json(
          { error: gwaCheck.message || "Invalid GWA scale." },
          { status: 400 }
        );
      }
      finalGwa = gwaCheck.normalized;
    }

    // Family income validation
    let finalIncome = prevFormData.family_monthly_income || "";
    if (family_monthly_income !== undefined && family_monthly_income !== "") {
      const incCheck = isValidIncome(family_monthly_income);
      if (!incCheck.valid) {
        return NextResponse.json(
          {
            error:
              incCheck.message || "Monthly family gross income must be greater than 0.",
          },
          { status: 400 }
        );
      }
      finalIncome = incCheck.value;
    }

    // Clean & harmonized campus & course
    const rawCampus =
      campus ||
      hei_campus ||
      prevFormData.campus ||
      prevFormData.hei_campus ||
      "Main Campus (Alcate)";
    const finalCampus = sanitizeText(rawCampus, 100);
    const rawCourse =
      course_degree ||
      program_course ||
      prevFormData.course_degree ||
      prevFormData.program_course ||
      "";
    const finalCourse = sanitizeText(rawCourse, 120);

    const cleanGiven =
      given_name !== undefined
        ? sanitizeText(given_name, 60)
        : prevFormData.given_name || "";
    const cleanLast =
      last_name !== undefined
        ? sanitizeText(last_name, 60)
        : prevFormData.last_name || "";
    const cleanMiddle =
      middle_name !== undefined
        ? sanitizeText(middle_name, 60)
        : prevFormData.middle_name || "";
    const cleanExt =
      ext_name !== undefined
        ? sanitizeText(ext_name, 20)
        : prevFormData.ext_name || "";

    // Update User.name if name fields provided
    const newFullName = `${cleanGiven} ${cleanMiddle ? cleanMiddle + " " : ""}${cleanLast}${cleanExt ? " " + cleanExt : ""}`.trim();
    if (newFullName && newFullName.length >= 2) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: newFullName },
      });
    }

    const updatedFormData = {
      ...prevFormData,
      student_id: finalStudentId,
      student_id_number: finalStudentId,
      given_name: cleanGiven,
      last_name: cleanLast,
      middle_name: cleanMiddle,
      ext_name: cleanExt,
      gender: gender || prevFormData.gender || "M",
      birthdate: birthdate !== undefined ? birthdate : prevFormData.birthdate || "",
      course_degree: finalCourse,
      program_course: finalCourse,
      year_level: year_level || prevFormData.year_level || "1",
      campus: finalCampus,
      hei_campus: finalCampus,
      hei_name: prevFormData.hei_name || "Mindoro State University",
      hei_uii: prevFormData.hei_uii || "4060",
      street_barangay:
        street_barangay !== undefined
          ? sanitizeText(street_barangay, 120)
          : prevFormData.street_barangay || "",
      town_city:
        town_city !== undefined
          ? sanitizeText(town_city, 80)
          : prevFormData.town_city || "",
      province:
        province !== undefined
          ? sanitizeText(province, 80)
          : prevFormData.province || "Oriental Mindoro",
      zipcode:
        zipcode !== undefined
          ? sanitizeText(zipcode, 20)
          : prevFormData.zipcode || "5200",
      contact_number: normalizedContact,
      email: user.email,
      father_last_name:
        father_last_name !== undefined
          ? sanitizeText(father_last_name, 60)
          : prevFormData.father_last_name || "",
      father_given_name:
        father_given_name !== undefined
          ? sanitizeText(father_given_name, 60)
          : prevFormData.father_given_name || "",
      father_middle_name:
        father_middle_name !== undefined
          ? sanitizeText(father_middle_name, 60)
          : prevFormData.father_middle_name || "",
      father_contact_number:
        father_contact_number !== undefined
          ? sanitizeText(father_contact_number, 30)
          : prevFormData.father_contact_number || "",
      father_email:
        father_email !== undefined
          ? sanitizeText(father_email, 80)
          : prevFormData.father_email || "",
      mother_last_name:
        mother_last_name !== undefined
          ? sanitizeText(mother_last_name, 60)
          : prevFormData.mother_last_name || "",
      mother_given_name:
        mother_given_name !== undefined
          ? sanitizeText(mother_given_name, 60)
          : prevFormData.mother_given_name || "",
      mother_middle_name:
        mother_middle_name !== undefined
          ? sanitizeText(mother_middle_name, 60)
          : prevFormData.mother_middle_name || "",
      mother_contact_number:
        mother_contact_number !== undefined
          ? sanitizeText(mother_contact_number, 30)
          : prevFormData.mother_contact_number || "",
      mother_email:
        mother_email !== undefined
          ? sanitizeText(mother_email, 80)
          : prevFormData.mother_email || "",
      family_monthly_income: finalIncome,
      latest_gwa: finalGwa,
    };

    let targetApplicationId = latestApp?.id;
    if (latestApp) {
      await prisma.application.update({
        where: { id: latestApp.id },
        data: { formData: updatedFormData },
      });
    } else {
      // If student never had an application, create a base registration record
      const now = new Date();
      const trackingCode = `MINSU-TDP-${now.getFullYear()}-B1-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const newApp = await prisma.application.create({
        data: {
          studentId: user.id,
          batchNumber: 1,
          formData: updatedFormData,
          trackingCode,
          status: ApplicationStatus.SUBMITTED,
        },
      });
      targetApplicationId = newApp.id;
    }

    await logAudit({
      actorId: user.id,
      action: "STUDENT_PROFILE_UPDATED",
      entity: "application",
      entityId: targetApplicationId || user.id,
      details: {
        studentId: finalStudentId,
        updatedFields: Object.keys(body),
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedFormData,
      isLockedStudentId,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile details. Please check your inputs and try again." },
      { status: 500 }
    );
  }
}
