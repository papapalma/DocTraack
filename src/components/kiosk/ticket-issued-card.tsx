"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CheckCircle2,
  Printer,
  Clock,
  PauseCircle,
  Accessibility,
  ArrowRight,
  QrCode,
} from "lucide-react";
import type { IssuedTicketResponseDTO } from "@/types/queue";
import { Button } from "@/components/ui/button";
import { formatShortTimeManila } from "./kiosk-visuals";

export interface IssuedTicketClientPayload extends IssuedTicketResponseDTO {
  qrSvg?: string;
}

interface TicketIssuedCardProps {
  issued: IssuedTicketClientPayload;
  idleResetSeconds: number;
  enableThermalPrint: boolean;
  autoPrintTicket: boolean;
  onDone: () => void;
}

export function TicketIssuedCard({
  issued,
  idleResetSeconds,
  enableThermalPrint,
  autoPrintTicket,
  onDone,
}: TicketIssuedCardProps) {
  const prefersReduced = useReducedMotion();
  const safeResetSec = Math.max(8, idleResetSeconds || 20);
  const [secondsLeft, setSecondsLeft] = useState(safeResetSec);
  const [paused, setPaused] = useState(false);
  const autoPrintedRef = useRef(false);

  const handlePrintSlip = useCallback(() => {
    if (typeof window === "undefined") return;
    document.body.classList.add("kiosk-printing");

    const cleanup = () => {
      document.body.classList.remove("kiosk-printing");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    // Fallback removal for browsers that do not emit afterprint reliably
    window.setTimeout(cleanup, 1800);
  }, []);

  useEffect(() => {
    if (enableThermalPrint && autoPrintTicket && !autoPrintedRef.current) {
      autoPrintedRef.current = true;
      const timer = window.setTimeout(() => handlePrintSlip(), 380);
      return () => window.clearTimeout(timer);
    }
  }, [enableThermalPrint, autoPrintTicket, handlePrintSlip]);

  useEffect(() => {
    if (paused || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [paused, secondsLeft]);

  useEffect(() => {
    if (!paused && secondsLeft <= 0) {
      onDone();
    }
  }, [paused, secondsLeft, onDone]);

  const progress = Math.max(0, Math.min(1, secondsLeft / safeResetSec));
  const ringCircumference = 2 * Math.PI * 16;
  const strokeOffset = ringCircumference * (1 - progress);

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        prefersReduced
          ? { duration: 0.01 }
          : { type: "spring", duration: 0.45, bounce: 0.2 }
      }
      className="mx-auto w-full max-w-3xl"
    >
      <div className="apple-shadow overflow-hidden rounded-3xl border border-minsu-green-600/25 bg-white">
        {/* Top confirmation banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-minsu-green-700 px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-minsu-gold-400" />
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold tracking-wide uppercase">
                Queue Ticket Issued
              </p>
              <p className="truncate text-xs text-minsu-green-100">
                {issued.ticket.campus} • {formatShortTimeManila(issued.ticket.createdAt)}
              </p>
            </div>
          </div>

          {issued.ticket.priority === "PRIORITY" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-gold-500 px-3 py-1 text-xs font-bold text-minsu-green-900">
              <Accessibility className="h-3.5 w-3.5" />
              PRIORITY LANE
            </span>
          )}
        </div>

        {/* Main Ticket Content */}
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-5 sm:gap-6 sm:p-8">
          {/* Left Hero Ticket Number */}
          <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50 p-5 text-center sm:col-span-3 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-minsu-green-800">
                Your Queue Number
              </p>
              <div className="my-3 font-heading text-[clamp(2.75rem,8vw,4.5rem)] leading-none font-extrabold tracking-tight text-minsu-green-900 tabular-nums">
                {issued.ticket.ticketNumber}
              </div>
              <p className="font-heading text-base font-bold text-ink">
                {issued.ticket.serviceName}
              </p>
              {issued.maskedVisitorName && (
                <p className="mt-1 text-xs font-medium text-ink-muted">
                  Visitor: {issued.maskedVisitorName}
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-minsu-green-600/15 pt-4 text-left">
              <div className="rounded-xl bg-white p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  Ahead in Queue
                </p>
                <p className="mt-0.5 font-heading text-xl font-bold text-ink tabular-nums">
                  {issued.aheadCount}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  Est. Wait
                </p>
                <p className="mt-0.5 flex items-center gap-1 font-heading text-xl font-bold text-ink tabular-nums">
                  <Clock className="h-4 w-4 text-minsu-gold-600" />
                  {issued.estimatedWaitMinutes}m
                </p>
              </div>
            </div>
          </div>

          {/* Right QR Phone Companion Box */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-page p-5 text-center sm:col-span-2">
            {issued.qrSvg ? (
              <div
                className="rounded-2xl border border-line bg-white p-2 shadow-sm [&>svg]:h-36 [&>svg]:w-36"
                dangerouslySetInnerHTML={{ __html: issued.qrSvg }}
                aria-label={`QR code to track ticket ${issued.ticket.ticketNumber}`}
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-ink-muted">
                <QrCode className="h-12 w-12" />
              </div>
            )}
            <p className="mt-3 font-heading text-sm font-bold text-ink">
              Scan to Track on Phone
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Snap or scan this QR code so you never lose your spot while waiting.
            </p>
          </div>
        </div>

        {/* Footer Actions + Countdown Ring */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-page/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#D6DDD8"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#1B5E20"
                  strokeWidth="3"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-ink tabular-nums">
                {paused ? "||" : secondsLeft}
              </span>
            </div>

            <div className="text-xs text-ink-muted">
              {paused ? (
                <span className="font-semibold text-minsu-green-700">
                  Screen paused — take your photo or slip
                </span>
              ) : (
                <span>Returning for next client in {secondsLeft}s</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!paused && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPaused(true)}
              >
                <PauseCircle className="h-4 w-4" />
                Need More Time?
              </Button>
            )}

            {enableThermalPrint && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={handlePrintSlip}
              >
                <Printer className="h-4 w-4" />
                Print Slip
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              className="rounded-xl px-5"
              onClick={onDone}
            >
              Done — Next Client
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dedicated 80mm Thermal Slip (hidden on screen, isolated on window.print()) */}
      <div className="kiosk-thermal-slip hidden" aria-hidden="true">
        <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "8px" }}>
          <div style={{ fontWeight: 700, fontSize: "13pt" }}>MINDORO STATE UNIVERSITY</div>
          <div style={{ fontSize: "9pt" }}>TDP Scholarship Office — {issued.ticket.campus}</div>
        </div>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: "9pt", textTransform: "uppercase" }}>Queue Number</div>
          <div style={{ fontSize: "34pt", fontWeight: 800, lineHeight: 1.05, margin: "4px 0" }}>
            {issued.ticket.ticketNumber}
          </div>
          {issued.ticket.priority === "PRIORITY" && (
            <div style={{ fontWeight: 700, fontSize: "10pt" }}>[ PRIORITY LANE ]</div>
          )}
          <div style={{ fontSize: "10pt", fontWeight: 600, marginTop: "4px" }}>
            {issued.ticket.serviceName}
          </div>
        </div>
        <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", fontSize: "9pt" }}>
          <div>Ahead: {issued.aheadCount} | Est. Wait: ~{issued.estimatedWaitMinutes} mins</div>
          <div>Issued: {formatShortTimeManila(issued.ticket.createdAt)} ({issued.ticket.queueDate})</div>
        </div>
        {issued.qrSvg && (
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <div
              style={{ display: "inline-block", width: "96px", height: "96px" }}
              dangerouslySetInnerHTML={{ __html: issued.qrSvg }}
            />
            <div style={{ fontSize: "8pt", marginTop: "2px" }}>Scan QR for live status</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

