import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

// Allowed MIME mappings
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check: strict filename sanitization against path traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const sanitized = path.basename(filename);
    const ext = path.extname(sanitized).toLowerCase();

    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      return NextResponse.json({ error: "Unsupported media format" }, { status: 400 });
    }

    const storageDir = path.join(process.cwd(), "storage", "uploads", "logos");
    const filePath = path.join(storageDir, sanitized);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${sanitized}"`,
      },
    });
  } catch (error) {
    console.error("Stream logo error:", error);
    return NextResponse.json({ error: "Failed to stream logo" }, { status: 500 });
  }
}

