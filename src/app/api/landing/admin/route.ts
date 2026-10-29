import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { DEFAULT_LANDING_SECTIONS, LandingSection } from "@/types/landing";

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

    return NextResponse.json({
      config: {
        publishedSections: config.publishedSections,
        draftSections: config.draftSections,
        hasUnpublishedChanges: config.hasUnpublishedChanges,
        publishedAt: config.publishedAt,
        updatedAt: config.updatedAt,
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
    const { draftSections } = body as { draftSections: LandingSection[] };

    if (!Array.isArray(draftSections)) {
      return NextResponse.json({ error: "Invalid draft sections format" }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      config: {
        publishedSections: updated.publishedSections,
        draftSections: updated.draftSections,
        hasUnpublishedChanges: updated.hasUnpublishedChanges,
        updatedAt: updated.updatedAt,
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
        config: updated,
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
        config: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Landing admin action error:", error);
    return NextResponse.json({ error: "Failed to execute landing action" }, { status: 500 });
  }
}
