import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function getStatusLabel(status: string): string {
  switch (status) {
    case "FULLY_VERIFIED":
      return "Fully Verified (Enrolled + Scholar + in System)";
    case "NEEDS_ENCODING":
      return "Needs Encoding (Enrolled + Scholar + Not in System)";
    case "NOT_ENROLLED":
      return "Flag for Review (Not Enrolled + CHED Scholar)";
    case "SYSTEM_DISCREPANCY":
      return "Possible Discrepancy (In System only)";
    case "POSSIBLE_MATCH":
      return "Possible Match (Fuzzy Match - Needs Review)";
    case "ENROLLED_NON_SCHOLAR":
      return "Enrolled Non-Scholar (Registrar only)";
    default:
      return status;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "excel").toLowerCase();
    const statusFilter = searchParams.get("status");
    const schoolFilter = searchParams.get("school");
    const searchQuery = (searchParams.get("search") || "").trim();

    const run = await prisma.verificationRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Verification run not found" },
        { status: 404 }
      );
    }

    const whereClause: any = { runId: id };

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (schoolFilter && schoolFilter !== "ALL") {
      whereClause.school = { contains: schoolFilter, mode: "insensitive" };
    }

    if (searchQuery) {
      whereClause.OR = [
        { lastName: { contains: searchQuery, mode: "insensitive" } },
        { firstName: { contains: searchQuery, mode: "insensitive" } },
        { middleName: { contains: searchQuery, mode: "insensitive" } },
        { studentIdNo: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const results = await prisma.verificationResult.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    });

    const safeTitle = (run.title || "Cross_Check_Results")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    // -------------------------------------------------------------
    // EXCEL EXPORT (.xlsx) — Tabular 3-Form Report
    // -------------------------------------------------------------
    if (format === "excel" || format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "MinSU DocTrack Verification Engine";
      workbook.created = new Date();

      const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: "FFD6DDD8" } },
        left: { style: "thin", color: { argb: "FFD6DDD8" } },
        bottom: { style: "thin", color: { argb: "FFD6DDD8" } },
        right: { style: "thin", color: { argb: "FFD6DDD8" } },
      };

      // Helper to build a form worksheet
      const buildSheet = (
        sheetName: string,
        items: typeof results,
        headerColorArgb: string,
        extraColumnHeader?: string,
        extraColumnExtractor?: (item: (typeof results)[0]) => string
      ) => {
        const ws = workbook.addWorksheet(sheetName, {
          views: [{ showGridLines: true }],
        });

        const headerFill: ExcelJS.Fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: headerColorArgb },
        };

        const headers = [
          "SEQ",
          "STATUS",
          "REGISTRAR ID NUMBER",
          "LAST NAME",
          "FIRST NAME",
          "MIDDLE NAME",
          "SCHOOL / CAMPUS",
          "IN CHED",
          "IN REGISTRAR",
          "IN SYSTEM",
          ...(extraColumnHeader ? [extraColumnHeader] : []),
          "CONFIDENCE SCORE",
          "NOTES / REMARKS",
        ];

        const headerRow = ws.addRow(headers);
        headerRow.height = 26;

        headerRow.eachCell((cell) => {
          cell.fill = headerFill;
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = borderStyle;
        });

        items.forEach((item, idx) => {
          const details = (item.matchDetails as any) || {};
          const scoreStr = item.confidenceScore
            ? `${Math.round(item.confidenceScore * 100)}%`
            : "-";
          const extraVal = extraColumnExtractor ? [extraColumnExtractor(item)] : [];

          const rowValues = [
            idx + 1,
            getStatusLabel(item.status),
            item.studentIdNo || "N/A",
            item.lastName,
            item.firstName,
            item.middleName || "",
            item.school,
            item.inChed ? "YES" : "NO",
            item.inRegistrar ? "YES" : "NO",
            item.inSystem ? "YES" : "NO",
            ...extraVal,
            scoreStr,
            details.notes || (item.resolvedNotes ? `Resolved: ${item.resolvedNotes}` : ""),
          ];

          const row = ws.addRow(rowValues);
          row.height = 20;

          row.eachCell((cell, colNumber) => {
            cell.font = { name: "Arial", size: 9 };
            cell.border = borderStyle;

            if ([1, 3, 8, 9, 10].includes(colNumber)) {
              cell.alignment = { vertical: "middle", horizontal: "center" };
            } else {
              cell.alignment = { vertical: "middle", horizontal: "left" };
            }
          });
        });

        ws.columns = [
          { width: 8 },  // SEQ
          { width: 34 }, // STATUS
          { width: 22 }, // ID NUMBER
          { width: 18 }, // LAST NAME
          { width: 20 }, // FIRST NAME
          { width: 16 }, // MIDDLE NAME
          { width: 36 }, // SCHOOL
          { width: 10 }, // IN CHED
          { width: 14 }, // IN REGISTRAR
          { width: 12 }, // IN SYSTEM
          ...(extraColumnHeader ? [{ width: 34 }] : []),
          { width: 18 }, // CONFIDENCE SCORE
          { width: 45 }, // NOTES
        ];
      };

      // 1. Form 1: Enrolled Scholars (FULLY_VERIFIED + NEEDS_ENCODING)
      const form1Items = results.filter(
        (r) => r.status === "FULLY_VERIFIED" || r.status === "NEEDS_ENCODING"
      );
      buildSheet(
        "1 - Enrolled Scholars",
        form1Items,
        "FF1B5E20",
        "ENROLLMENT VERIFICATION",
        () => "Officially Enrolled & Verified Scholar"
      );

      // 2. Form 2: Scholars Not Enrolled (NOT_ENROLLED)
      const form2Items = results.filter((r) => r.status === "NOT_ENROLLED");
      buildSheet(
        "2 - Scholars Not Enrolled",
        form2Items,
        "FFB3261E",
        "DISCREPANCY ACTION",
        () => "Flag for Review: Scholar absent from enrollment"
      );

      // 3. Form 3: Enrolled Non-Scholars (ENROLLED_NON_SCHOLAR)
      const form3Items = results.filter((r) => r.status === "ENROLLED_NON_SCHOLAR");
      buildSheet(
        "3 - Enrolled Non-Scholars",
        form3Items,
        "FF123F17",
        "CERTIFICATION OF NO OTHER SCHOLAR",
        () => "Verified Enrolled • Certified No Other Scholarship"
      );

      // 4. Form 4: Full Summary / All Records
      buildSheet("All Cross-Check Results", results, "FF374151");

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${safeTitle}_3Forms.xlsx"`,
        },
      });
    }

    // -------------------------------------------------------------
    // CSV EXPORT (.csv)
    // -------------------------------------------------------------
    const csvHeader =
      "SEQ|STATUS|IDNUMBER|LASTNAME|FIRSTNAME|MIDDLENAME|SCHOOL|IN_CHED|IN_REGISTRAR|IN_SYSTEM|CONFIDENCE|CERTIFICATION_NOTE|NOTES\r\n";
    const csvRows = results
      .map((item, idx) => {
        const details = (item.matchDetails as any) || {};
        const scoreStr = item.confidenceScore
          ? `${Math.round(item.confidenceScore * 100)}%`
          : "";
        const certNote =
          item.status === "ENROLLED_NON_SCHOLAR"
            ? "VERIFIED_NO_OTHER_SCHOLARSHIP"
            : item.status === "FULLY_VERIFIED"
            ? "ENROLLED_AND_SCHOLAR"
            : item.status === "NOT_ENROLLED"
            ? "SCHOLAR_NOT_ENROLLED"
            : "OTHER";
        const cleanNotes = (details.notes || item.resolvedNotes || "").replace(/[|\r\n]/g, " ");

        return [
          idx + 1,
          item.status,
          item.studentIdNo || "",
          item.lastName,
          item.firstName,
          item.middleName || "",
          item.school,
          item.inChed ? "YES" : "NO",
          item.inRegistrar ? "YES" : "NO",
          item.inSystem ? "YES" : "NO",
          scoreStr,
          certNote,
          cleanNotes,
        ].join("|");
      })
      .join("\r\n");

    const fullCsv = csvHeader + csvRows;

    return new NextResponse(fullCsv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export verification results error:", error);
    return NextResponse.json(
      { error: "Failed to export verification results" },
      { status: 500 }
    );
  }
}
