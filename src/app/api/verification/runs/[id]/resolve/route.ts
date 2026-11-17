import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { safeJsonObject, sanitizeText } from "@/lib/validation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

class AlreadyResolvedError extends Error {}

export async function POST(
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
        { error: "Forbidden: Discrepancy resolution is restricted to operational staff" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const resultId = typeof body.resultId === "string" ? body.resultId.trim() : "";
    const action = body.action;
    const cleanNotes = typeof body.notes === "string" ? sanitizeText(body.notes, 500) : "";

    if (!resultId || (action !== "CONFIRM" && action !== "DISMISS")) {
      return NextResponse.json(
        { error: "Invalid request. 'resultId' and 'action' ('CONFIRM' or 'DISMISS') are required." },
        { status: 400 }
      );
    }

    const result = await prisma.verificationResult.findFirst({
      where: { id: resultId, runId: id },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Verification result item not found in this run" },
        { status: 404 }
      );
    }

    if (result.status !== "POSSIBLE_MATCH" || result.isManuallyResolved) {
      return NextResponse.json(
        { error: "Only unresolved possible matches can be resolved" },
        { status: 409 }
      );
    }

    const newStatus =
      action === "CONFIRM"
        ? result.inSystem
          ? "FULLY_VERIFIED"
          : "NEEDS_ENCODING"
        : "NOT_ENROLLED";

    const runUpdateData =
      action === "CONFIRM"
        ? {
            possibleMatchCount: { decrement: 1 },
            ...(result.inSystem
              ? { fullyVerifiedCount: { increment: 1 } }
              : { needsEncodingCount: { increment: 1 } }),
          }
        : {
            possibleMatchCount: { decrement: 1 },
            notEnrolledCount: { increment: 1 },
          };

    const updated = await prisma.$transaction(async (tx) => {
      const claim = await tx.verificationResult.updateMany({
        where: {
          id: resultId,
          runId: id,
          status: "POSSIBLE_MATCH",
          isManuallyResolved: false,
        },
        data: {
          status: newStatus,
          isManuallyResolved: true,
          resolvedStatus: action,
          resolvedNotes: cleanNotes || null,
          inRegistrar: action === "CONFIRM",
        },
      });

      if (claim.count === 0) {
        throw new AlreadyResolvedError("Verification item was already resolved concurrently");
      }

      await tx.verificationRun.update({
        where: { id },
        data: runUpdateData,
      });

      await writeAuditTx(tx, {
        actorId: user.id,
        action: "VERIFICATION_MATCH_RESOLVED",
        entity: "VerificationResult",
        entityId: resultId,
        req,
        details: {
          runId: id,
          studentName: `${result.lastName}, ${result.firstName}`,
          previousStatus: result.status,
          newStatus,
          action,
          notes: cleanNotes || null,
        },
      });

      return tx.verificationResult.findUnique({ where: { id: resultId } });
    });

    return NextResponse.json({
      success: true,
      result: updated,
    });
  } catch (error) {
    if (error instanceof AlreadyResolvedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Resolve match error:", error);
    return NextResponse.json(
      { error: "Failed to resolve match" },
      { status: 500 }
    );
  }
}

