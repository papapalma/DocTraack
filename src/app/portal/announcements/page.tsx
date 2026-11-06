"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AnnouncementCategory, AnnouncementItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRing,
  Pin,
  Search,
  Calendar,
  User,
  Clock,
  Megaphone,
  FileText,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Settings,
  ArrowRight,
  X,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "ALL", label: "All Notices", icon: Megaphone },
  { id: "URGENT", label: "Urgent", icon: AlertTriangle },
  { id: "DEADLINE", label: "Deadlines", icon: Calendar },
  { id: "REQUIREMENTS", label: "Requirements", icon: Sparkles },
  { id: "PAYROLL", label: "Payroll", icon: DollarSign },
  { id: "GENERAL", label: "General", icon: FileText },
];

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Notification Preferences status for the student
  const [preferences, setPreferences] = useState<{
    notifyAnnouncements: boolean;
    notifyPush: boolean;
  }>({
    notifyAnnouncements: true,
    notifyPush: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [annRes, prefRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch("/api/user/preferences"),
        ]);

        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData.announcements || []);
        }

        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setPreferences({
            notifyAnnouncements: prefData.notifyAnnouncements ?? true,
            notifyPush: prefData.notifyPush ?? false,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [announcements, activeCategory, searchQuery]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "URGENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "DEADLINE":
        return "bg-[#FFF1C2] text-[#B88A00] border-[#F2B705]/40";
      case "PAYROLL":
        return "bg-[#DCEFDD] text-[#1B5E20] border-[#2E7D32]/30";
      case "REQUIREMENTS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D6DDD8] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
                Official Announcements
              </h1>
              <p className="text-xs sm:text-sm text-[#55645B] mt-0.5">
                Official notices, deadline schedules, and payout memos from the MinSU TDP Office.
              </p>
            </div>
          </div>
        </div>

        <Link href="/portal/profile?tab=notifications">
          <Button
            variant="outline"
            size="sm"
            className="border-[#D6DDD8] text-[#1F2A24] hover:bg-neutral-50 text-xs gap-1.5 h-9 rounded-xl apple-press"
          >
            <Settings className="w-3.5 h-3.5 text-[#55645B]" />
            <span>Notification Settings</span>
          </Button>
        </Link>
      </div>

      {/* Notification Status Ribbon */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#F1F8F1] via-white to-[#FFFDF5] border border-[#1B5E20]/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[#1F2A24] flex items-center gap-2">
              <span>Announcement Alerts:</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  preferences.notifyAnnouncements
                    ? "bg-[#DCEFDD] text-[#123F17] border-[#1B5E20]/30"
                    : "bg-neutral-100 text-neutral-600 border-neutral-300"
                )}
              >
                {preferences.notifyAnnouncements ? "In-App Active" : "In-App Off"}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border hidden xs:inline-block",
                  preferences.notifyPush
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                )}
              >
                {preferences.notifyPush ? "Browser Push On" : "Browser Push Off"}
              </span>
            </div>
            <p className="text-[11px] text-[#55645B] mt-0.5">
              {preferences.notifyAnnouncements
                ? "You will receive instant alerts in the portal whenever staff issues new notices."
                : "You have muted in-app announcement alerts. You can re-enable alerts in your profile."}
            </p>
          </div>
        </div>

        <Link
          href="/portal/profile?tab=notifications"
          className="text-[#1B5E20] font-bold text-xs hover:underline flex items-center gap-1 shrink-0 ml-9 sm:ml-0"
        >
          <span>Configure Alerts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full apple-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95",
                  isActive
                    ? "text-[#123F17]"
                    : "text-[#55645B] hover:text-[#1F2A24] hover:bg-neutral-100/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="student-announcement-tab"
                    className="absolute inset-0 bg-[#DCEFDD] border border-[#1B5E20]/20 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#55645B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-[#D6DDD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="border border-dashed border-[#D6DDD8] bg-white/70">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1F2A24]">
              No Announcements Found
            </h3>
            <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
              {searchQuery || activeCategory !== "ALL"
                ? "No notices match your selected category or search keyword."
                : "The TDP Office has not posted any announcements at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAnnouncements.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <Card
                  className={cn(
                    "p-5 sm:p-6 transition-all duration-200 border bg-white shadow-xs hover:shadow-md",
                    item.isPinned
                      ? "border-[#F2B705] bg-gradient-to-br from-[#FFFDF5] to-white ring-1 ring-[#F2B705]/40"
                      : "border-[#D6DDD8]"
                  )}
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/50 shadow-2xs">
                          <Pin className="w-3 h-3 fill-[#B88A00]" />
                          Pinned Notice
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
                          getCategoryBadge(item.category)
                        )}
                      >
                        {item.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] leading-snug break-words">
                      {item.title}
                    </h2>

                    {/* Content */}
                    <p className="text-xs sm:text-sm text-[#1F2A24]/90 whitespace-pre-wrap leading-relaxed break-words font-sans">
                      {item.content}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#55645B] pt-3 border-t border-[#D6DDD8]/60">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-[#1B5E20]" />
                        Mindoro State University • TDP Office
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

