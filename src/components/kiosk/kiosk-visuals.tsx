"use client";

import React from "react";
import {
  FileText,
  Wallet,
  ShieldCheck,
  HelpCircle,
  ClipboardCheck,
  GraduationCap,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type {
  PublicKioskStatePayload,
  PublicQueueTicketDTO,
  QueueCounterDTO,
} from "@/types/queue";
import { getNextUpTicketForCounters } from "@/lib/queue-fairness";

export const SERVICE_COLOR_MAP: Record<
  string,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
    badgeBg: string;
    badgeText: string;
    codeBg: string;
  }
> = {
  green: {
    bg: "bg-white hover:border-minsu-green-700",
    border: "border-minsu-green-600/25",
    iconBg: "bg-minsu-green-100",
    iconText: "text-minsu-green-700",
    badgeBg: "bg-minsu-green-50",
    badgeText: "text-minsu-green-800",
    codeBg: "bg-minsu-green-700 text-white",
  },
  gold: {
    bg: "bg-white hover:border-minsu-gold-600",
    border: "border-minsu-gold-500/35",
    iconBg: "bg-minsu-gold-100",
    iconText: "text-minsu-gold-600",
    badgeBg: "bg-minsu-gold-100/70",
    badgeText: "text-minsu-gold-600",
    codeBg: "bg-minsu-gold-500 text-minsu-green-900",
  },
  emerald: {
    bg: "bg-white hover:border-minsu-green-500",
    border: "border-minsu-green-500/30",
    iconBg: "bg-minsu-green-50",
    iconText: "text-minsu-green-600",
    badgeBg: "bg-minsu-green-100",
    badgeText: "text-minsu-green-900",
    codeBg: "bg-minsu-green-900 text-white",
  },
  slate: {
    bg: "bg-white hover:border-ink-muted",
    border: "border-line",
    iconBg: "bg-page",
    iconText: "text-ink",
    badgeBg: "bg-page",
    badgeText: "text-ink-muted",
    codeBg: "bg-ink text-white",
  },
};

export function getServiceVisualTokens(colorToken: string) {
  return SERVICE_COLOR_MAP[colorToken] || SERVICE_COLOR_MAP.green;
}

export function ServiceCategoryIcon({
  icon,
  className = "w-7 h-7",
}: {
  icon: string;
  className?: string;
}) {
  switch (icon) {
    case "wallet":
      return <Wallet className={className} />;
    case "shield-check":
      return <ShieldCheck className={className} />;
    case "help-circle":
      return <HelpCircle className={className} />;
    case "clipboard-check":
      return <ClipboardCheck className={className} />;
    case "graduation-cap":
      return <GraduationCap className={className} />;
    case "file-text":
    default:
      return <FileText className={className} />;
  }
}

export function formatClockManila(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatShortTimeManila(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

export type QueuePresentationMode =
  | "ALL_CLOSED"
  | "QUIET_NO_QUEUE"
  | "MIXED_NO_QUEUE"
  | "ACTIVE_QUEUE";

export interface QueueLaneSummaryItem {
  code: string;
  name: string;
  count: number;
  colorToken: string;
}

export interface QueuePresentationState {
  mode: QueuePresentationMode;
  displayCounters: QueueCounterDTO[];
  openCounters: QueueCounterDTO[];
  callingCounters: QueueCounterDTO[];
  readyCounters: QueueCounterDTO[];
  pausedCounters: QueueCounterDTO[];
  upNextTicket: PublicQueueTicketDTO | null;
  remainingWaiting: PublicQueueTicketDTO[];
  laneSummary: QueueLaneSummaryItem[];
  serviceColorByCode: Map<string, string>;
  estimatedMinsByCode: Map<string, number>;
  activeUnpausedCount: number;
}

export function deriveQueuePresentationState(
  state: PublicKioskStatePayload
): QueuePresentationState {
  const openCounters = state.counters.filter((c) => c.isOpen);
  const displayCounters =
    openCounters.length > 0 ? openCounters : state.counters;
  const activeWithTickets = displayCounters.filter(
    (c) => c.currentTicket !== null
  );
  const callingCounters = displayCounters.filter(
    (c) => c.currentTicket?.status === "CALLED"
  );
  const readyCounters = openCounters.filter(
    (c) => !c.isPaused && !c.currentTicket
  );
  const pausedCounters = openCounters.filter(
    (c) => c.isPaused && !c.currentTicket
  );
  const activeUnpausedCount = Math.max(
    1,
    openCounters.filter((c) => !c.isPaused).length
  );

  let mode: QueuePresentationMode = "ACTIVE_QUEUE";
  if (
    openCounters.length === 0 &&
    activeWithTickets.length === 0 &&
    state.waitingTickets.length === 0
  ) {
    mode = "ALL_CLOSED";
  } else if (
    state.waitingTickets.length === 0 &&
    activeWithTickets.length === 0
  ) {
    mode = "QUIET_NO_QUEUE";
  } else if (state.waitingTickets.length === 0) {
    mode = "MIXED_NO_QUEUE";
  }

  const upNextTicket = getNextUpTicketForCounters(
    state.waitingTickets,
    openCounters,
    state.config.priorityRatio
  );
  const remainingWaiting = upNextTicket
    ? state.waitingTickets.filter((t) => t.id !== upNextTicket.id)
    : state.waitingTickets;

  const serviceByCode = new Map(state.services.map((s) => [s.code, s]));
  const serviceColorByCode = new Map(
    state.services.map((s) => [s.code, s.colorToken])
  );
  const estimatedMinsByCode = new Map(
    state.services.map((s) => [s.code, s.estimatedMinutes])
  );

  const countMap = new Map<string, number>();
  for (const wt of state.waitingTickets) {
    countMap.set(wt.serviceCode, (countMap.get(wt.serviceCode) ?? 0) + 1);
  }

  const laneSummary: QueueLaneSummaryItem[] = Array.from(countMap.entries())
    .map(([code, count]) => {
      const svc = serviceByCode.get(code);
      return {
        code,
        name: svc?.name ?? `Lane ${code}`,
        count,
        colorToken: svc?.colorToken ?? "green",
      };
    })
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return {
    mode,
    displayCounters,
    openCounters,
    callingCounters,
    readyCounters,
    pausedCounters,
    upNextTicket,
    remainingWaiting,
    laneSummary,
    serviceColorByCode,
    estimatedMinsByCode,
    activeUnpausedCount,
  };
}

export function estimatePositionWaitMinutes(
  serviceCode: string,
  positionIndex: number,
  estimatedMinsByCode: Map<string, number>,
  activeUnpausedCount: number
): number {
  const base = estimatedMinsByCode.get(serviceCode) ?? 5;
  return Math.max(
    1,
    Math.round(((positionIndex + 1) * base) / Math.max(1, activeUnpausedCount))
  );
}

/**
 * Shared MinSU DocTrack dark-green frosted glass header bar for kiosk, lobby TV,
 * and mobile ticket tracker routes, matching ModularLanding and dashboard Topbar.
 */
export function KioskConnectionBadge({
  isOnline,
  isConnected,
  offlineLabel = "Reconnecting",
}: {
  isOnline: boolean;
  isConnected: boolean;
  offlineLabel?: string;
}) {
  const live = isOnline && isConnected;
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={live ? "Connection live" : offlineLabel}
      title={live ? "Connection live" : offlineLabel}
      className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none sm:min-h-[38px] sm:px-3 ${
        live
          ? "border border-white/25 bg-white/10 text-white"
          : "bg-[#F2B705] font-bold text-[#123F17] shadow-xs"
      }`}
    >
      {live ? (
        <>
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
          <Wifi className="h-3.5 w-3.5 shrink-0 text-[#DCEFDD]" />
          <span className="hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{offlineLabel}</span>
        </>
      )}
    </span>
  );
}

export function KioskSystemHeader({
  badge,
  subtitleMobile,
  subtitleDesktop,
  headingLevel = "h1",
  maxWidthClass = "max-w-[1600px]",
  horizontalPaddingClass = "px-4 sm:px-6 lg:px-8 2xl:px-10",
  actions,
}: {
  badge: string;
  subtitleMobile: string;
  subtitleDesktop: string;
  headingLevel?: "h1" | "span";
  maxWidthClass?: string;
  horizontalPaddingClass?: string;
  actions?: React.ReactNode;
}) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 8;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "true" : "false"}
      className={`glass-header sticky top-0 z-40 w-full text-white pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-4 lg:pt-[max(1.125rem,env(safe-area-inset-top))] lg:pb-[18px] 2xl:pt-[max(1.25rem,env(safe-area-inset-top))] 2xl:pb-5 print:hidden ${horizontalPaddingClass}`}
    >
      <div
        className={`mx-auto flex w-full ${maxWidthClass} flex-wrap items-center justify-between gap-x-3 gap-y-2.5 md:flex-nowrap md:gap-4 lg:gap-6`}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <Logo size="sm" className="shrink-0 sm:hidden" />
          <Logo size="md" className="hidden shrink-0 sm:flex lg:hidden" />
          <Logo size="lg" className="hidden shrink-0 lg:flex" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {headingLevel === "h1" ? (
                <h1 className="truncate font-heading text-[15px] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-xl lg:text-2xl 2xl:text-[26px]">
                  MinSU DocTrack
                </h1>
              ) : (
                <span className="truncate font-heading text-[15px] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-xl lg:text-2xl 2xl:text-[26px]">
                  MinSU DocTrack
                </span>
              )}
              <span className="inline-flex shrink-0 items-center rounded-full bg-[#F2B705] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#123F17] shadow-xs sm:px-2.5 sm:text-[11px]">
                {badge}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium leading-snug text-[#DCEFDD]/90 sm:text-xs lg:text-[13px]">
              <span className="sm:hidden">{subtitleMobile}</span>
              <span className="hidden sm:inline">{subtitleDesktop}</span>
            </p>
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-2.5 md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

