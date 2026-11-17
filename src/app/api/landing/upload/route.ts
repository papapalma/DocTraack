import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import {
  detectImageKindFromBytes,
  getVerifiedImageMetadata,
  resolveContainedFilePath,
  validateSafeSvg,
} from "@/lib/upload-security";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Admin privileges required to upload landing assets",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawCategory = (formData.get("category") as string) || "asset";
    const category =
      rawCategory
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 24) || "asset";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit or is empty." },
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
            "Invalid or unrecognized image content. Allowed: JPG, PNG, WEBP, SVG.",
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

    const { ext } = getVerifiedImageMetadata(detectedKind);
    const uploadDir = path.resolve(
      process.cwd(),
      "storage",
      "uploads",
      "landing"
    );
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const safeFilename = `${category}-${Date.now()}-${randomSuffix}${ext}`;
    const destinationPath = resolveContainedFilePath(uploadDir, safeFilename);
    if (!destinationPath) {
      return NextResponse.json(
        { error: "Invalid upload destination." },
        { status: 400 }
      );
    }

    await fs.writeFile(destinationPath, buffer);

    const mediaUrl = `/api/media/landing/${safeFilename}`;

    await logAudit({
      actorId: user.id,
      action: "LANDING_ASSET_UPLOADED",
      entity: "LANDING_PAGE",
      entityId: safeFilename,
      req,
      details: {
        category,
        originalName: file.name,
        verifiedKind: detectedKind,
        size: file.size,
        publicUrl: mediaUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: mediaUrl,
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
