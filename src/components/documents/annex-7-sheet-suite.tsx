"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnexLogo } from "./annex-logo";
import { PrintPreviewModal } from "./print-preview-modal";
import { Annex7FormData, Annex7Entry, LogoConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Building,
  Plus,
  Trash2,
  Sparkles,
  Search,
} from "lucide-react";

interface Annex7SheetSuiteProps {
  initialData?: Annex7FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex7SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex7SheetSuiteProps) {
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
  const defaultData: Annex7FormData = useMemo(() => {
    if (initialData) return initialData;

    const initialEntries: Annex7Entry[] = [
      {
        id: "ada-1",
        adaDate: "2024-03-25",
        adaSerialNo: "ADA-2024-03-001",
        dvPayrollNo: "DV-2024-03-0145",
        orsBursNo: "ORS-2024-03-0210",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "MinSU TDP Grantees (Batch 20.1 - 10 Students)",
        uacsObjectCode: "5-02-99-990",
        natureOfPayment: "Tulong Dunong Program - Student Stipend (2nd Sem AY 2023-2024)",
        amount: 75000,
      },
      {
        id: "ada-2",
        adaDate: "2024-03-26",
        adaSerialNo: "ADA-2024-03-002",
        dvPayrollNo: "DV-2024-03-0146",
        orsBursNo: "ORS-2024-03-0211",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "Mindoro State University - Bongabong Campus (TES/TDP Office)",
        uacsObjectCode: "5-02-03-010",
        natureOfPayment: "0.5% Administrative Support Cost / Management Fee for Batch 20.1",
        amount: 375,
      },
      {
        id: "ada-3",
        adaDate: "2024-04-12",
        adaSerialNo: "ADA-2024-04-003",
        dvPayrollNo: "DV-2024-04-0202",
        orsBursNo: "ORS-2024-04-0315",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "MinSU TDP Grantees (Batch 20.2 - 90 Students)",
        uacsObjectCode: "5-02-99-990",
        natureOfPayment: "Tulong Dunong Program - Student Stipend Tranche 2",
        amount: 675000,
      },
      {
        id: "ada-4",
        adaDate: "2024-04-13",
        adaSerialNo: "ADA-2024-04-004",
        dvPayrollNo: "DV-2024-04-0203",
        orsBursNo: "ORS-2024-04-0316",
        responsibilityCenterCode: "10-001-03-00001",
        payee: "Mindoro State University - Bongabong Campus (TES/TDP Office)",
        uacsObjectCode: "5-02-03-010",
        natureOfPayment: "0.5% Administrative Support Cost / Management Fee for Batch 20.2",
        amount: 3375,
      },
    ];

    const totalAmt = initialEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      periodCovered: "January 1, 2024 to June 30, 2024",
      entityName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
      fundCluster: "01 - Regular Agency Fund",
      bankNameAccountNo: "Land Bank of the Philippines - Calapan Branch / CA # 0122-1088-24",
      reportNo: "2024-06-001",
      sheetNo: "1 of 1",
      entries: initialEntries,
      totalAmount: totalAmt,
      adaNoFrom: "ADA-2024-03-001",
      adaNoTo: "ADA-2024-04-004",
      disbursingOfficerName: "MARIA LIZA M. HERNANDEZ",
      disbursingOfficerDesignation: "Disbursing Officer / Cashier II",
      certificationDate: "June 30, 2024",
    };
  }, [initialData]);

  const [formData, setFormData] = useState<Annex7FormData>(defaultData);
  const [docTitle] = useState(
    documentTitle || `Annex 7: Report of Advice to Debit Account Issued (RADAI) - ${defaultData.periodCovered}`
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

  // Auto-compute total and ADA serial bounds
  const updateEntriesAndTotals = (newEntries: Annex7Entry[]) => {
    const totalAmount = newEntries.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    
    // Auto-detect serial bounds if present
    const serials = newEntries
      .map((e) => e.adaSerialNo.trim())
      .filter((s) => s.length > 0);
    
    const adaNoFrom = serials.length > 0 ? serials[0] : "";
    const adaNoTo = serials.length > 0 ? serials[serials.length - 1] : "";

    setFormData((prev) => ({
      ...prev,
      entries: newEntries,
      totalAmount,
      adaNoFrom: prev.adaNoFrom || adaNoFrom,
      adaNoTo: prev.adaNoTo || adaNoTo,
    }));
  };

  // Add new blank row
  const handleAddRow = () => {
    const nextSeq = formData.entries.length + 1;
    const padded = String(nextSeq).padStart(3, "0");
    const newEntry: Annex7Entry = {
      id: `ada-${Date.now()}-${nextSeq}`,
      adaDate: new Date().toISOString().split("T")[0],
      adaSerialNo: `ADA-2024-${padded}`,
      dvPayrollNo: `DV-2024-${padded}`,
      orsBursNo: `ORS-2024-${padded}`,
      responsibilityCenterCode: "10-001-03-00001",
      payee: "",
      uacsObjectCode: "5-02-99-990",
      natureOfPayment: "Tulong Dunong Program - Student Stipend",
      amount: 0,
    };
    updateEntriesAndTotals([...formData.entries, newEntry]);
  };

  // Update specific row field
  const handleEntryChange = (id: string, field: keyof Annex7Entry, value: string | number) => {
    const updated = formData.entries.map((item) => {
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
    if (formData.entries.length <= 1) {
      alert("At least one entry is required.");
      return;
    }
    const updated = formData.entries.filter((item) => item.id !== id);
    updateEntriesAndTotals(updated);
  };

  // Auto-sync / pull disbursement lines from approved Annex 3 and Annex 4 documents
  const syncFromBillings = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const docs = data.documents || [];

      const pulledEntries: Annex7Entry[] = [];
      let counter = 1;

      interface SyncedBillingDoc {
        annexType?: { number?: number };
        formData?: {
          batchNumber?: string;
          termCode?: string;
          academicYear?: string;
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
          const sem = doc.formData.termCode === "2" ? "2nd Sem" : "1st Sem";
          const ay = doc.formData.academicYear || "2023-2024";
          const count = doc.formData.totalGrantees || 0;
          const stipendAmt = Number(doc.formData.totalSubsidy) || 0;
          const ascAmt = Number(doc.formData.managementFeeAmount) || 0;

          // Stipend entry
          pulledEntries.push({
            id: `sync-ada-${counter++}`,
            adaDate: doc.formData.billingDate || new Date().toISOString().split("T")[0],
            adaSerialNo: `ADA-2024-${String(counter).padStart(3, "0")}`,
            dvPayrollNo: `DV-${ay.slice(0, 4)}-${String(counter * 10).padStart(4, "0")}`,
            orsBursNo: `ORS-${ay.slice(0, 4)}-${String(counter * 15).padStart(4, "0")}`,
            responsibilityCenterCode: "10-001-03-00001",
            payee: `MinSU TDP Beneficiaries (Batch ${batch} - ${count} Grantees)`,
            uacsObjectCode: "5-02-99-990",
            natureOfPayment: `Payment of TDP Stipend for ${sem} AY ${ay}`,
            amount: stipendAmt,
          });

          // Management Fee / ASC entry if present
          if (ascAmt > 0) {
            pulledEntries.push({
              id: `sync-ada-${counter++}`,
              adaDate: doc.formData.billingDate || new Date().toISOString().split("T")[0],
              adaSerialNo: `ADA-2024-${String(counter).padStart(3, "0")}`,
              dvPayrollNo: `DV-${ay.slice(0, 4)}-${String(counter * 10 + 1).padStart(4, "0")}`,
              orsBursNo: `ORS-${ay.slice(0, 4)}-${String(counter * 15 + 1).padStart(4, "0")}`,
              responsibilityCenterCode: "10-001-03-00001",
              payee: "Mindoro State University (TES/TDP Management Office)",
              uacsObjectCode: "5-02-03-010",
              natureOfPayment: `0.5% Administrative Support Cost / Management Fee for Batch ${batch}`,
              amount: ascAmt,
            });
          }
        }
      });

      if (pulledEntries.length > 0) {
        updateEntriesAndTotals(pulledEntries);
        setSyncMessage(`Successfully imported ${pulledEntries.length} disbursement records from approved TDP billings.`);
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
          status: submitDirectly ? "SUBMITTED" : "DRAFT",
        };

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create Annex 7 document");
        }

        const createdDoc = await res.json();
        setSaveSuccess(true);
        if (onSaved) onSaved(createdDoc.id);
        else router.push(`/documents/${createdDoc.id}`);
      } else {
        const payload = {
          formData: formData,
          status: submitDirectly ? "SUBMITTED" : undefined,
        };

        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update Annex 7 document");
        }

        setSaveSuccess(true);
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
      const res = await fetch("/api/annex-7/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate Excel file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Annex_7_RADAI_${formData.reportNo.replace(/\s+/g, "_") || "Report"}.xlsx`;
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
    if (!searchTerm.trim()) return formData.entries;
    const term = searchTerm.toLowerCase();
    return formData.entries.filter(
      (e) =>
        e.adaSerialNo.toLowerCase().includes(term) ||
        e.payee.toLowerCase().includes(term) ||
        e.dvPayrollNo.toLowerCase().includes(term) ||
        e.natureOfPayment.toLowerCase().includes(term) ||
        e.orsBursNo.toLowerCase().includes(term)
    );
  }, [formData.entries, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-line shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-minsu-green-50 text-minsu-green-700 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">
              TDP Form – Annex 7: Report of Advice to Debit Account Issued (RADAI)
            </h2>
            <p className="text-xs text-ink-muted">
              Official MinSU Disbursing Officer report backing up FUR (Annex 6) disbursements
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode("workspace")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === "workspace"
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
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === "sheet"
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
          <span>Report of Advice to Debit Account Issued (RADAI) saved successfully.</span>
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
              <span className="text-xs text-ink-muted block mb-1">Total ADAs Recorded</span>
              <div className="text-2xl font-bold text-ink flex items-baseline gap-2">
                <span>{formData.entries.length}</span>
                <span className="text-xs text-ink-muted font-normal">transactions</span>
              </div>
              <span className="text-[11px] text-minsu-green-700 mt-1 block font-medium">
                Backs up Annex 6 Disbursements
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Total Disbursed Amount</span>
              <div className="text-2xl font-bold text-minsu-green-700 font-mono">
                ₱{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Total debit instruction to bank
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">ADA Serial Range</span>
              <div className="text-sm font-semibold text-ink font-mono truncate">
                {formData.adaNoFrom || "---"} <span className="text-neutral-400 font-sans">to</span> {formData.adaNoTo || "---"}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block truncate">
                Report No: {formData.reportNo}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Disbursing Officer</span>
              <div className="text-sm font-bold text-ink truncate">
                {formData.disbursingOfficerName}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block truncate">
                {formData.disbursingOfficerDesignation}
              </span>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              type="button"
              onClick={() => setWorkspaceTab("entries")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                workspaceTab === "entries"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              ADA Disbursement Entries ({formData.entries.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("identification")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                workspaceTab === "identification"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Building className="w-4 h-4" />
              Entity & Bank Details
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("signatories")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                workspaceTab === "signatories"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Certification & Oath
            </button>
          </div>

          {/* TAB 1: ADA Entries Masterlist */}
          {workspaceTab === "entries" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-line">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by ADA Serial, Payee, DV No., ORS No..."
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
                    Add ADA Row
                  </Button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="bg-white rounded-2xl border border-line/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto apple-scrollbar">
                  <table className="w-full min-w-[1340px] text-xs text-left border-collapse">
                    <thead className="bg-neutral-50/80 backdrop-blur-xs border-b border-line text-ink-muted text-[11px] font-semibold uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3 px-2 w-12 text-center">#</th>
                        <th className="py-3 px-2.5 w-40 min-w-[155px]">ADA Date</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">ADA Serial No.</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">DV / Payroll No.</th>
                        <th className="py-3 px-2.5 w-44 min-w-[160px]">ORS / BURS No.</th>
                        <th className="py-3 px-2.5 w-60 min-w-[220px]">Payee</th>
                        <th className="py-3 px-2.5 w-36 min-w-[130px]">UACS Code</th>
                        <th className="py-3 px-2.5 min-w-[240px]">Nature of Payment</th>
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
                              value={entry.adaDate}
                              onChange={(e) => handleEntryChange(entry.id, "adaDate", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink transition-all duration-150 outline-none cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={entry.adaSerialNo}
                              onChange={(e) => handleEntryChange(entry.id, "adaSerialNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono font-medium rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="ADA-2024-xxx"
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
                              value={entry.orsBursNo}
                              onChange={(e) => handleEntryChange(entry.id, "orsBursNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="ORS-2024-xxxx"
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
                            <input
                              type="text"
                              value={entry.uacsObjectCode}
                              onChange={(e) => handleEntryChange(entry.id, "uacsObjectCode", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="5-02-99-990"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={entry.natureOfPayment}
                              onChange={(e) => handleEntryChange(entry.id, "natureOfPayment", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Purpose / Stipend details"
                            />
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
                          <td colSpan={10} className="py-12 text-center text-ink-muted">
                            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                            <p className="font-medium text-sm">No ADA entries found</p>
                            <p className="text-xs text-ink-muted/80 mt-0.5">
                              {searchTerm ? "Try searching for a different keyword or serial number." : "Click 'Add ADA Row' or 'Auto-Populate' to add records."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-neutral-50/90 border-t border-line text-ink">
                      <tr>
                        <td colSpan={6} className="py-3 px-4 text-xs font-medium text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-minsu-green-600"></span>
                            Showing <span className="font-semibold text-ink">{filteredEntries.length}</span> {filteredEntries.length === 1 ? "entry" : "entries"}
                          </span>
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          Total Amount of ADAs Issued:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-minsu-green-800 text-sm font-bold">
                          ₱{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Entity & Bank Details */}
          {workspaceTab === "identification" && (
            <div className="bg-white p-6 rounded-xl border border-line shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Entity Identification & Bank Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Entity Name</label>
                  <input
                    type="text"
                    value={formData.entityName}
                    onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Fund Cluster</label>
                  <input
                    type="text"
                    value={formData.fundCluster}
                    onChange={(e) => setFormData({ ...formData, fundCluster: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="01 - Regular Agency Fund"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Bank Name / Account No.</label>
                  <input
                    type="text"
                    value={formData.bankNameAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankNameAccountNo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Period Covered</label>
                  <input
                    type="text"
                    value={formData.periodCovered}
                    onChange={(e) => setFormData({ ...formData, periodCovered: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="January 1, 2024 to June 30, 2024"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Report Number</label>
                  <input
                    type="text"
                    value={formData.reportNo}
                    onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="2024-06-001"
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
                <h3 className="text-sm font-bold text-ink mb-1">Official Certification Oath</h3>
                <p className="text-xs text-ink-muted">
                  Under the CHED-UniFAST guidelines, the Disbursing Officer certifies the exact span of ADAs issued under official oath.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg border border-line text-xs text-ink leading-relaxed">
                <span className="font-semibold block mb-2 text-ink uppercase tracking-wide">
                  Statutory Declaration:
                </span>
                I hereby certify on my official oath that the above is a true statement of all ADAs issued by me during the period stated above for which ADA Nos.{" "}
                <strong className="underline font-mono">{formData.adaNoFrom || "__________"}</strong> to{" "}
                <strong className="underline font-mono">{formData.adaNoTo || "__________"}</strong> inclusive, were actually issued by me in the amounts shown thereon.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Starting ADA Serial No. (From)</label>
                  <input
                    type="text"
                    value={formData.adaNoFrom}
                    onChange={(e) => setFormData({ ...formData, adaNoFrom: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="ADA-2024-03-001"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Ending ADA Serial No. (To)</label>
                  <input
                    type="text"
                    value={formData.adaNoTo}
                    onChange={(e) => setFormData({ ...formData, adaNoTo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="ADA-2024-04-004"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Disbursing Officer / Cashier Name</label>
                  <input
                    type="text"
                    value={formData.disbursingOfficerName}
                    onChange={(e) => setFormData({ ...formData, disbursingOfficerName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Official Designation</label>
                  <input
                    type="text"
                    value={formData.disbursingOfficerDesignation}
                    onChange={(e) => setFormData({ ...formData, disbursingOfficerDesignation: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Certification Date</label>
                  <input
                    type="text"
                    value={formData.certificationDate}
                    onChange={(e) => setFormData({ ...formData, certificationDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL CANVAS MODE (Pixel-perfect reproduction of RADAI_tab_preview.png) */}
      {(viewMode === "sheet" || typeof window !== "undefined") && (
        <div className={viewMode === "sheet" ? "block" : "hidden print:block"}>
          <div className="annex-printable-document bg-neutral-100 p-4 md:p-8 rounded-2xl flex justify-center overflow-x-auto print:bg-white print:p-0">
            {/* Standard Letter Paper Canvas */}
            <div className="w-[1020px] bg-white text-black p-10 shadow-2xl border border-neutral-300 print:shadow-none print:border-none print:p-0 print:w-full font-serif text-[11px] leading-tight">
              
              {/* Top Tag */}
              <div className="flex justify-end mb-2">
                <span className="italic text-xs font-sans font-semibold tracking-wide text-neutral-800">
                  TDP Form - Annex 7
                </span>
              </div>

              {/* Dual Logo Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-20 flex items-center justify-center">
                  <AnnexLogo
                    position="left"
                    config={formData.headerLogos?.leftLogo}
                    defaultPreset="ched"
                    editable={true}
                    documentId={documentId}
                    className="w-20 h-20"
                    onLogoChange={handleLeftLogoChange}
                  />
                </div>
                <div className="text-center flex-1 px-4">
                  <h1 className="text-base font-bold tracking-tight uppercase font-sans mb-1">
                    REPORT OF ADVICE TO DEBIT ACCOUNT ISSUED
                  </h1>
                  <p className="text-xs font-sans">
                    Period Covered: <span className="font-semibold underline decoration-neutral-400">{formData.periodCovered || "___________________________"}</span>
                  </p>
                </div>
                <div className="w-20 h-20 flex items-center justify-center">
                  <AnnexLogo
                    position="right"
                    config={formData.headerLogos?.rightLogo}
                    defaultPreset="unifast"
                    editable={true}
                    documentId={documentId}
                    className="w-20 h-20"
                    onLogoChange={handleRightLogoChange}
                  />
                </div>
              </div>

              {/* Identification Fields */}
              <div className="grid grid-cols-12 gap-y-1 mb-4 text-[10px] font-sans">
                <div className="col-span-8 space-y-0.5">
                  <div className="flex">
                    <span className="font-semibold w-36">Entity Name :</span>
                    <span className="border-b border-black flex-1 font-medium">{formData.entityName}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-36">Fund Cluster :</span>
                    <span className="border-b border-black flex-1">{formData.fundCluster}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-36">Bank Name/Account No. :</span>
                    <span className="border-b border-black flex-1 font-mono">{formData.bankNameAccountNo}</span>
                  </div>
                </div>
                <div className="col-span-4 space-y-0.5 pl-6">
                  <div className="flex">
                    <span className="font-semibold w-24">Report No.:</span>
                    <span className="border-b border-black flex-1 font-mono font-medium">{formData.reportNo}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Sheet No.:</span>
                    <span className="border-b border-black flex-1">{formData.sheetNo}</span>
                  </div>
                </div>
              </div>

              {/* Main Official Grid */}
              <table className="w-full border-collapse border border-black text-[9px] font-sans">
                <thead>
                  <tr className="border border-black bg-neutral-50/70 text-center font-bold">
                    <th colSpan={2} className="border border-black p-1.5 w-40">
                      ADA
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-24">
                      DV/Payroll No.
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-24">
                      ORS/BURS No.
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-24">
                      Responsibility Center Code
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-44">
                      Payee
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-24">
                      UACS Object Code
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 min-w-[150px]">
                      Nature of Payment
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-28 text-right">
                      Amount
                    </th>
                  </tr>
                  <tr className="border border-black bg-neutral-50/70 text-center font-bold">
                    <th className="border border-black p-1 w-20">Date</th>
                    <th className="border border-black p-1 w-20">Serial No.</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-neutral-300">
                      <td className="border-r border-black p-1.5 text-center font-mono">{entry.adaDate}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono font-medium">{entry.adaSerialNo}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono">{entry.dvPayrollNo}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono">{entry.orsBursNo}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono">{entry.responsibilityCenterCode}</td>
                      <td className="border-r border-black p-1.5 font-medium">{entry.payee}</td>
                      <td className="border-r border-black p-1.5 text-center font-mono">{entry.uacsObjectCode}</td>
                      <td className="border-r border-black p-1.5">{entry.natureOfPayment}</td>
                      <td className="border-r border-black p-1.5 text-right font-mono font-medium">
                        {Number(entry.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}

                  {/* Empty filler rows to match official government paper height */}
                  {Array.from({ length: Math.max(0, 15 - formData.entries.length) }).map((_, i) => (
                    <tr key={`fill-${i}`} className="border-b border-neutral-200 h-6">
                      <td className="border-r border-black p-1"></td>
                      <td className="border-r border-black p-1"></td>
                      <td className="border-r border-black p-1"></td>
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
                    <td colSpan={8} className="border-r border-black p-2 text-right uppercase tracking-wider text-[10px]">
                      Total
                    </td>
                    <td className="p-2 text-right font-mono text-[10px] border-b-4 border-double border-black">
                      ₱{formData.totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Certification Block */}
              <div className="mt-8 border border-black p-4 text-[10px] font-sans">
                <div className="text-center font-bold tracking-wider uppercase mb-3">
                  CERTIFICATION
                </div>
                <p className="text-center max-w-2xl mx-auto leading-relaxed mb-8">
                  I hereby certify on my official oath that the above is a true statement of all ADAs issued by me during the period stated above for which ADA Nos.{" "}
                  <span className="font-bold underline font-mono px-2">{formData.adaNoFrom || "__________"}</span> to{" "}
                  <span className="font-bold underline font-mono px-2">{formData.adaNoTo || "__________"}</span>{" "}
                  inclusive, were actually issued by me in the amounts shown thereon.
                </p>

                <div className="flex flex-col items-center">
                  <div className="w-80 border-b border-black mb-1"></div>
                  <div className="font-bold uppercase tracking-wide text-[10px]">
                    {formData.disbursingOfficerName}
                  </div>
                  <div className="text-[9px] text-neutral-600 mb-6">
                    Name and Signature of Disbursing Officer/Cashier
                  </div>

                  <div className="flex justify-between w-full max-w-xl text-[9px] px-8">
                    <div className="text-center">
                      <div className="w-48 border-b border-black mb-1 font-medium">
                        {formData.disbursingOfficerDesignation}
                      </div>
                      <span className="text-neutral-600">Official Designation</span>
                    </div>
                    <div className="text-center">
                      <div className="w-36 border-b border-black mb-1 font-mono">
                        {formData.certificationDate}
                      </div>
                      <span className="text-neutral-600">Date</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Apple-styled Fluid Print / PDF Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle={documentTitle || "Annex 7 - Report of Advice to Debit Account Issued (RADAI)"}
        annexNumber={7}
        orientation={printOrientation}
        onOrientationChange={setPrintOrientation}
        previewContent={
          <div className="text-black text-xs space-y-3">
            <div className="p-4 border border-dashed border-neutral-300 rounded bg-[#F1F8F1]">
              <div className="font-bold text-sm text-[#123F17]">
                TDP Annex 7 - Report of Advice to Debit Account Issued (RADAI)
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                Bank / Account: {formData.bankNameAccountNo} • Total Entries: {formData.entries.length} • Total Amount: ₱{formData.totalAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-2 italic">
                Official accounting disbursement ledger formatted in Landscape orientation.
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
