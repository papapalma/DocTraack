import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const calls = await prisma.applicantCall.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("Fetch calls error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve applicant calls" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { title, description, deadline, formSchema } = await req.json();

    if (!title || !deadline) {
      return NextResponse.json(
        { error: "Title and deadline are required" },
        { status: 400 }
      );
    }

    const newCall = await prisma.applicantCall.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        formSchema: formSchema || { fields: [] },
        createdById: user.id,
      },
    });

    return NextResponse.json({ call: newCall }, { status: 201 });
  } catch (error) {
    console.error("Create call error:", error);
    return NextResponse.json(
      { error: "Failed to create applicant call" },
      { status: 500 }
    );
  }
}
