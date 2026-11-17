import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role, ApplicationStatus } from "@prisma/client";
import { getMinsuCampusConfig } from "@/lib/campus-constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient privileges" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batchesParam = searchParams.get("batches") || searchParams.get("batch") || "1";
    const campus = searchParams.get("campus");

    const whereClause: any = {
      status: ApplicationStatus.ACCEPTED,
    };

    let targetBatches: number[] = [];
    if (batchesParam && batchesParam !== "ALL") {
      targetBatches = batchesParam
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (targetBatches.length === 1) {
        whereClause.batchNumber = targetBatches[0];
      } else if (targetBatches.length > 1) {
        whereClause.batchNumber = { in: targetBatches };
      }
    }

    // Fetch accepted applications as candidate continuing grantees
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ batchNumber: "asc" }, { submittedAt: "asc" }],
      take: 2000,
    });

    const candidates = applications.map((app, index) => {
      const data = (app.formData as any) || {};
      const controlNum = String(index + 1).padStart(5, "0");
      const middleInitial = data.middle_name ? `${data.middle_name.charAt(0).toUpperCase()}.` : "";
      const rawCampus = data.hei_campus || data.campus || "Main Campus (Victoria / Alcate)";
      const campusCfg = getMinsuCampusConfig(rawCampus);

      return {
        id: app.id,
        controlNumber: controlNum,
        studentNumber: data.student_id || app.student.id,
        tdpAwardNumber: data.tdp_award_number || `2024-TDP-4060-${String(index + 1).padStart(5, "0")}`,
        lastName: (data.last_name || "").toUpperCase(),
        givenName: (data.given_name || "").toUpperCase(),
        middleInitial,
        sex: data.gender === "Female" || data.gender === "F" ? "F" : "M",
        birthdate: data.birthdate || "01/01/2004",
        degreeProgram: data.course_degree || "Bachelor of Science in Information Technology",
        yearLevel: String(data.year_level || "2"),
        email: data.email || app.student.email,
        phone: data.contact_number || "09170000000",
        tdpBatch: String(app.batchNumber || (targetBatches.length > 0 ? targetBatches[0] : 1)),
        semesterAmount: 7500,
        totalAmount: 7500,
        campus: campusCfg.label,
      };
    });

    // If filtered by campus:
    // If specific targetBatches were explicitly requested, each batch is already bound to its campus cohort,
    // so we return the requested batch's candidates without dropping them due to client document campus mismatch.
    // If batchesParam === "ALL" or no specific batch was requested, apply normalized campus filter.
    const filtered =
      campus && campus !== "ALL" && targetBatches.length === 0
        ? candidates.filter((c) => {
            const targetCfg = getMinsuCampusConfig(campus);
            const candCfg = getMinsuCampusConfig(c.campus);
            return targetCfg.key === candCfg.key;
          })
        : candidates;

    return NextResponse.json({
      candidates: filtered,
      count: filtered.length,
      batch: batchesParam,
      batches: targetBatches,
    });
  } catch (error) {
    console.error("Failed to fetch Annex 3 candidate grantees:", error);
    return NextResponse.json(
      { error: "Internal server error fetching candidate grantees" },
      { status: 500 }
    );
  }
}
