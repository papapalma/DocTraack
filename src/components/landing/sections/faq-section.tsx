"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FaqSectionConfig } from "@/types/landing";

interface FaqSectionProps {
  content: FaqSectionConfig;
}

export function FaqSection({ content }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!content.items || content.items.length === 0) return null;

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEFDD] text-[#123F17] text-xs font-bold mb-3 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support & Clarifications</span>
        </div>
        {content.sectionTitle && (
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1F2A24] tracking-tight">
            {content.sectionTitle}
          </h3>
        )}
        {content.sectionSubtitle && (
          <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
            {content.sectionSubtitle}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {content.items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[#D6DDD8]/80 bg-white shadow-2xs overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-[#1F2A24] hover:bg-[#F1F8F1]/50 active:bg-[#F1F8F1] transition-colors"
                aria-expanded={isOpen}
              >
                <span className="pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#1B5E20] transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#55645B] leading-relaxed border-t border-[#D6DDD8]/50 pt-3 animate-in fade-in duration-150">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
