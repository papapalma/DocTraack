"use client";

import React, { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Accessibility,
  ArrowLeft,
  Check,
  Search,
  Sparkles,
  User,
  Hash,
  AlertCircle,
} from "lucide-react";
import type {
  QueueConfigPublicDTO,
  QueuePriority,
  QueueServiceDTO,
} from "@/types/queue";
import { Button } from "@/components/ui/button";
import { ServiceTileGrid } from "./service-tile-grid";
import {
  TicketIssuedCard,
  type IssuedTicketClientPayload,
} from "./ticket-issued-card";
import { TrackingLookupModal } from "./tracking-lookup-modal";
import { getServiceVisualTokens, ServiceCategoryIcon } from "./kiosk-visuals";
import { broadcastQueueSync } from "@/hooks/use-queue-stream";
import { unlockKioskAudio, playQueueChime } from "@/lib/kiosk-audio";

interface KioskCheckInFlowProps {
  campus: string;
  config: QueueConfigPublicDTO;
  services: QueueServiceDTO[];
  waitingTotal?: number;
  openCountersCount?: number;
  compact?: boolean;
  onUserInteraction?: () => void;
  onTicketIssued?: () => void;
}

type CheckInStep = "SELECT_SERVICE" | "CLIENT_DETAILS" | "TICKET_ISSUED";

export function KioskCheckInFlow({
  campus,
  config,
  services,
  waitingTotal = 0,
  openCountersCount = 0,
  compact = false,
  onUserInteraction,
  onTicketIssued,
}: KioskCheckInFlowProps) {
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState<CheckInStep>("SELECT_SERVICE");
  const [selectedService, setSelectedService] =
    useState<QueueServiceDTO | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [studentIdNo, setStudentIdNo] = useState("");
  const [trackingCodeRef, setTrackingCodeRef] = useState<string | null>(null);
  const [priority, setPriority] = useState<QueuePriority>("REGULAR");
  const [priorityReason, setPriorityReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTicket, setIssuedTicket] =
    useState<IssuedTicketClientPayload | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const handleResetFlow = useCallback(() => {
    setStep("SELECT_SERVICE");
    setSelectedService(null);
    setVisitorName("");
    setStudentIdNo("");
    setTrackingCodeRef(null);
    setPriority("REGULAR");
    setPriorityReason("");
    setError(null);
    setIssuedTicket(null);
  }, []);

  const handleSelectService = (service: QueueServiceDTO) => {
    onUserInteraction?.();
    unlockKioskAudio();
    setSelectedService(service);
    setError(null);
    setStep("CLIENT_DETAILS");
  };

  const handleGetQueueFromTracking = (code: string) => {
    onUserInteraction?.();
    setTrackingCodeRef(code);
    const preferred =
      services.find((s) => s.code === "G") ||
      services.find((s) => s.code === "A") ||
      services[0] ||
      null;
    if (preferred) {
      setSelectedService(preferred);
      setStep("CLIENT_DETAILS");
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || submitting) return;

    onUserInteraction?.();
    await unlockKioskAudio();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/kiosk/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus,
          serviceId: selectedService.id,
          priority,
          priorityReason:
            priority === "PRIORITY"
              ? priorityReason || "Priority Lane (PWD / Senior / Pregnant)"
              : null,
          visitorName: visitorName.trim() || null,
          studentIdNo: studentIdNo.trim() || null,
          trackingCodeRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to issue ticket. Please try again.");
        return;
      }

      setIssuedTicket(data as IssuedTicketClientPayload);
      setStep("TICKET_ISSUED");
      broadcastQueueSync(campus);
      onTicketIssued?.();

      if (config.enableSoundChime) {
        playQueueChime();
      }
    } catch {
      setError("Network error while connecting to queue server.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTransition = prefersReduced
    ? { duration: 0.01 }
    : { type: "spring" as const, duration: 0.28, bounce: 0 };

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="wait">
        {step === "SELECT_SERVICE" && (
          <motion.div
            key="step-service"
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
            transition={stepTransition}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-green-100 px-3 py-1 text-xs font-semibold text-minsu-green-800">
                    Step 1 of 2 • Walk-In Check-In
                  </span>
                  {openCountersCount === 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-xs font-semibold text-ink-muted border border-line">
                      Standby • Counters Closed
                    </span>
                  ) : waitingTotal === 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-green-50 border border-minsu-green-600/20 px-3 py-1 text-xs font-semibold text-minsu-green-800">
                      <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-green-500" />
                      No Queue • Immediate Service ({openCountersCount} Open)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-gold-100 px-3 py-1 text-xs font-semibold text-minsu-gold-600 tabular-nums">
                      {waitingTotal} Waiting Across {openCountersCount}{" "}
                      {openCountersCount === 1 ? "Window" : "Windows"}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Select How We Can Help You Today
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Tap a service desk below to get your instant queue ticket.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUserInteraction?.();
                  setTrackingOpen(true);
                }}
                className="kiosk-touch-tile inline-flex items-center gap-2 rounded-2xl border border-minsu-gold-500/40 bg-minsu-gold-100 px-4 py-3 text-sm font-semibold text-minsu-gold-600 shadow-sm hover:border-minsu-gold-500"
              >
                <Search className="h-4 w-4" />
                Check Application Status
              </button>
            </div>

            <ServiceTileGrid
              services={services}
              onSelectService={handleSelectService}
              compact={compact}
            />
          </motion.div>
        )}

        {step === "CLIENT_DETAILS" && selectedService && (
          <motion.div
            key="step-details"
            initial={prefersReduced ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, x: -12 }}
            transition={stepTransition}
            className="mx-auto w-full max-w-2xl"
          >
            <div className="apple-shadow rounded-3xl border border-line bg-white p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <button
                  type="button"
                  onClick={() => {
                    onUserInteraction?.();
                    setStep("SELECT_SERVICE");
                    setError(null);
                  }}
                  className="kiosk-touch-tile inline-flex items-center gap-2 rounded-xl border border-line bg-page px-3.5 py-2 text-sm font-semibold text-ink hover:bg-neutral-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Service
                </button>

                {(() => {
                  const visual = getServiceVisualTokens(selectedService.colorToken);
                  return (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-page px-3.5 py-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${visual.iconBg} ${visual.iconText}`}
                      >
                        <ServiceCategoryIcon
                          icon={selectedService.icon}
                          className="h-4 w-4"
                        />
                      </span>
                      <div className="text-left">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                          Lane {selectedService.code}
                        </p>
                        <p className="font-heading text-sm font-bold text-ink">
                          {selectedService.name}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-5">
                {trackingCodeRef && (
                  <div className="flex items-center justify-between rounded-xl border border-minsu-green-600/20 bg-minsu-green-50 px-4 py-2.5 text-xs">
                    <span className="font-medium text-minsu-green-800">
                      Attached Application Tracking Ref:{" "}
                      <strong className="font-mono">{trackingCodeRef}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrackingCodeRef(null)}
                      className="font-semibold text-ink-muted underline"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="kiosk-visitor-name"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink"
                    >
                      <User className="h-4 w-4 text-minsu-green-700" />
                      Your Name <span className="text-xs font-normal text-ink-muted">(Optional)</span>
                    </label>
                    <input
                      id="kiosk-visitor-name"
                      type="text"
                      value={visitorName}
                      onChange={(e) => {
                        onUserInteraction?.();
                        setVisitorName(e.target.value);
                      }}
                      placeholder="e.g., Juan Dela Cruz"
                      maxLength={80}
                      className="w-full rounded-xl border border-line bg-page px-4 py-3.5 text-base text-ink outline-none transition focus:border-minsu-green-700 focus:bg-white focus:ring-2 focus:ring-minsu-green-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="kiosk-student-id"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink"
                    >
                      <Hash className="h-4 w-4 text-minsu-green-700" />
                      Student ID No.{" "}
                      <span className="text-xs font-normal text-ink-muted">(Optional)</span>
                    </label>
                    <input
                      id="kiosk-student-id"
                      type="text"
                      value={studentIdNo}
                      onChange={(e) => {
                        onUserInteraction?.();
                        setStudentIdNo(e.target.value.toUpperCase());
                      }}
                      placeholder="e.g., 2024-00123-BC"
                      maxLength={25}
                      className="w-full rounded-xl border border-line bg-page px-4 py-3.5 font-mono text-base uppercase text-ink outline-none transition focus:border-minsu-green-700 focus:bg-white focus:ring-2 focus:ring-minsu-green-700"
                    />
                  </div>
                </div>

                {/* Express Priority Lane Selection */}
                <div className="space-y-3 rounded-2xl border border-line bg-page p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-minsu-gold-100 text-minsu-gold-600">
                        <Accessibility className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-bold text-ink">
                          Priority Lane Access (RA 10754 / Senior / Pregnant)
                        </p>
                        <p className="text-xs text-ink-muted">
                          Select if you are a Person with Disability, Senior Citizen, or Pregnant client.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={priority === "PRIORITY"}
                      onClick={() => {
                        onUserInteraction?.();
                        setPriority((p) => (p === "PRIORITY" ? "REGULAR" : "PRIORITY"));
                      }}
                      className={`kiosk-touch-tile inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${
                        priority === "PRIORITY"
                          ? "border-minsu-gold-500 bg-minsu-gold-500 text-minsu-green-900 shadow-sm"
                          : "border-line bg-white text-ink hover:border-minsu-gold-400"
                      }`}
                    >
                      {priority === "PRIORITY" && <Check className="h-4 w-4" />}
                      {priority === "PRIORITY" ? "Priority Enabled" : "Use Priority Lane"}
                    </button>
                  </div>

                  {priority === "PRIORITY" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["PWD", "Senior Citizen", "Pregnant", "Medical Assistance"].map(
                        (reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              onUserInteraction?.();
                              setPriorityReason(reason);
                            }}
                            className={`kiosk-touch-tile rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              priorityReason === reason
                                ? "border-minsu-green-700 bg-minsu-green-700 text-white"
                                : "border-line bg-white text-ink hover:border-minsu-green-600"
                            }`}
                          >
                            {reason}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ink-muted">
                    Fields above are optional — tap Get Queue Ticket right away to stay anonymous on screens.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    className="kiosk-touch-tile w-full rounded-2xl px-8 py-4 font-heading text-base font-bold sm:w-auto"
                  >
                    <Sparkles className="h-5 w-5 text-minsu-gold-400" />
                    Get Queue Ticket Now
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === "TICKET_ISSUED" && issuedTicket && (
          <motion.div
            key="step-issued"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <TicketIssuedCard
              issued={issuedTicket}
              idleResetSeconds={config.idleResetSeconds}
              enableThermalPrint={config.enableThermalPrint}
              autoPrintTicket={config.autoPrintTicket}
              onDone={handleResetFlow}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TrackingLookupModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        onGetQueueWithTracking={handleGetQueueFromTracking}
      />
    </div>
  );
}

