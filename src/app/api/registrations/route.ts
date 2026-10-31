import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role, ApplicationStatus } from "@prisma/client";
import { isValidEmail, validatePassword, sanitizeText } from "@/lib/validation";
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

    // Students only see their own application
    if (user.role === Role.STUDENT) {
      const application = await prisma.application.findFirst({
        where: { studentId: user.id },
        include: {
          call: true,
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json({ application });
    }

    // Staff and Director can view the validation queue
    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: any = {};
    if (statusFilter && Object.values(ApplicationStatus).includes(statusFilter)) {
      whereClause.status = statusFilter;
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
        { error: "Student ID, Last Name, and Given Name are required" },
        { status: 400 }
      );
    }

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

    // Check if user already exists
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

    // 2. Prepare standardized Annex 1 payload
    const annex1FormData = {
      student_id: sanitizeText(student_id, 50),
      last_name: sanitizeText(last_name, 60),
      given_name: sanitizeText(given_name, 60),
      ext_name: ext_name ? sanitizeText(ext_name, 20) : "",
      middle_name: middle_name ? sanitizeText(middle_name, 60) : "",
      gender: gender || "M",
      birthdate: birthdate || "",
      course_degree: sanitizeText(course_degree, 120),
      year_level: year_level || "1",
      street_barangay: sanitizeText(street_barangay, 120),
      town_city: sanitizeText(town_city, 80),
      province: sanitizeText(province, 80),
      zipcode: zipcode ? sanitizeText(zipcode, 20) : "",
      contact_number: contact_number ? sanitizeText(contact_number, 30) : "",
      email: normalizedEmail,
      hei_uii: hei_uii ? sanitizeText(hei_uii, 20) : "4060",
      hei_name: hei_name ? sanitizeText(hei_name, 120) : "Mindoro State University - Bongabong Campus",
      hei_campus: hei_campus ? sanitizeText(hei_campus, 100) : "Bongabong Campus",
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

    // Find active call if exists
    const activeCall = await prisma.applicantCall.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Generate unique tracking code
    const trackingCode = `MINSU-TDP-${new Date().getFullYear()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    // 3. Create the Application record
    const application = await prisma.application.create({
      data: {
        studentId: newUser.id,
        callId: activeCall ? activeCall.id : null,
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
