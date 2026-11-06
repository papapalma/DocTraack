import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notifyAnnouncements: true,
        notifyPush: true,
      },
    });

    return NextResponse.json({
      notifyAnnouncements: dbUser?.notifyAnnouncements ?? true,
      notifyPush: dbUser?.notifyPush ?? false,
    });
  } catch (error) {
    console.error("Fetch user preferences error:", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notifyAnnouncements, notifyPush } = body;

    const dataToUpdate: { notifyAnnouncements?: boolean; notifyPush?: boolean } = {};
    if (typeof notifyAnnouncements === "boolean") {
      dataToUpdate.notifyAnnouncements = notifyAnnouncements;
    }
    if (typeof notifyPush === "boolean") {
      dataToUpdate.notifyPush = notifyPush;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        notifyAnnouncements: true,
        notifyPush: true,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        notifyAnnouncements: updated.notifyAnnouncements,
        notifyPush: updated.notifyPush,
      },
    });
  } catch (error) {
    console.error("Update user preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}

