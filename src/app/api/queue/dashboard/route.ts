import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canOperateQueue } from "@/lib/rbac";
import { getStaffQueueDashboard } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canOperateQueue(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Staff or officer role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");
    const dashboard = await getStaffQueueDashboard(campus);
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Queue dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load queue dashboard" },
      { status: 500 }
    );
  }
}

