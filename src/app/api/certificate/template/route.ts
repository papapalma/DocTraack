import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  parseSafeAssetUrl,
  safeJsonObject,
  sanitizeText,
} from "@/lib/validation";
import { Role } from "@prisma/client";
import { LogoConfig, LogoPresetId } from "@/types";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  CertificateTemplateConfig,
  PAPER_SIZES,
  PaperSize,
} from "@/lib/certificate";
import {
  getCertificateTemplate,
  saveCertificateTemplate,
} from "@/lib/certificate-server";

export const dynamic = "force-dynamic";

const ALLOWED_PRESETS = new Set<LogoPresetId>(["ched", "unifast", "minsu", "none"]);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function sanitizeCertLogo(raw: unknown, fallback?: LogoConfig): LogoConfig | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const obj = raw as Record<string, unknown>;
  const type = obj.type === "preset" ? "preset" : obj.type === "custom" ? "custom" : null;
  if (!type) return fallback;
  const safeUrl = obj.url !== undefined ? parseSafeAssetUrl(obj.url) : undefined;
  if (type === "custom" && !safeUrl) return fallback;
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

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await getCertificateTemplate();
    return NextResponse.json({ template, paperSizes: PAPER_SIZES });
  } catch (error) {
    console.error("Get certificate template error:", error);
    return NextResponse.json(
      { error: "Failed to load certificate template" },
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

    // Strict RBAC: Staff and Director ONLY. Admin is completely excluded.
    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Certificate design customization is exclusively restricted to TDP Staff and Campus Director.",
        },
        { status: 403 }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Reset to default action
    if (body.resetToDefault === true) {
      await saveCertificateTemplate(DEFAULT_CERTIFICATE_TEMPLATE);
      await logAudit({
        actorId: user.id,
        action: "CERTIFICATE_TEMPLATE_RESET",
        entity: "certificate_template",
        entityId: "default",
        req,
        details: { resetBy: user.email },
      });
      return NextResponse.json({
        message: "Certificate template reset to MinSU default",
        template: DEFAULT_CERTIFICATE_TEMPLATE,
      });
    }

    const current = await getCertificateTemplate();

    const bool = (key: keyof CertificateTemplateConfig): boolean =>
      typeof body[key] === "boolean" ? (body[key] as boolean) : (current[key] as boolean);
    const str = (key: keyof CertificateTemplateConfig, max = 200): string =>
      typeof body[key] === "string"
        ? sanitizeText(body[key] as string, max)
        : (current[key] as string);

    const paperSize: PaperSize =
      typeof body.paperSize === "string" && PAPER_SIZES[body.paperSize as PaperSize]
        ? (body.paperSize as PaperSize)
        : current.paperSize || "A4";

    const updatedTemplate: CertificateTemplateConfig = {
      paperSize,
      showLeftLogo: bool("showLeftLogo"),
      showCenterLogo: bool("showCenterLogo"),
      showRightLogo: bool("showRightLogo"),
      leftLogoConfig: sanitizeCertLogo(body.leftLogoConfig, current.leftLogoConfig),
      centerLogoConfig: sanitizeCertLogo(body.centerLogoConfig, current.centerLogoConfig),
      rightLogoConfig: sanitizeCertLogo(body.rightLogoConfig, current.rightLogoConfig),
      showRepublicText: bool("showRepublicText"),
      republicText: str("republicText", 120),
      showAgencyText: bool("showAgencyText"),
      agencyText: str("agencyText", 160),
      showUniversityName: bool("showUniversityName"),
      universityName: str("universityName", 160),
      showCampusName: bool("showCampusName"),
      campusName: str("campusName", 200),
      title: str("title", 180),
      subtitle: str("subtitle", 250),
      awardPrefix: str("awardPrefix", 120),
      bodyText: str("bodyText", 1500),
      showStudentId: bool("showStudentId"),
      showCourse: bool("showCourse"),
      showCampus: bool("showCampus"),
      showBatch: bool("showBatch"),
      showTrackingCode: bool("showTrackingCode"),
      showDateAwarded: bool("showDateAwarded"),
      customDateAwarded: str("customDateAwarded", 120),
      showAdditionalNote: bool("showAdditionalNote"),
      additionalNoteText: str("additionalNoteText", 500),
      showSignatory1: bool("showSignatory1"),
      signatory1Name: str("signatory1Name", 120),
      signatory1Title: str("signatory1Title", 160),
      showSignatory2: bool("showSignatory2"),
      signatory2Name: str("signatory2Name", 120),
      signatory2Title: str("signatory2Title", 160),
      primaryColor:
        typeof body.primaryColor === "string" && HEX_COLOR_RE.test(body.primaryColor.trim())
          ? body.primaryColor.trim()
          : current.primaryColor,
      accentColor:
        typeof body.accentColor === "string" && HEX_COLOR_RE.test(body.accentColor.trim())
          ? body.accentColor.trim()
          : current.accentColor,
      showWatermark: bool("showWatermark"),
      watermarkLogoConfig: sanitizeCertLogo(body.watermarkLogoConfig, current.watermarkLogoConfig),
      showCornerBorders: bool("showCornerBorders"),
    };

    await saveCertificateTemplate(updatedTemplate);

    await logAudit({
      actorId: user.id,
      action: "CERTIFICATE_TEMPLATE_UPDATED",
      entity: "certificate_template",
      entityId: "global",
      req,
      details: {
        paperSize: updatedTemplate.paperSize,
        title: updatedTemplate.title,
        updatedBy: user.email,
      },
    });

    return NextResponse.json({
      message: "Certificate template saved successfully",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Save certificate template error:", error);
    return NextResponse.json(
      { error: "Failed to save certificate template configuration" },
      { status: 500 }
    );
  }
}

