"use client";

import * as React from "react";
import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  FileText,
  FileSpreadsheet,
  Layers,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  annexNumber: number;
  orientation: "portrait" | "landscape";
  onOrientationChange: (orientation: "portrait" | "landscape") => void;
  availableForms?: { id: string; label: string; defaultOrientation?: "portrait" | "landscape" }[];
  activeFormId?: string;
  activeFormLabel?: string;
  scope?: "active" | "all";
  onScopeChange?: (scope: "active" | "all") => void;
  previewContent: React.ReactNode;
  onPrint?: () => void;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  documentTitle,
  annexNumber,
  orientation,
  onOrientationChange,
  availableForms,
  activeFormId,
  activeFormLabel,
  scope = "active",
  onScopeChange,
  previewContent,
  onPrint,
}: PrintPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handlePrintAction = () => {
    // 1. Inject or update dynamic page style tag for precise orientation
    let styleEl = document.getElementById("minsu-print-page-style") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "minsu-print-page-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${orientation}; margin: 8mm 10mm; }`;
    document.body.setAttribute("data-print-orientation", orientation);

    if (onPrint) {
      onPrint();
    }

    setTimeout(() => {
      window.print();
    }, 150);

    const handleAfterPrint = () => {
      document.body.removeAttribute("data-print-orientation");
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 print:hidden print-preview-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
    >
      {/* Apple Frosted Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Apple Glass Surface Modal Container */}
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1B5E20] via-[#164D1C] to-[#123F17] text-white flex items-center justify-between border-b border-[#F2B705]/30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F2B705] text-[#123F17] tracking-wider uppercase">
              Annex {annexNumber}
            </span>
            <div>
              <h2
                id="print-modal-title"
                className="text-base font-bold font-heading text-white flex items-center gap-2"
              >
                Official Print & PDF Export
              </h2>
              <p className="text-xs text-white/80 truncate max-w-md">
                {documentTitle} • CHED / UniFAST / MinSU Compliant Paper Layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 apple-press transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fluid Apple Segmented Controls Toolbar */}
        <div className="px-5 py-3 bg-[#F6F8F6]/90 backdrop-blur-md border-b border-[#D6DDD8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Control 1: Orientation Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#55645B] uppercase tracking-wider hidden sm:inline">
                Orientation:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-white border border-[#D6DDD8] shadow-xs">
                <button
                  type="button"
                  onClick={() => onOrientationChange("portrait")}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold apple-press transition-all ${
                    orientation === "portrait"
                      ? "bg-[#1B5E20] text-white shadow-xs"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                  title="Vertical letter page orientation"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOrientationChange("landscape")}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold apple-press transition-all ${
                    orientation === "landscape"
                      ? "bg-[#1B5E20] text-white shadow-xs"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                  title="Horizontal wide page orientation (best for ledgers and grantee tables)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Landscape</span>
                </button>
              </div>
            </div>

            {/* Control 2: Packet Scope Switcher (if multi-form exists) */}
            {availableForms && availableForms.length > 1 && onScopeChange && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#55645B] uppercase tracking-wider hidden sm:inline">
                  Packet Scope:
                </span>
                <div className="inline-flex p-1 rounded-xl bg-white border border-[#D6DDD8] shadow-xs">
                  <button
                    type="button"
                    onClick={() => onScopeChange("active")}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold apple-press transition-all ${
                      scope === "active"
                        ? "bg-[#1B5E20] text-white shadow-xs"
                        : "text-[#55645B] hover:text-[#1F2A24]"
                    }`}
                    title="Print only the currently active sheet"
                  >
                    <Check className={`w-3 h-3 ${scope === "active" ? "inline" : "hidden"}`} />
                    <span>{activeFormLabel || "Current Sheet"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onScopeChange("all")}
                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold apple-press transition-all ${
                      scope === "all"
                        ? "bg-[#1B5E20] text-white shadow-xs"
                        : "text-[#55645B] hover:text-[#1F2A24]"
                    }`}
                    title="Print all document parts sequentially with page breaks"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Complete Packet ({availableForms.length} Forms)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Zoom & Main Action Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 bg-white border border-[#D6DDD8] rounded-xl px-2 py-0.5 text-xs text-[#55645B]">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="p-1 hover:text-[#1F2A24] apple-press"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-9 text-center font-medium">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:text-[#1F2A24] apple-press"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:text-[#1F2A24] apple-press ml-1 border-l border-[#D6DDD8]"
                title="Reset zoom"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={handlePrintAction}
              className="bg-[#1B5E20] hover:bg-[#164D1C] text-white font-bold h-9 px-4 gap-2 apple-press shadow-md"
            >
              <Printer className="w-4 h-4 text-[#F2B705]" />
              <span>Print / Save as PDF</span>
            </Button>
          </div>
        </div>

        {/* Paper Canvas Staging Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#E8EBE8] p-3 sm:p-8 flex justify-center apple-scrollbar">
          <div
            className={`transition-all duration-300 mx-auto ${
              orientation === "portrait" ? "max-w-4xl w-full" : "max-w-6xl w-full"
            }`}
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: "top center",
            }}
          >
            {/* Floating Paper Preview with Apple Multi-stop Shadow */}
            <div className="bg-white rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.12),0_3px_10px_rgba(0,0,0,0.06)] border border-[#C5CDC6] p-6 sm:p-10 min-h-[600px] text-ink">
              {/* Top Watermark / Helper Info */}
              <div className="flex items-center justify-between text-[11px] text-[#55645B] border-b border-dashed border-[#D6DDD8] pb-2 mb-6">
                <span className="flex items-center gap-1 font-medium">
                  <Info className="w-3.5 h-3.5 text-[#1B5E20]" />
                  Official Print Preview — Navigation, toolbars, and dashboard cards are excluded.
                </span>
                <span className="font-mono uppercase text-[10px] bg-[#F1F8F1] text-[#123F17] px-2 py-0.5 rounded font-bold">
                  {orientation} • A4/Letter
                </span>
              </div>

              {/* Injected Preview Content */}
              <div className="annex-preview-paper-root">{previewContent}</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

