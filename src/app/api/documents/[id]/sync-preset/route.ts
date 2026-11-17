import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canEditDocument } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
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
      include: {
        preset: true,
        annexType: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!canEditDocument(user.id, doc.createdById, doc.status)) {
      return NextResponse.json(
        { error: "Only the preparer can sync preset updates while the document is DRAFT or RETURNED." },
        { status: 403 }
      );
    }

    if (!doc.preset) {
      return NextResponse.json(
        { error: "This document's original preset is no longer active in the library." },
        { status: 404 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        presetNameSnapshot: doc.preset.name,
        presetSnapshot: doc.preset.config as Prisma.InputJsonValue,
      },
      include: {
        annexType: true,
        preset: true,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_PRESET_SYNCED",
      entity: "document",
      entityId: doc.id,
      details: {
        presetId: doc.preset.id,
        presetName: doc.preset.name,
        annexNumber: doc.annexType.number,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("Sync document preset error:", error);
    return NextResponse.json({ error: "Failed to sync document preset" }, { status: 500 });
  }
}

