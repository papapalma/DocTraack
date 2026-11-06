"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ArrowRight, X, Clock, Pin, User } from "lucide-react";
import { AnnouncementSectionConfig } from "@/types/landing";
import { AnnouncementItem } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

interface AnnouncementSectionProps {
  content: AnnouncementSectionConfig;
  onAuthAction?: (mode: "login" | "register") => void;
}

export function AnnouncementSection({ content, onAuthAction }: AnnouncementSectionProps) {
  const [latestAnnouncement, setLatestAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadPublicAnnouncement() {
      try {
        const res = await fetch("/api/announcements?limit=1");
        if (res.ok) {
          const data = await res.json();
          if (data.announcements && data.announcements.length > 0) {
            setLatestAnnouncement(data.announcements[0]);
          }
        }
      } catch (e) {
        // Silently fall back to static configuration
      }
    }
    loadPublicAnnouncement();
  }, []);

  // Determine what to show: live announcement or static landing message
  const displayMessage = latestAnnouncement?.title || content.message;
  const displayBadge = latestAnnouncement
    ? latestAnnouncement.isPinned
      ? "PINNED"
      : latestAnnouncement.category
    : content.badge;

  if (!displayMessage) return null;

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
    if (latestAnnouncement) {
      e.preventDefault();
      setIsModalOpen(true);
      return;
    }

    if (content.linkUrl === "/?auth=register" || content.linkUrl?.includes("auth=register")) {
      e.preventDefault();
      onAuthAction?.("register");
    } else if (content.linkUrl === "/?auth=login" || content.linkUrl?.includes("auth=login")) {
      e.preventDefault();
      onAuthAction?.("login");
    }
  };

  return (
    <>
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
              {displayBadge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-2xs ${
                    badgeStyles[content.variant || "warning"]
                  }`}
                >
                  {displayBadge}
                </span>
              )}
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {displayMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLinkClick}
            className="inline-flex items-center text-xs font-bold underline-offset-4 hover:underline shrink-0 group ml-auto sm:ml-0 cursor-pointer"
          >
            <span>{latestAnnouncement ? "Read Official Notice" : content.linkText || "View Details"}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Public Announcement Read Dialog */}
      <AnimatePresence>
        {isModalOpen && latestAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="bg-white rounded-2xl border border-[#D6DDD8] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-[#1B5E20] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#F2B705]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#DCEFDD]">
                    Official TDP Notice
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto apple-scrollbar">
                <div className="flex items-center gap-2">
                  {latestAnnouncement.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                      <Pin className="w-3 h-3 fill-[#B88A00]" />
                      PINNED
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFDD] text-[#123F17]">
                    {latestAnnouncement.category}
                  </span>
                </div>

                <h2 className="text-lg font-heading font-bold text-[#1F2A24] leading-snug">
                  {latestAnnouncement.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#1F2A24]/90 whitespace-pre-wrap leading-relaxed">
                  {latestAnnouncement.content}
                </p>

                <div className="pt-3 border-t border-[#D6DDD8]/60 flex items-center justify-between text-[11px] text-[#55645B]">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1B5E20]" />
                    MinSU TDP Office
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(latestAnnouncement.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#F6F8F6] border-t border-[#D6DDD8] flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-[#55645B]"
                >
                  Close
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    onAuthAction?.("login");
                  }}
                  className="bg-[#1B5E20] hover:bg-[#164D1C] text-white text-xs font-semibold px-4 rounded-xl apple-press"
                >
                  Sign In to Portal
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
