import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getGlobalBranding,
  saveGlobalBranding,
  removeLogoFromLibrary,
} from "@/lib/branding";
import { logAudit } from "@/lib/audit";
import {
  parseSafeAssetUrl,
  safeJsonObject,
  sanitizeText,
} from "@/lib/validation";
import { HeaderLogosConfig, LogoConfig, LogoLibraryItem, LogoPresetId } from "@/types";

export const dynamic = "force-dynamic";

const ALLOWED_PRESETS = new Set<LogoPresetId>(["ched", "unifast", "minsu", "none"]);

function sanitizeLogo(raw: unknown): LogoConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type === "preset" ? "preset" : obj.type === "custom" ? "custom" : null;
  if (!type) return null;
  const safeUrl = obj.url !== undefined ? parseSafeAssetUrl(obj.url) : undefined;
  if (type === "custom" && !safeUrl) return null;
  const presetId =
    typeof obj.presetId === "string" && ALLOWED_PRESETS.has(obj.presetId as LogoPresetId)
      ? (obj.presetId as LogoPresetId)
      : undefined;
  return {
    type,
    ...(presetId ? { presetId } : {}),
    ...(safeUrl ? { url: safeUrl } : {}),
    ...(typeof obj.alt === "string" ? { alt: sanitizeText(obj.alt, 120) } : {}),
  };
}

function sanitizeLibrary(raw: unknown): LogoLibraryItem[] | null {
  if (!Array.isArray(raw)) return null;
  const clean: LogoLibraryItem[] = [];
  for (const item of raw.slice(0, 100)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;
    const safeUrl = parseSafeAssetUrl(obj.url);
    const id = typeof obj.id === "string" ? sanitizeText(obj.id, 80) : "";
    const name = typeof obj.name === "string" ? sanitizeText(obj.name, 120) : "";
    if (!safeUrl || !id || !name) continue;
    const pos =
      obj.positionPreference === "left" ||
      obj.positionPreference === "right" ||
      obj.positionPreference === "both"
        ? obj.positionPreference
        : undefined;
    clean.push({
      id,
      name,
      url: safeUrl,
      uploadedAt:
        typeof obj.uploadedAt === "string"
          ? sanitizeText(obj.uploadedAt, 40)
          : new Date().toISOString(),
      ...(typeof obj.originalName === "string"
        ? { originalName: sanitizeText(obj.originalName, 120) }
        : {}),
      ...(pos ? { positionPreference: pos } : {}),
    });
  }
  return clean;
}

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

    const body = await safeJsonObject(req);
    if (!body || (!body.leftLogo && !body.rightLogo && !body.library)) {
      return NextResponse.json({ error: "Invalid branding configuration" }, { status: 400 });
    }

    const safeLeft = body.leftLogo !== undefined ? sanitizeLogo(body.leftLogo) : undefined;
    const safeRight = body.rightLogo !== undefined ? sanitizeLogo(body.rightLogo) : undefined;
    const safeLib = body.library !== undefined ? sanitizeLibrary(body.library) : undefined;

    if (
      (body.leftLogo !== undefined && !safeLeft) ||
      (body.rightLogo !== undefined && !safeRight) ||
      (body.library !== undefined && !safeLib)
    ) {
      return NextResponse.json({ error: "Invalid logo payload or disallowed URL" }, { status: 400 });
    }

    const current = await getGlobalBranding();
    const updated: HeaderLogosConfig = {
      leftLogo: safeLeft || current.leftLogo,
      rightLogo: safeRight || current.rightLogo,
      library: safeLib || current.library || [],
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
