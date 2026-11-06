import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { parsePipeDelimitedCsv } from "@/lib/verification/csv-parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden: Access restricted to staff" }, { status: 403 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid form data. Please upload CSV files." },
        { status: 400 }
      );
    }

    const chedFile = formData.get("chedFile") as File | null;
    const registrarFile = formData.get("registrarFile") as File | null;

    if (!chedFile || !registrarFile) {
      return NextResponse.json(
        { error: "Both CHED CSV and Registrar CSV files are required." },
        { status: 400 }
      );
    }

    // Limit file size to 10MB to prevent memory exhaustion
    const maxSizeBytes = 10 * 1024 * 1024;
    if (chedFile.size > maxSizeBytes || registrarFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit. Please upload a smaller batch." },
        { status: 400 }
      );
    }

    // Read file contents as UTF-8 in memory (never written to disk)
    const chedText = await chedFile.text();
    const registrarText = await registrarFile.text();

    const chedParseResult = parsePipeDelimitedCsv(chedText, "CHED");
    const registrarParseResult = parsePipeDelimitedCsv(registrarText, "REGISTRAR");

    // Format summary and sample rows for client preview
    const formatSummary = (parseRes: typeof chedParseResult, fileName: string) => ({
      fileName,
      totalLines: parseRes.totalLines,
      validCount: parseRes.validRows.length,
      invalidCount: parseRes.invalidRows.length,
      duplicateCount: parseRes.duplicates.length,
      headerValid: parseRes.headerValid,
      headerColumns: parseRes.headerColumns,
      sampleRows: parseRes.validRows.slice(0, 5),
      invalidRows: parseRes.invalidRows.slice(0, 20), // Show up to 20 errors
      duplicates: parseRes.duplicates.slice(0, 20),
    });

    const chedSummary = formatSummary(chedParseResult, chedFile.name);
    const registrarSummary = formatSummary(registrarParseResult, registrarFile.name);

    const readyToCompare =
      chedParseResult.headerValid &&
      registrarParseResult.headerValid &&
      chedParseResult.validRows.length > 0 &&
      registrarParseResult.validRows.length > 0;

    return NextResponse.json({
      readyToCompare,
      chedSummary,
      registrarSummary,
    });
  } catch (error) {
    console.error("Verification preview error:", error);
    return NextResponse.json(
      { error: "Failed to parse files. Ensure files are valid pipe-delimited text." },
      { status: 500 }
    );
  }
}

