import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { DocumentStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Only users with the Director role can approve documents." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const comment = body.comment?.trim() || "";

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { annexType: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status !== DocumentStatus.SUBMITTED && doc.status !== DocumentStatus.RESUBMITTED) {
      return NextResponse.json(
        { error: `Cannot approve document currently in ${doc.status} state.` },
        { status: 400 }
      );
    }

    const operations: any[] = [
      prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.APPROVED },
      }),
      prisma.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.APPROVED,
          actorId: user.id,
          comment: comment || "Approved by Director",
        },
      }),
    ];

    if (comment) {
      operations.push(
        prisma.comment.create({
          data: {
            documentId: id,
            authorId: user.id,
            body: comment,
          },
        })
      );
    }

    const results = await prisma.$transaction(operations);

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_APPROVED",
      entity: "document",
      entityId: id,
      details: { comment },
    });

    // Notify the preparer
    await createNotification({
      userId: doc.createdById,
      title: "Document Approved!",
      message: `Director ${user.name} approved Annex ${doc.annexType.number}: ${doc.title}. Ready for scan upload and transmittal.`,
      link: `/documents/${id}`,
    });

    return NextResponse.json({ document: results[0] });
  } catch (error) {
    console.error("Approve document error:", error);
    return NextResponse.json(
      { error: "Failed to approve document" },
      { status: 500 }
    );
  }
}
