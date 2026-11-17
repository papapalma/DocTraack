"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  MapPin,
  Monitor,
  Sliders,
  Ticket,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { StaffQueueDashboardPayload } from "@/types/queue";
import { useSession } from "@/hooks/use-session";
import { useQueueStream } from "@/hooks/use-queue-stream";
import { MINSU_CAMPUSES } from "@/lib/campus-constants";
import { canManageQueueConfig } from "@/lib/rbac";
import { StaffCounterConsole } from "@/components/queue/staff-counter-console";
import { QueueAnalyticsPanel } from "@/components/queue/queue-analytics-panel";
import { KioskAdminSettings } from "@/components/queue/kiosk-admin-settings";

type QueueTab = "CONSOLE" | "ANALYTICS" | "SETTINGS";

export default function QueuePage() {
  const { user, isLoading: sessionLoading } = useSession();
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [dashboard, setDashboard] =
    useState<StaffQueueDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QueueTab>("CONSOLE");

  const fetchDashboard = useCallback(async (campusArg?: string) => {
    try {
      const target = campusArg || selectedCampus;
      const qs = target ? `?campus=${encodeURIComponent(target)}` : "";
      const res = await fetch(`/api/queue/dashboard${qs}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as StaffQueueDashboardPayload;
      setDashboard(data);
      if (!selectedCampus) {
        setSelectedCampus(data.campus);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCampus]);

  useEffect(() => {
    fetchDashboard(selectedCampus);
  }, [fetchDashboard, selectedCampus]);

  const { isConnected, isOnline } = useQueueStream({
    campus: dashboard?.campus || selectedCampus || null,
    onRefresh: () => fetchDashboard(selectedCampus),
    fallbackPollMs: 4000,
  });

  if (sessionLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-3xl bg-white" />
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!user || !dashboard) {
    return (
      <div className="rounded-3xl border border-line bg-white p-8 text-center">
        <h1 className="font-heading text-xl font-bold text-ink">
          Walk-In Queue Console Unavailable
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          You do not have permission or an active session to operate walk-in queues.
        </p>
      </div>
    );
  }

  const isSystemAdmin = canManageQueueConfig(user.role);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-white p-5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-minsu-green-700">
            Walk-In Client Queueing & Kiosk System
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink">
            Queue Counter & Lobby Control
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Manage campus windows, track priority fairness, and supervise lobby displays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campus Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-page px-3 py-2">
            <MapPin className="h-4 w-4 text-minsu-green-700" />
            <label htmlFor="queue-dashboard-campus" className="sr-only">
              Active Campus Queue
            </label>
            <select
              id="queue-dashboard-campus"
              value={dashboard.campus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink outline-none sm:text-sm"
            >
              {MINSU_CAMPUSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isOnline && isConnected
                ? "bg-minsu-green-100 text-minsu-green-800"
                : "bg-minsu-gold-100 text-minsu-gold-600"
            }`}
          >
            {isOnline && isConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                Live Sync
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                Polling
              </>
            )}
          </span>

          <Link
            href={`/kiosk?campus=${encodeURIComponent(dashboard.campus)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-minsu-green-700/25 bg-minsu-green-50 px-3.5 py-2 text-xs font-semibold text-minsu-green-800 hover:bg-minsu-green-100"
          >
            <Ticket className="h-3.5 w-3.5" />
            Launch Kiosk
            <ExternalLink className="h-3 w-3" />
          </Link>

          <Link
            href={`/kiosk/display?campus=${encodeURIComponent(dashboard.campus)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-page px-3.5 py-2 text-xs font-semibold text-ink hover:bg-neutral-100"
          >
            <Monitor className="h-3.5 w-3.5 text-minsu-green-700" />
            TV Monitor
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Role-Aware Tab Strip */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("CONSOLE")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "CONSOLE"
              ? "bg-minsu-green-700 text-white shadow-sm"
              : "text-ink-muted hover:bg-page hover:text-ink"
          }`}
        >
          <Ticket className="h-4 w-4" />
          Counter Console ({dashboard.metrics.waitingCount} waiting)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ANALYTICS")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "ANALYTICS"
              ? "bg-minsu-green-700 text-white shadow-sm"
              : "text-ink-muted hover:bg-page hover:text-ink"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Today&apos;s Metrics
        </button>

        {isSystemAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("SETTINGS")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "SETTINGS"
                ? "bg-minsu-green-700 text-white shadow-sm"
                : "text-ink-muted hover:bg-page hover:text-ink"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Kiosk & Service Settings
          </button>
        )}
      </div>

      {activeTab === "CONSOLE" && (
        <StaffCounterConsole
          dashboard={dashboard}
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          onRefresh={() => fetchDashboard(selectedCampus)}
        />
      )}

      {activeTab === "ANALYTICS" && (
        <QueueAnalyticsPanel dashboard={dashboard} />
      )}

      {activeTab === "SETTINGS" && isSystemAdmin && (
        <KioskAdminSettings
          key={dashboard.config.updatedAt}
          config={dashboard.config}
          services={dashboard.services}
          counters={dashboard.counters}
          operators={dashboard.operators}
          activeCampus={dashboard.campus}
          onRefresh={() => fetchDashboard(selectedCampus)}
        />
      )}
    </div>
  );
}

