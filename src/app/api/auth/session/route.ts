import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401, headers: { "Cache-Control": "no-store, private" } }
      );
    }
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { user: null },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }
}
