import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canArchive } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
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

    const [updated] = await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.ARCHIVED },
      }),
      prisma.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.ARCHIVED,
          actorId: user.id,
          comment: "Manually archived by user",
        },
      }),
    ]);

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_ARCHIVED",
      entity: "document",
      entityId: id,
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("Archive document error:", error);
    return NextResponse.json(
      { error: "Failed to archive document" },
      { status: 500 }
    );
  }
}
