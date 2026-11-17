import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { sanitizeDownloadFilename, sanitizeText } from "@/lib/validation";
import { ApplicationStatus, Role } from "@prisma/client";
import { parsePipeDelimitedCsv } from "@/lib/verification/csv-parser";
import {
  runThreeWayCrossCheck,
  StudentInputRecord,
} from "@/lib/verification/matcher";

export const dynamic = "force-dynamic";

const MAX_CSV_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_CSV_ROWS = 15000;
const ALLOWED_SCOPES = new Set(["ACCEPTED_GRANTEES", "ALL_APPLICATIONS"]);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        { error: "Forbidden: Verification is restricted to TDP Staff and Campus Director" },
        { status: 403 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid form data. Please upload files." },
        { status: 400 }
      );
    }

    const chedFile = formData.get("chedFile") as File | null;
    const registrarFile = formData.get("registrarFile") as File | null;
    const rawScope = formData.get("systemScope");
    const systemScope =
      typeof rawScope === "string" && ALLOWED_SCOPES.has(rawScope)
        ? rawScope
        : "ACCEPTED_GRANTEES";
    const rawTitle = formData.get("title");
    const customTitle = typeof rawTitle === "string" ? sanitizeText(rawTitle, 140) : "";

    if (!chedFile || !registrarFile || !(chedFile instanceof File) || !(registrarFile instanceof File)) {
      return NextResponse.json(
        { error: "Both CHED CSV and Registrar CSV files are required." },
        { status: 400 }
      );
    }

    if (chedFile.size > MAX_CSV_BYTES || registrarFile.size > MAX_CSV_BYTES) {
      return NextResponse.json(
        { error: "CSV files must not exceed 10 MB each." },
        { status: 413 }
      );
    }

    const safeChedName = sanitizeDownloadFilename(chedFile.name || "ched.csv", "ched.csv");
    const safeRegistrarName = sanitizeDownloadFilename(registrarFile.name || "registrar.csv", "registrar.csv");

    // 1. In-memory Parsing of CSV Files
    const chedText = await chedFile.text();
    const registrarText = await registrarFile.text();

    const chedParsed = parsePipeDelimitedCsv(chedText, "CHED");
    const registrarParsed = parsePipeDelimitedCsv(registrarText, "REGISTRAR");

    if (!chedParsed.headerValid || !registrarParsed.headerValid) {
      return NextResponse.json(
        {
          error: "Header validation failed. Please use the official pipe-delimited templates.",
        },
        { status: 400 }
      );
    }

    if (chedParsed.validRows.length === 0) {
      return NextResponse.json(
        { error: "CHED CSV contains no valid data rows." },
        { status: 400 }
      );
    }

    if (registrarParsed.validRows.length === 0) {
      return NextResponse.json(
        { error: "Registrar CSV contains no valid data rows." },
        { status: 400 }
      );
    }

    if (chedParsed.validRows.length > MAX_CSV_ROWS || registrarParsed.validRows.length > MAX_CSV_ROWS) {
      return NextResponse.json(
        { error: `CSV files exceed maximum supported row limit of ${MAX_CSV_ROWS}.` },
        { status: 400 }
      );
    }

    // 2. Dynamic Fetching of DocTrack Database Records (bounded)
    const applicationWhere: { status?: ApplicationStatus } = {};
    if (systemScope === "ACCEPTED_GRANTEES") {
      applicationWhere.status = ApplicationStatus.ACCEPTED;
    }

    const applications = await prisma.application.findMany({
      where: applicationWhere,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      take: 10000,
    });

    const systemRecords: StudentInputRecord[] = applications
      .map((app) => {
        const d = (app.formData as any) || {};
        let lastName = d.last_name || "";
        let firstName = d.given_name || "";
        let middleName = d.middle_name || "";

        if ((!lastName || !firstName) && app.student?.name) {
          const parts = app.student.name.trim().split(/\s+/);
          if (parts.length === 1) {
            firstName = parts[0];
            lastName = parts[0];
          } else {
            lastName = parts[parts.length - 1];
            firstName = parts.slice(0, parts.length - 1).join(" ");
          }
        }

        return {
          lastName,
          firstName,
          middleName,
          school:
            d.hei_campus ||
            d.campus ||
            d.hei_name ||
            "Mindoro State University - Bongabong Campus",
          idNumber: d.student_id || d.student_id_number || app.student.id,
        };
      })
      .filter((r) => r.lastName.trim() && r.firstName.trim());

    // 3. Convert CSV rows to StudentInputRecord format
    const chedRecords: StudentInputRecord[] = chedParsed.validRows.map((r) => ({
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName || null,
      school: r.school,
      sourceLineNumber: r.lineNumber,
    }));

    const registrarRecords: StudentInputRecord[] = registrarParsed.validRows.map((r) => ({
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName || null,
      school: r.school,
      idNumber: r.idNumber || null,
      sourceLineNumber: r.lineNumber,
    }));

    // 4. Execute 3-Way Cross-Check Matching Algorithm
    const crossCheckOutput = runThreeWayCrossCheck({
      chedRecords,
      registrarRecords,
      systemRecords,
      fuzzyThreshold: 0.85,
    });

    const { results, summary } = crossCheckOutput;

    // 5. Persist Run, Results, and Audit Log atomically in PostgreSQL
    const now = new Date();
    const defaultTitle = `Cross-Check ${now.toLocaleDateString()} - ${safeChedName} vs ${safeRegistrarName}`;
    const runTitle = customTitle || defaultTitle;

    const savedRun = await prisma.$transaction(async (tx) => {
      const run = await tx.verificationRun.create({
        data: {
          title: runTitle,
          chedFileName: safeChedName,
          registrarFileName: safeRegistrarName,
          systemDataSource: systemScope,
          totalChedRows: summary.totalChed,
          totalRegistrarRows: summary.totalRegistrar,
          totalSystemRows: summary.totalSystem,
          fullyVerifiedCount: summary.fullyVerified,
          needsEncodingCount: summary.needsEncoding,
          notEnrolledCount: summary.notEnrolled,
          systemDiscrepancyCount: summary.systemDiscrepancy,
          possibleMatchCount: summary.possibleMatch,
          enrolledNonScholarCount: summary.enrolledNonScholar,
          createdById: user.id,
        },
      });

      // Bulk create verification results in chunks to prevent PostgreSQL parameter limits
      const chunkSize = 200;
      for (let i = 0; i < results.length; i += chunkSize) {
        const chunk = results.slice(i, i + chunkSize);
        await tx.verificationResult.createMany({
          data: chunk.map((item) => ({
            runId: run.id,
            status: item.status,
            studentIdNo: item.studentIdNo || null,
            lastName: item.lastName,
            firstName: item.firstName,
            middleName: item.middleName || null,
            school: item.school,
            inChed: item.inChed,
            inRegistrar: item.inRegistrar,
            inSystem: item.inSystem,
            confidenceScore: item.confidenceScore || null,
            matchDetails: item.matchDetails ? (item.matchDetails as any) : undefined,
          })),
        });
      }

      await writeAuditTx(tx, {
        actorId: user.id,
        action: "VERIFICATION_RUN_COMPLETED",
        entity: "VerificationRun",
        entityId: run.id,
        req,
        details: {
          title: runTitle,
          chedFile: safeChedName,
          registrarFile: safeRegistrarName,
          systemScope,
          summary,
        },
      });

      return run;
    });

    return NextResponse.json({
      success: true,
      runId: savedRun.id,
      summary,
    });
  } catch (error) {
    console.error("Verification run execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute cross-check. Please try again." },
      { status: 500 }
    );
  }
}

