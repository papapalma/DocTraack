"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/documents/status-badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StateContainer } from "@/components/ui/state-container";
import { canEditDocument, canReviewDocument, canUploadScan, canTransmit, canArchive } from "@/lib/rbac";
import { AnnexFormField, DocumentStatus } from "@/types";
import type { AnnexPresetConfig } from "@/types/presets";
import { isPresetSupportedAnnex } from "@/lib/annex-presets";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Save,
  MessageSquare,
  Clock,
  ExternalLink,
  Archive,
  Upload,
  User,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Search,
  SearchX,
  RotateCcw,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { SortableTh } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { PrintPreviewModal } from "@/components/documents/print-preview-modal";
import { Logo } from "@/components/ui/logo";
import { PaperSize } from "@/types";
import { Annex3Viewer } from "@/components/documents/annex-3-viewer";
import { Annex4Viewer } from "@/components/documents/annex-4-viewer";
import { Annex5Viewer } from "@/components/documents/annex-5-viewer";
import { Annex6Viewer } from "@/components/documents/annex-6-viewer";
import { Annex7Viewer } from "@/components/documents/annex-7-viewer";
import { Annex8Viewer } from "@/components/documents/annex-8-viewer";
import { Annex9Viewer } from "@/components/documents/annex-9-viewer";
import { Annex10Viewer } from "@/components/documents/annex-10-viewer";
import { CustomPresetDocumentSuite } from "@/components/documents/custom-preset-suite";

function Annex1GranteesTable({ students, documentId }: { students: any[]; documentId: string }) {
  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDirection,
    onSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems: paginatedStudents,
  } = useTable({
    data: students,
    initialPageSize: 10,
    initialSortKey: "seq",
    initialSortDirection: "asc",
    searchFields: [
      (st) => st.student_id,
      (st) => `${st.last_name || ""} ${st.given_name || ""}`,
      (st) => st.course_degree,
      (st) => st.hei_campus || st.hei_name,
      (st) => `${st.street_barangay || ""} ${st.town_city || ""}`,
    ],
    getSortValue: (st, key) => {
      if (key === "seq") return Number(st.seq || 0);
      if (key === "batch_number") return Number(st.batch_number || 1);
      if (key === "student_id") return st.student_id || "";
      if (key === "name") return `${st.last_name || ""}, ${st.given_name || ""}`;
      if (key === "course_degree") return st.course_degree || "";
      if (key === "year_level") return Number(st.year_level || 1);
      if (key === "campus") return st.hei_campus || st.hei_name || "";
      return undefined;
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-[#D6DDD8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1B5E20]" />
            Annex 1 Validated Grantees List ({students.length} Students)
          </CardTitle>
          <CardDescription>
            Official TDP grantee candidates compiled for Director confirmation & agency submission.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a href={`/api/annex-1/export-excel?documentId=${documentId}`} download>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-[#1B5E20] border-[#1B5E20] apple-press">
              <Download className="w-3.5 h-3.5 mr-1 text-[#1B5E20]" />
              Download Excel
            </Button>
          </a>
        </div>
      </CardHeader>

      {/* Search Input Toolbar */}
      <div className="p-3.5 bg-[#F6F8F6] border-b border-[#D6DDD8] flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#55645B]" />
          <input
            type="text"
            placeholder="Search grantees by name, student ID, course, or campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 w-full rounded-lg border border-[#D6DDD8] bg-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1B5E20] focus-visible:border-[#1B5E20]"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs h-8 text-[#B3261E]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-[#F1F8F1] font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8] sticky top-0 z-10">
              <tr>
                <SortableTh label="Seq" sortKey="seq" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="70px" />
                <SortableTh label="Batch" sortKey="batch_number" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="90px" />
                <SortableTh label="Student ID" sortKey="student_id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="130px" />
                <SortableTh label="Student Name" sortKey="name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="220px" />
                <SortableTh label="Course / Degree" sortKey="course_degree" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="200px" />
                <SortableTh label="Year" sortKey="year_level" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="80px" />
                <SortableTh label="HEI UII & Campus" sortKey="campus" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} minWidth="180px" />
                <th className="py-2.5 px-3 uppercase tracking-wider text-[11px] font-semibold text-[#1F2A24] min-w-[180px]">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6DDD8]">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#55645B]">
                    No students match &ldquo;{searchQuery}&rdquo;
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F6F8F6] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#55645B] tabular-nums">{st.seq || (page - 1) * pageSize + idx + 1}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20 tabular-nums">
                        B{st.batch_number || 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1B5E20] tabular-nums whitespace-nowrap">{st.student_id}</td>
                    <td className="py-3 px-3 font-semibold text-[#1F2A24] break-words">
                      {st.last_name}, {st.given_name} {st.ext_name || ""} {st.middle_name || ""}
                    </td>
                    <td className="py-3 px-3 break-words">{st.course_degree}</td>
                    <td className="py-3 px-3 whitespace-nowrap tabular-nums">Year {st.year_level}</td>
                    <td className="py-3 px-3 text-[#55645B] break-words">
                      <span className="font-mono font-bold text-[#1B5E20] tabular-nums">{st.hei_uii || "4060"}</span> — {st.hei_campus || st.hei_name}
                    </td>
                    <td className="py-3 px-3 text-[#55645B] break-words">
                      {st.street_barangay}, {st.town_city}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="students"
        />
      </CardContent>
    </Card>
  );
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();

  const [document, setDocument] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingPreset, setSyncingPreset] = useState(false);
  const [presetSyncNotice, setPresetSyncNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [presetSyncVersion, setPresetSyncVersion] = useState(0);

  // Director review remarks
  const [reviewComment, setReviewComment] = useState("");

  // Discussion comments
  const [newComment, setNewComment] = useState("");

  // Transmittal form state
  const [showTransmitModal, setShowTransmitModal] = useState(false);
  const [recipientAgency, setRecipientAgency] = useState("");
  const [transmittalMethod, setTransmittalMethod] = useState("manual");
  const [driveLink, setDriveLink] = useState("");
  const [transmittalNotes, setTransmittalNotes] = useState("");

  // Annex 3 layout state: Toggle between full-width immersive canvas and workflow sidebar
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);

  // Universal Save / Download / Print modal state
  const [isUniversalPrintOpen, setIsUniversalPrintOpen] = useState(false);
  const [universalPrintOrientation, setUniversalPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [universalPaperSize, setUniversalPaperSize] = useState<PaperSize>("a4");

  // Fetch document
  const loadDoc = async () => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDocument(data.document);
        setFormData(data.document.formData || {});
        setTitle(data.document.title || "");
        if (data.document.transmittal) {
          setRecipientAgency(data.document.transmittal.recipient || "");
          setTransmittalMethod(data.document.transmittal.method || "manual");
          setDriveLink(data.document.transmittal.driveLink || "");
        }
      } else {
        setError("Document not found or access denied.");
      }
    } catch {
      setError("Failed to load document.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoc();

    // Global shortcut listener for Ctrl+P / Cmd+P on document pages
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("minsu:open-print-modal"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [id]);

  if (!user || isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-[#D6DDD8]/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* 2-Column Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-[#D6DDD8]/80 space-y-4 shadow-xs">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-[#D6DDD8]/80 space-y-4 shadow-xs">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === "SYSTEM_ADMIN" || user?.role === "STUDENT") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Annex documents are managed and reviewed exclusively by operational roles (Staff, Accounting, Director).
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (error || !document) {
    return (
      <StateContainer
        error={{
          whatWentWrong: error || "Document could not be located",
          context: typeof navigator !== "undefined" && !navigator.onLine
            ? "Your device is currently offline. Please reconnect to load the document from the server."
            : "The requested annex may have been removed or you may have insufficient viewing permissions.",
          onRetry: () => loadDoc(),
          onGoBack: () => router.push("/documents"),
        }}
      >
        <div />
      </StateContainer>
    );
  }

  const isPreparer = user.id === document.createdById;
  const isEditable = canEditDocument(user.id, document.createdById, document.status);
  const isReviewable = canReviewDocument(user.role, document.status);

  // Save changes to Draft / Returned document
  const handleSaveDraft = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, formData }),
      });
      if (res.ok) {
        await loadDoc();
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Submit / Resubmit for Review
  const handleSubmitReview = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reviewComment }),
      });
      if (res.ok) {
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Director: Approve
  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reviewComment }),
      });
      if (res.ok) {
        setReviewComment("");
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Director: Return with comment
  const handleReturn = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reviewComment }),
      });
      if (res.ok) {
        setReviewComment("");
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Record transmittal
  const handleRecordTransmittal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/transmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientAgency,
          method: transmittalMethod,
          driveLink,
          notes: transmittalNotes,
        }),
      });
      if (res.ok) {
        setShowTransmitModal(false);
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Archive
  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this transmitted document?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/archive`, { method: "POST" });
      if (res.ok) {
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Post Discussion Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/documents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        await loadDoc();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncPreset = async () => {
    if (!document?.presetId || syncingPreset) return;
    setSyncingPreset(true);
    setPresetSyncNotice(null);
    try {
      const res = await fetch(`/api/documents/${id}/sync-preset`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPresetSyncNotice({
          type: "error",
          text: data.error || "Failed to sync latest preset settings.",
        });
        return;
      }
      await loadDoc();
      setPresetSyncVersion((v) => v + 1);
      setPresetSyncNotice({
        type: "success",
        text: `Synced latest preset snapshot (${data.document?.presetNameSnapshot || "Preset updated"}).`,
      });
    } catch {
      setPresetSyncNotice({
        type: "error",
        text: "Network error while syncing latest preset.",
      });
    } finally {
      setSyncingPreset(false);
    }
  };

  const fields = (document.annexType?.formSchema as any)?.fields as AnnexFormField[] || [];
  const presetConfig = (document?.presetSnapshot || document?.preset?.config || null) as AnnexPresetConfig | null;
  const isCustomPresetDoc = presetConfig?.kind === "CUSTOM_UPLOAD";
  const showPresetBadge =
    Boolean(document?.presetId || document?.presetNameSnapshot || presetConfig) ||
    isPresetSupportedAnnex(document?.annexType?.number || 0);
  const presetLabel =
    document?.presetNameSnapshot ||
    document?.preset?.name ||
    "Preset 1 — Default";

  const isAnnex3 = !isCustomPresetDoc && document?.annexType?.number === 3 && (formData as any)?.billedGrantees;
  const isAnnex4 = !isCustomPresetDoc && document?.annexType?.number === 4 && (formData as any)?.grantees;
  const isAnnex5 = !isCustomPresetDoc && document?.annexType?.number === 5 && (formData as any)?.heis;
  const isAnnex6 = !isCustomPresetDoc && document?.annexType?.number === 6 && (formData as any)?.totalFundsReceived !== undefined;
  const isAnnex7 = !isCustomPresetDoc && document?.annexType?.number === 7;
  const isAnnex8 = !isCustomPresetDoc && document?.annexType?.number === 8;
  const isAnnex9 = !isCustomPresetDoc && document?.annexType?.number === 9 && (formData as any)?.grantees;
  const isAnnex10 = !isCustomPresetDoc && document?.annexType?.number === 10 && (formData as any)?.grantees;
  const isSpecialSuite = isCustomPresetDoc || isAnnex3 || isAnnex4 || isAnnex5 || isAnnex6 || isAnnex7 || isAnnex8 || isAnnex9 || isAnnex10;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="document-header-banner flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-[#D6DDD8] shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#55645B]">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
            </Link>
            <span className="font-bold text-xs px-2 py-0.5 rounded bg-[#DCEFDD] text-[#123F17]">
              Annex {document.annexType?.number}
            </span>
            <StatusBadge status={document.status} size="sm" />
            {showPresetBadge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F8F1] text-[#123F17] border border-[#1B5E20]/20">
                <Layers className="w-3 h-3 text-[#1B5E20]" />
                Preset: {presetLabel}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1F2A24]">
            {document.title}
          </h1>
          <p className="text-xs text-[#55645B]">
            Prepared by <strong className="text-[#1F2A24]">{document.createdBy?.name}</strong> ({document.createdBy?.role}) on{" "}
            {new Date(document.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditable && document.presetId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncingPreset}
              onClick={handleSyncPreset}
              className="border-[#B88A00]/40 text-[#B88A00] hover:bg-[#FFF1C2]/50 font-semibold apple-press"
              title="Refresh this draft with the latest saved preset layout and defaults"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingPreset ? "animate-spin" : ""}`} />
              {syncingPreset ? "Syncing..." : "Sync Latest Preset"}
            </Button>
          )}
          {/* Workflow Sidebar Toggle for suites that support it */}
          {isSpecialSuite && (
            <Button
              variant={showWorkflowPanel ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
              className={`font-semibold apple-press transition-all ${showWorkflowPanel
                  ? "bg-minsu-green-700 text-white"
                  : "border-minsu-green-700 text-minsu-green-700 hover:bg-minsu-green-50"
                }`}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              {showWorkflowPanel ? "Hide Workflow Actions" : "Workflow & Review Queue"}
            </Button>
          )}

          {/* Universal Save & Download / Print Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (isSpecialSuite) {
                window.dispatchEvent(new CustomEvent("minsu:open-print-modal"));
              } else {
                setIsUniversalPrintOpen(true);
              }
            }}
            className="bg-[#1B5E20] hover:bg-[#164D1C] text-white font-bold h-9 px-3.5 gap-2 apple-press shadow-xs border border-[#F2B705]/40"
            title="Save, download, or export this document to PDF with custom paper size (A4, Short, Long, Legal)"
          >
            <Download className="w-4 h-4 text-[#F2B705]" />
            <span>Save & Download</span>
          </Button>

          {/* Direct Excel Download (Annexes 1, 3, 4, 5, 6, 7, 8, 9) */}
          {[1, 3, 4, 5, 6, 7, 8, 9].includes(document.annexType?.number) && (
            <a href={`/api/annex-${document.annexType.number}/export-excel?documentId=${document.id}`} download>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold border-[#1B5E20] text-[#1B5E20] hover:bg-[#F1F8F1] shadow-xs"
                title={`Export official Annex ${document.annexType.number} spreadsheet`}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#1B5E20]" />
                Excel (.xlsx)
              </Button>
            </a>
          )}

          {/* Direct Word Download (Annex 10) */}
          {document.annexType?.number === 10 && (
            <a href={`/api/annex-10/export-doc?documentId=${document.id}`} download>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold border-[#1B5E20] text-[#1B5E20] hover:bg-[#F1F8F1] shadow-xs"
                title="Download official Microsoft Word (.doc) Notice of Award"
              >
                <FileText className="w-4 h-4 mr-1.5 text-[#1B5E20]" />
                Word (.doc)
              </Button>
            </a>
          )}
        </div>
      </div>

      {presetSyncNotice && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium print:hidden ${
            presetSyncNotice.type === "success"
              ? "bg-[#F1F8F1] border-[#1B5E20]/25 text-[#123F17]"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span>{presetSyncNotice.text}</span>
          <button
            type="button"
            onClick={() => setPresetSyncNotice(null)}
            className="text-[11px] font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left = Form Fields / Full Canvas, Right = Workflow & Timeline */}
      <div className={isSpecialSuite && !showWorkflowPanel ? "space-y-6 print:block" : "grid grid-cols-1 lg:grid-cols-3 gap-6 print:block"}>
        {/* Left Column: Document Data */}
        <div className={isSpecialSuite ? (showWorkflowPanel ? "lg:col-span-2 space-y-6 print:w-full print:max-w-none" : "w-full print:w-full print:max-w-none") : "lg:col-span-2 space-y-6 print:hidden"}>
          {isCustomPresetDoc && presetConfig ? (
            <CustomPresetDocumentSuite
              key={`${document.id}-${document.presetId || "custom"}-${presetSyncVersion}`}
              mode="view"
              annexTypeId={document.annexTypeId}
              annexNumber={document.annexType?.number || 1}
              presetId={document.presetId || undefined}
              presetName={presetLabel}
              presetConfig={presetConfig}
              documentId={document.id}
              documentTitle={document.title}
              initialFormData={formData}
              canEdit={isEditable}
              onSaved={loadDoc}
            />
          ) : isAnnex3 ? (
            <Annex3Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex4 ? (
            <Annex4Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex5 ? (
            <Annex5Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex6 ? (
            <Annex6Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex7 ? (
            <Annex7Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex8 ? (
            <Annex8Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex9 ? (
            <Annex9Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : isAnnex10 ? (
            <Annex10Viewer
              documentId={document.id}
              documentTitle={document.title}
              formData={formData as any}
              key={`${document.id}-${document.presetId || "default"}-${presetSyncVersion}`}
              presetId={document.presetId || undefined}
              presetConfig={presetConfig || undefined}
              onSaved={loadDoc}
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#D6DDD8]">
                <div>
                  <CardTitle className="text-base">Document Content & Fields</CardTitle>
                  <CardDescription>
                    {document.annexType?.name} • Official Template Fields
                  </CardDescription>
                </div>

                {isEditable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs"
                  >
                    {isEditing ? "Cancel Editing" : "Edit Fields"}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="pt-5 space-y-4">
                {/* Document Title */}
                <div className="space-y-1">
                  <Label htmlFor="doc-title">Document Title</Label>
                  {isEditing ? (
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#1F2A24] bg-[#F6F8F6] p-2.5 rounded-lg border border-[#D6DDD8]">
                      {document.title}
                    </p>
                  )}
                </div>

                {/* Form Schema Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={`space-y-1 ${field.type === "textarea" ? "sm:col-span-2" : ""
                        }`}
                    >
                      <Label htmlFor={field.id}>{field.label}</Label>

                      {isEditing ? (
                        field.type === "textarea" ? (
                          <textarea
                            id={field.id}
                            rows={3}
                            value={formData[field.id] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field.id]: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-[#D6DDD8] bg-white p-2.5 text-sm"
                          />
                        ) : (
                          <Input
                            id={field.id}
                            type={field.type}
                            value={formData[field.id] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field.id]: e.target.value,
                              })
                            }
                          />
                        )
                      ) : (
                        <div className="text-sm bg-[#F6F8F6] p-2.5 rounded-lg border border-[#D6DDD8] text-[#1F2A24] min-h-[38px] whitespace-pre-wrap">
                          {formData[field.id] !== undefined && formData[field.id] !== ""
                            ? String(formData[field.id])
                            : <span className="text-[#55645B]/60 italic">Not specified</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-[#D6DDD8] flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveDraft}
                      isLoading={isActionLoading}
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Save Updates
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Annex 1 Validated Grantees Table */}
          {document.annexType?.number === 1 && formData.students && Array.isArray(formData.students) && (
            <Annex1GranteesTable students={formData.students} documentId={document.id} />
          )}

          {/* Transmittal Summary (if transmitted) */}
          {document.transmittal && (
            <Card className="border-l-4 border-l-[#123F17] bg-[#F1F8F1]/40 print:hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[#123F17] flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Official Agency Transmittal Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#55645B]">Transmitted To:</span>{" "}
                    <strong className="text-[#1F2A24]">
                      {document.transmittal.recipient}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#55645B]">Method:</span>{" "}
                    <strong className="text-[#1F2A24] uppercase">
                      {document.transmittal.method}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#55645B]">Recorded By:</span>{" "}
                    <strong className="text-[#1F2A24]">
                      {document.transmittal.sentBy?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#55645B]">Date Sent:</span>{" "}
                    <strong className="text-[#1F2A24]">
                      {new Date(document.transmittal.sentAt).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                {document.transmittal.driveLink && (
                  <div className="pt-2 text-xs">
                    <span className="text-[#55645B] block mb-1">
                      Google Drive Link / Online Storage:
                    </span>
                    <a
                      href={document.transmittal.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#1B5E20] font-semibold hover:underline gap-1 break-all"
                    >
                      {document.transmittal.driveLink}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Discussion & Comments Feed */}
          <Card className="print:hidden">
            <CardHeader className="pb-3 border-b border-[#D6DDD8]">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#1B5E20]" />
                Audit Trail Discussion & Remarks
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* New Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <Input
                  placeholder="Post a note or inquiry regarding this document..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" variant="primary" size="md">
                  Post
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {document.comments?.length === 0 ? (
                  <p className="text-xs text-[#55645B] text-center py-4 italic">
                    No notes or discussion comments recorded yet.
                  </p>
                ) : (
                  document.comments?.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg bg-[#F6F8F6] border border-[#D6DDD8] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1F2A24] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#55645B]" />
                          {comment.author?.name}
                          <span className="text-[10px] text-[#55645B] font-normal">
                            ({comment.author?.role})
                          </span>
                        </span>
                        <span className="text-[#55645B] text-[10px]">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[#1F2A24] leading-relaxed whitespace-pre-wrap pl-5">
                        {comment.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflow Actions & Status Timeline */}
        {(!isAnnex3 || showWorkflowPanel) && (
          <div className="workflow-sidebar-panel space-y-6 animate-in fade-in duration-200 print:hidden">
            {/* Action Decision Card */}
            <Card className="border-t-4 border-t-[#1B5E20]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workflow Actions</CardTitle>
                <CardDescription>
                  Available operations based on current status and role
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preparer actions: Submit for Review */}
                {isPreparer && (document.status === "DRAFT" || document.status === "RETURNED") && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#55645B]">
                      {document.status === "RETURNED"
                        ? "The document has been revised. Resubmit to the Director for endorsement."
                        : "Ready to proceed? Submit this annex for formal review."}
                    </p>
                    <Button
                      variant="accent"
                      size="md"
                      className="w-full"
                      onClick={handleSubmitReview}
                      isLoading={isActionLoading}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {document.status === "RETURNED" ? "Resubmit for Review" : "Submit for Review"}
                    </Button>
                  </div>
                )}

                {/* Director actions: Review Queue Actions */}
                {isReviewable && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-[#FFF1C2]/60 border border-[#F2B705]">
                    <p className="text-xs font-semibold text-[#123F17]">
                      Director Review Decision
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="review-note" className="text-xs">
                        Director Remarks / Feedback (Optional on return)
                      </Label>
                      <textarea
                        id="review-note"
                        rows={2}
                        placeholder="Add formal feedback, instructions, or conditions..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full rounded-lg border border-[#D6DDD8] bg-white p-2 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={handleApprove}
                        isLoading={isActionLoading}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={handleReturn}
                        isLoading={isActionLoading}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Return
                      </Button>
                    </div>
                  </div>
                )}

                {/* Approved Document: Next Steps (Scan Upload & Transmission) */}
                {(user.role === "STAFF" || user.role === "ACCOUNTING") &&
                  (document.status === "APPROVED" || document.status === "UPLOADED") && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-[#55645B]">
                        Document is approved! Proceed to agency transmission.
                      </p>

                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={() => setShowTransmitModal(true)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Record Agency Transmittal
                      </Button>
                    </div>
                  )}

                {/* Archive Action */}
                {canArchive(user.role, document.status) && (
                  <div className="pt-2 border-t border-[#D6DDD8]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-[#55645B] hover:text-[#B3261E]"
                      onClick={handleArchive}
                      isLoading={isActionLoading}
                    >
                      <Archive className="w-3.5 h-3.5 mr-1.5" />
                      Archive this Document
                    </Button>
                  </div>
                )}

                {/* Locked Notice */}
                {document.status === "APPROVED" && !isReviewable && (
                  <div className="p-3 rounded-lg bg-[#DCEFDD] text-[#123F17] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1B5E20]" />
                    <span>Approved & locked. Edits are disabled.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline History */}
            <Card>
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1B5E20]" />
                  Status History Audit Trail
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="space-y-4">
                  {document.statusHistory?.map((item: any, idx: number) => (
                    <div key={item.id} className="relative pl-6 pb-4 last:pb-0">
                      {/* Stepper Line */}
                      {idx < document.statusHistory.length - 1 && (
                        <span className="absolute left-2.5 top-3 -bottom-3 w-0.5 bg-[#D6DDD8]" />
                      )}
                      {/* Stepper Dot */}
                      <span className="absolute left-1 top-1 w-3.5 h-3.5 rounded-full bg-[#1B5E20] ring-4 ring-white" />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={item.toStatus} size="sm" />
                          <span className="text-[10px] text-[#55645B]">
                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-xs text-[#55645B] italic bg-[#F6F8F6] p-2 rounded border border-[#D6DDD8]">
                            "{item.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Transmittal Modal Dialog with Apple Spring Animation */}
      <Modal
        isOpen={showTransmitModal}
        onClose={() => setShowTransmitModal(false)}
        title="Record Agency Transmittal"
        description={`Log the transmission of Annex ${document.annexType?.number} to the concerned external agency or university office.`}
        maxWidth="lg"
      >
        <form onSubmit={handleRecordTransmittal} className="space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="recipient" required>
              Recipient Agency / Office
            </Label>
            <Input
              id="recipient"
              placeholder="e.g. CHED Regional Office IV-B / UniFAST Secretariat"
              value={recipientAgency}
              onChange={(e) => setRecipientAgency(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="method">Transmission Method</Label>
            <select
              id="method"
              value={transmittalMethod}
              onChange={(e) => setTransmittalMethod(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
            >
              <option value="manual">Manual Submission / Courier Delivery</option>
              <option value="drive_link">Shared Google Drive Link</option>
              <option value="email">Direct Official Email</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="drive-link">Google Drive Link / Online Storage URL (Optional)</Label>
            <Input
              id="drive-link"
              placeholder="https://drive.google.com/..."
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Transmittal Notes</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Reference number, courier tracking, receiving person..."
              value={transmittalNotes}
              onChange={(e) => setTransmittalNotes(e.target.value)}
              className="w-full rounded-lg border border-[#D6DDD8] bg-white p-2.5 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-[#D6DDD8] flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTransmitModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isActionLoading}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Confirm Transmittal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Universal Print & PDF Export for Non-Suite Annexes (Annex 1, Annex 2 & Generic Documents) */}
      {!isSpecialSuite && (() => {
        const universalPrintContent = (
          <div className="space-y-6 text-[#1F2A24] font-sans">
            {/* Official MinSU Letterhead */}
            <div className="flex items-center justify-between border-b-2 border-[#1B5E20] pb-4 gap-4">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <Logo size="lg" />
              </div>
              <div className="text-center flex-1">
                <p className="text-[11px] tracking-wider uppercase font-medium text-[#55645B]">
                  Republic of the Philippines
                </p>
                <h3 className="text-base font-bold font-heading text-[#123F17]">
                  MINDORO STATE UNIVERSITY
                </h3>
                <p className="text-[11px] text-[#55645B]">
                  Victoria, Oriental Mindoro 5205 Philippines
                </p>
                <p className="text-xs font-semibold text-[#1B5E20] mt-1">
                  TULONG DUNONG PROGRAM UNDER TERTIARY EDUCATION SUBSIDY (TDP-TES)
                </p>
              </div>
              <div className="w-14 h-14 shrink-0 flex flex-col items-center justify-center font-bold text-xs bg-[#F1F8F1] text-[#123F17] rounded-lg border border-[#DCEFDD]">
                <span className="text-[9px] uppercase tracking-wider text-[#55645B]">Annex</span>
                <span className="text-base">{document.annexType?.number || 1}</span>
              </div>
            </div>

            {/* Document Title & Reference Header */}
            <div className="text-center py-2 border-b border-[#D6DDD8]">
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1F2A24]">
                {document.title}
              </h2>
              <p className="text-xs text-[#55645B] mt-0.5">
                Status: <strong className="uppercase">{document.status}</strong> • Prepared by {document.createdBy?.name} ({document.createdBy?.role}) on {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Annex 1 Specific Content: Transmittal Details + Grantees Table */}
            {document.annexType?.number === 1 ? (
              <div className="space-y-4">
                {/* Transmittal Summary */}
                {document.transmittal && (
                  <div className="p-3 bg-[#F6F8F6] border border-[#D6DDD8] rounded-lg text-xs grid grid-cols-2 gap-2">
                    <div><span className="text-[#55645B]">Recipient Agency:</span> <strong>{document.transmittal.recipient}</strong></div>
                    <div><span className="text-[#55645B]">Method:</span> <strong className="uppercase">{document.transmittal.method}</strong></div>
                    <div><span className="text-[#55645B]">Date Sent:</span> <strong>{new Date(document.transmittal.sentAt).toLocaleDateString()}</strong></div>
                    <div><span className="text-[#55645B]">Recorded By:</span> <strong>{document.transmittal.sentBy?.name || "Staff"}</strong></div>
                  </div>
                )}

                {/* Grantees Table */}
                {formData.students && Array.isArray(formData.students) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#D6DDD8]">
                      <thead className="bg-[#F1F8F1] font-bold text-[#1F2A24] border-b border-[#D6DDD8]">
                        <tr>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">Seq</th>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">Student ID</th>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">Full Name</th>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">Course / Degree</th>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">Year</th>
                          <th className="py-2 px-2.5 border-r border-[#D6DDD8]">HEI Campus</th>
                          <th className="py-2 px-2.5">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D6DDD8]">
                        {formData.students.map((st: any, idx: number) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="py-1.5 px-2.5 font-bold border-r border-[#D6DDD8]">{st.seq || idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono border-r border-[#D6DDD8]">{st.student_id}</td>
                            <td className="py-1.5 px-2.5 font-semibold border-r border-[#D6DDD8]">
                              {st.last_name}, {st.given_name} {st.ext_name || ""} {st.middle_name || ""}
                            </td>
                            <td className="py-1.5 px-2.5 border-r border-[#D6DDD8]">{st.course_degree}</td>
                            <td className="py-1.5 px-2.5 border-r border-[#D6DDD8]">Year {st.year_level}</td>
                            <td className="py-1.5 px-2.5 border-r border-[#D6DDD8]">{st.hei_campus || st.hei_name || "Bongabong"}</td>
                            <td className="py-1.5 px-2.5">{st.street_barangay}, {st.town_city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#55645B] italic py-4 text-center">
                    No student records attached to this Annex 1 transmittal.
                  </p>
                )}
              </div>
            ) : (
              /* Generic Document Fields */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((f: AnnexFormField) => (
                    <div
                      key={f.id}
                      className={f.type === "textarea" ? "col-span-2 border-b border-[#D6DDD8] pb-2" : "border-b border-[#D6DDD8] pb-2"}
                    >
                      <span className="text-[11px] font-bold uppercase text-[#55645B] block">{f.label}</span>
                      <span className="text-xs text-[#1F2A24] font-medium mt-0.5 block whitespace-pre-wrap">
                        {formData[f.id] !== undefined && formData[f.id] !== "" ? String(formData[f.id]) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Signatory Blocks */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-[11px] text-[#55645B] mb-8">Prepared and Certified by:</p>
                <div className="w-48 border-b border-[#1F2A24] mx-auto mb-1"></div>
                <p className="font-bold text-[#1F2A24] uppercase">{document.createdBy?.name || "Staff Coordinator"}</p>
                <p className="text-[11px] text-[#55645B]">{document.createdBy?.role || "Staff Coordinator"}, MinSU</p>
              </div>
              <div>
                <p className="text-[11px] text-[#55645B] mb-8">Endorsed & Approved by:</p>
                <div className="w-48 border-b border-[#1F2A24] mx-auto mb-1"></div>
                <p className="font-bold text-[#1F2A24] uppercase">CAMPUS DIRECTOR</p>
                <p className="text-[11px] text-[#55645B]">Mindoro State University</p>
              </div>
            </div>
          </div>
        );

        return (
          <>
            <PrintPreviewModal
              isOpen={isUniversalPrintOpen}
              onClose={() => setIsUniversalPrintOpen(false)}
              documentTitle={document.title}
              annexNumber={document.annexType?.number || 1}
              orientation={universalPrintOrientation}
              onOrientationChange={setUniversalPrintOrientation}
              paperSize={universalPaperSize}
              onPaperSizeChange={setUniversalPaperSize}
              excelExportUrl={
                document.annexType?.number === 1
                  ? `/api/annex-1/export-excel?documentId=${document.id}`
                  : undefined
              }
              excelExportLabel="Download Excel (.xlsx)"
              previewContent={universalPrintContent}
            />

            {/* Print-Ready Official Sheet for Non-Suite Documents (Annex 1 & Generic) */}
            <div className="hidden print:block annex-printable-document bg-white text-[#1F2A24] font-sans p-6 sm:p-10 border border-neutral-800 shadow-xl rounded-sm max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
              {universalPrintContent}
            </div>
          </>
        );
      })()}
    </div>
  );
}
