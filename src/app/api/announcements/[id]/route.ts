import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAnnouncements } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { safeJsonObject, sanitizeText } from "@/lib/validation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (!user && !["ALL", "PUBLIC"].includes(announcement.targetAudience)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user?.role === Role.STUDENT && !["ALL", "STUDENTS", "PUBLIC"].includes(announcement.targetAudience)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Get announcement error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve announcement" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnouncements(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify announcements." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const sanitized = typeof body.title === "string" ? sanitizeText(body.title, 200).trim() : "";
      if (sanitized.length < 3) {
        return NextResponse.json(
          { error: "Title must be at least 3 characters." },
          { status: 400 }
        );
      }
      updateData.title = sanitized;
    }

    if (body.content !== undefined) {
      const sanitized = typeof body.content === "string" ? sanitizeText(body.content, 5000).trim() : "";
      if (sanitized.length < 5) {
        return NextResponse.json(
          { error: "Content must be at least 5 characters." },
          { status: 400 }
        );
      }
      updateData.content = sanitized;
    }

    if (body.category !== undefined) {
      const validCategories = ["GENERAL", "URGENT", "DEADLINE", "REQUIREMENTS", "PAYROLL"];
      updateData.category = typeof body.category === "string" && validCategories.includes(body.category)
        ? body.category
        : "GENERAL";
    }

    if (body.isPinned !== undefined) {
      updateData.isPinned = Boolean(body.isPinned);
    }

    if (body.targetAudience !== undefined) {
      const validAudiences = ["ALL", "STUDENTS", "PUBLIC"];
      updateData.targetAudience =
        typeof body.targetAudience === "string" && validAudiences.includes(body.targetAudience)
          ? body.targetAudience
          : "ALL";
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "ANNOUNCEMENT_UPDATED",
      entity: "ANNOUNCEMENT",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ announcement: updated });
  } catch (error) {
    console.error("Update announcement error:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
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

    if (!canManageAnnouncements(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete announcements." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    await logAudit({
      actorId: user.id,
      action: "ANNOUNCEMENT_DELETED",
      entity: "ANNOUNCEMENT",
      entityId: id,
      details: {
        title: existing.title,
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

