import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export interface BatchItem {
  batchNumber: number;
  label: string;
  callTitle?: string | null;
  totalApplications: number;
  acceptedCount: number;
  isActive: boolean;
  deadline?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all calls to understand configured batches
    const calls = await prisma.applicantCall.findMany({
      orderBy: { batchNumber: "asc" },
      select: {
        id: true,
        batchNumber: true,
        title: true,
        isActive: true,
        deadline: true,
      },
    });

    // 2. Fetch all applications grouped by batch and status
    const appStats = await prisma.application.groupBy({
      by: ["batchNumber", "status"],
      _count: {
        id: true,
      },
    });

    // Collect all unique batch numbers from calls and applications
    const batchSet = new Set<number>();
    calls.forEach((c) => batchSet.add(c.batchNumber));
    appStats.forEach((a) => batchSet.add(a.batchNumber));

    // Fallback: If no batches found, ensure at least batches 1, 2, and 3 are visible
    if (batchSet.size === 0) {
      batchSet.add(1);
      batchSet.add(2);
      batchSet.add(3);
    }

    const sortedBatches = Array.from(batchSet).sort((a, b) => a - b);

    const batches: BatchItem[] = sortedBatches.map((bNum) => {
      const call = calls.find((c) => c.batchNumber === bNum);
      const total = appStats
        .filter((a) => a.batchNumber === bNum)
        .reduce((acc, curr) => acc + curr._count.id, 0);
      const accepted = appStats
        .filter((a) => a.batchNumber === bNum && a.status === ApplicationStatus.ACCEPTED)
        .reduce((acc, curr) => acc + curr._count.id, 0);

      return {
        batchNumber: bNum,
        label: `Batch ${bNum}`,
        callTitle: call?.title || `TDP Intake Cohort (Batch ${bNum})`,
        totalApplications: total,
        acceptedCount: accepted,
        isActive: call ? call.isActive : true,
        deadline: call?.deadline ? call.deadline.toISOString() : null,
      };
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Failed to retrieve batches:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving batches" },
      { status: 500 }
    );
  }
}

