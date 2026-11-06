"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, AlertCircle, Loader2, Calendar, FileText, Hash } from "lucide-react";

interface CreateCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallCreated: () => void;
  defaultBatchNumber?: number;
}

export function CreateCallModal({
  isOpen,
  onClose,
  onCallCreated,
  defaultBatchNumber = 1,
}: CreateCallModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchNumber, setBatchNumber] = useState<number>(defaultBatchNumber);

  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [startDate, setStartDate] = useState(() => getLocalDateString(0));
  const [deadline, setDeadline] = useState(() => getLocalDateString(30));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default batch number when opened
  useEffect(() => {
    if (isOpen) {
      setBatchNumber(defaultBatchNumber);
      setStartDate(getLocalDateString(0));
      setDeadline(getLocalDateString(30));
      setError(null);
    }
  }, [isOpen, defaultBatchNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please specify an official title for this applicant call.");
      return;
    }

    if (!deadline) {
      setError("Please specify the application submission deadline.");
      return;
    }

    if (new Date(startDate) >= new Date(deadline)) {
      setError("Application intake start date must precede the final submission deadline.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || undefined,
          batchNumber: Number(batchNumber) || 1,
          startDate: new Date(startDate).toISOString(),
          deadline: new Date(deadline).toISOString(),
          formSchema: { fields: [] },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to publish applicant call.");
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setTitle("");
      setDescription("");
      onCallCreated();
      onClose();
    } catch (err) {
      console.error("Call creation error:", err);
      setError("Network or server connection failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-[#1F2A24]">
              Open New Call for Applicants
            </h2>
            <p className="text-xs text-[#55645B] font-normal">
              Publish an Annex 2 student intake window for Tulong Dunong Program (TDP)
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to publish call</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="call-title" className="text-xs font-semibold text-[#1F2A24] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#1B5E20]" />
            Official Call Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="call-title"
            placeholder="e.g. TDP-TES AY 2026-2027 1st Semester New Grantee Intake"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="call-batch" className="text-xs font-semibold text-[#1F2A24] flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#1B5E20]" />
              Batch Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="call-batch"
              type="number"
              min={1}
              value={batchNumber}
              onChange={(e) => setBatchNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={isSubmitting}
              className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-sm"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="call-start" className="text-xs font-semibold text-[#1F2A24] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1B5E20]" />
              Intake Opens <span className="text-red-500">*</span>
            </Label>
            <Input
              id="call-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
              className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-xs"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="call-deadline" className="text-xs font-semibold text-[#1F2A24] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B88A00]" />
              Submission Closes <span className="text-red-500">*</span>
            </Label>
            <Input
              id="call-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isSubmitting}
              className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-xs"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="call-desc" className="text-xs font-semibold text-[#1F2A24]">
            Guidelines & Eligibility Instructions (Optional)
          </Label>
          <textarea
            id="call-desc"
            rows={3}
            placeholder="Specify qualifications, required documents, GWA thresholds, or special instructions for applicant students..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="w-full text-xs p-3 rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition resize-none placeholder:text-[#55645B]/60"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D6DDD8]/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="apple-press text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="apple-press text-xs font-semibold bg-[#1B5E20] hover:bg-[#25702A] text-white flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing Call...
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5" />
                Publish Call (Annex 2)
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

