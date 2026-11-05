import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getGlobalBranding,
  saveGlobalBranding,
  removeLogoFromLibrary,
} from "@/lib/branding";
import { logAudit } from "@/lib/audit";
import { HeaderLogosConfig } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branding = await getGlobalBranding();
    return NextResponse.json({
      logos: branding,
      library: branding.library || [],
    });
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

    if (!body || (!body.leftLogo && !body.rightLogo && !body.library)) {
      return NextResponse.json({ error: "Invalid branding configuration" }, { status: 400 });
    }

    const current = await getGlobalBranding();
    const updated: HeaderLogosConfig = {
      leftLogo: body.leftLogo || current.leftLogo,
      rightLogo: body.rightLogo || current.rightLogo,
      library: body.library || current.library || [],
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

    return NextResponse.json({
      success: true,
      logos: updated,
      library: updated.library || [],
    });
  } catch (error) {
    console.error("Update branding error:", error);
    return NextResponse.json(
      { error: "Failed to update branding configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SYSTEM_ADMIN" && user.role !== "DIRECTOR") {
      return NextResponse.json(
        { error: "Access denied. Only Administrators and Campus Directors can manage the logo library." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing logo ID" }, { status: 400 });
    }

    await removeLogoFromLibrary(id);
    const updated = await getGlobalBranding();

    await logAudit({
      actorId: user.id,
      action: "LOGO_LIBRARY_ITEM_REMOVED",
      entity: "LOGO_LIBRARY",
      entityId: id,
      details: { removedId: id },
    });

    return NextResponse.json({
      success: true,
      logos: updated,
      library: updated.library || [],
    });
  } catch (error) {
    console.error("Delete logo error:", error);
    return NextResponse.json(
      { error: "Failed to remove logo from library" },
      { status: 500 }
    );
  }
}
