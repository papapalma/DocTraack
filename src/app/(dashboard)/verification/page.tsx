"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Download,
  RefreshCw,
  Trash2,
  History,
  ArrowLeft,
  Filter,
  Eye,
  Check,
  X,
  ShieldCheck,
  Layers,
  ChevronDown,
  Sparkles,
  Info,
  Award,
  Printer,
  FileText,
} from "lucide-react";
import { CertificateModal, CertificateStudentData } from "@/components/certificate/certificate-modal";

interface VerificationRunSummary {
  totalChed: number;
  totalRegistrar: number;
  totalSystem: number;
  fullyVerified: number;
  needsEncoding: number;
  notEnrolled: number;
  systemDiscrepancy: number;
  possibleMatch: number;
  enrolledNonScholar: number;
}

interface VerificationRunInfo {
  id: string;
  runNumber: number;
  title: string;
  chedFileName: string;
  registrarFileName: string;
  systemDataSource: string;
  totalChedRows: number;
  totalRegistrarRows: number;
  totalSystemRows: number;
  fullyVerifiedCount: number;
  needsEncodingCount: number;
  notEnrolledCount: number;
  systemDiscrepancyCount: number;
  possibleMatchCount: number;
  enrolledNonScholarCount: number;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string };
}

interface VerificationResultItem {
  id: string;
  status:
    | "FULLY_VERIFIED"
    | "NEEDS_ENCODING"
    | "NOT_ENROLLED"
    | "SYSTEM_DISCREPANCY"
    | "POSSIBLE_MATCH"
    | "ENROLLED_NON_SCHOLAR";
  studentIdNo?: string | null;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  school: string;
  inChed: boolean;
  inRegistrar: boolean;
  inSystem: boolean;
  confidenceScore?: number | null;
  matchDetails?: any;
  isManuallyResolved: boolean;
  resolvedStatus?: string | null;
  resolvedNotes?: string | null;
}

export default function VerificationPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();

  useEffect(() => {
    if (!isSessionLoading && user) {
      if (user.role !== "STAFF" && user.role !== "DIRECTOR") {
        router.replace("/dashboard?denied=verification");
      }
    }
  }, [user, isSessionLoading, router]);

  // Wizard Step: 1 = Upload, 2 = Pre-flight Preview, 3 = Results Table
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Upload States
  const [chedFile, setChedFile] = useState<File | null>(null);
  const [registrarFile, setRegistrarFile] = useState<File | null>(null);
  const [systemScope, setSystemScope] = useState<"ACCEPTED_GRANTEES" | "ALL_APPLICANTS">(
    "ACCEPTED_GRANTEES"
  );
  const [runTitle, setRunTitle] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  // Pre-flight Summary Data
  const [previewData, setPreviewData] = useState<{
    readyToCompare: boolean;
    chedSummary: any;
    registrarSummary: any;
  } | null>(null);

  // Execution States
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<VerificationRunInfo | null>(null);

  // Results Table States
  const [results, setResults] = useState<VerificationResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Table Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolsList, setSchoolsList] = useState<string[]>([]);

  // Previous Runs Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [previousRuns, setPreviousRuns] = useState<VerificationRunInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Slide-Over Drawer for Fuzzy Match Resolution
  const [selectedMatch, setSelectedMatch] = useState<VerificationResultItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Purge Run Modal State
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Certificate Modal State (Single & Batch)
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCertStudent, setSelectedCertStudent] = useState<CertificateStudentData | null>(null);
  const [batchCertStudents, setBatchCertStudents] = useState<CertificateStudentData[] | null>(null);

  // Open single student certificate
  const openSingleCertificate = (item: VerificationResultItem) => {
    const studentName = `${item.firstName} ${item.middleName ? item.middleName + " " : ""}${item.lastName}`.trim();
    setSelectedCertStudent({
      name: studentName,
      studentId: item.studentIdNo || undefined,
      campus: item.school,
      course: "Officially Enrolled Student",
      batchNumber: activeRun?.runNumber || 1,
      trackingCode: `MINSU-VREF-${(activeRun?.id || "RUN").slice(0, 6).toUpperCase()}-${(item.id || "001").slice(0, 5).toUpperCase()}`,
      universityName: "MINDORO STATE UNIVERSITY",
    });
    setBatchCertStudents(null);
    setCertModalOpen(true);
  };

  // Open batch certificates for all enrolled non-scholars
  const openBatchCertificates = async () => {
    if (!activeRunId) return;
    try {
      const res = await fetch(
        `/api/verification/runs/${activeRunId}?pageSize=100&status=ENROLLED_NON_SCHOLAR&school=${schoolFilter}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        const batchList: CertificateStudentData[] = (data.results || []).map(
          (item: VerificationResultItem) => ({
            name: `${item.firstName} ${item.middleName ? item.middleName + " " : ""}${item.lastName}`.trim(),
            studentId: item.studentIdNo || undefined,
            campus: item.school,
            course: "Officially Enrolled Student",
            batchNumber: activeRun?.runNumber || 1,
            trackingCode: `MINSU-VREF-${(activeRun?.id || "RUN").slice(0, 6).toUpperCase()}-${(item.id || "001").slice(0, 5).toUpperCase()}`,
            universityName: "MINDORO STATE UNIVERSITY",
          })
        );
        if (batchList.length > 0) {
          setBatchCertStudents(batchList);
          setSelectedCertStudent(null);
          setCertModalOpen(true);
        }
      }
    } catch (e) {
      console.error("Failed to load batch certificates:", e);
    }
  };

  // File Inputs references
  const chedInputRef = useRef<HTMLInputElement>(null);
  const registrarInputRef = useRef<HTMLInputElement>(null);

  // Load Previous Runs on Mount
  const fetchPreviousRuns = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/verification/runs");
      if (res.ok) {
        const data = await res.json();
        setPreviousRuns(data.runs || []);
      }
    } catch (err) {
      console.error("Failed to fetch runs:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPreviousRuns();
  }, []);

  // Fetch Results for Active Run with Filters & Pagination
  const fetchRunResults = async (
    runId: string,
    p = page,
    ps = pageSize,
    st = statusFilter,
    sc = schoolFilter,
    q = searchQuery
  ) => {
    try {
      setIsLoadingResults(true);
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(ps),
        status: st,
        school: sc,
        search: q,
      });

      const res = await fetch(`/api/verification/runs/${runId}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActiveRun(data.run);
        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (Array.isArray(data.schools)) {
          setSchoolsList(data.schools);
        }
      }
    } catch (err) {
      console.error("Failed to load run results:", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Trigger search / filter refetch when query parameters change in step 3
  useEffect(() => {
    if (currentStep === 3 && activeRunId) {
      const timer = setTimeout(() => {
        fetchRunResults(activeRunId, page, pageSize, statusFilter, schoolFilter, searchQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [currentStep, activeRunId, page, pageSize, statusFilter, schoolFilter, searchQuery]);

  // Handle Step 1 -> Step 2: Upload Pre-flight Inspection
  const handleInspectFiles = async () => {
    if (!chedFile || !registrarFile) {
      setInspectionError("Please upload both the CHED CSV and Registrar CSV files.");
      return;
    }

    try {
      setIsInspecting(true);
      setInspectionError(null);

      const formData = new FormData();
      formData.append("chedFile", chedFile);
      formData.append("registrarFile", registrarFile);

      const res = await fetch("/api/verification/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setInspectionError(data.error || "Pre-flight validation failed.");
        return;
      }

      setPreviewData(data);
      setCurrentStep(2);
    } catch (err) {
      console.error("Inspection error:", err);
      setInspectionError("Failed to communicate with validation service.");
    } finally {
      setIsInspecting(false);
    }
  };

  // Handle Step 2 -> Step 3: Run Comparison
  const handleExecuteComparison = async () => {
    if (!chedFile || !registrarFile) return;

    try {
      setIsRunning(true);
      setInspectionError(null);

      const formData = new FormData();
      formData.append("chedFile", chedFile);
      formData.append("registrarFile", registrarFile);
      formData.append("systemScope", systemScope);
      if (runTitle.trim()) {
        formData.append("title", runTitle.trim());
      }

      const res = await fetch("/api/verification/run", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setInspectionError(data.error || "Failed to execute cross-check.");
        return;
      }

      setActiveRunId(data.runId);
      setPage(1);
      setStatusFilter("ALL");
      setSearchQuery("");
      setCurrentStep(3);
      fetchPreviousRuns();
      fetchRunResults(data.runId, 1, pageSize, "ALL", "ALL", "");
    } catch (err) {
      console.error("Execution error:", err);
      setInspectionError("An unexpected error occurred during matching.");
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Fuzzy Match Resolution (Confirm or Dismiss)
  const handleResolveMatch = async (action: "CONFIRM" | "DISMISS") => {
    if (!selectedMatch || !activeRunId) return;

    try {
      setIsResolving(true);
      const res = await fetch(`/api/verification/runs/${activeRunId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: selectedMatch.id,
          action,
          notes: resolutionNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSelectedMatch(null);
        setResolutionNotes("");
        // Refresh active results
        fetchRunResults(activeRunId, page, pageSize, statusFilter, schoolFilter, searchQuery);
      }
    } catch (err) {
      console.error("Resolve match error:", err);
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Purge / Delete Run (RA 10173 compliance)
  const handlePurgeRun = async () => {
    if (!activeRunId) return;

    try {
      setIsPurging(true);
      const res = await fetch(`/api/verification/runs/${activeRunId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPurgeModalOpen(false);
        setActiveRunId(null);
        setActiveRun(null);
        setChedFile(null);
        setRegistrarFile(null);
        setPreviewData(null);
        setCurrentStep(1);
        fetchPreviousRuns();
      }
    } catch (err) {
      console.error("Purge run error:", err);
    } finally {
      setIsPurging(false);
    }
  };

  // Status Badge Component matching MinSU Design System
  const renderStatusBadge = (status: string, confidenceScore?: number | null) => {
    switch (status) {
      case "FULLY_VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#1B5E20] border border-[#25702A]/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
            Fully Verified
          </span>
        );
      case "NEEDS_ENCODING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/30">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B88A00]" />
            Needs Encoding
          </span>
        );
      case "NOT_ENROLLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Not Enrolled
          </span>
        );
      case "SYSTEM_DISCREPANCY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            System Only Discrepancy
          </span>
        );
      case "POSSIBLE_MATCH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Possible Match ({confidenceScore ? `${Math.round(confidenceScore * 100)}%` : ""})
          </span>
        );
      case "ENROLLED_NON_SCHOLAR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17] border border-[#25702A]/30">
            <Award className="w-3.5 h-3.5 text-[#B88A00]" />
            Enrolled • No Other Scholar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            {status}
          </span>
        );
    }
  };

  if (isSessionLoading || !user) return null;
  if (user.role !== "STAFF" && user.role !== "DIRECTOR") return null;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D6DDD8] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#1B5E20]/10 flex items-center justify-center text-[#1B5E20]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2A24] font-heading">
              Student Enrollment & Scholarship Verification
            </h1>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Automated 3-way cross-check comparing CHED grantee list, Registrar official enrollment,
            and DocTrack system records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryModalOpen(true)}
            className="apple-press text-[#123F17] border-[#D6DDD8]"
          >
            <History className="w-4 h-4 mr-1.5" />
            Past Runs ({previousRuns.length})
          </Button>

          {currentStep === 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChedFile(null);
                setRegistrarFile(null);
                setPreviewData(null);
                setActiveRunId(null);
                setActiveRun(null);
                setCurrentStep(1);
              }}
              className="apple-press text-[#1B5E20] border-[#1B5E20]"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              New Cross-Check
            </Button>
          )}
        </div>
      </div>

      {/* Wizard Progress Pills */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#55645B]">
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
            currentStep === 1
              ? "bg-[#1B5E20] text-white shadow-sm font-semibold"
              : "bg-[#F1F8F1] text-[#123F17]"
          }`}
        >
          1. Upload & Settings
        </span>
        <span className="text-[#D6DDD8]">&rarr;</span>
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
            currentStep === 2
              ? "bg-[#1B5E20] text-white shadow-sm font-semibold"
              : "bg-[#F1F8F1] text-[#123F17]"
          }`}
        >
          2. Pre-flight Validation
        </span>
        <span className="text-[#D6DDD8]">&rarr;</span>
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
            currentStep === 3
              ? "bg-[#1B5E20] text-white shadow-sm font-semibold"
              : "bg-[#F1F8F1] text-[#123F17]"
          }`}
        >
          3. Verification Results
        </span>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Upload & Configuration                                            */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {inspectionError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Upload Validation Notice</p>
                <p className="mt-0.5 text-xs text-red-700">{inspectionError}</p>
              </div>
            </div>
          )}

          {/* Quick Template Download Banner */}
          <div className="p-4 rounded-2xl bg-[#F1F8F1] border border-[#DCEFDD] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#123F17]">
                  Download Official Pipe-Delimited CSV Templates
                </h3>
                <p className="text-xs text-[#55645B] mt-0.5">
                  Both files must strictly use pipe delimiter (<code>|</code>). Use these templates to ensure 100% parsing accuracy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/verification/templates/ched"
                download="ched_template_doctrack.csv"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#1B5E20] border border-[#D6DDD8] shadow-sm hover:bg-[#DCEFDD] transition-all apple-press"
              >
                <Download className="w-3.5 h-3.5 text-[#1B5E20]" />
                CHED Template
              </a>
              <a
                href="/api/verification/templates/registrar"
                download="registrar_template_doctrack.csv"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#1B5E20] border border-[#D6DDD8] shadow-sm hover:bg-[#DCEFDD] transition-all apple-press"
              >
                <Download className="w-3.5 h-3.5 text-[#1B5E20]" />
                Registrar Template
              </a>
            </div>
          </div>

          {/* File Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. CHED Upload Card */}
            <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden hover:border-[#1B5E20]/40 transition-all">
              <CardHeader className="bg-[#F6F8F6] border-b border-[#D6DDD8] py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <CardTitle className="text-sm font-bold text-[#1F2A24]">
                      CHED Scholarship / Grantee List
                    </CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-[#55645B] bg-white px-2 py-0.5 rounded border border-[#D6DDD8]">
                    4 columns
                  </span>
                </div>
                <CardDescription className="text-xs text-[#55645B]">
                  Format: <code>lastName|firstName|middleName|School</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={chedInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setChedFile(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onClick={() => chedInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    chedFile
                      ? "border-[#1B5E20] bg-[#F1F8F1]/60"
                      : "border-[#D6DDD8] hover:border-[#1B5E20]/60 hover:bg-[#F6F8F6]"
                  }`}
                >
                  <UploadCloud
                    className={`w-10 h-10 mx-auto transition-colors ${
                      chedFile ? "text-[#1B5E20]" : "text-[#55645B]"
                    }`}
                  />
                  {chedFile ? (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-[#1B5E20] truncate max-w-xs mx-auto">
                        {chedFile.name}
                      </p>
                      <p className="text-xs text-[#55645B] mt-0.5">
                        {(chedFile.size / 1024).toFixed(1)} KB • Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-[#1F2A24]">
                        Click or drag CHED CSV file here
                      </p>
                      <p className="text-xs text-[#55645B] mt-1">
                        Pipe-delimited (.csv) with headers
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Registrar Upload Card */}
            <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden hover:border-[#1B5E20]/40 transition-all">
              <CardHeader className="bg-[#F6F8F6] border-b border-[#D6DDD8] py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <CardTitle className="text-sm font-bold text-[#1F2A24]">
                      Registrar Official Enrollment List
                    </CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-[#55645B] bg-white px-2 py-0.5 rounded border border-[#D6DDD8]">
                    5 columns
                  </span>
                </div>
                <CardDescription className="text-xs text-[#55645B]">
                  Format: <code>lastName|firstName|middleName|School|IDnumber</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <input
                  type="file"
                  accept=".csv,.txt"
                  ref={registrarInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRegistrarFile(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onClick={() => registrarInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    registrarFile
                      ? "border-[#1B5E20] bg-[#F1F8F1]/60"
                      : "border-[#D6DDD8] hover:border-[#1B5E20]/60 hover:bg-[#F6F8F6]"
                  }`}
                >
                  <UploadCloud
                    className={`w-10 h-10 mx-auto transition-colors ${
                      registrarFile ? "text-[#1B5E20]" : "text-[#55645B]"
                    }`}
                  />
                  {registrarFile ? (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-[#1B5E20] truncate max-w-xs mx-auto">
                        {registrarFile.name}
                      </p>
                      <p className="text-xs text-[#55645B] mt-0.5">
                        {(registrarFile.size / 1024).toFixed(1)} KB • Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-[#1F2A24]">
                        Click or drag Registrar CSV file here
                      </p>
                      <p className="text-xs text-[#55645B] mt-1">
                        Pipe-delimited (.csv) with IDnumber
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. System Data Scope & Configuration */}
          <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#F6F8F6] border-b border-[#D6DDD8] py-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <CardTitle className="text-sm font-bold text-[#1F2A24]">
                  DocTrack Database Scope & Comparison Settings
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#55645B]">
                DocTrack student data is pulled automatically from the database. Select which population to evaluate against.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSystemScope("ACCEPTED_GRANTEES")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    systemScope === "ACCEPTED_GRANTEES"
                      ? "border-[#1B5E20] bg-[#F1F8F1]"
                      : "border-[#D6DDD8] hover:border-[#1B5E20]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1F2A24]">
                      Accepted TDP Grantees
                    </span>
                    {systemScope === "ACCEPTED_GRANTEES" && (
                      <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" />
                    )}
                  </div>
                  <p className="text-xs text-[#55645B] mt-1">
                    (Recommended) Cross-checks strictly against approved scholars who have passed DocTrack validation.
                  </p>
                </div>

                <div
                  onClick={() => setSystemScope("ALL_APPLICANTS")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    systemScope === "ALL_APPLICANTS"
                      ? "border-[#1B5E20] bg-[#F1F8F1]"
                      : "border-[#D6DDD8] hover:border-[#1B5E20]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1F2A24]">
                      All Registered Applicants
                    </span>
                    {systemScope === "ALL_APPLICANTS" && (
                      <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" />
                    )}
                  </div>
                  <p className="text-xs text-[#55645B] mt-1">
                    Includes all registered student applications (Submitted, Under Review, Accepted, and Rejected).
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="title" className="text-xs font-semibold text-[#1F2A24]">
                  Comparison Title (Optional)
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. 2026-2027 1st Sem Verification - Batch 1"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  className="rounded-xl border-[#D6DDD8] focus:border-[#1B5E20] focus:ring-[#1B5E20]"
                />
              </div>

              {/* Data Privacy RA 10173 Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#55645B] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B5E20] shrink-0 mt-0.5" />
                <p>
                  <strong>Data Privacy Act (RA 10173):</strong> Uploaded CSV files are parsed in memory and never stored permanently on disk. Execution details are immutably logged in the audit trail.
                </p>
              </div>

              {/* Inspect Files Action */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleInspectFiles}
                  disabled={!chedFile || !registrarFile || isInspecting}
                  className="apple-press bg-[#1B5E20] hover:bg-[#164D1C] text-white px-6 font-semibold"
                >
                  {isInspecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Validating Files...
                    </>
                  ) : (
                    <>
                      Inspect & Validate Files &rarr;
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Pre-flight Inspection & Summary                                   */}
      {/* ========================================================================= */}
      {currentStep === 2 && previewData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="apple-press text-[#123F17] border-[#D6DDD8]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Upload
            </Button>

            <Button
              onClick={handleExecuteComparison}
              disabled={!previewData.readyToCompare || isRunning}
              className="apple-press bg-[#1B5E20] hover:bg-[#164D1C] text-white px-6 font-semibold shadow-md"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running 3-Way Match...
                </>
              ) : (
                <>
                  Run 3-Way Cross-Check &rarr;
                </>
              )}
            </Button>
          </div>

          {/* Validation Cards for Both Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CHED Summary Card */}
            <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#F6F8F6] border-b border-[#D6DDD8] py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#1F2A24]">
                    CHED CSV: {previewData.chedSummary.fileName}
                  </CardTitle>
                  {previewData.chedSummary.headerValid ? (
                    <span className="text-xs font-semibold text-[#1B5E20] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid Header
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Invalid Header
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Valid Rows</p>
                    <p className="text-lg font-bold text-[#1B5E20]">
                      {previewData.chedSummary.validCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Invalid Rows</p>
                    <p className={`text-lg font-bold ${previewData.chedSummary.invalidCount > 0 ? "text-red-600" : "text-[#1F2A24]"}`}>
                      {previewData.chedSummary.invalidCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Duplicates</p>
                    <p className={`text-lg font-bold ${previewData.chedSummary.duplicateCount > 0 ? "text-amber-600" : "text-[#1F2A24]"}`}>
                      {previewData.chedSummary.duplicateCount}
                    </p>
                  </div>
                </div>

                {/* Invalid rows warning if any */}
                {previewData.chedSummary.invalidRows.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 max-h-36 overflow-y-auto">
                    <p className="font-semibold text-red-900">
                      Parsing notices in CHED CSV (rows will be skipped):
                    </p>
                    {previewData.chedSummary.invalidRows.map((err: any, idx: number) => (
                      <p key={idx} className="font-mono text-[11px]">
                        Line {err.lineNumber}: {err.reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* Duplicates notice if any */}
                {previewData.chedSummary.duplicates.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 max-h-28 overflow-y-auto">
                    <p className="font-semibold">Internal duplicates detected:</p>
                    {previewData.chedSummary.duplicates.map((dup: any, idx: number) => (
                      <p key={idx} className="text-[11px]">
                        Line {dup.lineNumber} is a duplicate of Line {dup.duplicateOfLine} ({dup.name})
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registrar Summary Card */}
            <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#F6F8F6] border-b border-[#D6DDD8] py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#1F2A24]">
                    Registrar CSV: {previewData.registrarSummary.fileName}
                  </CardTitle>
                  {previewData.registrarSummary.headerValid ? (
                    <span className="text-xs font-semibold text-[#1B5E20] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid Header
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Invalid Header
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Valid Rows</p>
                    <p className="text-lg font-bold text-[#1B5E20]">
                      {previewData.registrarSummary.validCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Invalid Rows</p>
                    <p className={`text-lg font-bold ${previewData.registrarSummary.invalidCount > 0 ? "text-red-600" : "text-[#1F2A24]"}`}>
                      {previewData.registrarSummary.invalidCount}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                    <p className="text-xs text-[#55645B]">Duplicates</p>
                    <p className={`text-lg font-bold ${previewData.registrarSummary.duplicateCount > 0 ? "text-amber-600" : "text-[#1F2A24]"}`}>
                      {previewData.registrarSummary.duplicateCount}
                    </p>
                  </div>
                </div>

                {/* Invalid rows warning if any */}
                {previewData.registrarSummary.invalidRows.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 max-h-36 overflow-y-auto">
                    <p className="font-semibold text-red-900">
                      Parsing notices in Registrar CSV (rows will be skipped):
                    </p>
                    {previewData.registrarSummary.invalidRows.map((err: any, idx: number) => (
                      <p key={idx} className="font-mono text-[11px]">
                        Line {err.lineNumber}: {err.reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* Duplicates notice if any */}
                {previewData.registrarSummary.duplicates.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 max-h-28 overflow-y-auto">
                    <p className="font-semibold">Internal duplicates detected:</p>
                    {previewData.registrarSummary.duplicates.map((dup: any, idx: number) => (
                      <p key={idx} className="text-[11px]">
                        Line {dup.lineNumber} is a duplicate of Line {dup.duplicateOfLine} ({dup.name})
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Verification Results Dashboard                                    */}
      {/* ========================================================================= */}
      {currentStep === 3 && activeRun && (
        <div className="space-y-6">
          {/* Top Run Metadata Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#D6DDD8] apple-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1B5E20]/10 text-[#1B5E20]">
                  Run #{activeRun.runNumber}
                </span>
                <h2 className="text-lg font-bold text-[#1F2A24]">{activeRun.title}</h2>
              </div>
              <p className="text-xs text-[#55645B] mt-1">
                CHED: <code>{activeRun.chedFileName}</code> ({activeRun.totalChedRows} rows) •
                Registrar: <code>{activeRun.registrarFileName}</code> ({activeRun.totalRegistrarRows} rows) •
                System DB: {activeRun.totalSystemRows} records •
                Scope: {activeRun.systemDataSource === "ACCEPTED_GRANTEES" ? "Accepted Grantees" : "All Applicants"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <div className="flex items-center gap-1.5">
                <a
                  href={`/api/verification/runs/${activeRun.id}/export?format=excel&status=${statusFilter}&school=${schoolFilter}&search=${encodeURIComponent(
                    searchQuery
                  )}`}
                  download={`Verification_3Form_Report_${activeRun.id.slice(0, 8)}.xlsx`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#1B5E20] text-white hover:bg-[#164D1C] shadow-sm transition-all apple-press"
                  title="Download the official 3-Form verification report (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download 3-Form Report (.xlsx)
                </a>
                <a
                  href={`/api/verification/runs/${activeRun.id}/export?format=csv&status=${statusFilter}&school=${schoolFilter}&search=${encodeURIComponent(
                    searchQuery
                  )}`}
                  download={`Verification_Report_${activeRun.id.slice(0, 8)}.csv`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#123F17] border border-[#D6DDD8] shadow-sm hover:bg-[#F1F8F1] transition-all apple-press"
                  title="Download verification results (.csv)"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </a>
              </div>

              {/* Purge Run Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPurgeModalOpen(true)}
                className="apple-press text-red-600 hover:bg-red-50"
                title="Purge this verification run"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Official 3-Form Tabular Report Navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D6DDD8] pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1B5E20]">
                Official Verification Forms & Status Tabs
              </span>
              <span className="text-[11px] text-[#55645B]">
                Filter records by official university compliance forms
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Form 1: Enrolled Scholars */}
              <div
                onClick={() => {
                  setStatusFilter("ENROLLED_SCHOLARS");
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all apple-press ${
                  statusFilter === "ENROLLED_SCHOLARS" || statusFilter === "FULLY_VERIFIED" || statusFilter === "NEEDS_ENCODING"
                    ? "border-[#1B5E20] bg-[#DCEFDD]/50 shadow-sm"
                    : "border-[#D6DDD8] bg-white hover:border-[#1B5E20]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1B5E20] uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" /> Form 1
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B5E20] text-white">
                    {activeRun.fullyVerifiedCount + activeRun.needsEncodingCount}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1F2A24] mt-1.5">Enrolled Scholars</h4>
                <p className="text-[11px] text-[#55645B] mt-0.5">Enrolled + CHED Grantee</p>
              </div>

              {/* Form 2: Scholars Not Enrolled */}
              <div
                onClick={() => {
                  setStatusFilter("NOT_ENROLLED");
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all apple-press ${
                  statusFilter === "NOT_ENROLLED"
                    ? "border-red-600 bg-red-50 shadow-sm"
                    : "border-[#D6DDD8] bg-white hover:border-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600" /> Form 2
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
                    {activeRun.notEnrolledCount}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1F2A24] mt-1.5">Scholars Not Enrolled</h4>
                <p className="text-[11px] text-[#55645B] mt-0.5">Listed in CHED only</p>
              </div>

              {/* Form 3: Enrolled Non-Scholars */}
              <div
                onClick={() => {
                  setStatusFilter("ENROLLED_NON_SCHOLAR");
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all apple-press ${
                  statusFilter === "ENROLLED_NON_SCHOLAR"
                    ? "border-[#123F17] bg-[#F1F8F1] shadow-sm ring-1 ring-[#1B5E20]"
                    : "border-[#D6DDD8] bg-white hover:border-[#123F17]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#123F17] uppercase tracking-wide flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#B88A00]" /> Form 3
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#123F17] text-white">
                    {activeRun.enrolledNonScholarCount}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#123F17] mt-1.5">Enrolled Non-Scholars</h4>
                <p className="text-[11px] text-[#55645B] mt-0.5">Certificate of No Other Scholar</p>
              </div>

              {/* Discrepancies & Reviews */}
              <div
                onClick={() => {
                  setStatusFilter("DISCREPANCIES");
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all apple-press ${
                  statusFilter === "DISCREPANCIES" || statusFilter === "POSSIBLE_MATCH" || statusFilter === "SYSTEM_DISCREPANCY"
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-[#D6DDD8] bg-white hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Review
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                    {activeRun.possibleMatchCount + activeRun.systemDiscrepancyCount}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1F2A24] mt-1.5">Discrepancies</h4>
                <p className="text-[11px] text-[#55645B] mt-0.5">Fuzzy matches & system records</p>
              </div>

              {/* All Records */}
              <div
                onClick={() => {
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all apple-press ${
                  statusFilter === "ALL"
                    ? "border-[#55645B] bg-slate-100 shadow-sm"
                    : "border-[#D6DDD8] bg-white hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#55645B] uppercase tracking-wide flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#55645B]" /> Master
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#55645B] text-white">
                    {activeRun.fullyVerifiedCount +
                      activeRun.needsEncodingCount +
                      activeRun.notEnrolledCount +
                      activeRun.systemDiscrepancyCount +
                      activeRun.possibleMatchCount +
                      activeRun.enrolledNonScholarCount}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1F2A24] mt-1.5">All Records</h4>
                <p className="text-[11px] text-[#55645B] mt-0.5">Complete verification pool</p>
              </div>
            </div>
          </div>

          {/* Form 3 Dedicated Certification Banner */}
          {statusFilter === "ENROLLED_NON_SCHOLAR" && (
            <div className="p-4 rounded-2xl bg-[#F1F8F1] border border-[#DCEFDD] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B5E20] text-[#F2B705] flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123F17] flex items-center gap-2">
                    <span>Form 3: Certification of No Other Scholar</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1B5E20] text-white">
                      {activeRun.enrolledNonScholarCount} Verified Enrolled Non-Scholars
                    </span>
                  </h3>
                  <p className="text-xs text-[#55645B] mt-0.5">
                    These students are officially enrolled in the Registrar and cross-checked as having NO existing CHED scholarship grant. Official certifications can be printed individually or in batch.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={openBatchCertificates}
                  className="apple-press text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Batch Print All Certifications ({activeRun.enrolledNonScholarCount})
                </Button>
              </div>
            </div>
          )}


          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#55645B] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search student name, Registrar ID number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 rounded-xl border-[#D6DDD8] focus:border-[#1B5E20] focus:ring-[#1B5E20] bg-white"
              />
            </div>

            {/* School Filter Dropdown */}
            {schoolsList.length > 0 && (
              <div className="w-full sm:w-72">
                <select
                  value={schoolFilter}
                  onChange={(e) => {
                    setSchoolFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#D6DDD8] bg-white text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
                >
                  <option value="ALL">All Campuses / Schools</option>
                  {schoolsList.map((sc, idx) => (
                    <option key={idx} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Results Table */}
          <Card className="apple-shadow border-[#D6DDD8] rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F6F8F6] border-b border-[#D6DDD8] text-[#55645B] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Registrar ID</th>
                    <th className="py-3 px-4">Campus / School</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Sources</th>
                    <th className="py-3 px-4 text-right">Action / Certification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {isLoadingResults ? (
                    <tr>
                      <td colSpan={6} className="p-4">
                        <SkeletonTableRows count={6} />
                      </td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#55645B]">
                        <p className="font-semibold text-sm text-[#1F2A24]">No student records found</p>
                        <p className="text-xs mt-1">Try adjusting your search query or status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    results.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#F1F8F1]/40 transition-colors ${
                          item.status === "POSSIBLE_MATCH" ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-[#1F2A24]">
                          {item.lastName}, {item.firstName} {item.middleName || ""}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#123F17]">
                          {item.studentIdNo || (
                            <span className="text-[#55645B] italic font-sans">Not assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#55645B] max-w-xs truncate" title={item.school}>
                          {item.school}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(item.status, item.confidenceScore)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.inChed ? "bg-[#1B5E20] text-white" : "bg-neutral-100 text-neutral-400"
                              }`}
                              title="CHED Grantee List"
                            >
                              CHED
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.inRegistrar ? "bg-[#1B5E20] text-white" : "bg-neutral-100 text-neutral-400"
                              }`}
                              title="Registrar Enrollment"
                            >
                              REG
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.inSystem ? "bg-[#1B5E20] text-white" : "bg-neutral-100 text-neutral-400"
                              }`}
                              title="DocTrack System DB"
                            >
                              SYS
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.status === "ENROLLED_NON_SCHOLAR" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openSingleCertificate(item)}
                              className="apple-press text-xs font-semibold border-[#1B5E20] text-[#1B5E20] hover:bg-[#DCEFDD] h-7 px-2.5 rounded-lg shadow-2xs"
                              title="Generate and print official Certificate of No Other Scholar"
                            >
                              <Award className="w-3.5 h-3.5 mr-1 text-[#B88A00]" />
                              Certificate of No Other Scholar
                            </Button>
                          )}
                          {item.status === "POSSIBLE_MATCH" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedMatch(item);
                                setResolutionNotes(item.resolvedNotes || "");
                              }}
                              className="apple-press text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white h-7 px-2.5 rounded-lg shadow-sm"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Review Match
                            </Button>
                          )}
                          {item.isManuallyResolved && (
                            <span className="text-[11px] text-[#1B5E20] font-semibold">
                              Manually {item.resolvedStatus}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#F6F8F6] border-t border-[#D6DDD8] flex items-center justify-between text-xs text-[#55645B]">
                <div>
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} records
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="apple-press text-xs h-8 px-3 rounded-lg border-[#D6DDD8]"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-[#1F2A24]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="apple-press text-xs h-8 px-3 rounded-lg border-[#D6DDD8]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Slide-over Drawer / Modal for Possible Match Resolution                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title="Review Possible Match (Fuzzy Verification)"
        description="Side-by-side comparison between the CHED grantee record and the closest Registrar candidate."
        maxWidth="lg"
      >
        {selectedMatch && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Match Confidence Score:
              </span>
              <span className="text-sm font-bold font-mono text-amber-900">
                {selectedMatch.confidenceScore
                  ? `${Math.round(selectedMatch.confidenceScore * 100)}%`
                  : "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CHED Record */}
              <div className="p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] space-y-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1B5E20] text-white">
                  Source: CHED List
                </span>
                <p className="text-sm font-bold text-[#1F2A24] pt-1">
                  {selectedMatch.lastName}, {selectedMatch.firstName} {selectedMatch.middleName || ""}
                </p>
                <p className="text-xs text-[#55645B]">{selectedMatch.school}</p>
                <p className="text-xs font-mono text-neutral-400 italic">No Registrar ID</p>
              </div>

              {/* Registrar Candidate */}
              <div className="p-4 rounded-xl border border-[#1B5E20]/40 bg-[#F1F8F1] space-y-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#B88A00] text-white">
                  Registrar Candidate
                </span>
                <p className="text-sm font-bold text-[#1F2A24] pt-1">
                  {selectedMatch.matchDetails?.candidateName || "Candidate Name"}
                </p>
                <p className="text-xs text-[#55645B]">
                  {selectedMatch.matchDetails?.candidateSchool || selectedMatch.school}
                </p>
                <p className="text-xs font-mono font-bold text-[#1B5E20]">
                  ID: {selectedMatch.studentIdNo || selectedMatch.matchDetails?.candidateId || "N/A"}
                </p>
              </div>
            </div>

            {/* Optional Resolution Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-[#1F2A24]">
                Staff Resolution Justification / Remarks
              </Label>
              <Input
                id="notes"
                placeholder="e.g. Verified typo in firstName against NSO birth certificate"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="rounded-xl border-[#D6DDD8]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6DDD8]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveMatch("DISMISS")}
                disabled={isResolving}
                className="apple-press text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Dismiss as Non-Match
              </Button>

              <Button
                size="sm"
                onClick={() => handleResolveMatch("CONFIRM")}
                disabled={isResolving}
                className="apple-press bg-[#1B5E20] hover:bg-[#164D1C] text-white font-semibold"
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm Match & Link ID
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* Previous Runs History Modal                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Verification Run History"
        description="Select a previous 3-way cross-check to view results or review past audit logs."
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {previousRuns.length === 0 ? (
            <div className="py-8 text-center text-[#55645B] text-xs">
              No previous comparison runs recorded yet.
            </div>
          ) : (
            previousRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => {
                  setActiveRunId(run.id);
                  setActiveRun(run);
                  setPage(1);
                  setStatusFilter("ALL");
                  setSearchQuery("");
                  setCurrentStep(3);
                  setHistoryModalOpen(false);
                  fetchRunResults(run.id, 1, pageSize, "ALL", "ALL", "");
                }}
                className="p-4 rounded-xl border border-[#D6DDD8] hover:border-[#1B5E20] hover:bg-[#F1F8F1]/40 cursor-pointer transition-all apple-press flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1B5E20]/10 text-[#1B5E20]">
                      #{run.runNumber}
                    </span>
                    <p className="text-sm font-bold text-[#1F2A24]">{run.title}</p>
                  </div>
                  <p className="text-xs text-[#55645B] mt-1">
                    {new Date(run.createdAt).toLocaleString()} • Ran by {run.createdBy?.name || "Staff"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[#1B5E20]">
                    {run.fullyVerifiedCount} Verified
                  </span>
                  <p className="text-[11px] text-[#55645B]">
                    {run.needsEncodingCount} to encode • {run.notEnrolledCount} flagged
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* Purge Run Confirmation Modal (Data Privacy Act RA 10173)                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        title="Purge Verification Run (RA 10173 Compliance)"
        description="Permanently deletes this cross-check run and all student comparison records from the DocTrack database."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>
              This action cannot be undone. In accordance with the Data Privacy Act of 2012, this will purge all matched records and Registrar ID associations for this run. A deletion event will be logged in the system audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurgeModalOpen(false)}
              disabled={isPurging}
              className="apple-press border-[#D6DDD8]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handlePurgeRun}
              disabled={isPurging}
              className="apple-press"
            >
              {isPurging ? "Purging Records..." : "Confirm Purge"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printable Certificate Modal for Enrolled Non-Scholar(s) */}
      {certModalOpen && (
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => {
            setCertModalOpen(false);
            setSelectedCertStudent(null);
            setBatchCertStudents(null);
          }}
          studentData={selectedCertStudent || undefined}
          batchStudents={batchCertStudents || undefined}
        />
      )}
    </div>
  );
}

