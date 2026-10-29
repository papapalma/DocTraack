"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap } from "lucide-react";
import { HeroSectionConfig } from "@/types/landing";

interface HeroSectionProps {
  content: HeroSectionConfig;
  onAuthAction?: (mode: "login" | "register") => void;
}

export function HeroSection({ content, onAuthAction }: HeroSectionProps) {
  const handlePrimaryClick = () => {
    if (content.primaryCtaAction === "login" || content.primaryCtaAction === "register") {
      onAuthAction?.(content.primaryCtaAction);
    } else if (content.primaryCtaUrl) {
      window.location.href = content.primaryCtaUrl;
    }
  };

  const handleSecondaryClick = () => {
    if (content.secondaryCtaAction === "login" || content.secondaryCtaAction === "register") {
      onAuthAction?.(content.secondaryCtaAction);
    } else if (content.secondaryCtaUrl) {
      window.location.href = content.secondaryCtaUrl;
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-10 sm:pt-16 pb-12 flex flex-col items-center text-center">
      {/* Apple Status Capsule */}
      {content.badgeText && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#1B5E20]/15 text-[#123F17] text-xs font-semibold shadow-xs mb-6 sm:mb-8 animate-in fade-in duration-500">
          <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
          <span>{content.badgeText}</span>
        </div>
      )}

      {/* Keynote Headline */}
      <h2 className="text-3xl xs:text-4xl sm:text-6xl font-heading font-extrabold tracking-tight max-w-4xl leading-[1.1] text-[#1F2A24]">
        {content.headlinePrefix}{" "}
        <span className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#164D1C] bg-clip-text text-transparent">
          {content.headlineHighlight}
        </span>
      </h2>

      {/* Subtitle */}
      {content.subheadline && (
        <p className="text-sm sm:text-lg text-[#55645B] max-w-2xl mt-4 sm:mt-6 leading-relaxed font-normal">
          {content.subheadline}
        </p>
      )}

      {/* Apple CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full sm:w-auto">
        {content.primaryCtaText && (
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 shadow-md font-semibold"
            onClick={handlePrimaryClick}
          >
            {content.primaryCtaText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {content.secondaryCtaText && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 border-[#1B5E20]/40 text-[#1B5E20] font-semibold"
            onClick={handleSecondaryClick}
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            {content.secondaryCtaText}
          </Button>
        )}
      </div>
    </section>
  );
}
