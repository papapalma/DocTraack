"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationBarProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function PaginationBar({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  itemLabel = "records",
}: PaginationBarProps) {
  // Generate page pills with ellipsis for large page counts
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];

    if (page > 3) {
      pages.push("ellipsis-start");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3.5 px-4 py-3 bg-[#F6F8F6] border-t border-[#D6DDD8] text-xs text-[#55645B]",
        className
      )}
    >
      {/* Left: Summary & Rows-per-page */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing{" "}
          <strong className="font-bold text-[#1F2A24] tabular-nums">{startIndex}</strong> to{" "}
          <strong className="font-bold text-[#1F2A24] tabular-nums">{endIndex}</strong> of{" "}
          <strong className="font-bold text-[#1F2A24] tabular-nums">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-[#D6DDD8] pl-3 ml-1">
            <span className="text-[11px] text-[#55645B]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-[#D6DDD8] rounded-lg px-2 py-1 text-xs text-[#1F2A24] font-medium focus:outline-none focus:ring-1 focus:ring-[#1B5E20] focus:border-[#1B5E20] cursor-pointer"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="apple-press p-1.5 rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] hover:bg-[#F1F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="apple-press p-1.5 rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] hover:bg-[#F1F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span key={`${p}-${idx}`} className="px-1.5 text-neutral-400 select-none">
                  •••
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "apple-press min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold tabular-nums transition-all flex items-center justify-center",
                  isCurrent
                    ? "bg-[#1B5E20] text-white shadow-xs border border-[#1B5E20]"
                    : "bg-white text-[#1F2A24] border border-[#D6DDD8] hover:bg-[#F1F8F1] hover:border-[#1B5E20]/40"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="apple-press p-1.5 rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] hover:bg-[#F1F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="apple-press p-1.5 rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] hover:bg-[#F1F8F1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

