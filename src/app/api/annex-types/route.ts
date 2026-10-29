import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const annexTypes = await prisma.annexType.findMany({
      orderBy: { number: "asc" },
    });

    return NextResponse.json({ annexTypes });
  } catch (error) {
    console.error("Fetch annex types error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve annex types" },
      { status: 500 }
    );
  }
}
