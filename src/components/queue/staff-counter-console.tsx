"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Accessibility,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  Clock,
  MonitorCheck,
  Pause,
  Play,
  PhoneCall,
  Power,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import type { Role } from "@/types";
import type {
  QueueCounterDTO,
  StaffQueueDashboardPayload,
  StaffQueueTicketDTO,
} from "@/types/queue";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { broadcastQueueSync } from "@/hooks/use-queue-stream";
import { canResetDailyQueue } from "@/lib/rbac";
import {
  getCounterOwnership,
  getServiceAssignmentStatus,
  selectRoutedWaitingTicket,
} from "@/lib/queue-fairness";
import {
  formatShortTimeManila,
  getServiceVisualTokens,
} from "@/components/kiosk/kiosk-visuals";

interface StaffCounterConsoleProps {
  dashboard: StaffQueueDashboardPayload;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: Role;
  onRefresh: () => Promise<void>;
}

interface TakeoverConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export function StaffCounterConsole({
  dashboard,
  userId,
  userName,
  userEmail,
  userRole,
  onRefresh,
}: StaffCounterConsoleProps) {
  const prefersReduced = Boolean(useReducedMotion());

  const serviceAssignmentsByCode = useMemo(
    () =>
      new Map(
        dashboard.services.map((s) => [s.code, s.assignedStaff ?? []])
      ),
    [dashboard.services]
  );

  const serviceByCode = useMemo(
    () => new Map(dashboard.services.map((s) => [s.code, s])),
    [dashboard.services]
  );

  const [selectedCounterId, setSelectedCounterId] = useState<string>(() => {
    const owned = dashboard.counters.find(
      (c) => getCounterOwnership(c, userId, userEmail) === "OWNED_BY_USER"
    );
    if (owned) return owned.id;
    const allowed = dashboard.counters.find(
      (c) =>
        userRole === "SYSTEM_ADMIN" ||
        c.allowedRoles.length === 0 ||
        c.allowedRoles.includes(userRole)
    );
    return allowed?.id || dashboard.counters[0]?.id || "";
  });

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [waitingFilter, setWaitingFilter] = useState<"ALL" | "MINE">("ALL");

  const [transferModalTicket, setTransferModalTicket] =
    useState<StaffQueueTicketDTO | null>(null);
  const [transferTargetServiceId, setTransferTargetServiceId] = useState<string>("");
  const [noShowConfirmTicket, setNoShowConfirmTicket] =
    useState<StaffQueueTicketDTO | null>(null);
  const [noShowNote, setNoShowNote] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [takeoverConfirm, setTakeoverConfirm] =
    useState<TakeoverConfirmState | null>(null);

  const sortedCounters = useMemo(() => {
    const rank = (c: QueueCounterDTO) => {
      const ownership = getCounterOwnership(c, userId, userEmail);
      if (ownership === "OWNED_BY_USER") return 0;
      if (ownership === "UNASSIGNED") return 1;
      return 2;
    };
    return [...dashboard.counters].sort((a, b) => {
      const diff = rank(a) - rank(b);
      return diff !== 0 ? diff : a.sortOrder - b.sortOrder;
    });
  }, [dashboard.counters, userId, userEmail]);

  const userAssignedCounters = useMemo(
    () =>
      dashboard.counters.filter(
        (c) => getCounterOwnership(c, userId, userEmail) === "OWNED_BY_USER"
      ),
    [dashboard.counters, userId, userEmail]
  );

  const userAssignedServices = useMemo(
    () =>
      dashboard.services.filter(
        (s) =>
          getServiceAssignmentStatus(s.assignedStaff, userId, userEmail) ===
          "ASSIGNED_TO_USER"
      ),
    [dashboard.services, userId, userEmail]
  );

  const activeCounter = useMemo(
    () =>
      dashboard.counters.find((c) => c.id === selectedCounterId) ||
      sortedCounters[0] ||
      null,
    [dashboard.counters, sortedCounters, selectedCounterId]
  );

  const activeOwnership = activeCounter
    ? getCounterOwnership(activeCounter, userId, userEmail)
    : "UNASSIGNED";
  const isTakeoverWindow =
    activeOwnership === "OWNED_BY_OTHER" && userRole !== "SYSTEM_ADMIN";

  const isCounterPermitted = (counter: QueueCounterDTO | null) => {
    if (!counter) return false;
    if (userRole === "SYSTEM_ADMIN") return true;
    return (
      counter.allowedRoles.length === 0 ||
      counter.allowedRoles.includes(userRole)
    );
  };

  const canOperateSelected = isCounterPermitted(activeCounter);
  const currentTicket = activeCounter?.currentTicket || null;

  const eligibleWaitingTickets = useMemo(() => {
    if (!activeCounter || activeCounter.serviceCodes.length === 0) {
      return dashboard.waitingTickets;
    }
    return dashboard.waitingTickets.filter((t) =>
      activeCounter.serviceCodes.includes(t.serviceCode)
    );
  }, [activeCounter, dashboard.waitingTickets]);

  const routedPick = useMemo(
    () =>
      selectRoutedWaitingTicket({
        waiting: eligibleWaitingTickets,
        consecutivePriorityCount: activeCounter?.consecutivePriorityCount ?? 0,
        priorityRatio: dashboard.config.priorityRatio,
        serviceAssignmentsByCode,
        userId,
        userEmail,
        allowTakeover: false,
      }),
    [
      eligibleWaitingTickets,
      activeCounter?.consecutivePriorityCount,
      dashboard.config.priorityRatio,
      serviceAssignmentsByCode,
      userId,
      userEmail,
    ]
  );

  const fallbackTakeoverPick = useMemo(() => {
    if (routedPick.selected || routedPick.otherAssignedCount === 0) {
      return null;
    }
    return selectRoutedWaitingTicket({
      waiting: eligibleWaitingTickets,
      consecutivePriorityCount: activeCounter?.consecutivePriorityCount ?? 0,
      priorityRatio: dashboard.config.priorityRatio,
      serviceAssignmentsByCode,
      userId,
      userEmail,
      allowTakeover: true,
    }).selected;
  }, [
    routedPick.selected,
    routedPick.otherAssignedCount,
    eligibleWaitingTickets,
    activeCounter?.consecutivePriorityCount,
    dashboard.config.priorityRatio,
    serviceAssignmentsByCode,
    userId,
    userEmail,
  ]);

  const nextFairPick = routedPick.selected ?? fallbackTakeoverPick;
  const nextFairPickRequiresTakeover =
    Boolean(nextFairPick) &&
    (routedPick.selected === null || isTakeoverWindow);

  const filteredWaitingTickets = useMemo(() => {
    if (waitingFilter === "ALL") return dashboard.waitingTickets;
    return dashboard.waitingTickets.filter(
      (wt) =>
        getServiceAssignmentStatus(
          serviceAssignmentsByCode.get(wt.serviceCode),
          userId,
          userEmail
        ) !== "ASSIGNED_TO_OTHER"
    );
  }, [dashboard.waitingTickets, waitingFilter, serviceAssignmentsByCode, userId, userEmail]);

  const myOrOpenWaitingCount = useMemo(
    () =>
      dashboard.waitingTickets.filter(
        (wt) =>
          getServiceAssignmentStatus(
            serviceAssignmentsByCode.get(wt.serviceCode),
            userId,
            userEmail
          ) !== "ASSIGNED_TO_OTHER"
      ).length,
    [dashboard.waitingTickets, serviceAssignmentsByCode, userId, userEmail]
  );

  const serviceColorByCode = useMemo(
    () => new Map(dashboard.services.map((s) => [s.code, s.colorToken])),
    [dashboard.services]
  );

  const fairnessRuleLabel =
    dashboard.config.priorityRatio === 0
      ? "Strict Priority"
      : dashboard.config.priorityRatio < 0
      ? "FIFO"
      : `${dashboard.config.priorityRatio}:1 Priority Ratio`;

  const runCounterPatch = async (payload: Record<string, unknown>, label: string) => {
    setBusyAction(label);
    setFeedback(null);
    try {
      const res = await fetch("/api/queue/counters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Counter update failed." });
        return;
      }
      broadcastQueueSync(dashboard.campus);
      await onRefresh();
    } catch {
      setFeedback({ type: "error", message: "Network error updating counter." });
    } finally {
      setBusyAction(null);
    }
  };

  const handleCallNext = async (takeover = false) => {
    if (!activeCounter) return;
    setBusyAction("CALL_NEXT");
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/queue/counters/${encodeURIComponent(activeCounter.id)}/call-next`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ takeover }),
        }
      );
      const data = await res.json();
      if (res.status === 409 && data.takeoverRequired && !takeover) {
        setTakeoverConfirm({
          title: `Emergency Takeover on ${activeCounter.name}?`,
          description:
            data.error ||
            "This window or ticket belongs to another designated staff operator. Proceeding logs an Emergency Takeover without overwriting Admin's window owner.",
          confirmLabel: "Take Over & Accept Ticket",
          onConfirm: async () => {
            setTakeoverConfirm(null);
            await handleCallNext(true);
          },
        });
        return;
      }
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Could not call next." });
        return;
      }
      if (data.empty) {
        setFeedback({
          type: "success",
          message:
            data.otherAssignedCount > 0
              ? `No open or personally assigned clients waiting (${data.otherAssignedCount} waiting are assigned to other staff).`
              : data.message || "No matching clients waiting.",
        });
      } else {
        setFeedback({
          type: "success",
          message: data.isTakeover
            ? `Emergency takeover: accepted & calling ${data.ticket.ticketNumber} at ${activeCounter.name}.`
            : `Accepted & calling ${data.ticket.ticketNumber} at ${activeCounter.name}.`,
        });
      }
      broadcastQueueSync(dashboard.campus);
      await onRefresh();
    } catch {
      setFeedback({ type: "error", message: "Failed to call next ticket." });
    } finally {
      setBusyAction(null);
    }
  };

  const handleTicketAction = async (
    ticketId: string,
    action: string,
    extra: Record<string, unknown> = {}
  ) => {
    setBusyAction(action);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/queue/tickets/${encodeURIComponent(ticketId)}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            counterId: activeCounter?.id,
            ...extra,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 409 && data.takeoverRequired && !extra.takeover) {
        setTakeoverConfirm({
          title: "Confirm Emergency Takeover?",
          description:
            data.error ||
            "This ticket or window is assigned to another staff member. Proceeding will log an Emergency Takeover under your name and email.",
          confirmLabel: "Confirm Takeover",
          onConfirm: async () => {
            setTakeoverConfirm(null);
            await handleTicketAction(ticketId, action, {
              ...extra,
              takeover: true,
            });
          },
        });
        return;
      }
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Ticket action failed." });
        return;
      }
      setTransferModalTicket(null);
      setNoShowConfirmTicket(null);
      setNoShowNote("");
      broadcastQueueSync(dashboard.campus);
      await onRefresh();
    } catch {
      setFeedback({ type: "error", message: "Network error performing action." });
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetDay = async () => {
    setBusyAction("RESET");
    setFeedback(null);
    try {
      const res = await fetch("/api/queue/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus: dashboard.campus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Reset failed." });
        return;
      }
      setResetConfirmOpen(false);
      setFeedback({
        type: "success",
        message: `Closed ${data.cancelledCount ?? 0} pending tickets for ${dashboard.campus}.`,
      });
      broadcastQueueSync(dashboard.campus);
      await onRefresh();
    } catch {
      setFeedback({ type: "error", message: "Failed to run daily queue cut-off." });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-minsu-green-600/25 bg-minsu-green-50 text-minsu-green-800"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Operator Identity & Routing Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50/70 px-4 py-3 text-xs">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-heading font-bold text-minsu-green-900">
              <UserCheck className="h-4 w-4 text-minsu-green-700" />
              {userName}
            </span>
            <span className="rounded-full border border-line bg-white px-2.5 py-0.5 font-mono text-[11px] text-ink-muted">
              {userEmail}
            </span>
            <span className="rounded-full bg-minsu-green-700 px-2 py-0.5 text-[10px] font-bold text-white">
              {userRole}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
            <span>
              <strong className="text-ink">Designated Windows:</strong>{" "}
              {userAssignedCounters.length > 0
                ? userAssignedCounters.map((c) => c.name).join(", ")
                : "None fixed (may claim unassigned)"}
            </span>
            <span>
              <strong className="text-ink">Designated Lanes:</strong>{" "}
              {userAssignedServices.length > 0
                ? userAssignedServices
                    .map((s) => `${s.code} • ${s.name}`)
                    .join(", ")
                : "Open eligible lanes"}
            </span>
          </div>
        </div>
      </div>

      {/* Window Selector Strip */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
        {sortedCounters.map((counter) => {
          const isSelected = counter.id === activeCounter?.id;
          const permitted = isCounterPermitted(counter);
          const ownership = getCounterOwnership(counter, userId, userEmail);
          const matchingCount =
            counter.serviceCodes.length === 0
              ? dashboard.waitingTickets.length
              : dashboard.waitingTickets.filter((t) =>
                  counter.serviceCodes.includes(t.serviceCode)
                ).length;

          return (
            <button
              key={counter.id}
              type="button"
              onClick={() => setSelectedCounterId(counter.id)}
              className={`apple-press rounded-2xl border-2 p-4 text-left transition-colors ${
                isSelected
                  ? "border-minsu-green-700 bg-minsu-green-50 shadow-sm"
                  : ownership === "OWNED_BY_USER"
                  ? "border-minsu-green-600/35 bg-white hover:border-minsu-green-700"
                  : "border-line bg-white hover:border-minsu-green-600/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-heading text-base font-bold text-ink">
                  {counter.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    !counter.isOpen
                      ? "bg-slate-100 text-slate-600"
                      : counter.isPaused
                      ? "bg-minsu-gold-100 text-minsu-gold-600"
                      : "bg-minsu-green-100 text-minsu-green-800"
                  }`}
                >
                  {!counter.isOpen
                    ? "Closed"
                    : counter.isPaused
                    ? "Paused"
                    : "Open"}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {ownership === "OWNED_BY_USER" ? (
                  <span className="rounded-full bg-minsu-green-700 px-2 py-0.5 text-[10px] font-bold text-white">
                    Your Window
                  </span>
                ) : ownership === "OWNED_BY_OTHER" ? (
                  <span className="max-w-full truncate rounded-full bg-minsu-gold-100 px-2 py-0.5 text-[10px] font-semibold text-minsu-gold-600">
                    {counter.assignedStaffName || "Assigned"}
                    {counter.assignedStaffEmail
                      ? ` • ${counter.assignedStaffEmail}`
                      : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    Unassigned
                  </span>
                )}
              </div>

              <p className="mt-1.5 truncate text-xs text-ink-muted">
                Lanes:{" "}
                <strong className="text-ink">
                  {counter.serviceCodes.join(", ") || "All"}
                </strong>
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/60 pt-2 text-xs">
                {counter.currentTicket ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono font-bold ${
                      counter.currentTicket.status === "CALLED"
                        ? "text-minsu-gold-600"
                        : "text-minsu-green-900"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        counter.currentTicket.status === "CALLED"
                          ? "bg-minsu-gold-500"
                          : "bg-minsu-green-600"
                      }`}
                    />
                    {counter.currentTicket.status === "CALLED"
                      ? `Calling: ${counter.currentTicket.ticketNumber}`
                      : `Serving: ${counter.currentTicket.ticketNumber}`}
                  </span>
                ) : counter.isOpen && !counter.isPaused ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${
                      matchingCount === 0
                        ? "text-minsu-green-700"
                        : "text-minsu-gold-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        matchingCount === 0
                          ? "bg-minsu-green-500"
                          : "bg-minsu-gold-500"
                      }`}
                    />
                    {matchingCount === 0
                      ? "Ready • No Wait"
                      : `Ready • ${matchingCount} Waiting`}
                  </span>
                ) : (
                  <span className="font-medium text-ink-muted">
                    {counter.isPaused ? "Intake paused" : "Offline"}
                  </span>
                )}
                {!permitted && (
                  <span className="shrink-0 text-[11px] font-medium text-ink-muted">
                    {counter.allowedRoles.join("/")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Active Window Workstation + Waiting Queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active Window Control (7 cols) */}
        <section className="apple-shadow rounded-3xl border border-line bg-white p-6 lg:col-span-7">
          {activeCounter ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-minsu-green-700">
                    Active Workstation • {dashboard.campus}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-2xl font-bold text-ink">
                      {activeCounter.name}
                    </h2>
                    {activeOwnership === "OWNED_BY_USER" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-minsu-green-100 px-2.5 py-0.5 text-xs font-bold text-minsu-green-800">
                        <UserCheck className="h-3.5 w-3.5" />
                        Assigned to You ({userEmail})
                      </span>
                    ) : activeOwnership === "OWNED_BY_OTHER" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-minsu-gold-100 px-2.5 py-0.5 text-xs font-bold text-minsu-gold-600">
                        Owner: {activeCounter.assignedStaffName || "Staff"}
                        {activeCounter.assignedStaffEmail
                          ? ` (${activeCounter.assignedStaffEmail})`
                          : ""}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        Unassigned Window
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {userRole === "SYSTEM_ADMIN" && (
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="console-owner-select" className="sr-only">
                        Reassign Window Owner
                      </label>
                      <select
                        id="console-owner-select"
                        value={activeCounter.assignedStaffId ?? ""}
                        disabled={busyAction === "ASSIGN_OWNER"}
                        onChange={(e) =>
                          runCounterPatch(
                            {
                              id: activeCounter.id,
                              assignedStaffId: e.target.value || null,
                            },
                            "ASSIGN_OWNER"
                          )
                        }
                        className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                      >
                        <option value="">Unassigned Owner</option>
                        {dashboard.operators.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.name} ({op.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {canOperateSelected && (
                    <>
                      {activeOwnership === "OWNED_BY_USER" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          isLoading={busyAction === "CLAIM"}
                          onClick={() =>
                            runCounterPatch(
                              {
                                id: activeCounter.id,
                                release: true,
                              },
                              "CLAIM"
                            )
                          }
                          className="rounded-xl"
                        >
                          <UserCheck className="h-4 w-4" />
                          Release Window
                        </Button>
                      ) : activeOwnership === "UNASSIGNED" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          isLoading={busyAction === "CLAIM"}
                          onClick={() =>
                            runCounterPatch(
                              {
                                id: activeCounter.id,
                                claim: true,
                              },
                              "CLAIM"
                            )
                          }
                          className="rounded-xl"
                        >
                          <UserCheck className="h-4 w-4" />
                          Claim Window
                        </Button>
                      ) : (
                        <span
                          title="Window ownership can only be changed by System Admin"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-minsu-gold-400/40 bg-minsu-gold-100/70 px-3 py-1.5 text-xs font-semibold text-minsu-gold-600"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Owned by{" "}
                          {activeCounter.assignedStaffName || "Assigned Staff"}
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={busyAction === "PAUSE"}
                        onClick={() =>
                          runCounterPatch(
                            {
                              id: activeCounter.id,
                              isPaused: !activeCounter.isPaused,
                            },
                            "PAUSE"
                          )
                        }
                        className="rounded-xl"
                      >
                        {activeCounter.isPaused ? (
                          <>
                            <Play className="h-4 w-4" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4" />
                            Pause
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant={activeCounter.isOpen ? "outline" : "primary"}
                        size="sm"
                        isLoading={busyAction === "TOGGLE_OPEN"}
                        onClick={() =>
                          runCounterPatch(
                            {
                              id: activeCounter.id,
                              isOpen: !activeCounter.isOpen,
                            },
                            "TOGGLE_OPEN"
                          )
                        }
                        className="rounded-xl"
                      >
                        <Power className="h-4 w-4" />
                        {activeCounter.isOpen ? "Close" : "Open"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!canOperateSelected && (
                <div className="rounded-2xl border border-minsu-gold-500/40 bg-minsu-gold-100/70 p-4 text-xs text-ink">
                  This window is configured for{" "}
                  <strong>{activeCounter.allowedRoles.join(", ")}</strong>. Select another window above to call tickets.
                </div>
              )}

              {canOperateSelected && isTakeoverWindow && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-minsu-gold-400/50 bg-minsu-gold-100/60 p-3.5 text-xs text-ink">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-minsu-gold-600" />
                  <div>
                    <p className="font-bold text-ink">
                      Designated to {activeCounter.assignedStaffName} (
                      {activeCounter.assignedStaffEmail})
                    </p>
                    <p className="mt-0.5 text-ink-muted">
                      You can inspect this desk or perform an explicit{" "}
                      <strong>Emergency Takeover</strong>; Admin&apos;s window
                      assignment remains intact.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Serving / Idle Ticket Workstation Panel */}
              <AnimatePresence mode="wait">
                {currentTicket ? (
                  <motion.div
                    key={`workstation-${currentTicket.id}-${currentTicket.status}`}
                    initial={
                      prefersReduced ? false : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.18,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className={`space-y-4 rounded-2xl border-2 p-5 ${
                      currentTicket.status === "CALLED"
                        ? "border-minsu-gold-500 bg-gradient-to-br from-minsu-gold-100/70 via-white to-minsu-green-50"
                        : "border-minsu-green-700/30 bg-minsu-green-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              currentTicket.status === "CALLED"
                                ? "bg-minsu-gold-500 text-minsu-green-900"
                                : "bg-minsu-green-700 text-white"
                            }`}
                          >
                            {currentTicket.status === "CALLED"
                              ? "CALLING ON DISPLAY • AWAITING CLIENT"
                              : "CURRENTLY SERVING"}
                          </span>

                          {currentTicket.servingStartedAt &&
                            currentTicket.status === "SERVING" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                                <Clock className="h-3 w-3 text-minsu-green-700" />
                                Started{" "}
                                {formatShortTimeManila(
                                  currentTicket.servingStartedAt
                                )}
                              </span>
                            )}
                        </div>
                        <div className="mt-2 font-heading text-5xl font-extrabold tracking-tight text-minsu-green-900 tabular-nums">
                          {currentTicket.ticketNumber}
                        </div>
                        <p className="mt-1 font-heading text-base font-bold text-ink">
                          {currentTicket.serviceName}
                        </p>
                      </div>

                      {currentTicket.priority === "PRIORITY" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-gold-500 px-3 py-1 text-xs font-bold text-minsu-green-900">
                          <Accessibility className="h-3.5 w-3.5" />
                          {currentTicket.priorityReason || "Priority Lane"}
                        </span>
                      )}
                    </div>

                    {/* Staff-only visitor details */}
                    <div className="grid grid-cols-1 gap-2 rounded-xl bg-white p-3.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-ink-muted">Visitor Name</p>
                        <p className="font-semibold text-ink">
                          {currentTicket.visitorName || "Walk-in Anonymous"}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Student ID</p>
                        <p className="font-mono font-semibold text-ink">
                          {currentTicket.studentIdNo || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Tracking / Recalls</p>
                        <p className="font-semibold text-ink tabular-nums">
                          {currentTicket.trackingCodeRef || "—"} •{" "}
                          {currentTicket.recallCount} recall(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Handling Staff</p>
                        <p className="truncate font-semibold text-ink">
                          {currentTicket.servedByName ||
                            activeCounter.assignedStaffName ||
                            "Unassigned"}
                        </p>
                        {(currentTicket.servedByEmail ||
                          activeCounter.assignedStaffEmail) && (
                          <p className="truncate font-mono text-[11px] text-ink-muted">
                            {currentTicket.servedByEmail ||
                              activeCounter.assignedStaffEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {canOperateSelected && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <Button
                          type="button"
                          variant="accent"
                          size="md"
                          isLoading={busyAction === "RECALL"}
                          onClick={() =>
                            handleTicketAction(currentTicket.id, "RECALL")
                          }
                          className="apple-press rounded-xl"
                        >
                          <Bell className="h-4 w-4" />
                          Recall / Ding
                        </Button>

                        {currentTicket.status === "CALLED" && (
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            isLoading={busyAction === "START_SERVING"}
                            onClick={() =>
                              handleTicketAction(
                                currentTicket.id,
                                "START_SERVING"
                              )
                            }
                            className="apple-press rounded-xl"
                          >
                            <Play className="h-4 w-4" />
                            Client Arrived (Start Serving)
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          isLoading={busyAction === "COMPLETE"}
                          onClick={() =>
                            handleTicketAction(currentTicket.id, "COMPLETE")
                          }
                          className="apple-press rounded-xl bg-minsu-green-900 hover:bg-minsu-green-800"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Complete Transaction
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={() => {
                            const alt =
                              dashboard.services.find(
                                (s) => s.id !== currentTicket.serviceId
                              )?.id || "";
                            setTransferTargetServiceId(alt);
                            setTransferModalTicket(currentTicket);
                          }}
                          className="apple-press rounded-xl bg-white"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Transfer Lane
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="md"
                          onClick={() => setNoShowConfirmTicket(currentTicket)}
                          className="apple-press rounded-xl"
                        >
                          <UserX className="h-4 w-4" />
                          No-Show
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : !activeCounter.isOpen || activeCounter.isPaused ? (
                  <motion.div
                    key={`workstation-paused-${activeCounter.id}`}
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.16,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-line bg-page/80 px-6 py-10 text-center"
                  >
                    <Pause className="h-8 w-8 text-minsu-gold-600" />
                    <p className="mt-3 font-heading text-lg font-bold text-ink">
                      {!activeCounter.isOpen
                        ? `${activeCounter.name} Is Closed`
                        : `${activeCounter.name} Is Paused`}
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
                      {!activeCounter.isOpen
                        ? "Open this window from the top toolbar to accept walk-in clients."
                        : "Resume this window when ready to call the next waiting client."}
                    </p>
                  </motion.div>
                ) : eligibleWaitingTickets.length === 0 ? (
                  <motion.div
                    key={`workstation-clear-${activeCounter.id}`}
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.16,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="rounded-2xl border border-minsu-green-600/20 bg-gradient-to-br from-minsu-green-50 via-white to-page p-6 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-minsu-green-700 shadow-sm">
                      <MonitorCheck className="h-6 w-6" />
                    </div>

                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-minsu-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-minsu-green-800">
                      <span className="kiosk-ready-dot h-2 w-2 rounded-full bg-minsu-green-500" />
                      Window Open & Ready • Queue Clear
                    </span>

                    <h3 className="mt-2.5 font-heading text-lg font-bold text-ink">
                      No Clients Waiting for {activeCounter.name}
                    </h3>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
                      Listening for lanes{" "}
                      <strong className="text-ink">
                        {activeCounter.serviceCodes.join(", ") || "All"}
                      </strong>
                      . New kiosk tickets matching this window appear live as soon as checked in.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted">
                      <span className="rounded-full border border-line bg-white px-3 py-1 font-medium tabular-nums">
                        {dashboard.metrics.completedTodayCount} completed today
                      </span>
                      {dashboard.waitingTickets.length > 0 && (
                        <span className="rounded-full bg-minsu-gold-100 px-3 py-1 font-semibold text-minsu-gold-600 tabular-nums">
                          {dashboard.waitingTickets.length} waiting in other
                          lanes
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`workstation-ready-${activeCounter.id}-${nextFairPick?.id ?? "none"}`}
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.16,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="space-y-4 rounded-2xl border border-minsu-green-600/25 bg-minsu-green-50/75 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-minsu-green-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                        <Sparkles className="h-3.5 w-3.5 text-minsu-gold-400" />
                        Recommended Next Fair Pick
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                        {fairnessRuleLabel} • {eligibleWaitingTickets.length}{" "}
                        Matching
                      </span>
                    </div>

                    {nextFairPick &&
                      (() => {
                        const pickAssignees =
                          serviceAssignmentsByCode.get(nextFairPick.serviceCode) ??
                          [];
                        const pickStatus = getServiceAssignmentStatus(
                          pickAssignees,
                          userId,
                          userEmail
                        );
                        const pickLabel =
                          pickStatus === "ASSIGNED_TO_USER"
                            ? "Routed to You"
                            : pickStatus === "ASSIGNED_TO_OTHER"
                            ? `Assigned: ${pickAssignees
                                .map((a) => `${a.name} (${a.email})`)
                                .join(", ")}`
                            : "Open Lane";

                        return (
                          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-heading text-3xl font-extrabold tracking-tight text-minsu-green-900 tabular-nums sm:text-4xl">
                                  {nextFairPick.ticketNumber}
                                </span>
                                {nextFairPick.priority === "PRIORITY" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-minsu-gold-100 px-2.5 py-0.5 text-xs font-bold text-minsu-gold-600">
                                    <Accessibility className="h-3.5 w-3.5" />
                                    {nextFairPick.priorityReason || "Priority"}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                                    Regular Lane
                                  </span>
                                )}
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    pickStatus === "ASSIGNED_TO_USER"
                                      ? "bg-minsu-green-100 text-minsu-green-800"
                                      : pickStatus === "ASSIGNED_TO_OTHER"
                                      ? "bg-minsu-gold-100 text-minsu-gold-600"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {pickLabel}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-ink">
                                {nextFairPick.serviceName}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {nextFairPick.visitorName ||
                                  "Walk-in Anonymous"}{" "}
                                • Arrived{" "}
                                {formatShortTimeManila(nextFairPick.createdAt)}
                              </p>
                            </div>

                            {canOperateSelected && (
                              <Button
                                type="button"
                                variant={
                                  nextFairPickRequiresTakeover
                                    ? "accent"
                                    : "primary"
                                }
                                size="lg"
                                isLoading={busyAction === "CALL_NEXT"}
                                onClick={() => {
                                  if (!nextFairPickRequiresTakeover) {
                                    void handleCallNext(false);
                                    return;
                                  }
                                  setTakeoverConfirm({
                                    title: `Take Over & Call ${nextFairPick.ticketNumber}?`,
                                    description: `${
                                      isTakeoverWindow
                                        ? `${activeCounter.name} is owned by ${activeCounter.assignedStaffName} (${activeCounter.assignedStaffEmail}).`
                                        : `Service lane ${nextFairPick.serviceCode} is designated to another operator.`
                                    } Proceeding records an Emergency Takeover under ${userName} (${userEmail}).`,
                                    confirmLabel: `Take Over & Call ${nextFairPick.ticketNumber}`,
                                    onConfirm: async () => {
                                      setTakeoverConfirm(null);
                                      await handleCallNext(true);
                                    },
                                  });
                                }}
                                className="apple-press w-full rounded-2xl px-7 py-4 font-heading text-base font-bold sm:w-auto"
                              >
                                {nextFairPickRequiresTakeover ? (
                                  <ShieldAlert className="h-5 w-5" />
                                ) : (
                                  <PhoneCall className="h-5 w-5 text-minsu-gold-400" />
                                )}
                                {nextFairPickRequiresTakeover
                                  ? `Take Over & Call ${nextFairPick.ticketNumber}`
                                  : `Accept & Call ${nextFairPick.ticketNumber}`}
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Counter footer with End-of-Day cut-off */}
              {canResetDailyQueue(userRole) && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-ink-muted">
                  <span>
                    Queue Date:{" "}
                    <strong className="text-ink">{dashboard.queueDate}</strong>{" "}
                    (Asia/Manila)
                  </span>
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    End-of-Day Queue Cut-Off
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              No counters configured for this campus. Ask a System Administrator to add one.
            </p>
          )}
        </section>

        {/* Right: Waiting Queue Table (5 cols) */}
        <section className="apple-shadow flex flex-col justify-between rounded-3xl border border-line bg-white p-6 lg:col-span-5">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-line pb-3.5">
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">
                  Waiting Clients
                </h2>
                <p className="text-xs text-ink-muted">
                  Live walk-in queue in {dashboard.campus}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 font-heading text-xs font-bold tabular-nums ${
                  dashboard.waitingTickets.length === 0
                    ? "bg-minsu-green-100 text-minsu-green-800"
                    : "bg-minsu-gold-100 text-minsu-gold-600"
                }`}
              >
                {dashboard.waitingTickets.length} Total
              </span>
            </div>

            {dashboard.waitingTickets.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-xl border border-line bg-page p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setWaitingFilter("ALL")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      waitingFilter === "ALL"
                        ? "bg-white text-minsu-green-800 shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    All ({dashboard.waitingTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaitingFilter("MINE")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      waitingFilter === "MINE"
                        ? "bg-white text-minsu-green-800 shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    My &amp; Open ({myOrOpenWaitingCount})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {dashboard.metrics.byService
                    .filter((svc) => svc.waiting > 0)
                    .map((svc) => {
                      const tokens = getServiceVisualTokens(
                        serviceColorByCode.get(svc.code) || "green"
                      );
                      return (
                        <span
                          key={svc.code}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${tokens.badgeBg} ${tokens.badgeText}`}
                        >
                          <span className="font-mono">{svc.code}</span>
                          <span>•</span>
                          <span>{svc.waiting} waiting</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {dashboard.waitingTickets.length === 0 ? (
              <div className="rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50/75 px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-minsu-green-700 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="mt-3 font-heading text-sm font-bold text-ink">
                  All Waiting Clients Assisted
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  The lobby queue is empty. Walk-in check-ins from{" "}
                  <span className="font-mono font-semibold text-ink">/kiosk</span>{" "}
                  sync here instantly.
                </p>
                <p className="mt-3 text-[11px] font-semibold text-minsu-green-800 tabular-nums">
                  {dashboard.metrics.completedTodayCount} completed today • ~
                  {dashboard.metrics.avgWaitMinutes}m avg. wait
                </p>
              </div>
            ) : filteredWaitingTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-page/60 px-5 py-8 text-center text-xs text-ink-muted">
                No waiting tickets currently routed to your lanes. Switch to{" "}
                <button
                  type="button"
                  onClick={() => setWaitingFilter("ALL")}
                  className="font-bold text-minsu-green-700 hover:underline"
                >
                  All ({dashboard.waitingTickets.length})
                </button>{" "}
                to inspect peer queues or assist with an emergency takeover.
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                <AnimatePresence initial={false}>
                  {filteredWaitingTickets.slice(0, 12).map((wt) => {
                    const matchesCounter =
                      !activeCounter ||
                      activeCounter.serviceCodes.length === 0 ||
                      activeCounter.serviceCodes.includes(wt.serviceCode);
                    const isRecommended = nextFairPick?.id === wt.id;
                    const svcMeta = serviceByCode.get(wt.serviceCode);
                    const assignees = svcMeta?.assignedStaff ?? [];
                    const laneStatus = getServiceAssignmentStatus(
                      assignees,
                      userId,
                      userEmail
                    );
                    const requiresTakeover =
                      (laneStatus === "ASSIGNED_TO_OTHER" &&
                        userRole !== "SYSTEM_ADMIN") ||
                      isTakeoverWindow;

                    return (
                      <motion.li
                        key={wt.id}
                        initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
                        transition={{
                          duration: 0.16,
                          ease: [0.23, 1, 0.32, 1],
                        }}
                        className={`flex items-center justify-between gap-3 px-2 py-3 ${
                          isRecommended
                            ? "-mx-2 rounded-xl bg-minsu-green-50/80 px-3"
                            : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-heading text-lg font-extrabold text-ink tabular-nums">
                              {wt.ticketNumber}
                            </span>
                            {isRecommended && (
                              <span className="rounded-full bg-minsu-green-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Up Next
                              </span>
                            )}
                            {laneStatus === "ASSIGNED_TO_USER" ? (
                              <span className="rounded-full bg-minsu-green-100 px-2 py-0.5 text-[10px] font-bold text-minsu-green-800">
                                Routed to You
                              </span>
                            ) : laneStatus === "ASSIGNED_TO_OTHER" ? (
                              <span className="max-w-full truncate rounded-full bg-minsu-gold-100 px-2 py-0.5 text-[10px] font-semibold text-minsu-gold-600">
                                Assigned:{" "}
                                {assignees
                                  .map((a) => `${a.name} (${a.email})`)
                                  .join(", ")}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                Open Lane
                              </span>
                            )}
                            {wt.priority === "PRIORITY" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-minsu-gold-100 px-2 py-0.5 text-[11px] font-bold text-minsu-gold-600">
                                <Accessibility className="h-3 w-3" />
                                Priority
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-ink-muted">
                            {wt.serviceName}
                            {wt.visitorName ? ` • ${wt.visitorName}` : ""}
                          </p>
                          <p className="text-[11px] text-ink-muted tabular-nums">
                            Arrived {formatShortTimeManila(wt.createdAt)}
                            {!matchesCounter && " • Other window lane"}
                          </p>
                        </div>

                        {canOperateSelected &&
                          !currentTicket &&
                          matchesCounter && (
                            <Button
                              type="button"
                              variant={
                                requiresTakeover
                                  ? "outline"
                                  : isRecommended
                                  ? "primary"
                                  : "outline"
                              }
                              size="sm"
                              disabled={busyAction !== null}
                              onClick={() => {
                                if (!requiresTakeover) {
                                  void handleTicketAction(
                                    wt.id,
                                    "CALL_SPECIFIC"
                                  );
                                  return;
                                }
                                setTakeoverConfirm({
                                  title: `Take Over & Call ${wt.ticketNumber}?`,
                                  description: `${
                                    isTakeoverWindow
                                      ? `${activeCounter.name} is owned by ${activeCounter.assignedStaffName} (${activeCounter.assignedStaffEmail}).`
                                      : `${wt.ticketNumber} (${wt.serviceName}) is designated to ${assignees
                                          .map((a) => `${a.name} (${a.email})`)
                                          .join(", ")}.`
                                  } Proceeding logs an Emergency Takeover.`,
                                  confirmLabel: "Take Over & Call",
                                  onConfirm: async () => {
                                    setTakeoverConfirm(null);
                                    await handleTicketAction(
                                      wt.id,
                                      "CALL_SPECIFIC",
                                      { takeover: true }
                                    );
                                  },
                                });
                              }}
                              className={`apple-press shrink-0 rounded-xl text-xs ${
                                requiresTakeover
                                  ? "border-minsu-gold-500/60 text-minsu-gold-600 hover:bg-minsu-gold-100/60"
                                  : ""
                              }`}
                            >
                              {requiresTakeover
                                ? "Take Over & Call"
                                : "Accept & Call"}
                            </Button>
                          )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Transfer Service Modal */}
      <Modal
        isOpen={Boolean(transferModalTicket)}
        onClose={() => setTransferModalTicket(null)}
        title={`Transfer ${transferModalTicket?.ticketNumber || ""}`}
        description="Move this client cleanly to another desk lane while keeping their ticket sequence."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="transfer-target-service"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Destination Service Lane
            </label>
            <select
              id="transfer-target-service"
              value={transferTargetServiceId}
              onChange={(e) => setTransferTargetServiceId(e.target.value)}
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            >
              {dashboard.services
                .filter((s) => s.id !== transferModalTicket?.serviceId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    Lane {s.code} — {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferModalTicket(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={busyAction === "TRANSFER"}
              disabled={!transferTargetServiceId}
              onClick={() =>
                transferModalTicket &&
                handleTicketAction(transferModalTicket.id, "TRANSFER", {
                  targetServiceId: transferTargetServiceId,
                })
              }
              className="rounded-xl"
            >
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* No-Show Confirmation Modal */}
      <Modal
        isOpen={Boolean(noShowConfirmTicket)}
        onClose={() => setNoShowConfirmTicket(null)}
        title={`Mark ${noShowConfirmTicket?.ticketNumber || ""} as No-Show?`}
        description="Confirm that the client did not arrive after recalling."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="no-show-note"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Remarks (Optional)
            </label>
            <input
              id="no-show-note"
              type="text"
              value={noShowNote}
              onChange={(e) => setNoShowNote(e.target.value)}
              placeholder="e.g., Recalled 3 times at Window 1"
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoShowConfirmTicket(null)}
              className="rounded-xl"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={busyAction === "NO_SHOW"}
              onClick={() =>
                noShowConfirmTicket &&
                handleTicketAction(noShowConfirmTicket.id, "NO_SHOW", {
                  note: noShowNote || undefined,
                })
              }
              className="rounded-xl"
            >
              Confirm No-Show
            </Button>
          </div>
        </div>
      </Modal>

      {/* End-of-Day Reset Confirmation Modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="End-of-Day Queue Cut-Off"
        description={`This will cancel all remaining waiting/active tickets for ${dashboard.campus} (${dashboard.queueDate}) and clear active counters.`}
        maxWidth="md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetConfirmOpen(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={busyAction === "RESET"}
            onClick={handleResetDay}
            className="rounded-xl"
          >
            Yes, Close Remaining Tickets
          </Button>
        </div>
      </Modal>

      {/* Emergency Takeover Confirmation Modal */}
      <Modal
        isOpen={takeoverConfirm !== null}
        onClose={() => setTakeoverConfirm(null)}
        title={takeoverConfirm?.title || "Confirm Emergency Takeover"}
        description={takeoverConfirm?.description}
        maxWidth="md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setTakeoverConfirm(null)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            isLoading={busyAction !== null}
            onClick={() => {
              if (takeoverConfirm) {
                void takeoverConfirm.onConfirm();
              }
            }}
            className="rounded-xl"
          >
            <ShieldAlert className="h-4 w-4" />
            {takeoverConfirm?.confirmLabel || "Confirm Takeover"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

