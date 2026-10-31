import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const EXTENSION_MAP: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "STUDENT") {
      return NextResponse.json(
        { error: "Access denied. Only operational staff can upload document logos." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = (formData.get("documentId") as string) || null;
    const position = (formData.get("position") as string) || "left";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid image format. Allowed: PNG, JPG, WebP, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit." },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = path.extname(file.name).toLowerCase();
    if (!ext || ext.length < 2) {
      ext = EXTENSION_MAP[file.type] || ".png";
    }

    // Generate safe filename
    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const filename = `logo-${Date.now()}-${randomSuffix}${ext}`;

    const storageDir = path.join(process.cwd(), "storage", "uploads", "logos");
    await fs.mkdir(storageDir, { recursive: true });

    const filePath = path.join(storageDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const mediaUrl = `/api/media/logo/${filename}`;

    // Audit log
    await logAudit({
      actorId: user.id,
      action: "LOGO_UPLOADED",
      entity: "LOGO",
      entityId: filename,
      details: {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        documentId,
        position,
        mediaUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      filename,
      originalName: file.name,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload and save logo to disk." },
      { status: 500 }
    );
  }
}

