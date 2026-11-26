import { NextResponse } from "next/server";
import { buildKioskManifest } from "@/lib/pwa";

export function GET() {
  return NextResponse.json(buildKioskManifest(), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
