import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role, ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR && user.role !== Role.ACCOUNTING) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient privileges" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch") || "3";
    const campus = searchParams.get("campus");

    // Fetch accepted applications as candidate continuing grantees
    const applications = await prisma.application.findMany({
      where: {
        status: ApplicationStatus.ACCEPTED,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: "asc" },
    });

    const candidates = applications.map((app, index) => {
      const data = (app.formData as any) || {};
      const controlNum = String(index + 1).padStart(5, "0");
      const middleInitial = data.middle_name ? `${data.middle_name.charAt(0).toUpperCase()}.` : "";
      const rawCampus = data.hei_campus || "Main Campus (Victoria / Alcate)";

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
        tdpBatch: batch,
        semesterAmount: 7500,
        totalAmount: 7500,
        campus: rawCampus,
      };
    });

    // If filtered by campus
    const filtered = campus && campus !== "ALL"
      ? candidates.filter((c) => c.campus.toLowerCase().includes(campus.toLowerCase()))
      : candidates;

    return NextResponse.json({
      candidates: filtered,
      count: filtered.length,
      batch,
    });
  } catch (error) {
    console.error("Failed to fetch Annex 3 candidate grantees:", error);
    return NextResponse.json(
      { error: "Internal server error fetching candidate grantees" },
      { status: 500 }
    );
  }
}
