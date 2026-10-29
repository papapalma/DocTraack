import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canTransmit } from "@/lib/rbac";
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
    const { recipient, method, driveLink, notes } = await req.json();

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient agency or office name is required" },
        { status: 400 }
      );
    }

    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!canTransmit(user.role, doc.status)) {
      return NextResponse.json(
        {
          error:
            "Document must be APPROVED or have a scan UPLOADED before transmitting to agency.",
        },
        { status: 400 }
      );
    }

    const [transmittal, updatedDoc] = await prisma.$transaction([
      prisma.transmittal.upsert({
        where: { documentId: id },
        update: {
          recipient,
          method: method || "manual",
          driveLink: driveLink || null,
          notes: notes || null,
          sentById: user.id,
          sentAt: new Date(),
        },
        create: {
          documentId: id,
          sentById: user.id,
          method: method || "manual",
          recipient,
          driveLink: driveLink || null,
          notes: notes || null,
        },
      }),
      prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.TRANSMITTED },
      }),
      prisma.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.TRANSMITTED,
          actorId: user.id,
          comment: `Transmitted to ${recipient} via ${method || "manual"}. ${driveLink ? `Drive Link: ${driveLink}` : ""}`,
        },
      }),
    ]);

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_TRANSMITTED",
      entity: "document",
      entityId: id,
      details: { recipient, method, driveLink },
    });

    return NextResponse.json({ transmittal, document: updatedDoc });
  } catch (error) {
    console.error("Transmittal error:", error);
    return NextResponse.json(
      { error: "Failed to record transmittal" },
      { status: 500 }
    );
  }
}
