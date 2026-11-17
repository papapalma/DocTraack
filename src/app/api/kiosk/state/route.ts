import { NextRequest, NextResponse } from "next/server";
import { getPublicKioskState } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");
    const state = await getPublicKioskState(campus);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to retrieve public kiosk state:", error);
    return NextResponse.json(
      { error: "Failed to load kiosk queue state" },
      { status: 500 }
    );
  }
}

