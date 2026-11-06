import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden: Access restricted to staff" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { resultId, action, notes } = body;

    if (!resultId || !action || !["CONFIRM", "DISMISS"].includes(action)) {
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

    let newStatus = result.status;
    let runUpdateData: any = {};

    if (action === "CONFIRM") {
      // If confirmed match: student is enrolled in Registrar
      newStatus = result.inSystem ? "FULLY_VERIFIED" : "NEEDS_ENCODING";
      runUpdateData = {
        possibleMatchCount: { decrement: 1 },
        ...(result.inSystem
          ? { fullyVerifiedCount: { increment: 1 } }
          : { needsEncodingCount: { increment: 1 } }),
      };
    } else {
      // If dismissed: student is not officially enrolled in Registrar
      newStatus = "NOT_ENROLLED";
      runUpdateData = {
        possibleMatchCount: { decrement: 1 },
        notEnrolledCount: { increment: 1 },
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.verificationResult.update({
        where: { id: resultId },
        data: {
          status: newStatus,
          isManuallyResolved: true,
          resolvedStatus: action,
          resolvedNotes: notes || null,
          inRegistrar: action === "CONFIRM",
        },
      });

      await tx.verificationRun.update({
        where: { id },
        data: runUpdateData,
      });

      return updatedItem;
    });

    await logAudit({
      actorId: user.id,
      action: "VERIFICATION_MATCH_RESOLVED",
      entity: "VerificationResult",
      entityId: resultId,
      details: {
        runId: id,
        studentName: `${result.lastName}, ${result.firstName}`,
        previousStatus: result.status,
        newStatus,
        action,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      result: updated,
    });
  } catch (error) {
    console.error("Resolve match error:", error);
    return NextResponse.json(
      { error: "Failed to resolve match" },
      { status: 500 }
    );
  }
}

