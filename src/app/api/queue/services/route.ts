import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageQueueConfig, canOperateQueue } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { sanitizeText } from "@/lib/validation";
import {
  ensureQueueBootstrap,
  getManilaQueueDate,
  resolveAssignableOperators,
} from "@/lib/queue";
import { emitQueueEvent } from "@/lib/queue-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canOperateQueue(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ensureQueueBootstrap();
    const services = await prisma.queueService.findMany({
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("List queue services error:", error);
    return NextResponse.json(
      { error: "Failed to load queue services" },
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
    if (!canManageQueueConfig(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: System Administrator access required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = sanitizeText(String(body.code || ""), 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const name = sanitizeText(String(body.name || ""), 80);
    const description = body.description
      ? sanitizeText(String(body.description), 200)
      : null;
    const icon = sanitizeText(String(body.icon || "file-text"), 30);
    const colorToken = sanitizeText(String(body.colorToken || "green"), 20);
    const estimatedMinutes = Math.max(
      1,
      Math.min(60, Number(body.estimatedMinutes) || 5)
    );
    const sortOrder = Math.max(1, Math.min(50, Number(body.sortOrder) || 1));
    const handledByRoles = Array.isArray(body.handledByRoles)
      ? (body.handledByRoles.filter((r: unknown) =>
          ["STAFF", "ACCOUNTING", "DIRECTOR"].includes(String(r))
        ) as Role[])
      : [Role.STAFF];
    const hasStaffAssignment =
      Array.isArray(body.assignedStaffIds) ||
      Array.isArray(body.assignedStaffEmails);
    const assignedOperators = hasStaffAssignment
      ? await resolveAssignableOperators({
          ids: body.assignedStaffIds,
          emails: body.assignedStaffEmails,
        })
      : [];

    if (!code || !name || name.length < 2) {
      return NextResponse.json(
        { error: "Service code (1-3 chars) and name are required." },
        { status: 400 }
      );
    }

    const service = await prisma.queueService.create({
      data: {
        code,
        name,
        description,
        icon,
        colorToken,
        estimatedMinutes,
        handledByRoles:
          handledByRoles.length > 0 ? handledByRoles : [Role.STAFF],
        ...(assignedOperators.length > 0
          ? {
              assignedStaff: {
                connect: assignedOperators.map((op) => ({ id: op.id })),
              },
            }
          : {}),
        sortOrder,
        isActive: body.isActive !== false,
      },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "QUEUE_SERVICE_CREATED",
      entity: "QUEUE_SERVICE",
      entityId: service.id,
      details: {
        code,
        name,
        estimatedMinutes,
        assignedStaffEmails: assignedOperators.map((o) => o.email),
      },
    });

    const config = await ensureQueueBootstrap();
    emitQueueEvent({
      type: "SERVICE_UPDATE",
      campus: config.defaultCampus,
      queueDate: getManilaQueueDate(),
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_OPERATOR:")) {
      return NextResponse.json(
        {
          error: `Selected staff account not found or inactive (${error.message.slice(
            "INVALID_OPERATOR:".length
          )}).`,
        },
        { status: 400 }
      );
    }
    console.error("Create queue service error:", error);
    return NextResponse.json(
      { error: "Failed to create queue service (code may already exist)." },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageQueueConfig(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: System Administrator access required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = sanitizeText(String(body.id || ""), 64);
    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required." },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      icon?: string;
      colorToken?: string;
      estimatedMinutes?: number;
      sortOrder?: number;
      isActive?: boolean;
      handledByRoles?: Role[];
    } = {};

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      updateData.name = sanitizeText(body.name, 80);
    }
    if (body.description !== undefined) {
      updateData.description = body.description
        ? sanitizeText(String(body.description), 200)
        : null;
    }
    if (typeof body.icon === "string") {
      updateData.icon = sanitizeText(body.icon, 30);
    }
    if (typeof body.colorToken === "string") {
      updateData.colorToken = sanitizeText(body.colorToken, 20);
    }
    if (typeof body.estimatedMinutes === "number") {
      updateData.estimatedMinutes = Math.max(
        1,
        Math.min(60, body.estimatedMinutes)
      );
    }
    if (typeof body.sortOrder === "number") {
      updateData.sortOrder = Math.max(1, Math.min(50, body.sortOrder));
    }
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }
    if (Array.isArray(body.handledByRoles)) {
      const roles = body.handledByRoles.filter((r: unknown) =>
        ["STAFF", "ACCOUNTING", "DIRECTOR"].includes(String(r))
      ) as Role[];
      if (roles.length > 0) updateData.handledByRoles = roles;
    }

    const hasStaffAssignment =
      Array.isArray(body.assignedStaffIds) ||
      Array.isArray(body.assignedStaffEmails);
    const assignedOperators = hasStaffAssignment
      ? await resolveAssignableOperators({
          ids: body.assignedStaffIds,
          emails: body.assignedStaffEmails,
        })
      : undefined;

    const service = await prisma.queueService.update({
      where: { id },
      data: {
        ...updateData,
        ...(assignedOperators !== undefined
          ? {
              assignedStaff: {
                set: assignedOperators.map((op) => ({ id: op.id })),
              },
            }
          : {}),
      },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "QUEUE_SERVICE_UPDATED",
      entity: "QUEUE_SERVICE",
      entityId: service.id,
      details: {
        ...updateData,
        ...(assignedOperators !== undefined
          ? { assignedStaffEmails: assignedOperators.map((o) => o.email) }
          : {}),
      },
    });

    const config = await ensureQueueBootstrap();
    emitQueueEvent({
      type: "SERVICE_UPDATE",
      campus: config.defaultCampus,
      queueDate: getManilaQueueDate(),
    });

    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_OPERATOR:")) {
      return NextResponse.json(
        {
          error: `Selected staff account not found or inactive (${error.message.slice(
            "INVALID_OPERATOR:".length
          )}).`,
        },
        { status: 400 }
      );
    }
    console.error("Update queue service error:", error);
    return NextResponse.json(
      { error: "Failed to update queue service" },
      { status: 500 }
    );
  }
}

