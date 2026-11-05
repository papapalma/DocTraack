"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Award,
  Building2,
  CheckCircle2,
  Sparkles,
  FileBadge,
  Quote,
  School,
} from "lucide-react";
import { LeadershipTrustSectionConfig } from "@/types/landing";
import {
  ScrollReveal,
  AppleTiltCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/landing/motion/motion-wrapper";

interface LeadershipTrustSectionProps {
  content: LeadershipTrustSectionConfig;
}

export function LeadershipTrustSection({ content }: LeadershipTrustSectionProps) {
  const [directorImgError, setDirectorImgError] = useState(false);
  const [chedLogoError, setChedLogoError] = useState(false);
  const [sealImgError, setSealImgError] = useState(false);

  const directorSrc = content.directorImage?.trim() || "/director.png";
  const chedSrc = content.chedLogoImage?.trim() || "/ched-unifast.png";
  const sealSrc = content.minsuSealImage?.trim() || "/minsu-seal.png";

  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14">
      {/* Section Header */}
      <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B5E20]/10 border border-[#1B5E20]/20 text-[#1B5E20] text-xs font-semibold mb-3">
          {!sealImgError ? (
            <Image
              src={sealSrc}
              alt="MinSU Seal"
              width={16}
              height={16}
              unoptimized
              className="w-4 h-4 object-contain"
              onError={() => setSealImgError(true)}
            />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-[#B88A00]" />
          )}
          <span>Institutional Trust & Governance</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1F2A24] tracking-tight">
          {content.sectionTitle || "Campus Leadership & Compliance"}
        </h3>
        <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
          {content.sectionSubtitle ||
            "Mindoro State University upholds the highest standards of transparency, good governance, and student financial welfare."}
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Campus Director Endorsement Card (7 cols) */}
        <ScrollReveal className="lg:col-span-7 h-full" delay={0.05}>
          <AppleTiltCard maxTilt={5} className="h-full">
            <div className="h-full rounded-2xl bg-white border border-[#D6DDD8]/80 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(27,94,32,0.08)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Watermarked Seal in background */}
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none w-48 h-48 select-none">
                {!sealImgError ? (
                  <Image
                    src={sealSrc}
                    alt="MinSU Seal Watermark"
                    width={192}
                    height={192}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <School className="w-48 h-48 text-[#1B5E20]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#B88A00] uppercase tracking-wider mb-4">
                  <Quote className="w-4 h-4" />
                  <span>Campus Leadership Endorsement</span>
                </div>

                <blockquote className="text-sm sm:text-base text-[#1F2A24] font-medium leading-relaxed italic relative z-10">
                  "{content.directorMessage}"
                </blockquote>
              </div>

              {/* Director Profile Row */}
              <div className="mt-8 pt-6 border-t border-[#D6DDD8]/70 flex items-center gap-4 relative z-10">
                {/* Director Avatar / Photo with Smart Fallback */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 border-2 border-[#1B5E20]/30 bg-white flex items-center justify-center shadow-md">
                  {!directorImgError ? (
                    <Image
                      src={directorSrc}
                      alt={content.directorName}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-full h-full object-cover"
                      onError={() => setDirectorImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1B5E20] to-[#123F17] text-white flex items-center justify-center font-bold text-lg">
                      <School className="w-8 h-8 text-[#F2B705]" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-heading font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                    {content.directorName}
                  </h4>
                  <p className="text-xs text-[#55645B] mt-0.5">{content.directorTitle}</p>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-[#1B5E20]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Executive Review Queue Certified</span>
                  </div>
                </div>
              </div>
            </div>
          </AppleTiltCard>
        </ScrollReveal>

        {/* Right Column: CHED & UniFAST Compliance Card (5 cols) */}
        <ScrollReveal className="lg:col-span-5 h-full" delay={0.12}>
          <AppleTiltCard maxTilt={5} className="h-full">
            <div className="h-full rounded-2xl bg-gradient-to-br from-[#123F17] via-[#164D1C] to-[#1B5E20] text-white p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
              {/* Subtle gold glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#F2B705]/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* CHED / UniFAST Logo or Fallback Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="h-11 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-white/20 flex items-center shadow-xs">
                    {!chedLogoError ? (
                      <Image
                        src={chedSrc}
                        alt="CHED-UniFAST Accredited"
                        width={130}
                        height={36}
                        unoptimized
                        className="h-7 w-auto object-contain"
                        onError={() => setChedLogoError(true)}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#123F17]">
                        <Award className="w-4 h-4 text-[#B88A00]" />
                        <span>CHED • UniFAST</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#F2B705]/20 text-[#F2B705] font-semibold border border-[#F2B705]/30">
                    Official Standard
                  </span>
                </div>

                <h4 className="text-lg font-heading font-bold text-white tracking-tight">
                  {content.chedAccreditationTitle}
                </h4>
                <p className="text-xs text-[#DCEFDD]/90 mt-2 leading-relaxed">
                  {content.chedAccreditationDetails}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 space-y-2 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-[#F2B705] shrink-0" />
                  <span>Annex 1: Consolidated Electronic Billing Statement</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-[#F2B705] shrink-0" />
                  <span>Annex 3: Registrar-Certified Masterlist of Scholars</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-[#F2B705] shrink-0" />
                  <span>Annex 6–9: Fund Utilization & Audit Compliance</span>
                </div>
              </div>
            </div>
          </AppleTiltCard>
        </ScrollReveal>
      </div>

      {/* Institutional Core Values (3 Bento Cards with Staggered Entrance) */}
      {content.coreValues && content.coreValues.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {content.coreValues.map((val, idx) => (
            <StaggerItem key={idx}>
              <div className="p-5 rounded-xl bg-white border border-[#D6DDD8]/80 shadow-xs hover:border-[#1B5E20]/40 hover:shadow-md transition-all apple-press h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#B88A00] bg-[#FFF1C2] px-2 py-0.5 rounded-md border border-[#F2B705]/30">
                    {val.tag}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#1B5E20]" />
                </div>
                <h5 className="font-heading font-bold text-sm text-[#1F2A24] mt-2">
                  {val.title}
                </h5>
                <p className="text-xs text-[#55645B] mt-1.5 leading-relaxed">
                  {val.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </section>
  );
}
