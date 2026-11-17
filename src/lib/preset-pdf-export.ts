import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import {
  AnnexPresetConfig,
  PresetElement,
  PresetPage,
} from "@/types/presets";
import {
  chunkTableRows,
  formatTableCellValue,
  getTableRowsFromFormData,
  resolveFormDataValue,
} from "./annex-presets";

function hexToRgb(hex: string | undefined): { r: number; g: number; b: number } {
  const clean = (hex || "#1F2A24").replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  return { r: 0.12, g: 0.16, b: 0.14 };
}

/**
 * Replaces characters unsupported by PDF StandardFonts (WinAnsi), such as U+20B1 (₱),
 * so pdf-lib drawText and widthOfTextAtSize never throw encoding errors.
 */
function toPdfSafeText(text: string): string {
  return text
    .replace(/\u20B1/g, "PHP ")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");
}

function wrapTextToLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

export interface RenderedPageSlice {
  templatePage: PresetPage;
  repeatIndex: number;
  totalRepeatsForPage: number;
  tableSliceMap: Record<string, Record<string, unknown>[]>;
}

/**
 * Expands preset pages into concrete output slices, automatically cloning pages
 * that contain a `data_table` with `autoPaginate` when rows exceed the table frame.
 */
export function expandPresetPageSlices(
  config: AnnexPresetConfig,
  formData: Record<string, unknown>
): RenderedPageSlice[] {
  const slices: RenderedPageSlice[] = [];

  for (const page of config.pages) {
    const pageElements = config.elements.filter((el) => el.pageId === page.id);
    const tableEls = pageElements.filter(
      (el) => el.type === "data_table" && el.tableConfig
    );

    if (tableEls.length === 0) {
      slices.push({
        templatePage: page,
        repeatIndex: 0,
        totalRepeatsForPage: 1,
        tableSliceMap: {},
      });
      continue;
    }

    const chunkedPerTable: Record<string, Record<string, unknown>[][]> = {};
    let maxChunks = 1;

    for (const tel of tableEls) {
      const cfg = tel.tableConfig!;
      const rows = getTableRowsFromFormData(cfg.dataSource, formData);
      const boxHeightPt = (tel.hPct / 100) * page.heightPt;
      const rowHeight = Math.max(12, cfg.rowHeightPt || 18);
      const headerHeight = cfg.showHeader !== false ? rowHeight + 4 : 0;
      const rowsPerPage = Math.max(1, Math.floor((boxHeightPt - headerHeight) / rowHeight));
      const chunks =
        cfg.autoPaginate !== false
          ? chunkTableRows(rows, rowsPerPage)
          : [rows.slice(0, rowsPerPage)];
      chunkedPerTable[tel.id] = chunks;
      if (chunks.length > maxChunks) {
        maxChunks = chunks.length;
      }
    }

    for (let r = 0; r < maxChunks; r++) {
      const tableSliceMap: Record<string, Record<string, unknown>[]> = {};
      for (const tel of tableEls) {
        const chunks = chunkedPerTable[tel.id] || [[]];
        tableSliceMap[tel.id] = chunks[r] || [];
      }
      slices.push({
        templatePage: page,
        repeatIndex: r,
        totalRepeatsForPage: maxChunks,
        tableSliceMap,
      });
    }
  }

  return slices;
}

export async function exportCustomPresetPdf(
  config: AnnexPresetConfig,
  formData: Record<string, unknown>,
  assetFetcher: (url: string) => Promise<Uint8Array>
): Promise<Uint8Array> {
  const outDoc = await PDFDocument.create();

  const fontHelvetica = await outDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await outDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await outDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await outDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await outDoc.embedFont(StandardFonts.CourierBold);

  const pickFont = (el: PresetElement): PDFFont => {
    const bold = Boolean(el.style?.bold);
    switch (el.style?.fontFamily) {
      case "Times":
        return bold ? fontTimesBold : fontTimes;
      case "Courier":
        return bold ? fontCourierBold : fontCourier;
      case "Helvetica":
      default:
        return bold ? fontHelveticaBold : fontHelvetica;
    }
  };

  const loadedSourcePdfs = new Map<string, PDFDocument>();
  const embeddedImages = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();

  const getEmbeddedImage = async (url: string) => {
    const cached = embeddedImages.get(url);
    if (cached) return cached;
    const raw = await assetFetcher(url);
    const isPng =
      raw.length >= 4 && raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4e && raw[3] === 0x47;
    const embedded = isPng ? await outDoc.embedPng(raw) : await outDoc.embedJpg(raw);
    embeddedImages.set(url, embedded);
    return embedded;
  };

  const slices = expandPresetPageSlices(config, formData);

  for (const slice of slices) {
    const tplPage = slice.templatePage;
    let pdfPage: PDFPage;

    if (tplPage.sourceType === "pdf" && tplPage.fileUrl) {
      let srcPdf = loadedSourcePdfs.get(tplPage.fileUrl);
      if (!srcPdf) {
        const bytes = await assetFetcher(tplPage.fileUrl);
        srcPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        loadedSourcePdfs.set(tplPage.fileUrl, srcPdf);
      }
      const idx = Math.min(Math.max(0, tplPage.pdfPageIndex ?? 0), srcPdf.getPageCount() - 1);
      const [copied] = await outDoc.copyPages(srcPdf, [idx]);
      pdfPage = outDoc.addPage(copied);
    } else {
      pdfPage = outDoc.addPage([tplPage.widthPt || 595, tplPage.heightPt || 842]);
      if (tplPage.sourceType === "image" && tplPage.fileUrl) {
        try {
          const img = await getEmbeddedImage(tplPage.fileUrl);
          pdfPage.drawImage(img, {
            x: 0,
            y: 0,
            width: pdfPage.getWidth(),
            height: pdfPage.getHeight(),
          });
        } catch {
          // Leave blank page if background image cannot be embedded
        }
      }
    }

    const pageW = pdfPage.getWidth();
    const pageH = pdfPage.getHeight();
    const pageElements = config.elements
      .filter((el) => el.pageId === tplPage.id)
      .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

    for (const el of pageElements) {
      const boxX = (el.xPct / 100) * pageW;
      const boxW = Math.max(8, (el.wPct / 100) * pageW);
      const boxH = Math.max(8, (el.hPct / 100) * pageH);
      const boxTopFromBottom = pageH - (el.yPct / 100) * pageH;
      const boxY = boxTopFromBottom - boxH;

      // Optional fill / border on box
      if (el.style?.backgroundColor && el.style.backgroundColor !== "transparent") {
        const bg = hexToRgb(el.style.backgroundColor);
        pdfPage.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          color: rgb(bg.r, bg.g, bg.b),
        });
      }
      if (el.style?.borderWidth && el.style.borderWidth > 0) {
        const bc = hexToRgb(el.style.borderColor || "#1F2A24");
        pdfPage.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          borderColor: rgb(bc.r, bc.g, bc.b),
          borderWidth: el.style.borderWidth,
        });
      }

      if (el.type === "data_table" && el.tableConfig) {
        const rows = slice.tableSliceMap[el.id] || [];
        const cfg = el.tableConfig;
        const cols = cfg.columns || [];
        const totalColPct =
          cols.reduce((acc, c) => acc + Math.max(1, c.widthPct || 1), 0) || 100;
        const rowH = Math.max(12, cfg.rowHeightPt || 18);
        const fontSize = Math.max(6, Math.min(14, cfg.fontSizePt || 8));
        let cursorY = boxTopFromBottom;

        if (cfg.showHeader !== false) {
          const hBg = hexToRgb(cfg.headerBgColor || "#1B5E20");
          const hTxt = hexToRgb(cfg.headerTextColor || "#FFFFFF");
          pdfPage.drawRectangle({
            x: boxX,
            y: cursorY - rowH,
            width: boxW,
            height: rowH,
            color: rgb(hBg.r, hBg.g, hBg.b),
          });

          let colX = boxX;
          for (let cIdx = 0; cIdx < cols.length; cIdx++) {
            const col = cols[cIdx];
            const colW = (Math.max(1, col.widthPct || 1) / totalColPct) * boxW;
            const text = toPdfSafeText(col.label.slice(0, 40));
            const textW = fontHelveticaBold.widthOfTextAtSize(text, fontSize);
            let tx = colX + 3;
            if (col.align === "center") tx = colX + (colW - textW) / 2;
            if (col.align === "right") tx = colX + colW - textW - 3;

            pdfPage.drawText(text, {
              x: Math.max(colX + 2, tx),
              y: cursorY - rowH + (rowH - fontSize) / 2 + 1,
              size: fontSize,
              font: fontHelveticaBold,
              color: rgb(hTxt.r, hTxt.g, hTxt.b),
              maxWidth: Math.max(8, colW - 4),
            });
            if (cIdx > 0) {
              pdfPage.drawLine({
                start: { x: colX, y: cursorY },
                end: { x: colX, y: cursorY - rowH },
                thickness: 0.4,
                color: rgb(0.84, 0.87, 0.85),
              });
            }
            colX += colW;
          }
          cursorY -= rowH;
        }

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          if (cursorY - rowH < boxY - 1) break;
          const row = rows[rIdx];
          if (rIdx % 2 === 1) {
            pdfPage.drawRectangle({
              x: boxX,
              y: cursorY - rowH,
              width: boxW,
              height: rowH,
              color: rgb(0.96, 0.98, 0.96),
            });
          }
          pdfPage.drawRectangle({
            x: boxX,
            y: cursorY - rowH,
            width: boxW,
            height: rowH,
            borderColor: rgb(0.84, 0.87, 0.85),
            borderWidth: 0.5,
          });

          let colX = boxX;
          for (let cIdx = 0; cIdx < cols.length; cIdx++) {
            const col = cols[cIdx];
            const colW = (Math.max(1, col.widthPct || 1) / totalColPct) * boxW;
            const val = toPdfSafeText(formatTableCellValue(row[col.key], col.format));
            const textW = fontHelvetica.widthOfTextAtSize(val, fontSize);
            let tx = colX + 3;
            if (col.align === "center") tx = colX + (colW - textW) / 2;
            if (col.align === "right") tx = colX + colW - textW - 3;

            pdfPage.drawText(val, {
              x: Math.max(colX + 2, tx),
              y: cursorY - rowH + (rowH - fontSize) / 2 + 1,
              size: fontSize,
              font: fontHelvetica,
              color: rgb(0.12, 0.16, 0.14),
              maxWidth: Math.max(8, colW - 4),
            });
            if (cIdx > 0) {
              pdfPage.drawLine({
                start: { x: colX, y: cursorY },
                end: { x: colX, y: cursorY - rowH },
                thickness: 0.4,
                color: rgb(0.84, 0.87, 0.85),
              });
            }
            colX += colW;
          }
          cursorY -= rowH;
        }
        continue;
      }

      if (el.type === "logo") {
        const headerLogos = formData.headerLogos as
          | { leftLogo?: { url?: string }; rightLogo?: { url?: string } }
          | undefined;
        const logoUrl =
          el.logoUrl ||
          (el.logoSlot === "left"
            ? headerLogos?.leftLogo?.url || config.settings?.headerLogos?.leftLogo?.url
            : el.logoSlot === "right"
            ? headerLogos?.rightLogo?.url || config.settings?.headerLogos?.rightLogo?.url
            : undefined);

        if (logoUrl) {
          try {
            const img = await getEmbeddedImage(logoUrl);
            const ratio = Math.min(boxW / img.width, boxH / img.height);
            const drawW = img.width * ratio;
            const drawH = img.height * ratio;
            pdfPage.drawImage(img, {
              x: boxX + (boxW - drawW) / 2,
              y: boxY + (boxH - drawH) / 2,
              width: drawW,
              height: drawH,
            });
          } catch {
            // Skip unreadable image gracefully
          }
        }
        continue;
      }

      if (el.type === "checkbox") {
        const customFields = (formData.customFields as Record<string, unknown>) || {};
        const checked = el.fieldKey
          ? Boolean(customFields[el.fieldKey] ?? el.checkedDefault)
          : Boolean(el.checkedDefault);
        const bc = hexToRgb(el.style?.color || "#1F2A24");
        const boxSize = Math.min(boxW, boxH, 16);
        const cx = boxX + (boxW - boxSize) / 2;
        const cy = boxY + (boxH - boxSize) / 2;

        pdfPage.drawRectangle({
          x: cx,
          y: cy,
          width: boxSize,
          height: boxSize,
          borderColor: rgb(bc.r, bc.g, bc.b),
          borderWidth: 1,
        });
        if (checked) {
          pdfPage.drawText("X", {
            x: cx + boxSize * 0.24,
            y: cy + boxSize * 0.18,
            size: boxSize * 0.72,
            font: fontHelveticaBold,
            color: rgb(bc.r, bc.g, bc.b),
          });
        }
        continue;
      }

      // Text-based elements: static_text, bound_field, textbox, textarea, date
      let displayText = "";
      if (el.type === "static_text") {
        displayText = el.staticText || el.label || "";
      } else if (el.type === "bound_field") {
        displayText = resolveFormDataValue(el.bindingKey, formData);
      } else {
        const customFields = (formData.customFields as Record<string, unknown>) || {};
        const key = el.fieldKey || el.id;
        const rawVal = customFields[key] ?? el.defaultValue ?? "";
        displayText = String(rawVal);
      }

      if (!displayText) continue;

      const font = pickFont(el);
      const fontSize = Math.max(6, Math.min(48, el.style?.fontSizePt || 10));
      const color = hexToRgb(el.style?.color || "#1F2A24");
      const padding = el.style?.paddingPx ?? 3;
      const lines = wrapTextToLines(
        toPdfSafeText(displayText),
        font,
        fontSize,
        Math.max(10, boxW - padding * 2)
      );
      const lineHeight = fontSize * 1.25;

      for (let li = 0; li < lines.length; li++) {
        const textY = boxTopFromBottom - padding - fontSize - li * lineHeight;
        if (textY < boxY + 1) break;
        const line = lines[li];
        const lineW = font.widthOfTextAtSize(line, fontSize);
        let textX = boxX + padding;
        if (el.style?.align === "center") {
          textX = boxX + (boxW - lineW) / 2;
        } else if (el.style?.align === "right") {
          textX = boxX + boxW - lineW - padding;
        }
        pdfPage.drawText(line, {
          x: Math.max(boxX + 1, textX),
          y: textY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
        });
      }
    }
  }

  return outDoc.save();
}

