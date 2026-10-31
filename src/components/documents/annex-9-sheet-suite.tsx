"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnnexLogo } from "./annex-logo";
import { PrintPreviewModal } from "./print-preview-modal";
import { Annex9FormData, Annex9GranteePayroll, LogoConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Building,
  Plus,
  Trash2,
  Sparkles,
  Search,
  DollarSign,
  DownloadCloud,
} from "lucide-react";

interface Annex9SheetSuiteProps {
  initialData?: Annex9FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex9SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex9SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" or "sheet" (Official Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [workspaceTab, setWorkspaceTab] = useState<"payroll" | "parameters" | "signatories">("payroll");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
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
  const defaultData: Annex9FormData = useMemo(() => {
    if (initialData) return initialData;

    const initialGrantees: Annex9GranteePayroll[] = [
      {
        id: "g-1",
        seqNo: 1,
        tdpAwardNo: "TDP-2023-IVB-00101",
        studentIdNo: "21-0492",
        lastName: "DELA CRUZ",
        givenName: "JUAN",
        middleInitial: "P.",
        degreeProgram: "BS Information Technology",
        yearLevel: "3",
        firstSemAmount: 7500,
        firstSemDateReceived: "2024-03-25",
        firstSemSignature: "J. Dela Cruz",
        secondSemAmount: 0,
        secondSemDateReceived: "",
        secondSemSignature: "",
      },
      {
        id: "g-2",
        seqNo: 2,
        tdpAwardNo: "TDP-2023-IVB-00102",
        studentIdNo: "21-0493",
        lastName: "SANTOS",
        givenName: "MARIA",
        middleInitial: "C.",
        degreeProgram: "BS Agriculture",
        yearLevel: "3",
        firstSemAmount: 7500,
        firstSemDateReceived: "2024-03-25",
        firstSemSignature: "M. Santos",
        secondSemAmount: 0,
        secondSemDateReceived: "",
        secondSemSignature: "",
      },
      {
        id: "g-3",
        seqNo: 3,
        tdpAwardNo: "TDP-2023-IVB-00103",
        studentIdNo: "22-1084",
        lastName: "REYES",
        givenName: "CARLO",
        middleInitial: "M.",
        degreeProgram: "BS Hospitality Management",
        yearLevel: "2",
        firstSemAmount: 7500,
        firstSemDateReceived: "2024-03-25",
        firstSemSignature: "C. Reyes",
        secondSemAmount: 0,
        secondSemDateReceived: "",
        secondSemSignature: "",
      },
      {
        id: "g-4",
        seqNo: 4,
        tdpAwardNo: "TDP-2023-IVB-00104",
        studentIdNo: "22-1085",
        lastName: "ALVAREZ",
        givenName: "ANGELICA",
        middleInitial: "R.",
        degreeProgram: "Bachelor of Secondary Education",
        yearLevel: "2",
        firstSemAmount: 7500,
        firstSemDateReceived: "2024-03-25",
        firstSemSignature: "A. Alvarez",
        secondSemAmount: 0,
        secondSemDateReceived: "",
        secondSemSignature: "",
      },
      {
        id: "g-5",
        seqNo: 5,
        tdpAwardNo: "TDP-2023-IVB-00105",
        studentIdNo: "20-0019",
        lastName: "GARCIA",
        givenName: "MARK",
        middleInitial: "D.",
        degreeProgram: "BS Criminology",
        yearLevel: "4",
        firstSemAmount: 7500,
        firstSemDateReceived: "2024-03-25",
        firstSemSignature: "M. Garcia",
        secondSemAmount: 0,
        secondSemDateReceived: "",
        secondSemSignature: "",
      },
    ];

    const firstSemTotal = initialGrantees.reduce((acc, g) => acc + (Number(g.firstSemAmount) || 0), 0);
    const secondSemTotal = initialGrantees.reduce((acc, g) => acc + (Number(g.secondSemAmount) || 0), 0);

    return {
      academicYear: "2023-2024",
      activeSemester: "1",
      campus: "Bongabong Campus",
      payrollDate: "March 28, 2024",
      heiName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
      heiAddress: "Labasan, Bongabong, Oriental Mindoro",
      grantees: initialGrantees,
      firstSemTotalAmount: firstSemTotal,
      secondSemTotalAmount: secondSemTotal,
      grandTotalAmount: firstSemTotal + secondSemTotal,
      signatories: {
        tesFocalPerson: {
          name: "DR. ARNEIL G. PEREZ",
          position: "TES Focal Person/Scholarship Coordinator",
        },
        registrar: {
          name: "DR. NEMIA H. CHAVEZ",
          position: "University/College Registrar",
        },
        accountant: {
          name: "MA. ELENA L. BAUTISTA, CPA",
          position: "Accountant",
        },
        president: {
          name: "DR. EMMANUEL C. MACALALAD",
          position: "Head/President of HEI",
        },
      },
    };
  }, [initialData]);

  const [formData, setFormData] = useState<Annex9FormData>(defaultData);
  const [docTitle] = useState(
    documentTitle ||
      `Annex 9: TDP-TES Stipend Disbursement Payroll - ${defaultData.academicYear} (${defaultData.activeSemester === "1" ? "1st Sem" : "2nd Sem"})`
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

  // Recalculate totals
  const updateGranteesAndTotals = (newGrantees: Annex9GranteePayroll[]) => {
    // Re-index seqNo
    const indexed = newGrantees.map((g, idx) => ({ ...g, seqNo: idx + 1 }));
    const firstSemTotalAmount = indexed.reduce((acc, g) => acc + (Number(g.firstSemAmount) || 0), 0);
    const secondSemTotalAmount = indexed.reduce((acc, g) => acc + (Number(g.secondSemAmount) || 0), 0);
    const grandTotalAmount = firstSemTotalAmount + secondSemTotalAmount;

    setFormData((prev) => ({
      ...prev,
      grantees: indexed,
      firstSemTotalAmount,
      secondSemTotalAmount,
      grandTotalAmount,
    }));
  };

  // Add blank scholar row
  const handleAddRow = () => {
    const nextSeq = formData.grantees.length + 1;
    const isFirstSem = formData.activeSemester === "1";
    const newGrantee: Annex9GranteePayroll = {
      id: `g-${Date.now()}-${nextSeq}`,
      seqNo: nextSeq,
      tdpAwardNo: `TDP-2023-IVB-${String(nextSeq).padStart(5, "0")}`,
      studentIdNo: "",
      lastName: "",
      givenName: "",
      middleInitial: "",
      degreeProgram: "",
      yearLevel: "1",
      firstSemAmount: isFirstSem ? 7500 : 0,
      firstSemDateReceived: isFirstSem ? formData.payrollDate : "",
      firstSemSignature: "",
      secondSemAmount: !isFirstSem ? 7500 : 0,
      secondSemDateReceived: !isFirstSem ? formData.payrollDate : "",
      secondSemSignature: "",
    };
    updateGranteesAndTotals([...formData.grantees, newGrantee]);
  };

  // Update specific field on row
  const handleGranteeChange = (
    id: string,
    field: keyof Annex9GranteePayroll,
    value: string | number
  ) => {
    const updated = formData.grantees.map((g) => {
      if (g.id === id) {
        return {
          ...g,
          [field]:
            field === "firstSemAmount" || field === "secondSemAmount"
              ? value === ""
                ? 0
                : Number(value)
              : value,
        };
      }
      return g;
    });
    updateGranteesAndTotals(updated);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (formData.grantees.length <= 1) {
      alert("At least one scholar record is required.");
      return;
    }
    const updated = formData.grantees.filter((g) => g.id !== id);
    updateGranteesAndTotals(updated);
  };

  // Bulk set all 7500 on active semester
  const handleBulkSetStipend = () => {
    const isFirstSem = formData.activeSemester === "1";
    const updated = formData.grantees.map((g) => ({
      ...g,
      [isFirstSem ? "firstSemAmount" : "secondSemAmount"]: 7500,
      [isFirstSem ? "firstSemDateReceived" : "secondSemDateReceived"]:
        g[isFirstSem ? "firstSemDateReceived" : "secondSemDateReceived"] || formData.payrollDate,
    }));
    updateGranteesAndTotals(updated);
    setImportMessage(`Set ₱7,500.00 stipend for all ${formData.grantees.length} scholars on ${isFirstSem ? "1st" : "2nd"} Semester.`);
    setTimeout(() => setImportMessage(null), 3500);
  };

  // 1-Click Import from Annex 3 / Annex 4 Billings
  const handleImportFromBillings = async () => {
    setIsImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const docs = data.documents || [];

      // Find first Annex 3 or Annex 4 with grantees
      let imported: Annex9GranteePayroll[] = [];
      let sourceTitle = "";

      for (const doc of docs) {
        if (doc.annexType?.number === 3 && doc.formData?.billedGrantees?.length > 0) {
          sourceTitle = doc.title || "Annex 3 Continuing Billing";
          imported = doc.formData.billedGrantees.map((bg: Record<string, string | number>, index: number) => ({
            id: `imported-${index + 1}`,
            seqNo: index + 1,
            tdpAwardNo: String(bg.awardNo || `TDP-2023-IVB-${String(index + 1).padStart(5, "0")}`),
            studentIdNo: String(bg.studentId || bg.studentNo || ""),
            lastName: String(bg.lastName || (typeof bg.studentName === "string" ? bg.studentName.split(",")[0]?.trim() : "")),
            givenName: String(bg.givenName || (typeof bg.studentName === "string" ? bg.studentName.split(",")[1]?.trim() : "")),
            middleInitial: String(bg.middleInitial || bg.middleName || ""),
            degreeProgram: String(bg.degreeProgram || bg.course || "BS Information Technology"),
            yearLevel: String(bg.yearLevel || "3"),
            firstSemAmount: formData.activeSemester === "1" ? 7500 : 0,
            firstSemDateReceived: formData.activeSemester === "1" ? formData.payrollDate : "",
            firstSemSignature: "",
            secondSemAmount: formData.activeSemester === "2" ? 7500 : 0,
            secondSemDateReceived: formData.activeSemester === "2" ? formData.payrollDate : "",
            secondSemSignature: "",
          }));
          break;
        } else if (doc.annexType?.number === 4 && doc.formData?.grantees?.length > 0) {
          sourceTitle = doc.title || "Annex 4 New Billing";
          imported = doc.formData.grantees.map((g: Record<string, string | number>, index: number) => ({
            id: `imported-${index + 1}`,
            seqNo: index + 1,
            tdpAwardNo: String(g.awardNo || `TDP-2023-IVB-${String(index + 1).padStart(5, "0")}`),
            studentIdNo: String(g.studentNo || ""),
            lastName: String(g.lastName || ""),
            givenName: String(g.givenName || ""),
            middleInitial: String(g.middleInitial || ""),
            degreeProgram: String(g.degreeProgram || "BS Agriculture"),
            yearLevel: String(g.yearLevel || "1"),
            firstSemAmount: formData.activeSemester === "1" ? 7500 : 0,
            firstSemDateReceived: formData.activeSemester === "1" ? formData.payrollDate : "",
            firstSemSignature: "",
            secondSemAmount: formData.activeSemester === "2" ? 7500 : 0,
            secondSemDateReceived: formData.activeSemester === "2" ? formData.payrollDate : "",
            secondSemSignature: "",
          }));
          break;
        }
      }

      if (imported.length > 0) {
        updateGranteesAndTotals(imported);
        setImportMessage(`Successfully imported ${imported.length} scholars from "${sourceTitle}".`);
      } else {
        setImportMessage("No Annex 3 or Annex 4 billing packages with grantee lists found in database.");
      }
      setTimeout(() => setImportMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setImportMessage("Failed to import grantees from billing packages.");
    } finally {
      setIsImporting(false);
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
          throw new Error(errData.error || "Failed to create Annex 9 document");
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
          throw new Error(errData.error || "Failed to update Annex 9 document");
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
      const res = await fetch("/api/annex-9/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate Excel file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Annex_9_TDP_Payroll_${formData.academicYear}_Sem${formData.activeSemester}.xlsx`;
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

  // Search filtered scholars
  const filteredGrantees = useMemo(() => {
    if (!searchTerm.trim()) return formData.grantees;
    const term = searchTerm.toLowerCase();
    return formData.grantees.filter(
      (g) =>
        g.lastName.toLowerCase().includes(term) ||
        g.givenName.toLowerCase().includes(term) ||
        g.studentIdNo.toLowerCase().includes(term) ||
        g.tdpAwardNo.toLowerCase().includes(term) ||
        g.degreeProgram.toLowerCase().includes(term)
    );
  }, [formData.grantees, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-line shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-minsu-green-50 text-minsu-green-700 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">
              TDP Form – Annex 9: TDP-TES Stipend Disbursement Payroll
            </h2>
            <p className="text-xs text-ink-muted">
              Official MinSU scholar stipend disbursement and student acknowledgment receipt payroll
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
          <span>TDP-TES Stipend Disbursement Payroll (Annex 9) saved successfully.</span>
        </div>
      )}
      {importMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2 print:hidden">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{importMessage}</span>
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
              <span className="text-xs text-ink-muted block mb-1">Total Scholars Enrolled</span>
              <div className="text-2xl font-bold text-ink flex items-baseline gap-2">
                <span>{formData.grantees.length}</span>
                <span className="text-xs text-ink-muted font-normal">beneficiaries</span>
              </div>
              <span className="text-[11px] text-minsu-green-700 mt-1 block font-medium">
                Campus: {formData.campus}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">1st Sem Payout Total</span>
              <div className="text-2xl font-bold text-minsu-green-700 font-mono">
                ₱{formData.firstSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                {formData.activeSemester === "1" ? "Active Semester Payout" : "Recorded"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">2nd Sem Payout Total</span>
              <div className="text-2xl font-bold text-minsu-green-700 font-mono">
                ₱{formData.secondSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                {formData.activeSemester === "2" ? "Active Semester Payout" : "Recorded"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs text-ink-muted block mb-1">Grand Payroll Total</span>
              <div className="text-2xl font-bold text-minsu-green-800 font-mono">
                ₱{formData.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                AY {formData.academicYear} Total Disbursements
              </span>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              type="button"
              onClick={() => setWorkspaceTab("payroll")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                workspaceTab === "payroll"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Users className="w-4 h-4" />
              Scholars Payroll Masterlist ({formData.grantees.length})
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("parameters")}
              className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                workspaceTab === "parameters"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Building className="w-4 h-4" />
              Academic & Campus Parameters
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
              Signatories Hierarchy (4 Sign-offs)
            </button>
          </div>

          {/* TAB 1: Payroll Masterlist */}
          {workspaceTab === "payroll" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-line">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by Scholar Name, Student ID, Award No., Degree..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImportFromBillings}
                    disabled={isImporting}
                    className="apple-press text-xs border-minsu-gold-600/80 text-minsu-gold-700 hover:bg-minsu-gold-50 shadow-xs"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 mr-1.5 ${isImporting ? "animate-spin" : ""}`} />
                    Import from Billings (Annex 3 / 4)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBulkSetStipend}
                    className="apple-press text-xs border-minsu-green-700/80 text-minsu-green-700 hover:bg-minsu-green-50 shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                    Set All ₱7,500 ({formData.activeSemester === "1" ? "1st Sem" : "2nd Sem"})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRow}
                    className="apple-press bg-minsu-green-700 hover:bg-minsu-green-800 text-white text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Scholar Row
                  </Button>
                </div>
              </div>

              {/* Editable Master Table */}
              <div className="bg-white rounded-2xl border border-line/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto apple-scrollbar">
                  <table className="w-full min-w-[1650px] text-xs text-left border-collapse">
                    <thead className="bg-neutral-50/80 backdrop-blur-xs border-b border-line text-ink-muted text-[11px] font-semibold uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3 px-2 w-12 text-center">#</th>
                        <th className="py-3 px-2.5 w-40 min-w-[155px]">TDP Award No.</th>
                        <th className="py-3 px-2.5 w-32 min-w-[125px]">Student ID</th>
                        <th className="py-3 px-2.5 w-36 min-w-[140px]">Last Name</th>
                        <th className="py-3 px-2.5 w-36 min-w-[140px]">Given Name</th>
                        <th className="py-3 px-1 w-14 text-center">M.I.</th>
                        <th className="py-3 px-2.5 min-w-[180px]">Degree Program</th>
                        <th className="py-3 px-1 w-14 text-center">Yr</th>
                        {/* Semester 1 */}
                        <th className="py-3 px-2.5 w-36 min-w-[140px] text-right bg-emerald-50/50 text-emerald-800 border-l border-emerald-100">1st Sem (₱)</th>
                        <th className="py-3 px-2.5 w-36 min-w-[140px] bg-emerald-50/50 text-emerald-800">1st Sem Date</th>
                        <th className="py-3 px-2.5 w-32 min-w-[125px] bg-emerald-50/50 text-emerald-800 border-r border-emerald-100">1st Sem Sign</th>
                        {/* Semester 2 */}
                        <th className="py-3 px-2.5 w-36 min-w-[140px] text-right bg-blue-50/50 text-blue-800 border-l border-blue-100">2nd Sem (₱)</th>
                        <th className="py-3 px-2.5 w-36 min-w-[140px] bg-blue-50/50 text-blue-800">2nd Sem Date</th>
                        <th className="py-3 px-2.5 w-32 min-w-[125px] bg-blue-50/50 text-blue-800 border-r border-blue-100">2nd Sem Sign</th>
                        <th className="py-3 px-2 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredGrantees.map((g, idx) => (
                        <tr key={g.id} className="group hover:bg-neutral-50/60 transition-colors duration-150">
                          <td className="py-2 px-2 text-center text-ink-muted/80 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={g.tdpAwardNo}
                              onChange={(e) => handleGranteeChange(g.id, "tdpAwardNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="TDP-2023-..."
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={g.studentIdNo}
                              onChange={(e) => handleGranteeChange(g.id, "studentIdNo", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-mono rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="21-0000"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={g.lastName}
                              onChange={(e) => handleGranteeChange(g.id, "lastName", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs font-semibold uppercase rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Last Name"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={g.givenName}
                              onChange={(e) => handleGranteeChange(g.id, "givenName", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs uppercase rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Given Name"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <input
                              type="text"
                              value={g.middleInitial}
                              onChange={(e) => handleGranteeChange(g.id, "middleInitial", e.target.value)}
                              className="w-full py-1.5 px-1 text-xs uppercase text-center rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              maxLength={3}
                              placeholder="M."
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={g.degreeProgram}
                              onChange={(e) => handleGranteeChange(g.id, "degreeProgram", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Degree Program"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <input
                              type="text"
                              value={g.yearLevel}
                              onChange={(e) => handleGranteeChange(g.id, "yearLevel", e.target.value)}
                              className="w-full py-1.5 px-1 text-xs font-mono text-center rounded-lg border border-transparent hover:border-line/70 focus:border-minsu-green-700 bg-neutral-100/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              maxLength={2}
                              placeholder="1"
                            />
                          </td>
                          {/* 1st Sem */}
                          <td className="py-1.5 px-2 bg-emerald-50/20 border-l border-emerald-100/70">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-xs font-mono text-emerald-700 select-none pointer-events-none">₱</span>
                              <input
                                type="number"
                                step="0.01"
                                value={g.firstSemAmount || ""}
                                onChange={(e) => handleGranteeChange(g.id, "firstSemAmount", e.target.value)}
                                placeholder="0.00"
                                className="w-full py-1.5 pl-5 pr-2 text-xs font-mono text-right font-semibold rounded-lg border border-transparent hover:border-emerald-300 focus:border-minsu-green-700 bg-emerald-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-emerald-900 transition-all duration-150 outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-2 bg-emerald-50/20">
                            <input
                              type="date"
                              value={g.firstSemDateReceived}
                              onChange={(e) => handleGranteeChange(g.id, "firstSemDateReceived", e.target.value)}
                              className="w-full py-1.5 px-2 text-xs font-mono rounded-lg border border-transparent hover:border-emerald-300 focus:border-minsu-green-700 bg-emerald-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink transition-all duration-150 outline-none cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2 bg-emerald-50/20 border-r border-emerald-100/70">
                            <input
                              type="text"
                              value={g.firstSemSignature}
                              onChange={(e) => handleGranteeChange(g.id, "firstSemSignature", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs italic rounded-lg border border-transparent hover:border-emerald-300 focus:border-minsu-green-700 bg-emerald-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-minsu-green-700/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Signature / Ack"
                            />
                          </td>
                          {/* 2nd Sem */}
                          <td className="py-1.5 px-2 bg-blue-50/20 border-l border-blue-100/70">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-xs font-mono text-blue-700 select-none pointer-events-none">₱</span>
                              <input
                                type="number"
                                step="0.01"
                                value={g.secondSemAmount || ""}
                                onChange={(e) => handleGranteeChange(g.id, "secondSemAmount", e.target.value)}
                                placeholder="0.00"
                                className="w-full py-1.5 pl-5 pr-2 text-xs font-mono text-right font-semibold rounded-lg border border-transparent hover:border-blue-300 focus:border-blue-600 bg-blue-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-blue-900 transition-all duration-150 outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-2 bg-blue-50/20">
                            <input
                              type="date"
                              value={g.secondSemDateReceived}
                              onChange={(e) => handleGranteeChange(g.id, "secondSemDateReceived", e.target.value)}
                              className="w-full py-1.5 px-2 text-xs font-mono rounded-lg border border-transparent hover:border-blue-300 focus:border-blue-600 bg-blue-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-ink transition-all duration-150 outline-none cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2 bg-blue-50/20 border-r border-blue-100/70">
                            <input
                              type="text"
                              value={g.secondSemSignature}
                              onChange={(e) => handleGranteeChange(g.id, "secondSemSignature", e.target.value)}
                              className="w-full py-1.5 px-2.5 text-xs italic rounded-lg border border-transparent hover:border-blue-300 focus:border-blue-600 bg-blue-50/40 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-ink placeholder:text-neutral-400 transition-all duration-150 outline-none"
                              placeholder="Signature / Ack"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(g.id)}
                              className="apple-press inline-flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50/80 active:bg-red-100 transition-all duration-150"
                              title="Delete scholar"
                              aria-label="Delete scholar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredGrantees.length === 0 && (
                        <tr>
                          <td colSpan={15} className="py-12 text-center text-ink-muted">
                            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                            <p className="font-medium text-sm">No grantee payroll records found</p>
                            <p className="text-xs text-ink-muted/80 mt-0.5">
                              {searchTerm ? "Try adjusting your search criteria." : "Click 'Add Scholar Row' or 'Import from Billings' to populate."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-neutral-50/90 border-t border-line text-ink">
                      <tr>
                        <td colSpan={8} className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          <span className="inline-flex items-center gap-1.5 font-medium normal-case">
                            <span className="w-2 h-2 rounded-full bg-minsu-green-600"></span>
                            Showing <span className="font-semibold text-ink">{filteredGrantees.length}</span> {filteredGrantees.length === 1 ? "scholar" : "scholars"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-minsu-green-800 text-xs font-bold bg-emerald-50/60 border-l border-emerald-100">
                          ₱{formData.firstSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2} className="bg-emerald-50/60 border-r border-emerald-100"></td>
                        <td className="py-3 px-3 text-right font-mono text-blue-800 text-xs font-bold bg-blue-50/60 border-l border-blue-100">
                          ₱{formData.secondSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2} className="bg-blue-50/60 border-r border-blue-100"></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Academic & Campus Parameters */}
          {workspaceTab === "parameters" && (
            <div className="bg-white p-6 rounded-xl border border-line shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Academic Parameters & Campus Setting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-mono"
                    placeholder="2023-2024"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Active Semester Focus</label>
                  <select
                    value={formData.activeSemester}
                    onChange={(e) => setFormData({ ...formData, activeSemester: e.target.value as "1" | "2" })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 bg-white font-medium"
                  >
                    <option value="1">1st Semester (Default Payout Focus)</option>
                    <option value="2">2nd Semester (Default Payout Focus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Campus Designation</label>
                  <input
                    type="text"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="Main Campus - Victoria"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">Payroll / Disbursement Date</label>
                  <input
                    type="text"
                    value={formData.payrollDate}
                    onChange={(e) => setFormData({ ...formData, payrollDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                    placeholder="March 28, 2024"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">HEI Official Name</label>
                  <input
                    type="text"
                    value={formData.heiName}
                    onChange={(e) => setFormData({ ...formData, heiName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1 font-medium">HEI Address</label>
                  <input
                    type="text"
                    value={formData.heiAddress}
                    onChange={(e) => setFormData({ ...formData, heiAddress: e.target.value })}
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Signatories Hierarchy */}
          {workspaceTab === "signatories" && (
            <div className="bg-white p-6 rounded-xl border border-line shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-ink mb-1">Official Signatory Hierarchy</h3>
                <p className="text-xs text-ink-muted">
                  Under the CHED-UniFAST guidelines, Annex 9 requires 4 sign-offs for legal validity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* 1. Prepared by */}
                <div className="p-4 rounded-lg border border-line bg-neutral-50/50 space-y-2">
                  <span className="font-semibold text-ink uppercase tracking-wide block">1. Prepared by:</span>
                  <label className="block text-ink-muted">TES Focal Person / Coordinator Name</label>
                  <input
                    type="text"
                    value={formData.signatories?.tesFocalPerson?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signatories: {
                          ...formData.signatories,
                          tesFocalPerson: {
                            name: e.target.value,
                            position: formData.signatories?.tesFocalPerson?.position || "TES Focal Person/Scholarship Coordinator",
                          },
                        },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold bg-white"
                  />
                </div>

                {/* 2. Verified by */}
                <div className="p-4 rounded-lg border border-line bg-neutral-50/50 space-y-2">
                  <span className="font-semibold text-ink uppercase tracking-wide block">2. Verified by:</span>
                  <label className="block text-ink-muted">University/College Registrar Name</label>
                  <input
                    type="text"
                    value={formData.signatories?.registrar?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signatories: {
                          ...formData.signatories,
                          registrar: {
                            name: e.target.value,
                            position: formData.signatories?.registrar?.position || "University/College Registrar",
                          },
                        },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold bg-white"
                  />
                </div>

                {/* 3. Certified true and correct by */}
                <div className="p-4 rounded-lg border border-line bg-neutral-50/50 space-y-2">
                  <span className="font-semibold text-ink uppercase tracking-wide block">3. Certified true and correct by:</span>
                  <label className="block text-ink-muted">Chief Accountant Name</label>
                  <input
                    type="text"
                    value={formData.signatories?.accountant?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signatories: {
                          ...formData.signatories,
                          accountant: {
                            name: e.target.value,
                            position: formData.signatories?.accountant?.position || "Accountant",
                          },
                        },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold bg-white"
                  />
                </div>

                {/* 4. Approved by */}
                <div className="p-4 rounded-lg border border-line bg-neutral-50/50 space-y-2">
                  <span className="font-semibold text-ink uppercase tracking-wide block">4. Approved by:</span>
                  <label className="block text-ink-muted">Head / President of HEI Name</label>
                  <input
                    type="text"
                    value={formData.signatories?.president?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signatories: {
                          ...formData.signatories,
                          president: {
                            name: e.target.value,
                            position: formData.signatories?.president?.position || "Head/President of HEI",
                          },
                        },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 font-semibold bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL SHEET CANVAS MODE (Pixel-perfect reproduction of page-1.png & Annex9.xlsx) */}
      {(viewMode === "sheet" || typeof window !== "undefined") && (
        <div className={viewMode === "sheet" ? "block" : "hidden print:block"}>
          <div className="annex-printable-document bg-neutral-100 p-4 md:p-8 rounded-2xl flex justify-center overflow-x-auto print:bg-white print:p-0">
            {/* Standard Government Ledger Canvas (Landscape) */}
            <div className="w-[1150px] bg-white text-black p-8 shadow-2xl border border-neutral-300 print:shadow-none print:border-none print:p-0 print:w-full font-serif text-[11px] leading-tight">
              
              {/* Top Tag */}
              <div className="flex justify-end mb-2">
                <span className="italic text-xs font-sans font-semibold tracking-wide text-neutral-800">
                  TDP Form - Annex 9
                </span>
              </div>

              {/* Dual Logo & Country Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
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
                <div className="text-center flex-1 px-4">
                  <p className="text-[10px] font-sans text-neutral-600 mb-0.5">Republic of the Philippines</p>
                  <h2 className="text-xs font-sans font-bold uppercase underline decoration-neutral-400">
                    {formData.heiName}
                  </h2>
                  <p className="text-[9px] font-sans text-neutral-700 underline decoration-neutral-300">
                    {formData.heiAddress}
                  </p>
                  <h1 className="text-sm font-bold tracking-tight uppercase font-sans mt-3">
                    TULONG DUNONG PROGRAM - TERTIARY EDUCATION SUBSIDY (TDP-TES) PAYROLL
                  </h1>
                  <p className="text-[10px] font-sans text-neutral-600 mt-0.5">
                    Academic Year {formData.academicYear} • {formData.campus}
                  </p>
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
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

              {/* Main Official Grid (14 columns matching page-1.png) */}
              <table className="w-full border-collapse border border-black text-[9px] font-sans">
                <thead>
                  <tr className="border border-black bg-neutral-50/70 text-center font-bold">
                    <th colSpan={8} className="border border-black p-1.5">
                      Student&apos;s Profile
                    </th>
                    <th colSpan={3} className="border border-black p-1.5 bg-neutral-100/60">
                      First Semester
                    </th>
                    <th colSpan={3} className="border border-black p-1.5 bg-neutral-100/60">
                      Second Semester
                    </th>
                  </tr>
                  <tr className="border border-black bg-neutral-50/70 text-center font-bold text-[8.5px]">
                    <th className="border border-black p-1 w-8">Seq. No.</th>
                    <th className="border border-black p-1 w-24">TDP Award No.</th>
                    <th className="border border-black p-1 w-20">Student ID No.</th>
                    <th className="border border-black p-1 w-28">Last Name</th>
                    <th className="border border-black p-1 w-28">Given Name</th>
                    <th className="border border-black p-1 w-8">M.I.</th>
                    <th className="border border-black p-1 min-w-[140px]">Degree Program</th>
                    <th className="border border-black p-1 w-10">Year Level</th>
                    {/* First Sem */}
                    <th className="border border-black p-1 w-20">Total Amount Received</th>
                    <th className="border border-black p-1 w-18">Date Received</th>
                    <th className="border border-black p-1 w-24">Student&apos;s Signature</th>
                    {/* Second Sem */}
                    <th className="border border-black p-1 w-20">Total Amount Received</th>
                    <th className="border border-black p-1 w-18">Date Received</th>
                    <th className="border border-black p-1 w-24">Student&apos;s Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.grantees.map((g) => (
                    <tr key={g.id} className="border-b border-neutral-300">
                      <td className="border-r border-black p-1 text-center font-mono">{g.seqNo}</td>
                      <td className="border-r border-black p-1 text-center font-mono">{g.tdpAwardNo}</td>
                      <td className="border-r border-black p-1 text-center font-mono">{g.studentIdNo}</td>
                      <td className="border-r border-black p-1 font-bold uppercase">{g.lastName}</td>
                      <td className="border-r border-black p-1 uppercase">{g.givenName}</td>
                      <td className="border-r border-black p-1 text-center uppercase">{g.middleInitial}</td>
                      <td className="border-r border-black p-1">{g.degreeProgram}</td>
                      <td className="border-r border-black p-1 text-center">{g.yearLevel}</td>
                      {/* 1st Sem */}
                      <td className="border-r border-black p-1 text-right font-mono font-medium">
                        {g.firstSemAmount > 0
                          ? Number(g.firstSemAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                          : "-"}
                      </td>
                      <td className="border-r border-black p-1 text-center font-mono text-[8px]">{g.firstSemDateReceived}</td>
                      <td className="border-r border-black p-1 text-center italic text-[8.5px]">{g.firstSemSignature}</td>
                      {/* 2nd Sem */}
                      <td className="border-r border-black p-1 text-right font-mono font-medium">
                        {g.secondSemAmount > 0
                          ? Number(g.secondSemAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                          : "-"}
                      </td>
                      <td className="border-r border-black p-1 text-center font-mono text-[8px]">{g.secondSemDateReceived}</td>
                      <td className="border-r border-black p-1 text-center italic text-[8.5px]">{g.secondSemSignature}</td>
                    </tr>
                  ))}

                  {/* Empty filler rows up to 25 minimum matching page-1.png */}
                  {Array.from({ length: Math.max(0, 25 - formData.grantees.length) }).map((_, i) => (
                    <tr key={`fill-${i}`} className="border-b border-neutral-200 h-5">
                      <td className="border-r border-black p-0.5 text-center font-mono text-neutral-400">
                        {formData.grantees.length + i + 1}
                      </td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                      <td className="border-r border-black p-0.5"></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={8} className="border-r border-black p-1.5 text-right uppercase tracking-wider text-[9px]">
                      TOTAL
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono text-[9px] border-b-4 border-double border-black">
                      {formData.firstSemTotalAmount > 0
                        ? `₱${formData.firstSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "-"}
                    </td>
                    <td colSpan={2} className="border-r border-black"></td>
                    <td className="border-r border-black p-1.5 text-right font-mono text-[9px] border-b-4 border-double border-black">
                      {formData.secondSemTotalAmount > 0
                        ? `₱${formData.secondSemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "-"}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>

              {/* Quadruple Signature Hierarchy */}
              <div className="mt-8 grid grid-cols-4 gap-4 text-[9px] font-sans">
                {/* 1. Prepared by */}
                <div>
                  <div className="text-[8.5px] text-neutral-600 mb-6">Prepared by:</div>
                  <div className="border-b border-black mb-0.5 text-center font-bold uppercase truncate">
                    {formData.signatories?.tesFocalPerson?.name || "DR. ARNEIL G. PEREZ"}
                  </div>
                  <div className="text-[7.5px] text-neutral-600 text-center">(Signature above printed name)</div>
                  <div className="text-[8px] text-center font-medium mt-0.5">
                    TES Focal Person/Scholarship Coordinator
                  </div>
                </div>

                {/* 2. Verified by */}
                <div>
                  <div className="text-[8.5px] text-neutral-600 mb-6">Verified by:</div>
                  <div className="border-b border-black mb-0.5 text-center font-bold uppercase truncate">
                    {formData.signatories?.registrar?.name || "DR. NEMIA H. CHAVEZ"}
                  </div>
                  <div className="text-[7.5px] text-neutral-600 text-center">(Signature above printed name)</div>
                  <div className="text-[8px] text-center font-medium mt-0.5">
                    University/College Registrar
                  </div>
                </div>

                {/* 3. Certified true and correct by */}
                <div>
                  <div className="text-[8.5px] text-neutral-600 mb-6">Certified true and correct by:</div>
                  <div className="border-b border-black mb-0.5 text-center font-bold uppercase truncate">
                    {formData.signatories?.accountant?.name || "MA. ELENA L. BAUTISTA, CPA"}
                  </div>
                  <div className="text-[7.5px] text-neutral-600 text-center">(Signature above printed name)</div>
                  <div className="text-[8px] text-center font-medium mt-0.5">
                    Accountant
                  </div>
                </div>

                {/* 4. Approved by */}
                <div>
                  <div className="text-[8.5px] text-neutral-600 mb-6">Approved by:</div>
                  <div className="border-b border-black mb-0.5 text-center font-bold uppercase truncate">
                    {formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD"}
                  </div>
                  <div className="text-[7.5px] text-neutral-600 text-center">(Signature above printed name)</div>
                  <div className="text-[8px] text-center font-medium mt-0.5">
                    Head/President of HEI
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
        documentTitle={documentTitle || "Annex 9 - Masterlist of Beneficiaries (Payroll)"}
        annexNumber={9}
        orientation={printOrientation}
        onOrientationChange={setPrintOrientation}
        previewContent={
          <div className="text-black text-xs space-y-3">
            <div className="p-4 border border-dashed border-neutral-300 rounded bg-[#F1F8F1]">
              <div className="font-bold text-sm text-[#123F17]">
                TDP Annex 9 - Masterlist of Beneficiaries (Payroll)
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                HEI: {formData.heiName} • Total Beneficiaries: {formData.grantees.length} • Total Amount: ₱{formData.grandTotalAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-2 italic">
                Official student stipend payroll ledger formatted in Landscape orientation.
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
