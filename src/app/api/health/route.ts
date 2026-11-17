import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ping PostgreSQL to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "minsu-doctrack",
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check database error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "minsu-doctrack",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}

