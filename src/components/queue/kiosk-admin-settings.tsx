"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Save,
  Shield,
  Sliders,
  Monitor,
  Layers,
  Users,
  UserCheck,
  Search,
} from "lucide-react";
import type { Role } from "@/types";
import type {
  KioskDisplayMode,
  QueueConfigPublicDTO,
  QueueCounterDTO,
  QueueOperatorDTO,
  QueueServiceDTO,
} from "@/types/queue";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MINSU_CAMPUSES } from "@/lib/campus-constants";
import { broadcastQueueSync } from "@/hooks/use-queue-stream";
import { matchesOperatorIdentity } from "@/lib/queue-fairness";

interface KioskAdminSettingsProps {
  config: QueueConfigPublicDTO;
  services: QueueServiceDTO[];
  counters: QueueCounterDTO[];
  operators: QueueOperatorDTO[];
  activeCampus: string;
  onRefresh: () => Promise<void>;
}

interface ServiceModalState {
  id: string | null;
  code: string;
  name: string;
  description: string;
  icon: string;
  colorToken: string;
  estimatedMinutes: number;
  sortOrder: number;
  isActive: boolean;
  handledByRoles: Role[];
  assignedStaffIds: string[];
}

interface CounterModalState {
  id: string | null;
  name: string;
  campus: string;
  serviceCodes: string[];
  allowedRoles: Role[];
  assignedStaffId: string | null;
  sortOrder: number;
  isOpen: boolean;
}

const SERVICE_ROLES: Role[] = ["STAFF", "ACCOUNTING", "DIRECTOR"];

const SERVICE_ICONS = [
  { value: "file-text", label: "Document / Form" },
  { value: "wallet", label: "Cash / Payroll" },
  { value: "shield-check", label: "Verification / ID" },
  { value: "help-circle", label: "Inquiry / Help" },
  { value: "clipboard-check", label: "Checklist / Assessment" },
  { value: "graduation-cap", label: "Scholarship / Grant" },
] as const;

const SERVICE_COLORS = [
  { value: "green", label: "MinSU Green" },
  { value: "gold", label: "MinSU Gold" },
  { value: "emerald", label: "Emerald Teal" },
  { value: "slate", label: "Neutral Slate" },
] as const;

function toggleSelection<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function KioskAdminSettings({
  config,
  services,
  counters,
  operators,
  activeCampus,
  onRefresh,
}: KioskAdminSettingsProps) {
  const [form, setForm] = useState({
    kioskMode: config.kioskMode as KioskDisplayMode,
    defaultCampus: config.defaultCampus,
    allowCampusSwitch: config.allowCampusSwitch,
    showHomepageKioskButton: config.showHomepageKioskButton,
    showPrivacyMaskedNames: config.showPrivacyMaskedNames,
    enableThermalPrint: config.enableThermalPrint,
    autoPrintTicket: config.autoPrintTicket,
    enableSoundChime: config.enableSoundChime,
    enableVoiceTts: config.enableVoiceTts,
    priorityRatio: config.priorityRatio,
    idleResetSeconds: config.idleResetSeconds,
    attractModeSeconds: config.attractModeSeconds,
    rateLimitBypassEnabled: config.rateLimitBypassEnabled,
  });

  const [newPin, setNewPin] = useState("");
  const [clearPinConfirmOpen, setClearPinConfirmOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add / Edit Service Modal
  const [serviceModal, setServiceModal] = useState<ServiceModalState | null>(
    null
  );
  const [serviceStaffFilter, setServiceStaffFilter] = useState("");
  const [savingService, setSavingService] = useState(false);

  // Add / Edit Counter Modal
  const [counterModal, setCounterModal] = useState<CounterModalState | null>(
    null
  );
  const [customLaneInput, setCustomLaneInput] = useState("");
  const [savingCounter, setSavingCounter] = useState(false);
  const [quickAssigningCounterId, setQuickAssigningCounterId] = useState<
    string | null
  >(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedback(null);

    try {
      const payload: Record<string, unknown> = { ...form };
      if (newPin.trim()) {
        payload.kioskPin = newPin.trim();
      }

      const res = await fetch("/api/queue/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Save failed." });
        return;
      }
      setNewPin("");
      setFeedback({
        type: "success",
        message: "Kiosk settings saved and broadcast to active terminals.",
      });
      broadcastQueueSync(form.defaultCampus);
      await onRefresh();
    } catch {
      setFeedback({ type: "error", message: "Network error saving configuration." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClearPin = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/queue/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearPin: true }),
      });
      if (res.ok) {
        setClearPinConfirmOpen(false);
        setFeedback({ type: "success", message: "Kiosk Admin PIN cleared." });
        await onRefresh();
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const openAddService = () => {
    setModalError(null);
    setServiceStaffFilter("");
    setServiceModal({
      id: null,
      code: "",
      name: "",
      description: "",
      icon: "file-text",
      colorToken: "green",
      estimatedMinutes: 5,
      sortOrder: services.length + 1,
      isActive: true,
      handledByRoles: ["STAFF"],
      assignedStaffIds: [],
    });
  };

  const openEditService = (svc: QueueServiceDTO) => {
    setModalError(null);
    setServiceStaffFilter("");
    setServiceModal({
      id: svc.id,
      code: svc.code,
      name: svc.name,
      description: svc.description ?? "",
      icon: svc.icon,
      colorToken: svc.colorToken,
      estimatedMinutes: svc.estimatedMinutes,
      sortOrder: svc.sortOrder,
      isActive: svc.isActive,
      handledByRoles: [...svc.handledByRoles],
      assignedStaffIds: (svc.assignedStaff ?? []).map((op) => op.id),
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModal) return;

    if (serviceModal.handledByRoles.length === 0) {
      setModalError("Select at least one staff role that can handle this lane.");
      return;
    }

    setModalError(null);
    setFeedback(null);
    setSavingService(true);

    try {
      const isEdit = serviceModal.id !== null;
      const res = await fetch("/api/queue/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                id: serviceModal.id,
                name: serviceModal.name.trim(),
                description: serviceModal.description.trim() || null,
                icon: serviceModal.icon,
                colorToken: serviceModal.colorToken,
                estimatedMinutes: serviceModal.estimatedMinutes,
                sortOrder: serviceModal.sortOrder,
                isActive: serviceModal.isActive,
                handledByRoles: serviceModal.handledByRoles,
                assignedStaffIds: serviceModal.assignedStaffIds,
              }
            : {
                code: serviceModal.code.trim().toUpperCase(),
                name: serviceModal.name.trim(),
                description: serviceModal.description.trim() || null,
                icon: serviceModal.icon,
                colorToken: serviceModal.colorToken,
                estimatedMinutes: serviceModal.estimatedMinutes,
                sortOrder: serviceModal.sortOrder,
                handledByRoles: serviceModal.handledByRoles,
                assignedStaffIds: serviceModal.assignedStaffIds,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to save service.");
        return;
      }

      setServiceModal(null);
      setFeedback({
        type: "success",
        message: isEdit
          ? `Updated service lane "${serviceModal.name.trim()}".`
          : `Added service lane "${serviceModal.name.trim()}".`,
      });
      broadcastQueueSync(activeCampus);
      await onRefresh();
    } catch {
      setModalError("Network error while saving service.");
    } finally {
      setSavingService(false);
    }
  };

  const handleToggleServiceActive = async (svc: QueueServiceDTO) => {
    const res = await fetch("/api/queue/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, isActive: !svc.isActive }),
    });
    if (res.ok) {
      broadcastQueueSync(activeCampus);
      await onRefresh();
    }
  };

  const openAddCounter = () => {
    setModalError(null);
    setCustomLaneInput("");
    const defaultCodes = services
      .filter((s) => s.isActive)
      .slice(0, 2)
      .map((s) => s.code);
    setCounterModal({
      id: null,
      name: "",
      campus: activeCampus,
      serviceCodes: defaultCodes.length > 0 ? defaultCodes : ["A"],
      allowedRoles: ["STAFF"],
      assignedStaffId: null,
      sortOrder: counters.length + 1,
      isOpen: true,
    });
  };

  const openEditCounter = (ctr: QueueCounterDTO) => {
    setModalError(null);
    setCustomLaneInput("");
    setCounterModal({
      id: ctr.id,
      name: ctr.name,
      campus: ctr.campus,
      serviceCodes: [...ctr.serviceCodes],
      allowedRoles: [...ctr.allowedRoles],
      assignedStaffId: ctr.assignedStaffId ?? null,
      sortOrder: ctr.sortOrder,
      isOpen: ctr.isOpen,
    });
  };

  const handleQuickAssignCounter = async (
    ctr: QueueCounterDTO,
    nextStaffId: string
  ) => {
    setQuickAssigningCounterId(ctr.id);
    setFeedback(null);
    try {
      const assignedStaffId = nextStaffId ? nextStaffId : null;
      const res = await fetch("/api/queue/counters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ctr.id,
          assignedStaffId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || `Failed to update owner for ${ctr.name}.`,
        });
        return;
      }

      const assignedOp = operators.find((op) => op.id === assignedStaffId);
      setFeedback({
        type: "success",
        message: assignedOp
          ? `Designated ${assignedOp.name} (${assignedOp.email}) to ${ctr.name}.`
          : `Cleared designated staff for ${ctr.name}.`,
      });
      broadcastQueueSync(ctr.campus);
      await onRefresh();
    } catch {
      setFeedback({
        type: "error",
        message: "Network error assigning staff to window.",
      });
    } finally {
      setQuickAssigningCounterId(null);
    }
  };

  const handleAddCustomLane = () => {
    if (!counterModal) return;
    const code = customLaneInput.trim().toUpperCase();
    if (!code) return;
    if (!counterModal.serviceCodes.includes(code)) {
      setCounterModal({
        ...counterModal,
        serviceCodes: [...counterModal.serviceCodes, code],
      });
    }
    setCustomLaneInput("");
  };

  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModal) return;

    if (counterModal.serviceCodes.length === 0) {
      setModalError("Select or add at least one service lane code.");
      return;
    }
    if (counterModal.allowedRoles.length === 0) {
      setModalError("Select at least one allowed operator role.");
      return;
    }

    setModalError(null);
    setFeedback(null);
    setSavingCounter(true);

    try {
      const isEdit = counterModal.id !== null;
      const res = await fetch("/api/queue/counters", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                id: counterModal.id,
                name: counterModal.name.trim(),
                serviceCodes: counterModal.serviceCodes,
                allowedRoles: counterModal.allowedRoles,
                assignedStaffId: counterModal.assignedStaffId,
                sortOrder: counterModal.sortOrder,
                isOpen: counterModal.isOpen,
              }
            : {
                name: counterModal.name.trim(),
                campus: counterModal.campus,
                serviceCodes: counterModal.serviceCodes,
                allowedRoles: counterModal.allowedRoles,
                assignedStaffId: counterModal.assignedStaffId,
                sortOrder: counterModal.sortOrder,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to save window.");
        return;
      }

      setCounterModal(null);
      setFeedback({
        type: "success",
        message: isEdit
          ? `Updated "${counterModal.name.trim()}".`
          : `Added "${counterModal.name.trim()}" to ${counterModal.campus}.`,
      });
      broadcastQueueSync(activeCampus);
      await onRefresh();
    } catch {
      setModalError("Network error while saving window.");
    } finally {
      setSavingCounter(false);
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

      {/* Global Kiosk Settings Form */}
      <form
        onSubmit={handleSaveConfig}
        className="apple-shadow space-y-6 rounded-3xl border border-line bg-white p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-minsu-green-100 text-minsu-green-700">
              <Sliders className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">
                Kiosk Display, Fairness & Hardware Controls
              </h2>
              <p className="text-xs text-ink-muted">
                Changes sync instantly to unattended kiosks and lobby TVs.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={savingConfig}
            className="rounded-xl"
          >
            <Save className="h-4 w-4" />
            Save & Broadcast Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="cfg-kiosk-mode"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              Default Kiosk Layout Mode
            </label>
            <select
              id="cfg-kiosk-mode"
              value={form.kioskMode}
              onChange={(e) =>
                setForm({ ...form, kioskMode: e.target.value as KioskDisplayMode })
              }
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            >
              <option value="UNIFIED">Unified (Check-In + Now Serving)</option>
              <option value="CHECK_IN_ONLY">Touch Check-In Only</option>
              <option value="DISPLAY_ONLY">TV Overhead Display Only</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="cfg-default-campus"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              Default Kiosk Campus
            </label>
            <select
              id="cfg-default-campus"
              value={form.defaultCampus}
              onChange={(e) => setForm({ ...form, defaultCampus: e.target.value })}
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            >
              {MINSU_CAMPUSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cfg-priority-ratio"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              Priority Interleaving Policy
            </label>
            <select
              id="cfg-priority-ratio"
              value={form.priorityRatio}
              onChange={(e) =>
                setForm({ ...form, priorityRatio: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            >
              <option value={2}>Balanced 2:1 (2 Priority, then 1 Regular)</option>
              <option value={1}>Gentle 1:1 (1 Priority, then 1 Regular)</option>
              <option value={3}>3:1 (3 Priority, then 1 Regular)</option>
              <option value={0}>Strict Priority First</option>
              <option value={-1}>Pure FIFO (Arrival Order)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="cfg-idle-reset"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              Ticket Screen Reset (8–120s)
            </label>
            <input
              id="cfg-idle-reset"
              type="number"
              min={8}
              max={120}
              value={form.idleResetSeconds}
              onChange={(e) =>
                setForm({
                  ...form,
                  idleResetSeconds: Number(e.target.value) || 20,
                })
              }
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-attract-sec"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              Attract Screensaver Timeout (15–300s)
            </label>
            <input
              id="cfg-attract-sec"
              type="number"
              min={15}
              max={300}
              value={form.attractModeSeconds}
              onChange={(e) =>
                setForm({
                  ...form,
                  attractModeSeconds: Number(e.target.value) || 60,
                })
              }
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-kiosk-pin"
              className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              <span>Kiosk Terminal PIN (4–6 digits)</span>
              {config.hasPinConfigured && (
                <button
                  type="button"
                  onClick={() => setClearPinConfirmOpen(true)}
                  className="text-[11px] font-semibold text-red-700 underline"
                >
                  Clear PIN
                </button>
              )}
            </label>
            <input
              id="cfg-kiosk-pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder={
                config.hasPinConfigured
                  ? "PIN set — enter new to replace"
                  : "Enter 4–6 digits to lock"
              }
              className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
            />
          </div>
        </div>

        {/* Boolean Toggles */}
        <div className="grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              key: "showHomepageKioskButton",
              label: "Show Homepage Kiosk Button",
            },
            {
              key: "allowCampusSwitch",
              label: "Allow Campus Switch on Kiosk",
            },
            {
              key: "showPrivacyMaskedNames",
              label: "Show Masked Names (J*** D***)",
            },
            {
              key: "enableThermalPrint",
              label: "Enable 80mm Slip Print",
            },
            {
              key: "autoPrintTicket",
              label: "Auto-Print Ticket on Issue",
            },
            {
              key: "enableSoundChime",
              label: "Enable Two-Tone Chime",
            },
            {
              key: "enableVoiceTts",
              label: "Enable Voice Announcer (TTS)",
            },
            {
              key: "rateLimitBypassEnabled",
              label: "Lobby Rate-Limit Bypass (180/hr)",
            },
          ].map((toggle) => {
            const checked = Boolean(
              form[toggle.key as keyof typeof form]
            );
            return (
              <label
                key={toggle.key}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-line bg-page/70 px-3.5 py-3 text-xs font-semibold text-ink"
              >
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [toggle.key]: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-line text-minsu-green-700 focus:ring-minsu-green-700"
                />
              </label>
            );
          })}
        </div>
      </form>

      {/* Staff Designation Matrix (Staff + Email) */}
      <section className="apple-shadow rounded-3xl border border-line bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-minsu-green-700" />
            <div>
              <h3 className="font-heading text-base font-bold text-ink">
                Staff Designation Matrix (Staff Name &amp; Email)
              </h3>
              <p className="text-xs text-ink-muted">
                Overview of designated windows in {activeCampus} and locked
                service lanes per operator account.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-minsu-green-50 px-3 py-1 text-xs font-semibold text-minsu-green-800 border border-minsu-green-600/20">
            {operators.length} Active Operators
          </span>
        </div>

        {operators.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-page/60 px-4 py-6 text-center text-xs text-ink-muted">
            No active STAFF, ACCOUNTING, or DIRECTOR accounts found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="py-2 pr-3 font-bold">Operator (Name • Email)</th>
                  <th className="py-2 pr-3 font-bold">Role</th>
                  <th className="py-2 pr-3 font-bold">
                    Assigned Windows ({activeCampus})
                  </th>
                  <th className="py-2 font-bold">Assigned Service Lanes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {operators.map((op) => {
                  const opCounters = counters.filter((ctr) =>
                    matchesOperatorIdentity(
                      {
                        id: ctr.assignedStaffId,
                        email: ctr.assignedStaffEmail,
                      },
                      op.id,
                      op.email
                    )
                  );
                  const opServices = services.filter((svc) =>
                    (svc.assignedStaff ?? []).some((staff) =>
                      matchesOperatorIdentity(staff, op.id, op.email)
                    )
                  );

                  return (
                    <tr key={op.id} className="align-top">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-ink">{op.name}</p>
                        <p className="font-mono text-[11px] text-ink-muted">
                          {op.email}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          {op.role}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        {opCounters.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {opCounters.map((ctr) => (
                              <span
                                key={ctr.id}
                                className="inline-flex items-center gap-1 rounded-full bg-minsu-green-100 px-2.5 py-0.5 font-semibold text-minsu-green-800"
                              >
                                <UserCheck className="h-3 w-3" />
                                {ctr.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-muted">
                            No fixed window
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {opServices.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {opServices.map((svc) => (
                              <span
                                key={svc.id}
                                className="inline-flex items-center gap-1 rounded-full border border-minsu-gold-400/40 bg-minsu-gold-100 px-2.5 py-0.5 font-semibold text-minsu-gold-600"
                              >
                                <span className="font-mono">{svc.code}</span>
                                <span>• {svc.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-muted">
                            Open role lanes only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Services & Counters Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Service Categories */}
        <section className="apple-shadow rounded-3xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-minsu-green-700" />
              <h3 className="font-heading text-base font-bold text-ink">
                Service Categories
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openAddService}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>

          <ul className="divide-y divide-line/60">
            {services.map((svc) => (
              <li
                key={svc.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm sm:flex-nowrap"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    <span className="mr-2 rounded bg-minsu-green-100 px-2 py-0.5 font-mono text-xs font-bold text-minsu-green-800">
                      {svc.code}
                    </span>
                    <span>{svc.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    #{svc.sortOrder} • ~{svc.estimatedMinutes}m est. • Handled by{" "}
                    {svc.handledByRoles.join(", ")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {svc.assignedStaff && svc.assignedStaff.length > 0 ? (
                      svc.assignedStaff.map((staff) => (
                        <span
                          key={staff.id}
                          className="inline-flex items-center gap-1 rounded-full border border-minsu-green-600/20 bg-minsu-green-50 px-2 py-0.5 text-[11px] font-medium text-minsu-green-800"
                        >
                          <UserCheck className="h-3 w-3 shrink-0" />
                          <span>
                            {staff.name} • {staff.email}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-ink-muted">
                        Open to any eligible role (no staff lock)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditService(svc)}
                    className="rounded-xl text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={svc.isActive ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleServiceActive(svc)}
                    className="rounded-xl text-xs"
                  >
                    {svc.isActive ? "Active" : "Disabled"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Campus Windows / Counters */}
        <section className="apple-shadow rounded-3xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-minsu-green-700" />
              <h3 className="font-heading text-base font-bold text-ink">
                Windows in {activeCampus}
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openAddCounter}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Add Window
            </Button>
          </div>

          <ul className="divide-y divide-line/60">
            {counters.map((ctr) => (
              <li
                key={ctr.id}
                className="flex flex-col gap-2.5 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{ctr.name}</p>
                      {ctr.assignedStaffId && ctr.assignedStaffName ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-minsu-green-600/20 bg-minsu-green-100 px-2 py-0.5 text-[11px] font-semibold text-minsu-green-800">
                          <UserCheck className="h-3 w-3 shrink-0" />
                          <span>
                            {ctr.assignedStaffName}
                            {ctr.assignedStaffEmail
                              ? ` • ${ctr.assignedStaffEmail}`
                              : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      #{ctr.sortOrder} • Lanes: {ctr.serviceCodes.join(", ")} •{" "}
                      Roles: {ctr.allowedRoles.join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        ctr.isOpen
                          ? ctr.isPaused
                            ? "bg-minsu-gold-100 text-minsu-gold-600"
                            : "bg-minsu-green-100 text-minsu-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ctr.isOpen
                        ? ctr.isPaused
                          ? "Paused"
                          : "Open"
                        : "Closed"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCounter(ctr)}
                      className="rounded-xl text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-page/70 px-3 py-2">
                  <label
                    htmlFor={`quick-owner-${ctr.id}`}
                    className="text-[11px] font-bold text-ink-muted"
                  >
                    Quick Window Owner:
                  </label>
                  <select
                    id={`quick-owner-${ctr.id}`}
                    value={ctr.assignedStaffId ?? ""}
                    disabled={quickAssigningCounterId === ctr.id}
                    onChange={(e) =>
                      handleQuickAssignCounter(ctr, e.target.value)
                    }
                    className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700 disabled:opacity-60"
                  >
                    <option value="">Unassigned (Any eligible role)</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} — {op.email} ({op.role})
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={serviceModal !== null}
        onClose={() => {
          setServiceModal(null);
          setModalError(null);
        }}
        title={
          serviceModal?.id
            ? `Edit Service Lane (${serviceModal.code})`
            : "Add Walk-In Queue Service"
        }
        maxWidth="lg"
      >
        {serviceModal && (
          <form onSubmit={handleSaveService} className="space-y-4">
            {modalError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="svc-modal-code"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Prefix Code
                </label>
                <input
                  id="svc-modal-code"
                  required
                  disabled={serviceModal.id !== null}
                  maxLength={3}
                  value={serviceModal.code}
                  onChange={(e) =>
                    setServiceModal({
                      ...serviceModal,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="R"
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 font-mono text-sm uppercase text-ink disabled:opacity-60"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="svc-modal-name"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Service Title
                </label>
                <input
                  id="svc-modal-name"
                  required
                  value={serviceModal.name}
                  onChange={(e) =>
                    setServiceModal({ ...serviceModal, name: e.target.value })
                  }
                  placeholder="Records & Clearance"
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="svc-modal-desc"
                className="mb-1 block text-xs font-bold text-ink-muted"
              >
                Description
              </label>
              <input
                id="svc-modal-desc"
                value={serviceModal.description}
                onChange={(e) =>
                  setServiceModal({
                    ...serviceModal,
                    description: e.target.value,
                  })
                }
                placeholder="Brief instructions shown on the kiosk tile"
                className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="svc-modal-icon"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Kiosk Icon
                </label>
                <select
                  id="svc-modal-icon"
                  value={serviceModal.icon}
                  onChange={(e) =>
                    setServiceModal({ ...serviceModal, icon: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                >
                  {SERVICE_ICONS.map((ico) => (
                    <option key={ico.value} value={ico.value}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="svc-modal-color"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Tile Color Theme
                </label>
                <select
                  id="svc-modal-color"
                  value={serviceModal.colorToken}
                  onChange={(e) =>
                    setServiceModal({
                      ...serviceModal,
                      colorToken: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                >
                  {SERVICE_COLORS.map((col) => (
                    <option key={col.value} value={col.value}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="svc-modal-minutes"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Est. Service Time (mins)
                </label>
                <input
                  id="svc-modal-minutes"
                  type="number"
                  min={1}
                  max={120}
                  value={serviceModal.estimatedMinutes}
                  onChange={(e) =>
                    setServiceModal({
                      ...serviceModal,
                      estimatedMinutes: Math.max(
                        1,
                        Number(e.target.value) || 5
                      ),
                    })
                  }
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>
              <div>
                <label
                  htmlFor="svc-modal-sort"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Display Order
                </label>
                <input
                  id="svc-modal-sort"
                  type="number"
                  min={1}
                  max={999}
                  value={serviceModal.sortOrder}
                  onChange={(e) =>
                    setServiceModal({
                      ...serviceModal,
                      sortOrder: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-muted">
                Handled By Roles
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_ROLES.map((r) => {
                  const active = serviceModal.handledByRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setServiceModal({
                          ...serviceModal,
                          handledByRoles: toggleSelection(
                            serviceModal.handledByRoles,
                            r
                          ),
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? "border-minsu-green-700 bg-minsu-green-700 text-white"
                          : "border-line bg-page text-ink"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-page/50 p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="service-staff-filter"
                  className="text-xs font-bold text-ink"
                >
                  Designated Staff Operators (Name + Email)
                </label>
                {serviceModal.assignedStaffIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setServiceModal({
                        ...serviceModal,
                        assignedStaffIds: [],
                      })
                    }
                    className="text-[11px] font-semibold text-red-700 hover:underline"
                  >
                    Clear Staff Lock ({serviceModal.assignedStaffIds.length})
                  </button>
                )}
              </div>

              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  id="service-staff-filter"
                  type="text"
                  value={serviceStaffFilter}
                  onChange={(e) => setServiceStaffFilter(e.target.value)}
                  placeholder="Search by staff name or email..."
                  className="w-full rounded-xl border border-line bg-white py-1.5 pl-8 pr-3 text-xs text-ink outline-none transition focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>

              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {operators
                  .filter((op) => {
                    const q = serviceStaffFilter.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      op.name.toLowerCase().includes(q) ||
                      op.email.toLowerCase().includes(q) ||
                      op.role.toLowerCase().includes(q)
                    );
                  })
                  .map((op) => {
                    const selected = serviceModal.assignedStaffIds.includes(
                      op.id
                    );
                    const roleAllowed = serviceModal.handledByRoles.includes(
                      op.role
                    );
                    return (
                      <label
                        key={op.id}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                          selected
                            ? "border-minsu-green-700 bg-minsu-green-50"
                            : "border-line bg-white hover:bg-page"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setServiceModal({
                                ...serviceModal,
                                assignedStaffIds: toggleSelection(
                                  serviceModal.assignedStaffIds,
                                  op.id
                                ),
                              })
                            }
                            className="h-4 w-4 rounded border-line text-minsu-green-700 focus:ring-minsu-green-700"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">
                              {op.name}
                            </span>
                            <span className="block truncate font-mono text-[11px] text-ink-muted">
                              {op.email}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            roleAllowed
                              ? "bg-minsu-green-100 text-minsu-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {op.role}
                        </span>
                      </label>
                    );
                  })}
              </div>
              <p className="mt-2 text-[11px] text-ink-muted">
                Leave empty so any eligible role can call tickets from this lane,
                or designate specific staff to prioritize their Queue Console.
              </p>
            </div>

            {serviceModal.id !== null && (
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-page/70 px-3.5 py-2.5 text-xs font-semibold text-ink">
                <span>Show service tile on active check-in kiosks</span>
                <input
                  type="checkbox"
                  checked={serviceModal.isActive}
                  onChange={(e) =>
                    setServiceModal({
                      ...serviceModal,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-line text-minsu-green-700 focus:ring-minsu-green-700"
                />
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setServiceModal(null);
                  setModalError(null);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={savingService}
                className="rounded-xl"
              >
                {serviceModal.id ? "Save Changes" : "Create Service"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add / Edit Counter Modal */}
      <Modal
        isOpen={counterModal !== null}
        onClose={() => {
          setCounterModal(null);
          setModalError(null);
        }}
        title={
          counterModal?.id
            ? `Edit Window — ${counterModal.name}`
            : `Add Counter / Window (${activeCampus})`
        }
        maxWidth="lg"
      >
        {counterModal && (
          <form onSubmit={handleSaveCounter} className="space-y-4">
            {modalError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="ctr-modal-name"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Window Name
                </label>
                <input
                  id="ctr-modal-name"
                  required
                  value={counterModal.name}
                  onChange={(e) =>
                    setCounterModal({ ...counterModal, name: e.target.value })
                  }
                  placeholder="Window 4"
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>
              <div>
                <label
                  htmlFor="ctr-modal-sort"
                  className="mb-1 block text-xs font-bold text-ink-muted"
                >
                  Display Order
                </label>
                <input
                  id="ctr-modal-sort"
                  type="number"
                  min={1}
                  max={999}
                  value={counterModal.sortOrder}
                  onChange={(e) =>
                    setCounterModal({
                      ...counterModal,
                      sortOrder: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-muted">
                Assigned Service Lanes
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((svc) => {
                  const selected = counterModal.serviceCodes.includes(svc.code);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() =>
                        setCounterModal({
                          ...counterModal,
                          serviceCodes: selected
                            ? counterModal.serviceCodes.filter(
                                (c) => c !== svc.code
                              )
                            : [...counterModal.serviceCodes, svc.code],
                        })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "border-minsu-green-700 bg-minsu-green-700 text-white"
                          : "border-line bg-page text-ink"
                      }`}
                    >
                      <span className="font-mono font-bold">{svc.code}</span>
                      <span className="max-w-[140px] truncate">{svc.name}</span>
                    </button>
                  );
                })}
                {counterModal.serviceCodes
                  .filter((code) => !services.some((s) => s.code === code))
                  .map((customCode) => (
                    <button
                      key={customCode}
                      type="button"
                      onClick={() =>
                        setCounterModal({
                          ...counterModal,
                          serviceCodes: counterModal.serviceCodes.filter(
                            (c) => c !== customCode
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-minsu-gold-500 bg-minsu-gold-100 px-3 py-1 font-mono text-xs font-bold text-minsu-gold-600"
                    >
                      {customCode} ×
                    </button>
                  ))}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <label htmlFor="ctr-modal-custom-lane" className="sr-only">
                  Add custom lane code
                </label>
                <input
                  id="ctr-modal-custom-lane"
                  maxLength={3}
                  value={customLaneInput}
                  onChange={(e) =>
                    setCustomLaneInput(e.target.value.toUpperCase())
                  }
                  placeholder="Custom prefix (e.g. R)"
                  className="w-44 rounded-xl border border-line bg-page px-3 py-1.5 font-mono text-xs uppercase text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomLane}
                  className="rounded-xl text-xs"
                >
                  Add Code
                </Button>
              </div>
            </div>

            <div>
              <label
                htmlFor="counter-assigned-staff"
                className="mb-1 block text-xs font-bold text-ink-muted"
              >
                Designated Staff Owner (Name + Email)
              </label>
              <select
                id="counter-assigned-staff"
                value={counterModal.assignedStaffId ?? ""}
                onChange={(e) =>
                  setCounterModal({
                    ...counterModal,
                    assignedStaffId: e.target.value || null,
                  })
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
              >
                <option value="">Unassigned (Any eligible role)</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} — {op.email} ({op.role})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-ink-muted">
                Designates the primary operator for this window. Non-owners will
                see an emergency takeover warning before acting here.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-muted">
                Allowed Operator Roles
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_ROLES.map((r) => {
                  const active = counterModal.allowedRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setCounterModal({
                          ...counterModal,
                          allowedRoles: toggleSelection(
                            counterModal.allowedRoles,
                            r
                          ),
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? "border-minsu-green-700 bg-minsu-green-700 text-white"
                          : "border-line bg-page text-ink"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {counterModal.id !== null && (
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-page/70 px-3.5 py-2.5 text-xs font-semibold text-ink">
                <span>Window is Open for active queue calling</span>
                <input
                  type="checkbox"
                  checked={counterModal.isOpen}
                  onChange={(e) =>
                    setCounterModal({
                      ...counterModal,
                      isOpen: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-line text-minsu-green-700 focus:ring-minsu-green-700"
                />
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCounterModal(null);
                  setModalError(null);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={savingCounter}
                className="rounded-xl"
              >
                {counterModal.id ? "Save Window" : "Add Window"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Clear PIN Confirmation */}
      <Modal
        isOpen={clearPinConfirmOpen}
        onClose={() => setClearPinConfirmOpen(false)}
        title="Remove Kiosk Admin PIN?"
        description="Anyone accessing the kiosk terminal corner settings button will be able to switch campus or layout locally without a PIN."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setClearPinConfirmOpen(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={savingConfig}
            onClick={handleClearPin}
            className="rounded-xl"
          >
            <Shield className="h-4 w-4" />
            Remove PIN
          </Button>
        </div>
      </Modal>
    </div>
  );
}

