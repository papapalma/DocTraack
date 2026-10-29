"use client";

import React from "react";
import { MapPin, Clock, Mail, Phone } from "lucide-react";
import { ContactSectionConfig } from "@/types/landing";

interface ContactSectionProps {
  content: ContactSectionConfig;
}

export function ContactSection({ content }: ContactSectionProps) {
  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">
      <div className="p-7 sm:p-10 rounded-3xl bg-gradient-to-br from-[#123F17] via-[#1B5E20] to-[#164D1C] text-white shadow-xl border border-[#F2B705]/30">
        <div className="max-w-2xl mb-8">
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            {content.sectionTitle || "TDP Assistance & Campus Directory"}
          </h3>
          {content.sectionSubtitle && (
            <p className="text-xs sm:text-sm text-[#DCEFDD] mt-2 leading-relaxed">
              {content.sectionSubtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
          {content.officeLocation && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="p-2 rounded-xl bg-[#F2B705] text-[#123F17] shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F9C733] uppercase tracking-wider">
                  Campus Office
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                  {content.officeLocation}
                </p>
              </div>
            </div>
          )}

          {content.officeHours && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="p-2 rounded-xl bg-[#F2B705] text-[#123F17] shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F9C733] uppercase tracking-wider">
                  Office Hours
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                  {content.officeHours}
                </p>
              </div>
            </div>
          )}

          {content.email && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="p-2 rounded-xl bg-[#F2B705] text-[#123F17] shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F9C733] uppercase tracking-wider">
                  Official Email
                </p>
                <a
                  href={`mailto:${content.email}`}
                  className="text-xs sm:text-sm text-white/90 hover:underline mt-1 block"
                >
                  {content.email}
                </a>
              </div>
            </div>
          )}

          {content.hotline && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="p-2 rounded-xl bg-[#F2B705] text-[#123F17] shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F9C733] uppercase tracking-wider">
                  Telephone & Hotline
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                  {content.hotline}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
