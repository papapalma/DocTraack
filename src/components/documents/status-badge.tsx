import React from "react";
import { DocumentStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = "md",
}) => {
  const getBadgeConfig = (status: DocumentStatus) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          dotColor: "bg-slate-400",
          style: "bg-slate-100/80 text-slate-700 border-slate-200/80",
        };
      case "SUBMITTED":
        return {
          label: "Submitted for Review",
          dotColor: "bg-amber-500 animate-pulse",
          style: "bg-amber-50 text-amber-900 border-amber-300/80 font-semibold shadow-xs",
        };
      case "RESUBMITTED":
        return {
          label: "Resubmitted",
          dotColor: "bg-amber-500 animate-pulse",
          style: "bg-amber-50 text-amber-900 border-amber-300/80 font-semibold shadow-xs",
        };
      case "RETURNED":
        return {
          label: "Returned (Needs Revision)",
          dotColor: "bg-rose-500",
          style: "bg-rose-50 text-rose-800 border-rose-300/80 font-medium",
        };
      case "APPROVED":
        return {
          label: "Approved",
          dotColor: "bg-[#2E7D32]",
          style: "bg-[#DCEFDD] text-[#123F17] border-[#2E7D32]/40 font-semibold shadow-xs",
        };
      case "UPLOADED":
        return {
          label: "Scan Uploaded",
          dotColor: "bg-[#1B5E20]",
          style: "bg-[#DCEFDD] text-[#123F17] border-[#1B5E20]/30 font-medium",
        };
      case "TRANSMITTED":
        return {
          label: "Transmitted to Agency",
          dotColor: "bg-[#123F17]",
          style: "bg-[#123F17] text-white border-transparent font-medium shadow-xs",
        };
      case "ARCHIVED":
        return {
          label: "Archived",
          dotColor: "bg-slate-500",
          style: "bg-slate-100 text-slate-600 border-slate-300",
        };
      default:
        return {
          label: status,
          dotColor: "bg-slate-400",
          style: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const { label, dotColor, style } = getBadgeConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu select-none",
        size === "sm" ? "px-2.5 py-0.5 text-[11px] leading-tight" : "px-3.5 py-1 text-xs",
        style,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200", dotColor)} />
      <span>{label}</span>
    </span>
  );
};
