"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { LandingSection, LandingStyleSettings, DEFAULT_STYLE_SETTINGS } from "@/types/landing";
import { MotionContext } from "@/components/landing/motion/motion-wrapper";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { AnnouncementSection } from "@/components/landing/sections/announcement-section";
import { WorkflowSection } from "@/components/landing/sections/workflow-section";
import { StatsSection } from "@/components/landing/sections/stats-section";
import { FaqSection } from "@/components/landing/sections/faq-section";
import { ContactSection } from "@/components/landing/sections/contact-section";
import { EligibilityCheckerSection } from "@/components/landing/sections/eligibility-checker-section";
import { LeadershipTrustSection } from "@/components/landing/sections/leadership-trust-section";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

interface ModularLandingProps {
  sections: LandingSection[];
  styleSettings?: LandingStyleSettings;
  onAuthAction?: (mode: "login" | "register") => void;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  isEmbeddedPreview?: boolean;
  showKioskButton?: boolean;
}

export function ModularLanding({
  sections,
  styleSettings = DEFAULT_STYLE_SETTINGS,
  onAuthAction,
  showHeader = true,
  showFooter = true,
  className = "",
  isEmbeddedPreview = false,
  showKioskButton,
}: ModularLandingProps) {
  const [fetchedShowKiosk, setFetchedShowKiosk] = useState(false);

  useEffect(() => {
    if (showKioskButton !== undefined || isEmbeddedPreview) return;
    let cancelled = false;
    fetch("/api/queue/config", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.config) {
          setFetchedShowKiosk(Boolean(data.config.showHomepageKioskButton));
        }
      })
      .catch(() => {
        // Non-blocking fallback when config endpoint is unreachable
      });
    return () => {
      cancelled = true;
    };
  }, [showKioskButton, isEmbeddedPreview]);

  const effectiveShowKioskButton =
    showKioskButton !== undefined ? showKioskButton : fetchedShowKiosk;

  const activeSections = sections.filter((s) => s.enabled);

  const bgImage = styleSettings.customBgImage?.trim() || "/campus-bg.jpg";

  // Dynamic frosted glass opacity
  const overlayOpacityClasses =
    styleSettings.bgOverlayOpacity === "light"
      ? "bg-gradient-to-b from-[#F6F8F6]/76 via-[#EFF5F0]/70 to-[#F6F8F6]/80 backdrop-blur-[1px]"
      : styleSettings.bgOverlayOpacity === "deep"
      ? "bg-gradient-to-b from-[#F6F8F6]/95 via-[#EFF5F0]/93 to-[#F6F8F6]/97 backdrop-blur-[2.5px]"
      : "bg-gradient-to-b from-[#F6F8F6]/88 via-[#EFF5F0]/84 to-[#F6F8F6]/92 backdrop-blur-[1.5px]";

  return (
    <MotionContext.Provider value={styleSettings}>
      <div className={`relative min-h-screen flex flex-col selection:bg-[#F2B705]/30 ${isEmbeddedPreview ? "overflow-hidden" : ""} ${className}`}>
        {/* Fullscreen Campus Photo Layer (Parallax Background) */}
        <div
          className={`${isEmbeddedPreview ? "absolute" : "fixed"} inset-0 -z-30 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700`}
          style={{
            backgroundImage: `url('${bgImage}'), url('/campus-bg.jpg'), url('/campus-bg.png'), url('/bg.jpg')`,
          }}
        />

        {/* Dynamic Frosted MinSU Emerald-Ivory Tint Overlay */}
        <div className={`${isEmbeddedPreview ? "absolute" : "fixed"} inset-0 -z-20 pointer-events-none transition-all duration-500 ${overlayOpacityClasses}`} />

        {/* Top Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 h-16 sm:h-20 bg-[#1B5E20]/95 backdrop-blur-xl border-b border-[#F2B705]/40 text-white flex items-center justify-between px-3 sm:px-8 md:px-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <Logo size="md" className="sm:hidden" />
            <Logo size="lg" className="hidden sm:flex" />
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base sm:text-2xl tracking-tight text-white leading-tight truncate">
                MinSU DocTrack
              </h1>
              <p className="text-[10px] sm:text-xs text-[#DCEFDD]/90 font-medium truncate">
                <span className="sm:hidden">Mindoro State University</span>
                <span className="hidden sm:inline">Mindoro State University • Tulong Dunong Program (TDP)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {effectiveShowKioskButton && !isEmbeddedPreview && (
              <Link
                href="/kiosk"
                className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F2B705]" />
                <span>Walk-In Kiosk</span>
              </Link>
            )}
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
      <main className="flex-1 w-full flex flex-col items-center">
        {activeSections.map((section) => {
          switch (section.type) {
            case "HERO":
              return (
                <HeroSection
                  key={section.id}
                  content={section.content as any}
                  enable3DOrbit={styleSettings.enable3DOrbit}
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
            case "ELIGIBILITY_CHECKER":
              return (
                <EligibilityCheckerSection
                  key={section.id}
                  content={section.content as any}
                  onAuthAction={onAuthAction}
                />
              );
            case "LEADERSHIP_TRUST":
              return (
                <LeadershipTrustSection
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
  </MotionContext.Provider>
  );
}
