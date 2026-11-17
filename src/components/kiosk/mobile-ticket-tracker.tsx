"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  BellRing,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import type { MobileTicketTrackerDTO } from "@/types/queue";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useQueueStream, broadcastQueueSync } from "@/hooks/use-queue-stream";
import {
  formatShortTimeManila,
  KioskConnectionBadge,
  KioskSystemHeader,
} from "./kiosk-visuals";
import { playQueueChime, unlockKioskAudio } from "@/lib/kiosk-audio";

interface MobileTicketTrackerProps {
  initialTracker: MobileTicketTrackerDTO;
}

const STATUS_STYLES: Record<
  string,
  { title: string; badge: string; panel: string }
> = {
  WAITING: {
    title: "Waiting in Queue",
    badge: "bg-minsu-gold-100 text-minsu-gold-600 border-minsu-gold-400/40",
    panel: "border-line bg-white",
  },
  CALLED: {
    title: "It Is Your Turn!",
    badge: "bg-minsu-green-700 text-white border-minsu-green-800",
    panel: "border-minsu-gold-500 bg-minsu-gold-100/60",
  },
  SERVING: {
    title: "Now Being Served",
    badge: "bg-minsu-green-100 text-minsu-green-800 border-minsu-green-600/20",
    panel: "border-minsu-green-600/40 bg-minsu-green-50",
  },
  COMPLETED: {
    title: "Service Completed",
    badge: "bg-minsu-green-900 text-white border-minsu-green-900",
    panel: "border-minsu-green-700/25 bg-white",
  },
  NO_SHOW: {
    title: "Marked No-Show",
    badge: "bg-red-50 text-red-700 border-red-200",
    panel: "border-red-200 bg-white",
  },
  CANCELLED: {
    title: "Cancelled",
    badge: "bg-slate-100 text-slate-600 border-slate-300",
    panel: "border-line bg-white",
  },
};

export function MobileTicketTracker({
  initialTracker,
}: MobileTicketTrackerProps) {
  const [tracker, setTracker] = useState<MobileTicketTrackerDTO>(initialTracker);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const prevStatusRef = useRef(initialTracker.status);

  const refreshTracker = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/kiosk/tickets/${encodeURIComponent(tracker.publicLookupToken)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.tracker) {
        setTracker(data.tracker as MobileTicketTrackerDTO);
      }
    } catch {
      // Transient mobile connectivity drop
    }
  }, [tracker.publicLookupToken]);

  const { isConnected, isOnline } = useQueueStream({
    campus: tracker.campus,
    onRefresh: refreshTracker,
    fallbackPollMs: 4000,
  });

  // Alert user cleanly on transition into CALLED state
  useEffect(() => {
    if (prevStatusRef.current !== "CALLED" && tracker.status === "CALLED") {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([220, 120, 220]);
      }
      playQueueChime();
    }
    prevStatusRef.current = tracker.status;
  }, [tracker.status]);

  const handleManualRefresh = async () => {
    await unlockKioskAudio();
    setRefreshing(true);
    await refreshTracker();
    setRefreshing(false);
  };

  const handleCancelTicket = async () => {
    setCancelling(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/kiosk/tickets/${encodeURIComponent(tracker.publicLookupToken)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Unable to cancel ticket.");
        return;
      }
      setConfirmCancelOpen(false);
      broadcastQueueSync(tracker.campus);
      await refreshTracker();
    } catch {
      setActionError("Network error while cancelling your ticket.");
    } finally {
      setCancelling(false);
    }
  };

  const visual = STATUS_STYLES[tracker.status] || STATUS_STYLES.WAITING;

  return (
    <div className="min-h-screen bg-page">
      <KioskSystemHeader
        headingLevel="span"
        badge="Ticket"
        subtitleMobile={tracker.campus}
        subtitleDesktop={`Mindoro State University • ${tracker.campus}`}
        maxWidthClass="max-w-md"
        horizontalPaddingClass="px-4 sm:px-6"
        actions={
          <KioskConnectionBadge
            isOnline={isOnline}
            isConnected={isConnected}
            offlineLabel="Updating"
          />
        }
      />

      <div className="mx-auto max-w-md space-y-4 px-4 py-6 sm:py-8">

        {/* Main Ticket Card */}
        <div
          className={`apple-shadow rounded-3xl border-2 p-6 transition-colors ${visual.panel}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${visual.badge}`}
            >
              {tracker.status === "CALLED" && <BellRing className="h-3.5 w-3.5" />}
              {tracker.status === "COMPLETED" && (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {tracker.status === "CANCELLED" && <XCircle className="h-3.5 w-3.5" />}
              {visual.title}
            </span>

            {tracker.priority === "PRIORITY" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-minsu-gold-500 px-2.5 py-1 text-xs font-bold text-minsu-green-900">
                <Accessibility className="h-3.5 w-3.5" />
                Priority
              </span>
            )}
          </div>

          <div className="my-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              Queue Ticket
            </p>
            <h1 className="mt-1 font-heading text-6xl font-extrabold tracking-tight text-minsu-green-900 tabular-nums">
              {tracker.ticketNumber}
            </h1>
            <p className="mt-2 font-heading text-base font-bold text-ink">
              {tracker.serviceName}
            </p>
          </div>

          {tracker.status === "CALLED" && tracker.counterName && (
            <div className="mb-4 rounded-2xl bg-minsu-green-700 p-4 text-center text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-minsu-gold-400">
                Please Proceed Immediately To
              </p>
              <p className="mt-0.5 font-heading text-2xl font-extrabold">
                {tracker.counterName}
              </p>
            </div>
          )}

          {tracker.status === "SERVING" && tracker.counterName && (
            <div className="mb-4 rounded-2xl bg-white p-3.5 text-center text-sm font-semibold text-minsu-green-800">
              Currently assisting at <strong>{tracker.counterName}</strong>
            </div>
          )}

          {tracker.status === "WAITING" && (
            <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div className="rounded-2xl bg-page p-3.5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                  Ahead of You
                </p>
                <p className="mt-1 font-heading text-3xl font-extrabold text-ink tabular-nums">
                  {tracker.aheadCount}
                </p>
              </div>
              <div className="rounded-2xl bg-page p-3.5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                  Est. Wait Time
                </p>
                <p className="mt-1 flex items-center justify-center gap-1 font-heading text-3xl font-extrabold text-ink tabular-nums">
                  <Clock className="h-5 w-5 text-minsu-gold-600" />
                  {tracker.estimatedWaitMinutes}m
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-1.5 border-t border-line/70 pt-3 text-xs text-ink-muted">
            <div className="flex justify-between">
              <span>Now Serving at Windows</span>
              <span className="font-mono font-bold text-ink">
                {tracker.nowServingTicketNumber || "Standby"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ticket Issued</span>
              <span className="font-medium text-ink">
                {formatShortTimeManila(tracker.createdAt)} ({tracker.queueDate})
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            isLoading={refreshing}
            onClick={handleManualRefresh}
            className="w-full rounded-2xl bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status & Enable Sound Alert
          </Button>

          {tracker.status === "WAITING" && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setConfirmCancelOpen(true)}
              className="w-full rounded-2xl text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
              Leave Queue / Cancel My Ticket
            </Button>
          )}

          <Link
            href="/kiosk"
            className="mt-1 text-center text-xs font-semibold text-minsu-green-700 underline"
          >
            Open Kiosk Check-In
          </Link>
        </div>
      </div>

      <Modal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Cancel Your Queue Ticket?"
        description={`Are you sure you want to leave the queue for ${tracker.ticketNumber}? This cannot be undone.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
              {actionError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmCancelOpen(false)}
              className="rounded-xl"
            >
              Keep My Spot
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={cancelling}
              onClick={handleCancelTicket}
              className="rounded-xl"
            >
              Yes, Cancel Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

