"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Eye,
  Save,
  Send,
  Printer,
  FileDown,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaperSize, PAPER_SIZE_CONFIGS } from "@/types";
import {
  AnnexPresetConfig,
  PresetElement,
  PresetTableColumn,
  PresetTableDataSource,
} from "@/types/presets";
import { MINSU_CAMPUSES, getMinsuCampusConfig } from "@/lib/campus-constants";
import {
  formatPhpCurrency,
  getDefaultSignatoriesForAnnex,
  getDefaultTableColumnsForSource,
  getDefaultTableSourceForAnnex,
  getFormDataArrayKeyForTableSource,
} from "@/lib/annex-presets";
import { renderPdfPageToCanvas } from "@/lib/preset-pdf-render";
import {
  expandPresetPageSlices,
  exportCustomPresetPdf,
  RenderedPageSlice,
} from "@/lib/preset-pdf-export";
import { PresetOverlayLayer } from "./preset-overlay-layer";
import { BatchSelectorDropdown } from "./batch-selector-dropdown";
import { StipendTierSelector } from "./stipend-tier-selector";
import { PrintPreviewModal } from "./print-preview-modal";

interface CustomPresetDocumentSuiteProps {
  mode: "create" | "view";
  annexTypeId?: string;
  annexNumber: number;
  presetId?: string;
  presetName: string;
  presetConfig: AnnexPresetConfig;
  documentId?: string;
  documentTitle?: string;
  initialFormData?: Record<string, unknown>;
  canEdit?: boolean;
  onSaved?: () => void;
}

interface PresetOfficialPageCanvasProps {
  slice: RenderedPageSlice;
  config: AnnexPresetConfig;
  formData: Record<string, unknown>;
  scaleWidthPx?: number;
}

function PresetOfficialPageCanvas({
  slice,
  config,
  formData,
  scaleWidthPx = 794,
}: PresetOfficialPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  const page = slice.templatePage;
  const aspectHeightPx = Math.round(
    (page.heightPt / Math.max(1, page.widthPt)) * scaleWidthPx
  );

  useEffect(() => {
    let cancelled = false;
    if (page.sourceType !== "pdf" || !page.fileUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let done = false;
    queueMicrotask(() => {
      if (!cancelled && !done) setRendering(true);
    });
    renderPdfPageToCanvas(
      page.fileUrl,
      page.pdfPageIndex ?? 0,
      canvas,
      scaleWidthPx
    )
      .catch((err) => {
        if (!cancelled) console.error("Official page PDF render error:", err);
      })
      .finally(() => {
        done = true;
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
      done = true;
    };
  }, [page.fileUrl, page.pdfPageIndex, page.sourceType, scaleWidthPx]);

  return (
    <div
      style={{ width: `${scaleWidthPx}px`, height: `${aspectHeightPx}px` }}
      className="relative bg-white mx-auto border border-[#D6DDD8] shadow-md print:shadow-none print:border-none print:break-after-page overflow-hidden"
    >
      {page.sourceType === "pdf" && page.fileUrl && (
        <>
          <canvas ref={canvasRef} className="w-full h-full block" />
          {rendering && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#1B5E20]" />
            </div>
          )}
        </>
      )}
      {page.sourceType === "image" && page.fileUrl && (
        <img
          src={page.fileUrl}
          alt={page.label}
          className="w-full h-full object-contain block"
        />
      )}

      <PresetOverlayLayer
        config={config}
        pageId={page.id}
        formData={formData}
        displayMode="view"
        tableRowsOverride={slice.tableSliceMap}
      />

      {slice.totalRepeatsForPage > 1 && (
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-[#55645B] bg-white/80 px-1.5 py-0.5 rounded">
          Sheet {slice.repeatIndex + 1} of {slice.totalRepeatsForPage}
        </div>
      )}
    </div>
  );
}

function buildInitialCustomFormData(
  annexNumber: number,
  config: AnnexPresetConfig,
  incoming?: Record<string, unknown>
): Record<string, unknown> {
  const settings = config.settings;
  const customDefaults: Record<string, unknown> = {};

  for (const el of config.elements) {
    const key = el.fieldKey || el.id;
    if (el.type === "checkbox") {
      customDefaults[key] = Boolean(el.checkedDefault);
    } else if (
      el.type === "textbox" ||
      el.type === "textarea" ||
      el.type === "date"
    ) {
      customDefaults[key] = el.defaultValue || "";
    }
  }

  const incomingCustom =
    (incoming?.customFields as Record<string, unknown> | undefined) || {};

  const campusCfg = getMinsuCampusConfig(settings.campus || "Main Campus - Victoria");
  const base: Record<string, unknown> = {
    billingDate: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    referenceNumber: `${settings.regionCode || "MIMAROPA"}-${settings.heiCode || "MINSU"}-${
      new Date().getFullYear()
    }-${settings.termCode || "1"}-${settings.batchNumber || "1"}:${
      settings.trancheNumber || "1"
    }`,
    academicYear: settings.academicYear || "2026-2027",
    termCode: settings.termCode || "1",
    trancheNumber: settings.trancheNumber || "1",
    batchNumber: settings.batchNumber || "1",
    campus: settings.campus || campusCfg.label,
    regionCode: settings.regionCode || "MIMAROPA",
    heiCode: settings.heiCode || "MINSU",
    heiName: settings.heiName || campusCfg.heiName,
    heiAddress: settings.heiAddress || campusCfg.heiAddress,
    stipendTier: settings.stipendTier || "7500",
    stipendPerGrantee: settings.stipendPerGrantee ?? 7500,
    managementFeeRate: settings.managementFeeRate ?? 0.005,
    headerLogos: settings.headerLogos,
    signatories:
      settings.signatories || getDefaultSignatoriesForAnnex(annexNumber),
    ...(settings.extraDefaults || {}),
    grantees: [],
    students: [],
    entries: [],
    otherGrantees: [],
    heis: [],
    injectedBatches: [],
    ...(incoming || {}),
    customFields: {
      ...customDefaults,
      ...incomingCustom,
    },
  };

  return base;
}

export function CustomPresetDocumentSuite({
  mode,
  annexTypeId,
  annexNumber,
  presetId,
  presetName,
  presetConfig,
  documentId,
  documentTitle = "",
  initialFormData,
  canEdit = true,
  onSaved,
}: CustomPresetDocumentSuiteProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">(
    mode === "create" ? "workspace" : "sheet"
  );
  const [title, setTitle] = useState<string>(
    documentTitle || `Annex ${annexNumber} — ${presetName}`
  );
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    buildInitialCustomFormData(annexNumber, presetConfig, initialFormData)
  );
  const [selectedBatches, setSelectedBatches] = useState<number[]>([1]);
  const [injecting, setInjecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [rosterPageMap, setRosterPageMap] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>(
    presetConfig.settings.paperSize || "a4"
  );
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    presetConfig.settings.orientation || "portrait"
  );

  // Derived Totals Calculator
  const granteesList = Array.isArray(formData.grantees)
    ? (formData.grantees as Record<string, unknown>[])
    : Array.isArray(formData.students)
    ? (formData.students as Record<string, unknown>[])
    : [];

  const stipendPerGrantee = Number(formData.stipendPerGrantee ?? 7500);
  const feeRate = Number(formData.managementFeeRate ?? 0.005);
  const totalGrantees = granteesList.length;
  const totalSubsidy = totalGrantees * stipendPerGrantee;
  const managementFeeAmount = Number((totalSubsidy * feeRate).toFixed(2));
  const grandTotalBilling = Number((totalSubsidy + managementFeeAmount).toFixed(2));

  const computedFormData = useMemo<Record<string, unknown>>(
    () => ({
      ...formData,
      totalGrantees,
      total_grantees: totalGrantees,
      totalSubsidy,
      managementFeeAmount,
      grandTotalBilling,
    }),
    [formData, totalGrantees, totalSubsidy, managementFeeAmount, grandTotalBilling]
  );

  const pageSlices = useMemo(
    () => expandPresetPageSlices(presetConfig, computedFormData),
    [presetConfig, computedFormData]
  );

  const updateCustomField = useCallback((fieldKey: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...((prev.customFields as Record<string, unknown>) || {}),
        [fieldKey]: value,
      },
    }));
  }, []);

  const handleInjectBatches = async (batchesToInject: number[]) => {
    if (batchesToInject.length === 0) return;
    setInjecting(true);
    setFeedback(null);
    try {
      const endpoint = annexNumber === 3 ? "/api/annex-3/compile" : "/api/annex-4/compile";
      const res = await fetch(
        `${endpoint}?batches=${encodeURIComponent(batchesToInject.join(","))}&campus=${encodeURIComponent(
          String(formData.campus || "ALL")
        )}`
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to fetch batch grantees." });
        return;
      }

      const candidates = (data.candidates || []) as Record<string, unknown>[];
      if (candidates.length === 0) {
        setFeedback({
          type: "error",
          text: `No validated accepted grantees found in Batch ${batchesToInject.join(", ")}.`,
        });
        return;
      }

      setFormData((prev) => {
        const existingGrantees = Array.isArray(prev.grantees)
          ? (prev.grantees as Record<string, unknown>[])
          : [];
        const existingNums = new Set(
          existingGrantees.map((g) => String(g.studentNumber || g.student_id || ""))
        );

        const freshGrantees: Record<string, unknown>[] = candidates
          .filter((c) => !existingNums.has(String(c.studentNumber || "")))
          .map<Record<string, unknown>>((c, idx) => ({
            ...c,
            controlNumber: String(existingGrantees.length + idx + 1).padStart(5, "0"),
            totalAmount: stipendPerGrantee,
            tdpAmount: stipendPerGrantee,
            semesterAmount: stipendPerGrantee,
          }));

        const combinedGrantees = [...existingGrantees, ...freshGrantees];
        const combinedStudents = combinedGrantees.map((g, idx) => ({
          seq: idx + 1,
          student_id: g.studentNumber || "",
          last_name: g.lastName || "",
          given_name: g.givenName || "",
          course_degree: g.degreeProgram || "",
          year_level: g.yearLevel || "1",
          hei_campus: g.campus || prev.campus || "",
        }));

        const prevInjected = Array.isArray(prev.injectedBatches)
          ? (prev.injectedBatches as number[])
          : [];
        const nextBatches = Array.from(new Set([...prevInjected, ...batchesToInject])).sort(
          (a, b) => a - b
        );

        return {
          ...prev,
          batchNumber: nextBatches.join(", "),
          injectedBatches: nextBatches,
          grantees: combinedGrantees,
          students: combinedStudents,
        };
      });

      setFeedback({
        type: "success",
        text: `Injected ${candidates.length} validated grantees from Batch ${batchesToInject.join(", ")}.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Network error injecting batch candidates." });
    } finally {
      setInjecting(false);
    }
  };

  const handleSaveDocument = async (submitDirectly: boolean) => {
    if (!canEdit) return;

    // Validate required custom fields
    const customFields = (formData.customFields as Record<string, unknown>) || {};
    const missingRequired = presetConfig.elements.filter((el) => {
      if (!el.required) return false;
      if (el.type !== "textbox" && el.type !== "textarea" && el.type !== "date") return false;
      const val = String(customFields[el.fieldKey || el.id] ?? "").trim();
      return !val;
    });

    if (submitDirectly && missingRequired.length > 0) {
      setFeedback({
        type: "error",
        text: `Please fill required field(s): ${missingRequired.map((m) => m.label).join(", ")}`,
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payloadToSave = {
        ...computedFormData,
        paperSize,
        orientation,
      };

      if (mode === "create") {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annexTypeId,
            presetId,
            title: title.trim() || `Annex ${annexNumber} — ${presetName}`,
            formData: payloadToSave,
            submitDirectly,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ type: "error", text: data.error || "Failed to save document." });
          return;
        }
        router.push(`/documents/${data.document.id}`);
        return;
      }

      if (documentId) {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || documentTitle,
            formData: payloadToSave,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ type: "error", text: data.error || "Failed to update document." });
          return;
        }
        setFeedback({ type: "success", text: "Document changes saved cleanly." });
        if (onSaved) onSaved();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while saving document." });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadFlattenedPdf = async () => {
    setExportingPdf(true);
    setFeedback(null);
    try {
      const pdfBytes = await exportCustomPresetPdf(
        presetConfig,
        computedFormData,
        async (url) => {
          const resp = await fetch(url, { credentials: "same-origin" });
          if (!resp.ok) throw new Error(`Asset fetch failed: ${url}`);
          return new Uint8Array(await resp.arrayBuffer());
        }
      );

      const safeBytes = new Uint8Array(pdfBytes);
      const blob = new Blob([safeBytes.buffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(title || `Annex-${annexNumber}`).replace(/[^a-z0-9-_]+/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Flattened PDF export error:", err);
      setFeedback({
        type: "error",
        text: "Failed to generate flattened PDF export.",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  // Group interactive input elements per template page
  const interactiveElementsByPage = useMemo(() => {
    return presetConfig.pages.map((page) => ({
      page,
      elements: presetConfig.elements.filter(
        (el) =>
          el.pageId === page.id &&
          (el.type === "textbox" ||
            el.type === "textarea" ||
            el.type === "date" ||
            el.type === "checkbox")
      ),
    }));
  }, [presetConfig]);

  const customFieldsObj = (formData.customFields as Record<string, unknown>) || {};
  const injectedBatchNumbers = Array.isArray(formData.injectedBatches)
    ? (formData.injectedBatches as number[])
    : [];

  const workspaceTableGroups = useMemo(() => {
    const groups = new Map<
      PresetTableDataSource,
      { dataSource: PresetTableDataSource; label: string; columns: PresetTableColumn[] }
    >();

    for (const el of presetConfig.elements) {
      if (el.type !== "data_table" || !el.tableConfig) continue;
      const src = el.tableConfig.dataSource;
      const existing = groups.get(src);
      if (!existing) {
        groups.set(src, {
          dataSource: src,
          label: el.label || "Dynamic Data Table",
          columns: [...el.tableConfig.columns],
        });
      } else {
        const seenKeys = new Set(existing.columns.map((c) => c.key));
        for (const col of el.tableConfig.columns) {
          if (!seenKeys.has(col.key)) {
            seenKeys.add(col.key);
            existing.columns.push(col);
          }
        }
      }
    }

    if (groups.size === 0 && presetConfig.modules.granteeTable) {
      const fallbackSrc = getDefaultTableSourceForAnnex(annexNumber);
      groups.set(fallbackSrc, {
        dataSource: fallbackSrc,
        label: "Loaded Roster Rows",
        columns: getDefaultTableColumnsForSource(fallbackSrc),
      });
    }

    return Array.from(groups.values());
  }, [annexNumber, presetConfig.elements, presetConfig.modules.granteeTable]);

  return (
    <div className="space-y-4">
      {/* Top Dual-Mode Control Bar */}
      <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 flex flex-wrap items-center justify-between gap-3 apple-shadow print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF1C2] text-[#B88A00]">
                {presetName}
              </span>
              <span className="text-[11px] text-[#55645B] font-mono">
                {presetConfig.pages.length}p • {pageSlices.length} output sheet(s)
              </span>
            </div>
            {mode === "create" ? (
              <input
                type="text"
                aria-label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Annex ${annexNumber} Document Title`}
                className="mt-1 text-sm sm:text-base font-heading font-bold text-[#1F2A24] bg-[#F6F8F6] px-2.5 py-1 rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none w-full sm:w-80"
              />
            ) : (
              <p className="text-sm font-bold text-[#1F2A24] truncate mt-0.5">
                {title}
              </p>
            )}
          </div>
        </div>

        {/* Dual-Mode Pill + Save / Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] p-1">
            <button
              type="button"
              onClick={() => setViewMode("workspace")}
              className={`apple-press px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === "workspace"
                  ? "bg-[#1B5E20] text-white shadow-2xs"
                  : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Interactive Workspace
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sheet")}
              className={`apple-press px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === "sheet"
                  ? "bg-[#1B5E20] text-white shadow-2xs"
                  : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Official Document
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPrintModalOpen(true)}
            className="text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportingPdf}
            onClick={handleDownloadFlattenedPdf}
            className="text-xs h-9 border-[#1B5E20]/40 text-[#1B5E20] hover:bg-[#F1F8F1]"
          >
            {exportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
            )}
            Download PDF
          </Button>

          {canEdit && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => handleSaveDocument(false)}
                className="text-xs h-9"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {mode === "create" ? "Save Draft" : "Save Changes"}
              </Button>
              {mode === "create" && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleSaveDocument(true)}
                  className="text-xs h-9 bg-[#1B5E20] hover:bg-[#25702A]"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit for Review
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 print:hidden ${
            feedback.type === "success"
              ? "bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ================= MODE 1: INTERACTIVE WORKSPACE ================= */}
      {viewMode === "workspace" && (
        <div className="space-y-4 print:hidden">
          {/* Enabled Built-In Module: Batch Injection + Stipend KPI Bar */}
          {(presetConfig.modules.batchInjection || presetConfig.modules.stipendCalculator) && (
            <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-4 apple-shadow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {presetConfig.modules.batchInjection && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#123F17] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#1B5E20]" />
                      Batch Injection
                    </span>
                    <BatchSelectorDropdown
                      selectedBatches={selectedBatches}
                      onBatchesChange={setSelectedBatches}
                      alreadyInjectedBatches={injectedBatchNumbers}
                      allowDirectAction
                      onInject={handleInjectBatches}
                      disabled={!canEdit || injecting}
                    />
                    {injecting && <Loader2 className="w-4 h-4 animate-spin text-[#1B5E20]" />}
                  </div>
                )}

                {presetConfig.modules.stipendCalculator && (
                  <StipendTierSelector
                    selectedTier={
                      (formData.stipendTier as "7500" | "10000" | "custom") || "7500"
                    }
                    currentAmount={stipendPerGrantee}
                    customInputValue={String(stipendPerGrantee)}
                    onTierChange={(tier, amount) => {
                      setFormData((prev) => ({
                        ...prev,
                        stipendTier: tier,
                        stipendPerGrantee: amount,
                        grantees: Array.isArray(prev.grantees)
                          ? (prev.grantees as Record<string, unknown>[]).map((g) => ({
                              ...g,
                              totalAmount: amount,
                              tdpAmount: amount,
                              semesterAmount: amount,
                            }))
                          : [],
                      }));
                    }}
                    onCustomInputChange={(_raw, num) => {
                      setFormData((prev) => ({
                        ...prev,
                        stipendTier: "custom",
                        stipendPerGrantee: num,
                      }));
                    }}
                  />
                )}
              </div>

              {/* Financial KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#D6DDD8]">
                <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]/70">
                  <span className="text-[10px] font-bold uppercase text-[#55645B]">
                    Total Grantees
                  </span>
                  <p className="text-lg font-bold font-mono text-[#1F2A24] tabular-nums">
                    {totalGrantees.toLocaleString("en-US")}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]/70">
                  <span className="text-[10px] font-bold uppercase text-[#55645B]">
                    Total TDP Subsidy
                  </span>
                  <p className="text-lg font-bold font-mono text-[#1B5E20] text-right tabular-nums">
                    {formatPhpCurrency(totalSubsidy)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]/70">
                  <span className="text-[10px] font-bold uppercase text-[#55645B]">
                    Admin Fee ({(feeRate * 100).toFixed(1)}%)
                  </span>
                  <p className="text-lg font-bold font-mono text-[#B88A00] text-right tabular-nums">
                    {formatPhpCurrency(managementFeeAmount)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#DCEFDD] border border-[#1B5E20]/20">
                  <span className="text-[10px] font-bold uppercase text-[#123F17]">
                    Grand Total Billing
                  </span>
                  <p className="text-lg font-bold font-mono text-[#123F17] text-right tabular-nums">
                    {formatPhpCurrency(grandTotalBilling)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enabled Built-In Module: Campus & HEI Parameters */}
          {presetConfig.modules.campusParameters && (
            <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-3 apple-shadow">
              <h3 className="text-sm font-heading font-bold text-[#1F2A24]">
                Campus, HEI & Academic Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cw-campus" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    MinSU Campus
                  </label>
                  <select
                    id="cw-campus"
                    disabled={!canEdit}
                    value={String(formData.campus || "")}
                    onChange={(e) => {
                      const cfg = getMinsuCampusConfig(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        campus: cfg.label,
                        heiName: cfg.heiName,
                        heiAddress: cfg.heiAddress,
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  >
                    {MINSU_CAMPUSES.map((c) => (
                      <option key={c.key} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cw-ay" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Academic Year
                  </label>
                  <input
                    id="cw-ay"
                    type="text"
                    disabled={!canEdit}
                    value={String(formData.academicYear || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, academicYear: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cw-ref" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Reference Number
                  </label>
                  <input
                    id="cw-ref"
                    type="text"
                    disabled={!canEdit}
                    value={String(formData.referenceNumber || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, referenceNumber: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Enabled Built-In Module: Cover Fields */}
          {presetConfig.modules.coverFields && (
            <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-3 apple-shadow">
              <h3 className="text-sm font-heading font-bold text-[#1F2A24]">
                Annex 1 Endorsement & Cover Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cw-agency" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Target Agency
                  </label>
                  <input
                    id="cw-agency"
                    type="text"
                    disabled={!canEdit}
                    value={String(formData.target_agency || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, target_agency: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cw-transmittal" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Transmittal Number
                  </label>
                  <input
                    id="cw-transmittal"
                    type="text"
                    disabled={!canEdit}
                    value={String(formData.transmittal_number || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, transmittal_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="cw-remarks" className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Remarks
                  </label>
                  <textarea
                    id="cw-remarks"
                    rows={2}
                    disabled={!canEdit}
                    value={String(formData.remarks || "")}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auto-Generated Custom Preset Form Fields per Page */}
          <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-4 apple-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-[#1F2A24] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B88A00]" />
                  Preset Custom PDF Fields
                </h3>
                <p className="text-xs text-[#55645B]">
                  Values entered here map directly onto the uploaded template positions and print into the final PDF.
                </p>
              </div>
            </div>

            {interactiveElementsByPage.every((g) => g.elements.length === 0) ? (
              <div className="p-6 rounded-xl bg-[#F6F8F6] border border-dashed border-[#D6DDD8] text-center text-xs text-[#55645B]">
                No custom textboxes, dates, or checkboxes are placed on this preset yet. Bound variables and dynamic tables still populate automatically on Official Document view!
              </div>
            ) : (
              <div className="space-y-5">
                {interactiveElementsByPage
                  .filter((group) => group.elements.length > 0)
                  .map(({ page, elements }) => (
                    <div key={page.id} className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#1B5E20] border-b border-[#D6DDD8] pb-1">
                        Page {page.pageNumber}: {page.label}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {elements.map((el: PresetElement) => {
                          const key = el.fieldKey || el.id;
                          const val = customFieldsObj[key] ?? el.defaultValue ?? "";

                          if (el.type === "checkbox") {
                            return (
                              <label
                                key={el.id}
                                className="flex items-center gap-2.5 p-3 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/70 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  disabled={!canEdit}
                                  checked={Boolean(val)}
                                  onChange={(e) => updateCustomField(key, e.target.checked)}
                                  className="h-4 w-4 accent-[#1B5E20]"
                                />
                                <span className="text-xs font-semibold text-[#1F2A24]">
                                  {el.label}
                                </span>
                              </label>
                            );
                          }

                          if (el.type === "textarea") {
                            return (
                              <div key={el.id} className="sm:col-span-2">
                                <label
                                  htmlFor={`cf-${key}`}
                                  className="block text-xs font-semibold text-[#1F2A24] mb-1"
                                >
                                  {el.label}
                                  {el.required && <span className="text-red-600 ml-0.5">*</span>}
                                </label>
                                <textarea
                                  id={`cf-${key}`}
                                  rows={3}
                                  disabled={!canEdit}
                                  value={String(val)}
                                  placeholder={el.placeholder || ""}
                                  onChange={(e) => updateCustomField(key, e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={el.id}>
                              <label
                                htmlFor={`cf-${key}`}
                                className="block text-xs font-semibold text-[#1F2A24] mb-1"
                              >
                                {el.label}
                                {el.required && <span className="text-red-600 ml-0.5">*</span>}
                              </label>
                              <input
                                id={`cf-${key}`}
                                type={el.type === "date" ? "date" : "text"}
                                disabled={!canEdit}
                                value={String(val)}
                                placeholder={el.placeholder || ""}
                                onChange={(e) => updateCustomField(key, e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Enabled Built-In Module: Signatory Matrix */}
          {presetConfig.modules.signatories && Boolean(formData.signatories) && (
            <div className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-3 apple-shadow">
              <h3 className="text-sm font-heading font-bold text-[#1F2A24]">
                Signatory Matrix (Pre-filled from Preset)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(
                  formData.signatories as Record<
                    string,
                    { name: string; position: string; office?: string }
                  >
                ).map(([sigKey, sig]) => (
                  <div
                    key={sigKey}
                    className="p-3 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 space-y-2"
                  >
                    <p className="text-[11px] font-bold uppercase text-[#1B5E20]">
                      {sigKey.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <div>
                      <label htmlFor={`cw-sig-n-${sigKey}`} className="block text-[10px] text-[#55645B]">
                        Full Name
                      </label>
                      <input
                        id={`cw-sig-n-${sigKey}`}
                        type="text"
                        disabled={!canEdit}
                        value={sig.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...(prev.signatories as Record<string, unknown>),
                              [sigKey]: { ...sig, name: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label htmlFor={`cw-sig-p-${sigKey}`} className="block text-[10px] text-[#55645B]">
                        Position / Designation
                      </label>
                      <input
                        id={`cw-sig-p-${sigKey}`}
                        type="text"
                        disabled={!canEdit}
                        value={sig.position}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signatories: {
                              ...(prev.signatories as Record<string, unknown>),
                              [sigKey]: { ...sig, position: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enabled Built-In / Dynamic Data Table Workspace Editors */}
          {(presetConfig.modules.granteeTable || workspaceTableGroups.length > 0) &&
            workspaceTableGroups.map((tableGroup) => {
              const arrayKey = getFormDataArrayKeyForTableSource(tableGroup.dataSource);
              const rows = Array.isArray(formData[arrayKey])
                ? (formData[arrayKey] as Record<string, unknown>[])
                : [];
              const PAGE_SIZE = 50;
              const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
              const currentPage = Math.min(
                totalPages - 1,
                Math.max(0, rosterPageMap[arrayKey] || 0)
              );
              const sliceStart = currentPage * PAGE_SIZE;
              const visibleRows = rows.slice(sliceStart, sliceStart + PAGE_SIZE);

              const updateRows = (nextRows: Record<string, unknown>[]) => {
                setFormData((prev) => ({
                  ...prev,
                  [arrayKey]: nextRows,
                }));
              };

              return (
                <div
                  key={tableGroup.dataSource}
                  className="bg-white rounded-2xl border border-[#D6DDD8] p-4 sm:p-5 space-y-3 apple-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-heading font-bold text-[#1F2A24]">
                        {tableGroup.label} ({rows.length} rows)
                      </h3>
                      <p className="text-xs text-[#55645B]">
                        Edit any cell across configured table columns; feeds Official Document view & PDF export directly.
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextIdx = rows.length + 1;
                          const blankRow: Record<string, unknown> = {};
                          for (const col of tableGroup.columns) {
                            if (col.key === "controlNumber") {
                              blankRow[col.key] = String(nextIdx).padStart(5, "0");
                            } else if (col.key === "seq") {
                              blankRow[col.key] = nextIdx;
                            } else if (
                              col.key === "totalAmount" ||
                              col.key === "semesterAmount" ||
                              col.key === "tdpAmount" ||
                              col.key === "amount"
                            ) {
                              blankRow[col.key] = stipendPerGrantee;
                            } else {
                              blankRow[col.key] = "";
                            }
                          }
                          const nextRows = [...rows, blankRow];
                          updateRows(nextRows);
                          setRosterPageMap((prev) => ({
                            ...prev,
                            [arrayKey]: Math.max(0, Math.ceil(nextRows.length / PAGE_SIZE) - 1),
                          }));
                        }}
                        className="text-xs h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Row
                      </Button>
                    )}
                  </div>

                  {rows.length === 0 ? (
                    <p className="text-xs text-[#55645B] italic py-4 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#D6DDD8]">
                      No rows yet. Inject a batch above or click Add Row.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto max-h-96 border border-[#D6DDD8] rounded-xl apple-scrollbar">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-[#F1F8F1] text-[#123F17] sticky top-0 z-10">
                            <tr>
                              <th className="p-2 border-b border-[#D6DDD8] w-10 text-center font-mono text-[10px]">
                                #
                              </th>
                              {tableGroup.columns.map((col, cIdx) => (
                                <th
                                  key={`${col.key}-${cIdx}`}
                                  style={{ textAlign: col.align || "left" }}
                                  className="p-2 border-b border-[#D6DDD8] whitespace-nowrap font-bold"
                                >
                                  {col.label}
                                </th>
                              ))}
                              {canEdit && <th className="p-2 border-b border-[#D6DDD8] w-10" />}
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRows.map((row, localIdx) => {
                              const absIdx = sliceStart + localIdx;
                              return (
                                <tr
                                  key={absIdx}
                                  className="border-b border-[#D6DDD8]/60 hover:bg-[#F6F8F6]"
                                >
                                  <td className="p-1.5 text-center font-mono text-[10px] text-[#55645B]">
                                    {absIdx + 1}
                                  </td>
                                  {tableGroup.columns.map((col, cIdx) => {
                                    const rawVal = row[col.key];
                                    const isNumeric =
                                      col.format === "currency" || col.format === "number";
                                    const inputType =
                                      col.format === "date"
                                        ? "date"
                                        : isNumeric
                                        ? "number"
                                        : "text";

                                    return (
                                      <td key={`${col.key}-${cIdx}`} className="p-1 min-w-[96px]">
                                        <input
                                          type={inputType}
                                          step={col.format === "currency" ? "0.01" : "1"}
                                          disabled={!canEdit}
                                          value={
                                            rawVal === undefined || rawVal === null
                                              ? ""
                                              : String(rawVal)
                                          }
                                          aria-label={`Row ${absIdx + 1} ${col.label}`}
                                          onChange={(e) => {
                                            const valStr = e.target.value;
                                            const parsed: unknown = isNumeric
                                              ? valStr === ""
                                                ? ""
                                                : Number(valStr)
                                              : valStr;
                                            const nextRows = rows.map((r, rIdx) =>
                                              rIdx === absIdx ? { ...r, [col.key]: parsed } : r
                                            );
                                            updateRows(nextRows);
                                          }}
                                          style={{ textAlign: col.align || "left" }}
                                          className={`w-full px-2 py-1 text-xs rounded-md border border-transparent hover:border-[#D6DDD8] focus:border-[#1B5E20] focus:bg-white bg-transparent outline-none transition-colors ${
                                            isNumeric ? "font-mono tabular-nums" : ""
                                          }`}
                                        />
                                      </td>
                                    );
                                  })}
                                  {canEdit && (
                                    <td className="p-1 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateRows(rows.filter((_, rIdx) => rIdx !== absIdx))
                                        }
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Remove Row"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between text-[11px] text-[#55645B] px-1">
                          <span>
                            Showing rows {sliceStart + 1}–{Math.min(rows.length, sliceStart + PAGE_SIZE)} of{" "}
                            {rows.length} (all rows paginate automatically into Official Document & PDF)
                          </span>
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 0}
                              onClick={() =>
                                setRosterPageMap((prev) => ({
                                  ...prev,
                                  [arrayKey]: Math.max(0, currentPage - 1),
                                }))
                              }
                              className="h-7 px-2 text-[11px]"
                            >
                              Prev
                            </Button>
                            <span className="font-mono font-semibold text-[#123F17]">
                              {currentPage + 1} / {totalPages}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={currentPage >= totalPages - 1}
                              onClick={() =>
                                setRosterPageMap((prev) => ({
                                  ...prev,
                                  [arrayKey]: Math.min(totalPages - 1, currentPage + 1),
                                }))
                              }
                              className="h-7 px-2 text-[11px]"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ================= MODE 2: OFFICIAL DOCUMENT (PRINT & MULTI-PAGE) ================= */}
      <div className={viewMode === "sheet" ? "space-y-6" : "hidden print:block"}>
        {pageSlices.map((slice, idx) => (
          <PresetOfficialPageCanvas
            key={`${slice.templatePage.id}-${slice.repeatIndex}-${idx}`}
            slice={slice}
            config={presetConfig}
            formData={computedFormData}
          />
        ))}
      </div>

      {/* Print Preview Integration */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentTitle={title || `Annex ${annexNumber}`}
        annexNumber={annexNumber}
        orientation={orientation}
        onOrientationChange={setOrientation}
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        previewContent={
          <div className="space-y-6">
            {pageSlices.map((slice, idx) => {
              const cfg = PAPER_SIZE_CONFIGS[paperSize] || PAPER_SIZE_CONFIGS.a4;
              const widthPx = orientation === "landscape" ? Math.round(cfg.heightIn * 96) : Math.round(cfg.widthIn * 96);
              return (
                <PresetOfficialPageCanvas
                  key={`pp-${slice.templatePage.id}-${slice.repeatIndex}-${idx}`}
                  slice={slice}
                  config={presetConfig}
                  formData={computedFormData}
                  scaleWidthPx={Math.min(920, widthPx)}
                />
              );
            })}
          </div>
        }
      />
    </div>
  );
}

