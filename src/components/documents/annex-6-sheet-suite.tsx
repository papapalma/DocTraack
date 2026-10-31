"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChedLogo, UniFastLogo } from "./ched-unifast-logos";
import { AnnexLogo } from "./annex-logo";
import { PrintPreviewModal } from "./print-preview-modal";
import { Annex6FormData, Annex6ManagementFeeExpenses, LogoConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  LayoutDashboard,
  ShieldCheck,
  Building,
  TrendingDown,
  PieChart,
  Calendar,
} from "lucide-react";

interface Annex6SheetSuiteProps {
  initialData?: Annex6FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex6SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex6SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" or "sheet" (Official Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [workspaceTab, setWorkspaceTab] = useState<"ledger" | "signatories">("ledger");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Print & PDF modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");

  useEffect(() => {
    const handleOpenPrint = () => setIsPrintModalOpen(true);
    window.addEventListener("minsu:open-print-modal", handleOpenPrint);
    return () => window.removeEventListener("minsu:open-print-modal", handleOpenPrint);
  }, []);

  // Default initial values
  const defaultData: Annex6FormData = useMemo(() => {
    return (
      initialData || {
        heiName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
        heiAddress: "Labasan, Bongabong, Oriental Mindoro",
        coveredPeriod: "January 1, 2024 to June 30, 2024",

        checkNumber: "LBP-2024-009841",
        checkDate: "March 15, 2024",
        totalStipendReceived: 750000,
        totalAscReceived: 3750,
        totalFundsReceived: 753750,

        totalStipendUtilized: 750000,
        managementFeeExpenses: {
          officeSupplies: 1200,
          communication: 650,
          travelingLocal: 800,
          representation: 500,
          otherProfessionalServices: 400,
          legalServices: 100,
          otherExpenses: 100,
        },
        totalManagementFeeUtilized: 3750,
        totalFundsUtilized: 753750,

        balance: 0,
        utilizationRate: 100,

        signatories: {
          chiefAccountant: {
            name: "MA. ELENA L. BAUTISTA, CPA",
            position: "Chief Accountant",
          },
          president: {
            name: "DR. EMMANUEL C. MACALALAD",
            position: "University President",
          },
          auditor: {
            name: "ATTY. CRISTINA M. MERCADO",
            position: "State Auditor IV / COA Audit Team Leader",
            agency: "Commission on Audit (COA) - MinSU",
          },
        },
      }
    );
  }, [initialData]);

  const [formData, setFormData] = useState<Annex6FormData>(defaultData);
  const [docTitle] = useState(
    documentTitle ||
      `Annex 6: Fund Utilization Report (FUR) - ${defaultData.coveredPeriod}`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeftLogoChange = (newConfig: LogoConfig) => {
    setFormData((prev) => ({
      ...prev,
      headerLogos: {
        ...prev.headerLogos,
        leftLogo: newConfig,
      },
    }));
  };

  const handleRightLogoChange = (newConfig: LogoConfig) => {
    setFormData((prev) => ({
      ...prev,
      headerLogos: {
        ...prev.headerLogos,
        rightLogo: newConfig,
      },
    }));
  };

  // Live recalculate all financial ledger totals
  const recalculateLedger = (
    updatedFields: Partial<Annex6FormData>,
    updatedExpenses?: Partial<Annex6ManagementFeeExpenses>
  ) => {
    const nextExpenses: Annex6ManagementFeeExpenses = {
      ...formData.managementFeeExpenses,
      ...(updatedExpenses || {}),
    };

    const totalManagementFeeUtilized =
      (Number(nextExpenses.officeSupplies) || 0) +
      (Number(nextExpenses.communication) || 0) +
      (Number(nextExpenses.travelingLocal) || 0) +
      (Number(nextExpenses.representation) || 0) +
      (Number(nextExpenses.otherProfessionalServices) || 0) +
      (Number(nextExpenses.legalServices) || 0) +
      (Number(nextExpenses.otherExpenses) || 0);

    const totalStipendReceived =
      updatedFields.totalStipendReceived !== undefined
        ? Number(updatedFields.totalStipendReceived) || 0
        : formData.totalStipendReceived;

    const totalAscReceived =
      updatedFields.totalAscReceived !== undefined
        ? Number(updatedFields.totalAscReceived) || 0
        : formData.totalAscReceived;

    const totalFundsReceived = totalStipendReceived + totalAscReceived;

    const totalStipendUtilized =
      updatedFields.totalStipendUtilized !== undefined
        ? Number(updatedFields.totalStipendUtilized) || 0
        : formData.totalStipendUtilized;

    const totalFundsUtilized = totalStipendUtilized + totalManagementFeeUtilized;
    const balance = totalFundsReceived - totalFundsUtilized;
    const utilizationRate =
      totalFundsReceived > 0
        ? Math.min(100, Math.round((totalFundsUtilized / totalFundsReceived) * 1000) / 10)
        : 0;

    setFormData((prev) => ({
      ...prev,
      ...updatedFields,
      managementFeeExpenses: nextExpenses,
      totalManagementFeeUtilized,
      totalStipendReceived,
      totalAscReceived,
      totalFundsReceived,
      totalStipendUtilized,
      totalFundsUtilized,
      balance,
      utilizationRate,
    }));
  };

  // Auto-sync / pull funds received from approved Annex 3 and Annex 4 documents
  const syncFromBillings = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const docs = data.documents || [];

      let totalStipend = 0;
      let totalAsc = 0;
      let foundCount = 0;

      docs.forEach((doc: any) => {
        if (doc.annexType?.number === 3 && doc.formData?.totalSubsidy) {
          totalStipend += Number(doc.formData.totalSubsidy) || 0;
          totalAsc += Number(doc.formData.managementFeeAmount) || 0;
          foundCount++;
        } else if (doc.annexType?.number === 4 && doc.formData?.totalSubsidy) {
          totalStipend += Number(doc.formData.totalSubsidy) || 0;
          totalAsc += Number(doc.formData.managementFeeAmount) || 0;
          foundCount++;
        }
      });

      if (foundCount > 0 && totalStipend > 0) {
        recalculateLedger({
          totalStipendReceived: totalStipend,
          totalAscReceived: totalAsc,
          totalStipendUtilized: totalStipend,
        });
        setSyncMessage(
          `Successfully linked ₱${(totalStipend + totalAsc).toLocaleString(undefined, { minimumFractionDigits: 2 })} across ${foundCount} Annex 3/4 billing packages.`
        );
      } else {
        setSyncMessage("No existing Annex 3/4 billing statements found. Retained current entries.");
      }
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setSyncMessage("Failed to sync from billing statements.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Save changes
  const handleSave = async (submitDirectly: boolean = false) => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (mode === "create") {
        if (!annexTypeId) {
          setError("Missing annexTypeId configuration");
          setIsSaving(false);
          return;
        }

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: docTitle,
            annexTypeId,
            formData,
            status: submitDirectly ? "SUBMITTED" : "DRAFT",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create Annex 6 document");
        }

        const data = await res.json();
        setSaveSuccess(true);
        if (onSaved) {
          onSaved(data.document.id);
        } else {
          router.push(`/documents/${data.document.id}`);
        }
      } else {
        if (!documentId) return;

        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: docTitle,
            formData,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update Annex 6 document");
        }

        if (submitDirectly) {
          await fetch(`/api/documents/${documentId}/submit`, { method: "POST" });
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onSaved) onSaved(documentId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP DUAL-MODE ACTION & NAVIGATION TOOLBAR                             */}
      {/* ========================================================================= */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-2 rounded-2xl border border-line shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden transition-all duration-200">
        {/* Left: View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex p-1 rounded-xl bg-minsu-green-50 border border-minsu-green-100">
            <button
              onClick={() => setViewMode("workspace")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold apple-press transition-all ${
                viewMode === "workspace"
                  ? "bg-minsu-green-700 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Interactive Workspace</span>
            </button>
            <button
              onClick={() => setViewMode("sheet")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold apple-press transition-all ${
                viewMode === "sheet"
                  ? "bg-minsu-green-700 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Paper Sheet</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {documentId && (
            <a
              href={`/api/annex-6/export-excel?documentId=${documentId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-minsu-green-50 text-minsu-green-700 text-xs font-semibold apple-press transition-colors shadow-xs"
              title="Download official Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="text-xs h-8 border-line hover:bg-minsu-green-50 text-ink gap-1.5 apple-press shadow-xs font-semibold"
            title="Export official document to PDF or physical printer"
          >
            <Printer className="w-3.5 h-3.5 text-minsu-green-700" />
            <span>Export PDF / Print</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-bold text-xs h-8 apple-press shadow-xs gap-1.5"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {mode === "create" ? "Save Annex 6" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-minsu-green-50 border border-minsu-green-100 flex items-center gap-2.5 text-minsu-green-900 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-minsu-green-600 shrink-0" />
          Annex 6 Fund Utilization Report saved successfully.
        </div>
      )}

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-minsu-gold-100 border border-minsu-gold-400/40 flex items-center gap-2.5 text-minsu-gold-600 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {syncMessage}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-800 text-xs font-semibold apple-shadow animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODE A: INTERACTIVE DATA WORKSPACE                                    */}
      {/* ========================================================================= */}
      {viewMode === "workspace" && (
        <div className="space-y-6 print:hidden">
          {/* Sub-tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              onClick={() => setWorkspaceTab("ledger")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "ledger"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Financial Ledger & Expense Breakdown</span>
            </button>
            <button
              onClick={() => setWorkspaceTab("signatories")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "signatories"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Signatories & Audit Team</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total Funds Received</span>
                <DollarSign className="w-4 h-4 text-minsu-green-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-minsu-green-900">
                ₱{formData.totalFundsReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Stipend + ASC Management Fee
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total Funds Utilized</span>
                <TrendingDown className="w-4 h-4 text-minsu-gold-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">
                ₱{formData.totalFundsUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                RCI/RADAI Verified Disbursements
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Unutilized Balance</span>
                <PieChart className="w-4 h-4 text-minsu-green-600" />
              </div>
              <div className={`text-2xl font-bold font-mono ${formData.balance > 0 ? "text-amber-700" : "text-minsu-green-900"}`}>
                ₱{formData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                {formData.balance === 0 ? "100% Fully Utilized" : "Remaining for refund/carryover"}
              </div>
            </div>

            <div className="bg-minsu-green-900 p-4 rounded-xl text-white shadow-xs">
              <div className="flex items-center justify-between text-xs text-minsu-gold-400 font-medium mb-1">
                <span>Utilization Rate</span>
                <ShieldCheck className="w-4 h-4 text-minsu-gold-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-minsu-gold-400">
                {formData.utilizationRate}%
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                Check: {formData.checkNumber || "Pending"}
              </div>
            </div>
          </div>

          {/* TAB 1: LEDGER */}
          {workspaceTab === "ledger" && (
            <div className="space-y-6">
              {/* Header Info & Auto-Sync Bar */}
              <div className="bg-white p-5 rounded-2xl border border-line shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-minsu-green-900 uppercase">
                    Report Parameters & Covered Period
                  </div>
                  <div className="text-xs text-ink-muted">
                    Specify the accounting period, check details, and supporting disbursement records.
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncFromBillings}
                  disabled={isSyncing}
                  className="text-xs h-8 border-minsu-green-700/40 text-minsu-green-700 hover:bg-minsu-green-50 font-semibold gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Auto-Sync from Annex 3 & 4 Billings</span>
                </Button>
              </div>

              {/* Grid 1: Basic Information & Check Details */}
              <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-minsu-green-900 uppercase tracking-wider">
                  1. Check Information & Period
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Covered Period</label>
                    <input
                      value={formData.coveredPeriod}
                      onChange={(e) => recalculateLedger({ coveredPeriod: e.target.value })}
                      placeholder="e.g. January 1, 2024 to June 30, 2024"
                      className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Check Number</label>
                    <input
                      value={formData.checkNumber}
                      onChange={(e) => recalculateLedger({ checkNumber: e.target.value })}
                      placeholder="e.g. LBP-2024-009841"
                      className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Check Date</label>
                    <input
                      value={formData.checkDate}
                      onChange={(e) => recalculateLedger({ checkDate: e.target.value })}
                      placeholder="e.g. March 15, 2024"
                      className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Funds Received Ledger */}
              <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h3 className="text-xs font-bold text-minsu-green-900 uppercase tracking-wider">
                    2. Funds Received (From CHEDRO / UniFAST)
                  </h3>
                  <div className="text-xs font-mono font-bold text-minsu-green-900">
                    Subtotal: ₱{formData.totalFundsReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Total Stipend Received (PHP)</label>
                    <input
                      type="number"
                      value={formData.totalStipendReceived}
                      onChange={(e) => recalculateLedger({ totalStipendReceived: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700 text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Total ASC / Management Fee Received (PHP)</label>
                    <input
                      type="number"
                      value={formData.totalAscReceived}
                      onChange={(e) => recalculateLedger({ totalAscReceived: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Funds Utilized (Disbursements backed by RCI/RADAI) */}
              <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-minsu-green-900 uppercase tracking-wider">
                      3. Less: Fund Utilized (Disbursements)
                    </h3>
                    <div className="text-[11px] text-ink-muted">
                      Disbursements must be backed by attached RCI / RADAI supporting schedules.
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-ink">
                    Total Utilized: ₱{formData.totalFundsUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Group A: MOOE - Stipend */}
                <div className="p-4 rounded-xl bg-minsu-green-50/40 border border-minsu-green-100 space-y-2">
                  <div className="text-xs font-bold text-minsu-green-900">
                    A. MOOE - STIPEND
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-ink-muted">
                        Total Stipend Disbursed per Semester Basis (PHP)
                      </label>
                      <input
                        type="number"
                        value={formData.totalStipendUtilized}
                        onChange={(e) => recalculateLedger({ totalStipendUtilized: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1.5 h-9 rounded-lg border border-line bg-white px-3 text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Group B: MOOE - Management Fee Breakdown */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-neutral-800">
                      B. MOOE - Management Fee Line Items
                    </div>
                    <div className="text-xs font-mono font-bold text-minsu-green-900">
                      Fee Utilized: ₱{formData.totalManagementFeeUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Office Supplies Expenses</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.officeSupplies}
                        onChange={(e) => recalculateLedger({}, { officeSupplies: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Communication Expenses</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.communication}
                        onChange={(e) => recalculateLedger({}, { communication: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Traveling Expenses - Local</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.travelingLocal}
                        onChange={(e) => recalculateLedger({}, { travelingLocal: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Representation (Meetings/Seminars)</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.representation}
                        onChange={(e) => recalculateLedger({}, { representation: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Other Professional Services (Staff Salary)</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.otherProfessionalServices}
                        onChange={(e) => recalculateLedger({}, { otherProfessionalServices: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Legal Services (Notarization)</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.legalServices}
                        onChange={(e) => recalculateLedger({}, { legalServices: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-ink-muted">Other Expenses (Cards / Remittance fees)</label>
                      <input
                        type="number"
                        value={formData.managementFeeExpenses.otherExpenses}
                        onChange={(e) => recalculateLedger({}, { otherExpenses: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 h-8 rounded-lg border border-line bg-white px-3 text-xs font-mono text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIGNATORIES */}
          {workspaceTab === "signatories" && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-minsu-green-900 uppercase tracking-wider">
                Certification & Audit Signatories
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">1. Certified Correct</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Chief Accountant Name</label>
                    <input
                      value={formData.signatories?.chiefAccountant?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            chiefAccountant: {
                              ...formData.signatories?.chiefAccountant,
                              name: e.target.value,
                              position: formData.signatories?.chiefAccountant?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Position</label>
                    <input
                      value={formData.signatories?.chiefAccountant?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            chiefAccountant: {
                              ...formData.signatories?.chiefAccountant,
                              name: formData.signatories?.chiefAccountant?.name || "",
                              position: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">2. Approved by</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Head / President of HEI Name</label>
                    <input
                      value={formData.signatories?.president?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            president: {
                              ...formData.signatories?.president,
                              name: e.target.value,
                              position: formData.signatories?.president?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Position</label>
                    <input
                      value={formData.signatories?.president?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            president: {
                              ...formData.signatories?.president,
                              name: formData.signatories?.president?.name || "",
                              position: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">3. Verified / Audited by</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">COA / State Auditor Name</label>
                    <input
                      value={formData.signatories?.auditor?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            auditor: {
                              ...formData.signatories?.auditor,
                              name: e.target.value,
                              position: formData.signatories?.auditor?.position || "",
                              agency: formData.signatories?.auditor?.agency || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Position & Agency</label>
                    <input
                      value={formData.signatories?.auditor?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            auditor: {
                              ...formData.signatories?.auditor,
                              name: formData.signatories?.auditor?.name || "",
                              position: e.target.value,
                              agency: formData.signatories?.auditor?.agency || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: REFINED OFFICIAL DOCUMENT CANVAS (FUR_tab_preview.png)         */}
      {/* ========================================================================= */}
      <div className={viewMode === "sheet" ? "block" : "hidden print:block"}>
        <div className="annex-printable-document bg-white text-ink font-sans p-6 sm:p-12 border border-neutral-800 shadow-xl rounded-sm max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print-container text-[11px] leading-tight space-y-6">
          {/* Top Header Logos */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="w-20 flex justify-center">
              <AnnexLogo
                position="left"
                config={formData.headerLogos?.leftLogo}
                defaultPreset="ched"
                editable={true}
                documentId={documentId}
                className="w-16 h-16"
                onLogoChange={handleLeftLogoChange}
              />
            </div>

            <div className="text-center flex-1 px-4 space-y-1">
              <div className="font-extrabold text-sm uppercase text-neutral-900 tracking-wide">
                FUND UTILIZATION REPORT (FUR)
              </div>
              <div className="font-bold text-xs uppercase">{formData.heiName}</div>
              <div className="text-[10px] text-neutral-600 italic">{formData.heiAddress}</div>
              <div className="font-bold text-xs text-neutral-800 pt-1">
                Fund Utilization Report of the TDP/Management Fee
              </div>
              <div className="text-[11px] text-neutral-700">
                For the Covered Period of <span className="border-b border-neutral-800 font-semibold px-2">{formData.coveredPeriod}</span>
              </div>
            </div>

            <div className="w-20 flex justify-center">
              <AnnexLogo
                position="right"
                config={formData.headerLogos?.rightLogo}
                defaultPreset="unifast"
                editable={true}
                documentId={documentId}
                className="w-16 h-16"
                onLogoChange={handleRightLogoChange}
              />
            </div>
          </div>

          {/* Official FUR Table */}
          <table className="w-full border-collapse border border-neutral-800 text-[11px]">
            <tbody>
              {/* Row 1: FUNDS RECEIVED Header */}
              <tr className="bg-neutral-100 font-bold border-b border-neutral-800">
                <td colSpan={2} className="border-r border-neutral-800 p-2 text-left uppercase text-neutral-900">
                  FUNDS RECEIVED
                </td>
                <td className="p-2 w-32 border-b border-neutral-800"></td>
              </tr>

              {/* Row 2: Check details & amounts */}
              <tr className="border-b border-neutral-800">
                <td className="border-r border-neutral-800 p-2 align-top w-72">
                  <div className="space-y-1">
                    <div>
                      Check No. <span className="font-mono font-bold underline px-1">{formData.checkNumber || "_________"}</span>
                    </div>
                    <div>
                      Check Date: <span className="font-medium underline px-1">{formData.checkDate || "_________"}</span>
                    </div>
                  </div>
                </td>
                <td className="border-r border-neutral-800 p-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="italic">Total Stipend</span>
                    <span className="font-mono font-bold">
                      ₱{formData.totalStipendReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="italic">Total ASC</span>
                    <span className="font-mono font-bold">
                      ₱{formData.totalAscReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-right align-bottom font-mono font-bold bg-neutral-50 text-neutral-900">
                  ₱{formData.totalFundsReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Row 3: Less: FUND UTILIZED Header */}
              <tr className="border-b border-neutral-800 bg-neutral-100 font-bold">
                <td colSpan={3} className="p-2 text-left">
                  <div>Less: FUND UTILIZED</div>
                  <div className="text-[10px] font-normal italic text-neutral-700">
                    Disbursements (see attached RCI/RADAI to support Disbursement)
                  </div>
                </td>
              </tr>

              {/* Row 4: MOOE - STIPEND */}
              <tr className="border-b border-neutral-800">
                <td className="border-r border-neutral-800 p-2 font-bold align-top">
                  MOOE - STIPEND
                </td>
                <td className="border-r border-neutral-800 p-2">
                  <div className="flex justify-between">
                    <span className="italic">Total Stipend per Semester basis</span>
                    <span className="font-mono font-bold">
                      ₱{formData.totalStipendUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="p-2 border-r border-neutral-800"></td>
              </tr>

              {/* Row 5: MOOE - Management Fee */}
              <tr className="border-b border-neutral-800">
                <td className="border-r border-neutral-800 p-2 font-bold align-top">
                  MOOE - Management Fee
                </td>
                <td className="border-r border-neutral-800 p-2 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Office Supplies Expenses</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.officeSupplies.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Communication Expenses</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.communication.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Traveling Expenses - Local</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.travelingLocal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Representation Expenses (Meetings, orientation, seminars, general assembly)</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.representation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Other Professional Services (Salary of staff)</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.otherProfessionalServices.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Legal Services (Notarization of docs)</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.legalServices.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="italic pl-2">Other Expenses (cash cards, service fee for remittance center)</span>
                    <span className="font-mono">
                      ₱{formData.managementFeeExpenses.otherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold border-t border-neutral-300 pt-1 mt-1">
                    <span className="pl-2">Subtotal Management Fee</span>
                    <span className="font-mono">
                      ₱{formData.totalManagementFeeUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-right align-bottom font-mono font-bold bg-neutral-50 text-neutral-900 border-b border-neutral-800">
                  ₱{formData.totalFundsUtilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Row 6: BALANCE */}
              <tr className="font-bold border-t-2 border-neutral-900 bg-neutral-50">
                <td colSpan={2} className="border-r border-neutral-800 p-2 text-left uppercase text-neutral-900 text-xs">
                  Balance
                </td>
                <td className="p-2 text-right font-mono font-extrabold text-xs text-minsu-green-900 bg-minsu-gold-100">
                  ₱{formData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 3 Signatory Blocks */}
          <div className="pt-8 space-y-10 avoid-break">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="text-xs text-neutral-600 font-medium">Certified correct by:</div>
                <div className="pt-10 max-w-xs">
                  <div className="font-bold border-b border-neutral-800 pb-1 text-center uppercase">
                    {formData.signatories?.chiefAccountant?.name || "MA. ELENA L. BAUTISTA, CPA"}
                  </div>
                  <div className="text-[10px] text-center text-neutral-600 pt-0.5">
                    (Signature over printed name)
                  </div>
                  <div className="text-xs text-center font-bold text-neutral-800">
                    {formData.signatories?.chiefAccountant?.position || "Chief Accountant"}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-neutral-600 font-medium">Approved by:</div>
                <div className="pt-10 max-w-xs">
                  <div className="font-bold border-b border-neutral-800 pb-1 text-center uppercase">
                    {formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD"}
                  </div>
                  <div className="text-[10px] text-center text-neutral-600 pt-0.5">
                    (Signature over printed name)
                  </div>
                  <div className="text-xs text-center font-bold text-neutral-800">
                    {formData.signatories?.president?.position || "Head/President of HEI"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-xs text-neutral-600 font-medium">Verified/Audited by:</div>
              <div className="pt-10 max-w-xs">
                <div className="font-bold border-b border-neutral-800 pb-1 text-center uppercase">
                  {formData.signatories?.auditor?.name || "ATTY. CRISTINA M. MERCADO"}
                </div>
                <div className="text-[10px] text-center text-neutral-600 pt-0.5">
                  (Signature over printed name)
                </div>
                <div className="text-xs text-center font-bold text-neutral-800">
                  {formData.signatories?.auditor?.position || "COA/State Auditor (for SUCs/LUCs)"}
                </div>
                <div className="text-[10px] text-center text-neutral-600">
                  {formData.signatories?.auditor?.agency || "Internal/External Auditor (for PHEIs)"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apple-styled Fluid Print / PDF Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle={documentTitle || "Annex 6 - Fund Utilization Report (FUR)"}
        annexNumber={6}
        orientation={printOrientation}
        onOrientationChange={setPrintOrientation}
        previewContent={
          <div className="text-black text-xs space-y-3">
            <div className="p-4 border border-dashed border-neutral-300 rounded bg-[#F1F8F1]">
              <div className="font-bold text-sm text-[#123F17]">
                TDP Annex 6 - Fund Utilization Report (FUR)
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                HEI: {formData.heiName} • Period: {formData.coveredPeriod} • Total Received: ₱{formData.totalFundsReceived.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-2 italic">
                Official single-sheet portrait financial statement with Accountant, President, and COA Auditor endorsements.
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
