"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Hand, Ticket } from "lucide-react";
import type { PublicKioskStatePayload } from "@/types/queue";
import { Logo } from "@/components/ui/logo";

interface KioskAttractOverlayProps {
  state: PublicKioskStatePayload;
  onDismiss: () => void;
}

export function KioskAttractOverlay({
  state,
  onDismiss,
}: KioskAttractOverlayProps) {
  const prefersReduced = useReducedMotion();
  const activeServing = state.counters.filter((c) => c.isOpen && c.currentTicket);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Tap anywhere to start walk-in queue check-in"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDismiss();
        }
      }}
      initial={prefersReduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center bg-minsu-green-900/92 px-6 py-10 text-center text-white backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <Logo size="xl" className="h-20 w-20 border-minsu-gold-500/80 shadow-xl" />

        <p className="mt-5 font-heading text-xs font-bold uppercase tracking-[0.22em] text-minsu-gold-400">
          Mindoro State University • {state.campus}
        </p>

        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Tulong Dunong Program
          <span className="mt-1 block text-minsu-gold-400">
            Walk-In Service Kiosk
          </span>
        </h1>

        <p className="mt-4 max-w-lg text-base text-minsu-green-100">
          Get a walk-in queue number, check scholarship application status, or scan your mobile tracker QR slip.
        </p>

        {activeServing.length > 0 ? (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {activeServing.slice(0, 3).map((counter) => (
              <div
                key={counter.id}
                className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5"
              >
                <span className="text-xs font-medium text-minsu-green-100">
                  {counter.name}
                </span>
                <span className="font-heading text-lg font-extrabold text-minsu-gold-400 tabular-nums">
                  {counter.currentTicket?.ticketNumber}
                </span>
              </div>
            ))}
          </div>
        ) : state.stats.openCounters > 0 && state.stats.waitingTotal === 0 ? (
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-minsu-gold-400/35 bg-white/10 px-4 py-2 text-xs font-semibold text-minsu-green-50 backdrop-blur-sm">
            <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-gold-400" />
            No Queue Right Now — {state.stats.openCounters}{" "}
            {state.stats.openCounters === 1 ? "Window" : "Windows"} Ready for Immediate Walk-Up
          </div>
        ) : null}

        <div className="kiosk-touch-tile relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-minsu-gold-500 px-8 py-4 font-heading text-lg font-bold text-minsu-green-900 shadow-lg">
          {!prefersReduced && (
            <span
              aria-hidden="true"
              className="kiosk-hero-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            />
          )}
          <Hand className="relative h-6 w-6" />
          <span className="relative">Tap Anywhere to Get Queue Ticket</span>
          <Ticket className="relative h-5 w-5" />
        </div>

        <p className="mt-5 text-xs text-minsu-green-100/80 tabular-nums">
          {state.stats.waitingTotal === 0
            ? `${state.stats.openCounters} open ${
                state.stats.openCounters === 1 ? "counter" : "counters"
              } • Immediate walk-in service`
            : `${state.stats.waitingTotal} clients currently in queue • ${state.stats.openCounters} counters open`}
        </p>
      </div>
    </motion.div>
  );
}

