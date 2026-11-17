import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canTransmit } from "@/lib/rbac";
import { writeAuditTx } from "@/lib/audit";
import { parseSafeHttpUrl, safeJsonObject, sanitizeText } from "@/lib/validation";
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
    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const recipient =
      typeof body.recipient === "string"
        ? sanitizeText(body.recipient, 200)
        : "";
    const method =
      typeof body.method === "string" && sanitizeText(body.method, 50)
        ? sanitizeText(body.method, 50)
        : "manual";
    const notes =
      typeof body.notes === "string" ? sanitizeText(body.notes, 1000) : null;

    let validatedDriveLink: string | null = null;
    if (body.driveLink !== undefined && body.driveLink !== null && String(body.driveLink).trim() !== "") {
      validatedDriveLink = parseSafeHttpUrl(body.driveLink);
      if (!validatedDriveLink) {
        return NextResponse.json(
          { error: "Drive link must be a valid http:// or https:// URL." },
          { status: 400 }
        );
      }
    }

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient agency or office name is required" },
        { status: 400 }
      );
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { annexType: { select: { number: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!canTransmit(user.role, doc.status, doc.annexType.number)) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to transmit this document, or it must be APPROVED / UPLOADED first.",
        },
        { status: 403 }
      );
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.document.updateMany({
        where: {
          id,
          status: { in: [DocumentStatus.APPROVED, DocumentStatus.UPLOADED] },
        },
        data: { status: DocumentStatus.TRANSMITTED },
      });

      if (transitioned.count === 0) {
        return null;
      }

      const transmittal = await tx.transmittal.upsert({
        where: { documentId: id },
        update: {
          recipient,
          method,
          driveLink: validatedDriveLink,
          notes,
          sentById: user.id,
          sentAt: new Date(),
        },
        create: {
          documentId: id,
          sentById: user.id,
          method,
          recipient,
          driveLink: validatedDriveLink,
          notes,
        },
      });

      const updatedDoc = await tx.document.findUnique({ where: { id } });

      await tx.statusHistory.create({
        data: {
          documentId: id,
          fromStatus: doc.status,
          toStatus: DocumentStatus.TRANSMITTED,
          actorId: user.id,
          comment: `Transmitted to ${recipient} via ${method}. ${validatedDriveLink ? `Drive Link: ${validatedDriveLink}` : ""}`,
        },
      });

      await writeAuditTx(tx, {
        actorId: user.id,
        action: "DOCUMENT_TRANSMITTED",
        entity: "document",
        entityId: id,
        req,
        details: { recipient, method, driveLink: validatedDriveLink },
      });

      return { transmittal, document: updatedDoc };
    });

    if (!txResult) {
      return NextResponse.json(
        { error: "Document status changed concurrently. Please refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(txResult);
  } catch (error) {
    console.error("Transmittal error:", error);
    return NextResponse.json(
      { error: "Failed to record transmittal" },
      { status: 500 }
    );
  }
}
