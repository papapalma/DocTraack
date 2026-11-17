import { NextRequest, NextResponse } from "next/server";
import { QueueTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canResetDailyQueue } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  ensureQueueBootstrap,
  getManilaQueueDate,
  normalizeQueueCampus,
} from "@/lib/queue";
import { emitQueueEvent } from "@/lib/queue-events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canResetDailyQueue(user.role)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only Staff Coordinators, Directors, or System Admins can reset the daily queue.",
        },
        { status: 403 }
      );
    }

    const config = await ensureQueueBootstrap();
    const body = await req.json().catch(() => ({}));
    const campus = normalizeQueueCampus(body.campus || config.defaultCampus);
    const queueDate = getManilaQueueDate();

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const pending = await tx.queueTicket.findMany({
        where: {
          queueDate,
          campus,
          status: {
            in: [
              QueueTicketStatus.WAITING,
              QueueTicketStatus.CALLED,
              QueueTicketStatus.SERVING,
            ],
          },
        },
        select: { id: true, status: true },
      });

      if (pending.length > 0) {
        await tx.queueTicket.updateMany({
          where: { id: { in: pending.map((t) => t.id) } },
          data: {
            status: QueueTicketStatus.CANCELLED,
            completedAt: now,
            notes: "Closed during end-of-day queue cut-off",
          },
        });

        await tx.queueTicketEvent.createMany({
          data: pending.map((t) => ({
            ticketId: t.id,
            fromStatus: t.status,
            toStatus: QueueTicketStatus.CANCELLED,
            actorId: user.id,
            note: "End-of-day queue cut-off by staff",
          })),
        });
      }

      await tx.queueCounter.updateMany({
        where: { campus },
        data: {
          currentTicketId: null,
          consecutivePriorityCount: 0,
        },
      });

      return pending.length;
    });

    await logAudit({
      actorId: user.id,
      action: "QUEUE_DAY_RESET",
      entity: "QUEUE_CONFIG",
      entityId: campus,
      details: { campus, queueDate, cancelledCount: result },
    });

    emitQueueEvent({
      type: "RESET",
      campus,
      queueDate,
    });

    return NextResponse.json({
      success: true,
      campus,
      queueDate,
      closedTicketsCount: result,
    });
  } catch (error) {
    console.error("Reset daily queue error:", error);
    return NextResponse.json(
      { error: "Failed to close/reset queue" },
      { status: 500 }
    );
  }
}

