"use client";

import React from "react";
import {
  FileCheck2,
  Clock,
  GraduationCap,
  Send,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { WorkflowSectionConfig } from "@/types/landing";

interface WorkflowSectionProps {
  content: WorkflowSectionConfig;
}

export function WorkflowSection({ content }: WorkflowSectionProps) {
  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "clock":
        return <Clock className="w-5 h-5 text-[#B88A00]" />;
      case "graduation-cap":
      case "student":
        return <GraduationCap className="w-5 h-5 text-[#1B5E20]" />;
      case "send":
        return <Send className="w-5 h-5 text-[#123F17]" />;
      case "shield-check":
        return <ShieldCheck className="w-5 h-5 text-[#1B5E20]" />;
      case "sparkles":
        return <Sparkles className="w-5 h-5 text-[#F2B705]" />;
      case "file-check":
      default:
        return <FileCheck2 className="w-5 h-5 text-[#1B5E20]" />;
    }
  };

  const getIconBg = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "clock":
        return "bg-gradient-to-br from-[#FFF1C2] to-[#FFF9E6] border-[#F2B705]/20";
      case "send":
        return "bg-gradient-to-br from-[#123F17] to-[#1B5E20] text-white border-white/20";
      case "sparkles":
        return "bg-gradient-to-br from-[#FFF1C2] to-[#FFF8E1] border-[#F2B705]/30";
      default:
        return "bg-gradient-to-br from-[#DCEFDD] to-[#F1F8F1] border-[#1B5E20]/10";
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">
      {(content.sectionTitle || content.sectionSubtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-10">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full text-left">
        {content.cards?.map((card) => (
          <div
            key={card.id}
            className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-[#D6DDD8]/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border ${getIconBg(
                    card.icon
                  )}`}
                >
                  {getIcon(card.icon)}
                </div>
                {card.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F8F1] text-[#1B5E20] border border-[#1B5E20]/15">
                    {card.badge}
                  </span>
                )}
              </div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-[#1F2A24] tracking-tight">
                {card.title}
              </h4>
              <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
