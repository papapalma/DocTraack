"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { Home, MapPin, Monitor, Settings } from "lucide-react";
import type {
  KioskDisplayMode,
  PublicKioskStatePayload,
  QueueRealtimeEvent,
} from "@/types/queue";
import { MINSU_CAMPUSES } from "@/lib/campus-constants";
import { useQueueStream } from "@/hooks/use-queue-stream";
import { KioskCheckInFlow } from "./kiosk-checkin-flow";
import { LobbyDisplayBoard } from "./lobby-display-board";
import { KioskAttractOverlay } from "./kiosk-attract-overlay";
import { KioskConnectionBadge, KioskSystemHeader } from "./kiosk-visuals";
import {
  KioskPinModal,
  type UnifiedLayoutPreference,
} from "./kiosk-pin-modal";

const KIOSK_LAYOUT_STORAGE_KEY = "minsu-kiosk-layout";
const KIOSK_PREFS_EVENT = "minsu-kiosk-prefs-change";

function subscribeLayoutPref(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(KIOSK_PREFS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(KIOSK_PREFS_EVENT, callback);
  };
}

function getLayoutSnapshot(): UnifiedLayoutPreference {
  if (typeof window === "undefined") return "AUTO";
  const raw = window.localStorage.getItem(KIOSK_LAYOUT_STORAGE_KEY);
  if (raw === "STACKED" || raw === "SIDE_BY_SIDE") return raw;
  return "AUTO";
}

function getLayoutServerSnapshot(): UnifiedLayoutPreference {
  return "AUTO";
}

function saveLayoutPref(layout: UnifiedLayoutPreference | null) {
  if (typeof window === "undefined") return;
  if (!layout || layout === "AUTO") {
    window.localStorage.removeItem(KIOSK_LAYOUT_STORAGE_KEY);
  } else {
    window.localStorage.setItem(KIOSK_LAYOUT_STORAGE_KEY, layout);
  }
  window.dispatchEvent(new Event(KIOSK_PREFS_EVENT));
}

interface KioskShellProps {
  initialState: PublicKioskStatePayload;
  initialModeOverride?: KioskDisplayMode | null;
}

export function KioskShell({
  initialState,
  initialModeOverride = null,
}: KioskShellProps) {
  const [state, setState] = useState<PublicKioskStatePayload>(initialState);
  const [activeCampus, setActiveCampus] = useState<string>(initialState.campus);
  const [modeOverride, setModeOverride] = useState<KioskDisplayMode | null>(
    initialModeOverride
  );
  const [lastEvent, setLastEvent] = useState<QueueRealtimeEvent | null>(null);
  const [isAttractActive, setIsAttractActive] = useState(false);
  const [attractNonce, setAttractNonce] = useState(0);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const layoutPref = useSyncExternalStore(
    subscribeLayoutPref,
    getLayoutSnapshot,
    getLayoutServerSnapshot
  );

  const effectiveMode: KioskDisplayMode =
    modeOverride || state.config.kioskMode;

  const refreshState = useCallback(
    async (campusToLoad?: string) => {
      const targetCampus = campusToLoad || activeCampus;
      try {
        const res = await fetch(
          `/api/kiosk/state?campus=${encodeURIComponent(targetCampus)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as PublicKioskStatePayload;
        setState(data);
      } catch {
        // Offline / transient network error — keep showing latest cached state
      }
    },
    [activeCampus]
  );

  // Fetch updated campus state asynchronously when activeCampus changes
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/kiosk/state?campus=${encodeURIComponent(activeCampus)}`, {
      cache: "no-store",
    })
      .then((res) =>
        res.ok ? (res.json() as Promise<PublicKioskStatePayload>) : null
      )
      .then((data) => {
        if (!cancelled && data) {
          setState(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeCampus]);

  const { isConnected, isOnline } = useQueueStream({
    campus: activeCampus,
    onEvent: (evt) => setLastEvent(evt),
    onRefresh: () => refreshState(activeCampus),
    fallbackPollMs: 4000,
  });

  // Schedule idle attract screen timer without synchronous setState in effect
  useEffect(() => {
    const attractSeconds = state.config.attractModeSeconds;
    if (effectiveMode === "DISPLAY_ONLY" || attractSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsAttractActive(true);
    }, attractSeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [effectiveMode, state.config.attractModeSeconds, attractNonce]);

  const handleUserInteraction = useCallback(() => {
    setIsAttractActive(false);
    setAttractNonce((n) => n + 1);
  }, []);

  const handleApplyOverrides = ({
    campus,
    mode,
    layout,
  }: {
    campus: string;
    mode: KioskDisplayMode;
    layout: UnifiedLayoutPreference;
  }) => {
    setActiveCampus(campus);
    setModeOverride(mode);
    saveLayoutPref(layout);
    if (mode === "DISPLAY_ONLY") {
      setIsAttractActive(false);
    } else {
      handleUserInteraction();
    }
  };

  const handleResetDeviceOverrides = () => {
    setActiveCampus(state.config.defaultCampus);
    setModeOverride(initialModeOverride);
    saveLayoutPref(null);
    handleUserInteraction();
  };

  // Display-only mode delegates cleanly to full 16:9 LobbyDisplayBoard + subtle PIN corner access
  if (effectiveMode === "DISPLAY_ONLY") {
    return (
      <div className="relative min-h-screen">
        <LobbyDisplayBoard
          state={state}
          lastEvent={lastEvent}
          isConnected={isConnected}
          isOnline={isOnline}
          variant="fullscreen"
        />

        <button
          type="button"
          onClick={() => setPinModalOpen(true)}
          title="Terminal Settings (Admin PIN)"
          aria-label="Open kiosk terminal settings"
          className="fixed bottom-16 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink-muted shadow-md backdrop-blur hover:text-minsu-green-700"
        >
          <Settings className="h-4 w-4" />
        </button>

        <KioskPinModal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          hasPinConfigured={state.config.hasPinConfigured}
          currentCampus={activeCampus}
          currentMode={effectiveMode}
          currentLayout={layoutPref}
          onApplyLocalOverrides={handleApplyOverrides}
          onResetDeviceOverrides={handleResetDeviceOverrides}
        />
      </div>
    );
  }

  const unifiedContainerClass =
    layoutPref === "STACKED"
      ? "grid grid-cols-1 gap-6"
      : layoutPref === "SIDE_BY_SIDE"
      ? "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-8 md:items-start"
      : "kiosk-unified-auto";

  return (
    <div
      className="flex min-h-screen flex-col bg-page"
      onPointerDown={handleUserInteraction}
    >
      {/* Top Kiosk Header (aligned with MinSU DocTrack system header) */}
      <KioskSystemHeader
        badge="Kiosk"
        subtitleMobile="Mindoro State University • TDP"
        subtitleDesktop="Mindoro State University • Walk-In Client Kiosk"
        actions={
          <>
            {state.config.allowCampusSwitch ? (
              <div className="kiosk-header-control flex min-h-[36px] min-w-0 max-w-full items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-white focus-within:ring-2 focus-within:ring-[#F2B705] sm:min-h-[38px]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F2B705] sm:h-4 sm:w-4" />
                <label htmlFor="kiosk-campus-select" className="sr-only">
                  Select Campus
                </label>
                <select
                  id="kiosk-campus-select"
                  value={activeCampus}
                  onChange={(e) => {
                    handleUserInteraction();
                    setActiveCampus(e.target.value);
                  }}
                  className="min-w-0 max-w-[125px] truncate bg-transparent text-xs font-semibold text-white outline-none sm:max-w-[165px] sm:text-[13px] lg:max-w-none"
                >
                  {MINSU_CAMPUSES.map((c) => (
                    <option
                      key={c.key}
                      value={c.key}
                      className="bg-white text-ink"
                    >
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white sm:min-h-[38px] sm:px-3">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F2B705]" />
                <span className="max-w-[130px] truncate sm:max-w-[170px] lg:max-w-none">
                  {activeCampus}
                </span>
              </span>
            )}

            <KioskConnectionBadge
              isOnline={isOnline}
              isConnected={isConnected}
              offlineLabel="Reconnecting"
            />

            <Link
              href={`/kiosk/display?campus=${encodeURIComponent(activeCampus)}`}
              aria-label="Open Lobby TV Board"
              title="Lobby TV Board"
              className="kiosk-header-control inline-flex min-h-[36px] min-w-[36px] items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] sm:min-h-[38px] lg:px-3"
            >
              <Monitor className="h-3.5 w-3.5 shrink-0 text-[#F2B705]" />
              <span className="hidden lg:inline">TV Board</span>
            </Link>

            <Link
              href="/"
              aria-label="Back to DocTrack Portal"
              title="DocTrack Portal"
              className="kiosk-header-control inline-flex min-h-[36px] min-w-[36px] items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] sm:min-h-[38px] lg:px-3"
            >
              <Home className="h-3.5 w-3.5 shrink-0 text-[#F2B705]" />
              <span className="hidden lg:inline">Portal</span>
            </Link>

            <button
              type="button"
              onClick={() => setPinModalOpen(true)}
              aria-label="Kiosk Admin Settings"
              title="Kiosk Admin Settings"
              className="kiosk-header-control inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white/90 focus:outline-none focus:ring-2 focus:ring-[#F2B705] sm:h-[38px] sm:w-[38px]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </>
        }
      />

      {/* Main Content */}
      <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-5 sm:px-8 sm:py-8">
        {effectiveMode === "UNIFIED" ? (
          <div className={unifiedContainerClass}>
            <section className="min-w-0">
              <KioskCheckInFlow
                key={activeCampus}
                campus={activeCampus}
                config={state.config}
                services={state.services}
                waitingTotal={state.stats.waitingTotal}
                openCountersCount={state.stats.openCounters}
                compact
                onUserInteraction={handleUserInteraction}
                onTicketIssued={() => refreshState(activeCampus)}
              />
            </section>
            <aside className="min-w-0">
              <LobbyDisplayBoard
                state={state}
                lastEvent={lastEvent}
                isConnected={isConnected}
                isOnline={isOnline}
                variant="embedded"
              />
            </aside>
          </div>
        ) : (
          <div className="mx-auto w-full min-w-0 max-w-5xl">
            <KioskCheckInFlow
              key={activeCampus}
              campus={activeCampus}
              config={state.config}
              services={state.services}
              waitingTotal={state.stats.waitingTotal}
              openCountersCount={state.stats.openCounters}
              onUserInteraction={handleUserInteraction}
              onTicketIssued={() => refreshState(activeCampus)}
            />
          </div>
        )}
      </main>

      <AnimatePresence>
        {isAttractActive && (
          <KioskAttractOverlay
            state={state}
            onDismiss={handleUserInteraction}
          />
        )}
      </AnimatePresence>

      <KioskPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        hasPinConfigured={state.config.hasPinConfigured}
        currentCampus={activeCampus}
        currentMode={effectiveMode}
        currentLayout={layoutPref}
        onApplyLocalOverrides={handleApplyOverrides}
        onResetDeviceOverrides={handleResetDeviceOverrides}
      />
    </div>
  );
}
