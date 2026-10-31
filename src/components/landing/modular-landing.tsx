"use client";

import React from "react";
import { LandingSection } from "@/types/landing";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { AnnouncementSection } from "@/components/landing/sections/announcement-section";
import { WorkflowSection } from "@/components/landing/sections/workflow-section";
import { StatsSection } from "@/components/landing/sections/stats-section";
import { FaqSection } from "@/components/landing/sections/faq-section";
import { ContactSection } from "@/components/landing/sections/contact-section";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

interface ModularLandingProps {
  sections: LandingSection[];
  onAuthAction?: (mode: "login" | "register") => void;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function ModularLanding({
  sections,
  onAuthAction,
  showHeader = true,
  showFooter = true,
}: ModularLandingProps) {
  const activeSections = sections.filter((s) => s.enabled);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#F6F8F6] via-[#EFF5F0] to-[#F6F8F6] flex flex-col selection:bg-[#F2B705]/30">
      {/* Top Header */}
      {showHeader && (
        <header className="shrink-0 z-40 h-16 sm:h-20 bg-[#1B5E20]/95 backdrop-blur-xl border-b border-[#F2B705]/40 text-white flex items-center justify-between px-3 sm:px-8 md:px-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <Logo size="md" className="sm:hidden" />
            <Logo size="lg" className="hidden sm:flex" />
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base sm:text-2xl tracking-tight text-white leading-tight truncate">
                MinSU DocTrack
              </h1>
              <p className="text-[10px] sm:text-xs text-[#DCEFDD]/90 font-medium hidden xs:block sm:block truncate">
                Mindoro State University • Tulong Dunong Program (TDP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="accent"
              size="sm"
              className="h-9 sm:h-10 px-3.5 sm:px-5 font-semibold text-xs sm:text-sm shadow-sm"
              onClick={() => onAuthAction?.("login")}
            >
              Sign In
            </Button>
          </div>
        </header>
      )}

      {/* Main Sections */}
      <main className="flex-1 h-full min-h-0 overflow-y-auto w-full flex flex-col items-center apple-scrollbar">
        {activeSections.map((section) => {
          switch (section.type) {
            case "HERO":
              return (
                <HeroSection
                  key={section.id}
                  content={section.content as any}
                  onAuthAction={onAuthAction}
                />
              );
            case "ANNOUNCEMENT":
              return (
                <AnnouncementSection
                  key={section.id}
                  content={section.content as any}
                  onAuthAction={onAuthAction}
                />
              );
            case "WORKFLOW":
              return (
                <WorkflowSection
                  key={section.id}
                  content={section.content as any}
                />
              );
            case "STATS":
              return (
                <StatsSection
                  key={section.id}
                  content={section.content as any}
                />
              );
            case "FAQ":
              return (
                <FaqSection
                  key={section.id}
                  content={section.content as any}
                />
              );
            case "CONTACT":
              return (
                <ContactSection
                  key={section.id}
                  content={section.content as any}
                />
              );
            default:
              return null;
          }
        })}

        {/* Footer */}
        {showFooter && (
          <footer className="w-full py-6 border-t border-[#D6DDD8]/70 bg-white/60 backdrop-blur-md text-center text-xs text-[#55645B] shrink-0">
            <p>© 2026 Mindoro State University (MinSU) • All Rights Reserved</p>
            <p className="mt-1 text-[11px] text-[#55645B]/80">
              Tulong Dunong Program - Unified Student Financial Assistance System
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}
