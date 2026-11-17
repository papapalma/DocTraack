import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canArchive } from "@/lib/rbac";
import { writeAuditTx } from "@/lib/audit";
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

    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!canArchive(user.role, doc.status)) {
      return NextResponse.json(
        { error: "Only transmitted documents can be manually archived." },
        { status: 400 }
      );
    }

    const updatedDoc = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.document.updateMany({
        where: { id, status: DocumentStatus.TRANSMITTED },
        data: { status: DocumentStatus.ARCHIVED },
      });

      if (transitioned.count === 0) {
        return null;
      }

      const fresh = await tx.document.findUnique({ where: { id } });

      await tx.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.ARCHIVED,
          actorId: user.id,
          comment: "Manually archived by user",
        },
      });

      await writeAuditTx(tx, {
        actorId: user.id,
        action: "DOCUMENT_ARCHIVED",
        entity: "document",
        entityId: id,
        req,
      });

      return fresh;
    });

    if (!updatedDoc) {
      return NextResponse.json(
        { error: "Document status changed concurrently. Please refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ document: updatedDoc });
  } catch (error) {
    console.error("Archive document error:", error);
    return NextResponse.json(
      { error: "Failed to archive document" },
      { status: 500 }
    );
  }
}
