import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LANDING_SECTIONS } from "@/types/landing";
import { getLandingStyles } from "@/lib/landing-style";

export const dynamic = "force-dynamic";

export async function GET() {
  const styles = await getLandingStyles();
  try {
    const config = await (prisma as any).landingPageConfig.findUnique({
      where: { id: "default" },
    });

    if (!config || !config.publishedSections || !Array.isArray(config.publishedSections)) {
      return NextResponse.json({
        sections: DEFAULT_LANDING_SECTIONS,
        publishedAt: null,
        styleSettings: styles.published,
      });
    }

    const published = config.publishedSections as any[];
    const existingTypes = new Set(published.map((s) => s.type));
    const missingSections = DEFAULT_LANDING_SECTIONS.filter(
      (def) => !existingTypes.has(def.type)
    );

    let mergedSections = [...published];
    if (missingSections.length > 0) {
      const statsIndex = mergedSections.findIndex((s) => s.type === "STATS");
      if (statsIndex !== -1) {
        mergedSections.splice(statsIndex, 0, ...missingSections);
      } else {
        mergedSections.push(...missingSections);
      }
    }

    return NextResponse.json({
      sections: mergedSections,
      publishedAt: config.publishedAt,
      styleSettings: styles.published,
    });
  } catch (error) {
    console.error("Failed to load published landing sections:", error);
    // Graceful fallback to default sections so landing page never breaks
    return NextResponse.json({
      sections: DEFAULT_LANDING_SECTIONS,
      publishedAt: null,
      styleSettings: styles.published,
    });
  }
}
