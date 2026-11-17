import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { sanitizeText } from "@/lib/validation";
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

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const comment =
      typeof body?.comment === "string" ? sanitizeText(body.comment, 2000) : "";

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { annexType: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.createdById !== user.id) {
      return NextResponse.json(
        { error: "Only the preparer can submit this document for review." },
        { status: 403 }
      );
    }

    if (
      doc.status !== DocumentStatus.DRAFT &&
      doc.status !== DocumentStatus.RETURNED
    ) {
      return NextResponse.json(
        { error: `Cannot submit document currently in ${doc.status} state.` },
        { status: 400 }
      );
    }

    const newStatus =
      doc.status === DocumentStatus.RETURNED
        ? DocumentStatus.RESUBMITTED
        : DocumentStatus.SUBMITTED;

    const updatedDoc = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.document.updateMany({
        where: { id, status: doc.status },
        data: { status: newStatus },
      });

      if (transitioned.count === 0) {
        return null;
      }

      const fresh = await tx.document.findUnique({ where: { id } });

      await tx.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: newStatus,
          actorId: user.id,
          comment:
            comment ||
            (newStatus === DocumentStatus.RESUBMITTED
              ? "Resubmitted after revisions"
              : "Submitted for formal Director review"),
        },
      });

      await writeAuditTx(tx, {
        actorId: user.id,
        action: "DOCUMENT_SUBMITTED",
        entity: "document",
        entityId: id,
        req,
        details: { fromStatus: doc.status, toStatus: newStatus },
      });

      return fresh;
    });

    if (!updatedDoc) {
      return NextResponse.json(
        { error: "Document status changed concurrently. Please refresh and try again." },
        { status: 409 }
      );
    }

    const directors = await prisma.user.findMany({
      where: { role: "DIRECTOR", active: true },
    });

    for (const d of directors) {
      await createNotification({
        userId: d.id,
        title: "Annex Pending Review",
        message: `${user.name} submitted Annex ${doc.annexType.number}: ${doc.title}`,
        link: `/documents/${id}`,
      });
    }

    return NextResponse.json({ document: updatedDoc });
  } catch (error) {
    console.error("Submit document error:", error);
    return NextResponse.json(
      { error: "Failed to submit document for review" },
      { status: 500 }
    );
  }
}
