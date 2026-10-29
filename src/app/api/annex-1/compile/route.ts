import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role, DocumentStatus, ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff can compile Annex 1 documents" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { applicationIds, targetAgency, academicYear, remarks } = body;

    // Find Annex 1 type
    const annex1Type = await prisma.annexType.findFirst({
      where: { number: 1 },
    });

    if (!annex1Type) {
      return NextResponse.json(
        { error: "Annex Type 1 (Submission to Agency) definition not found." },
        { status: 500 }
      );
    }

    // Query accepted applications
    const whereClause: any = {
      status: ApplicationStatus.ACCEPTED,
    };
    if (Array.isArray(applicationIds) && applicationIds.length > 0) {
      whereClause.id = { in: applicationIds };
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: "asc" },
    });

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "No accepted student registrations available to compile into Annex 1." },
        { status: 400 }
      );
    }

    // Format students with 1-indexed SEQ
    const formattedStudents = applications.map((app, index) => {
      const data = (app.formData as any) || {};
      return {
        seq: index + 1,
        applicationId: app.id,
        student_id: data.student_id || app.student.id,
        last_name: data.last_name || "",
        given_name: data.given_name || "",
        ext_name: data.ext_name || "",
        middle_name: data.middle_name || "",
        gender: data.gender || "M",
        birthdate: data.birthdate || "",
        course_degree: data.course_degree || "",
        year_level: data.year_level || "1",
        street_barangay: data.street_barangay || "",
        town_city: data.town_city || "",
        province: data.province || "",
        zipcode: data.zipcode || "",
        contact_number: data.contact_number || "",
        email: data.email || app.student.email,
        hei_uii: data.hei_uii || "4060",
        hei_name: data.hei_name || "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
        hei_campus: data.hei_campus || "Main Campus (Victoria / Alcate)",
        father_last_name: data.father_last_name || "",
        father_given_name: data.father_given_name || "",
        father_middle_name: data.father_middle_name || "",
        father_contact_number: data.father_contact_number || "",
        father_email: data.father_email || "",
        mother_last_name: data.mother_last_name || "",
        mother_given_name: data.mother_given_name || "",
        mother_middle_name: data.mother_middle_name || "",
        mother_contact_number: data.mother_contact_number || "",
        mother_email: data.mother_email || "",
        parent_contact_number: data.parent_contact_number || "",
        parent_email: data.parent_email || "",
      };
    });

    const now = new Date();
    const docTitle = `Annex 1: Masterlist of TDP Grantees - ${academicYear || `A.Y. ${now.getFullYear()}-${now.getFullYear() + 1}`} (${formattedStudents.length} Students)`;

    const docFormData = {
      target_agency: targetAgency || "Commission on Higher Education (CHED) / UniFAST",
      academic_year: academicYear || `A.Y. ${now.getFullYear()}-${now.getFullYear() + 1}`,
      transmittal_number: `MINSU-ANNEX1-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      submission_date: now.toISOString().split("T")[0],
      total_grantees: formattedStudents.length,
      remarks: remarks || "Officially validated TDP grantees ready for executive confirmation and transmittal.",
      students: formattedStudents,
    };

    // Create the Annex 1 Document
    const document = await prisma.document.create({
      data: {
        annexTypeId: annex1Type.id,
        title: docTitle,
        status: DocumentStatus.SUBMITTED, // Automatically in Director's Review Queue
        formData: docFormData,
        createdById: user.id,
      },
    });

    // Link applications to this Annex 1 document
    await prisma.application.updateMany({
      where: {
        id: { in: applications.map((a) => a.id) },
      },
      data: {
        annex1DocumentId: document.id,
      },
    });

    // Record Status History
    await prisma.statusHistory.create({
      data: {
        documentId: document.id,
        fromStatus: DocumentStatus.DRAFT,
        toStatus: DocumentStatus.SUBMITTED,
        actorId: user.id,
        comment: `Staff compiled ${formattedStudents.length} validated student grantee records and submitted for Director confirmation.`,
      },
    });

    // Notify all Directors
    const directors = await prisma.user.findMany({
      where: { role: Role.DIRECTOR, active: true },
    });

    for (const director of directors) {
      await prisma.notification.create({
        data: {
          userId: director.id,
          title: "New Annex 1 Pending Confirmation",
          message: `${user.name} submitted an official Annex 1 Document with ${formattedStudents.length} validated student grantees for your review and endorsement.`,
          link: `/documents/${document.id}`,
        },
      });
    }

    // Log Audit
    await logAudit({
      actorId: user.id,
      action: "COMPILE_ANNEX1_DOCUMENT",
      entity: "document",
      entityId: document.id,
      details: {
        totalStudents: formattedStudents.length,
        title: docTitle,
      },
    });

    return NextResponse.json({
      message: "Annex 1 Document successfully compiled and submitted to Director.",
      document,
      totalGrantees: formattedStudents.length,
    });
  } catch (error) {
    console.error("Compile Annex 1 error:", error);
    return NextResponse.json(
      { error: "Failed to compile Annex 1 document" },
      { status: 500 }
    );
  }
}
