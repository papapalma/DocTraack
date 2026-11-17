import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessDocument } from "@/lib/rbac";
import { safeJsonObject, sanitizeText } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { Role } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT" || user.role === "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only operational roles can comment on annex documents." },
        { status: 403 }
      );
    }

    const rateCheck = checkRateLimit(`comment:${user.id}`, {
      limit: 20,
      windowMs: 60000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many comments submitted. Please slow down." },
        { status: 429 }
      );
    }

    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdById: true,
        annexType: { select: { number: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (
      !canAccessDocument(
        { id: user.id, role: user.role as Role },
        doc
      )
    ) {
      return NextResponse.json(
        { error: "Access denied for commenting on this document." },
        { status: 403 }
      );
    }

    const payload = await safeJsonObject(req);
    const body = payload?.body;
    const cleanBody = typeof body === "string" ? sanitizeText(body, 2000) : "";

    if (!cleanBody) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        documentId: id,
        authorId: user.id,
        body: cleanBody,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
