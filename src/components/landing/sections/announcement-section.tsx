"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";
import { AnnouncementSectionConfig } from "@/types/landing";

interface AnnouncementSectionProps {
  content: AnnouncementSectionConfig;
  onAuthAction?: (mode: "login" | "register") => void;
}

export function AnnouncementSection({ content, onAuthAction }: AnnouncementSectionProps) {
  if (!content.message) return null;

  const variantStyles = {
    warning: "bg-[#FFF9E6] border-[#F2B705]/60 text-[#8C6B00]",
    info: "bg-[#EBF3FF] border-[#0066CC]/30 text-[#004C99]",
    success: "bg-[#EAF7EC] border-[#1B5E20]/30 text-[#123F17]",
  };

  const badgeStyles = {
    warning: "bg-[#F2B705] text-[#123F17]",
    info: "bg-[#0066CC] text-white",
    success: "bg-[#1B5E20] text-white",
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (content.linkUrl === "/?auth=register" || content.linkUrl?.includes("auth=register")) {
      e.preventDefault();
      onAuthAction?.("register");
    } else if (content.linkUrl === "/?auth=login" || content.linkUrl?.includes("auth=login")) {
      e.preventDefault();
      onAuthAction?.("login");
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 my-2">
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
          variantStyles[content.variant || "warning"]
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/80 shadow-2xs shrink-0">
            <Megaphone className="w-4 h-4 text-current" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {content.badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-2xs ${
                  badgeStyles[content.variant || "warning"]
                }`}
              >
                {content.badge}
              </span>
            )}
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {content.message}
            </p>
          </div>
        </div>

        {content.linkText && content.linkUrl && (
          <Link
            href={content.linkUrl}
            onClick={handleLinkClick}
            className="inline-flex items-center text-xs font-bold underline-offset-4 hover:underline shrink-0 group ml-auto sm:ml-0"
          >
            <span>{content.linkText}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
