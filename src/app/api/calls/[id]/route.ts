import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();

    const call = await prisma.applicantCall.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Applicant call not found" }, { status: 404 });
    }

    const start = new Date(call.startDate);
    const end = new Date(call.deadline);
    let windowStatus: "UPCOMING" | "OPEN" | "CLOSED" = "OPEN";
    if (!call.isActive) {
      windowStatus = "CLOSED";
    } else if (now < start) {
      windowStatus = "UPCOMING";
    } else if (now > end) {
      windowStatus = "CLOSED";
    }

    return NextResponse.json({
      call: {
        ...call,
        windowStatus,
        isCurrentlyOpen: call.isActive && windowStatus === "OPEN",
      },
    });
  } catch (error) {
    console.error("Fetch call detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve call details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied. Only TDP Staff can edit applicant calls." }, { status: 403 });
    }

    const { id } = await params;
    const existingCall = await prisma.applicantCall.findUnique({
      where: { id },
    });

    if (!existingCall) {
      return NextResponse.json({ error: "Applicant call not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: {
      title?: string;
      description?: string | null;
      batchNumber?: number;
      startDate?: Date;
      deadline?: Date;
      isActive?: boolean;
      formSchema?: any;
    } = {};

    if (body.title !== undefined) {
      const trimmed = body.title?.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Call title cannot be empty." }, { status: 400 });
      }
      updateData.title = trimmed;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.batchNumber !== undefined) {
      const parsedBatch = parseInt(body.batchNumber, 10);
      if (isNaN(parsedBatch) || parsedBatch < 1) {
        return NextResponse.json({ error: "Batch number must be a positive integer." }, { status: 400 });
      }
      updateData.batchNumber = parsedBatch;
    }

    let effectiveStart = existingCall.startDate;
    let effectiveDeadline = existingCall.deadline;

    if (body.startDate !== undefined) {
      const parsedStart = new Date(body.startDate);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json({ error: "Invalid start date format." }, { status: 400 });
      }
      effectiveStart = parsedStart;
      updateData.startDate = parsedStart;
    }

    if (body.deadline !== undefined) {
      const parsedDeadline = new Date(body.deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return NextResponse.json({ error: "Invalid deadline date format." }, { status: 400 });
      }
      effectiveDeadline = parsedDeadline;
      updateData.deadline = parsedDeadline;
    }

    if (effectiveStart >= effectiveDeadline) {
      return NextResponse.json(
        { error: "Start date must be earlier than the submission deadline." },
        { status: 400 }
      );
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.formSchema !== undefined) {
      updateData.formSchema = body.formSchema;
    }

    const updatedCall = await prisma.applicantCall.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { applications: true } },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "APPLICANT_CALL_UPDATED",
      entity: "call",
      entityId: updatedCall.id,
      details: {
        title: updatedCall.title,
        batchNumber: updatedCall.batchNumber,
        startDate: updatedCall.startDate,
        deadline: updatedCall.deadline,
        isActive: updatedCall.isActive,
      },
    });

    const now = new Date();
    const start = new Date(updatedCall.startDate);
    const end = new Date(updatedCall.deadline);
    let windowStatus: "UPCOMING" | "OPEN" | "CLOSED" = "OPEN";
    if (!updatedCall.isActive) {
      windowStatus = "CLOSED";
    } else if (now < start) {
      windowStatus = "UPCOMING";
    } else if (now > end) {
      windowStatus = "CLOSED";
    }

    return NextResponse.json({
      call: {
        ...updatedCall,
        windowStatus,
        isCurrentlyOpen: updatedCall.isActive && windowStatus === "OPEN",
      },
    });
  } catch (error) {
    console.error("Update call error:", error);
    return NextResponse.json(
      { error: "Failed to update applicant call" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied. Only TDP Staff can delete applicant calls." }, { status: 403 });
    }

    const { id } = await params;
    const call = await prisma.applicantCall.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Applicant call not found" }, { status: 404 });
    }

    const hasApplications = (call._count?.applications || 0) > 0;

    if (hasApplications) {
      // Soft deactivate/archive to prevent orphaned applications and foreign key cascade violations
      const archivedCall = await prisma.applicantCall.update({
        where: { id },
        data: { isActive: false },
      });

      await logAudit({
        actorId: user.id,
        action: "APPLICANT_CALL_ARCHIVED",
        entity: "call",
        entityId: id,
        details: {
          title: call.title,
          batchNumber: call.batchNumber,
          applicantCount: call._count?.applications,
          reason: "Call has existing applications; soft archived.",
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: "Applicant call contains student submissions and was archived rather than deleted.",
        call: archivedCall,
      });
    }

    // No applications exist, safe to delete completely
    await prisma.applicantCall.delete({
      where: { id },
    });

    await logAudit({
      actorId: user.id,
      action: "APPLICANT_CALL_DELETED",
      entity: "call",
      entityId: id,
      details: {
        title: call.title,
        batchNumber: call.batchNumber,
      },
    });

    return NextResponse.json({
      success: true,
      archived: false,
      message: "Applicant call deleted successfully.",
    });
  } catch (error) {
    console.error("Delete call error:", error);
    return NextResponse.json(
      { error: "Failed to delete applicant call" },
      { status: 500 }
    );
  }
}

