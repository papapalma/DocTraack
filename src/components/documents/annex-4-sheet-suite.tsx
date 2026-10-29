"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChedLogo, UniFastLogo } from "./ched-unifast-logos";
import { Annex4FormData, Annex4Grantee } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Search,
  LayoutDashboard,
  School,
  DollarSign,
  ShieldCheck,
  Building,
  UserCheck,
  X,
} from "lucide-react";

interface ImportableApplication {
  id: string;
  trackingCode: string;
  status: string;
  formData?: Record<string, any>;
  student?: { id: string; name: string; email: string };
}

interface Annex4SheetSuiteProps {
  initialData?: Annex4FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex4SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex4SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" (Interactive Data Management) or "sheet" (Refined Official Document Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [activeTab, setActiveTab] = useState<"tab1" | "tab2" | "tab3">("tab1");
  const [workspaceTab, setWorkspaceTab] = useState<"grantees" | "settings" | "signatories">("grantees");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Annex 2 Import Modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [availableApplications, setAvailableApplications] = useState<ImportableApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(false);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [appSearch, setAppSearch] = useState<string>("");

  // Default initial values
  const defaultData: Annex4FormData = useMemo(() => {
    return (
      initialData || {
        regionCode: "MIMAROPA",
        heiCode: "MINSU",
        heiName: "Mindoro State University",
        heiAddress: "Alcate, Victoria, Oriental Mindoro",
        academicYear: "2023-2024",
        termCode: "2",
        trancheNumber: "1",
        batchNumber: "20.1",
        referenceNumber: "MIMAROPA-MINSU-2023-2-1:20.1",
        billingDate: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        isLastBatch: false,
        campus: "Main Campus - Victoria",

        totalGrantees: 10,
        stipendPerGrantee: 7500,
        totalSubsidy: 75000,
        managementFeeRate: 0.005,
        managementFeeAmount: 375,
        grandTotalBilling: 75375,

        grantees: Array.from({ length: 10 }).map((_, idx) => ({
          controlNumber: String(idx + 1).padStart(5, "0"),
          studentNumber: `2023-${String(1001 + idx)}`,
          tdpAwardNumber: `2024-TDP-4060-${String(idx + 1).padStart(5, "0")}`,
          lastName: ["DELA CRUZ", "SANTOS", "REYES", "GARCIA", "RAMOS", "MENDOZA", "FLORES", "GONZALES", "BAUTISTA", "VILLANUEVA"][idx] || "STUDENT",
          givenName: ["JUAN", "MARIA", "CARLOS", "ANA", "JOSE", "MARK", "SARAH", "CHRISTIAN", "JASMINE", "DANIEL"][idx] || "FIRSTNAME",
          middleInitial: "P.",
          sex: idx % 2 === 0 ? "M" : "F",
          birthdate: "05/14/2004",
          degreeProgram: "BS Information Technology",
          yearLevel: "1",
          email: `grantee${idx + 1}@minsu.edu.ph`,
          phone: "09171234567",
          tdpBatch: "20.1",
          tdpAmount: 7500,
          totalAmount: 7500,
          campus: "Main Campus - Victoria",
        })),

        jmcNumber: "04",
        jmcSeries: "2022",

        signatories: {
          accountingHead: {
            name: "MA. ELENA L. BAUTISTA, CPA",
            position: "Chief Accountant / Authorized Representative",
          },
          president: {
            name: "DR. EMMANUEL C. MACALALAD",
            position: "University President",
          },
          tesFocalPerson: {
            name: "ENGR. EDWIN C. CAYETANO",
            position: "HEI TES Focal Person / Scholarship Coordinator",
          },
          registrar: {
            name: "ATTY. ROWENA S. DE GUZMAN",
            position: "University Registrar",
          },
        },
        notary: {
          docNo: "___",
          pageNo: "___",
          bookNo: "___",
          series: "2024",
          issuedAt: "Victoria, Oriental Mindoro",
          issuedOn: new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        },
      }
    );
  }, [initialData]);

  const [formData, setFormData] = useState<Annex4FormData>(defaultData);
  const [docTitle, setDocTitle] = useState(
    documentTitle ||
      `Annex 4: New TDP Billing Package - Batch ${defaultData.batchNumber} (${defaultData.academicYear} ${defaultData.termCode === "1" ? "1st Sem" : "2nd Sem"})`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate totals whenever grantees list changes
  const updateGranteesAndTotals = (newGrantees: Annex4Grantee[]) => {
    const totalGrantees = newGrantees.length;
    const stipendPerGrantee = 7500;
    const totalSubsidy = totalGrantees * stipendPerGrantee;
    const managementFeeRate = 0.005;
    const managementFeeAmount = totalSubsidy * managementFeeRate;
    const grandTotalBilling = totalSubsidy + managementFeeAmount;

    setFormData((prev) => ({
      ...prev,
      grantees: newGrantees,
      totalGrantees,
      stipendPerGrantee,
      totalSubsidy,
      managementFeeRate,
      managementFeeAmount,
      grandTotalBilling,
    }));
  };

  // Re-index control numbers (00001 to N)
  const reindexList = (list: Annex4Grantee[]): Annex4Grantee[] => {
    return list.map((item, idx) => ({
      ...item,
      controlNumber: String(idx + 1).padStart(5, "0"),
      tdpAmount: 7500,
      totalAmount: 7500,
    }));
  };

  // Add blank row
  const addBlankRow = () => {
    const nextIdx = formData.grantees.length + 1;
    const newRow: Annex4Grantee = {
      controlNumber: String(nextIdx).padStart(5, "0"),
      studentNumber: `2024-${String(nextIdx).padStart(5, "0")}`,
      tdpAwardNumber: `2024-TDP-4060-${String(nextIdx).padStart(5, "0")}`,
      lastName: "NEW GRANTEE",
      givenName: "FIRSTNAME",
      middleInitial: "M.",
      sex: "F",
      birthdate: "01/01/2004",
      degreeProgram: "BS Agriculture",
      yearLevel: "1",
      email: "student@minsu.edu.ph",
      phone: "09170000000",
      tdpBatch: formData.batchNumber,
      tdpAmount: 7500,
      totalAmount: 7500,
      campus: formData.campus,
    };
    updateGranteesAndTotals(reindexList([...formData.grantees, newRow]));
  };

  // Remove row
  const removeRow = (index: number) => {
    const updated = formData.grantees.filter((_, idx) => idx !== index);
    updateGranteesAndTotals(reindexList(updated));
  };

  // Update specific row field
  const updateRowField = (index: number, field: keyof Annex4Grantee, value: string | number) => {
    const updated = [...formData.grantees];
    updated[index] = { ...updated[index], [field]: value } as Annex4Grantee;
    updateGranteesAndTotals(updated);
  };

  // Update Reference Number based on codes
  const updateReferenceNumber = (fields: Partial<Annex4FormData>) => {
    const next = { ...formData, ...fields };
    const ref = `${next.regionCode}-${next.heiCode}-${next.academicYear.split("-")[0]}-${next.termCode}-${next.trancheNumber}:${next.batchNumber}`;
    setFormData({
      ...next,
      referenceNumber: ref,
    });
  };

  // Filtered grantees for workspace
  const filteredGrantees = useMemo(() => {
    if (!searchQuery.trim()) return formData.grantees;
    const q = searchQuery.toLowerCase();
    return formData.grantees.filter(
      (g) =>
        g.lastName.toLowerCase().includes(q) ||
        g.givenName.toLowerCase().includes(q) ||
        g.studentNumber.toLowerCase().includes(q) ||
        g.tdpAwardNumber.toLowerCase().includes(q) ||
        g.degreeProgram.toLowerCase().includes(q)
    );
  }, [formData.grantees, searchQuery]);

  // Fetch applications for Annex 2 Import Modal
  const openImportModal = async () => {
    setShowImportModal(true);
    setIsLoadingApps(true);
    setSelectedAppIds([]);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        const apps = (data.applications || []).filter(
          (a: ImportableApplication) => a.status === "ACCEPTED" || a.status === "APPROVED" || a.status === "SUBMITTED"
        );
        setAvailableApplications(apps);
      }
    } catch (err) {
      console.error("Failed to load applications for import:", err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Commit imported applications into Form 2
  const commitImportApplications = () => {
    const chosen = availableApplications.filter((a) => selectedAppIds.includes(a.id));
    const importedGrantees: Annex4Grantee[] = chosen.map((app, idx) => {
      const f = app.formData || {};
      const nextNum = formData.grantees.length + idx + 1;
      return {
        controlNumber: String(nextNum).padStart(5, "0"),
        studentNumber: f.student_id || app.student?.id || `2024-${String(nextNum).padStart(5, "0")}`,
        tdpAwardNumber: `2024-TDP-4060-${String(nextNum).padStart(5, "0")}`,
        lastName: (f.last_name || app.student?.name?.split(" ").slice(-1)[0] || "STUDENT").toUpperCase(),
        givenName: (f.given_name || app.student?.name?.split(" ")[0] || "FIRSTNAME").toUpperCase(),
        middleInitial: f.middle_name ? `${f.middle_name[0].toUpperCase()}.` : "A.",
        sex: (f.gender || "M").toUpperCase(),
        birthdate: f.birthdate || "01/01/2004",
        degreeProgram: f.course_degree || "BS Information Technology",
        yearLevel: f.year_level || "1",
        email: f.email || app.student?.email || "student@minsu.edu.ph",
        phone: f.contact_number || "09170000000",
        tdpBatch: formData.batchNumber,
        tdpAmount: 7500,
        totalAmount: 7500,
        campus: f.hei_campus || formData.campus,
      };
    });

    updateGranteesAndTotals(reindexList([...formData.grantees, ...importedGrantees]));
    setShowImportModal(false);
  };

  // Save to backend
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
          throw new Error(data.error || "Failed to create Annex 4 document");
        }

        const data = await res.json();
        setSaveSuccess(true);
        if (onSaved) {
          onSaved(data.document.id);
        } else {
          router.push(`/documents/${data.document.id}`);
        }
      } else {
        // Edit / update existing document
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
          throw new Error(data.error || "Failed to update Annex 4 document");
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

  const termText = formData.termCode === "1" ? "1st Semester" : "2nd Semester";

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP DUAL-MODE FROSTED GLASS STICKY TOOLBAR                           */}
      {/* ========================================================================= */}
      <div className="sticky top-4 z-40 backdrop-blur-xl bg-white/95 p-2 rounded-2xl border border-line shadow-md flex flex-col md:flex-row items-center justify-between gap-3 print:hidden transition-all duration-200">
        {/* Left Side: View Mode & Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Dual-Mode Switcher */}
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

          {/* Form Tabs (When in Official Paper Sheet Mode) */}
          {viewMode === "sheet" && (
            <div className="inline-flex p-1 rounded-xl bg-slate-100/90 text-xs animate-in fade-in duration-200">
              {[
                { id: "tab1", label: "Form 1: Statement" },
                { id: "tab2", label: `Form 2: New Grantees (${formData.grantees.length})` },
                { id: "tab3", label: "Form 3: Certification" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1 px-2.5 rounded-lg font-medium apple-press transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-minsu-green-900 shadow-xs font-bold"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Global Document Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {documentId && (
            <a
              href={`/api/annex-4/export-excel?documentId=${documentId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-minsu-green-50 text-minsu-green-700 text-xs font-semibold apple-press transition-colors shadow-xs"
              title="Download official 3-tab Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode("sheet");
              setTimeout(() => window.print(), 150);
            }}
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
            {mode === "create" ? "Save Annex 4" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-minsu-green-50 border border-minsu-green-100 flex items-center gap-2.5 text-minsu-green-900 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-minsu-green-600 shrink-0" />
          Annex 4 document saved successfully.
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
        <div className="space-y-6">
          {/* Workspace Sub-tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              onClick={() => setWorkspaceTab("grantees")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "grantees"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>New Grantees List ({formData.grantees.length})</span>
            </button>
            <button
              onClick={() => setWorkspaceTab("settings")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "settings"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Billing & Campus Parameters</span>
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
              <span>Signatories & Certification</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total New Grantees</span>
                <Users className="w-4 h-4 text-minsu-green-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-minsu-green-900">
                {formData.totalGrantees}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Eligible under R.A. 10931
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total TDP Subsidy</span>
                <DollarSign className="w-4 h-4 text-minsu-gold-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">
                ₱{formData.totalSubsidy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                ₱7,500.00 × {formData.totalGrantees} students
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Management Fee (0.5%)</span>
                <School className="w-4 h-4 text-minsu-green-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">
                ₱{formData.managementFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Administrative support to HEI
              </div>
            </div>

            <div className="bg-minsu-green-900 p-4 rounded-xl text-white shadow-xs">
              <div className="flex items-center justify-between text-xs text-minsu-gold-400 font-medium mb-1">
                <span>Grand Total Billing</span>
                <DollarSign className="w-4 h-4 text-minsu-gold-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-minsu-gold-400">
                ₱{formData.grandTotalBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                Reference: {formData.referenceNumber}
              </div>
            </div>
          </div>

          {/* TAB CONTENT: GRANTEES */}
          {workspaceTab === "grantees" && (
            <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Search grantee name, ID, award no..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-line bg-page focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openImportModal}
                    className="text-xs h-8 border-minsu-gold-500/50 bg-minsu-gold-100/60 hover:bg-minsu-gold-100 text-minsu-gold-600 gap-1.5 font-semibold"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Import from Annex 2</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={addBlankRow}
                    className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white text-xs h-8 gap-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Grantee</span>
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[550px] apple-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-minsu-green-50 text-minsu-green-900 font-bold sticky top-0 z-10 border-b border-line">
                    <tr>
                      <th className="py-2.5 px-3 w-14">Ctrl #</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Student No.</th>
                      <th className="py-2.5 px-3 min-w-[160px]">TDP Award No.</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Last Name</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Given Name</th>
                      <th className="py-2.5 px-2 w-12 text-center">M.I.</th>
                      <th className="py-2.5 px-2 w-12 text-center">Sex</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Birthdate</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Degree Program</th>
                      <th className="py-2.5 px-2 w-16 text-center">Year</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Email</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Phone</th>
                      <th className="py-2.5 px-3 text-right w-24">Amount</th>
                      <th className="py-2.5 px-2 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {filteredGrantees.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-ink-muted">
                          No grantees match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGrantees.map((g, idx) => (
                        <tr key={idx} className="hover:bg-minsu-green-50/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-minsu-green-800">
                            {g.controlNumber}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.studentNumber}
                              onChange={(e) => updateRowField(idx, "studentNumber", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-mono"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.tdpAwardNumber}
                              onChange={(e) => updateRowField(idx, "tdpAwardNumber", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-mono text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.lastName}
                              onChange={(e) => updateRowField(idx, "lastName", e.target.value.toUpperCase())}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-semibold uppercase"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.givenName}
                              onChange={(e) => updateRowField(idx, "givenName", e.target.value.toUpperCase())}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none uppercase"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              value={g.middleInitial}
                              onChange={(e) => updateRowField(idx, "middleInitial", e.target.value.toUpperCase())}
                              className="w-full text-center bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none uppercase"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <select
                              value={g.sex}
                              onChange={(e) => updateRowField(idx, "sex", e.target.value)}
                              className="bg-transparent text-center focus:outline-none font-semibold"
                            >
                              <option value="M">M</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.birthdate}
                              onChange={(e) => updateRowField(idx, "birthdate", e.target.value)}
                              placeholder="mm/dd/yyyy"
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.degreeProgram}
                              onChange={(e) => updateRowField(idx, "degreeProgram", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none truncate"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <select
                              value={g.yearLevel}
                              onChange={(e) => updateRowField(idx, "yearLevel", e.target.value)}
                              className="bg-transparent text-center focus:outline-none"
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.email}
                              onChange={(e) => updateRowField(idx, "email", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none text-[11px] truncate"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.phone}
                              onChange={(e) => updateRowField(idx, "phone", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-mono text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-minsu-green-800">
                            ₱{g.tdpAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-sm hover:bg-red-50 transition-colors"
                              title="Delete grantee row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SETTINGS */}
          {workspaceTab === "settings" && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-minsu-green-900 uppercase tracking-wider">
                Official Billing Configuration & Campus Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Designated Campus</label>
                  <select
                    value={formData.campus}
                    onChange={(e) => {
                      const campus = e.target.value;
                      setFormData({
                        ...formData,
                        campus,
                        grantees: formData.grantees.map((g) => ({ ...g, campus })),
                      });
                    }}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  >
                    <option value="Main Campus - Victoria">Mindoro State University - Main Campus (Victoria)</option>
                    <option value="Calapan City Campus">Mindoro State University - Calapan City Campus</option>
                    <option value="Bongabong Campus">Mindoro State University - Bongabong Campus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">TDP Batch Number</label>
                  <input
                    value={formData.batchNumber}
                    onChange={(e) => {
                      const batch = e.target.value;
                      updateReferenceNumber({
                        batchNumber: batch,
                        grantees: formData.grantees.map((g) => ({ ...g, tdpBatch: batch })),
                      });
                    }}
                    placeholder="e.g. 20.1"
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Academic Year</label>
                  <input
                    value={formData.academicYear}
                    onChange={(e) => updateReferenceNumber({ academicYear: e.target.value })}
                    placeholder="e.g. 2023-2024"
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Semester (Term)</label>
                  <select
                    value={formData.termCode}
                    onChange={(e) => updateReferenceNumber({ termCode: e.target.value as "1" | "2" })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  >
                    <option value="1">1st Semester (Code: 1)</option>
                    <option value="2">2nd Semester (Code: 2)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Tranche Number</label>
                  <select
                    value={formData.trancheNumber}
                    onChange={(e) => updateReferenceNumber({ trancheNumber: e.target.value as "1" | "2" })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  >
                    <option value="1">Tranche 1</option>
                    <option value="2">Tranche 2</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Official Reference Number</label>
                  <input
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold px-3 text-xs focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Billing Statement Date</label>
                  <input
                    value={formData.billingDate}
                    onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                    placeholder="e.g. March 4, 2025"
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isLastBatch"
                    checked={formData.isLastBatch}
                    onChange={(e) => setFormData({ ...formData, isLastBatch: e.target.checked })}
                    className="w-4 h-4 rounded text-minsu-green-700 focus:ring-minsu-green-700"
                  />
                  <label htmlFor="isLastBatch" className="text-xs font-semibold text-ink cursor-pointer">
                    This is the LAST batch of billing for this term
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SIGNATORIES */}
          {workspaceTab === "signatories" && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-minsu-green-900 uppercase tracking-wider">
                MinSU Institutional Officers & Notarization
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">1. Accounting Head / Chief Accountant</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Printed Name</label>
                    <input
                      value={formData.signatories?.accountingHead?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            accountingHead: {
                              ...formData.signatories?.accountingHead,
                              name: e.target.value,
                              position: formData.signatories?.accountingHead?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Official Designation</label>
                    <input
                      value={formData.signatories?.accountingHead?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            accountingHead: {
                              ...formData.signatories?.accountingHead,
                              name: formData.signatories?.accountingHead?.name || "",
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
                  <div className="text-xs font-bold text-minsu-green-900">2. University President</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Printed Name</label>
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
                    <label className="text-[11px] text-ink-muted font-medium">Official Designation</label>
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
                  <div className="text-xs font-bold text-minsu-green-900">3. TES Focal Person / Coordinator</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Printed Name</label>
                    <input
                      value={formData.signatories?.tesFocalPerson?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            tesFocalPerson: {
                              ...formData.signatories?.tesFocalPerson,
                              name: e.target.value,
                              position: formData.signatories?.tesFocalPerson?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Official Designation</label>
                    <input
                      value={formData.signatories?.tesFocalPerson?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            tesFocalPerson: {
                              ...formData.signatories?.tesFocalPerson,
                              name: formData.signatories?.tesFocalPerson?.name || "",
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
                  <div className="text-xs font-bold text-minsu-green-900">4. School / University Registrar</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Printed Name</label>
                    <input
                      value={formData.signatories?.registrar?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            registrar: {
                              ...formData.signatories?.registrar,
                              name: e.target.value,
                              position: formData.signatories?.registrar?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Official Designation</label>
                    <input
                      value={formData.signatories?.registrar?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            registrar: {
                              ...formData.signatories?.registrar,
                              name: formData.signatories?.registrar?.name || "",
                              position: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Notarization metadata */}
              <div className="pt-4 border-t border-line">
                <div className="text-xs font-bold text-minsu-green-900 mb-3">Notary Public Acknowledgment Details</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] text-ink-muted">Doc No.</label>
                    <input
                      value={formData.notary?.docNo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notary: { ...formData.notary, docNo: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted">Page No.</label>
                    <input
                      value={formData.notary?.pageNo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notary: { ...formData.notary, pageNo: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted">Book No.</label>
                    <input
                      value={formData.notary?.bookNo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notary: { ...formData.notary, bookNo: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted">Series of</label>
                    <input
                      value={formData.notary?.series || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notary: { ...formData.notary, series: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: REFINED OFFICIAL DOCUMENT CANVAS (Print-Ready Government Suite)*/}
      {/* ========================================================================= */}
      {viewMode === "sheet" && (
        <div className="bg-white text-ink font-sans p-6 sm:p-10 border border-neutral-800 shadow-xl rounded-sm max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print-container">
          {/* ======================================================================= */}
          {/* TAB 1: FORM 1 – CONSOLIDATED TDP BILLING STATEMENT                      */}
          {/* ======================================================================= */}
          {activeTab === "tab1" && (
            <div className="space-y-4 text-[12px] leading-tight print:block">
              {/* Top Right Tag */}
              <div className="text-right font-bold text-[13px] text-neutral-800">
                Annex 4 - New TDP Form 1
              </div>

              {/* Header: CHED Logo | HEI Info | UniFAST Logo */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="w-20 flex justify-center">
                  <ChedLogo className="w-16 h-16" />
                </div>

                <div className="text-center flex-1 px-4 space-y-1">
                  <div className="text-[12px] font-medium text-ink-muted">Republic of the Philippines</div>
                  <div>
                    <input
                      value={formData.heiName}
                      onChange={(e) => setFormData({ ...formData, heiName: e.target.value })}
                      className="bg-minsu-gold-100 text-minsu-gold-600 font-bold italic text-center w-full max-w-md px-2 py-0.5 border border-minsu-gold-400/50 rounded-xs focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                      placeholder="(Name of Higher Education Institution)"
                    />
                  </div>
                  <div>
                    <input
                      value={formData.heiAddress}
                      onChange={(e) => setFormData({ ...formData, heiAddress: e.target.value })}
                      className="bg-minsu-gold-100 text-minsu-gold-600 italic text-center w-full max-w-md px-2 py-0.5 border border-minsu-gold-400/50 rounded-xs focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
                      placeholder="(Address of Higher Education Institution)"
                    />
                  </div>
                </div>

                <div className="w-20 flex justify-center">
                  <UniFastLogo className="w-16 h-16" />
                </div>
              </div>

              {/* Title Header */}
              <div className="text-center space-y-0.5 py-2">
                <h2 className="text-base font-extrabold uppercase tracking-wide text-neutral-900">
                  CONSOLIDATED TDP BILLING STATEMENT
                </h2>
                <div className="text-xs font-bold text-neutral-700">
                  TDP Batch {formData.batchNumber} - {termText}, AY {formData.academicYear}
                </div>
              </div>

              {/* Top Metadata Banner */}
              <div className="flex justify-end pr-2 text-xs space-y-1 text-right">
                <div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-neutral-600">TDP-TES Billing Statement Reference No.:</span>
                    <span className="bg-minsu-gold-100 text-minsu-gold-600 font-bold font-mono px-2 py-0.5 border border-minsu-gold-400/40">
                      {formData.referenceNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="font-semibold text-neutral-600">Date:</span>
                    <input
                      value={formData.billingDate}
                      onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                      className="border-b border-neutral-800 text-right w-36 px-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* To / Address block */}
              <div className="border border-neutral-800 text-xs">
                <div className="grid grid-cols-6 border-b border-neutral-800 p-1.5 bg-neutral-50">
                  <div className="font-bold col-span-1">To:</div>
                  <div className="font-bold col-span-5 text-neutral-900">
                    CHED - Regional Office MIMAROPA
                  </div>
                </div>
                <div className="grid grid-cols-6 p-1.5 bg-minsu-gold-100 text-neutral-900 font-bold">
                  <div className="col-span-1">Address:</div>
                  <div className="col-span-5">
                    2F HEDC Bldg., C.P. Garcia Ave., UP Diliman, Quezon City
                  </div>
                </div>
              </div>

              {/* Main Table */}
              <table className="w-full border-collapse border border-neutral-800 text-xs">
                <thead>
                  <tr className="bg-neutral-100 font-bold border-b border-neutral-800">
                    <th className="border-r border-neutral-800 p-2 text-left w-1/4">Responsibility Center</th>
                    <th className="border-r border-neutral-800 p-2 text-left w-1/2">
                      CHED - Regional Office IV-B (MIMAROPA)
                    </th>
                    <th className="border-r border-neutral-800 p-2 text-center w-20">Account Code</th>
                    <th className="p-2 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-r border-neutral-800 p-2 align-top text-neutral-500 font-serif italic">
                      Request Details
                    </td>
                    <td className="border-r border-neutral-800 p-2 leading-relaxed">
                      Request for payment of the Tulong Dunong Program - Tertiary Education Subsidy (TDP-TES) grant for {termText}, Academic Year {formData.academicYear} to be charged against the funds for Universal Access to Quality Tertiary Education (UAQTE) under General Appropriation Act (GAA) for Fiscal Year ________, as per attached supporting documents.
                    </td>
                    <td className="border-r border-neutral-800 p-2 text-center align-middle font-mono"></td>
                    <td className="p-2 text-right align-middle font-mono font-bold bg-minsu-gold-100 text-neutral-900">
                      ₱{formData.grandTotalBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-t border-neutral-800">
                    <td className="border-r border-neutral-800 p-2 font-bold" colSpan={2}>
                      Total number of TDP-TES student-grantees in the Higher Education Institution (HEI):
                    </td>
                    <td className="border-r border-neutral-800 p-2 text-center font-bold bg-minsu-gold-100 font-mono">
                      {formData.totalGrantees}
                    </td>
                    <td className="p-2"></td>
                  </tr>

                  <tr className="border-t border-neutral-800">
                    <td className="border-r border-neutral-800 p-2 font-bold" colSpan={2}>
                      Total TDP-TES subsidy
                    </td>
                    <td className="border-r border-neutral-800 p-2 text-right font-mono font-bold bg-minsu-gold-100" colSpan={2}>
                      ₱{formData.totalSubsidy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-t border-neutral-800">
                    <td className="border-r border-neutral-800 p-2 font-bold" colSpan={2}>
                      Add .5% (.005) Management Fee for Partner Institutions
                    </td>
                    <td className="border-r border-neutral-800 p-2 text-right font-mono font-bold bg-minsu-gold-100" colSpan={2}>
                      ₱{formData.managementFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-neutral-900 bg-neutral-50 font-bold">
                    <td className="border-r border-neutral-800 p-2 text-minsu-green-900 uppercase" colSpan={2}>
                      TOTAL: TDP-TES Billing Amount
                    </td>
                    <td className="border-r border-neutral-800 p-2 text-right font-mono text-sm bg-minsu-gold-100 text-neutral-900" colSpan={2}>
                      ₱{formData.grandTotalBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="border-t border-neutral-800 text-[11px]">
                    <td className="border-r border-neutral-800 p-2 italic" colSpan={2}>
                      Basis for the Tertiary Education Subsidy: Section 23, Rule IV, IRR of R.A. No. 10931
                    </td>
                    <td className="p-2 border-t border-neutral-800" colSpan={2}>
                      <div className="font-bold text-center border-b border-neutral-800 pb-1">
                        Action to be taken (To be approved by CHEDRO)
                      </div>
                      <div className="grid grid-cols-2 pt-1">
                        <span className="text-[10px]">PhP</span>
                        <span className="text-[10px]">Excess (deficient) billing noted</span>
                      </div>
                      <div className="grid grid-cols-2 pt-1 border-t border-dotted border-neutral-400">
                        <span className="text-[10px]">PhP</span>
                        <span className="text-[10px] font-bold">Approved for payment</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Certified & Approved Signature Box */}
              <div className="border border-neutral-800 grid grid-cols-2 text-xs">
                {/* Left: Certified Box */}
                <div className="border-r border-neutral-800 p-3 space-y-3">
                  <div className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1">
                    Certified
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded-xs" />
                    <span>Supporting documents complete and amount claimed proper.</span>
                  </div>

                  <div className="pt-2">
                    <div className="font-semibold text-neutral-800 mb-1">
                      Is this the last batch of billing for this term of AY {formData.academicYear}?
                    </div>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isLastBatch}
                          onChange={(e) => setFormData({ ...formData, isLastBatch: e.target.checked })}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!formData.isLastBatch}
                          onChange={(e) => setFormData({ ...formData, isLastBatch: !e.target.checked })}
                          className="bg-minsu-gold-400"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-8 space-y-1 text-center">
                    <div className="font-bold border-b border-neutral-800 pb-1">
                      {formData.signatories?.accountingHead?.name || "MA. ELENA L. BAUTISTA, CPA"}
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      {formData.signatories?.accountingHead?.position || "Head, Accounting / Authorized Representative"}
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-1">Date: {formData.billingDate}</div>
                  </div>
                </div>

                {/* Right: Approved Box */}
                <div className="p-3 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1">
                      Approved
                    </div>
                    <p className="text-[11px] text-neutral-600 italic mt-2">
                      Approval for institutional endorsement to Commission on Higher Education - Regional Office MIMAROPA.
                    </p>
                  </div>

                  <div className="pt-8 space-y-1 text-center">
                    <div className="font-bold border-b border-neutral-800 pb-1">
                      {formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD"}
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      {formData.signatories?.president?.position || "President / Authorized Representative"}
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-1">Date: {formData.billingDate}</div>
                  </div>
                </div>
              </div>

              {/* Instructions Footer (as seen on Annex 4 Form 1) */}
              <div className="border border-neutral-800 p-3 text-[10px] space-y-2 bg-neutral-50 leading-normal">
                <div className="font-bold text-[11px]">INSTRUCTIONS:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p>
                      1. The HEIs are allowed a maximum of two (2) tranches of payments per semester, with the option to specify multiple batches within that single tranche. Each batch identifier should correspond to a unique group of grantees included in the billing.
                    </p>
                    <p>
                      2. The TES statement reference number shall comprise of the REGIONAL CODE (2-digit), HEI CODE (alpha codes), ACADEMIC YEAR (4-digit), TRANCHE NUMBER (1-digit) and BATCH NUMBER (digit).
                    </p>
                    <div className="font-bold pt-1">Regional Codes:</div>
                    <div className="grid grid-cols-2 gap-x-2 text-[9px]">
                      <div>Region 1: 01</div>
                      <div>Region 4B MIMAROPA: 10</div>
                      <div>Region 2: 02</div>
                      <div>Region 5: 05</div>
                      <div>Region 3: 03</div>
                      <div>NCR: NCR</div>
                      <div>Region 4A: 04</div>
                      <div>CAR: CAR</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p>
                      <strong>Term:</strong> 1st semester = 1, 2nd semester = 2
                    </p>
                    <p>
                      <strong>Tranche Number:</strong> HEIs can only bill CHED up to two (2) batches per semester.
                    </p>
                    <p>
                      <strong>Batch:</strong> Batch Code: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 20.1
                    </p>
                    <p className="pt-1">
                      3. Submit a printed copy of complete TES Statement Form (Form 1) including other required documents and a cover letter addressed to:
                    </p>
                    <div className="text-center font-bold pt-1">
                      <div>EDNA IMELDA F. LEGAZPI</div>
                      <div className="text-[9px] font-normal">Director IV</div>
                      <div className="text-[9px]">CHEDRO MIMAROPA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: FORM 2 – CONSOLIDATED NEW TDP DETAILS (15 Columns Masterlist)     */}
          {/* ======================================================================= */}
          {activeTab === "tab2" && (
            <div className="space-y-4 text-[11px] leading-tight print:block">
              <div className="text-right font-bold text-[13px] text-neutral-800">
                Annex 4 - New TDP Form 2
              </div>

              {/* Header Logos & HEI Info */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <ChedLogo className="w-14 h-14" />
                <div className="text-center flex-1 px-4">
                  <div className="text-[11px]">Republic of the Philippines</div>
                  <div className="font-bold text-xs uppercase">{formData.heiName}</div>
                  <div className="text-[10px] text-ink-muted">{formData.heiAddress}</div>
                  <div className="font-extrabold text-xs uppercase pt-1 tracking-wider text-neutral-900">
                    CONSOLIDATED NEW TDP DETAILS
                  </div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    TDP Batch {formData.batchNumber} - {termText}, AY {formData.academicYear}
                  </div>
                </div>
                <UniFastLogo className="w-14 h-14" />
              </div>

              {/* Reference & Date Banner */}
              <div className="flex justify-end text-xs font-mono gap-4">
                <div>
                  <span className="font-semibold text-neutral-600">TDP Billing Details Reference Number: </span>
                  <span className="font-bold bg-minsu-gold-100 text-minsu-gold-600 px-1 border border-minsu-gold-400">
                    {formData.referenceNumber}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-600">Date: </span>
                  <span>{formData.billingDate}</span>
                </div>
              </div>

              {/* Campus Attention Box */}
              <div className="border border-neutral-800 p-2 bg-neutral-50 text-[10px] space-y-1">
                <div className="font-bold text-minsu-green-900">TDP Continuing Grantees Details:</div>
                <div className="text-red-700 italic font-semibold">
                  TDP will have to be listed and tabulated PER CAMPUS. The Total Amount of the TDP for all campuses should tally with the total amount of TDP in the Billing Statement.
                </div>
                <div className="font-bold text-neutral-800">
                  Current Campus: <span className="underline">{formData.campus}</span>
                </div>
              </div>

              {/* Banner */}
              <div className="bg-neutral-800 text-white font-bold p-1 text-center text-xs tracking-wider">
                Tulong Dunong Program : Based on R.A. No. 10931
              </div>

              {/* 15-Column Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-neutral-800 text-[10px]">
                  <thead>
                    <tr className="bg-neutral-100 font-bold border-b border-neutral-800 text-center">
                      <th rowSpan={2} className="border border-neutral-800 p-1 w-12">5-digit Control Number</th>
                      <th rowSpan={2} className="border border-neutral-800 p-1 w-16">Student Number</th>
                      <th rowSpan={2} className="border border-neutral-800 p-1 w-20">TDP Award Number</th>
                      <th colSpan={3} className="border border-neutral-800 p-1">Student&apos;s Name</th>
                      <th colSpan={4} className="border border-neutral-800 p-1">Student Profile</th>
                      <th colSpan={2} className="border border-neutral-800 p-1">Contact Information</th>
                      <th colSpan={2} className="border border-neutral-800 p-1">TDP-TES Grant</th>
                      <th rowSpan={2} className="border border-neutral-800 p-1 w-20">TOTAL AMOUNT</th>
                    </tr>
                    <tr className="bg-neutral-100 font-bold border-b border-neutral-800 text-center text-[9px]">
                      <th className="border border-neutral-800 p-1">Last Name</th>
                      <th className="border border-neutral-800 p-1">Given Name</th>
                      <th className="border border-neutral-800 p-1 w-7">MI</th>
                      <th className="border border-neutral-800 p-1 w-7">Sex</th>
                      <th className="border border-neutral-800 p-1">Birthdate</th>
                      <th className="border border-neutral-800 p-1">Degree Program</th>
                      <th className="border border-neutral-800 p-1 w-7">Year</th>
                      <th className="border border-neutral-800 p-1">Email</th>
                      <th className="border border-neutral-800 p-1">Phone</th>
                      <th className="border border-neutral-800 p-1 w-10">Batch</th>
                      <th className="border border-neutral-800 p-1 w-14">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.grantees.map((g, idx) => (
                      <tr key={idx} className="border-b border-neutral-300">
                        <td className="border border-neutral-800 p-1 text-center font-mono font-bold">
                          {g.controlNumber}
                        </td>
                        <td className="border border-neutral-800 p-1 font-mono text-center">
                          {g.studentNumber}
                        </td>
                        <td className="border border-neutral-800 p-1 font-mono text-center text-[9px]">
                          {g.tdpAwardNumber}
                        </td>
                        <td className="border border-neutral-800 p-1 uppercase font-bold">
                          {g.lastName}
                        </td>
                        <td className="border border-neutral-800 p-1 uppercase">
                          {g.givenName}
                        </td>
                        <td className="border border-neutral-800 p-1 text-center uppercase">
                          {g.middleInitial}
                        </td>
                        <td className="border border-neutral-800 p-1 text-center">
                          {g.sex}
                        </td>
                        <td className="border border-neutral-800 p-1 text-center text-[9px]">
                          {g.birthdate}
                        </td>
                        <td className="border border-neutral-800 p-1 text-[9px]">
                          {g.degreeProgram}
                        </td>
                        <td className="border border-neutral-800 p-1 text-center">
                          {g.yearLevel}
                        </td>
                        <td className="border border-neutral-800 p-1 text-[9px] truncate max-w-[120px]">
                          {g.email}
                        </td>
                        <td className="border border-neutral-800 p-1 font-mono text-center text-[9px]">
                          {g.phone}
                        </td>
                        <td className="border border-neutral-800 p-1 text-center font-mono">
                          {g.tdpBatch}
                        </td>
                        <td className="border border-neutral-800 p-1 text-right font-mono">
                          ₱{g.tdpAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-neutral-800 p-1 text-right font-mono font-bold">
                          ₱{g.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}

                    {/* Summary Totals Rows */}
                    <tr className="font-bold border-t-2 border-neutral-900 bg-neutral-50">
                      <td colSpan={13} className="border border-neutral-800 p-1 text-left uppercase">
                        TOTAL TULONG DUNONG PROGRAM
                      </td>
                      <td colSpan={2} className="border border-neutral-800 p-1 text-right font-mono font-bold">
                        ₱{formData.totalSubsidy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold bg-neutral-50">
                      <td colSpan={13} className="border border-neutral-800 p-1 text-left">
                        Add .5 percent (.005%) Administrative Support for Partner Institutions
                      </td>
                      <td colSpan={2} className="border border-neutral-800 p-1 text-right font-mono font-bold">
                        ₱{formData.managementFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold bg-minsu-gold-100 text-neutral-900">
                      <td colSpan={13} className="border border-neutral-800 p-1 text-left uppercase">
                        TOTAL TDP BILLING PER CAMPUS ({formData.campus})
                      </td>
                      <td colSpan={2} className="border border-neutral-800 p-1 text-right font-mono font-extrabold text-xs">
                        ₱{formData.grandTotalBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold bg-neutral-100">
                      <td colSpan={13} className="border border-neutral-800 p-1 text-left uppercase">
                        TOTAL TDP BILLING ALL CAMPUSES
                      </td>
                      <td colSpan={2} className="border border-neutral-800 p-1 text-right font-mono font-extrabold text-xs text-minsu-green-900">
                        ₱{formData.grandTotalBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4 Signatory Blocks */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-neutral-800 text-[10px]">
                <div className="space-y-1">
                  <div className="text-neutral-500 font-medium">Prepared by:</div>
                  <div className="h-10"></div>
                  <div className="font-bold border-b border-neutral-800 pb-0.5 text-center">
                    {formData.signatories?.tesFocalPerson?.name || "ENGR. EDWIN C. CAYETANO"}
                  </div>
                  <div className="text-[9px] text-center text-neutral-600">
                    {formData.signatories?.tesFocalPerson?.position || "HEI TES Focal Person / Coordinator"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-neutral-500 font-medium">As to correctness of enrollment data:</div>
                  <div className="h-10"></div>
                  <div className="font-bold border-b border-neutral-800 pb-0.5 text-center">
                    {formData.signatories?.registrar?.name || "ATTY. ROWENA S. DE GUZMAN"}
                  </div>
                  <div className="text-[9px] text-center text-neutral-600">
                    {formData.signatories?.registrar?.position || "HEI Registrar"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-neutral-500 font-medium">As to correctness of financial data:</div>
                  <div className="h-10"></div>
                  <div className="font-bold border-b border-neutral-800 pb-0.5 text-center">
                    {formData.signatories?.accountingHead?.name || "MA. ELENA L. BAUTISTA, CPA"}
                  </div>
                  <div className="text-[9px] text-center text-neutral-600">
                    {formData.signatories?.accountingHead?.position || "HEI Chief Accountant"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-neutral-500 font-medium">Approved by:</div>
                  <div className="h-10"></div>
                  <div className="font-bold border-b border-neutral-800 pb-0.5 text-center">
                    {formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD"}
                  </div>
                  <div className="text-[9px] text-center text-neutral-600">
                    {formData.signatories?.president?.position || "HEI President"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: FORM 3 – CERTIFICATION (Notarized Letter Format)                  */}
          {/* ======================================================================= */}
          {activeTab === "tab3" && (
            <div className="space-y-6 text-xs leading-relaxed max-w-3xl mx-auto py-4 print:block">
              <div className="text-right font-bold text-[13px] text-neutral-800">
                Annex 4 - New TDP Form 3
              </div>

              {/* HEI Letterhead */}
              <div className="text-center space-y-1 border-b-2 border-neutral-900 pb-4">
                <div className="text-red-600 text-xs font-semibold tracking-wider">OFFICIAL HEI LETTERHEAD</div>
                <div className="text-sm font-medium">Republic of the Philippines</div>
                <div className="text-base font-bold text-minsu-green-900 uppercase">
                  {formData.heiName}
                </div>
                <div className="text-xs text-ink-muted">{formData.heiAddress}</div>
              </div>

              {/* Date */}
              <div className="flex justify-end pt-2">
                <div>
                  <span className="font-semibold">Date: </span>
                  <span className="border-b border-neutral-800 px-3">{formData.billingDate}</span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-4">
                <h2 className="text-lg font-bold tracking-widest uppercase text-neutral-900">
                  CERTIFICATION
                </h2>
              </div>

              {/* Body */}
              <div className="space-y-4 text-justify leading-relaxed">
                <p className="font-bold uppercase tracking-wider text-neutral-900">
                  TO WHOM IT MAY CONCERN:
                </p>

                <p>
                  This is to certify that the total number of TDP grantees by campus as shown below, are qualified to avail of the <strong>Tulong Dunong Program (TDP)</strong> under R.A. No. 10931 also known as Universal Access to Quality Tertiary Education (UAQTE) for the <strong>{termText}</strong> of Academic Year <strong>{formData.academicYear}</strong>.
                </p>

                {/* Campus Certification Table */}
                <div className="py-2">
                  <table className="w-full border-collapse border border-neutral-800 text-xs">
                    <thead>
                      <tr className="bg-neutral-100 font-bold border-b border-neutral-800 text-center">
                        <th className="border border-neutral-800 p-2 text-left">Name of Campus</th>
                        <th className="border border-neutral-800 p-2 w-32">Batch Number</th>
                        <th className="border border-neutral-800 p-2 w-44">Number of TDP Grantees</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-neutral-800 p-2 font-semibold">
                          {formData.campus}
                        </td>
                        <td className="border border-neutral-800 p-2 text-center font-mono">
                          {formData.batchNumber}
                        </td>
                        <td className="border border-neutral-800 p-2 text-center font-mono font-bold">
                          {formData.totalGrantees}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-neutral-900 bg-neutral-50 font-bold">
                        <td colSpan={2} className="border border-neutral-800 p-2 text-left uppercase">
                          Total
                        </td>
                        <td className="border border-neutral-800 p-2 text-center font-mono font-extrabold text-sm text-minsu-green-900">
                          {formData.totalGrantees}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  This further certifies that the students&apos; information indicated in the billing statement of the Masterlist of New TDP Grantees (Annex 4) is accurate and complete.
                </p>

                <p>
                  This certification is being issued in accordance with the UniFAST Memorandum Circular (JMC) No. <span className="underline font-bold px-1">{formData.jmcNumber || "04"}</span> Series of <span className="underline font-bold px-1">{formData.jmcSeries || "2022"}</span>, on the Enhanced Guidelines of the Tulong Dunong Program (TDP).
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 space-y-8">
                <div className="space-y-2">
                  <div className="text-xs text-neutral-600">Certified by:</div>
                  <div className="pt-6 max-w-sm">
                    <div className="font-bold border-b border-neutral-800 pb-1 text-center">
                      {formData.signatories?.registrar?.name || "ATTY. ROWENA S. DE GUZMAN"}
                    </div>
                    <div className="text-[11px] text-neutral-600 text-center pt-0.5">
                      Signature over Printed Name of the School Registrar
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-neutral-600">Approved by:</div>
                  <div className="pt-6 max-w-sm">
                    <div className="font-bold border-b border-neutral-800 pb-1 text-center">
                      {formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD"}
                    </div>
                    <div className="text-[11px] text-neutral-600 text-center pt-0.5">
                      Signature over Printed Name of the President of the HEIs
                    </div>
                  </div>
                </div>
              </div>

              {/* Jurat / Notary Box */}
              <div className="pt-6 border-t border-neutral-300 text-[11px] space-y-2 text-neutral-700">
                <div className="text-red-600 font-bold text-xs">(must be notarized)</div>
                <p>
                  SUBSCRIBED AND SWORN to before me this _____ day of _______________, 2024 at {formData.notary?.issuedAt || "Victoria, Oriental Mindoro"}, affiants exhibiting their valid government identification credentials.
                </p>
                <div className="grid grid-cols-2 pt-4">
                  <div className="space-y-1 font-mono text-[10px]">
                    <div>Doc. No. : <span className="border-b border-neutral-800 px-2">{formData.notary?.docNo || "____"}</span></div>
                    <div>Page No. : <span className="border-b border-neutral-800 px-2">{formData.notary?.pageNo || "____"}</span></div>
                    <div>Book No. : <span className="border-b border-neutral-800 px-2">{formData.notary?.bookNo || "____"}</span></div>
                    <div>Series of : <span className="border-b border-neutral-800 px-2">{formData.notary?.series || "2024"}</span></div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-10"></div>
                    <div className="border-t border-neutral-800 font-bold">NOTARY PUBLIC</div>
                    <div className="text-[9px] text-neutral-500">Until December 31, 2024</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: IMPORT FROM ANNEX 2 APPLICANT CALLS                              */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-line shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-minsu-green-700" />
                <h3 className="font-bold text-sm text-ink">
                  Import Grantees from Annex 2 Student Portal
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              Select verified or accepted applicant submissions from online TDP calls to automatically append them as new grantees in Form 2.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter by applicant name or email..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-line bg-page focus:outline-none focus:ring-1 focus:ring-minsu-green-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line border border-line rounded-xl max-h-60 apple-scrollbar">
              {isLoadingApps ? (
                <div className="p-8 text-center text-xs text-ink-muted">Loading applications...</div>
              ) : availableApplications.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted">
                  No accepted student applications found in database.
                </div>
              ) : (
                availableApplications
                  .filter((a) => {
                    if (!appSearch) return true;
                    const q = appSearch.toLowerCase();
                    return (
                      a.student?.name?.toLowerCase().includes(q) ||
                      a.student?.email?.toLowerCase().includes(q) ||
                      a.trackingCode?.toLowerCase().includes(q)
                    );
                  })
                  .map((app) => {
                    const isSelected = selectedAppIds.includes(app.id);
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAppIds(selectedAppIds.filter((id) => id !== app.id));
                          } else {
                            setSelectedAppIds([...selectedAppIds, app.id]);
                          }
                        }}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? "bg-minsu-green-50" : "hover:bg-page"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded-xs text-minsu-green-700"
                          />
                          <div>
                            <div className="font-bold text-ink">
                              {app.student?.name || "Student Applicant"}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                              {app.student?.email} • Tracking: <span className="font-mono">{app.trackingCode}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-minsu-green-100 text-minsu-green-700">
                          {app.status}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <span className="text-xs text-ink-muted">
                {selectedAppIds.length} applicant{selectedAppIds.length === 1 ? "" : "s"} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={commitImportApplications}
                  disabled={selectedAppIds.length === 0}
                  className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import {selectedAppIds.length} to Form 2</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
