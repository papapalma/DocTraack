import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required to upload landing assets" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "asset";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WEBP, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "landing");
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const ext = path.extname(file.name) || ".png";
    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 32);

    const safeFilename = `${category}-${Date.now()}-${baseName}${ext}`;
    const destinationPath = path.join(uploadDir, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(destinationPath, buffer);

    const publicUrl = `/uploads/landing/${safeFilename}`;

    // Record audit event
    await logAudit({
      actorId: user.id,
      action: "LANDING_ASSET_UPLOADED",
      entity: "LANDING_PAGE",
      entityId: safeFilename,
      details: {
        category,
        originalName: file.name,
        size: file.size,
        publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
    });
  } catch (error) {
    console.error("Landing asset upload error:", error);
    return NextResponse.json(
      { error: "Internal server error uploading asset" },
      { status: 500 }
    );
  }
}
