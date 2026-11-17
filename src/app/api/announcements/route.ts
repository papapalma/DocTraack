import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAnnouncements } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { safeJsonObject, sanitizeText } from "@/lib/validation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const take = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 50;

    const where: any = {};

    // Audience filtering based on authentication and role
    if (!user) {
      where.targetAudience = { in: ["ALL", "PUBLIC"] };
    } else if (user.role === Role.STUDENT) {
      where.targetAudience = { in: ["ALL", "STUDENTS", "PUBLIC"] };
    }
    // Staff, Director, and System Admin see all target audiences

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take,
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

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve announcements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnouncements(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only staff coordinators and campus administrators can publish announcements." },
        { status: 403 }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const title = typeof body.title === "string" ? sanitizeText(body.title, 200).trim() : "";
    const content = typeof body.content === "string" ? sanitizeText(body.content, 5000).trim() : "";
    const category = typeof body.category === "string" ? body.category : "GENERAL";
    const isPinned = Boolean(body.isPinned);
    const targetAudience = typeof body.targetAudience === "string" ? body.targetAudience : "ALL";

    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: "Title is required and must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!content || content.length < 5) {
      return NextResponse.json(
        { error: "Content is required and must be at least 5 characters." },
        { status: 400 }
      );
    }

    const validCategories = ["GENERAL", "URGENT", "DEADLINE", "REQUIREMENTS", "PAYROLL"];
    const finalCategory = validCategories.includes(category) ? category : "GENERAL";

    const validAudiences = ["ALL", "STUDENTS", "PUBLIC"];
    const finalAudience = validAudiences.includes(targetAudience) ? targetAudience : "ALL";

    // 1. Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category: finalCategory,
        isPinned,
        targetAudience: finalAudience,
        authorId: user.id,
      },
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

    // 2. Automatic Notification Dispatch for Students who opted in
    if (finalAudience === "ALL" || finalAudience === "STUDENTS") {
      try {
        const subscribedStudents = await prisma.user.findMany({
          where: {
            role: Role.STUDENT,
            active: true,
            notifyAnnouncements: true,
          },
          select: { id: true },
        });

        if (subscribedStudents.length > 0) {
          const previewText =
            content.length > 120 ? `${content.substring(0, 117)}...` : content;

          const notificationsData = subscribedStudents.map((s) => ({
            userId: s.id,
            title: isPinned
              ? `📌 Important Notice: ${title}`
              : `📢 New TDP Announcement: ${title}`,
            message: previewText,
            link: "/portal/announcements",
          }));

          await prisma.notification.createMany({
            data: notificationsData,
          });
        }
      } catch (notifErr) {
        console.error("Failed to dispatch student notifications:", notifErr);
      }
    }

    // 3. Audit Log
    await logAudit({
      actorId: user.id,
      action: "ANNOUNCEMENT_CREATED",
      entity: "ANNOUNCEMENT",
      entityId: announcement.id,
      details: {
        title: announcement.title,
        category: announcement.category,
        isPinned: announcement.isPinned,
        targetAudience: announcement.targetAudience,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

