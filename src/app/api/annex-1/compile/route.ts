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
    const { applicationIds, batchNumber, batchNumbers, targetAgency, academicYear, remarks } = body;

    // Normalize batch selection into an array of numbers if provided
    let targetBatches: number[] = [];
    if (Array.isArray(batchNumbers) && batchNumbers.length > 0) {
      targetBatches = batchNumbers.map((b: any) => parseInt(b, 10)).filter((n: number) => !isNaN(n));
    } else if (typeof batchNumbers === "string" && batchNumbers.trim() !== "") {
      targetBatches = batchNumbers.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    } else if (batchNumber && batchNumber !== "ALL") {
      const parsed = parseInt(String(batchNumber), 10);
      if (!isNaN(parsed)) {
        targetBatches = [parsed];
      }
    }

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
    if (targetBatches.length === 1) {
      whereClause.batchNumber = targetBatches[0];
    } else if (targetBatches.length > 1) {
      whereClause.batchNumber = { in: targetBatches };
    }
    if (Array.isArray(applicationIds) && applicationIds.length > 0) {
      whereClause.id = { in: applicationIds };
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ batchNumber: "asc" }, { submittedAt: "asc" }],
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

      let lastName = data.last_name || "";
      let givenName = data.given_name || "";
      let middleName = data.middle_name || "";

      if ((!lastName || !givenName) && app.student?.name) {
        const parts = app.student.name.trim().split(/\s+/);
        if (parts.length === 1) {
          givenName = parts[0];
          lastName = parts[0];
        } else {
          lastName = parts[parts.length - 1];
          givenName = parts.slice(0, parts.length - 1).join(" ");
        }
      }

      return {
        seq: index + 1,
        applicationId: app.id,
        student_id: data.student_id || data.student_id_number || app.student.id,
        last_name: lastName,
        given_name: givenName,
        ext_name: data.ext_name || "",
        middle_name: middleName,
        gender: data.gender || "M",
        birthdate: data.birthdate || "",
        course_degree: data.course_degree || data.program_course || "",
        year_level: data.year_level || "1",
        street_barangay: data.street_barangay || "",
        town_city: data.town_city || "",
        province: data.province || "Oriental Mindoro",
        zipcode: data.zipcode || "5200",
        contact_number: data.contact_number || "",
        email: data.email || app.student.email,
        hei_uii: data.hei_uii || "4060",
        hei_name: data.hei_name || "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
        hei_campus: data.hei_campus || data.campus || "Main Campus (Victoria / Alcate)",
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
        batch_number: app.batchNumber || 1,
      };
    });

    const now = new Date();
    let batchLabel = "All Batches";
    if (targetBatches.length === 1) {
      batchLabel = `Batch ${targetBatches[0]}`;
    } else if (targetBatches.length > 1) {
      batchLabel = `Batches ${targetBatches.join(" & ")}`;
    }
    const docTitle = `Annex 1: Masterlist of TDP Grantees (${batchLabel}) - ${academicYear || `A.Y. ${now.getFullYear()}-${now.getFullYear() + 1}`} (${formattedStudents.length} Students)`;

    const docFormData = {
      target_agency: targetAgency || "Commission on Higher Education (CHED) / UniFAST",
      academic_year: academicYear || `A.Y. ${now.getFullYear()}-${now.getFullYear() + 1}`,
      batch_number: targetBatches.length > 0 ? targetBatches.join(", ") : (batchNumber || "1"),
      selected_batches: targetBatches,
      transmittal_number: `MINSU-ANNEX1-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      submission_date: now.toISOString().split("T")[0],
      total_grantees: formattedStudents.length,
      remarks: remarks || `Officially validated TDP grantees (${batchLabel}) ready for executive confirmation and transmittal.`,
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
