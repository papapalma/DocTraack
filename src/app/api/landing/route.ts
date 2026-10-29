import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LANDING_SECTIONS } from "@/types/landing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await (prisma as any).landingPageConfig.findUnique({
      where: { id: "default" },
    });

    if (!config || !config.publishedSections) {
      return NextResponse.json({
        sections: DEFAULT_LANDING_SECTIONS,
        publishedAt: null,
      });
    }

    return NextResponse.json({
      sections: config.publishedSections,
      publishedAt: config.publishedAt,
    });
  } catch (error) {
    console.error("Failed to load published landing sections:", error);
    // Graceful fallback to default sections so landing page never breaks
    return NextResponse.json({
      sections: DEFAULT_LANDING_SECTIONS,
      publishedAt: null,
    });
  }
}
