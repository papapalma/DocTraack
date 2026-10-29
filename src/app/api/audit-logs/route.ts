import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: System Administrator access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      200,
      Math.max(10, parseInt(searchParams.get("limit") || "25", 10))
    );
    const search = searchParams.get("search")?.trim() || "";
    const entity = searchParams.get("entity")?.trim() || "all";
    const category = searchParams.get("category")?.trim() || "all";
    const dateRange = searchParams.get("dateRange")?.trim() || "all";
    const isExport = searchParams.get("export") === "true";

    // Build Prisma where filter
    const whereConditions: Prisma.AuditLogWhereInput[] = [];

    // Entity filter
    if (entity !== "all" && entity !== "") {
      whereConditions.push({
        entity: { equals: entity, mode: "insensitive" },
      });
    }

    // Action Category filter
    if (category !== "all" && category !== "") {
      switch (category.toUpperCase()) {
        case "AUTH":
          whereConditions.push({
            action: { in: ["USER_LOGIN", "USER_LOGOUT", "USER_REGISTERED"] },
          });
          break;
        case "DOCUMENT":
          whereConditions.push({
            action: { startsWith: "DOCUMENT_" },
          });
          break;
        case "USER":
          whereConditions.push({
            action: { in: ["USER_CREATED", "USER_UPDATED", "USER_DELETED"] },
          });
          break;
        case "LANDING":
          whereConditions.push({
            action: { startsWith: "LANDING_" },
          });
          break;
        default:
          break;
      }
    }

    // Date range filter
    const now = new Date();
    if (dateRange === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereConditions.push({
        createdAt: { gte: startOfDay },
      });
    } else if (dateRange === "7d") {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereConditions.push({
        createdAt: { gte: past7d },
      });
    } else if (dateRange === "30d") {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      whereConditions.push({
        createdAt: { gte: past30d },
      });
    }

    // Search query across action, entityId, actor name, or actor email
    if (search) {
      whereConditions.push({
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          {
            actor: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    const where: Prisma.AuditLogWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    // For full export requests, limit to the most recent 1000 matching rows
    const take = isExport ? 1000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    // Start of today for KPI metrics
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Run parallel queries for data and KPI metrics
    const [logs, totalCount, totalEvents, todayEvents, authEvents, distinctActors] =
      await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.auditLog.count({ where }),
        prisma.auditLog.count(),
        prisma.auditLog.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.auditLog.count({
          where: {
            action: { in: ["USER_LOGIN", "USER_LOGOUT", "USER_REGISTERED"] },
          },
        }),
        prisma.auditLog.groupBy({
          by: ["actorId"],
        }),
      ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page: isExport ? 1 : page,
        limit: take,
        totalCount,
        totalPages: totalPages || 1,
      },
      metrics: {
        totalEvents,
        todayEvents,
        activeActors: distinctActors.length,
        authEvents,
      },
    });
  } catch (error) {
    console.error("Audit log API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
