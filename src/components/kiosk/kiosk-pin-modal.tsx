"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  Volume2,
  MapPin,
  Monitor,
  LayoutGrid,
  Delete,
  ExternalLink,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import type { KioskDisplayMode } from "@/types/queue";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { MINSU_CAMPUSES } from "@/lib/campus-constants";
import { unlockKioskAudio, announceQueueTicket } from "@/lib/kiosk-audio";

export type UnifiedLayoutPreference = "AUTO" | "STACKED" | "SIDE_BY_SIDE";

interface KioskPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPinConfigured: boolean;
  currentCampus: string;
  currentMode: KioskDisplayMode;
  currentLayout: UnifiedLayoutPreference;
  onApplyLocalOverrides: (overrides: {
    campus: string;
    mode: KioskDisplayMode;
    layout: UnifiedLayoutPreference;
  }) => void;
  onResetDeviceOverrides?: () => void;
}

function KioskPinModalBody({
  onClose,
  hasPinConfigured,
  currentCampus,
  currentMode,
  currentLayout,
  onApplyLocalOverrides,
  onResetDeviceOverrides,
}: Omit<KioskPinModalProps, "isOpen">) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(!hasPinConfigured);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState(currentCampus);
  const [selectedMode, setSelectedMode] =
    useState<KioskDisplayMode>(currentMode);
  const [selectedLayout, setSelectedLayout] =
    useState<UnifiedLayoutPreference>(currentLayout);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    setError(null);
    setPin((prev) => prev + digit);
  };

  const handleVerifyPin = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/kiosk/pin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid PIN.");
        setPin("");
      } else {
        setUnlocked(true);
      }
    } catch {
      setError("Failed to verify PIN.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveOverrides = () => {
    onApplyLocalOverrides({
      campus: selectedCampus,
      mode: selectedMode,
      layout: selectedLayout,
    });
    onClose();
  };

  if (!unlocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-page py-4">
          <Lock className="h-5 w-5 text-minsu-green-700" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <span
                key={idx}
                className={`h-3.5 w-3.5 rounded-full border transition ${
                  idx < pin.length
                    ? "border-minsu-green-700 bg-minsu-green-700"
                    : "border-line bg-white"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"].map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "C") {
                    setPin("");
                    setError(null);
                  } else if (key === "DEL") {
                    setPin((prev) => prev.slice(0, -1));
                  } else {
                    handleDigit(key);
                  }
                }}
                className="kiosk-touch-tile flex h-14 items-center justify-center rounded-xl border border-line bg-page font-heading text-lg font-bold text-ink hover:bg-minsu-green-50"
              >
                {key === "DEL" ? <Delete className="h-5 w-5" /> : key}
              </button>
            )
          )}
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={verifying}
          disabled={pin.length < 4}
          onClick={handleVerifyPin}
          className="w-full rounded-xl py-3"
        >
          <Unlock className="h-4 w-4" />
          Unlock Terminal Controls
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="pin-modal-campus"
          className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted"
        >
          <MapPin className="h-3.5 w-3.5 text-minsu-green-700" />
          Terminal Campus Queue
        </label>
        <select
          id="pin-modal-campus"
          value={selectedCampus}
          onChange={(e) => setSelectedCampus(e.target.value)}
          className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
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
          htmlFor="pin-modal-mode"
          className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted"
        >
          <Monitor className="h-3.5 w-3.5 text-minsu-green-700" />
          Screen Mode (This Device)
        </label>
        <select
          id="pin-modal-mode"
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value as KioskDisplayMode)}
          className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
        >
          <option value="UNIFIED">Unified (Now Serving + Check-In)</option>
          <option value="CHECK_IN_ONLY">Touch Check-In Only</option>
          <option value="DISPLAY_ONLY">TV Overhead Monitor Only</option>
        </select>
      </div>

      {selectedMode === "UNIFIED" && (
        <div>
          <label
            htmlFor="pin-modal-layout"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-minsu-green-700" />
            Screen Orientation Fit
          </label>
          <select
            id="pin-modal-layout"
            value={selectedLayout}
            onChange={(e) =>
              setSelectedLayout(e.target.value as UnifiedLayoutPreference)
            }
            className="w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700"
          >
            <option value="AUTO">
              Auto (Side-by-side Landscape, Stacked Portrait)
            </option>
            <option value="STACKED">Force Stacked (Vertical / Standing Kiosk)</option>
            <option value="SIDE_BY_SIDE">Force Split Columns (Widescreen)</option>
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={async () => {
            await unlockKioskAudio();
            await announceQueueTicket("A-001", "Window 1", {
              enableChime: true,
              enableVoice: true,
            });
          }}
        >
          <Volume2 className="h-4 w-4" />
          Test Chime & Voice
        </Button>

        <Link
          href={`/kiosk/display?campus=${encodeURIComponent(selectedCampus)}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-page px-3 py-2 text-xs font-semibold text-ink hover:bg-neutral-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Overhead Display
        </Link>

        <Link
          href="/queue"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-page px-3 py-2 text-xs font-semibold text-ink hover:bg-neutral-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Staff Queue Console
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        {onResetDeviceOverrides ? (
          <button
            type="button"
            onClick={() => {
              onResetDeviceOverrides();
              onClose();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Use Server Defaults
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveOverrides}
            className="rounded-xl"
          >
            Apply to This Kiosk
          </Button>
        </div>
      </div>
    </div>
  );
}

export function KioskPinModal({
  isOpen,
  onClose,
  hasPinConfigured,
  currentCampus,
  currentMode,
  currentLayout,
  onApplyLocalOverrides,
  onResetDeviceOverrides,
}: KioskPinModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        hasPinConfigured
          ? "Kiosk Terminal Settings"
          : "Terminal Settings (Local Kiosk)"
      }
      description="Switch terminal campus queue, screen mode, orientation fit, or verify audio."
      maxWidth="md"
    >
      {isOpen && (
        <KioskPinModalBody
          key={`${currentCampus}:${currentMode}:${currentLayout}:${hasPinConfigured}`}
          onClose={onClose}
          hasPinConfigured={hasPinConfigured}
          currentCampus={currentCampus}
          currentMode={currentMode}
          currentLayout={currentLayout}
          onApplyLocalOverrides={onApplyLocalOverrides}
          onResetDeviceOverrides={onResetDeviceOverrides}
        />
      )}
    </Modal>
  );
}
