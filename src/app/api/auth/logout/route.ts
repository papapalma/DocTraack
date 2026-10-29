import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAudit({
        actorId: user.id,
        action: "USER_LOGOUT",
        entity: "user",
        entityId: user.id,
        details: { email: user.email, role: user.role },
      });
    }

    await destroySession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout" },
      { status: 500 }
    );
  }
}
