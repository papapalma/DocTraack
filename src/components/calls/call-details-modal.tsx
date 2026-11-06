"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Calendar,
  Users,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Save,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  Archive,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";

export interface CallDetailsItem {
  id: string;
  title: string;
  description?: string | null;
  batchNumber?: number;
  startDate: string;
  deadline: string;
  isActive?: boolean;
  windowStatus?: "UPCOMING" | "OPEN" | "CLOSED";
  isCurrentlyOpen?: boolean;
  _count?: { applications: number };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallDetailsItem | null;
  onCallUpdated: () => void;
}

export function CallDetailsModal({
  isOpen,
  onClose,
  call,
  onCallUpdated,
}: CallDetailsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "edit">("overview");

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchNumber, setBatchNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Interaction feedback states
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Sync state when modal opens or call changes
  useEffect(() => {
    if (call) {
      setTitle(call.title || "");
      setDescription(call.description || "");
      setBatchNumber(call.batchNumber || 1);
      setIsActive(call.isActive ?? true);

      const toLocalDatetime = (isoString?: string) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return "";
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setStartDate(toLocalDatetime(call.startDate));
      setDeadline(toLocalDatetime(call.deadline));
      setActiveTab("overview");
      setError(null);
      setSaveSuccess(false);
      setShowArchiveConfirm(false);
      setIsCopied(false);
    }
  }, [call, isOpen]);

  if (!call) return null;

  const now = new Date();
  const start = new Date(call.startDate);
  const end = new Date(call.deadline);
  const isUpcoming = now < start;
  const isClosed = !call.isActive || now > end;
  const isOpenStatus = call.isActive && !isUpcoming && !isClosed;

  // Compute countdown/time remaining
  const getTimeRemaining = () => {
    if (!call.isActive) return "Manually Closed / Inactive";
    if (isUpcoming) {
      const diffMs = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `Opens in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    }
    if (isClosed) {
      const diffMs = now.getTime() - end.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return `Closed ${diffDays > 0 ? `${diffDays} day${diffDays === 1 ? "" : "s"} ago` : "recently"}`;
    }
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays === 1 ? "" : "s"} remaining`;
  };

  const portalRelativePath = `/portal/calls/${call.id}`;
  const portalFullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${portalRelativePath}`
      : portalRelativePath;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalFullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Call title cannot be empty.");
      return;
    }

    if (!deadline) {
      setError("Deadline date and time are required.");
      return;
    }

    if (new Date(startDate) >= new Date(deadline)) {
      setError("Start date must be earlier than the submission deadline.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          batchNumber: Number(batchNumber) || 1,
          startDate: new Date(startDate).toISOString(),
          deadline: new Date(deadline).toISOString(),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save call updates.");
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      onCallUpdated();
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab("overview");
      }, 1200);
    } catch (err) {
      console.error("Call update error:", err);
      setError("Network error while saving changes. Please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveCall = async () => {
    setIsArchiving(true);
    setError(null);

    try {
      const res = await fetch(`/api/calls/${call.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to archive applicant call.");
        setIsArchiving(false);
        return;
      }

      onCallUpdated();
      onClose();
    } catch (err) {
      console.error("Call archive error:", err);
      setError("Network error during archival. Please retry.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shadow-xs shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1B5E20] text-white">
                  Batch {call.batchNumber || 1}
                </span>
                <h2 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] line-clamp-1">
                  {call.title}
                </h2>
              </div>
              <p className="text-xs text-[#55645B] mt-0.5">
                Annex 2 Applicant Call Details & Controls
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isOpenStatus && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                Open (Active)
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40 shadow-xs">
                Upcoming Window
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDE8E7] text-[#B3261E] border border-[#B3261E]/30 shadow-xs">
                Window Closed
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#D6DDD8] flex items-center justify-center text-[#1B5E20] shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#55645B] font-medium">Student Applicants</p>
              <p className="text-sm font-bold text-[#1B5E20]">
                {call._count?.applications || 0} Submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#D6DDD8] flex items-center justify-center text-[#1B5E20] shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#55645B] font-medium">Window Status</p>
              <p className="text-sm font-bold text-[#1F2A24]">
                {getTimeRemaining()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#D6DDD8] flex items-center justify-center text-[#1B5E20] shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#55645B] font-medium">Submission Deadline</p>
              <p className="text-sm font-bold text-[#1F2A24]">
                {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#D6DDD8] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`apple-press px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-[#1B5E20] text-white shadow-xs"
                : "text-[#55645B] hover:text-[#1F2A24] hover:bg-[#F1F8F1]"
            }`}
          >
            Overview & Quick Links
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`apple-press px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "edit"
                ? "bg-[#1B5E20] text-white shadow-xs"
                : "text-[#55645B] hover:text-[#1F2A24] hover:bg-[#F1F8F1]"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Call Settings
          </button>
        </div>

        {/* Feedback / Alert Banners */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Action failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-[#DCEFDD] border border-[#2E7D32]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#123F17] animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            <p className="font-semibold">Applicant call settings updated successfully!</p>
          </div>
        )}

        {/* TAB 1: OVERVIEW & PORTAL LINKS */}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Public Student Portal Link Card */}
            <div className="p-4 bg-white rounded-xl border border-[#D6DDD8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                    Online Student Application Portal
                  </h3>
                  <p className="text-[11px] text-[#55645B] mt-0.5">
                    Share this direct portal link with MinSU students to collect online TDP submissions.
                  </p>
                </div>
                <Link href={portalRelativePath} target="_blank">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="apple-press text-xs font-semibold h-8 text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#DCEFDD]"
                  >
                    Open Portal
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={portalFullUrl}
                  className="bg-[#F6F8F6] text-xs font-mono text-[#1F2A24] selection:bg-[#DCEFDD] h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="apple-press shrink-0 text-xs font-semibold h-9 flex items-center gap-1.5 border-[#D6DDD8] hover:border-[#1B5E20]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span className="text-[#2E7D32]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#55645B]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Verified Student Roster Navigation Card */}
            <div className="p-4 bg-white rounded-xl border border-[#D6DDD8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                  Verified Registrations & Student Roster
                </h3>
                <p className="text-[11px] text-[#55645B] mt-0.5">
                  View and manage student applications already verified for Batch {call.batchNumber || 1}.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  router.push(`/registrations?batch=${call.batchNumber || 1}`);
                }}
                className="apple-press text-xs font-semibold h-8 bg-[#1B5E20] hover:bg-[#25702A] text-white shrink-0 flex items-center gap-1.5"
              >
                View Batch {call.batchNumber || 1} Roster
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Guidelines & Details Box */}
            <div className="p-4 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8]/70 space-y-2">
              <h4 className="text-xs font-semibold text-[#1F2A24]">Guidelines & Requirements</h4>
              <p className="text-xs text-[#55645B] leading-relaxed whitespace-pre-wrap">
                {call.description || "No specific guidelines or instructions provided for this intake window."}
              </p>
              <div className="pt-2 border-t border-[#D6DDD8]/50 flex flex-wrap items-center justify-between text-[11px] text-[#55645B]">
                <span>
                  Intake Period: {start.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })} — {end.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })}
                </span>
                {call.createdBy && (
                  <span>Created by {call.createdBy.name}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT CALL SETTINGS */}
        {activeTab === "edit" && (
          <form onSubmit={handleSaveChanges} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-semibold text-[#1F2A24]">
                Call Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-batch" className="text-xs font-semibold text-[#1F2A24]">
                  Batch Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-batch"
                  type="number"
                  min={1}
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  disabled={isSaving}
                  className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-start" className="text-xs font-semibold text-[#1F2A24]">
                  Intake Opens <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSaving}
                  className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="edit-deadline" className="text-xs font-semibold text-[#1F2A24]">
                  Submission Closes <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isSaving}
                  className="focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs font-semibold text-[#1F2A24]">
                Guidelines & Eligibility Instructions
              </Label>
              <textarea
                id="edit-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                className="w-full text-xs p-3 rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition resize-none"
              />
            </div>

            {/* Window Active Status Override Toggle */}
            <div className="p-3.5 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {isActive ? (
                    <Unlock className="w-4 h-4 text-[#2E7D32]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#B3261E]" />
                  )}
                  <span className="text-xs font-bold text-[#1F2A24]">
                    Intake Window Status Override
                  </span>
                </div>
                <p className="text-[11px] text-[#55645B]">
                  {isActive
                    ? "Call is currently Active. Students can apply while dates are within the window."
                    : "Call is manually Inactive / Closed. Students will be blocked from applying."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`apple-press px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-[#DCEFDD] text-[#123F17] border-[#2E7D32]/40 hover:bg-[#c9e6ca]"
                    : "bg-[#FDE8E7] text-[#B3261E] border-[#B3261E]/40 hover:bg-[#fad4d2]"
                }`}
              >
                {isActive ? "Status: ACTIVE" : "Status: CLOSED"}
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D6DDD8]/60">
              {showArchiveConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Confirm archival?</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isArchiving}
                    onClick={handleArchiveCall}
                    className="apple-press text-xs h-8 bg-red-600 text-white border-red-600 hover:bg-red-700"
                  >
                    {isArchiving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Yes, Archive"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isArchiving}
                    onClick={() => setShowArchiveConfirm(false)}
                    className="apple-press text-xs h-8"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchiveConfirm(true)}
                  className="apple-press text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive Call
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("overview")}
                  disabled={isSaving}
                  className="apple-press text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="apple-press text-xs font-semibold bg-[#1B5E20] hover:bg-[#25702A] text-white flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

