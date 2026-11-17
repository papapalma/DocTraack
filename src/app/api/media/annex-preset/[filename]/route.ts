import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STAFF" && user.role !== "ACCOUNTING" && user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { filename } = await params;

    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const sanitized = path.basename(filename);
    const ext = path.extname(sanitized).toLowerCase();
    const mimeType = MIME_TYPES[ext];

    if (!mimeType) {
      return NextResponse.json({ error: "Unsupported template format" }, { status: 400 });
    }

    const storageDir = path.resolve(process.cwd(), "storage", "uploads", "annex-presets");
    const filePath = path.resolve(storageDir, sanitized);

    if (!filePath.startsWith(storageDir + path.sep)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Preset asset not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${sanitized}"`,
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Stream annex preset asset error:", error);
    return NextResponse.json({ error: "Failed to stream preset asset" }, { status: 500 });
  }
}

