import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ApplicationStatus, Role } from "@prisma/client";
import { parsePipeDelimitedCsv } from "@/lib/verification/csv-parser";
import {
  runThreeWayCrossCheck,
  StudentInputRecord,
} from "@/lib/verification/matcher";

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
        { error: "Invalid form data. Please upload files." },
        { status: 400 }
      );
    }

    const chedFile = formData.get("chedFile") as File | null;
    const registrarFile = formData.get("registrarFile") as File | null;
    const systemScope = (formData.get("systemScope") as string) || "ACCEPTED_GRANTEES";
    const customTitle = (formData.get("title") as string)?.trim();

    if (!chedFile || !registrarFile) {
      return NextResponse.json(
        { error: "Both CHED CSV and Registrar CSV files are required." },
        { status: 400 }
      );
    }

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

    // 2. Dynamic Fetching of DocTrack Database Records
    const applicationWhere: any = {};
    if (systemScope === "ACCEPTED_GRANTEES") {
      applicationWhere.status = ApplicationStatus.ACCEPTED;
    }

    const applications = await prisma.application.findMany({
      where: applicationWhere,
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
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

    // 5. Persist Run and Results in PostgreSQL
    const now = new Date();
    const defaultTitle = `Cross-Check ${now.toLocaleDateString()} - ${chedFile.name} vs ${registrarFile.name}`;
    const runTitle = customTitle || defaultTitle;

    const savedRun = await prisma.$transaction(async (tx) => {
      const run = await tx.verificationRun.create({
        data: {
          title: runTitle,
          chedFileName: chedFile.name,
          registrarFileName: registrarFile.name,
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

      return run;
    });

    // 6. Audit Trail Logging (Data Privacy & Compliance)
    await logAudit({
      actorId: user.id,
      action: "VERIFICATION_RUN_COMPLETED",
      entity: "VerificationRun",
      entityId: savedRun.id,
      details: {
        title: runTitle,
        chedFile: chedFile.name,
        registrarFile: registrarFile.name,
        systemScope,
        summary,
      },
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

