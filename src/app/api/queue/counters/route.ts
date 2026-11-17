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
  normalizeQueueCampus,
  resolveAssignableOperators,
} from "@/lib/queue";
import { emitQueueEvent } from "@/lib/queue-events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canOperateQueue(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = await ensureQueueBootstrap();
    const { searchParams } = new URL(req.url);
    const campus = normalizeQueueCampus(
      searchParams.get("campus") || config.defaultCampus
    );

    const counters = await prisma.queueCounter.findMany({
      where: { campus },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ counters });
  } catch (error) {
    console.error("List queue counters error:", error);
    return NextResponse.json(
      { error: "Failed to list queue counters" },
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
        { error: "Forbidden: Only System Administrators can create counters." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = sanitizeText(String(body.name || ""), 40);
    const campus = normalizeQueueCampus(body.campus);
    const serviceCodes = Array.isArray(body.serviceCodes)
      ? body.serviceCodes
          .map((c: unknown) => sanitizeText(String(c), 4).toUpperCase())
          .filter(Boolean)
      : [];
    const allowedRoles = Array.isArray(body.allowedRoles)
      ? (body.allowedRoles.filter((r: unknown) =>
          ["STAFF", "ACCOUNTING", "DIRECTOR"].includes(String(r))
        ) as Role[])
      : [Role.STAFF];
    const sortOrder = Math.max(1, Math.min(20, Number(body.sortOrder) || 1));
    const hasAssignedStaff =
      Boolean(body.assignedStaffId) || Boolean(body.assignedStaffEmail);
    const assignedOps = hasAssignedStaff
      ? await resolveAssignableOperators({
          ids: body.assignedStaffId ? [body.assignedStaffId] : undefined,
          emails: body.assignedStaffEmail
            ? [body.assignedStaffEmail]
            : undefined,
        })
      : [];
    const assignedStaffId = assignedOps[0]?.id ?? null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Counter name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const counter = await prisma.queueCounter.create({
      data: {
        name,
        campus,
        serviceCodes,
        allowedRoles: allowedRoles.length > 0 ? allowedRoles : [Role.STAFF],
        assignedStaffId,
        sortOrder,
        isOpen: body.isOpen !== false,
      },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "QUEUE_COUNTER_CREATED",
      entity: "QUEUE_COUNTER",
      entityId: counter.id,
      details: {
        name,
        campus,
        serviceCodes,
        allowedRoles,
        assignedStaffEmail: assignedOps[0]?.email ?? null,
      },
    });

    emitQueueEvent({
      type: "COUNTER_UPDATE",
      campus,
      queueDate: getManilaQueueDate(),
      counterName: counter.name,
    });

    return NextResponse.json({ counter }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_OPERATOR:")) {
      return NextResponse.json(
        {
          error: `Selected operator not found or inactive (${error.message.slice(
            "INVALID_OPERATOR:".length
          )}).`,
        },
        { status: 400 }
      );
    }
    console.error("Create queue counter error:", error);
    return NextResponse.json(
      { error: "Failed to create queue counter (check duplicate name)." },
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
    if (!canOperateQueue(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = sanitizeText(String(body.id || ""), 64);
    if (!id) {
      return NextResponse.json(
        { error: "Counter ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.queueCounter.findUnique({
      where: { id },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Counter not found." }, { status: 404 });
    }

    const isAdmin = canManageQueueConfig(user.role);
    if (!isAdmin && existing.allowedRoles.length > 0 && !existing.allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Your role is not permitted to operate this window." },
        { status: 403 }
      );
    }
    const updateData: {
      isOpen?: boolean;
      isPaused?: boolean;
      assignedStaffId?: string | null;
      name?: string;
      serviceCodes?: string[];
      allowedRoles?: Role[];
      sortOrder?: number;
    } = {};

    if (typeof body.isOpen === "boolean") updateData.isOpen = body.isOpen;
    if (typeof body.isPaused === "boolean") updateData.isPaused = body.isPaused;
    if (body.claim === true) {
      if (
        !isAdmin &&
        existing.assignedStaffId &&
        existing.assignedStaffId !== user.id
      ) {
        return NextResponse.json(
          {
            error: `This window is designated to ${
              existing.assignedStaff?.name || "another staff member"
            } (${existing.assignedStaff?.email || "assigned"}). Use Emergency Takeover when calling tickets instead of overwriting the window owner.`,
          },
          { status: 409 }
        );
      }
      updateData.assignedStaffId = user.id;
      updateData.isOpen = true;
    } else if (body.release === true) {
      if (
        !isAdmin &&
        existing.assignedStaffId &&
        existing.assignedStaffId !== user.id
      ) {
        return NextResponse.json(
          {
            error: `Only ${
              existing.assignedStaff?.name || "the assigned operator"
            } or a System Administrator can release this window.`,
          },
          { status: 403 }
        );
      }
      updateData.assignedStaffId = null;
    }

    // Structural edits and explicit staff designation are reserved for SYSTEM_ADMIN
    if (isAdmin) {
      if (
        body.assignedStaffId !== undefined ||
        body.assignedStaffEmail !== undefined
      ) {
        if (
          body.assignedStaffId === null ||
          body.assignedStaffId === "" ||
          body.assignedStaffEmail === null ||
          body.assignedStaffEmail === ""
        ) {
          if (
            !body.assignedStaffId &&
            !body.assignedStaffEmail
          ) {
            updateData.assignedStaffId = null;
          }
        }
        if (body.assignedStaffId || body.assignedStaffEmail) {
          const ops = await resolveAssignableOperators({
            ids: body.assignedStaffId ? [body.assignedStaffId] : undefined,
            emails: body.assignedStaffEmail
              ? [body.assignedStaffEmail]
              : undefined,
          });
          updateData.assignedStaffId = ops[0]?.id ?? null;
        }
      }
      if (typeof body.name === "string" && body.name.trim().length >= 2) {
        updateData.name = sanitizeText(body.name, 40);
      }
      if (Array.isArray(body.serviceCodes)) {
        updateData.serviceCodes = body.serviceCodes
          .map((c: unknown) => sanitizeText(String(c), 4).toUpperCase())
          .filter(Boolean);
      }
      if (Array.isArray(body.allowedRoles)) {
        const roles = body.allowedRoles.filter((r: unknown) =>
          ["STAFF", "ACCOUNTING", "DIRECTOR"].includes(String(r))
        ) as Role[];
        if (roles.length > 0) updateData.allowedRoles = roles;
      }
      if (typeof body.sortOrder === "number") {
        updateData.sortOrder = Math.max(1, Math.min(20, body.sortOrder));
      }
    }

    const counter = await prisma.queueCounter.update({
      where: { id },
      data: updateData,
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "QUEUE_COUNTER_UPDATED",
      entity: "QUEUE_COUNTER",
      entityId: counter.id,
      details: {
        ...updateData,
        assignedStaffEmail: counter.assignedStaff?.email ?? null,
      },
    });

    emitQueueEvent({
      type: "COUNTER_UPDATE",
      campus: counter.campus,
      queueDate: getManilaQueueDate(),
      counterName: counter.name,
    });

    return NextResponse.json({ counter });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_OPERATOR:")) {
      return NextResponse.json(
        {
          error: `Selected operator not found or inactive (${error.message.slice(
            "INVALID_OPERATOR:".length
          )}).`,
        },
        { status: 400 }
      );
    }
    console.error("Update queue counter error:", error);
    return NextResponse.json(
      { error: "Failed to update queue counter" },
      { status: 500 }
    );
  }
}

