import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { DEFAULT_LANDING_SECTIONS, LandingSection, LandingStyleSettings } from "@/types/landing";
import {
  getLandingStyles,
  saveDraftLandingStyle,
  publishLandingStyle,
  resetLandingStyle,
} from "@/lib/landing-style";

export const dynamic = "force-dynamic";

/** GET /api/landing/admin - Retrieve landing page draft & published layouts */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    let config = await (prisma as any).landingPageConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await (prisma as any).landingPageConfig.create({
        data: {
          id: "default",
          publishedSections: DEFAULT_LANDING_SECTIONS,
          draftSections: DEFAULT_LANDING_SECTIONS,
          hasUnpublishedChanges: false,
          publishedAt: new Date(),
          updatedById: user.id,
        },
      });
    }

    const mergeMissing = (sectionsList: any[]) => {
      if (!Array.isArray(sectionsList)) return DEFAULT_LANDING_SECTIONS;
      const existingTypes = new Set(sectionsList.map((s) => s.type));
      const missing = DEFAULT_LANDING_SECTIONS.filter((def) => !existingTypes.has(def.type));
      if (missing.length === 0) return sectionsList;
      const copy = [...sectionsList];
      const statsIdx = copy.findIndex((s) => s.type === "STATS");
      if (statsIdx !== -1) {
        copy.splice(statsIdx, 0, ...missing);
      } else {
        copy.push(...missing);
      }
      return copy;
    };

    const published = mergeMissing(config.publishedSections);
    const drafts = mergeMissing(config.draftSections);
    const styles = await getLandingStyles();

    return NextResponse.json({
      config: {
        publishedSections: published,
        draftSections: drafts,
        hasUnpublishedChanges: config.hasUnpublishedChanges,
        publishedAt: config.publishedAt,
        updatedAt: config.updatedAt,
        styleSettings: styles.draft,
      },
    });
  } catch (error) {
    console.error("Admin landing config fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch landing configuration" }, { status: 500 });
  }
}

/** PUT /api/landing/admin - Save draft layout */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { draftSections, styleSettings } = body as {
      draftSections?: LandingSection[];
      styleSettings?: Partial<LandingStyleSettings>;
    };

    let updatedStyles: LandingStyleSettings | undefined;
    if (styleSettings) {
      updatedStyles = await saveDraftLandingStyle(styleSettings);
    } else {
      const styles = await getLandingStyles();
      updatedStyles = styles.draft;
    }

    if (draftSections && !Array.isArray(draftSections)) {
      return NextResponse.json({ error: "Invalid draft sections format" }, { status: 400 });
    }

    let updatedSections = draftSections;
    let hasUnpublishedChanges = true;
    let updatedAt = new Date();

    if (draftSections) {
      const updated = await (prisma as any).landingPageConfig.upsert({
        where: { id: "default" },
        update: {
          draftSections,
          hasUnpublishedChanges: true,
          updatedById: user.id,
        },
        create: {
          id: "default",
          publishedSections: DEFAULT_LANDING_SECTIONS,
          draftSections,
          hasUnpublishedChanges: true,
          updatedById: user.id,
        },
      });
      updatedSections = updated.draftSections;
      hasUnpublishedChanges = updated.hasUnpublishedChanges;
      updatedAt = updated.updatedAt;
    }

    return NextResponse.json({
      success: true,
      config: {
        draftSections: updatedSections,
        styleSettings: updatedStyles,
        hasUnpublishedChanges,
        updatedAt,
      },
    });
  } catch (error) {
    console.error("Save landing draft error:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

/** POST /api/landing/admin - Publish, Discard, or Reset actions */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body as { action: "publish" | "discard" | "reset_default" };

    const currentConfig = await (prisma as any).landingPageConfig.findUnique({
      where: { id: "default" },
    });

    if (action === "publish") {
      const draft = currentConfig?.draftSections || DEFAULT_LANDING_SECTIONS;
      const updatedStyle = await publishLandingStyle();
      const updated = await (prisma as any).landingPageConfig.update({
        where: { id: "default" },
        data: {
          publishedSections: draft,
          hasUnpublishedChanges: false,
          publishedAt: new Date(),
          updatedById: user.id,
        },
      });

      await logAudit({
        actorId: user.id,
        action: "PUBLISH_LANDING_PAGE",
        entity: "landing_page_config",
        entityId: "default",
        details: {
          sectionsCount: Array.isArray(draft) ? draft.length : 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Landing page changes successfully published live.",
        config: {
          ...updated,
          styleSettings: updatedStyle,
        },
      });
    }

    if (action === "discard") {
      const published = currentConfig?.publishedSections || DEFAULT_LANDING_SECTIONS;
      const updated = await (prisma as any).landingPageConfig.update({
        where: { id: "default" },
        data: {
          draftSections: published,
          hasUnpublishedChanges: false,
          updatedById: user.id,
        },
      });

      await logAudit({
        actorId: user.id,
        action: "DISCARD_LANDING_DRAFT",
        entity: "landing_page_config",
        entityId: "default",
      });

      return NextResponse.json({
        success: true,
        message: "Unpublished draft changes were discarded.",
        config: updated,
      });
    }

    if (action === "reset_default") {
      const resetStyle = await resetLandingStyle();
      const updated = await (prisma as any).landingPageConfig.update({
        where: { id: "default" },
        data: {
          publishedSections: DEFAULT_LANDING_SECTIONS,
          draftSections: DEFAULT_LANDING_SECTIONS,
          hasUnpublishedChanges: false,
          publishedAt: new Date(),
          updatedById: user.id,
        },
      });

      await logAudit({
        actorId: user.id,
        action: "RESET_LANDING_DEFAULT",
        entity: "landing_page_config",
        entityId: "default",
      });

      return NextResponse.json({
        success: true,
        message: "Landing page reset to default MinSU layout.",
        config: {
          ...updated,
          styleSettings: resetStyle,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Landing admin action error:", error);
    return NextResponse.json({ error: "Failed to execute landing action" }, { status: 500 });
  }
}
