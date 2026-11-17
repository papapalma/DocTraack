"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Accessibility,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock,
  Layers,
  MonitorCheck,
  PauseCircle,
  Sparkles,
  Ticket,
  UserCheck,
} from "lucide-react";
import type { QueueCounterDTO } from "@/types/queue";
import {
  estimatePositionWaitMinutes,
  getServiceVisualTokens,
  type QueuePresentationState,
} from "./kiosk-visuals";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface LobbyEmptyWelcomeCardProps {
  mode: "QUIET_NO_QUEUE" | "ALL_CLOSED";
  presentation: QueuePresentationState;
  servedToday: number;
  compact?: boolean;
  reducedMotion: boolean;
}

export function LobbyEmptyWelcomeCard({
  mode,
  presentation,
  servedToday,
  compact = false,
  reducedMotion,
}: LobbyEmptyWelcomeCardProps) {
  const isClosed = mode === "ALL_CLOSED";

  if (isClosed) {
    return (
      <motion.div
        key="lobby-empty-closed"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.985 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        className="apple-shadow flex flex-col items-center justify-center rounded-3xl border border-line bg-white px-6 py-10 text-center sm:px-10 sm:py-14"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-page text-ink-muted">
          <PauseCircle className="h-7 w-7" />
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-page px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Standby • Counters Closed
        </span>
        <h2 className="mt-3 font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Service Windows Are Currently Closed
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          No active counters are accepting walk-in calls right now. Please check office operating hours or approach a staff coordinator for assistance.
        </p>
        {servedToday > 0 && (
          <p className="mt-5 rounded-full bg-minsu-green-50 px-4 py-1.5 text-xs font-semibold text-minsu-green-800 tabular-nums">
            {servedToday} walk-in clients served earlier today
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="lobby-empty-quiet"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.985, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className="apple-shadow overflow-hidden rounded-3xl border border-minsu-green-600/25 bg-white"
    >
      {/* Top Showcase Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 px-5 py-6 text-white sm:px-8 sm:py-7">
        {!reducedMotion && (
          <div
            aria-hidden="true"
            className="kiosk-hero-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        )}

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-minsu-gold-400 backdrop-blur-sm">
            <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-gold-400" />
            No Queue Right Now • Immediate Service
          </span>

          <span className="rounded-full bg-minsu-gold-500 px-3 py-1 text-xs font-bold text-minsu-green-900 tabular-nums">
            {presentation.readyCounters.length}{" "}
            {presentation.readyCounters.length === 1 ? "Window" : "Windows"} Ready
          </span>
        </div>

        <h2
          className={`relative mt-3 font-heading font-extrabold tracking-tight text-white ${
            compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"
          }`}
        >
          Walk Right Up — Counters Are Open
        </h2>
        <p className="relative mt-1.5 max-w-xl text-xs leading-relaxed text-minsu-green-100 sm:text-sm">
          There is currently no waiting line. Grab a quick service ticket or proceed directly to any ready window below.
        </p>
      </div>

      {/* Body: Live Open Windows + 1-2-3 Guide */}
      <div className={compact ? "space-y-4 p-5" : "space-y-6 p-6 sm:p-8"}>
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Ready Service Desks
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,195px),1fr))] gap-2.5 sm:gap-3">
            {presentation.openCounters.map((ctr, idx) => (
              <motion.div
                key={ctr.id}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.34,
                  ease: EASE_OUT,
                  delay: reducedMotion ? 0 : Math.min(idx, 5) * 0.045,
                }}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                  ctr.isPaused
                    ? "border-line bg-page/75"
                    : "border-minsu-green-600/25 bg-minsu-green-50/75"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        ctr.isPaused
                          ? "bg-minsu-gold-500"
                          : "kiosk-ready-dot bg-minsu-green-500"
                      }`}
                    />
                    <span className="truncate font-heading text-sm font-bold text-ink">
                      {ctr.name}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-medium text-ink-muted">
                    {ctr.serviceCodes.length > 0
                      ? `Lanes: ${ctr.serviceCodes.join(", ")}`
                      : "All service lanes"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    ctr.isPaused
                      ? "bg-minsu-gold-100 text-minsu-gold-600"
                      : "bg-minsu-green-100 text-minsu-green-800"
                  }`}
                >
                  {ctr.isPaused ? "Paused" : "Ready"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guided 1-2-3 Walk-In Strip */}
        <div className="grid grid-cols-1 gap-2.5 border-t border-line/80 pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-page px-3.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-minsu-green-100 text-minsu-green-700">
              <Layers className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-xs font-bold text-ink">
                1. Tap Service
              </p>
              <p className="truncate text-[11px] text-ink-muted">
                Pick your TDP desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-page px-3.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-minsu-gold-100 text-minsu-gold-600">
              <Ticket className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-xs font-bold text-ink">
                2. Get Ticket
              </p>
              <p className="truncate text-[11px] text-ink-muted">
                Instant slip or QR code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-page px-3.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-minsu-green-100 text-minsu-green-700">
              <UserCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-xs font-bold text-ink">
                3. Walk Right Up
              </p>
              <p className="truncate text-[11px] text-ink-muted">
                Direct window service
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5 font-medium text-minsu-green-800">
            <Sparkles className="h-3.5 w-3.5 text-minsu-gold-600" />
            Average wait time: Under 1 minute
          </span>
          <span className="tabular-nums font-semibold">
            {servedToday} served today
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface LobbyCallingSpotlightProps {
  callingCounters: QueueCounterDTO[];
  showPrivacyMaskedNames: boolean;
  recentCallKey: string | null;
  compact?: boolean;
  reducedMotion: boolean;
}

export function LobbyCallingSpotlight({
  callingCounters,
  showPrivacyMaskedNames,
  recentCallKey,
  compact = false,
  reducedMotion,
}: LobbyCallingSpotlightProps) {
  if (callingCounters.length === 0) return null;

  return (
    <div
      className={`grid gap-3 ${
        callingCounters.length === 1
          ? "grid-cols-1"
          : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      {callingCounters.map((counter) => {
        const ticket = counter.currentTicket;
        if (!ticket) return null;

        return (
          <motion.div
            key={`${counter.id}-${ticket.ticketNumber}-${recentCallKey ?? "call"}`}
            initial={
              reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : { type: "spring", duration: 0.42, bounce: 0.16 }
            }
            className="relative overflow-hidden rounded-3xl border-2 border-minsu-gold-500 bg-gradient-to-br from-minsu-gold-100/90 via-white to-minsu-green-50 p-4 shadow-md sm:p-5"
          >
            {!reducedMotion && (
              <div
                aria-hidden="true"
                className="kiosk-call-beacon absolute inset-0 rounded-3xl border-2 border-minsu-gold-500/75"
              />
            )}

            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-gold-500 px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-wider text-minsu-green-900">
                <BellRing className="h-3.5 w-3.5" />
                Calling Now — Please Proceed
              </span>

              <div className="flex items-center gap-1.5">
                {ticket.priority === "PRIORITY" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-minsu-green-900 px-2.5 py-0.5 text-[11px] font-bold text-minsu-gold-400">
                    <Accessibility className="h-3 w-3" />
                    Priority
                  </span>
                )}
                {ticket.recallCount > 1 && (
                  <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted tabular-nums">
                    Recall #{ticket.recallCount}
                  </span>
                )}
              </div>
            </div>

            <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`font-heading font-extrabold leading-none tracking-tight text-minsu-green-900 tabular-nums ${
                    compact
                      ? "text-3xl sm:text-4xl"
                      : "text-[clamp(2.5rem,5vw,4.5rem)]"
                  }`}
                >
                  {ticket.ticketNumber}
                </span>
                <ArrowRight className="h-6 w-6 shrink-0 text-minsu-gold-600" />
                <span
                  className={`rounded-2xl bg-minsu-green-900 px-3.5 py-2 font-heading font-extrabold text-white shadow-sm ${
                    compact ? "text-sm sm:text-base" : "text-base sm:text-xl"
                  }`}
                >
                  {counter.name}
                </span>
              </div>

              <div className="min-w-0 text-left sm:text-right">
                <p className="truncate font-heading text-xs font-bold text-ink sm:text-sm">
                  {ticket.serviceName}
                </p>
                {showPrivacyMaskedNames && ticket.maskedVisitorName && (
                  <p className="truncate text-xs font-medium text-minsu-green-800">
                    {ticket.maskedVisitorName}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface LobbyCounterCardProps {
  counter: QueueCounterDTO;
  index: number;
  showPrivacyMaskedNames: boolean;
  serviceColorByCode: Map<string, string>;
  compact?: boolean;
  reducedMotion: boolean;
}

export function LobbyCounterCard({
  counter,
  index,
  showPrivacyMaskedNames,
  serviceColorByCode,
  compact = false,
  reducedMotion,
}: LobbyCounterCardProps) {
  const ticket = counter.currentTicket;
  const isCalled = ticket?.status === "CALLED";
  const isReady = counter.isOpen && !counter.isPaused && !ticket;
  const visual = getServiceVisualTokens(
    serviceColorByCode.get(ticket?.serviceCode || "") || "green"
  );

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        ease: EASE_OUT,
        delay: reducedMotion ? 0 : Math.min(index, 5) * 0.045,
      }}
      className={`apple-shadow flex min-w-0 flex-col justify-between rounded-3xl border-2 transition-colors ${
        compact ? "p-4" : "min-h-[clamp(165px,21vh,235px)] p-5 sm:p-6"
      } ${
        isCalled
          ? "border-minsu-gold-500 bg-minsu-gold-100/55"
          : ticket
          ? "border-minsu-green-700/35 bg-white"
          : isReady
          ? "border-minsu-green-600/20 bg-minsu-green-50/70"
          : "border-line bg-page/75"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-xl px-3 py-1 font-heading font-bold ${
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
          } ${
            ticket || isReady
              ? "bg-minsu-green-900 text-white"
              : "bg-line/70 text-ink"
          }`}
        >
          {counter.name}
        </span>

        {ticket ? (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
              isCalled
                ? "bg-minsu-gold-500 text-minsu-green-900"
                : "bg-minsu-green-100 text-minsu-green-800"
            }`}
          >
            {isCalled ? "Calling Now" : "Serving"}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isReady
                ? "bg-minsu-green-100 text-minsu-green-800"
                : "bg-page text-ink-muted"
            }`}
          >
            {isReady && (
              <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-green-500" />
            )}
            {counter.isPaused
              ? "Paused"
              : counter.isOpen
              ? "Ready"
              : "Closed"}
          </span>
        )}
      </div>

      {ticket ? (
        <div className={compact ? "my-3" : "my-4 text-center"}>
          <p
            className={`font-heading leading-none font-extrabold tracking-tight text-minsu-green-900 tabular-nums ${
              compact
                ? "text-3xl sm:text-4xl"
                : "text-[clamp(2.5rem,5vw,4.5rem)]"
            }`}
          >
            {ticket.ticketNumber}
          </p>
          {showPrivacyMaskedNames && ticket.maskedVisitorName && (
            <p className="mt-1.5 truncate font-heading text-sm font-semibold text-ink">
              {ticket.maskedVisitorName}
            </p>
          )}
        </div>
      ) : (
        <div
          className={`flex items-center gap-2.5 ${
            compact ? "my-3" : "my-4 flex-col justify-center text-center"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-2xl ${
              compact ? "h-9 w-9" : "h-12 w-12"
            } ${
              isReady
                ? "bg-white text-minsu-green-700 shadow-sm"
                : "bg-white/70 text-ink-muted"
            }`}
          >
            {isReady ? (
              <MonitorCheck className={compact ? "h-4 w-4" : "h-6 w-6"} />
            ) : (
              <PauseCircle className={compact ? "h-4 w-4" : "h-6 w-6"} />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold text-ink">
              {isReady
                ? "Ready for Next Client"
                : counter.isPaused
                ? "Window Temporarily Paused"
                : "Window Closed"}
            </p>
            {!compact && (
              <p className="mt-0.5 text-xs text-ink-muted">
                {isReady
                  ? "Next eligible ticket calls automatically"
                  : "Another open desk handles active lanes"}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5 text-xs">
        <span className="truncate font-semibold text-ink-muted">
          {ticket
            ? ticket.serviceName
            : `Accepts: ${counter.serviceCodes.join(", ") || "All"}`}
        </span>
        {ticket?.priority === "PRIORITY" && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${visual.badgeBg} ${visual.badgeText}`}
          >
            <Accessibility className="h-3.5 w-3.5" />
            Priority
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface LobbyWaitingColumnProps {
  presentation: QueuePresentationState;
  waitingTotal: number;
  servedToday: number;
  compact?: boolean;
  reducedMotion: boolean;
}

export function LobbyWaitingColumn({
  presentation,
  waitingTotal,
  servedToday,
  compact = false,
  reducedMotion,
}: LobbyWaitingColumnProps) {
  const maxRemaining = compact ? 7 : 8;
  const visibleRemaining = presentation.remainingWaiting.slice(0, maxRemaining);
  const overflowCount = Math.max(
    0,
    presentation.remainingWaiting.length - visibleRemaining.length
  );

  if (waitingTotal === 0) {
    return (
      <div className="rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50/80 p-4 text-center sm:p-5">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-minsu-green-700 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="mt-2.5 font-heading text-sm font-bold text-ink">
          Queue Clear — Immediate Next
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          No clients are waiting. Check-in tickets issued now will be called next.
        </p>
        <p className="mt-3 text-[11px] font-semibold text-minsu-green-800 tabular-nums">
          {servedToday} served today
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Per-lane queue breakdown chips */}
      {presentation.laneSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {presentation.laneSummary.map((lane) => {
            const tokens = getServiceVisualTokens(lane.colorToken);
            return (
              <span
                key={lane.code}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${tokens.badgeBg} ${tokens.badgeText}`}
              >
                <span className="font-mono">{lane.code}</span>
                <span>•</span>
                <span>{lane.count} waiting</span>
              </span>
            );
          })}
        </div>
      )}

      {/* #1 Up Next Spotlight */}
      {presentation.upNextTicket && (
        <motion.div
          key={`upnext-${presentation.upNextTicket.id}`}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="rounded-2xl border-2 border-minsu-green-700/30 bg-gradient-to-r from-minsu-green-50 via-white to-minsu-gold-100/45 p-3.5 sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-minsu-green-700 px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-white">
              #1 Up Next • Prepare
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted tabular-nums">
              <Clock className="h-3.5 w-3.5 text-minsu-gold-600" />~
              {estimatePositionWaitMinutes(
                presentation.upNextTicket.serviceCode,
                0,
                presentation.estimatedMinsByCode,
                presentation.activeUnpausedCount
              )}
              m est.
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-heading text-2xl font-extrabold tracking-tight text-minsu-green-900 tabular-nums sm:text-3xl">
                {presentation.upNextTicket.ticketNumber}
              </span>
              <p className="truncate text-xs font-medium text-ink-muted">
                {presentation.upNextTicket.serviceName}
              </p>
            </div>

            {presentation.upNextTicket.priority === "PRIORITY" ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-minsu-gold-100 px-2.5 py-1 text-xs font-bold text-minsu-gold-600">
                <Accessibility className="h-3.5 w-3.5" />
                Priority
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted border border-line">
                Lane {presentation.upNextTicket.serviceCode}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Remaining Waiting Rows */}
      {visibleRemaining.length > 0 && (
        <ul className="divide-y divide-line/60">
          <AnimatePresence initial={false}>
            {visibleRemaining.map((wt, idx) => {
              const rank = idx + 2;
              const estWait = estimatePositionWaitMinutes(
                wt.serviceCode,
                idx + 1,
                presentation.estimatedMinsByCode,
                presentation.activeUnpausedCount
              );

              return (
                <motion.li
                  key={wt.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="flex items-center justify-between gap-2 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-6 shrink-0 text-xs font-bold text-ink-muted tabular-nums">
                      #{rank}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-base font-extrabold text-ink tabular-nums sm:text-lg">
                          {wt.ticketNumber}
                        </span>
                        <span className="text-[11px] font-medium text-ink-muted tabular-nums">
                          ~{estWait}m
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {wt.serviceName}
                      </p>
                    </div>
                  </div>

                  {wt.priority === "PRIORITY" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-minsu-gold-100 px-2.5 py-1 text-[11px] font-bold text-minsu-gold-600">
                      <Accessibility className="h-3 w-3" />
                      Priority
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                      Lane {wt.serviceCode}
                    </span>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {overflowCount > 0 && (
        <p className="rounded-xl bg-page py-2 text-center text-xs font-semibold text-ink-muted tabular-nums">
          +{overflowCount} additional{" "}
          {overflowCount === 1 ? "client" : "clients"} in queue
        </p>
      )}
    </div>
  );
}

