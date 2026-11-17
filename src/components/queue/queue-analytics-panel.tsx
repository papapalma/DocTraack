"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  Users,
  Accessibility,
  Timer,
  UserX,
} from "lucide-react";
import type { StaffQueueDashboardPayload } from "@/types/queue";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface QueueAnalyticsPanelProps {
  dashboard: StaffQueueDashboardPayload;
}

export function QueueAnalyticsPanel({ dashboard }: QueueAnalyticsPanelProps) {
  const { metrics } = dashboard;
  const totalDay =
    metrics.waitingCount +
    metrics.activeServingCount +
    metrics.completedTodayCount +
    metrics.noShowTodayCount +
    metrics.cancelledTodayCount;

  const kpiCards = [
    {
      label: "Currently Waiting",
      value: metrics.waitingCount,
      icon: Users,
      tone: "bg-minsu-gold-100 text-minsu-gold-600",
    },
    {
      label: "Completed Today",
      value: metrics.completedTodayCount,
      icon: CheckCircle2,
      tone: "bg-minsu-green-100 text-minsu-green-700",
    },
    {
      label: "Priority Tickets",
      value: metrics.priorityTodayCount,
      icon: Accessibility,
      tone: "bg-minsu-gold-100 text-minsu-gold-600",
    },
    {
      label: "Avg Wait (min)",
      value: metrics.avgWaitMinutes,
      icon: Clock,
      tone: "bg-minsu-green-50 text-minsu-green-800",
    },
    {
      label: "Avg Service (min)",
      value: metrics.avgServiceMinutes,
      icon: Timer,
      tone: "bg-page text-ink",
    },
    {
      label: "No-Shows Today",
      value: metrics.noShowTodayCount,
      icon: UserX,
      tone: "bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="apple-shadow rounded-2xl border border-line bg-white p-4"
            >
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 font-heading text-2xl font-extrabold text-ink tabular-nums">
                <AnimatedNumber value={card.value} />
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Per-Service Breakdown */}
      <div className="apple-shadow rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-ink">
              Service Desk Volume — {dashboard.campus}
            </h3>
            <p className="text-xs text-ink-muted">
              Daily totals across all walk-in service lanes ({totalDay} total tickets today)
            </p>
          </div>
          <span className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-ink">
            {dashboard.queueDate}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {metrics.byService.map((svc) => {
            const sum = svc.waiting + svc.completed;
            const completedRatio = sum > 0 ? Math.round((svc.completed / sum) * 100) : 0;

            return (
              <div key={svc.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">
                    <span className="mr-2 inline-block rounded-md bg-minsu-green-100 px-2 py-0.5 font-mono text-xs font-bold text-minsu-green-800">
                      {svc.code}
                    </span>
                    {svc.name}
                  </span>
                  <span className="text-xs font-medium text-ink-muted tabular-nums">
                    {svc.completed} completed • {svc.waiting} waiting
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-page">
                  <div
                    className="h-full rounded-full bg-minsu-green-700 transition-all duration-300"
                    style={{ width: `${completedRatio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

