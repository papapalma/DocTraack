import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGlobalBranding, saveGlobalBranding } from "@/lib/branding";
import { logAudit } from "@/lib/audit";
import { HeaderLogosConfig } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logos = await getGlobalBranding();
    return NextResponse.json({ logos });
  } catch (error) {
    console.error("Fetch branding error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve branding settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and Campus Director can change global institutional branding
    if (user.role !== "SYSTEM_ADMIN" && user.role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Access denied. Only Administrators and Campus Directors can change global branding." },
        { status: 403 }
      );
    }

    const body: HeaderLogosConfig = await req.json();

    if (!body || (!body.leftLogo && !body.rightLogo)) {
      return NextResponse.json({ error: "Invalid branding configuration" }, { status: 400 });
    }

    const current = await getGlobalBranding();
    const updated: HeaderLogosConfig = {
      leftLogo: body.leftLogo || current.leftLogo,
      rightLogo: body.rightLogo || current.rightLogo,
    };

    const saved = await saveGlobalBranding(updated);
    if (!saved) {
      return NextResponse.json(
        { error: "Failed to write branding settings to disk" },
        { status: 500 }
      );
    }

    await logAudit({
      actorId: user.id,
      action: "GLOBAL_BRANDING_UPDATED",
      entity: "SYSTEM_BRANDING",
      entityId: "global",
      details: { updated },
    });

    return NextResponse.json({ success: true, logos: updated });
  } catch (error) {
    console.error("Update branding error:", error);
    return NextResponse.json(
      { error: "Failed to update branding configuration" },
      { status: 500 }
    );
  }
}

