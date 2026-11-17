"use client";

import React, { useState } from "react";
import { Search, CheckCircle2, Clock, FileCheck2, AlertCircle, Ticket } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatShortTimeManila } from "./kiosk-visuals";

interface ApplicationLookupResult {
  trackingCode: string;
  status: string;
  batchNumber: string | null;
  callTitle: string;
  submittedAt: string;
  reviewedAt: string | null;
}

interface TrackingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetQueueWithTracking?: (trackingCode: string) => void;
}

const STATUS_DISPLAY: Record<
  string,
  { label: string; badgeClass: string; guidance: string }
> = {
  SUBMITTED: {
    label: "Submitted — Under Review",
    badgeClass: "bg-minsu-gold-100 text-minsu-gold-600 border-minsu-gold-400/40",
    guidance: "Your TDP scholarship application is queued for staff validation.",
  },
  FOR_VERIFICATION: {
    label: "Under 3-Way Verification",
    badgeClass: "bg-minsu-gold-100 text-minsu-gold-600 border-minsu-gold-400/40",
    guidance: "Your records are undergoing Registrar and CHED cross-matching.",
  },
  ACCEPTED: {
    label: "Accepted Scholar",
    badgeClass: "bg-minsu-green-100 text-minsu-green-700 border-minsu-green-600/20",
    guidance: "Congratulations! Proceed to Verification or Payroll desk if claiming documents.",
  },
  REJECTED: {
    label: "Returned / Not Qualified",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    guidance: "Please get a queue number for General Assistance to review requirements.",
  },
};

export function TrackingLookupModal({
  isOpen,
  onClose,
  onGetQueueWithTracking,
}: TrackingLookupModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationLookupResult | null>(null);

  const handleClose = () => {
    setError(null);
    setResult(null);
    setCode("");
    onClose();
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setError("Please enter your full application tracking code.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/kiosk/track-application?code=${encodeURIComponent(cleaned)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Application code not found.");
      } else {
        setResult(data.application as ApplicationLookupResult);
      }
    } catch {
      setError("Network error while checking status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusMeta = result
    ? STATUS_DISPLAY[result.status] || {
        label: result.status,
        badgeClass: "bg-neutral-100 text-ink border-line",
        guidance: "Check with the TDP coordinator counter for full details.",
      }
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Check Application Status"
      description="Enter your tracking code to view verification status without printing a queue slip."
      maxWidth="lg"
    >
      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label
            htmlFor="kiosk-tracking-code"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            TDP Tracking Code
          </label>
          <div className="flex gap-2">
            <input
              id="kiosk-tracking-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., TDP-2026-00042"
              autoComplete="off"
              className="flex-1 rounded-xl border border-line bg-page px-4 py-3.5 font-mono text-base font-semibold uppercase tracking-wide text-ink outline-none transition focus:border-minsu-green-700 focus:bg-white focus:ring-2 focus:ring-minsu-green-700"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="shrink-0 rounded-xl px-5"
            >
              <Search className="h-4 w-4" />
              Check
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            Privacy notice (RA 10173): Personal names and student details are never shown on shared kiosk screens.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && statusMeta && (
          <div className="space-y-3 rounded-2xl border border-minsu-green-600/20 bg-minsu-green-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-ink">
                {result.trackingCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
              >
                {result.status === "ACCEPTED" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {statusMeta.label}
              </span>
            </div>

            <div className="space-y-1 text-sm text-ink">
              <p className="flex items-center gap-1.5 font-medium">
                <FileCheck2 className="h-4 w-4 text-minsu-green-700" />
                {result.callTitle}
              </p>
              {result.batchNumber && (
                <p className="text-xs text-ink-muted">
                  Batch Reference: <span className="font-semibold">{result.batchNumber}</span>
                </p>
              )}
              <p className="text-xs text-ink-muted">
                Submitted: {new Date(result.submittedAt).toLocaleDateString("en-PH")} •{" "}
                {formatShortTimeManila(result.submittedAt)}
              </p>
            </div>

            <p className="rounded-xl bg-white p-3 text-xs leading-relaxed text-ink">
              {statusMeta.guidance}
            </p>

            {onGetQueueWithTracking && (
              <Button
                type="button"
                variant="accent"
                className="w-full rounded-xl py-3"
                onClick={() => {
                  const ref = result.trackingCode;
                  handleClose();
                  onGetQueueWithTracking(ref);
                }}
              >
                <Ticket className="h-4 w-4" />
                Still Need Assistance? Get Queue Ticket
              </Button>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

