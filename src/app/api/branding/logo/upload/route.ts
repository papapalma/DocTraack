import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { addLogoToLibrary } from "@/lib/branding";
import { sanitizeText } from "@/lib/validation";
import {
  detectImageKindFromBytes,
  getVerifiedImageMetadata,
  resolveContainedFilePath,
  validateSafeSvg,
} from "@/lib/upload-security";
import { LogoLibraryItem } from "@/types";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      user.role !== "STAFF" &&
      user.role !== "DIRECTOR" &&
      user.role !== "SYSTEM_ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Access denied. Only Staff Coordinators, Campus Directors, and System Administrators can upload document logos.",
        },
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

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit or is empty." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedKind = detectImageKindFromBytes(buffer);
    if (!detectedKind) {
      return NextResponse.json(
        {
          error:
            "Invalid or unrecognized image content. Allowed: PNG, JPG, WebP, SVG.",
        },
        { status: 400 }
      );
    }

    if (detectedKind === "svg") {
      const svgCheck = validateSafeSvg(buffer);
      if (!svgCheck.valid) {
        return NextResponse.json(
          { error: svgCheck.reason || "Unsafe SVG payload rejected." },
          { status: 400 }
        );
      }
    }

    const { ext, mime } = getVerifiedImageMetadata(detectedKind);
    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const filename = `logo-${Date.now()}-${randomSuffix}${ext}`;

    const storageDir = path.resolve(
      process.cwd(),
      "storage",
      "uploads",
      "logos"
    );
    await fs.mkdir(storageDir, { recursive: true });

    const filePath = resolveContainedFilePath(storageDir, filename);
    if (!filePath) {
      return NextResponse.json(
        { error: "Invalid destination path." },
        { status: 400 }
      );
    }

    await fs.writeFile(filePath, buffer);

    const mediaUrl = `/api/media/logo/${filename}`;
    const safeOriginalName = sanitizeText(file.name, 120) || "logo";
    const displayName =
      safeOriginalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") ||
      "Custom Institutional Logo";

    const libraryItem: LogoLibraryItem = {
      id: `logo-${Date.now()}-${randomSuffix}`,
      name: displayName,
      url: mediaUrl,
      uploadedAt: new Date().toISOString(),
      originalName: safeOriginalName,
      positionPreference:
        position === "left" || position === "right" ? position : "both",
    };

    await addLogoToLibrary(libraryItem);

    await logAudit({
      actorId: user.id,
      action: "LOGO_UPLOADED",
      entity: "LOGO",
      entityId: filename,
      req,
      details: {
        originalName: safeOriginalName,
        size: file.size,
        mimeType: mime,
        documentId,
        position,
        mediaUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      filename,
      originalName: safeOriginalName,
      libraryItem,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload and save logo to disk." },
      { status: 500 }
    );
  }
}
