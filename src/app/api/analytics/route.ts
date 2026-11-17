import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { escapeCsvCell } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    // Fetch document metadata without heavy formData/presetSnapshot JSON payloads
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        annexType: { select: { number: true, name: true } },
        createdBy: { select: { name: true, role: true } },
        transmittal: { select: { recipient: true, method: true } },
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
            escapeCsvCell(d.id),
            escapeCsvCell(`Annex ${d.annexType?.number}`),
            escapeCsvCell(d.title),
            escapeCsvCell(d.status),
            escapeCsvCell(d.createdBy?.name || ""),
            escapeCsvCell(new Date(d.createdAt).toISOString()),
            escapeCsvCell(d.transmittal?.recipient || ""),
            escapeCsvCell(d.transmittal?.method || ""),
          ].join(",")
        )
        .join("\n");

      await logAudit({
        actorId: user.id,
        action: "ANALYTICS_CSV_EXPORTED",
        entity: "analytics",
        entityId: "analytics",
        req,
        details: { rowCount: documents.length },
      });

      return new Response(headers + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="minsu-doctrack-analytics.csv"',
          "Cache-Control": "no-store, private",
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
