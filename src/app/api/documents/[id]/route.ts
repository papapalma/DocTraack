import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canEditDocument } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { DocumentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT" || user.role === "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only operational roles (Staff, Accounting, Director) can access annex documents." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        annexType: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        transmittal: {
          include: {
            sentBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Fetch document error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, formData } = await req.json();

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only preparer can edit while status is DRAFT or RETURNED
    if (!canEditDocument(user.id, existing.createdById, existing.status)) {
      return NextResponse.json(
        {
          error:
            "Documents can only be edited by their preparer while in DRAFT or RETURNED status.",
        },
        { status: 403 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        title: title || existing.title,
        formData: formData || existing.formData,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_UPDATED",
      entity: "document",
      entityId: id,
      details: { title: updated.title },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// Export PATCH as alias to PUT for REST compatibility across all sheet suites
export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only DRAFT documents can be deleted by their preparer
    if (existing.status !== DocumentStatus.DRAFT || existing.createdById !== user.id) {
      return NextResponse.json(
        { error: "Only draft documents can be deleted by their creator." },
        { status: 403 }
      );
    }

    await prisma.document.delete({ where: { id } });

    await logAudit({
      actorId: user.id,
      action: "DOCUMENT_DRAFT_DELETED",
      entity: "document",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Draft deleted." });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
