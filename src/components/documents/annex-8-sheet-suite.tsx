"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnexLogo } from "./annex-logo";
import { PrintPreviewModal } from "./print-preview-modal";
import { Annex8FormData, Annex8CheckEntry, LogoConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Building,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckSquare,
} from "lucide-react";

interface Annex8SheetSuiteProps {
  initialData?: Annex8FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex8SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex8SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" or "sheet" (Official Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [workspaceTab, setWorkspaceTab] = useState<"entries" | "identification" | "signatories">("entries");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Print & PDF modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("landscape");

  useEffect(() => {
    const handleOpenPrint = () => setIsPrintModalOpen(true);
    window.addEventListener("minsu:open-print-modal", handleOpenPrint);
    return () => window.removeEventListener("minsu:open-print-modal", handleOpenPrint);
  }, []);

  // Default initial values
  const defaultData: Annex8FormData = useMemo(() => {
    const initialEntries: Annex8CheckEntry[] = [
      {
        id: "chk-1",
        checkDate: "2024-03-25",
        checkNo: "1029381",
        dvPayrollNo: "DV-2024-03-0145",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "MinSU TDP Beneficiaries (Batch 20.1 - Main Campus)",
        purposeOfPayment: "TES",
        amount: 75000,
      },
      {
        id: "chk-2",
        checkDate: "2024-03-26",
        checkNo: "1029382",
        dvPayrollNo: "DV-2024-03-0146",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "Mindoro State University (TES/TDP Office)",
        purposeOfPayment: "ASC",
        amount: 375,
      },
      {
        id: "chk-3",
        checkDate: "2024-04-15",
        checkNo: "1029383",
        dvPayrollNo: "DV-2024-04-0201",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "MinSU TDP Beneficiaries (Batch 20.2 - Calapan & Bongabong)",
        purposeOfPayment: "TES",
        amount: 675000,
      },
      {
        id: "chk-4",
        checkDate: "2024-04-16",
        checkNo: "1029384",
        dvPayrollNo: "DV-2024-04-0202",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "Mindoro State University (TES/TDP Office)",
        purposeOfPayment: "ASC",
        amount: 3375,
      },
    ];

    const totalAmt = initialEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const baseDefaults: Annex8FormData = {
      reportDate: "June 30, 2024",
      heiName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
      heiAddress: "Labasan, Bongabong, Oriental Mindoro",
      reportNo: "2024-001",
      sheetNo: "1 of 1",
      entries: initialEntries,
      totalAmount: totalAmt,
      checkNoFrom: "1029381",
      checkNoTo: "1029384",
      dateSigned: "June 30, 2024",
      cashierName: "MARIA LIZA M. HERNANDEZ",
      accountantName: "MA. ELENA L. BAUTISTA, CPA",
      presidentName: "DR. EMMANUEL C. MACALALAD",
      auditorName: "ATTY. CRISTINA M. MERCADO",
      auditorTitle: "COA/State Auditor",
    };

    if (!initialData) return baseDefaults;

    const resolvedEntries = Array.isArray(initialData.entries) && initialData.entries.length > 0
      ? initialData.entries
      : (Array.isArray(initialData.entries) ? initialData.entries : initialEntries);

    const resolvedTotal = initialData.totalAmount !== undefined && initialData.totalAmount !== null
      ? Number(initialData.totalAmount)
      : resolvedEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      ...baseDefaults,
      ...initialData,
      entries: resolvedEntries,
      totalAmount: resolvedTotal,
    };
  }, [initialData]);

  const [formData, setFormData] = useState<Annex8FormData>(defaultData);

  const [docTitle] = useState(
    documentTitle || `Annex 8: Report of Checks Issued (RCI) - ${defaultData.reportDate}`
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

  // Auto-compute total and check serial bounds
  const updateEntriesAndTotals = (newEntries: Annex8CheckEntry[]) => {
    const safeEntries = Array.isArray(newEntries) ? newEntries : [];
    const totalAmount = safeEntries.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    const serials = safeEntries
      .map((e) => String(e.checkNo || "").trim())
      .filter((s) => s.length > 0);

    const checkNoFrom = serials.length > 0 ? serials[0] : "";
    const checkNoTo = serials.length > 0 ? serials[serials.length - 1] : "";

    setFormData((prev) => ({
      ...prev,
      entries: safeEntries,
      totalAmount,
      checkNoFrom: prev.checkNoFrom || checkNoFrom,
      checkNoTo: prev.checkNoTo || checkNoTo,
    }));
  };

  // Add new check row
  const handleAddRow = () => {
    const currentList = Array.isArray(formData.entries) ? formData.entries : [];
    const nextSeq = currentList.length + 1;
    const padded = String(nextSeq).padStart(3, "0");
    const lastCheckNo = currentList.length > 0 ? Number(currentList[currentList.length - 1].checkNo) : 1029380;
    const nextCheckNo = isNaN(lastCheckNo) ? `1029${padded}` : String(lastCheckNo + 1);

    const newEntry: Annex8CheckEntry = {
      id: `chk-${Date.now()}-${nextSeq}`,
      checkDate: new Date().toISOString().split("T")[0],
      checkNo: nextCheckNo,
      dvPayrollNo: `DV-2024-${padded}`,
      responsibilityCenterCode: "10-001-03-00001",
      payee: "",
      purposeOfPayment: "TES",
      amount: 0,
    };
    updateEntriesAndTotals([...currentList, newEntry]);
  };

  // Update field in row
  const handleEntryChange = (id: string, field: keyof Annex8CheckEntry, value: string | number) => {
    const currentList = Array.isArray(formData.entries) ? formData.entries : [];
    const updated = currentList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === "amount" ? (value === "" ? 0 : Number(value)) : value,
        };
      }
      return item;
    });
    updateEntriesAndTotals(updated);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    const currentList = Array.isArray(formData.entries) ? formData.entries : [];
    if (currentList.length <= 1) {
      alert("At least one check entry is required.");
      return;
    }
    const updated = currentList.filter((item) => item.id !== id);
    updateEntriesAndTotals(updated);
  };

  // Auto-sync / pull check lines from approved Annex 3 and Annex 4 documents
  const syncFromBillings = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const docs = data.documents || [];

      const pulledEntries: Annex8CheckEntry[] = [];
      let counter = 1;
      let baseCheck = 1029400;

      interface SyncedBillingDoc {
        annexType?: { number?: number };
        formData?: {
          batchNumber?: string;
          totalGrantees?: number;
          totalSubsidy?: number | string;
          managementFeeAmount?: number | string;
          billingDate?: string;
        };
      }

      docs.forEach((doc: SyncedBillingDoc) => {
        if (
          (doc.annexType?.number === 3 || doc.annexType?.number === 4) &&
          doc.formData?.totalSubsidy
        ) {
          const batch = doc.formData.batchNumber || "1";
          const count = doc.formData.totalGrantees || 0;
          const stipendAmt = Number(doc.formData.totalSubsidy) || 0;
          const ascAmt = Number(doc.formData.managementFeeAmount) || 0;

          // TES Stipend check
          pulledEntries.push({
            id: `sync-chk-${counter++}`,
            checkDate: doc.formData.billingDate || new Date().toISOString().split("T")[0],
            checkNo: String(baseCheck++),
            dvPayrollNo: `DV-2024-0${counter}`,
            responsibilityCenterCode: "10-001-03-00001",
            payee: `MinSU TDP Beneficiaries (Batch ${batch} - ${count} Grantees)`,
            purposeOfPayment: "TES",
            amount: stipendAmt,
          });

          // ASC Management Fee check
          if (ascAmt > 0) {
            pulledEntries.push({
              id: `sync-chk-${counter++}`,
              checkDate: doc.formData.billingDate || new Date().toISOString().split("T")[0],
              checkNo: String(baseCheck++),
              dvPayrollNo: `DV-2024-0${counter}`,
              responsibilityCenterCode: "10-001-03-00001",
              payee: "Mindoro State University (TES/TDP Office)",
              purposeOfPayment: "ASC",
              amount: ascAmt,
            });
          }
        }
      });

      if (pulledEntries.length > 0) {
        updateEntriesAndTotals(pulledEntries);
        setSyncMessage(`Successfully imported ${pulledEntries.length} check records from approved TDP billings.`);
      } else {
        setSyncMessage("No existing Annex 3/4 billing statements found. Retained existing entries.");
      }
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setSyncMessage("Failed to auto-populate from billing packages.");
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
        const payload = {
          title: docTitle,
          annexTypeId: annexTypeId,
          formData: formData,
          submitDirectly,
        };

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create Annex 8 document");
        }

        const createdDoc = await res.json();
        const docId = createdDoc.document?.id || createdDoc.id;
        setSaveSuccess(true);
        if (onSaved) onSaved(docId);
        else router.push(`/documents/${docId}`);
      } else {
        const payload = {
          title: docTitle,
          formData: formData,
        };

        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update Annex 8 document");
        }

        if (submitDirectly) {
          await fetch(`/api/documents/${documentId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: "Submitted from Annex 8 Suite" }),
          });
        }

        setSaveSuccess(true);
        if (onSaved && documentId) onSaved(documentId);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/annex-8/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate Excel file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeReportNo = String(formData?.reportNo || "Report").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Annex_8_RCI_${safeReportNo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  // Native Print / PDF
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    const list = Array.isArray(formData.entries) ? formData.entries : [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (e) =>
        String(e.checkNo || "").toLowerCase().includes(term) ||
        String(e.payee || "").toLowerCase().includes(term) ||
        String(e.dvPayrollNo || "").toLowerCase().includes(term) ||
        String(e.purposeOfPayment || "").toLowerCase().includes(term)
    );
  }, [formData.entries, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-line shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-minsu-green-50 text-minsu-green-700 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">
              TDP Form – Annex 8: Report of Checks Issued (RCI)
            </h2>
            <p className="text-xs text-ink-muted">
              Official MinSU Cashier check register backing up FUR (Annex 6) disbursements
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode("workspace")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${viewMode === "workspace"
                ? "bg-white text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 inline mr-1.5" />
              Workspace Mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sheet")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${viewMode === "sheet"
                ? "bg-minsu-green-700 text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
                }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Official Sheet Canvas
            </button>
          </div>

          {/* Export Excel Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs font-medium border-emerald-600 text-emerald-800 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel (.xlsx)
          </Button>

          {/* Export PDF / Print Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-medium border-neutral-300 text-neutral-800 hover:bg-neutral-50"
          >
            <Printer className="w-4 h-4 mr-1.5 text-neutral-600" />
            Export PDF / Print
          </Button>

          {/* Save / Submit Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-minsu-green-700 hover:bg-minsu-green-800 text-white text-xs font-medium"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            {mode === "create" ? "Save as Draft" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Report of Checks Issued (RCI) saved successfully.</span>
        </div>
      )}
      {syncMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2 print:hidden">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* WORKSPACE MODE */}
      {viewMode === "workspace" && (
        <div className="space-y-6 print:hidden">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Total Checks Issued</span>
              <div className="text-2xl font-bold text-ink flex items-baseline gap-2">
                <span>{(formData.entries || []).length}</span>
                <span className="text-xs text-ink-muted font-normal">checks</span>
              </div>
              <span className="text-[11px] text-minsu-green-700 mt-1 block font-medium">
                Backs up Annex 6 Disbursements
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Total Amount Disbursed</span>
              <div className="text-2xl font-bold text-minsu-green-700 font-mono">
                ₱{(formData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Total commercial / MDS check value
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Check Number Range</span>
              <div className="text-sm font-semibold text-ink font-mono truncate">
                {formData.checkNoFrom || "---"} <span className="text-neutral-400 font-sans">to</span> {formData.checkNoTo || "---"}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block truncate">
                Report No: {formData.reportNo}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Cashier / Disbursing</span>
              <div className="text-sm font-bold text-ink truncate">
                {formData.cashierName}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block truncate">
                Signed on: {formData.dateSigned}
              </span>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              type="button"
              onClick={() => setWorkspaceTab("entries")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${workspaceTab === "entries"
                ? "border-minsu-green-700 text-minsu-green-700"
                : "border-transparent text-ink-muted hover:text-ink"
                }`}
            >
              <CheckSquare className="w-4 h-4" />
              Check Register Entries ({(formData.entries || []).length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("identification")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${workspaceTab === "identification"
                ? "border-minsu-green-700 text-minsu-green-700"
                : "border-transparent text-ink-muted hover:text-ink"
                }`}
            >
              <Building className="w-4 h-4" />
              HEI & Report Parameters
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("signatories")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${workspaceTab === "signatories"
                ? "border-minsu-green-700 text-minsu-green-700"
                : "border-transparent text-ink-muted hover:text-ink"
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Certification & Audit Signatories
            </button>
          </div>

          {/* TAB 1: Check Register Entries */}
          {workspaceTab === "entries" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-line">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by Check No., Payee, DV No., Purpose..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={syncFromBillings}
                    disabled={isSyncing}
                    className="apple-press text-xs border-minsu-gold-600/80 text-minsu-gold-700 hover:bg-minsu-gold-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                    Auto-Populate from TDP Billings
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRow}
                    className="apple-press bg-minsu-green-700 hover:bg-minsu-green-800 text-white text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Check Row
                  </Button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="bg-white rounded-2xl border border-line/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto apple-scrollbar">
                  <table className="w-full min-w-[1140px] text-xs text-left border-collapse">
                    <thead className="bg-neutral-50/80 backdrop-blur-xs border-b border-line text-ink-muted text-[11px] font-semibold uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3 px-2 w-12 text-center">#</th>
                        <th className="py-3 px-2.5 w-40 min-w-[155px]">Check Date</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">Check No.</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">DV / Payroll No.</th>
                        <th className="py-3 px-2.5 w-64 min-w-[240px]">Payee</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">Purpose (TES/ASC)</th>
                        <th className="py-3 px-2.5 w-44 min-w-[165px] text-right">Amount (₱)</th>
                        <th className="py-3 px-2 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredEntries.map((entry, index) => (
                        <tr key={entry.id} className="group hover:bg-minsu-green-50/40 transition-colors duration-150">
                          <td className="py-2 px-2 text-center text-ink-muted/80 font-mono text-[11px]">{index + 1}</td>
                          <td className="py-1.5 px-2">
                            <input
                              type="date"
                              value={entry.checkDate}
                              onChange={(e) => handleEntryChange(entry.id, "checkDate", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink transition-all duration-150 outline-none cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={entry.checkNo}
                              onChange={(e) => handleEntryChange(entry.id, "checkNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono font-medium rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="1029381"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={entry.dvPayrollNo}
                              onChange={(e) => handleEntryChange(entry.id, "dvPayrollNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="DV-2024-xxxx"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={entry.payee}
                              onChange={(e) => handleEntryChange(entry.id, "payee", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink font-medium placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Payee name / Grantees"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={entry.purposeOfPayment}
                              onChange={(e) => handleEntryChange(entry.id, "purposeOfPayment", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-medium rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink transition-all duration-150 outline-none cursor-pointer"
                            >
                              <option value="TES">TES (Stipend)</option>
                              <option value="ASC">ASC (Management Fee)</option>
                              <option value="TES/ASC">TES / ASC (Combined)</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs font-mono text-ink-muted select-none pointer-events-none">₱</span>
                              <input
                                type="number"
                                step="0.01"
                                value={entry.amount || ""}
                                onChange={(e) => handleEntryChange(entry.id, "amount", e.target.value)}
                                placeholder="0.00"
                                className="w-full py-1.5 pl-6 pr-2.5 text-xs font-mono text-right font-semibold rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink transition-all duration-150 outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(entry.id)}
                              className="apple-press inline-flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50/80 active:bg-red-100 transition-all duration-150"
                              title="Delete entry"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-ink-muted">
                            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                            <p className="font-medium text-sm">No check entries found</p>
                            <p className="text-xs text-ink-muted/80 mt-0.5">
                              {searchTerm ? "Try searching for a different keyword or check number." : "Click 'Add Check Row' or 'Auto-Populate' to add records."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-neutral-50/90 border-t border-line text-ink">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-xs font-medium text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-minsu-green-600"></span>
                            Showing <span className="font-semibold text-ink">{filteredEntries.length}</span> {filteredEntries.length === 1 ? "entry" : "entries"}
                          </span>
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          Total Checks Issued:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-minsu-green-800 text-sm font-bold">
                          ₱{(formData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEI & Report Identification */}
          {workspaceTab === "identification" && (
            <div className="bg-white p-6 rounded-xl border border-line shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Institution & Report Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Name of HEI</label>
                  <input
                    type="text"
                    value={formData.heiName}
                    onChange={(e) => setFormData({ ...formData, heiName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Address of HEI</label>
                  <input
                    type="text"
                    value={formData.heiAddress}
                    onChange={(e) => setFormData({ ...formData, heiAddress: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Date of Report</label>
                  <input
                    type="text"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="June 30, 2024"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Report Number</label>
                  <input
                    type="text"
                    value={formData.reportNo}
                    onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="2024-001"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Sheet Number</label>
                  <input
                    type="text"
                    value={formData.sheetNo}
                    onChange={(e) => setFormData({ ...formData, sheetNo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="1 of 1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Certification & Signatories */}
          {workspaceTab === "signatories" && (
            <div className="bg-white p-6 rounded-xl border border-line shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-ink mb-1">Cashier Certification Oath</h3>
                <p className="text-xs text-ink-muted">
                  Official sworn statement by the Cashier certifying all checks issued in the period.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg border border-line text-xs text-ink leading-relaxed">
                <span className="font-semibold block mb-2 text-ink uppercase tracking-wide">
                  Statutory Declaration:
                </span>
                I hereby certify on my official oath that this Report of Checks Issued in one (1) sheet is a full, true and correct statement of all checks issued by me during the period stated above for which Check Nos.{" "}
                <strong className="underline font-mono">{formData.checkNoFrom || "__________"}</strong> to{" "}
                <strong className="underline font-mono">{formData.checkNoTo || "__________"}</strong> inclusive, were actually issued by me in payment for obligations shown in the attached disbursement vouchers/payroll.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Starting Check No. (From)</label>
                  <input
                    type="text"
                    value={formData.checkNoFrom}
                    onChange={(e) => setFormData({ ...formData, checkNoFrom: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="1029381"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Ending Check No. (To)</label>
                  <input
                    type="text"
                    value={formData.checkNoTo}
                    onChange={(e) => setFormData({ ...formData, checkNoTo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="1029384"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Cashier Name (Signatory)</label>
                  <input
                    type="text"
                    value={formData.cashierName}
                    onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Date Signed</label>
                  <input
                    type="text"
                    value={formData.dateSigned}
                    onChange={(e) => setFormData({ ...formData, dateSigned: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wide mb-3">
                  Administrative Signatory Hierarchy
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-ink-muted mb-1 font-medium">Accountant (Certified true & correct)</label>
                    <input
                      type="text"
                      value={formData.accountantName}
                      onChange={(e) => setFormData({ ...formData, accountantName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-muted mb-1 font-medium">Head/President of HEI (Approved by)</label>
                    <input
                      type="text"
                      value={formData.presidentName}
                      onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-muted mb-1 font-medium">Auditor (Verified by - COA/State Auditor)</label>
                    <input
                      type="text"
                      value={formData.auditorName}
                      onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL CANVAS RENDER FUNCTION */}
      {(() => {
        const renderOfficialRciSheet = (editableLogo: boolean = true) => (
          <div className="w-[1020px] bg-white text-black p-10 shadow-2xl border border-neutral-300 print:shadow-none print:border-none print:p-0 print:w-full font-serif text-[11px] leading-tight text-left">
            {/* Top Tag */}
            <div className="flex justify-end mb-2">
              <span className="italic text-xs font-sans font-semibold tracking-wide text-neutral-800">
                TDP Form - Annex 8 (RCI)
              </span>
            </div>

            {/* Dual Logo Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <AnnexLogo
                  position="left"
                  config={formData.headerLogos?.leftLogo}
                  defaultPreset="ched"
                  editable={editableLogo}
                  documentId={documentId}
                  className="w-20 h-20"
                  onLogoChange={handleLeftLogoChange}
                />
              </div>
              <div className="text-center flex-1 px-4">
                <h1 className="text-base font-bold tracking-tight uppercase font-sans mb-1">
                  REPORT OF CHECKS ISSUED
                </h1>
                <p className="text-xs font-sans font-bold uppercase">{formData.heiName || "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS"}</p>
                <p className="text-[10px] font-sans text-neutral-700">{formData.heiAddress || "Labasan, Bongabong, Oriental Mindoro"}</p>
                <p className="text-xs font-sans mt-2">
                  Date: <span className="font-semibold underline decoration-neutral-400">{formData.reportDate || "___________________________"}</span>
                </p>
              </div>
              <div className="w-20 h-20 flex items-center justify-center">
                <AnnexLogo
                  position="right"
                  config={formData.headerLogos?.rightLogo}
                  defaultPreset="unifast"
                  editable={editableLogo}
                  documentId={documentId}
                  className="w-20 h-20"
                  onLogoChange={handleRightLogoChange}
                />
              </div>
            </div>

            {/* Identification Fields */}
            <div className="grid grid-cols-12 gap-y-1 mb-4 text-[10px] font-sans">
              <div className="col-span-8 flex items-baseline">
                <span className="font-bold w-24">HEI Name:</span>
                <span className="font-medium text-[11px]">{formData.heiName || "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS"}</span>
              </div>
              <div className="col-span-4 space-y-0.5 pl-6">
                <div className="flex">
                  <span className="font-bold w-24">Report No.:</span>
                  <span className="border-b border-black flex-1 font-mono font-medium">{formData.reportNo || "---"}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24">Sheet No.:</span>
                  <span className="border-b border-black flex-1">{formData.sheetNo || "1 of 1"}</span>
                </div>
              </div>
            </div>

            {/* Main Official Grid (7 visible columns matching preview) */}
            <table className="w-full border-collapse border border-black text-[9px] font-sans">
              <thead>
                <tr className="border border-black bg-neutral-50/70 text-center font-bold">
                  <th colSpan={2} className="border border-black p-1.5 w-40">
                    Check Issued
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-32">
                    DV/Payroll No.
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 min-w-[200px]">
                    Payee
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-36">
                    Purpose of Payment<br />(TES/ASC)
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-32 text-right">
                    Amount
                  </th>
                </tr>
                <tr className="border border-black bg-neutral-50/70 text-center font-bold">
                  <th className="border border-black p-1 w-20">Date</th>
                  <th className="border border-black p-1 w-20">Check No.</th>
                </tr>
              </thead>
              <tbody>
                {(formData.entries || []).map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-300">
                    <td className="border-r border-black p-1.5 text-center font-mono">{entry.checkDate}</td>
                    <td className="border-r border-black p-1.5 text-center font-mono font-medium">{entry.checkNo}</td>
                    <td className="border-r border-black p-1.5 text-center font-mono">{entry.dvPayrollNo}</td>
                    <td className="border-r border-black p-1.5 font-medium">{entry.payee}</td>
                    <td className="border-r border-black p-1.5 text-center font-semibold">{entry.purposeOfPayment}</td>
                    <td className="border-r border-black p-1.5 text-right font-mono font-medium">
                      {Number(entry.amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}

                {/* Empty filler rows to match official government paper height */}
                {Array.from({ length: Math.max(0, 10 - (formData.entries || []).length) }).map((_, i) => (
                  <tr key={`fill-${i}`} className="border-b border-neutral-200 h-6">
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                    <td className="border-r border-black p-1"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={5} className="border-r border-black p-2 text-right uppercase tracking-wider text-[10px]">
                    TOTAL
                  </td>
                  <td className="p-2 text-right font-mono text-[10px] border-b-4 border-double border-black">
                    {(formData.totalAmount || 0) > 0
                      ? `₱${(formData.totalAmount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                      : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Certification Block */}
            <div className="mt-6 border border-black p-4 text-[10px] font-sans">
              <div className="text-center font-bold tracking-wider uppercase mb-3">
                C E R T I F I C A T I O N
              </div>
              <p className="text-center max-w-2xl mx-auto leading-relaxed mb-6">
                I hereby certify on my official oath that this Report of Checks Issued in one (1) sheet is a full, true and correct statement of all checks issued by me during the period stated above for which Check Nos.{" "}
                <span className="font-bold underline font-mono px-2">{formData.checkNoFrom || "__________"}</span> to{" "}
                <span className="font-bold underline font-mono px-2">{formData.checkNoTo || "__________"}</span>{" "}
                inclusive, were actually issued by me in payment for obligations shown in the attached disbursement vouchers/payroll.
              </p>

              <div className="flex flex-col items-center">
                <div className="font-bold uppercase tracking-wide text-[10px]">
                  {formData.cashierName || "MARIA LIZA M. HERNANDEZ"}
                </div>
                <div className="text-[9px] text-neutral-600 mb-1">
                  (Signature above printed name)
                </div>
                <div className="font-semibold text-[10px] mb-4">Cashier</div>

                <div className="text-[9px]">
                  Date Signed: <span className="font-mono font-medium underline px-2">{formData.dateSigned || "June 30, 2024"}</span>
                </div>
              </div>
            </div>

            {/* Lower Signatory Tri-Block */}
            <div className="mt-8 space-y-6 text-[10px] font-sans">
              {/* Accountant */}
              <div>
                <div className="text-[9px] mb-6">Certified true and correct by:</div>
                <div className="w-64 border-b border-black mb-0.5 text-center font-bold uppercase">
                  {formData.accountantName || "MA. ELENA L. BAUTISTA, CPA"}
                </div>
                <div className="text-[8px] text-neutral-600">(Signature over printed name)</div>
                <div className="font-semibold text-[9px]">Accountant</div>
              </div>

              {/* President & Auditor in 2 columns */}
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <div className="text-[9px] mb-6">Approved by:</div>
                  <div className="w-64 border-b border-black mb-0.5 text-center font-bold uppercase">
                    {formData.presidentName || "DR. EMMANUEL C. MACALALAD"}
                  </div>
                  <div className="text-[8px] text-neutral-600">(Signature over printed name)</div>
                  <div className="font-semibold text-[9px]">Head/President of HEI</div>
                </div>

                <div>
                  <div className="text-[9px] mb-6">Verified by:</div>
                  <div className="w-64 border-b border-black mb-0.5 text-center font-bold uppercase">
                    {formData.auditorName || "ATTY. CRISTINA M. MERCADO"}
                  </div>
                  <div className="text-[8px] text-neutral-600">(Signature over printed name)</div>
                  <div className="italic text-[8px] text-neutral-700">For Public HEIs: COA/State Auditor</div>
                  <div className="italic text-[8px] text-neutral-700">For Private HEIs: Internal/External Auditor</div>
                </div>
              </div>
            </div>
          </div>
        );

        return (
          <>
            {/* OFFICIAL CANVAS MODE (Pixel-perfect reproduction of RCI_tab_preview.png) */}
            {(viewMode === "sheet" || typeof window !== "undefined") && (
              <div className={viewMode === "sheet" ? "block" : "hidden print:block"}>
                <div className="annex-printable-document bg-neutral-100 p-4 md:p-8 rounded-2xl flex justify-center overflow-x-auto print:bg-white print:p-0">
                  {renderOfficialRciSheet(true)}
                </div>
              </div>
            )}

            {/* Apple-styled Fluid Print / PDF Preview Modal */}
            <PrintPreviewModal
              isOpen={isPrintModalOpen}
              onClose={() => setIsPrintModalOpen(false)}
              documentTitle={documentTitle || "Annex 8 - Report of Checks Issued and Cancelled (RCII)"}
              annexNumber={8}
              orientation={printOrientation}
              onOrientationChange={setPrintOrientation}
              onPrint={() => {
                setViewMode("sheet");
              }}
              previewContent={
                <div className="w-full flex justify-center py-4">
                  {renderOfficialRciSheet(false)}
                </div>
              }
            />
          </>
        );
      })()}
    </div>
  );
}
