import { QueueTicketStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canOperateQueue } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  callNextTicketForCounter,
  getManilaQueueDate,
  getServiceAssignmentStatus,
} from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canOperateQueue(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: counterId } = await params;
    const counter = await prisma.queueCounter.findUnique({
      where: { id: counterId },
    });
    if (!counter) {
      return NextResponse.json({ error: "Counter not found." }, { status: 404 });
    }

    // Enforce window role permissions (SYSTEM_ADMIN may operate any counter for testing/fallback)
    if (
      user.role !== "SYSTEM_ADMIN" &&
      counter.allowedRoles.length > 0 &&
      !(counter.allowedRoles as string[]).includes(user.role)
    ) {
      return NextResponse.json(
        {
          error: `Forbidden: ${counter.name} is restricted to ${counter.allowedRoles.join(", ")}.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const serviceIdFilter = body.serviceId
      ? sanitizeText(String(body.serviceId), 64)
      : undefined;
    const allowTakeover = Boolean(body.takeover);

    const called = await callNextTicketForCounter({
      counterId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      serviceIdFilter,
      allowTakeover,
    });

    if (!called) {
      let otherAssignedCount = 0;
      if (!allowTakeover && user.role !== "SYSTEM_ADMIN") {
        const waitingOnWindow = await prisma.queueTicket.findMany({
          where: {
            queueDate: getManilaQueueDate(),
            campus: counter.campus,
            status: QueueTicketStatus.WAITING,
            ...(counter.serviceCodes.length > 0
              ? { serviceCode: { in: counter.serviceCodes } }
              : {}),
          },
          select: { serviceCode: true },
        });
        if (waitingOnWindow.length > 0) {
          const svcs = await prisma.queueService.findMany({
            where: { isActive: true },
            include: { assignedStaff: { select: { id: true, email: true } } },
          });
          const byCode = new Map(svcs.map((s) => [s.code, s.assignedStaff]));
          otherAssignedCount = waitingOnWindow.filter(
            (wt) =>
              getServiceAssignmentStatus(
                byCode.get(wt.serviceCode),
                user.id,
                user.email
              ) === "ASSIGNED_TO_OTHER"
          ).length;
        }
      }

      return NextResponse.json(
        {
          empty: true,
          otherAssignedCount,
          message:
            otherAssignedCount > 0
              ? `No tickets routed to ${user.name} (${user.email}). ${otherAssignedCount} waiting ticket(s) on this window are designated to other staff (use Emergency Takeover in the waiting queue).`
              : "No waiting tickets match this window.",
        },
        { status: 200 }
      );
    }

    await logAudit({
      actorId: user.id,
      action: called.isTakeover
        ? "QUEUE_TICKET_TAKEOVER_CALLED"
        : "QUEUE_TICKET_CALLED",
      entity: "QUEUE_TICKET",
      entityId: called.ticket.id,
      details: {
        ticketNumber: called.ticket.ticketNumber,
        counterName: called.counter.name,
        campus: called.counter.campus,
        priority: called.ticket.priority,
        isTakeover: called.isTakeover,
        actorEmail: user.email,
      },
    });

    return NextResponse.json({
      empty: false,
      ticket: called.ticket,
      counter: called.counter,
      isTakeover: called.isTakeover,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("COUNTER_TAKEOVER_REQUIRED:")) {
        const owner = error.message.slice("COUNTER_TAKEOVER_REQUIRED:".length);
        return NextResponse.json(
          {
            error: `This window is designated to ${owner}. Confirm Emergency Takeover to operate it.`,
            takeoverRequired: true,
          },
          { status: 409 }
        );
      }
      if (error.message === "COUNTER_NOT_FOUND") {
        return NextResponse.json({ error: "Counter not found." }, { status: 404 });
      }
      if (error.message === "COUNTER_BUSY") {
        return NextResponse.json(
          {
            error:
              "This window currently has an active ticket. Complete or mark No-Show first.",
          },
          { status: 409 }
        );
      }
    }
    console.error("Call next ticket error:", error);
    return NextResponse.json(
      { error: "Failed to call next walk-in ticket" },
      { status: 500 }
    );
  }
}

