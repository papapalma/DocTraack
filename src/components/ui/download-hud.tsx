"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCw,
  Loader2,
  DownloadCloud,
} from "lucide-react";

export type DownloadFileType = "excel" | "word" | "pdf" | "csv" | "json" | "generic";
export type DownloadStatus = "preparing" | "downloading" | "completed" | "error";

export interface DownloadItem {
  id: string;
  url?: string;
  filename: string;
  fileType: DownloadFileType;
  status: DownloadStatus;
  progress?: number;
  errorMessage?: string;
  startedAt: number;
  retry?: () => void;
}

interface DownloadHUDProps {
  items: DownloadItem[];
  onDismiss: (id: string) => void;
}

export function detectFileType(filename: string, url?: string): DownloadFileType {
  const target = `${filename || ""} ${url || ""}`.toLowerCase();
  if (target.includes(".xlsx") || target.includes(".xls") || target.includes("export-excel") || target.includes("excel")) return "excel";
  if (target.includes(".docx") || target.includes(".doc") || target.includes("export-doc") || target.includes("word")) return "word";
  if (target.includes(".pdf")) return "pdf";
  if (target.includes(".csv") || target.includes("csv")) return "csv";
  if (target.includes(".json") || target.includes("json")) return "json";
  return "generic";
}

function getFileTypeBadge(type: DownloadFileType) {
  switch (type) {
    case "excel":
      return {
        icon: FileSpreadsheet,
        label: "XLSX",
        bg: "bg-[#DCEFDD]",
        text: "text-[#1B5E20]",
        border: "border-[#1B5E20]/25",
      };
    case "word":
      return {
        icon: FileText,
        label: "DOC",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "pdf":
      return {
        icon: FileText,
        label: "PDF",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      };
    case "csv":
      return {
        icon: FileCode,
        label: "CSV",
        bg: "bg-[#FFF1C2]",
        text: "text-[#B88A00]",
        border: "border-[#F2B705]/40",
      };
    case "json":
      return {
        icon: FileCode,
        label: "JSON",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      };
    default:
      return {
        icon: File,
        label: "FILE",
        bg: "bg-neutral-100",
        text: "text-neutral-700",
        border: "border-neutral-200",
      };
  }
}

export function DownloadHUD({ items, onDismiss }: DownloadHUDProps) {
  const prefersReduced = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Downloads"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] flex flex-col-reverse gap-2.5 max-w-[92vw] sm:max-w-md w-full pointer-events-none select-none"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => {
          const badge = getFileTypeBadge(item.fileType);
          const Icon = badge.icon;
          const isFinished = item.status === "completed";
          const isError = item.status === "error";
          const isLoading = item.status === "preparing" || item.status === "downloading";

          return (
            <motion.div
              key={item.id}
              layout={!prefersReduced}
              initial={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 24, scale: 0.95 }
              }
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                prefersReduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.95 }
              }
              transition={{
                duration: 0.24,
                ease: [0.16, 1, 0.3, 1], // Apple fluid easing
                layout: {
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                },
              }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-[#D6DDD8] shadow-lg shadow-black/5 p-3.5 sm:p-4 text-sm"
              style={{
                boxShadow:
                  "0 10px 25px -5px rgba(27, 94, 32, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex items-start gap-3">
                {/* Filetype Icon Badge */}
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0 border ${badge.bg} ${badge.border} ${badge.text}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-white shadow-xs border border-[#D6DDD8] text-[#1F2A24]">
                    {badge.label}
                  </span>
                </div>

                {/* File Details & Status */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="font-semibold text-xs sm:text-sm text-[#1F2A24] truncate"
                      title={item.filename}
                    >
                      {item.filename}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      className="p-1 rounded-md text-[#55645B] hover:text-[#1F2A24] hover:bg-neutral-100 transition-colors apple-press"
                      title="Dismiss"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    {isLoading && (
                      <div className="flex items-center gap-1.5 text-xs text-[#1B5E20] font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1B5E20]" />
                        <span>
                          {item.status === "preparing"
                            ? "Preparing export..."
                            : "Generating & downloading..."}
                        </span>
                      </div>
                    )}

                    {isFinished && (
                      <div className="flex items-center gap-1.5 text-xs text-[#1B5E20] font-medium">
                        <motion.div
                          initial={prefersReduced ? {} : { scale: 0 }}
                          animate={prefersReduced ? {} : { scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 20,
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
                        </motion.div>
                        <span>Download complete • Saved</span>
                      </div>
                    )}

                    {isError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {item.errorMessage || "Download failed. Please try again."}
                        </span>
                        {item.retry && (
                          <button
                            type="button"
                            onClick={() => item.retry?.()}
                            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-colors apple-press"
                          >
                            <RotateCw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bottom Bar */}
              {isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#1B5E20] via-[#25702A] to-[#F2B705]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.25,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              )}

              {isFinished && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#1B5E20] origin-left"
                />
              )}

              {isError && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
