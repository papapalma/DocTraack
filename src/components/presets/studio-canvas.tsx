"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Eye,
  Code2,
  FileUp,
  Loader2,
  Move,
} from "lucide-react";
import {
  AnnexPresetConfig,
  PresetElement,
  PresetPage,
} from "@/types/presets";
import { renderPdfPageToCanvas } from "@/lib/preset-pdf-render";
import { PaletteDragPayload } from "./studio-right-palette";
import { PresetOverlayLayer } from "@/components/documents/preset-overlay-layer";
import { AnnexLogo } from "@/components/documents/annex-logo";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DragSession {
  elementId: string;
  mode: "move" | "resize";
  handle?: ResizeHandle;
  startPointerXPct: number;
  startPointerYPct: number;
  startRect: { xPct: number; yPct: number; wPct: number; hPct: number };
  currentRect: { xPct: number; yPct: number; wPct: number; hPct: number };
}

interface SnapGuide {
  axis: "x" | "y";
  pct: number;
}

interface StudioCanvasProps {
  config: AnnexPresetConfig;
  activePage: PresetPage;
  selectedElementId: string | null;
  previewMode: "preview-tokens" | "preview-sample";
  onPreviewModeChange: (mode: "preview-tokens" | "preview-sample") => void;
  onSelectPage: (pageId: string) => void;
  onSelectElement: (elementId: string | null) => void;
  onCommitElementGeometry: (
    elementId: string,
    rect: { xPct: number; yPct: number; wPct: number; hPct: number }
  ) => void;
  onDropCreateElement: (payload: PaletteDragPayload, xPct: number, yPct: number) => void;
  onUploadTemplateFile?: (file: File) => void;
}

const HANDLES: { id: ResizeHandle; cursor: string; posClass: string }[] = [
  { id: "nw", cursor: "nwse-resize", posClass: "-top-1.5 -left-1.5" },
  { id: "n", cursor: "ns-resize", posClass: "-top-1.5 left-1/2 -translate-x-1/2" },
  { id: "ne", cursor: "nesw-resize", posClass: "-top-1.5 -right-1.5" },
  { id: "e", cursor: "ew-resize", posClass: "top-1/2 -translate-y-1/2 -right-1.5" },
  { id: "se", cursor: "nwse-resize", posClass: "-bottom-1.5 -right-1.5" },
  { id: "s", cursor: "ns-resize", posClass: "-bottom-1.5 left-1/2 -translate-x-1/2" },
  { id: "sw", cursor: "nesw-resize", posClass: "-bottom-1.5 -left-1.5" },
  { id: "w", cursor: "ew-resize", posClass: "top-1/2 -translate-y-1/2 -left-1.5" },
];

function snapValue(val: number, gridStepPct: number, snapGrid: boolean): number {
  if (!snapGrid) return val;
  return Math.round(val / gridStepPct) * gridStepPct;
}

export function StudioCanvas({
  config,
  activePage,
  selectedElementId,
  previewMode,
  onPreviewModeChange,
  onSelectPage,
  onSelectElement,
  onCommitElementGeometry,
  onDropCreateElement,
  onUploadTemplateFile,
}: StudioCanvasProps) {
  const pageSurfaceRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasFileInputRef = useRef<HTMLInputElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isFileDragOver, setIsFileDragOver] = useState<boolean>(false);
  const [pdfRendering, setPdfRendering] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [guides, setGuides] = useState<SnapGuide[]>([]);

  // Display size in CSS px at zoom=1 (1pt -> 1.15px yields ~684px wide portrait A4, crisp on studio screen)
  const baseWidthPx = Math.round(activePage.widthPt * 1.12 * zoom);
  const baseHeightPx = Math.round(activePage.heightPt * 1.12 * zoom);

  const pageElements = useMemo(
    () => config.elements.filter((el) => el.pageId === activePage.id),
    [config.elements, activePage.id]
  );

  const activePageIdx = config.pages.findIndex((p) => p.id === activePage.id);

  // Render PDF background page when activePage is PDF
  useEffect(() => {
    let cancelled = false;
    if (activePage.sourceType !== "pdf" || !activePage.fileUrl) return;

    const canvas = pdfCanvasRef.current;
    if (!canvas) return;

    let done = false;
    queueMicrotask(() => {
      if (!cancelled && !done) {
        setPdfRendering(true);
        setPdfError(null);
      }
    });

    renderPdfPageToCanvas(
      activePage.fileUrl,
      activePage.pdfPageIndex ?? 0,
      canvas,
      baseWidthPx
    )
      .catch((err) => {
        if (!cancelled) {
          console.error("Canvas PDF render error:", err);
          setPdfError("Unable to render PDF background page.");
        }
      })
      .finally(() => {
        done = true;
        if (!cancelled) setPdfRendering(false);
      });

    return () => {
      cancelled = true;
      done = true;
    };
  }, [activePage.fileUrl, activePage.pdfPageIndex, activePage.sourceType, baseWidthPx]);

  const clientToPagePct = useCallback((clientX: number, clientY: number) => {
    const surface = pageSurfaceRef.current;
    if (!surface) return { xPct: 0, yPct: 0 };
    const rect = surface.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const yPct = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
    return { xPct, yPct };
  }, []);

  const findSmartGuides = useCallback(
    (
      movingId: string,
      candidate: { xPct: number; yPct: number; wPct: number; hPct: number }
    ): { rect: typeof candidate; guides: SnapGuide[] } => {
      const threshold = 0.85;
      const detected: SnapGuide[] = [];
      let { xPct, yPct } = candidate;
      const { wPct, hPct } = candidate;

      const xTargets = [50];
      const yTargets = [50];
      for (const other of pageElements) {
        if (other.id === movingId) continue;
        xTargets.push(other.xPct, other.xPct + other.wPct / 2, other.xPct + other.wPct);
        yTargets.push(other.yPct, other.yPct + other.hPct / 2, other.yPct + other.hPct);
      }

      const cx = xPct + wPct / 2;
      const cy = yPct + hPct / 2;

      for (const tx of xTargets) {
        if (Math.abs(xPct - tx) < threshold) {
          xPct = tx;
          detected.push({ axis: "x", pct: tx });
          break;
        }
        if (Math.abs(cx - tx) < threshold) {
          xPct = tx - wPct / 2;
          detected.push({ axis: "x", pct: tx });
          break;
        }
      }

      for (const ty of yTargets) {
        if (Math.abs(yPct - ty) < threshold) {
          yPct = ty;
          detected.push({ axis: "y", pct: ty });
          break;
        }
        if (Math.abs(cy - ty) < threshold) {
          yPct = ty - hPct / 2;
          detected.push({ axis: "y", pct: ty });
          break;
        }
      }

      return {
        rect: {
          xPct: Math.max(0, Math.min(100 - wPct, xPct)),
          yPct: Math.max(0, Math.min(100 - hPct, yPct)),
          wPct,
          hPct,
        },
        guides: detected,
      };
    },
    [pageElements]
  );

  const startElementPointerDrag = (
    e: React.PointerEvent<HTMLElement>,
    el: PresetElement,
    mode: "move" | "resize",
    handle?: ResizeHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectElement(el.id);

    e.currentTarget.setPointerCapture(e.pointerId);
    const { xPct: px, yPct: py } = clientToPagePct(e.clientX, e.clientY);
    const initialRect = {
      xPct: el.xPct,
      yPct: el.yPct,
      wPct: el.wPct,
      hPct: el.hPct,
    };

    setDragSession({
      elementId: el.id,
      mode,
      handle,
      startPointerXPct: px,
      startPointerYPct: py,
      startRect: initialRect,
      currentRect: initialRect,
    });
  };

  const handleElementPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragSession) return;
    const { xPct: px, yPct: py } = clientToPagePct(e.clientX, e.clientY);
    const dx = px - dragSession.startPointerXPct;
    const dy = py - dragSession.startPointerYPct;
    const { startRect, mode, handle, elementId } = dragSession;

    if (mode === "move") {
      let nextX = Math.max(0, Math.min(100 - startRect.wPct, startRect.xPct + dx));
      let nextY = Math.max(0, Math.min(100 - startRect.hPct, startRect.yPct + dy));
      if (snapToGrid) {
        nextX = snapValue(nextX, 0.5, true);
        nextY = snapValue(nextY, 0.5, true);
      }
      const snapped = findSmartGuides(elementId, {
        xPct: nextX,
        yPct: nextY,
        wPct: startRect.wPct,
        hPct: startRect.hPct,
      });
      setGuides(snapped.guides);
      setDragSession((prev) => (prev ? { ...prev, currentRect: snapped.rect } : null));
      return;
    }

    // Resize mode with 8-handle anchor logic
    let nextX = startRect.xPct;
    let nextY = startRect.yPct;
    let nextW = startRect.wPct;
    let nextH = startRect.hPct;
    const minW = 3;
    const minH = 2;

    if (handle?.includes("e")) {
      nextW = Math.max(minW, Math.min(100 - startRect.xPct, startRect.wPct + dx));
    }
    if (handle?.includes("s")) {
      nextH = Math.max(minH, Math.min(100 - startRect.yPct, startRect.hPct + dy));
    }
    if (handle?.includes("w")) {
      const clampedDx = Math.max(-startRect.xPct, Math.min(startRect.wPct - minW, dx));
      nextX = startRect.xPct + clampedDx;
      nextW = startRect.wPct - clampedDx;
    }
    if (handle?.includes("n")) {
      const clampedDy = Math.max(-startRect.yPct, Math.min(startRect.hPct - minH, dy));
      nextY = startRect.yPct + clampedDy;
      nextH = startRect.hPct - clampedDy;
    }

    if (snapToGrid) {
      nextX = snapValue(nextX, 0.5, true);
      nextY = snapValue(nextY, 0.5, true);
      nextW = Math.max(minW, snapValue(nextW, 0.5, true));
      nextH = Math.max(minH, snapValue(nextH, 0.5, true));
    }

    setGuides([]);
    setDragSession((prev) =>
      prev
        ? {
            ...prev,
            currentRect: { xPct: nextX, yPct: nextY, wPct: nextW, hPct: nextH },
          }
        : null
    );
  };

  const finishElementPointerDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragSession) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const { elementId, currentRect, startRect } = dragSession;
    setDragSession(null);
    setGuides([]);

    const changed =
      Math.abs(currentRect.xPct - startRect.xPct) > 0.05 ||
      Math.abs(currentRect.yPct - startRect.yPct) > 0.05 ||
      Math.abs(currentRect.wPct - startRect.wPct) > 0.05 ||
      Math.abs(currentRect.hPct - startRect.hPct) > 0.05;

    if (changed) {
      onCommitElementGeometry(elementId, {
        xPct: Number(currentRect.xPct.toFixed(2)),
        yPct: Number(currentRect.yPct.toFixed(2)),
        wPct: Number(currentRect.wPct.toFixed(2)),
        hPct: Number(currentRect.hPct.toFixed(2)),
      });
    }
  };

  // Overlay config merged with live drag preview rect for 1:1 immediate visual feedback
  const liveOverlayConfig = useMemo<AnnexPresetConfig>(() => {
    if (!dragSession) return config;
    return {
      ...config,
      elements: config.elements.map((el) =>
        el.id === dragSession.elementId
          ? { ...el, ...dragSession.currentRect }
          : el
      ),
    };
  }, [config, dragSession]);

  const handleSurfaceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const isElementDrag = e.dataTransfer.types.includes("application/x-minsu-preset-element");
    const isFileDrag = e.dataTransfer.types.includes("Files") && Boolean(onUploadTemplateFile);
    if (isElementDrag || isFileDrag) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!isDragOver) setIsDragOver(true);
      if (isFileDrag && !isFileDragOver) setIsFileDragOver(true);
    }
  };

  const handleSurfaceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsFileDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadTemplateFile) {
      onUploadTemplateFile(e.dataTransfer.files[0]);
      return;
    }

    const raw = e.dataTransfer.getData("application/x-minsu-preset-element");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as PaletteDragPayload;
      const { xPct, yPct } = clientToPagePct(e.clientX, e.clientY);
      onDropCreateElement(payload, xPct, yPct);
    } catch (err) {
      console.error("Drop parse failed:", err);
    }
  };

  const activeSignatories = config.settings.signatories
    ? Object.values(config.settings.signatories)
    : [];

  return (
    <section className="flex flex-col h-full max-h-[calc(100vh-170px)] rounded-2xl border border-[#D6DDD8] bg-[#E9EFEA]/70 overflow-hidden relative apple-shadow">
      {/* Floating Apple Glass HUD Toolbar */}
      <div className="px-3 py-2 border-b border-[#D6DDD8] glass-surface flex flex-wrap items-center justify-between gap-2 shrink-0 z-20">
        {/* Page Switcher Pill */}
        <div className="flex items-center gap-1 bg-white/90 rounded-xl border border-[#D6DDD8] px-1.5 py-1 shadow-2xs">
          <button
            type="button"
            disabled={activePageIdx <= 0}
            onClick={() => activePageIdx > 0 && onSelectPage(config.pages[activePageIdx - 1].id)}
            className="p-1 rounded-lg hover:bg-[#F1F8F1] text-[#1F2A24] disabled:opacity-30"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-bold text-[#123F17] px-1.5 tabular-nums">
            Page {activePage.pageNumber} / {config.pages.length}
          </span>
          <span className="hidden sm:inline text-[11px] text-[#55645B] max-w-[140px] truncate pr-1">
            — {activePage.label}
          </span>
          <button
            type="button"
            disabled={activePageIdx >= config.pages.length - 1}
            onClick={() =>
              activePageIdx < config.pages.length - 1 &&
              onSelectPage(config.pages[activePageIdx + 1].id)
            }
            className="p-1 rounded-lg hover:bg-[#F1F8F1] text-[#1F2A24] disabled:opacity-30"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Preview Mode Toggle (Tokens vs Sample Data) */}
        <div className="inline-flex rounded-xl border border-[#D6DDD8] bg-white/90 p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onPreviewModeChange("preview-tokens")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              previewMode === "preview-tokens"
                ? "bg-[#1B5E20] text-white"
                : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            <Code2 className="w-3 h-3" />
            Tokens
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange("preview-sample")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              previewMode === "preview-sample"
                ? "bg-[#1B5E20] text-white"
                : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            <Eye className="w-3 h-3" />
            Sample Data
          </button>
        </div>

        {/* Right Snap & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSnapToGrid((prev) => !prev)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              snapToGrid
                ? "bg-[#DCEFDD] border-[#1B5E20]/30 text-[#123F17]"
                : "bg-white border-[#D6DDD8] text-[#55645B]"
            }`}
            title="Toggle 0.5% Grid Snapping"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap</span>
          </button>

          <div className="inline-flex items-center rounded-lg border border-[#D6DDD8] bg-white/90 px-1 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
              className="p-1 rounded hover:bg-[#F1F8F1] text-[#55645B]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-1.5 text-[11px] font-mono font-bold text-[#1F2A24]"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1 rounded hover:bg-[#F1F8F1] text-[#55645B]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Empty Canvas Upload Button */}
      <input
        ref={canvasFileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onUploadTemplateFile) {
            onUploadTemplateFile(f);
          }
          e.currentTarget.value = "";
        }}
        className="hidden"
      />

      {/* Scrollable Workspace Viewport */}
      <div
        className="flex-1 overflow-auto p-6 sm:p-8 flex items-start justify-center apple-scrollbar"
        onClick={() => onSelectElement(null)}
      >
        <div
          ref={pageSurfaceRef}
          onDragOver={handleSurfaceDragOver}
          onDragLeave={() => {
            setIsDragOver(false);
            setIsFileDragOver(false);
          }}
          onDrop={handleSurfaceDrop}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement(null);
          }}
          style={{
            width: `${baseWidthPx}px`,
            height: `${baseHeightPx}px`,
            backgroundImage: snapToGrid
              ? "radial-gradient(rgba(27,94,32,0.12) 1px, transparent 1px)"
              : undefined,
            backgroundSize: snapToGrid ? "16px 16px" : undefined,
          }}
          className={`relative bg-white shrink-0 shadow-[0_14px_38px_-10px_rgba(18,63,23,0.22)] border transition-shadow select-none ${
            isDragOver
              ? "ring-4 ring-[#1B5E20]/40 border-[#1B5E20]"
              : "border-[#D6DDD8]"
          }`}
        >
          {/* Background Layer 1: Uploaded PDF via pdfjs-dist */}
          {activePage.sourceType === "pdf" && activePage.fileUrl && (
            <>
              <canvas
                ref={pdfCanvasRef}
                className="w-full h-full block pointer-events-none"
              />
              {pdfRendering && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1B5E20]" />
                  <span className="text-xs font-semibold text-[#123F17]">
                    Rendering PDF page...
                  </span>
                </div>
              )}
              {pdfError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-red-700 bg-red-50/90 pointer-events-none">
                  {pdfError}
                </div>
              )}
            </>
          )}

          {/* Background Layer 2: Uploaded Image */}
          {activePage.sourceType === "image" && activePage.fileUrl && (
            <img
              src={activePage.fileUrl}
              alt={activePage.label}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none block"
            />
          )}

          {/* Background Layer 3: Empty Custom Page Placeholder */}
          {activePage.sourceType === "image" && !activePage.fileUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
              <div className="border-2 border-dashed border-[#D6DDD8] rounded-2xl p-8 max-w-sm space-y-2 bg-[#F6F8F6]/60">
                <FileUp className="w-8 h-8 text-[#1B5E20] mx-auto" />
                <p className="text-sm font-bold text-[#1F2A24]">
                  No Background File Uploaded Yet
                </p>
                <p className="text-xs text-[#55645B]">
                  Drop a PDF or image right here, click the button below, or drop textboxes and tables directly onto this sheet.
                </p>
                {onUploadTemplateFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      canvasFileInputRef.current?.click();
                    }}
                    className="pointer-events-auto mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5E20] text-white text-xs font-semibold hover:bg-[#25702A] apple-press"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Upload PDF / Image
                  </button>
                )}
              </div>
            </div>
          )}

          {isFileDragOver && (
            <div className="absolute inset-0 z-40 bg-[#1B5E20]/15 backdrop-blur-[2px] border-2 border-dashed border-[#1B5E20] flex flex-col items-center justify-center gap-2 pointer-events-none">
              <FileUp className="w-8 h-8 text-[#123F17]" />
              <p className="text-sm font-bold text-[#123F17] bg-white/90 px-4 py-1.5 rounded-full shadow-xs">
                Drop PDF, PNG, JPG, or WebP to upload template
              </p>
            </div>
          )}

          {/* Background Layer 4: Built-in Preset Blueprint Preview */}
          {activePage.sourceType === "builtin-tab" && (
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none text-[#1F2A24]">
              {/* Official MinSU Letterhead Mirror */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#1B5E20] pb-3">
                  <AnnexLogo
                    position="left"
                    config={config.settings.headerLogos?.leftLogo}
                    className="w-12 h-12"
                  />
                  <div className="text-center px-3">
                    <p className="text-[9px] uppercase tracking-wider text-[#55645B] font-semibold">
                      Republic of the Philippines • UniFAST / CHED {config.settings.regionCode || "MIMAROPA"}
                    </p>
                    <p className="text-xs font-bold text-[#123F17] mt-0.5">
                      {config.settings.heiName || "MINDORO STATE UNIVERSITY"}
                    </p>
                    <p className="text-[9px] text-[#55645B]">
                      {config.settings.heiAddress || "Oriental Mindoro"}
                    </p>
                    <p className="text-[11px] font-bold text-[#1F2A24] mt-1 uppercase">
                      Annex {config.annexNumber} — {activePage.label}
                    </p>
                  </div>
                  <AnnexLogo
                    position="right"
                    config={config.settings.headerLogos?.rightLogo}
                    className="w-12 h-12"
                  />
                </div>

                {/* Retained Defaults Snapshot */}
                <div className="grid grid-cols-3 gap-2 text-[9px] bg-[#F1F8F1]/80 border border-[#D6DDD8] rounded-lg p-2">
                  <div>
                    <span className="text-[#55645B] block">Campus / Batch</span>
                    <strong className="text-[#1F2A24]">
                      {config.settings.campus || "Main"} (Batch {config.settings.batchNumber || "1"})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#55645B] block">Academic Year / Term</span>
                    <strong className="text-[#1F2A24]">
                      AY {config.settings.academicYear || "2026-2027"} • Sem {config.settings.termCode || "1"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#55645B] block">Default Stipend / Rate</span>
                    <strong className="text-[#1B5E20] font-mono">
                      ₱{(config.settings.stipendPerGrantee ?? 7500).toLocaleString("en-US")}.00
                    </strong>
                  </div>
                </div>

                {/* Native Blueprint Body Hint */}
                <div className="border border-dashed border-[#D6DDD8] rounded-lg p-4 bg-[#F6F8F6]/50 space-y-2">
                  <div className="h-3 w-1/3 bg-[#DCEFDD] rounded" />
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className="h-2.5 bg-[#D6DDD8]/50 rounded" />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#55645B] italic pt-1">
                    Native Annex {config.annexNumber} interactive grid renders here. Drop optional overlay elements from the Right Palette anywhere above or around this blueprint.
                  </p>
                </div>
              </div>

              {/* Retained Signatories Preview */}
              {activeSignatories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#D6DDD8]/70">
                  {activeSignatories.slice(0, 4).map((sig, i) => (
                    <div key={i} className="text-center">
                      <div className="h-6 border-b border-[#1F2A24]/50 mb-1" />
                      <p className="text-[9px] font-bold uppercase truncate">{sig.name}</p>
                      <p className="text-[8px] text-[#55645B] truncate">{sig.position}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Layer 5: Visual WYSIWYG Elements Overlay */}
          <PresetOverlayLayer
            config={liveOverlayConfig}
            pageId={activePage.id}
            formData={{}}
            displayMode={previewMode}
          />

          {/* Layer 6: Smart Alignment Guides (visible only during drag) */}
          {guides.map((g, i) =>
            g.axis === "x" ? (
              <div
                key={`gx-${i}`}
                style={{ left: `${g.pct}%` }}
                className="absolute top-0 bottom-0 w-px border-l border-dashed border-[#1B5E20] pointer-events-none z-30"
              />
            ) : (
              <div
                key={`gy-${i}`}
                style={{ top: `${g.pct}%` }}
                className="absolute left-0 right-0 h-px border-t border-dashed border-[#1B5E20] pointer-events-none z-30"
              />
            )
          )}

          {/* Layer 7: Interactive Hit-Targets & Selection + 8-Handle Resize Chrome */}
          {pageElements.map((el) => {
            const isSelected = el.id === selectedElementId;
            const rect =
              dragSession && dragSession.elementId === el.id
                ? dragSession.currentRect
                : { xPct: el.xPct, yPct: el.yPct, wPct: el.wPct, hPct: el.hPct };

            return (
              <div
                key={el.id}
                onPointerDown={(e) => startElementPointerDrag(e, el, "move")}
                onPointerMove={handleElementPointerMove}
                onPointerUp={finishElementPointerDrag}
                onPointerCancel={finishElementPointerDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }}
                style={{
                  left: `${rect.xPct}%`,
                  top: `${rect.yPct}%`,
                  width: `${rect.wPct}%`,
                  height: `${rect.hPct}%`,
                  zIndex: isSelected ? 40 : (el.zIndex ?? 10) + 10,
                }}
                className={`absolute cursor-move touch-none group ${
                  isSelected
                    ? "ring-2 ring-[#1B5E20] bg-[#DCEFDD]/15"
                    : "hover:ring-1 hover:ring-[#1B5E20]/60 hover:bg-[#F1F8F1]/20"
                }`}
              >
                {/* Top floating label tag when selected or hovered */}
                <div
                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap flex items-center gap-1 pointer-events-none shadow-2xs ${
                    isSelected
                      ? "bg-[#1B5E20] text-white opacity-100"
                      : "bg-[#1F2A24]/80 text-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>{el.label}</span>
                  {dragSession?.elementId === el.id && (
                    <span className="font-mono text-[#FFF1C2]">
                      ({rect.xPct.toFixed(1)}%, {rect.yPct.toFixed(1)}%)
                    </span>
                  )}
                </div>

                {/* 8-Handle Resize Anchors */}
                {isSelected &&
                  HANDLES.map((h) => (
                    <div
                      key={h.id}
                      onPointerDown={(e) => startElementPointerDrag(e, el, "resize", h.id)}
                      onPointerMove={handleElementPointerMove}
                      onPointerUp={finishElementPointerDrag}
                      onPointerCancel={finishElementPointerDrag}
                      style={{ cursor: h.cursor }}
                      className={`absolute w-2.5 h-2.5 rounded-xs bg-white border-2 border-[#1B5E20] shadow-xs touch-none ${h.posClass}`}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

