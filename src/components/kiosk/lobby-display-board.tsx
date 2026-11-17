"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import {
  BellRing,
  CheckCircle2,
  Clock,
  Megaphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PublicKioskStatePayload, QueueRealtimeEvent } from "@/types/queue";
import {
  deriveQueuePresentationState,
  formatClockManila,
  formatShortTimeManila,
  KioskConnectionBadge,
  KioskSystemHeader,
} from "./kiosk-visuals";
import {
  LobbyCallingSpotlight,
  LobbyCounterCard,
  LobbyEmptyWelcomeCard,
  LobbyWaitingColumn,
} from "./lobby-display-states";
import { announceQueueTicket, unlockKioskAudio } from "@/lib/kiosk-audio";

interface LobbyDisplayBoardProps {
  state: PublicKioskStatePayload;
  lastEvent?: QueueRealtimeEvent | null;
  isConnected?: boolean;
  isOnline?: boolean;
  variant?: "fullscreen" | "embedded";
}

export function LobbyDisplayBoard({
  state,
  lastEvent,
  isConnected = true,
  isOnline = true,
  variant = "fullscreen",
}: LobbyDisplayBoardProps) {
  const prefersReduced = Boolean(useReducedMotion());
  const [clockText, setClockText] = useState<string>("--:--");
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const seenCallKeyRef = useRef<string | null>(null);

  const recentCallKey =
    lastEvent &&
    (lastEvent.type === "CALL" || lastEvent.type === "RECALL") &&
    lastEvent.ticketNumber
      ? `${lastEvent.ticketNumber}:${lastEvent.version}:${lastEvent.recallTick ?? 0}`
      : null;

  useEffect(() => {
    const initialTick = window.setTimeout(() => {
      setClockText(formatClockManila(new Date()));
    }, 0);
    const timer = window.setInterval(() => {
      setClockText(formatClockManila(new Date()));
    }, 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (state.announcements.length <= 1) return;
    const timer = window.setInterval(() => {
      setTickerIndex((i) => (i + 1) % state.announcements.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [state.announcements.length]);

  useEffect(() => {
    if (!recentCallKey || !lastEvent?.ticketNumber) return;
    if (seenCallKeyRef.current === recentCallKey) return;
    seenCallKeyRef.current = recentCallKey;

    if (
      !audioMuted &&
      (state.config.enableSoundChime || state.config.enableVoiceTts)
    ) {
      announceQueueTicket(lastEvent.ticketNumber, lastEvent.counterName, {
        enableChime: state.config.enableSoundChime,
        enableVoice: state.config.enableVoiceTts,
      });
    }
  }, [
    recentCallKey,
    lastEvent,
    audioMuted,
    state.config.enableSoundChime,
    state.config.enableVoiceTts,
  ]);

  const handleToggleAudio = async () => {
    const unlocked = await unlockKioskAudio();
    setAudioReady(unlocked);
    setAudioMuted((prev) => !prev);
  };

  const presentation = deriveQueuePresentationState(state);
  const isQuietEmpty =
    presentation.mode === "QUIET_NO_QUEUE" ||
    presentation.mode === "ALL_CLOSED";

  const fullscreenCounterCols =
    presentation.displayCounters.length <= 1
      ? "grid-cols-1"
      : presentation.displayCounters.length >= 5
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  const activeAnnouncement =
    state.announcements.length > 0
      ? state.announcements[tickerIndex % state.announcements.length]
      : null;

  if (variant === "embedded") {
    return (
      <div className="apple-shadow flex min-w-0 flex-col justify-between rounded-3xl border border-line bg-white p-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-minsu-green-700">
                Live Lobby Monitor
              </p>
              <h2 className="font-heading text-xl font-bold text-ink">
                {isQuietEmpty ? "Window Availability" : "Now Serving"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-page px-3 py-1.5 font-mono text-xs font-semibold text-ink tabular-nums">
                {clockText}
              </span>
              <button
                type="button"
                onClick={handleToggleAudio}
                title={audioMuted ? "Unmute announcements" : "Mute announcements"}
                aria-label={
                  audioMuted ? "Unmute announcements" : "Mute announcements"
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-page text-ink-muted hover:text-minsu-green-700"
              >
                {audioMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isQuietEmpty ? (
              <LobbyEmptyWelcomeCard
                key={`embedded-empty-${presentation.mode}`}
                mode={
                  presentation.mode === "ALL_CLOSED"
                    ? "ALL_CLOSED"
                    : "QUIET_NO_QUEUE"
                }
                presentation={presentation}
                servedToday={state.stats.servedToday}
                compact
                reducedMotion={prefersReduced}
              />
            ) : (
              <div key="embedded-active" className="space-y-4">
                <LobbyCallingSpotlight
                  callingCounters={presentation.callingCounters}
                  showPrivacyMaskedNames={state.config.showPrivacyMaskedNames}
                  recentCallKey={recentCallKey}
                  compact
                  reducedMotion={prefersReduced}
                />

                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
                  {presentation.displayCounters.map((counter, idx) => (
                    <LobbyCounterCard
                      key={counter.id}
                      counter={counter}
                      index={idx}
                      showPrivacyMaskedNames={state.config.showPrivacyMaskedNames}
                      serviceColorByCode={presentation.serviceColorByCode}
                      compact
                      reducedMotion={prefersReduced}
                    />
                  ))}
                </div>

                <div className="border-t border-line pt-4">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Waiting Queue ({state.stats.waitingTotal})
                    </span>
                    <span className="text-xs font-medium text-minsu-green-700 tabular-nums">
                      {state.stats.servedToday} served today
                    </span>
                  </div>

                  <LobbyWaitingColumn
                    presentation={presentation}
                    waitingTotal={state.stats.waitingTotal}
                    servedToday={state.stats.servedToday}
                    compact
                    reducedMotion={prefersReduced}
                  />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {activeAnnouncement && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-minsu-green-600/15 bg-minsu-green-50 px-3.5 py-2.5 text-xs text-minsu-green-900">
            <Megaphone className="h-4 w-4 shrink-0 text-minsu-gold-600" />
            <span className="truncate font-medium">
              {activeAnnouncement.title}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-page text-ink">
      <KioskSystemHeader
        badge="Queue TV"
        subtitleMobile={state.campus}
        subtitleDesktop={`Mindoro State University • ${state.campus}`}
        maxWidthClass="max-w-[1920px]"
        horizontalPaddingClass="px-4 sm:px-6 lg:px-8 2xl:px-10"
        actions={
          <>
            {!audioReady && !audioMuted && (
              <button
                type="button"
                onClick={handleToggleAudio}
                className="apple-press inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#F2B705] px-3 py-1.5 text-xs font-bold text-[#123F17] shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white sm:min-h-[38px] sm:px-3.5 sm:hover:bg-[#F9C733]"
              >
                <BellRing className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">Voice</span>
                <span className="hidden sm:inline">Enable Voice &amp; Chime</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleAudio}
              aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
              className="kiosk-header-control inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F2B705] sm:min-h-[38px] sm:px-3"
            >
              {audioMuted ? (
                <>
                  <VolumeX className="h-4 w-4 shrink-0 text-white/75" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 shrink-0 text-[#F2B705]" />
                  <span className="sm:hidden">Audio</span>
                  <span className="hidden sm:inline">Audio On</span>
                </>
              )}
            </button>

            <div className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white tabular-nums sm:min-h-[38px] sm:gap-2 sm:px-3.5 sm:text-sm">
              <Clock className="h-4 w-4 shrink-0 text-[#F2B705]" />
              {clockText}
            </div>

            <KioskConnectionBadge
              isOnline={isOnline}
              isConnected={isConnected}
              offlineLabel="Syncing"
            />
          </>
        }
      />

      <main className="mx-auto grid w-full max-w-[1920px] flex-1 grid-cols-1 gap-6 px-4 py-5 sm:px-8 sm:py-6 lg:grid-cols-12 lg:px-10">
        <section className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-minsu-green-900 sm:text-lg">
              {isQuietEmpty
                ? "Lobby Readiness & Open Windows"
                : "Now Serving at Windows"}
            </h2>
            <span className="rounded-full bg-minsu-green-100 px-3 py-1 text-xs font-bold text-minsu-green-800 tabular-nums">
              {state.stats.openCounters} Open{" "}
              {state.stats.openCounters === 1 ? "Counter" : "Counters"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isQuietEmpty ? (
              <LobbyEmptyWelcomeCard
                key={`tv-empty-${presentation.mode}`}
                mode={
                  presentation.mode === "ALL_CLOSED"
                    ? "ALL_CLOSED"
                    : "QUIET_NO_QUEUE"
                }
                presentation={presentation}
                servedToday={state.stats.servedToday}
                reducedMotion={prefersReduced}
              />
            ) : (
              <div key="tv-active" className="space-y-4 sm:space-y-5">
                <LobbyCallingSpotlight
                  callingCounters={presentation.callingCounters}
                  showPrivacyMaskedNames={state.config.showPrivacyMaskedNames}
                  recentCallKey={recentCallKey}
                  reducedMotion={prefersReduced}
                />

                <div className={`grid gap-4 sm:gap-5 ${fullscreenCounterCols}`}>
                  {presentation.displayCounters.map((counter, idx) => (
                    <LobbyCounterCard
                      key={counter.id}
                      counter={counter}
                      index={idx}
                      showPrivacyMaskedNames={
                        state.config.showPrivacyMaskedNames
                      }
                      serviceColorByCode={presentation.serviceColorByCode}
                      reducedMotion={prefersReduced}
                    />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>

        <aside className="apple-shadow flex min-w-0 flex-col justify-between rounded-3xl border border-line bg-white p-5 sm:p-6 lg:col-span-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3.5">
              <h2 className="font-heading text-lg font-bold text-ink">
                {isQuietEmpty ? "Office Activity" : "Waiting Queue"}
              </h2>
              <span
                className={`rounded-full px-3 py-1 font-heading text-xs font-bold tabular-nums ${
                  state.stats.waitingTotal === 0
                    ? "bg-minsu-green-100 text-minsu-green-800"
                    : "bg-minsu-gold-100 text-minsu-gold-600"
                }`}
              >
                {state.stats.waitingTotal === 0
                  ? "No Wait"
                  : `${state.stats.waitingTotal} Waiting`}
              </span>
            </div>

            {isQuietEmpty ? (
              <div className="space-y-4">
                <LobbyWaitingColumn
                  presentation={presentation}
                  waitingTotal={0}
                  servedToday={state.stats.servedToday}
                  reducedMotion={prefersReduced}
                />

                {state.recentlyCompleted.length > 0 && (
                  <div className="rounded-2xl border border-line bg-page/70 p-4">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Recently Completed Today
                    </p>
                    <ul className="divide-y divide-line/60">
                      {state.recentlyCompleted.slice(0, 4).map((done) => (
                        <li
                          key={done.id}
                          className="flex items-center justify-between gap-2 py-2 text-xs"
                        >
                          <span className="inline-flex items-center gap-1.5 font-heading font-bold text-ink tabular-nums">
                            <CheckCircle2 className="h-3.5 w-3.5 text-minsu-green-600" />
                            {done.ticketNumber}
                          </span>
                          <span className="truncate text-ink-muted">
                            {done.serviceName}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                            {formatShortTimeManila(done.completedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <LobbyWaitingColumn
                presentation={presentation}
                waitingTotal={state.stats.waitingTotal}
                servedToday={state.stats.servedToday}
                reducedMotion={prefersReduced}
              />
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50 p-4 text-xs text-minsu-green-900">
            <p className="font-heading font-bold">Mobile Queue Tip</p>
            <p className="mt-1 leading-relaxed">
              Scan the QR code printed or shown on the Kiosk screen to monitor your exact turn on your phone.
            </p>
          </div>
        </aside>
      </main>

      <footer className="border-t border-line bg-minsu-green-900 px-4 py-3.5 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-minsu-gold-500 px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-minsu-green-900">
              <Megaphone className="h-3.5 w-3.5" />
              Advisory
            </span>
            <p className="truncate text-sm font-medium text-minsu-green-50">
              {activeAnnouncement
                ? activeAnnouncement.title
                : "Please have your Student ID and Tracking Code ready before approaching the service window."}
            </p>
          </div>

          <p className="shrink-0 text-xs text-minsu-green-100 tabular-nums">
            Served Today:{" "}
            <strong className="text-white">{state.stats.servedToday}</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
