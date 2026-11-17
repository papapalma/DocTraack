import { NextRequest, NextResponse } from "next/server";
import { QueueTicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMobileTicketTracker } from "@/lib/queue";
import { emitQueueEvent } from "@/lib/queue-events";
import { sanitizeText } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tracker = await getMobileTicketTracker(token);
    if (!tracker) {
      return NextResponse.json(
        { error: "Queue ticket not found or expired." },
        { status: 404 }
      );
    }
    return NextResponse.json({ tracker });
  } catch (error) {
    console.error("Failed to fetch mobile ticket tracker:", error);
    return NextResponse.json(
      { error: "Failed to load queue ticket status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const cleanToken = sanitizeText(token, 64);
    if (!cleanToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const ticket = await prisma.queueTicket.findUnique({
      where: { publicLookupToken: cleanToken },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Queue ticket not found." },
        { status: 404 }
      );
    }

    if (ticket.status !== QueueTicketStatus.WAITING) {
      return NextResponse.json(
        {
          error:
            "Only waiting tickets can be cancelled. Please notify the window staff directly.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueTicketStatus.CANCELLED,
          completedAt: new Date(),
        },
      });
      await tx.queueTicketEvent.create({
        data: {
          ticketId: ticket.id,
          fromStatus: QueueTicketStatus.WAITING,
          toStatus: QueueTicketStatus.CANCELLED,
          note: "Cancelled by visitor via mobile tracker",
        },
      });
    });

    emitQueueEvent({
      type: "CANCEL",
      campus: ticket.campus,
      queueDate: ticket.queueDate,
      ticketNumber: ticket.ticketNumber,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel kiosk ticket error:", error);
    return NextResponse.json(
      { error: "Failed to cancel queue ticket" },
      { status: 500 }
    );
  }
}

