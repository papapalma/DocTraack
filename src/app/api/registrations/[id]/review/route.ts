import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { safeJsonObject, sanitizeText } from "@/lib/validation";
import { Role, ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff can validate student registrations" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const action = body.action;
    const cleanComment = typeof body.comment === "string" ? sanitizeText(body.comment, 500) : "";

    if (action !== "ACCEPT" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'ACCEPT' or 'REJECT'" },
        { status: 400 }
      );
    }

    if (action === "REJECT" && cleanComment.length === 0) {
      return NextResponse.json(
        { error: "A comment explaining why the registration was rejected is required" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const newStatus =
      action === "ACCEPT" ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED;

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: {
          status: newStatus,
          reviewComment: cleanComment || null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: application.studentId,
          title:
            action === "REJECT"
              ? "Registration Review Feedback"
              : "Registration Validated Successfully",
          message:
            action === "REJECT"
              ? `Your TDP Annex 1 registration (Ref: ${application.trackingCode}) was rejected by Staff. Reason: "${cleanComment}". Please contact the TDP Office for further instructions.`
              : `Your TDP Annex 1 student registration (Ref: ${application.trackingCode}) has been validated by Staff and added to the official Annex 1 masterlist for Director endorsement.`,
          link: "/portal",
        },
      });

      await writeAuditTx(tx, {
        actorId: user.id,
        action: action === "ACCEPT" ? "VALIDATE_STUDENT_ACCEPT" : "VALIDATE_STUDENT_REJECT",
        entity: "application",
        entityId: application.id,
        req,
        details: {
          action,
          comment: cleanComment || null,
          studentEmail: application.student.email,
          trackingCode: application.trackingCode,
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Registration marked as ${action === "ACCEPT" ? "Accepted" : "Rejected"} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Review registration error:", error);
    return NextResponse.json(
      { error: "Failed to update registration status" },
      { status: 500 }
    );
  }
}
