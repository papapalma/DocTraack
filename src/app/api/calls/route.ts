import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("all") === "true" || user?.role === "STAFF";

    const now = new Date();
    const calls = await prisma.applicantCall.findMany({
      where: includeAll ? undefined : { isActive: true },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: [
        { batchNumber: "asc" },
        { startDate: "asc" },
      ],
    });

    const enrichedCalls = calls.map((call) => {
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

      return {
        ...call,
        windowStatus,
        isCurrentlyOpen: call.isActive && windowStatus === "OPEN",
      };
    });

    return NextResponse.json({ calls: enrichedCalls });
  } catch (error) {
    console.error("Fetch calls error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve applicant calls" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { title, description, batchNumber, startDate, deadline, formSchema } = await req.json();

    if (!title || !deadline) {
      return NextResponse.json(
        { error: "Title and deadline are required" },
        { status: 400 }
      );
    }

    const parsedBatch = Math.max(1, parseInt(batchNumber, 10) || 1);
    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedDeadline = new Date(deadline);

    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { error: "Please provide a valid deadline date." },
        { status: 400 }
      );
    }

    if (parsedStart >= parsedDeadline) {
      return NextResponse.json(
        { error: "Start date must be earlier than the application deadline." },
        { status: 400 }
      );
    }

    const newCall = await prisma.applicantCall.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        batchNumber: parsedBatch,
        startDate: parsedStart,
        deadline: parsedDeadline,
        formSchema: formSchema || { fields: [] },
        createdById: user.id,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "APPLICANT_CALL_CREATED",
      entity: "call",
      entityId: newCall.id,
      details: {
        title: newCall.title,
        batchNumber: newCall.batchNumber,
        startDate: newCall.startDate,
        deadline: newCall.deadline,
      },
    });

    return NextResponse.json({ call: newCall }, { status: 201 });
  } catch (error) {
    console.error("Create call error:", error);
    return NextResponse.json(
      { error: "Failed to create applicant call" },
      { status: 500 }
    );
  }
}
