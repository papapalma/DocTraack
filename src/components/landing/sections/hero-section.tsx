"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { HeroSectionConfig } from "@/types/landing";
import { MinsuCrestCanvas } from "@/components/landing/three/minsu-crest-canvas";

interface HeroSectionProps {
  content: HeroSectionConfig;
  enable3DOrbit?: boolean;
  onAuthAction?: (mode: "login" | "register") => void;
}

export function HeroSection({ content, enable3DOrbit = true, onAuthAction }: HeroSectionProps) {
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
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 lg:pt-12 pb-8 sm:pb-12 flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-4 sm:gap-y-6 lg:gap-x-10 items-center">
        {/* Status Capsule */}
        {content.badgeText && (
          <div className="lg:col-span-7 lg:col-start-1 flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#1B5E20]/20 text-[#123F17] text-[11px] sm:text-xs font-semibold shadow-xs animate-in fade-in duration-500">
              <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse shrink-0" />
              <span className="break-words text-center sm:text-left">{content.badgeText}</span>
            </div>
          </div>
        )}

        {/* Keynote Headline */}
        <div className="lg:col-span-7 lg:col-start-1 text-center lg:text-left">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-extrabold tracking-tight leading-[1.12] text-[#1F2A24]">
            {content.headlinePrefix}{" "}
            <span className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#B88A00] bg-clip-text text-transparent">
              {content.headlineHighlight}
            </span>
          </h2>
        </div>

        {/* Subheadline */}
        {content.subheadline && (
          <div className="lg:col-span-7 lg:col-start-1 text-center lg:text-left">
            <p className="text-xs sm:text-base lg:text-lg text-[#55645B] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {content.subheadline}
            </p>
          </div>
        )}

        {/* 3D Crest Orbit Canvas:
            - On Mobile (< lg): Placed between description and CTA buttons for fluid visual hierarchy!
            - On Desktop (lg+): Anchored in right column (cols 8-12, spanning rows 1 to 5)
        */}
        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-5 flex items-center justify-center w-full my-2 lg:my-0">
          <MinsuCrestCanvas
            className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-none"
            showOrbit={enable3DOrbit}
          />
        </div>

        {/* Interactive CTAs */}
        <div className="lg:col-span-7 lg:col-start-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-4 w-full sm:w-auto">
          {content.primaryCtaText && (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 sm:px-7 sm:py-3.5 shadow-md font-semibold text-xs sm:text-base apple-press"
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
              className="w-full sm:w-auto px-6 py-3 sm:px-7 sm:py-3.5 border-[#1B5E20]/40 text-[#1B5E20] font-semibold text-xs sm:text-base apple-press"
              onClick={handleSecondaryClick}
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {content.secondaryCtaText}
            </Button>
          )}
        </div>

        {/* Institutional Trust Quick Badges */}
        <div className="lg:col-span-7 lg:col-start-1 pt-3 sm:pt-4 border-t border-[#D6DDD8]/60 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-[11px] sm:text-xs text-[#55645B]">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B5E20]" />
            <span>CHED TDP-TES Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B88A00]" />
            <span>3 MinSU Campuses Unified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
