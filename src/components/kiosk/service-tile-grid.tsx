"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Clock, Users } from "lucide-react";
import type { QueueServiceDTO } from "@/types/queue";
import { getServiceVisualTokens, ServiceCategoryIcon } from "./kiosk-visuals";
import { cn } from "@/lib/utils";

interface ServiceTileGridProps {
  services: QueueServiceDTO[];
  onSelectService: (service: QueueServiceDTO) => void;
  compact?: boolean;
}

export function ServiceTileGrid({
  services,
  onSelectService,
  compact = false,
}: ServiceTileGridProps) {
  const prefersReduced = useReducedMotion();

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/80 p-10 text-center">
        <p className="font-heading text-lg font-semibold text-ink">
          No active walk-in services at this campus
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Please approach the TDP Help Desk or ask a staff coordinator for assistance.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        compact
          ? "grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]"
          : "grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]"
      )}
    >
      {services.map((service, idx) => {
        const tokens = getServiceVisualTokens(service.colorToken);
        const waitingCount = service.waitingCount ?? 0;
        const estWait = service.estimatedWaitMinutes ?? service.estimatedMinutes;
        const isImmediate = waitingCount === 0;

        return (
          <motion.button
            key={service.id}
            type="button"
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.23, 1, 0.32, 1],
              delay: prefersReduced ? 0 : Math.min(idx, 5) * 0.045,
            }}
            onClick={() => onSelectService(service)}
            className={cn(
              "kiosk-touch-tile apple-shadow apple-shadow-hover group relative flex min-w-0 flex-col justify-between rounded-2xl border-2 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-minsu-green-700/25",
              compact
                ? "min-h-[124px] p-4 sm:p-5"
                : "min-h-[148px] p-5 sm:p-6",
              tokens.bg,
              tokens.border
            )}
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-2xl transition-transform duration-150 group-active:scale-95",
                    compact ? "h-12 w-12" : "h-13 w-13 sm:h-15 sm:w-15",
                    tokens.iconBg,
                    tokens.iconText
                  )}
                >
                  <ServiceCategoryIcon
                    icon={service.icon}
                    className={compact ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-2.5 py-0.5 font-heading text-xs font-bold tracking-wider",
                        tokens.codeBg
                      )}
                    >
                      LANE {service.code}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                      <Clock className="h-3.5 w-3.5" />~{estWait} min wait
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "mt-2 font-heading font-bold tracking-tight text-ink",
                      compact
                        ? "text-base sm:text-lg"
                        : "text-lg sm:text-xl"
                    )}
                  >
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-xs sm:text-sm leading-snug text-ink-muted">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>

              <span className="mt-1 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-page text-ink-muted transition-colors group-hover:bg-minsu-green-700 group-hover:text-white">
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
              {isImmediate ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-green-100 px-3 py-1 text-xs font-semibold text-minsu-green-800">
                  <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-green-500" />
                  Walk Right Up • No Queue
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
                    tokens.badgeBg,
                    tokens.badgeText
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  {waitingCount}{" "}
                  {waitingCount === 1 ? "client" : "clients"} waiting (~
                  {estWait}m)
                </span>
              )}

              <span className="text-xs font-semibold text-minsu-green-700">
                Tap to select
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
