import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { PDFDocument } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth";
import { canManageAnnexPresets } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { isPresetSupportedAnnex, validatePresetUploadBytes } from "@/lib/annex-presets";
import { PresetPage } from "@/types/presets";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function parseImageDimensions(bytes: Uint8Array, ext: string): { widthPx: number; heightPx: number } {
  // PNG IHDR chunk at bytes 16..23
  if (ext === ".png" && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      widthPx: view.getUint32(16, false),
      heightPx: view.getUint32(20, false),
    };
  }
  // JPEG SOF0/SOF2 marker scan
  if (ext === ".jpg" && bytes.length >= 4) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1];
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3
      ) {
        const heightPx = (bytes[i + 5] << 8) | bytes[i + 6];
        const widthPx = (bytes[i + 7] << 8) | bytes[i + 8];
        if (widthPx > 0 && heightPx > 0) return { widthPx, heightPx };
      }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return { widthPx: 595, heightPx: 842 };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnexPresets(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff Coordinators can upload annex preset files." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const annexNumberRaw = formData.get("annexNumber") as string | null;
    const presetId = (formData.get("presetId") as string | null) || null;
    const startPageNumber = Math.max(1, parseInt((formData.get("startPageNumber") as string) || "1", 10));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const annexNumber = annexNumberRaw ? parseInt(annexNumberRaw, 10) : 0;
    if (!isPresetSupportedAnnex(annexNumber)) {
      return NextResponse.json(
        { error: "Valid Annex number (1, 3–10) is required for preset upload." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Uploaded template file exceeds the 15 MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const validation = validatePresetUploadBytes(bytes, file.type);
    if (!validation.valid || !validation.detectedExt || !validation.detectedMime) {
      return NextResponse.json(
        { error: validation.reason || "Invalid template file." },
        { status: 400 }
      );
    }

    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const filename = `preset-${Date.now()}-${randomSuffix}${validation.detectedExt}`;
    const storageDir = path.resolve(process.cwd(), "storage", "uploads", "annex-presets");
    await fs.mkdir(storageDir, { recursive: true });

    const filePath = path.resolve(storageDir, path.basename(filename));
    if (!filePath.startsWith(storageDir + path.sep)) {
      return NextResponse.json({ error: "Invalid destination path." }, { status: 400 });
    }

    let pages: PresetPage[] = [];

    if (validation.detectedExt === ".pdf") {
      try {
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pdfPages = pdfDoc.getPages();
        if (pdfPages.length === 0) {
          return NextResponse.json({ error: "Uploaded PDF contains no pages." }, { status: 400 });
        }
        if (pdfPages.length > 50) {
          return NextResponse.json(
            { error: "Uploaded PDF exceeds the 50-page template limit." },
            { status: 400 }
          );
        }

        const mediaUrl = `/api/media/annex-preset/${filename}`;
        pages = pdfPages.map((p, idx) => {
          const { width, height } = p.getSize();
          const widthPt = Math.round(width);
          const heightPt = Math.round(height);
          const orientation = widthPt > heightPt ? "landscape" : "portrait";
          return {
            id: `page-${Date.now()}-${idx}-${crypto.randomBytes(3).toString("hex")}`,
            pageNumber: startPageNumber + idx,
            label: `Page ${startPageNumber + idx}`,
            sourceType: "pdf",
            fileUrl: mediaUrl,
            pdfPageIndex: idx,
            widthPt,
            heightPt,
            orientation,
          };
        });
      } catch {
        return NextResponse.json(
          { error: "Unable to parse PDF file. Ensure it is not password-encrypted or corrupted." },
          { status: 400 }
        );
      }
    } else {
      const dims = parseImageDimensions(bytes, validation.detectedExt);
      const isLandscape = dims.widthPx > dims.heightPx;
      // Scale image proportionally onto A4-equivalent point dimensions
      const baseLong = 842;
      const aspect = dims.widthPx / Math.max(1, dims.heightPx);
      const widthPt = isLandscape ? baseLong : Math.round(baseLong * aspect);
      const heightPt = isLandscape ? Math.round(baseLong / aspect) : baseLong;
      const mediaUrl = `/api/media/annex-preset/${filename}`;

      pages = [
        {
          id: `page-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          pageNumber: startPageNumber,
          label: `Page ${startPageNumber}`,
          sourceType: "image",
          fileUrl: mediaUrl,
          widthPt: Math.max(200, widthPt),
          heightPt: Math.max(200, heightPt),
          orientation: isLandscape ? "landscape" : "portrait",
        },
      ];
    }

    await fs.writeFile(filePath, Buffer.from(bytes));

    const mediaUrl = `/api/media/annex-preset/${filename}`;

    await logAudit({
      actorId: user.id,
      action: "PRESET_FILE_UPLOADED",
      entity: "annex_preset",
      entityId: presetId || filename,
      details: {
        annexNumber,
        originalName: file.name,
        mimeType: validation.detectedMime,
        sizeBytes: file.size,
        pageCount: pages.length,
        mediaUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      filename,
      mimeType: validation.detectedMime,
      pages,
    });
  } catch (error) {
    console.error("Upload annex preset file error:", error);
    return NextResponse.json(
      { error: "Failed to upload preset template file." },
      { status: 500 }
    );
  }
}

