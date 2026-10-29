"use client";

import React from "react";
import { StatsSectionConfig } from "@/types/landing";

interface StatsSectionProps {
  content: StatsSectionConfig;
}

export function StatsSection({ content }: StatsSectionProps) {
  if (!content.items || content.items.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
      {(content.sectionTitle || content.sectionSubtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-8">
          {content.sectionTitle && (
            <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1F2A24] tracking-tight">
              {content.sectionTitle}
            </h3>
          )}
          {content.sectionSubtitle && (
            <p className="text-xs sm:text-sm text-[#55645B] mt-1.5 leading-relaxed">
              {content.sectionSubtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {content.items.map((stat) => (
          <div
            key={stat.id}
            className="p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-[#D6DDD8]/80 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-center hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            <span className="text-2xl sm:text-4xl font-heading font-black bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#B88A00] bg-clip-text text-transparent tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#1F2A24] mt-1">
              {stat.label}
            </span>
            {stat.subtext && (
              <span className="text-[11px] text-[#55645B] mt-0.5 leading-tight">
                {stat.subtext}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
