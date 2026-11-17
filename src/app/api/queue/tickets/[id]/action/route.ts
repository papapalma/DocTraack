import { NextRequest, NextResponse } from "next/server";
import { QueueTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canOperateQueue } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { sanitizeText } from "@/lib/validation";
import { emitQueueEvent } from "@/lib/queue-events";
import {
  getCounterOwnership,
  getServiceAssignmentStatus,
  matchesOperatorIdentity,
} from "@/lib/queue-fairness";
import type { QueueEventType } from "@/types/queue";

export const dynamic = "force-dynamic";

type TicketAction =
  | "CALL_SPECIFIC"
  | "RECALL"
  | "START_SERVING"
  | "COMPLETE"
  | "NO_SHOW"
  | "CANCEL"
  | "TRANSFER";

const VALID_ACTIONS = new Set<TicketAction>([
  "CALL_SPECIFIC",
  "RECALL",
  "START_SERVING",
  "COMPLETE",
  "NO_SHOW",
  "CANCEL",
  "TRANSFER",
]);

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

    const { id: ticketId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toUpperCase() as TicketAction;

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "Invalid queue ticket action." },
        { status: 400 }
      );
    }

    const note = body.note ? sanitizeText(String(body.note), 500) : null;
    const targetServiceId = body.targetServiceId
      ? sanitizeText(String(body.targetServiceId), 64)
      : null;
    const counterId = body.counterId
      ? sanitizeText(String(body.counterId), 64)
      : null;
    const takeoverRequested = Boolean(body.takeover) || user.role === "SYSTEM_ADMIN";
    const actorLabel = `${user.name} (${user.email})`;

    const outcome = await prisma.$transaction(async (tx) => {
      const ticket = await tx.queueTicket.findUnique({
        where: { id: ticketId },
        include: {
          servedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
      }

      const now = new Date();
      let updatedTicket = ticket;
      let eventType: QueueEventType = "SERVE";
      let auditAction = "QUEUE_TICKET_UPDATED";
      let isTakeover = false;

      if (action !== "CALL_SPECIFIC" && ticket.servedById) {
        const heldByCurrentUser = matchesOperatorIdentity(
          { id: ticket.servedById, email: ticket.servedBy?.email },
          user.id,
          user.email
        );
        if (!heldByCurrentUser) {
          if (!takeoverRequested) {
            const owner = ticket.servedBy
              ? `${ticket.servedBy.name} (${ticket.servedBy.email})`
              : "another staff member";
            throw new Error(
              `TAKEOVER_REQUIRED:This ticket is currently controlled by ${owner}. Confirm Emergency Takeover to manage it.`
            );
          }
          isTakeover = true;
        }
      }

      if (action === "CALL_SPECIFIC") {
        if (ticket.status !== QueueTicketStatus.WAITING) {
          throw new Error("INVALID_STATE");
        }
        if (!counterId) {
          throw new Error("COUNTER_REQUIRED");
        }
        const [counter, service] = await Promise.all([
          tx.queueCounter.findUnique({
            where: { id: counterId },
            include: {
              assignedStaff: { select: { id: true, name: true, email: true } },
            },
          }),
          tx.queueService.findUnique({
            where: { id: ticket.serviceId },
            include: {
              assignedStaff: { select: { id: true, name: true, email: true } },
            },
          }),
        ]);
        if (!counter) throw new Error("COUNTER_NOT_FOUND");
        if (counter.campus !== ticket.campus) {
          throw new Error("CAMPUS_MISMATCH");
        }
        if (
          user.role !== "SYSTEM_ADMIN" &&
          counter.allowedRoles.length > 0 &&
          !counter.allowedRoles.includes(user.role)
        ) {
          throw new Error("FORBIDDEN_COUNTER_ROLE");
        }
        if (counter.currentTicketId) {
          const active = await tx.queueTicket.findUnique({
            where: { id: counter.currentTicketId },
          });
          if (
            active &&
            (active.status === QueueTicketStatus.CALLED ||
              active.status === QueueTicketStatus.SERVING)
          ) {
            throw new Error("COUNTER_BUSY");
          }
        }

        const counterOwnership = getCounterOwnership(
          {
            assignedStaffId: counter.assignedStaffId,
            assignedStaffEmail: counter.assignedStaff?.email,
          },
          user.id,
          user.email
        );
        const serviceOwnership = getServiceAssignmentStatus(
          service?.assignedStaff,
          user.id,
          user.email
        );

        if (
          counterOwnership === "OWNED_BY_OTHER" ||
          serviceOwnership === "ASSIGNED_TO_OTHER"
        ) {
          if (!takeoverRequested) {
            const designatedList =
              serviceOwnership === "ASSIGNED_TO_OTHER" && service?.assignedStaff
                ? service.assignedStaff
                    .map((s) => `${s.name} (${s.email})`)
                    .join(", ")
                : `${counter.assignedStaff?.name || "Staff"} (${
                    counter.assignedStaff?.email || "assigned"
                  })`;
            throw new Error(
              `TAKEOVER_REQUIRED:This ticket/window is designated to ${designatedList}. Use Emergency Takeover to accept and control it.`
            );
          }
          isTakeover = user.role !== "SYSTEM_ADMIN";
        }

        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: QueueTicketStatus.CALLED,
            counterId: counter.id,
            counterName: counter.name,
            servedById: user.id,
            calledAt: now,
            recallCount: ticket.recallCount + 1,
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });
        // Preserve Admin's designated counter owner (`assignedStaffId`)
        await tx.queueCounter.update({
          where: { id: counter.id },
          data: {
            currentTicketId: ticket.id,
            isOpen: true,
            isPaused: false,
          },
        });
        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: QueueTicketStatus.CALLED,
            counterId: counter.id,
            actorId: user.id,
            note:
              note ||
              (isTakeover
                ? `Emergency takeover & called at ${counter.name} by ${actorLabel}`
                : `Accepted & called at ${counter.name} by ${actorLabel}`),
          },
        });
        eventType = "CALL";
        auditAction = isTakeover
          ? "QUEUE_TICKET_TAKEOVER_CALLED"
          : "QUEUE_TICKET_CALLED";
      } else if (action === "RECALL") {
        if (
          ticket.status !== QueueTicketStatus.CALLED &&
          ticket.status !== QueueTicketStatus.SERVING
        ) {
          throw new Error("INVALID_STATE");
        }
        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            recallCount: ticket.recallCount + 1,
            calledAt: now,
            ...(isTakeover ? { servedById: user.id } : {}),
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });
        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: ticket.status,
            counterId: ticket.counterId,
            actorId: user.id,
            note:
              note ||
              (isTakeover
                ? `Emergency takeover recall (${updatedTicket.recallCount}x) by ${actorLabel}`
                : `Recalled (${updatedTicket.recallCount}x)`),
          },
        });
        eventType = "RECALL";
        auditAction = "QUEUE_TICKET_RECALLED";
      } else if (action === "START_SERVING") {
        if (ticket.status !== QueueTicketStatus.CALLED) {
          throw new Error("INVALID_STATE");
        }
        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: QueueTicketStatus.SERVING,
            servingStartedAt: now,
            servedById: user.id,
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });
        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: QueueTicketStatus.SERVING,
            counterId: ticket.counterId,
            actorId: user.id,
            note:
              note ||
              (isTakeover
                ? `Emergency takeover & serving started by ${actorLabel}`
                : "Client arrived at counter"),
          },
        });
        eventType = "SERVE";
        auditAction = "QUEUE_TICKET_SERVING";
      } else if (action === "COMPLETE" || action === "NO_SHOW") {
        if (
          ticket.status !== QueueTicketStatus.CALLED &&
          ticket.status !== QueueTicketStatus.SERVING
        ) {
          throw new Error("INVALID_STATE");
        }
        const targetStatus =
          action === "COMPLETE"
            ? QueueTicketStatus.COMPLETED
            : QueueTicketStatus.NO_SHOW;

        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: targetStatus,
            completedAt: now,
            notes: note ?? ticket.notes,
            servedById: user.id,
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });

        if (ticket.counterId) {
          await tx.queueCounter.updateMany({
            where: { id: ticket.counterId, currentTicketId: ticket.id },
            data: { currentTicketId: null },
          });
        }

        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: targetStatus,
            counterId: ticket.counterId,
            actorId: user.id,
            note:
              note ||
              (isTakeover
                ? `Emergency takeover ${
                    action === "COMPLETE" ? "completion" : "no-show"
                  } by ${actorLabel}`
                : action === "COMPLETE"
                ? "Service completed"
                : "Marked no-show"),
          },
        });

        eventType = action === "COMPLETE" ? "COMPLETE" : "NO_SHOW";
        auditAction =
          action === "COMPLETE"
            ? "QUEUE_TICKET_COMPLETED"
            : "QUEUE_TICKET_NO_SHOW";
      } else if (action === "CANCEL") {
        if (
          ticket.status === QueueTicketStatus.COMPLETED ||
          ticket.status === QueueTicketStatus.CANCELLED
        ) {
          throw new Error("INVALID_STATE");
        }
        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: QueueTicketStatus.CANCELLED,
            completedAt: now,
            notes: note ?? ticket.notes,
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });
        if (ticket.counterId) {
          await tx.queueCounter.updateMany({
            where: { id: ticket.counterId, currentTicketId: ticket.id },
            data: { currentTicketId: null },
          });
        }
        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: QueueTicketStatus.CANCELLED,
            counterId: ticket.counterId,
            actorId: user.id,
            note: note || `Cancelled by ${actorLabel}`,
          },
        });
        eventType = "CANCEL";
        auditAction = "QUEUE_TICKET_CANCELLED";
      } else if (action === "TRANSFER") {
        if (
          ticket.status === QueueTicketStatus.COMPLETED ||
          ticket.status === QueueTicketStatus.CANCELLED
        ) {
          throw new Error("INVALID_STATE");
        }
        if (!targetServiceId) {
          throw new Error("TARGET_SERVICE_REQUIRED");
        }
        const targetService = await tx.queueService.findUnique({
          where: { id: targetServiceId },
        });
        if (!targetService || !targetService.isActive) {
          throw new Error("SERVICE_NOT_FOUND");
        }

        if (ticket.counterId) {
          await tx.queueCounter.updateMany({
            where: { id: ticket.counterId, currentTicketId: ticket.id },
            data: { currentTicketId: null },
          });
        }

        updatedTicket = await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: QueueTicketStatus.WAITING,
            serviceId: targetService.id,
            serviceCode: targetService.code,
            serviceName: targetService.name,
            counterId: null,
            counterName: null,
            servedById: null,
            notes: note ?? ticket.notes,
          },
          include: {
            servedBy: { select: { id: true, name: true, email: true } },
          },
        });

        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: QueueTicketStatus.WAITING,
            counterId: ticket.counterId,
            actorId: user.id,
            note:
              note ||
              `Transferred to ${targetService.name} (${targetService.code}) by ${actorLabel}`,
          },
        });
        eventType = "TRANSFER";
        auditAction = "QUEUE_TICKET_TRANSFERRED";
      }

      return { updatedTicket, eventType, auditAction, isTakeover };
    });

    await logAudit({
      actorId: user.id,
      action: outcome.auditAction,
      entity: "QUEUE_TICKET",
      entityId: outcome.updatedTicket.id,
      details: {
        ticketNumber: outcome.updatedTicket.ticketNumber,
        status: outcome.updatedTicket.status,
        counterName: outcome.updatedTicket.counterName,
        serviceCode: outcome.updatedTicket.serviceCode,
        isTakeover: outcome.isTakeover,
        actorEmail: user.email,
        note,
      },
    });

    emitQueueEvent({
      type: outcome.eventType,
      campus: outcome.updatedTicket.campus,
      queueDate: outcome.updatedTicket.queueDate,
      ticketNumber: outcome.updatedTicket.ticketNumber,
      counterName: outcome.updatedTicket.counterName ?? undefined,
      recallTick: outcome.updatedTicket.recallCount,
    });

    return NextResponse.json({
      ticket: outcome.updatedTicket,
      isTakeover: outcome.isTakeover,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("TAKEOVER_REQUIRED:")) {
        return NextResponse.json(
          {
            error: error.message.slice("TAKEOVER_REQUIRED:".length),
            takeoverRequired: true,
          },
          { status: 409 }
        );
      }
      if (error.message === "FORBIDDEN_COUNTER_ROLE") {
        return NextResponse.json(
          { error: "Your role is not permitted to operate this service window." },
          { status: 403 }
        );
      }
      if (error.message === "CAMPUS_MISMATCH") {
        return NextResponse.json(
          { error: "Selected counter belongs to a different campus than the ticket." },
          { status: 400 }
        );
      }
      if (error.message === "TICKET_NOT_FOUND") {
        return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
      }
      if (error.message === "COUNTER_NOT_FOUND") {
        return NextResponse.json({ error: "Counter not found." }, { status: 404 });
      }
      if (error.message === "SERVICE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Target service not found or inactive." },
          { status: 404 }
        );
      }
      if (error.message === "COUNTER_BUSY") {
        return NextResponse.json(
          { error: "Counter already has an active ticket." },
          { status: 409 }
        );
      }
      if (
        error.message === "INVALID_STATE" ||
        error.message === "COUNTER_REQUIRED" ||
        error.message === "TARGET_SERVICE_REQUIRED"
      ) {
        return NextResponse.json(
          { error: `Invalid request for action (${error.message}).` },
          { status: 400 }
        );
      }
    }
    console.error("Queue ticket action error:", error);
    return NextResponse.json(
      { error: "Failed to process queue ticket action" },
      { status: 500 }
    );
  }
}

