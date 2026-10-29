import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    // Fetch all documents with their annex type
    const documents = await prisma.document.findMany({
      include: {
        annexType: true,
        createdBy: { select: { name: true, role: true } },
        transmittal: true,
      },
    });

    // Counts by status
    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      SUBMITTED: 0,
      RESUBMITTED: 0,
      APPROVED: 0,
      UPLOADED: 0,
      TRANSMITTED: 0,
      ARCHIVED: 0,
      RETURNED: 0,
    };

    // Counts by annex number
    const annexCounts: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) annexCounts[i] = 0;

    documents.forEach((d) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      if (d.annexType?.number) {
        annexCounts[d.annexType.number] =
          (annexCounts[d.annexType.number] || 0) + 1;
      }
    });

    const totalDocs = documents.length;
    const pendingReview = (statusCounts.SUBMITTED || 0) + (statusCounts.RESUBMITTED || 0);
    const approvedTotal = (statusCounts.APPROVED || 0) + (statusCounts.UPLOADED || 0) + (statusCounts.TRANSMITTED || 0);
    const approvalRate = totalDocs > 0 ? Math.round((approvedTotal / totalDocs) * 100) : 0;

    // Total Student Applications
    const totalApplications = await prisma.application.count();

    // If CSV export requested
    if (format === "csv") {
      const headers = "ID,Annex Number,Title,Status,Prepared By,Created At,Transmitted To,Method\n";
      const rows = documents
        .map((d) =>
          [
            `"${d.id}"`,
            `"Annex ${d.annexType?.number}"`,
            `"${d.title.replace(/"/g, '""')}"`,
            `"${d.status}"`,
            `"${d.createdBy?.name || ""}"`,
            `"${new Date(d.createdAt).toISOString()}"`,
            `"${d.transmittal?.recipient || ""}"`,
            `"${d.transmittal?.method || ""}"`,
          ].join(",")
        )
        .join("\n");

      return new Response(headers + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="minsu-doctrack-analytics.csv"',
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalDocs,
        pendingReview,
        approvedTotal,
        transmitted: statusCounts.TRANSMITTED || 0,
        returned: statusCounts.RETURNED || 0,
        approvalRate,
        totalApplications,
      },
      statusCounts,
      annexCounts,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to compile analytics" },
      { status: 500 }
    );
  }
}
