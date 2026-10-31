"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChedLogo, UniFastLogo } from "./ched-unifast-logos";
import { AnnexLogo } from "./annex-logo";
import { PrintPreviewModal } from "./print-preview-modal";
import {
  Annex3FormData,
  Annex3Grantee,
  Annex3OtherGrantee,
  OtherGranteeStatus,
  LogoConfig,
} from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  UserX,
  Award,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutDashboard,
  School,
  DollarSign,
  ShieldCheck,
  Scale,
  Calendar,
  Building,
} from "lucide-react";

interface Annex3SheetSuiteProps {
  initialData?: Annex3FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex3SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex3SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" (Interactive Data Suite) or "sheet" (Refined Official Document Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [activeTab, setActiveTab] = useState<"tab1" | "tab2" | "tab3" | "tab4">("tab1");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printScope, setPrintScope] = useState<"active" | "all">("active");

  // Sync orientation with active tab
  useEffect(() => {
    if (activeTab === "tab2" || activeTab === "tab3") {
      setPrintOrientation("landscape");
    } else {
      setPrintOrientation("portrait");
    }
  }, [activeTab]);

  // Global print shortcut listener
  useEffect(() => {
    const handleOpenPrint = () => setIsPrintModalOpen(true);
    window.addEventListener("minsu:open-print-modal", handleOpenPrint);
    return () => window.removeEventListener("minsu:open-print-modal", handleOpenPrint);
  }, []);
  const [workspaceTab, setWorkspaceTab] = useState<"billed" | "other" | "signatories">("billed");
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Default initial values
  const defaultData: Annex3FormData = useMemo(() => {
    return (
      initialData || {
        regionCode: "MIMAROPA",
        heiCode: "MINSU",
        heiName: "Mindoro State University - Bongabong Campus",
        heiAddress: "Labasan, Bongabong, Oriental Mindoro",
        academicYear: "2024-2025",
        termCode: "1",
        trancheNumber: "1",
        batchNumber: "3",
        referenceNumber: "MIMAROPA-MINSU-2024-1-1:3",
        billingDate: "March 4, 2025",
        isLastBatch: false,
        totalGrantees: 5,
        stipendPerGrantee: 7500,
        totalSubsidy: 37500,
        managementFeeRate: 0.005,
        managementFeeAmount: 187.5,
        grandTotalBilling: 37687.5,
        billedGrantees: [
          {
            controlNumber: "00001",
            studentNumber: "2023-00101",
            tdpAwardNumber: "2024-TDP-4060-00001",
            lastName: "DELA CRUZ",
            givenName: "JUAN",
            middleInitial: "P.",
            sex: "M",
            birthdate: "05/14/2004",
            degreeProgram: "BS Information Technology",
            yearLevel: "2",
            email: "juan.delacruz@minsu.edu.ph",
            phone: "09171112233",
            tdpBatch: "3",
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: "Bongabong Campus",
          },
          {
            controlNumber: "00002",
            studentNumber: "2023-00102",
            tdpAwardNumber: "2024-TDP-4060-00002",
            lastName: "SANTOS",
            givenName: "MARIA",
            middleInitial: "C.",
            sex: "F",
            birthdate: "09/20/2003",
            degreeProgram: "BS Agriculture",
            yearLevel: "2",
            email: "maria.santos@minsu.edu.ph",
            phone: "09172223344",
            tdpBatch: "3",
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: "Bongabong Campus",
          },
          {
            controlNumber: "00003",
            studentNumber: "2023-00201",
            tdpAwardNumber: "2024-TDP-4060-00003",
            lastName: "REYES",
            givenName: "ANGELO",
            middleInitial: "D.",
            sex: "M",
            birthdate: "11/12/2004",
            degreeProgram: "BS Hospitality Management",
            yearLevel: "2",
            email: "angelo.reyes@minsu.edu.ph",
            phone: "09173334455",
            tdpBatch: "3",
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: "Bongabong Campus",
          },
          {
            controlNumber: "00004",
            studentNumber: "2023-00202",
            tdpAwardNumber: "2024-TDP-4060-00004",
            lastName: "GARCIA",
            givenName: "CAMILLE",
            middleInitial: "M.",
            sex: "F",
            birthdate: "02/28/2004",
            degreeProgram: "BS Computer Science",
            yearLevel: "2",
            email: "camille.garcia@minsu.edu.ph",
            phone: "09174445566",
            tdpBatch: "3",
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: "Bongabong Campus",
          },
          {
            controlNumber: "00005",
            studentNumber: "2023-00301",
            tdpAwardNumber: "2024-TDP-4060-00005",
            lastName: "RAMOS",
            givenName: "JOSHUA",
            middleInitial: "B.",
            sex: "M",
            birthdate: "07/04/2003",
            degreeProgram: "BS Fisheries",
            yearLevel: "2",
            email: "joshua.ramos@minsu.edu.ph",
            phone: "09175556677",
            tdpBatch: "3",
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: "Bongabong Campus",
          },
        ],
        otherGrantees: [],
        signatories: {
          accountingHead: { name: "Atty. Juan De Castro", position: "Head, Accounting/Authorized Representative" },
          president: { name: "Dr. Enya Marie D. Apostol", position: "President/Authorized Representative" },
          tesFocalPerson: { name: "Prof. Maria Santos", position: "HEI TES Focal Person/Scholarship Coordinator" },
          registrar: { name: "Dr. Nemo R. San Pedro", position: "HEI Registrar" },
        },
        notary: {
          docNo: "412",
          pageNo: "84",
          bookNo: "XII",
          series: "2025",
          issuedAt: "Bongabong, Oriental Mindoro",
          issuedOn: "March 4, 2025",
        },
      }
    );
  }, [initialData]);

  const [formData, setFormData] = useState<Annex3FormData>(defaultData);
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

  // Synchronize financial calculations when billed grantees change
  useEffect(() => {
    const totalCount = formData.billedGrantees.length;
    const totalSubs = totalCount * 7500;
    const mgmtFee = totalSubs * 0.005;
    const grand = totalSubs + mgmtFee;

    setFormData((prev) => ({
      ...prev,
      totalGrantees: totalCount,
      totalSubsidy: totalSubs,
      managementFeeAmount: mgmtFee,
      grandTotalBilling: grand,
    }));
  }, [formData.billedGrantees.length]);

  // Re-index control numbers sequentially
  const reindexList = (list: Annex3Grantee[]) => {
    return list.map((item, idx) => ({
      ...item,
      controlNumber: String(idx + 1).padStart(5, "0"),
    }));
  };

  // Form 2: Update single field in a grantee row
  const updateGranteeField = (index: number, field: keyof Annex3Grantee, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.billedGrantees];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, billedGrantees: updated };
    });
  };

  // Form 3: Update single field in other grantee row
  const updateOtherField = (index: number, field: keyof Annex3OtherGrantee, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.otherGrantees];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, otherGrantees: updated };
    });
  };

  // Move between Form 2 (Billed) and Form 3 (Other)
  const moveGranteeToOther = (index: number) => {
    const target = formData.billedGrantees[index];
    const newForm2 = formData.billedGrantees.filter((_, i) => i !== index);

    const newOther: Annex3OtherGrantee = {
      controlNumber: String(formData.otherGrantees.length + 1).padStart(5, "0"),
      studentNumber: target.studentNumber,
      tdpAwardNumber: target.tdpAwardNumber,
      lastName: target.lastName,
      givenName: target.givenName,
      middleInitial: target.middleInitial,
      sex: target.sex,
      birthdate: target.birthdate,
      degreeProgram: target.degreeProgram,
      yearLevel: target.yearLevel,
      status: "dropped",
      remarks: "Unbilled for this billing cycle",
      campus: target.campus,
    };

    setFormData((prev) => ({
      ...prev,
      billedGrantees: reindexList(newForm2),
      otherGrantees: [...prev.otherGrantees, newOther],
    }));
  };

  const moveOtherToBilled = (index: number) => {
    const target = formData.otherGrantees[index];
    const newForm3 = formData.otherGrantees.filter((_, i) => i !== index);

    const newBilled: Annex3Grantee = {
      controlNumber: String(formData.billedGrantees.length + 1).padStart(5, "0"),
      studentNumber: target.studentNumber,
      tdpAwardNumber: target.tdpAwardNumber,
      lastName: target.lastName,
      givenName: target.givenName,
      middleInitial: target.middleInitial,
      sex: target.sex,
      birthdate: target.birthdate,
      degreeProgram: target.degreeProgram,
      yearLevel: target.yearLevel,
      email: `${target.givenName.toLowerCase()}.${target.lastName.toLowerCase()}@minsu.edu.ph`,
      phone: "09170000000",
      tdpBatch: formData.batchNumber,
      semesterAmount: 7500,
      totalAmount: 7500,
      campus: target.campus,
    };

    setFormData((prev) => ({
      ...prev,
      billedGrantees: reindexList([...prev.billedGrantees, newBilled]),
      otherGrantees: newForm3.map((g, i) => ({ ...g, controlNumber: String(i + 1).padStart(5, "0") })),
    }));
  };

  // Add blank row to Form 2
  const addBlankBilledRow = () => {
    const nextIdx = formData.billedGrantees.length + 1;
    const newRow: Annex3Grantee = {
      controlNumber: String(nextIdx).padStart(5, "0"),
      studentNumber: `2024-${String(nextIdx).padStart(5, "0")}`,
      tdpAwardNumber: `2024-TDP-4060-${String(nextIdx).padStart(5, "0")}`,
      lastName: "NEW STUDENT",
      givenName: "FIRSTNAME",
      middleInitial: "A.",
      sex: "M",
      birthdate: "01/01/2004",
      degreeProgram: "BS Information Technology",
      yearLevel: "1",
      email: "student@minsu.edu.ph",
      phone: "09170000000",
      tdpBatch: formData.batchNumber,
      semesterAmount: 7500,
      totalAmount: 7500,
      campus: selectedCampus === "ALL" ? "Bongabong Campus" : selectedCampus,
    };
    setFormData((prev) => ({
      ...prev,
      billedGrantees: [...prev.billedGrantees, newRow],
    }));
  };

  // Add blank row to Form 3
  const addBlankOtherRow = () => {
    const nextIdx = formData.otherGrantees.length + 1;
    const newRow: Annex3OtherGrantee = {
      controlNumber: String(nextIdx).padStart(5, "0"),
      studentNumber: `2024-${String(nextIdx).padStart(5, "0")}`,
      tdpAwardNumber: `2024-TDP-4060-${String(nextIdx).padStart(5, "0")}`,
      lastName: "UNBILLED STUDENT",
      givenName: "FIRSTNAME",
      middleInitial: "B.",
      sex: "F",
      birthdate: "01/01/2004",
      degreeProgram: "BS Agriculture",
      yearLevel: "2",
      status: "dropped",
      remarks: "Non-enrolled this term",
      campus: selectedCampus === "ALL" ? "Bongabong Campus" : selectedCampus,
    };
    setFormData((prev) => ({
      ...prev,
      otherGrantees: [...prev.otherGrantees, newRow],
    }));
  };

  // Delete row
  const removeBilledRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      billedGrantees: reindexList(prev.billedGrantees.filter((_, i) => i !== index)),
    }));
  };

  const removeOtherRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherGrantees: prev.otherGrantees
        .filter((_, i) => i !== index)
        .map((g, i) => ({ ...g, controlNumber: String(i + 1).padStart(5, "0") })),
    }));
  };

  // Load from candidate database
  const loadDatabaseCandidates = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/annex-3/compile?batch=${formData.batchNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
          const mapped: Annex3Grantee[] = data.candidates.map((c: any, idx: number) => ({
            controlNumber: String(idx + 1).padStart(5, "0"),
            studentNumber: c.studentNumber,
            tdpAwardNumber: c.tdpAwardNumber,
            lastName: c.lastName,
            givenName: c.givenName,
            middleInitial: c.middleInitial,
            sex: c.sex,
            birthdate: c.birthdate,
            degreeProgram: c.degreeProgram,
            yearLevel: c.yearLevel,
            email: c.email,
            phone: c.phone,
            tdpBatch: formData.batchNumber,
            semesterAmount: 7500,
            totalAmount: 7500,
            campus: c.campus || "Bongabong Campus",
          }));
          setFormData((prev) => ({
            ...prev,
            billedGrantees: mapped,
          }));
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setError("No candidates found in database for this batch.");
        }
      }
    } catch {
      setError("Failed to fetch database candidates");
    }
  };

  // Campus groups for Form 4 and campus tally
  const campusTally = useMemo(() => {
    const tally: Record<string, number> = {};
    formData.billedGrantees.forEach((g) => {
      const c = g.campus || "Main Campus (Victoria / Alcate)";
      tally[c] = (tally[c] || 0) + 1;
    });
    return tally;
  }, [formData.billedGrantees]);

  // Unique campuses for filtering
  const availableCampuses = useMemo(() => {
    const set = new Set<string>();
    set.add("Main Campus (Victoria / Alcate)");
    set.add("Calapan Campus");
    set.add("Bongabong Campus");
    formData.billedGrantees.forEach((g) => g.campus && set.add(g.campus));
    formData.otherGrantees.forEach((g) => g.campus && set.add(g.campus));
    return Array.from(set);
  }, [formData.billedGrantees, formData.otherGrantees]);

  // Filtered lists for interactive workspace
  const filteredBilled = useMemo(() => {
    return formData.billedGrantees.filter((g) => {
      const matchesCampus = selectedCampus === "ALL" || g.campus === selectedCampus;
      if (!matchesCampus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.lastName.toLowerCase().includes(q) ||
        g.givenName.toLowerCase().includes(q) ||
        g.studentNumber.toLowerCase().includes(q) ||
        g.tdpAwardNumber.toLowerCase().includes(q) ||
        g.degreeProgram.toLowerCase().includes(q)
      );
    });
  }, [formData.billedGrantees, selectedCampus, searchQuery]);

  const filteredOther = useMemo(() => {
    return formData.otherGrantees.filter((g) => {
      const matchesCampus = selectedCampus === "ALL" || g.campus === selectedCampus;
      if (!matchesCampus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.lastName.toLowerCase().includes(q) ||
        g.givenName.toLowerCase().includes(q) ||
        g.studentNumber.toLowerCase().includes(q) ||
        g.tdpAwardNumber.toLowerCase().includes(q) ||
        g.degreeProgram.toLowerCase().includes(q) ||
        g.remarks.toLowerCase().includes(q)
      );
    });
  }, [formData.otherGrantees, selectedCampus, searchQuery]);

  // Save changes to database
  const handleSave = async (submitDirectly: boolean = false) => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (mode === "create") {
        const title = `Annex 3: Continuing Billing Statement - Batch ${formData.batchNumber} (${formData.referenceNumber})`;
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annexTypeId,
            title,
            formData,
            submitDirectly,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create Annex 3 document");
        router.push(`/documents/${data.document.id}`);
      } else {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: documentTitle || `Annex 3: Continuing Billing Statement - Batch ${formData.batchNumber}`,
            formData,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update Annex 3 document");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onSaved && documentId) onSaved(documentId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const termLabel = formData.termCode === "1" ? "1st Semester" : "2nd Semester";

  const availableForms = [
    { id: "tab1", label: "Form 1: Statement", defaultOrientation: "portrait" as const },
    { id: "tab2", label: `Form 2: Billed (${formData.billedGrantees.length})`, defaultOrientation: "landscape" as const },
    { id: "tab3", label: `Form 3: Other (${formData.otherGrantees.length})`, defaultOrientation: "landscape" as const },
    { id: "tab4", label: "Form 4: Certificate", defaultOrientation: "portrait" as const },
  ];
  const activeFormLabel = availableForms.find((f) => f.id === activeTab)?.label || "Form";

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* ========================================================================= */}
      {/* 1. APPLE DUAL-MODE ACTION & NAVIGATION TOOLBAR                             */}
      {/* ========================================================================= */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-2 rounded-2xl border border-line shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden transition-all duration-200">
        {/* Left Side: View Mode Toggle & Form Navigation */}
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
                { id: "tab2", label: `Form 2: Billed (${formData.billedGrantees.length})` },
                { id: "tab3", label: `Form 3: Other (${formData.otherGrantees.length})` },
                { id: "tab4", label: "Form 4: Certificate" },
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadDatabaseCandidates}
            className="text-xs h-8 border-line hover:bg-minsu-green-50 text-ink gap-1.5 apple-press"
            title="Reload candidates from database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-minsu-green-700" />
            <span className="hidden sm:inline">Sync Data</span>
          </Button>

          {documentId && (
            <a
              href={`/api/annex-3/export-excel?documentId=${documentId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-minsu-green-50 text-minsu-green-700 text-xs font-semibold apple-press transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
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
            {mode === "create" ? "Save Annex 3" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-minsu-green-50 border border-minsu-green-100 flex items-center gap-2.5 text-minsu-green-900 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-minsu-green-600 shrink-0" />
          All Annex 3 billing figures and scholar records saved successfully.
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs font-semibold apple-shadow animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODE A: INTERACTIVE WORKSPACE (Modern Apple Data Suite)                */}
      {/* ========================================================================= */}
      {viewMode === "workspace" && (
        <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
          {/* Top Live KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Enrolled Scholars */}
            <div className="glass-card p-5 rounded-2xl border border-line apple-shadow relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Total Grantees
                </span>
                <span className="w-8 h-8 rounded-xl bg-minsu-green-100 text-minsu-green-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-heading text-3xl font-bold text-ink">
                  {formData.totalGrantees}
                </div>
                <div className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-minsu-green-100 text-minsu-green-700 font-bold text-[10px]">
                    ₱7,500.00
                  </span>
                  <span>per scholar / semester</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Subsidy Claim */}
            <div className="glass-card p-5 rounded-2xl border border-line apple-shadow relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Total TDP Subsidy
                </span>
                <span className="w-8 h-8 rounded-xl bg-minsu-gold-100 text-minsu-gold-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-ink">
                  ₱{formData.totalSubsidy.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  Claimed against UAQTE funds
                </div>
              </div>
            </div>

            {/* Card 3: Management Fee */}
            <div className="glass-card p-5 rounded-2xl border border-line apple-shadow relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Management Fee (0.5%)
                </span>
                <span className="w-8 h-8 rounded-xl bg-minsu-green-100 text-minsu-green-700 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-ink">
                  ₱{formData.managementFeeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  0.005 Partner Institution share
                </div>
              </div>
            </div>

            {/* Card 4: Grand Total Billing */}
            <div className="glass-card p-5 rounded-2xl border-2 border-minsu-green-700 apple-shadow relative overflow-hidden bg-gradient-to-br from-white to-minsu-green-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-minsu-green-900 uppercase tracking-wider">
                  Grand Total Billing
                </span>
                <span className="w-8 h-8 rounded-xl bg-minsu-green-700 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl sm:text-3xl font-black text-minsu-green-900">
                  ₱{formData.grandTotalBilling.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-minsu-green-700 font-semibold mt-1">
                  Batch {formData.batchNumber} • {termLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Parameters Box */}
          <div className="bg-white p-5 rounded-2xl border border-line apple-shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-minsu-green-700" />
                Statement Reference No.
              </label>
              <input
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full text-xs font-mono font-bold text-ink bg-page px-3 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 focus:border-minsu-green-700 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-minsu-green-700" />
                Billing Statement Date
              </label>
              <input
                value={formData.billingDate}
                onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                className="w-full text-xs font-bold text-ink bg-page px-3 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 focus:border-minsu-green-700 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-minsu-green-700" />
                Academic Year & Term
              </label>
              <div className="flex gap-2">
                <input
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                  className="w-2/3 text-xs font-bold text-ink bg-page px-3 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                />
                <select
                  value={formData.termCode}
                  onChange={(e) => setFormData({ ...formData, termCode: e.target.value as any })}
                  className="w-1/3 text-xs font-bold text-ink bg-page px-2 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                >
                  <option value="1">1st Sem</option>
                  <option value="2">2nd Sem</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-minsu-green-700" />
                Batch & Tranche
              </label>
              <div className="flex gap-2">
                <input
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="Batch #"
                  className="w-1/2 text-xs font-bold text-ink bg-page px-3 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                />
                <select
                  value={formData.trancheNumber}
                  onChange={(e) => setFormData({ ...formData, trancheNumber: e.target.value as any })}
                  className="w-1/2 text-xs font-bold text-ink bg-page px-2 py-2 rounded-xl border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                >
                  <option value="1">Tranche 1</option>
                  <option value="2">Tranche 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scholars Data Workspace Navigation & Controls */}
          <div className="bg-white rounded-2xl border border-line apple-shadow overflow-hidden">
            {/* Top Workspace Tab Bar */}
            <div className="p-4 border-b border-line flex flex-col md:flex-row items-center justify-between gap-3 bg-page/60">
              {/* Category Pills */}
              <div className="inline-flex p-1 rounded-xl bg-slate-200/60 w-full sm:w-auto">
                <button
                  onClick={() => setWorkspaceTab("billed")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold apple-press transition-all ${
                    workspaceTab === "billed"
                      ? "bg-white text-minsu-green-900 shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-minsu-green-700" />
                  <span>Billed Scholars ({formData.billedGrantees.length})</span>
                </button>
                <button
                  onClick={() => setWorkspaceTab("other")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold apple-press transition-all ${
                    workspaceTab === "other"
                      ? "bg-white text-minsu-gold-600 shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-minsu-gold-600" />
                  <span>Unbilled / Form 3 ({formData.otherGrantees.length})</span>
                </button>
                <button
                  onClick={() => setWorkspaceTab("signatories")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold apple-press transition-all ${
                    workspaceTab === "signatories"
                      ? "bg-white text-minsu-green-900 shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-minsu-green-700" />
                  <span>Signatories & Notary</span>
                </button>
              </div>

              {/* Action Buttons for Table */}
              {workspaceTab !== "signatories" && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {workspaceTab === "billed" ? (
                    <Button
                      size="sm"
                      onClick={addBlankBilledRow}
                      className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white text-xs h-8 gap-1.5 apple-press font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Billed Scholar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={addBlankOtherRow}
                      className="bg-minsu-gold-600 hover:bg-minsu-gold-500 text-white text-xs h-8 gap-1.5 apple-press font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Unbilled Scholar
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            {workspaceTab !== "signatories" && (
              <div className="p-4 border-b border-line flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Campus Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto apple-scrollbar pb-1 md:pb-0 w-full md:w-auto">
                  <span className="text-xs font-semibold text-ink-muted mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-minsu-green-700" />
                    Campus:
                  </span>
                  <button
                    onClick={() => setSelectedCampus("ALL")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all apple-press ${
                      selectedCampus === "ALL"
                        ? "bg-minsu-green-700 text-white"
                        : "bg-minsu-green-50 text-minsu-green-800 hover:bg-minsu-green-100"
                    }`}
                  >
                    All Campuses ({workspaceTab === "billed" ? formData.billedGrantees.length : formData.otherGrantees.length})
                  </button>
                  {availableCampuses.map((c) => {
                    const count =
                      workspaceTab === "billed"
                        ? formData.billedGrantees.filter((g) => g.campus === c).length
                        : formData.otherGrantees.filter((g) => g.campus === c).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedCampus(c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all apple-press ${
                          selectedCampus === c
                            ? "bg-minsu-green-700 text-white"
                            : "bg-minsu-green-50 text-minsu-green-800 hover:bg-minsu-green-100"
                        }`}
                      >
                        {c.replace(" Campus", "")} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student, award, name..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-line bg-page focus:bg-white focus:ring-2 focus:ring-minsu-green-700 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Content Area 1: Billed Scholars Table */}
            {workspaceTab === "billed" && (
              <div className="overflow-x-auto apple-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-minsu-green-50 text-minsu-green-900 border-b border-line text-[11px] font-bold">
                      <th className="py-2.5 px-3 w-12 text-center">Ctrl #</th>
                      <th className="py-2.5 px-3 w-28">Student No.</th>
                      <th className="py-2.5 px-3 w-36">TDP Award No.</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-2 w-10 text-center">Sex</th>
                      <th className="py-2.5 px-3">Degree Program</th>
                      <th className="py-2.5 px-2 w-10 text-center">Yr</th>
                      <th className="py-2.5 px-3">Campus</th>
                      <th className="py-2.5 px-3 text-right w-24">Stipend</th>
                      <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredBilled.map((g, idx) => {
                      const realIndex = formData.billedGrantees.findIndex(
                        (item) => item.controlNumber === g.controlNumber
                      );
                      return (
                        <tr key={g.controlNumber || idx} className="hover:bg-minsu-green-50/40 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-minsu-green-900">
                            {g.controlNumber}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <input
                              value={g.studentNumber}
                              onChange={(e) => updateGranteeField(realIndex, "studentNumber", e.target.value)}
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1.5 py-0.5"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <input
                              value={g.tdpAwardNumber}
                              onChange={(e) => updateGranteeField(realIndex, "tdpAwardNumber", e.target.value)}
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1.5 py-0.5 text-minsu-green-800 font-medium"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-1 items-center">
                              <input
                                value={g.lastName}
                                onChange={(e) => updateGranteeField(realIndex, "lastName", e.target.value.toUpperCase())}
                                placeholder="LASTNAME"
                                className="w-1/2 bg-transparent font-bold focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1 py-0.5 uppercase"
                              />
                              <input
                                value={g.givenName}
                                onChange={(e) => updateGranteeField(realIndex, "givenName", e.target.value.toUpperCase())}
                                placeholder="GIVEN NAME"
                                className="w-1/2 bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1 py-0.5 uppercase"
                              />
                              <input
                                value={g.middleInitial}
                                onChange={(e) => updateGranteeField(realIndex, "middleInitial", e.target.value.toUpperCase())}
                                placeholder="MI"
                                className="w-8 text-center bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1 py-0.5 uppercase"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <select
                              value={g.sex}
                              onChange={(e) => updateGranteeField(realIndex, "sex", e.target.value)}
                              className="bg-transparent text-center font-bold focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded"
                            >
                              <option value="M">M</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.degreeProgram}
                              onChange={(e) => updateGranteeField(realIndex, "degreeProgram", e.target.value)}
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded px-1.5 py-0.5 truncate"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              value={g.yearLevel}
                              onChange={(e) => updateGranteeField(realIndex, "yearLevel", e.target.value)}
                              className="w-8 text-center bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded py-0.5"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={g.campus}
                              onChange={(e) => updateGranteeField(realIndex, "campus", e.target.value)}
                              className="bg-transparent text-[11px] font-semibold text-ink-muted focus:bg-white focus:ring-1 focus:ring-minsu-green-700 rounded p-1"
                            >
                              <option value="Main Campus (Victoria / Alcate)">Main Campus</option>
                              <option value="Calapan Campus">Calapan Campus</option>
                              <option value="Bongabong Campus">Bongabong Campus</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-minsu-green-900">
                            ₱{g.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => moveGranteeToOther(realIndex)}
                                title="Move to Form 3 (Unbilled)"
                                className="p-1 rounded hover:bg-minsu-gold-100 text-minsu-gold-600 transition apple-press"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeBilledRow(realIndex)}
                                title="Delete row"
                                className="p-1 rounded hover:bg-red-50 text-red-600 transition apple-press"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBilled.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-ink-muted italic">
                          No billed scholars found matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Content Area 2: Unbilled Scholars Table (Form 3) */}
            {workspaceTab === "other" && (
              <div className="overflow-x-auto apple-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-minsu-gold-100/60 text-minsu-gold-600 border-b border-line text-[11px] font-bold">
                      <th className="py-2.5 px-3 w-12 text-center">Ctrl #</th>
                      <th className="py-2.5 px-3 w-28">Student No.</th>
                      <th className="py-2.5 px-3 w-36">TDP Award No.</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-2 w-10 text-center">Sex</th>
                      <th className="py-2.5 px-3">Degree Program</th>
                      <th className="py-2.5 px-2 w-10 text-center">Yr</th>
                      <th className="py-2.5 px-3 w-28">Status</th>
                      <th className="py-2.5 px-3">Remarks / Reason</th>
                      <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredOther.map((g, idx) => {
                      const realIndex = formData.otherGrantees.findIndex(
                        (item) => item.controlNumber === g.controlNumber
                      );
                      return (
                        <tr key={g.controlNumber || idx} className="hover:bg-minsu-gold-50/40 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-minsu-gold-600">
                            {g.controlNumber}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <input
                              value={g.studentNumber}
                              onChange={(e) => updateOtherField(realIndex, "studentNumber", e.target.value)}
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-gold-500 rounded px-1.5 py-0.5"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <input
                              value={g.tdpAwardNumber}
                              onChange={(e) => updateOtherField(realIndex, "tdpAwardNumber", e.target.value)}
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-gold-500 rounded px-1.5 py-0.5"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-ink">
                            {g.lastName}, {g.givenName} {g.middleInitial}
                          </td>
                          <td className="py-2 px-2 text-center">{g.sex}</td>
                          <td className="py-2 px-3">{g.degreeProgram}</td>
                          <td className="py-2 px-2 text-center">{g.yearLevel}</td>
                          <td className="py-2 px-3">
                            <select
                              value={g.status}
                              onChange={(e) => updateOtherField(realIndex, "status", e.target.value as OtherGranteeStatus)}
                              className="bg-minsu-gold-100 text-minsu-gold-600 font-bold text-[11px] rounded px-2 py-1 outline-none border border-minsu-gold-400/40"
                            >
                              <option value="not enrolled">Not Enrolled</option>
                              <option value="dropped">Dropped</option>
                              <option value="waived">Waived</option>
                              <option value="on LOA">On LOA</option>
                              <option value="transferee">Transferee</option>
                              <option value="graduated">Graduated</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              value={g.remarks}
                              onChange={(e) => updateOtherField(realIndex, "remarks", e.target.value)}
                              placeholder="Reason not billed..."
                              className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-minsu-gold-500 rounded px-1.5 py-0.5 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => moveOtherToBilled(realIndex)}
                                title="Move back to Billed (Form 2)"
                                className="px-2 py-0.5 rounded bg-minsu-green-100 text-minsu-green-700 hover:bg-minsu-green-200 text-[10px] font-bold apple-press"
                              >
                                Bill Now
                              </button>
                              <button
                                onClick={() => removeOtherRow(realIndex)}
                                title="Delete row"
                                className="p-1 rounded hover:bg-red-50 text-red-600 transition apple-press"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredOther.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-ink-muted italic">
                          No unbilled scholars in Form 3. All continuing grantees are actively billed in Form 2.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Content Area 3: Smart Signatories & Notary Editor */}
            {workspaceTab === "signatories" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-heading text-base font-bold text-ink">
                    Official University Signatories & Legal Certifications
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Configure the designated authorized officers and notarization information for Annex 3.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* President */}
                  <div className="p-4 rounded-xl border border-line bg-page space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-minsu-green-700">
                      HEI President / Authorized Representative
                    </span>
                    <input
                      value={formData.signatories?.president?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            president: {
                              name: e.target.value,
                              position: "President/Authorized Representative",
                            },
                          },
                        })
                      }
                      className="w-full text-xs font-bold text-ink bg-white px-3 py-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                    />
                    <div className="text-[11px] text-ink-muted">Signs Form 1, Form 2, Form 3, and Form 4 (Notarized)</div>
                  </div>

                  {/* Registrar */}
                  <div className="p-4 rounded-xl border border-line bg-page space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-minsu-green-700">
                      HEI Registrar
                    </span>
                    <input
                      value={formData.signatories?.registrar?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            registrar: {
                              name: e.target.value,
                              position: "HEI Registrar",
                            },
                          },
                        })
                      }
                      className="w-full text-xs font-bold text-ink bg-white px-3 py-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                    />
                    <div className="text-[11px] text-ink-muted">Certifies correctness of student enrollment data</div>
                  </div>

                  {/* Accounting Head */}
                  <div className="p-4 rounded-xl border border-line bg-page space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-minsu-green-700">
                      Head, Accounting / Chief Accountant
                    </span>
                    <input
                      value={formData.signatories?.accountingHead?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            accountingHead: {
                              name: e.target.value,
                              position: "Head, Accounting/Authorized Representative",
                            },
                          },
                        })
                      }
                      className="w-full text-xs font-bold text-ink bg-white px-3 py-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                    />
                    <div className="text-[11px] text-ink-muted">Certifies accuracy of billing figures and stipend claims</div>
                  </div>

                  {/* TES Focal Person */}
                  <div className="p-4 rounded-xl border border-line bg-page space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-minsu-green-700">
                      HEI TES Focal Person / Scholarship Coordinator
                    </span>
                    <input
                      value={formData.signatories?.tesFocalPerson?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            tesFocalPerson: {
                              name: e.target.value,
                              position: "HEI TES Focal Person/Scholarship Coordinator",
                            },
                          },
                        })
                      }
                      className="w-full text-xs font-bold text-ink bg-white px-3 py-2 rounded-lg border border-line focus:ring-2 focus:ring-minsu-green-700 outline-none"
                    />
                    <div className="text-[11px] text-ink-muted">Prepares Form 2 and Form 3 rosters</div>
                  </div>
                </div>

                {/* Notary Public Details for Form 4 */}
                <div className="p-5 rounded-2xl border border-minsu-gold-400/40 bg-minsu-gold-100/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-minsu-gold-600" />
                    <h4 className="font-heading text-sm font-bold text-ink">
                      Form 4 Notary Public Legal Acknowledgment
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">Doc. No.</label>
                      <input
                        value={formData.notary?.docNo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notary: { ...formData.notary, docNo: e.target.value },
                          })
                        }
                        placeholder="412"
                        className="w-full text-xs font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg border border-line outline-none focus:ring-2 focus:ring-minsu-green-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">Page No.</label>
                      <input
                        value={formData.notary?.pageNo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notary: { ...formData.notary, pageNo: e.target.value },
                          })
                        }
                        placeholder="84"
                        className="w-full text-xs font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg border border-line outline-none focus:ring-2 focus:ring-minsu-green-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">Book No.</label>
                      <input
                        value={formData.notary?.bookNo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notary: { ...formData.notary, bookNo: e.target.value },
                          })
                        }
                        placeholder="XII"
                        className="w-full text-xs font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg border border-line outline-none focus:ring-2 focus:ring-minsu-green-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">Series of</label>
                      <input
                        value={formData.notary?.series || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notary: { ...formData.notary, series: e.target.value },
                          })
                        }
                        placeholder="2025"
                        className="w-full text-xs font-mono font-bold bg-white px-2.5 py-1.5 rounded-lg border border-line outline-none focus:ring-2 focus:ring-minsu-green-700"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[11px] font-semibold text-ink-muted">Place of Notarization</label>
                      <input
                        value={formData.notary?.issuedAt || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notary: { ...formData.notary, issuedAt: e.target.value },
                          })
                        }
                        placeholder="Victoria, Oriental Mindoro"
                        className="w-full text-xs font-semibold bg-white px-2.5 py-1.5 rounded-lg border border-line outline-none focus:ring-2 focus:ring-minsu-green-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: REFINED OFFICIAL DOCUMENT CANVAS (Print-Ready Government Suite) */}
      {/* ========================================================================= */}
      <div className={viewMode === "sheet" ? "block" : "hidden print:block"}>
        <div className="annex-printable-document bg-white text-ink font-sans p-6 sm:p-10 border border-neutral-800 shadow-xl rounded-sm max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
          {/* ======================================================================= */}
          {/* TAB 1: FORM 1 – CONSOLIDATED TDP BILLING STATEMENT                      */}
          {/* ======================================================================= */}
          {(activeTab === "tab1" || printScope === "all") && (
            <div className="space-y-4 text-[12px] leading-tight print:block">
              {/* Top Right Form Tag */}
              <div className="text-right font-bold text-[13px] text-neutral-800">
                Annex 3 - TDP Continuing Form 1
              </div>

              {/* Header: CHED Logo | HEI Info | UniFAST Logo */}
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

              {/* Title Block */}
              <div className="text-center pt-2 space-y-1">
                <h1 className="font-heading text-[17px] font-bold uppercase tracking-tight text-ink">
                  CONSOLIDATED TDP BILLING STATEMENT
                </h1>
                <div>
                  <span className="bg-minsu-gold-100 text-minsu-gold-600 px-3 py-0.5 font-bold text-[12px] border border-minsu-gold-400/40 rounded-xs inline-block">
                    TDP Batch {formData.batchNumber} - {termLabel}, AY {formData.academicYear}
                  </span>
                </div>
              </div>

              {/* Reference No & Date */}
              <div className="flex justify-end pt-2">
                <table className="border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="text-right pr-2 font-bold text-ink">TDP-TES Billing Statement Reference No.:</td>
                      <td>
                        <input
                          value={formData.referenceNumber}
                          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                          className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold px-2 py-0.5 border border-neutral-800 w-56 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-right pr-2 font-bold text-ink">Date:</td>
                      <td>
                        <input
                          value={formData.billingDate}
                          onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                          className="bg-minsu-gold-100 text-minsu-gold-600 font-bold px-2 py-0.5 border border-neutral-800 w-56 focus:outline-none mt-1"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* To & Address Table */}
              <div className="border border-neutral-800">
                <div className="flex border-b border-neutral-800">
                  <div className="w-24 font-bold p-1.5 border-r border-neutral-800 bg-minsu-green-50 text-minsu-green-900">
                    To
                  </div>
                  <div className="p-1.5 font-bold flex-1 text-ink">CHED - Regional Office MIMAROPA</div>
                </div>
                <div className="flex">
                  <div className="w-24 font-bold p-1.5 border-r border-neutral-800 bg-minsu-green-50 text-minsu-green-900">
                    Address
                  </div>
                  <div className="p-1 flex-1">
                    <input
                      defaultValue="2F HEDC Bldg., C.P. Garcia Ave., UP Diliman, Quezon City"
                      className="bg-minsu-gold-100 text-minsu-gold-600 w-full px-1.5 py-0.5 border border-minsu-gold-400/40 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Main Billing Particulars Table */}
              <div className="border border-neutral-800">
                <div className="grid grid-cols-12 bg-minsu-green-50 text-minsu-green-900 border-b border-neutral-800 font-bold text-center">
                  <div className="col-span-8 p-1.5 border-r border-neutral-800">Responsibility Center</div>
                  <div className="col-span-2 p-1.5 border-r border-neutral-800">Account Code</div>
                  <div className="col-span-2 p-1.5">Amount</div>
                </div>

                <div className="grid grid-cols-12">
                  {/* Column 1: Responsibility Details */}
                  <div className="col-span-8 p-3 border-r border-neutral-800 space-y-2">
                    <div className="font-bold text-ink">CHED - Regional Office MIMAROPA</div>
                    <p className="text-[11px] leading-normal text-justify text-ink">
                      Request for payment of the Tulong Dunong Program - Tertiary Education Subsidy (TDP-TES) grant for the {termLabel}, Academic Year {formData.academicYear} to be charged against the funds for Universal Access to Quality Tertiary Education (UAQTE) under General Appropriation Act (GAA) for Fiscal Year _______, as per attached supporting documents:
                    </p>
                    <div className="text-[11px] pl-4 space-y-0.5 text-ink-muted">
                      <div>a) Certificate of Registration (COR) (PDF File only)</div>
                      <div>b) Notarized Registrar&apos;s Certification</div>
                    </div>

                    <div className="pt-4 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-ink">Total number of TDP-TES student-grantees in the Higher Education Institution (HEI):</span>
                        <span className="bg-minsu-gold-100 text-minsu-gold-600 font-bold px-3 py-0.5 border border-neutral-800 min-w-[70px] text-right">
                          {formData.totalGrantees}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-ink">Total TDP-TES subsidy</span>
                        <span className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold px-3 py-0.5 border border-neutral-800 min-w-[100px] text-right">
                          {formData.totalSubsidy.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-ink">Add .5% (.005) Management Fee for Partner Institutions</span>
                        <span className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold px-3 py-0.5 border border-neutral-800 min-w-[100px] text-right">
                          {formData.managementFeeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center font-bold">
                        <span className="text-minsu-green-900">TOTAL: TDP-TES Billing Amount</span>
                        <span className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-black px-3 py-0.5 border border-neutral-800 min-w-[100px] text-right text-[12px]">
                          {formData.grandTotalBilling.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 text-[10px] text-ink-muted">
                      Basis for the Tertiary Education Subsidy: Section 23, Rule IV, IRR of R.A. No. 10931
                    </div>
                  </div>

                  {/* Column 2: Account Code */}
                  <div className="col-span-2 border-r border-neutral-800 p-2 text-center text-ink-muted">
                    -
                  </div>

                  {/* Column 3: Amount Column */}
                  <div className="col-span-2 p-2 flex flex-col justify-between">
                    <div className="text-right">
                      <span className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold text-[13px] px-2 py-0.5 border border-neutral-800 inline-block">
                        {formData.grandTotalBilling.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* CHEDRO Approval Box */}
                    <div className="border border-neutral-800 mt-8 text-[10px]">
                      <div className="bg-minsu-green-50 text-minsu-green-900 font-bold p-1 text-center border-b border-neutral-800">
                        Action to be taken<br />(To be approved by CHEDRO)
                      </div>
                      <div className="p-1 border-b border-neutral-800">
                        <div className="text-ink-muted">PhP</div>
                        <div className="text-[9px]">Excess (deficient) billing noted for further action</div>
                      </div>
                      <div className="p-1">
                        <div className="text-ink-muted">PhP</div>
                        <div className="text-[9px]">Approved for payment</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certification & Approval Block */}
              <div className="grid grid-cols-2 border border-neutral-800">
                {/* Certified Block (Accounting) */}
                <div className="p-3 border-r border-neutral-800 space-y-3">
                  <div className="font-bold text-ink">Certified</div>
                  <div className="flex items-start gap-2 text-[11px]">
                    <input type="checkbox" defaultChecked className="mt-0.5 accent-minsu-green-700" />
                    <span>Supporting documents complete and amount claimed proper.</span>
                  </div>

                  <div className="text-[11px] space-y-1">
                    <div>Is this the last batch of billing for this term of AY {formData.academicYear}?</div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <span className={`w-4 h-4 border border-neutral-800 inline-flex items-center justify-center font-bold text-xs ${formData.isLastBatch ? "bg-minsu-gold-100 text-minsu-gold-600" : ""}`}>
                          {formData.isLastBatch ? "✓" : ""}
                        </span>
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer" onClick={() => setFormData({ ...formData, isLastBatch: !formData.isLastBatch })}>
                        <span className={`w-4 h-4 border border-neutral-800 inline-flex items-center justify-center font-bold text-xs ${!formData.isLastBatch ? "bg-minsu-gold-100 text-minsu-gold-600" : ""}`}>
                          {!formData.isLastBatch ? "✓" : ""}
                        </span>
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <table className="w-full text-[10px] pt-2">
                    <tbody>
                      <tr>
                        <td className="w-20 font-bold py-1">Signature</td>
                        <td><div className="bg-minsu-gold-100/40 h-6 border border-neutral-800/40"></div></td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Printed Name</td>
                        <td>
                          <input
                            value={formData.signatories?.accountingHead?.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signatories: {
                                  ...formData.signatories,
                                  accountingHead: { name: e.target.value, position: "Head, Accounting/Authorized Representative" },
                                },
                              })
                            }
                            className="bg-minsu-gold-100 text-minsu-gold-600 font-bold w-full px-2 py-0.5 border border-neutral-800/40 focus:outline-none"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Position</td>
                        <td><div className="text-center font-medium">Head, Accounting/Authorized Representative</div></td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Date</td>
                        <td><div className="bg-minsu-gold-100/40 h-6 border border-neutral-800/40"></div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Approved Block (President) */}
                <div className="p-3 space-y-3">
                  <div className="font-bold text-ink">Approved</div>
                  <div className="flex items-start gap-2 text-[11px]">
                    <input type="checkbox" defaultChecked className="mt-0.5 accent-minsu-green-700" />
                    <span>Payment for Tertiary Education Subsidy (TDP-TES) approved.</span>
                  </div>

                  <table className="w-full text-[10px] pt-8">
                    <tbody>
                      <tr>
                        <td className="w-20 font-bold py-1">Signature</td>
                        <td><div className="bg-minsu-gold-100/40 h-6 border border-neutral-800/40"></div></td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Printed Name</td>
                        <td>
                          <input
                            value={formData.signatories?.president?.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signatories: {
                                  ...formData.signatories,
                                  president: { name: e.target.value, position: "President/Authorized Representative" },
                                },
                              })
                            }
                            className="bg-minsu-gold-100 text-minsu-gold-600 font-bold w-full px-2 py-0.5 border border-neutral-800/40 focus:outline-none"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Position</td>
                        <td><div className="text-center font-medium">President/Authorized Representative</div></td>
                      </tr>
                      <tr>
                        <td className="w-20 font-bold py-1">Date</td>
                        <td><div className="bg-minsu-gold-100/40 h-6 border border-neutral-800/40"></div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Instructions (2 Columns) */}
              <div className="border border-neutral-800 p-3 text-[10px] leading-tight grid grid-cols-2 gap-4">
                <div className="space-y-1.5 border-r border-neutral-800 pr-3">
                  <div className="font-bold uppercase text-minsu-green-900">INSTRUCTIONS:</div>
                  <p>
                    1. The HEIs are allowed a maximum of two (2) tranches of payments per semester, with the option to specify multiple batches within that single tranche.
                  </p>
                  <p>
                    2. The TES statement reference number shall comprise of the REGIONAL CODE (2-digit), HEI CODE (alpha codes), ACADEMIC YEAR (4-digit), TRANCHE NUMBER (1-digit) and BATCH NUMBER (digit).
                  </p>
                  <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[9px] text-ink-muted">
                    <div>Region 1: 01</div>
                    <div>Region 6: 06</div>
                    <div>Region 12: 12</div>
                    <div>Region 4B: MIMAROPA</div>
                    <div>Region 7: 07</div>
                    <div>NCR: NCR</div>
                  </div>
                </div>

                <div className="space-y-1.5 pl-2">
                  <div>
                    <span className="font-bold">&quot;Term&quot; refers to semester:</span> 1st sem = 1, 2nd sem = 2.
                  </div>
                  <div>
                    <span className="font-bold">&quot;Tranche Number&quot;:</span> HEIs can only bill CHED up to 2 batches per sem.
                  </div>
                  <div className="pt-2 font-bold text-minsu-green-900">
                    Submit printed copy of complete TES Statement Form (Form 1) with cover letter to:
                  </div>
                  <div className="font-bold">EDNA IMELDA F. LEGAZPI</div>
                  <div className="text-ink-muted">Director IV, CHEDRO MIMAROPA</div>
                </div>
              </div>
            </div>
          )}

          {printScope === "all" && (
            <div className="print-page-break my-8 border-b-2 border-dashed border-[#1B5E20]/40 print:border-none py-2 text-center text-xs font-bold text-[#1B5E20] print:hidden">
              --- Official Page Break: End of Form 1 ---
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: FORM 2 – CONSOLIDATED CONTINUING TDP GRANTEES DETAILS            */}
          {/* ======================================================================= */}
          {(activeTab === "tab2" || printScope === "all") && (
            <div className="space-y-4 text-[11px] leading-tight print:block">
              {/* Top Tag */}
              <div className="text-right font-bold text-[13px] text-neutral-800">
                Annex 3 - TDP Continuing Form 2
              </div>

              {/* Header: Logos and Title */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="w-16 flex justify-center">
                  <AnnexLogo
                    position="left"
                    config={formData.headerLogos?.leftLogo}
                    defaultPreset="ched"
                    editable={true}
                    documentId={documentId}
                    className="w-14 h-14"
                    onLogoChange={handleLeftLogoChange}
                  />
                </div>

                <div className="text-center flex-1 px-4 space-y-0.5">
                  <div className="text-[11px] text-ink-muted">Republic of the Philippines</div>
                  <div className="font-bold italic text-minsu-gold-600 bg-minsu-gold-100 inline-block px-2 rounded-xs">
                    {formData.heiName}
                  </div>
                  <div>
                    <span className="italic text-minsu-gold-600 bg-minsu-gold-100 inline-block px-2 text-[10px] rounded-xs">
                      {formData.heiAddress}
                    </span>
                  </div>
                  <h1 className="font-heading text-[14px] font-bold uppercase tracking-tight pt-1 text-ink">
                    CONSOLIDATED CONTINUING TDP GRANTEES DETAILS
                  </h1>
                  <div className="font-bold text-[11px] text-minsu-green-900">
                    TDP Batch {formData.batchNumber} - {termLabel}, AY {formData.academicYear}
                  </div>
                </div>

                <div className="w-16 flex justify-center">
                  <AnnexLogo
                    position="right"
                    config={formData.headerLogos?.rightLogo}
                    defaultPreset="unifast"
                    editable={true}
                    documentId={documentId}
                    className="w-14 h-14"
                    onLogoChange={handleRightLogoChange}
                  />
                </div>
              </div>

              {/* Reference No & Date */}
              <div className="flex justify-end text-[11px] gap-4">
                <div>
                  <span className="font-bold text-ink">TDP-TES Billing Reference No.: </span>
                  <span className="bg-minsu-gold-100 text-minsu-gold-600 font-mono font-bold px-2 py-0.5 border border-neutral-800">
                    {formData.referenceNumber}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-ink">Date: </span>
                  <span className="bg-minsu-gold-100 text-minsu-gold-600 font-bold px-2 py-0.5 border border-neutral-800">
                    {formData.billingDate}
                  </span>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="border border-neutral-800 p-2.5 text-[10px] grid grid-cols-2 gap-4">
                <div className="space-y-1 pr-2 border-r border-neutral-800">
                  <div className="font-bold uppercase text-minsu-green-900">INSTRUCTIONS</div>
                  <p>1. Include only in this form continuing grantees WHO ARE CURRENTLY ENROLLED this semester.</p>
                  <p>2. List names of enrolled continuing TDP grantees per campus in alphabetical order.</p>
                  <p>3. Submit PDF files of the Enrollment List or Certificate of Registration (COR).</p>
                </div>
                <div className="space-y-1 pl-2">
                  <p>4. Submit the Notarized Certification of TDP Grantees as an endorsement document.</p>
                  <p>5. Supporting documents to submit to CHEDRO:</p>
                  <div className="pl-4 font-mono text-[9px] text-ink-muted">
                    <div>• TDP Continuing Form 1, Form 2, and Form 3</div>
                    <div>• Notarized Registrar&apos;s Certification (Form 4)</div>
                  </div>
                </div>
              </div>

              {/* Campus Note */}
              <div className="border border-neutral-800 p-2 space-y-0.5 text-[10px] bg-minsu-gold-100/30">
                <div className="text-minsu-gold-600 font-bold">TDP Continuing Grantees Tabulation:</div>
                <div className="text-ink-muted italic">
                  TDP grantees must be listed and tabulated PER CAMPUS. The grand total across all campuses corresponds directly to the Billing Statement claim.
                </div>
              </div>

              {/* Form 2 Table: Multi-Tier Header */}
              <div className="overflow-x-auto border border-neutral-800">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-minsu-green-50 text-minsu-green-900 border-b border-neutral-800 text-center font-bold">
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-14">5-digit Control #</th>
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-20">Student Number</th>
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-24">TDP Award Number</th>
                      <th colSpan={3} className="border-r border-neutral-800 p-1">Student&apos;s Name</th>
                      <th colSpan={4} className="border-r border-neutral-800 p-1">Student Profile</th>
                      <th colSpan={2} className="border-r border-neutral-800 p-1">Contact Information</th>
                      <th colSpan={3} className="p-1">TDP-TES Grant</th>
                      <th rowSpan={2} className="border-l border-neutral-800 p-1 w-14 print:hidden">Action</th>
                    </tr>
                    <tr className="bg-white border-b border-neutral-800 text-center font-bold text-[9px]">
                      <th className="border-r border-neutral-800 p-1">Last Name</th>
                      <th className="border-r border-neutral-800 p-1">Given Name</th>
                      <th className="border-r border-neutral-800 p-1 w-8">MI</th>
                      <th className="border-r border-neutral-800 p-1 w-8">Sex</th>
                      <th className="border-r border-neutral-800 p-1 w-16">Birthdate</th>
                      <th className="border-r border-neutral-800 p-1">Degree Program</th>
                      <th className="border-r border-neutral-800 p-1 w-8">Yr</th>
                      <th className="border-r border-neutral-800 p-1">E-mail address</th>
                      <th className="border-r border-neutral-800 p-1">Phone Number</th>
                      <th className="border-r border-neutral-800 p-1 w-12">Batch</th>
                      <th className="border-r border-neutral-800 p-1 w-16">Stipend</th>
                      <th className="p-1 w-16">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {formData.billedGrantees.map((g, idx) => (
                      <tr key={idx} className="hover:bg-minsu-green-50/50">
                        <td className="p-1 text-center font-mono font-bold border-r border-neutral-800 bg-minsu-gold-100/30 text-minsu-gold-600">
                          {g.controlNumber}
                        </td>
                        <td className="p-1 font-mono border-r border-neutral-800">
                          <input
                            value={g.studentNumber}
                            onChange={(e) => updateGranteeField(idx, "studentNumber", e.target.value)}
                            className="w-full bg-transparent focus:bg-minsu-gold-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 font-mono border-r border-neutral-800">
                          <input
                            value={g.tdpAwardNumber}
                            onChange={(e) => updateGranteeField(idx, "tdpAwardNumber", e.target.value)}
                            className="w-full bg-transparent focus:bg-minsu-gold-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 font-bold border-r border-neutral-800">
                          <input
                            value={g.lastName}
                            onChange={(e) => updateGranteeField(idx, "lastName", e.target.value.toUpperCase())}
                            className="w-full bg-transparent focus:bg-minsu-gold-100 focus:outline-none uppercase"
                          />
                        </td>
                        <td className="p-1 border-r border-neutral-800">
                          <input
                            value={g.givenName}
                            onChange={(e) => updateGranteeField(idx, "givenName", e.target.value.toUpperCase())}
                            className="w-full bg-transparent focus:bg-minsu-gold-100 focus:outline-none uppercase"
                          />
                        </td>
                        <td className="p-1 text-center border-r border-neutral-800">
                          <input
                            value={g.middleInitial}
                            onChange={(e) => updateGranteeField(idx, "middleInitial", e.target.value.toUpperCase())}
                            className="w-full text-center bg-transparent focus:bg-minsu-gold-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 text-center border-r border-neutral-800 font-bold">{g.sex}</td>
                        <td className="p-1 text-center border-r border-neutral-800 text-[9px]">{g.birthdate}</td>
                        <td className="p-1 border-r border-neutral-800 truncate max-w-[120px]">{g.degreeProgram}</td>
                        <td className="p-1 text-center border-r border-neutral-800">{g.yearLevel}</td>
                        <td className="p-1 border-r border-neutral-800 text-[9px] truncate max-w-[100px]">{g.email}</td>
                        <td className="p-1 border-r border-neutral-800 text-[9px] font-mono">{g.phone}</td>
                        <td className="p-1 text-center border-r border-neutral-800 font-mono">{g.tdpBatch}</td>
                        <td className="p-1 text-right border-r border-neutral-800 font-mono">
                          ₱{g.semesterAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-1 text-right font-mono font-bold bg-minsu-gold-100/30 text-minsu-gold-600">
                          ₱{g.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-1 text-center border-l border-neutral-800 print:hidden">
                          <button
                            onClick={() => moveGranteeToOther(idx)}
                            className="text-[9px] text-minsu-green-700 hover:underline font-bold"
                            title="Move to Form 3 (Unbilled)"
                          >
                            Unbill
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-minsu-green-50/80 font-bold border-t border-neutral-800">
                      <td colSpan={13} className="p-1.5 text-right font-bold text-minsu-green-900 border-r border-neutral-800">
                        TOTAL AMOUNT CLAIMED:
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold border-r border-neutral-800 text-minsu-green-900">
                        ₱{formData.totalSubsidy.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-1.5 text-right font-mono font-black text-minsu-green-900">
                        ₱{formData.totalSubsidy.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3 Signature Blocks */}
              <div className="grid grid-cols-3 border border-neutral-800 text-[10px] text-center pt-2 pb-4">
                <div className="p-2 space-y-4">
                  <div className="font-semibold text-ink-muted">Prepared by:</div>
                  <div className="h-6"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.tesFocalPerson?.name || "HEI TES Focal Person"}</div>
                    <div className="text-[9px] text-ink-muted">HEI TES Focal Person/Scholarship Coordinator</div>
                    <div className="text-[8px] text-ink-muted">(Print Name and Signature)</div>
                  </div>
                </div>

                <div className="p-2 space-y-4 border-l border-neutral-800">
                  <div className="font-semibold text-ink-muted">As to correctness of enrollment data<br />Certified by:</div>
                  <div className="h-2"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.registrar?.name || "HEI Registrar"}</div>
                    <div className="text-[9px] text-ink-muted">HEI Registrar</div>
                    <div className="text-[8px] text-ink-muted">(Print Name and Signature)</div>
                  </div>
                </div>

                <div className="p-2 space-y-4 border-l border-neutral-800">
                  <div className="font-semibold text-ink-muted">Approved by:</div>
                  <div className="h-6"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.president?.name || "HEI President"}</div>
                    <div className="text-[9px] text-ink-muted">HEI President</div>
                    <div className="text-[8px] text-ink-muted">(Print Name and Signature)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {printScope === "all" && (
            <div className="print-page-break my-8 border-b-2 border-dashed border-[#1B5E20]/40 print:border-none py-2 text-center text-xs font-bold text-[#1B5E20] print:hidden">
              --- Official Page Break: End of Form 2 ---
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: FORM 3 – OTHER CONTINUING GRANTEES (NOT BILLED THIS TERM)        */}
          {/* ======================================================================= */}
          {(activeTab === "tab3" || printScope === "all") && (
            <div className="space-y-4 text-[11px] leading-tight print:block">
              {/* Top Tag */}
              <div className="text-right font-bold text-[13px] text-neutral-800">
                TDP Continuing Form 3 - Annex 3
              </div>

              {/* Header: Logos and Title */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="w-16 flex justify-center">
                  <AnnexLogo
                    position="left"
                    config={formData.headerLogos?.leftLogo}
                    defaultPreset="ched"
                    editable={true}
                    documentId={documentId}
                    className="w-14 h-14"
                    onLogoChange={handleLeftLogoChange}
                  />
                </div>

                <div className="text-center flex-1 px-4 space-y-0.5">
                  <div className="text-[11px] text-ink-muted">Republic of the Philippines</div>
                  <div className="font-bold italic text-minsu-gold-600 bg-minsu-gold-100 inline-block px-2 rounded-xs">
                    {formData.heiName}
                  </div>
                  <div>
                    <span className="italic text-minsu-gold-600 bg-minsu-gold-100 inline-block px-2 text-[10px] rounded-xs">
                      {formData.heiAddress}
                    </span>
                  </div>
                  <h1 className="font-heading text-[14px] font-bold uppercase tracking-tight pt-1 text-ink">
                    CONSOLIDATED CONTINUING TDP GRANTEES DETAILS (OTHER)
                  </h1>
                  <div className="font-bold text-[11px] text-minsu-green-900">
                    TDP Batch {formData.batchNumber} - {termLabel}, AY {formData.academicYear}
                  </div>
                </div>

                <div className="w-16 flex justify-center">
                  <AnnexLogo
                    position="right"
                    config={formData.headerLogos?.rightLogo}
                    defaultPreset="unifast"
                    editable={true}
                    documentId={documentId}
                    className="w-14 h-14"
                    onLogoChange={handleRightLogoChange}
                  />
                </div>
              </div>

              {/* Instructions Box */}
              <div className="border border-neutral-800 p-2.5 text-[10px] grid grid-cols-2 gap-4">
                <div className="space-y-1 pr-2 border-r border-neutral-800">
                  <div className="font-bold uppercase text-minsu-green-900">INSTRUCTIONS</div>
                  <p>1. Only include continuing grantees who are NOT INCLUDED in TDP Continuing Form 2.</p>
                  <p>2. Indicate current status: not enrolled, dropped, waived, on LOA, transferee, or graduated.</p>
                </div>
                <div className="space-y-1 pl-2">
                  <p>3. Submit electronic and hard copies to CHEDRO as supporting attachments.</p>
                  <p>4. Assign 5-digit Control Numbers in chronological order.</p>
                </div>
              </div>

              {/* Form 3 Table: 12 Columns */}
              <div className="overflow-x-auto border border-neutral-800">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-minsu-gold-100/70 text-minsu-gold-600 border-b border-neutral-800 text-center font-bold">
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-14">5-digit Control #</th>
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-20">Student Number</th>
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-24">TDP Award Number</th>
                      <th colSpan={3} className="border-r border-neutral-800 p-1">Student&apos;s Name</th>
                      <th colSpan={4} className="border-r border-neutral-800 p-1">Student Profile</th>
                      <th rowSpan={2} className="border-r border-neutral-800 p-1 w-28">Status</th>
                      <th rowSpan={2} className="p-1">Remarks</th>
                      <th rowSpan={2} className="border-l border-neutral-800 p-1 w-16 print:hidden">Action</th>
                    </tr>
                    <tr className="bg-white border-b border-neutral-800 text-center font-bold text-[9px]">
                      <th className="border-r border-neutral-800 p-1">Last Name</th>
                      <th className="border-r border-neutral-800 p-1">Given Name</th>
                      <th className="border-r border-neutral-800 p-1 w-8">MI</th>
                      <th className="border-r border-neutral-800 p-1 w-8">Sex</th>
                      <th className="border-r border-neutral-800 p-1 w-16">Birthdate</th>
                      <th className="border-r border-neutral-800 p-1">Degree Program</th>
                      <th className="border-r border-neutral-800 p-1 w-8">Yr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {formData.otherGrantees.map((g, idx) => (
                      <tr key={idx} className="hover:bg-minsu-gold-50/50">
                        <td className="p-1 text-center font-mono font-bold border-r border-neutral-800 bg-minsu-gold-100/30 text-minsu-gold-600">
                          {g.controlNumber}
                        </td>
                        <td className="p-1 font-mono border-r border-neutral-800">{g.studentNumber}</td>
                        <td className="p-1 font-mono border-r border-neutral-800">{g.tdpAwardNumber}</td>
                        <td className="p-1 font-bold border-r border-neutral-800">{g.lastName}</td>
                        <td className="p-1 border-r border-neutral-800">{g.givenName}</td>
                        <td className="p-1 text-center border-r border-neutral-800">{g.middleInitial}</td>
                        <td className="p-1 text-center border-r border-neutral-800">{g.sex}</td>
                        <td className="p-1 text-center border-r border-neutral-800 text-[9px]">{g.birthdate}</td>
                        <td className="p-1 border-r border-neutral-800 truncate">{g.degreeProgram}</td>
                        <td className="p-1 text-center border-r border-neutral-800">{g.yearLevel}</td>
                        <td className="p-1 border-r border-neutral-800 font-bold uppercase text-[9px] text-minsu-gold-600 bg-minsu-gold-100/20">
                          {g.status}
                        </td>
                        <td className="p-1 text-ink-muted">{g.remarks}</td>
                        <td className="p-1 text-center border-l border-neutral-800 print:hidden">
                          <button
                            onClick={() => moveOtherToBilled(idx)}
                            className="text-[9px] text-minsu-green-700 hover:underline font-bold"
                          >
                            Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.otherGrantees.length === 0 && (
                      <tr>
                        <td colSpan={13} className="p-6 text-center text-ink-muted italic">
                          No continuing scholars listed in Form 3. All continuing grantees are currently enrolled and billed in Form 2.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3 Signature Blocks */}
              <div className="grid grid-cols-3 border border-neutral-800 text-[10px] text-center pt-2 pb-4">
                <div className="p-2 space-y-4">
                  <div className="font-semibold text-ink-muted">Prepared by:</div>
                  <div className="h-6"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.tesFocalPerson?.name || "HEI TES Focal Person"}</div>
                    <div className="text-[9px] text-ink-muted">HEI TES Focal Person/Scholarship Coordinator</div>
                  </div>
                </div>

                <div className="p-2 space-y-4 border-l border-neutral-800">
                  <div className="font-semibold text-ink-muted">Certified by:</div>
                  <div className="h-6"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.registrar?.name || "HEI Registrar"}</div>
                    <div className="text-[9px] text-ink-muted">HEI Registrar</div>
                  </div>
                </div>

                <div className="p-2 space-y-4 border-l border-neutral-800">
                  <div className="font-semibold text-ink-muted">Approved by:</div>
                  <div className="h-6"></div>
                  <div className="border-t border-neutral-800 pt-1">
                    <div className="font-bold text-ink">{formData.signatories?.president?.name || "HEI President"}</div>
                    <div className="text-[9px] text-ink-muted">HEI President</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {printScope === "all" && (
            <div className="print-page-break my-8 border-b-2 border-dashed border-[#1B5E20]/40 print:border-none py-2 text-center text-xs font-bold text-[#1B5E20] print:hidden">
              --- Official Page Break: End of Form 3 ---
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 4: FORM 4 – CERTIFICATION (NOTARIZED)                               */}
          {/* ======================================================================= */}
          {(activeTab === "tab4" || printScope === "all") && (
            <div className="space-y-6 text-[12px] leading-relaxed p-4 sm:p-8 max-w-3xl mx-auto print:block">
              {/* Top Tag */}
              <div className="text-right font-bold text-[13px] text-neutral-800">
                TDP Continuing Form 4 - Annex 3
              </div>

              {/* MinSU Official Header */}
              <div className="text-center space-y-1">
                <div className="text-minsu-green-900 font-bold tracking-wider text-[11px] uppercase">
                  Mindoro State University (MinSU)
                </div>
                <div className="text-[11px] text-ink-muted">Republic of the Philippines</div>
                <div className="text-minsu-green-800 font-bold text-[14px]">
                  {formData.heiName}
                </div>
                <div className="text-ink-muted text-[11px]">
                  {formData.heiAddress}
                </div>
              </div>

              {/* Date line */}
              <div className="text-right pt-2">
                <span className="font-medium text-ink-muted">Date: </span>
                <span className="underline decoration-minsu-green-700 font-bold text-ink">{formData.billingDate}</span>
              </div>

              {/* Title */}
              <div className="text-center pt-2">
                <h1 className="font-heading text-[16px] font-bold uppercase tracking-wider text-ink">
                  CERTIFICATION
                </h1>
              </div>

              {/* Body */}
              <div className="space-y-4 text-justify text-ink">
                <div className="font-bold uppercase tracking-wide text-minsu-green-900">
                  TO WHOM IT MAY CONCERN:
                </div>

                <p>
                  This is to certify that the total number of TDP grantees by campus as shown below, are qualified to avail of the Tulong Dunong Program (TDP) under R.A. No. 10931 also known as Universal Access to Quality Tertiary Education (UAQTE) for the {termLabel} of Academic Year {formData.academicYear}.
                </p>

                {/* Tally Table */}
                <div className="border border-neutral-800 my-4">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-minsu-green-50 text-minsu-green-900 border-b border-neutral-800 font-bold">
                        <th className="border-r border-neutral-800 p-2 text-left">Name of Campus</th>
                        <th className="border-r border-neutral-800 p-2 text-center w-36">Batch Number</th>
                        <th className="p-2 text-right w-44">Number of TDP Grantees</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {Object.entries(campusTally).map(([campusName, count], idx) => (
                        <tr key={idx}>
                          <td className="border-r border-neutral-800 p-2 font-medium">{campusName}</td>
                          <td className="border-r border-neutral-800 p-2 text-center font-bold">
                            Batch {formData.batchNumber}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-minsu-green-900">{count}</td>
                        </tr>
                      ))}
                      <tr className="bg-minsu-green-50 font-bold">
                        <td className="border-r border-neutral-800 p-2 text-minsu-green-900">Total</td>
                        <td className="border-r border-neutral-800 p-2 text-center">-</td>
                        <td className="p-2 text-right font-mono text-[12px] text-minsu-green-900 font-black">{formData.totalGrantees}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  This further certifies that the students&apos; information indicated in the billing statement of the Annex 3 - Tulong Dunong Program Continuing Form 2 is accurate and complete.
                </p>

                <p>
                  This certification is being issued in accordance with the UniFAST Joint Memorandum Circular (JMC) No. 02 Series of 2022, on the Enhanced Guidelines of the Tulong Dunong Program (TDP).
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 space-y-8">
                <div className="space-y-1 text-right">
                  <div className="text-ink-muted text-[11px] pr-20">Certified by:</div>
                  <div className="h-10"></div>
                  <div className="font-bold text-[12px] text-ink">
                    {formData.signatories?.registrar?.name || "Dr. Nemo R. San Pedro"}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Signature over Printed Name of the School Registrar
                  </div>
                </div>

                <div className="space-y-1 text-right pt-4">
                  <div className="text-ink-muted text-[11px] pr-20">Approved by:</div>
                  <div className="h-10"></div>
                  <div className="text-[11px] text-minsu-gold-600 font-semibold italic">
                    (must be notarized)
                  </div>
                  <div className="font-bold text-[12px] text-ink">
                    {formData.signatories?.president?.name || "Dr. Enya Marie D. Apostol"}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Signature over Printed Name of the President of the HEIs
                  </div>
                </div>
              </div>

              {/* Notarized Jurat Block */}
              <div className="mt-12 pt-6 border-t border-neutral-800 text-[11px] space-y-3">
                <div className="font-bold uppercase tracking-wider text-minsu-green-900">
                  NOTARIAL ACKNOWLEDGMENT / JURAT
                </div>
                <p className="text-justify leading-relaxed">
                  SUBSCRIBED AND SWORN to before me this _____ day of ________________, 2025 at {formData.notary?.issuedAt || "Victoria, Oriental Mindoro"}, affiant exhibiting to me their respective competent evidence of identity.
                </p>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[10px] space-y-0.5">
                      <div>Doc. No.: <span className="font-bold underline">{formData.notary?.docNo || "412"}</span></div>
                      <div>Page No.: <span className="font-bold underline">{formData.notary?.pageNo || "84"}</span></div>
                      <div>Book No.: <span className="font-bold underline">{formData.notary?.bookNo || "XII"}</span></div>
                      <div>Series of: <span className="font-bold underline">{formData.notary?.series || "2025"}</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-10"></div>
                    <div className="border-t border-neutral-800 inline-block w-48 text-center pt-1 font-bold text-[10px]">
                      NOTARY PUBLIC
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apple-styled Fluid Print / PDF Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle={documentTitle || "Annex 3 - TDP Continuing Billing Statement"}
        annexNumber={3}
        orientation={printOrientation}
        onOrientationChange={setPrintOrientation}
        availableForms={availableForms}
        activeFormId={activeTab}
        activeFormLabel={activeFormLabel}
        scope={printScope}
        onScopeChange={setPrintScope}
        previewContent={
          <div className="text-ink">
            {(activeTab === "tab1" || printScope === "all") && (
              <div className="p-4 border border-dashed border-neutral-300 rounded mb-4">
                <div className="font-bold text-sm text-minsu-green-900 mb-1">Form 1: Consolidated TDP Billing Statement</div>
                <div className="text-xs text-ink-muted">TDP Batch {formData.batchNumber} • AY {formData.academicYear} • Total Scholars: {formData.totalGrantees}</div>
                <div className="text-xs font-mono font-bold text-ink mt-1">Total Subsidy: ₱{formData.totalSubsidy.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
            )}
            {(activeTab === "tab2" || printScope === "all") && (
              <div className="p-4 border border-dashed border-neutral-300 rounded mb-4">
                <div className="font-bold text-sm text-minsu-green-900 mb-1">Form 2: Billed Grantees Details ({formData.billedGrantees.length} Scholars)</div>
                <div className="text-xs text-ink-muted">Official multi-tier ledger with student numbers, programs, year levels, and subsidy amounts.</div>
              </div>
            )}
            {(activeTab === "tab3" || printScope === "all") && (
              <div className="p-4 border border-dashed border-neutral-300 rounded mb-4">
                <div className="font-bold text-sm text-minsu-green-900 mb-1">Form 3: Other Grantees ({formData.otherGrantees.length} Scholars)</div>
                <div className="text-xs text-ink-muted">Non-billed scholar listing (LOA, Transferred, Graduated).</div>
              </div>
            )}
            {(activeTab === "tab4" || printScope === "all") && (
              <div className="p-4 border border-dashed border-neutral-300 rounded">
                <div className="font-bold text-sm text-minsu-green-900 mb-1">Form 4: Certification & Notarization</div>
                <div className="text-xs text-ink-muted">Official MinSU Registrar Certification and Notary Public block.</div>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
