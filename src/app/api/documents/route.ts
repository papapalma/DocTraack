import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canCreateAnnex } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { DocumentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") as DocumentStatus | null;
    const annexFilter = searchParams.get("annex");

    const whereClause: any = {};

    // Filter by status if requested
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Role-based visibility
    if (user.role === "DIRECTOR") {
      // Director sees everything that is submitted, approved, returned, etc.
      // Drafts belong only to the preparer
      if (!statusFilter) {
        whereClause.status = { not: DocumentStatus.DRAFT };
      }
    } else if (user.role === "ACCOUNTING") {
      // Accounting sees their own documents + financial annexes (6-9)
      whereClause.OR = [
        { createdById: user.id },
        { annexType: { number: { in: [6, 7, 8, 9] } } },
      ];
    } else if (user.role === "STAFF") {
      // Staff sees all active documents across the TDP office
    } else {
      return NextResponse.json(
        { error: "Access denied. Only operational roles (Staff, Accounting, Director) can access annex documents." },
        { status: 403 }
      );
    }

    if (annexFilter) {
      whereClause.annexType = { number: parseInt(annexFilter, 10) };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        annexType: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        transmittal: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { annexTypeId, title, formData, submitDirectly } = body;

    if (!annexTypeId) {
      return NextResponse.json(
        { error: "Annex Type is required" },
        { status: 400 }
      );
    }

    // Lookup annex type to check creator role permission
    const annexType = await prisma.annexType.findUnique({
      where: { id: annexTypeId },
    });

    if (!annexType) {
      return NextResponse.json(
        { error: "Invalid Annex Type specified" },
        { status: 404 }
      );
    }

    if (!canCreateAnnex(user.role, annexType.number)) {
      return NextResponse.json(
        {
          error: `Role ${user.role} is not permitted to create Annex ${annexType.number} (${annexType.name})`,
        },
        { status: 403 }
      );
    }

    const docTitle =
      title ||
      `Annex ${annexType.number} - ${annexType.name} (${new Date().toLocaleDateString()})`;

    const initialStatus = submitDirectly
      ? DocumentStatus.SUBMITTED
      : DocumentStatus.DRAFT;

    const document = await prisma.document.create({
      data: {
        annexTypeId,
        title: docTitle,
        status: initialStatus,
        formData: formData || {},
        createdById: user.id,
        statusHistory: {
          create: {
            fromStatus: DocumentStatus.DRAFT,
            toStatus: initialStatus,
            actorId: user.id,
            comment: submitDirectly ? "Initial submission for Director review" : "Draft created",
          },
        },
      },
      include: {
        annexType: true,
      },
    });

    await logAudit({
      actorId: user.id,
      action: submitDirectly ? "DOCUMENT_SUBMITTED" : "DOCUMENT_DRAFT_CREATED",
      entity: "document",
      entityId: document.id,
      details: {
        annexNumber: annexType.number,
        title: document.title,
        status: initialStatus,
      },
    });

    // If submitted directly, notify Directors
    if (submitDirectly) {
      const directors = await prisma.user.findMany({
        where: { role: "DIRECTOR", active: true },
      });
      for (const d of directors) {
        await createNotification({
          userId: d.id,
          title: "New Annex Pending Review",
          message: `${user.name} submitted Annex ${annexType.number}: ${document.title}`,
          link: `/documents/${document.id}`,
        });
      }
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
