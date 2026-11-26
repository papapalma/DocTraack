"use client";

import React from "react";
import Link from "next/link";
import {
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Home,
  LayoutDashboard,
  GraduationCap,
  Ticket,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function OfflineFallbackPage() {
  const isOnline = useOnlineStatus();

  return (
    <main className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-[#F6F8F6] text-[#1F2A24] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl border border-[#D6DDD8] bg-white p-6 sm:p-8 apple-shadow space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#D6DDD8]/70 pb-5">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <div>
              <p className="font-heading text-sm font-bold text-[#1B5E20]">
                MinSU DocTrack
              </p>
              <p className="text-xs text-[#55645B]">
                Tulong Dunong Program (TDP) System
              </p>
            </div>
          </div>

          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1B5E20]/25 bg-[#DCEFDD] px-3 py-1 text-xs font-bold text-[#123F17]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E20]" />
              Back Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F2B705]/40 bg-[#FFF1C2] px-3 py-1 text-xs font-bold text-[#B88A00]">
              <WifiOff className="h-3.5 w-3.5 text-[#B88A00]" />
              Offline Mode
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#1F2A24]">
            {isOnline
              ? "Connection Restored"
              : "No Network Connection Detected"}
          </h1>
          <p className="text-sm leading-relaxed text-[#55645B]">
            {isOnline
              ? "Your device is reconnected to the network. You can now resume working with live TDP Annex workflows, scholarship applications, or walk-in queue operations."
              : "MinSU DocTrack could not reach the university server for this page. Live Annex records and student rosters require an active connection to protect data integrity."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D6DDD8] bg-[#F1F8F1]/70 p-4 text-xs text-[#1F2A24] space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#1B5E20]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>RA 10173 Data Privacy Protection Active</span>
          </div>
          <p className="leading-relaxed text-[#55645B]">
            Sensitive student records, scholarship masterlists, and financial payroll exports are never stored in unencrypted offline caches on shared terminals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
            className="flex-1 apple-press"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {isOnline ? "Reload Current Page" : "Retry Connection"}
          </Button>
          <Link href="/" className="flex-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full apple-press"
            >
              <Home className="h-4 w-4 mr-1.5" />
              Home
            </Button>
          </Link>
        </div>

        <div className="border-t border-[#D6DDD8]/70 pt-4">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#55645B]">
            Quick Destinations When Reconnected
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/dashboard"
              className="apple-press flex items-center gap-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] px-3 py-2 text-xs font-semibold text-[#1F2A24] hover:border-[#1B5E20]/40 hover:bg-[#F1F8F1]"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#1B5E20]" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/portal"
              className="apple-press flex items-center gap-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] px-3 py-2 text-xs font-semibold text-[#1F2A24] hover:border-[#1B5E20]/40 hover:bg-[#F1F8F1]"
            >
              <GraduationCap className="h-3.5 w-3.5 text-[#1B5E20]" />
              <span>Student Portal</span>
            </Link>
            <Link
              href="/kiosk"
              className="apple-press flex items-center gap-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] px-3 py-2 text-xs font-semibold text-[#1F2A24] hover:border-[#1B5E20]/40 hover:bg-[#F1F8F1]"
            >
              <Ticket className="h-3.5 w-3.5 text-[#B88A00]" />
              <span>Walk-In Kiosk</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
