"use client";

import React from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortDirection } from "@/hooks/use-table";

export interface SortableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  label: React.ReactNode;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: SortDirection;
  onSort?: (key: string) => void;
  align?: "left" | "center" | "right";
  minWidth?: string;
}

export function SortableTh({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  align = "left",
  minWidth,
  className,
  children,
  style,
  ...props
}: SortableThProps) {
  const isActive = currentSortKey === sortKey && currentDirection !== null;
  const isAsc = isActive && currentDirection === "asc";
  const isDesc = isActive && currentDirection === "desc";

  const handleClick = () => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const alignClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[align];

  return (
    <th
      scope="col"
      role="columnheader"
      tabIndex={0}
      aria-sort={isAsc ? "ascending" : isDesc ? "descending" : "none"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ minWidth: minWidth, ...style }}
      className={cn(
        "py-3.5 px-4 text-xs font-semibold uppercase tracking-wider select-none cursor-pointer group transition-colors focus:outline-none focus:bg-[#E8EDE9]",
        isActive
          ? "bg-[#DCEFDD]/80 text-[#123F17] font-bold"
          : "text-[#1F2A24] hover:bg-[#E8EDE9]/80",
        className
      )}
      {...props}
    >
      <div className={cn("inline-flex items-center gap-1.5 w-full", alignClasses)}>
        <span className="truncate">{label || children}</span>
        <span
          className={cn(
            "shrink-0 inline-flex items-center justify-center transition-transform duration-150",
            isActive ? "text-[#1B5E20]" : "text-neutral-400 opacity-60 group-hover:opacity-100 group-hover:text-[#1B5E20]"
          )}
          aria-hidden="true"
        >
          {isAsc ? (
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : isDesc ? (
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    </th>
  );
}

