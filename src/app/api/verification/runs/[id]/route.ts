import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to TDP Staff and Campus Director" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const run = await prisma.verificationRun.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Verification run not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10))
    );
    const statusFilter = searchParams.get("status");
    const schoolFilter = searchParams.get("school");
    const searchQuery = (searchParams.get("search") || "").trim();

    const whereClause: any = { runId: id };

    // Status filter
    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "ENROLLED_SCHOLARS" || statusFilter === "FORM_1") {
        whereClause.status = { in: ["FULLY_VERIFIED", "NEEDS_ENCODING"] };
      } else if (statusFilter === "SCHOLARS_NOT_ENROLLED" || statusFilter === "FORM_2") {
        whereClause.status = "NOT_ENROLLED";
      } else if (statusFilter === "ENROLLED_NON_SCHOLAR" || statusFilter === "FORM_3") {
        whereClause.status = "ENROLLED_NON_SCHOLAR";
      } else if (statusFilter === "DISCREPANCIES") {
        whereClause.status = { in: ["POSSIBLE_MATCH", "SYSTEM_DISCREPANCY"] };
      } else {
        whereClause.status = statusFilter;
      }
    }

    // School filter
    if (schoolFilter && schoolFilter !== "ALL") {
      whereClause.school = { contains: schoolFilter, mode: "insensitive" };
    }

    // Search query on name or studentIdNo
    if (searchQuery) {
      whereClause.OR = [
        { lastName: { contains: searchQuery, mode: "insensitive" } },
        { firstName: { contains: searchQuery, mode: "insensitive" } },
        { middleName: { contains: searchQuery, mode: "insensitive" } },
        { studentIdNo: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const [totalCount, results] = await Promise.all([
      prisma.verificationResult.count({ where: whereClause }),
      prisma.verificationResult.findMany({
        where: whereClause,
        orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Also get distinct schools present in this run for filtering
    const distinctSchools = await prisma.verificationResult.findMany({
      where: { runId: id },
      distinct: ["school"],
      select: { school: true },
      orderBy: { school: "asc" },
    });

    return NextResponse.json({
      run,
      results,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      schools: distinctSchools.map((s) => s.school).filter(Boolean),
    });
  } catch (error) {
    console.error("Fetch verification run results error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verification run results" },
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to TDP Staff and Campus Director" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const run = await prisma.verificationRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Verification run not found" },
        { status: 404 }
      );
    }

    // Cascade delete run and results
    await prisma.verificationRun.delete({
      where: { id },
    });

    await logAudit({
      actorId: user.id,
      action: "VERIFICATION_RUN_PURGED",
      entity: "VerificationRun",
      entityId: id,
      details: {
        title: run.title,
        chedFileName: run.chedFileName,
        registrarFileName: run.registrarFileName,
        purgedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification run and associated records successfully purged.",
    });
  } catch (error) {
    console.error("Delete verification run error:", error);
    return NextResponse.json(
      { error: "Failed to delete verification run" },
      { status: 500 }
    );
  }
}

