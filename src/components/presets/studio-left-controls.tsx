"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  FileUp,
  Layers,
  Sliders,
  Crosshair,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  AnnexPresetConfig,
  PresetElement,
  PresetModulesConfig,
  PresetPage,
  PresetRetainedSettings,
  PresetSignatoryDefault,
  PresetTableColumn,
  PresetTableDataSource,
} from "@/types/presets";
import { PAPER_SIZE_CONFIGS, PaperSize } from "@/types";
import { MINSU_CAMPUSES, getMinsuCampusConfig } from "@/lib/campus-constants";
import {
  getAvailableBindingVariables,
  getAvailableTableColumnFields,
  getDefaultTableColumnsForSource,
  getPaperPoints,
  normalizeTableColumnWidths,
} from "@/lib/annex-presets";
import { StipendTierSelector } from "@/components/documents/stipend-tier-selector";
import { AnnexLogo } from "@/components/documents/annex-logo";

export type LeftStudioTab = "template" | "defaults" | "inspector";

interface StudioLeftControlsProps {
  annexNumber: number;
  config: AnnexPresetConfig;
  activePageId: string;
  selectedElementId: string | null;
  activeTab: LeftStudioTab;
  isPresetDefault?: boolean;
  uploadingTemplate?: boolean;
  uploadError?: string | null;
  uploadNotice?: string | null;
  onUploadTemplateFile: (file: File, mode: "replace" | "append") => Promise<boolean>;
  onTabChange: (tab: LeftStudioTab) => void;
  onSelectPage: (pageId: string) => void;
  onSelectElement: (elementId: string | null) => void;
  onChangeConfig: (updater: (prev: AnnexPresetConfig) => AnnexPresetConfig) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
}

const TABLE_SOURCES: { value: PresetTableDataSource; label: string }[] = [
  { value: "grantees", label: "Billed Grantees Roster (Annexes 3/4/9/10)" },
  { value: "annex1Students", label: "Validated Students Masterlist (Annex 1)" },
  { value: "otherGrantees", label: "Other Grantees / Status Roster (Annex 3)" },
  { value: "heis", label: "HEI Grantee Summary List (Annex 5)" },
  { value: "adaEntries", label: "ADA Entries List (Annex 7)" },
  { value: "checkEntries", label: "Checks Issued Entries (Annex 8)" },
];

const MODULE_META: {
  key: keyof PresetModulesConfig;
  label: string;
  description: string;
}[] = [
  {
    key: "batchInjection",
    label: "Batch Grantee Injection",
    description: "One-click inject validated student batches into workspace & tables.",
  },
  {
    key: "stipendCalculator",
    label: "Stipend & Admin Fee Calculator",
    description: "₱7,500 / ₱10,000 / Custom stipend tier & 0.5% management fee math.",
  },
  {
    key: "campusParameters",
    label: "Campus & HEI Parameters",
    description: "Campus dropdown, HEI code, region, academic year, term, and tranche.",
  },
  {
    key: "signatories",
    label: "Signatory Matrix",
    description: "Editable signatory names & titles pre-filled from preset defaults.",
  },
  {
    key: "granteeTable",
    label: "Grantee / Entry Data Roster",
    description: "Interactive spreadsheet/roster editor feeding dynamic tables.",
  },
  {
    key: "coverFields",
    label: "Annex 1 Cover & Endorsement",
    description: "Concerned agency, transmittal ref, submission date, and remarks.",
  },
];

const COLOR_SWATCHES = ["#1F2A24", "#1B5E20", "#123F17", "#B88A00", "#55645B", "#991B1B"];

export function StudioLeftControls({
  annexNumber,
  config,
  activePageId,
  selectedElementId,
  activeTab,
  isPresetDefault = false,
  uploadingTemplate = false,
  uploadError = null,
  uploadNotice = null,
  onUploadTemplateFile,
  onTabChange,
  onSelectPage,
  onSelectElement,
  onChangeConfig,
  onDeleteElement,
  onDuplicateElement,
}: StudioLeftControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("replace");
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);

  const selectedElement = useMemo(
    () => config.elements.find((el) => el.id === selectedElementId) || null,
    [config.elements, selectedElementId]
  );

  const activePageElements = useMemo(
    () => config.elements.filter((el) => el.pageId === activePageId),
    [config.elements, activePageId]
  );

  const availableVars = useMemo(
    () => getAvailableBindingVariables(annexNumber, config.modules),
    [annexNumber, config.modules]
  );

  const updateSettings = (patch: Partial<PresetRetainedSettings>) => {
    onChangeConfig((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
      },
    }));
  };

  const updateExtraDefault = (key: string, value: unknown) => {
    onChangeConfig((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        extraDefaults: {
          ...(prev.settings.extraDefaults || {}),
          [key]: value,
        },
      },
    }));
  };

  const updateElement = (elementId: string, updater: (el: PresetElement) => PresetElement) => {
    onChangeConfig((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === elementId ? updater(el) : el)),
    }));
  };

  const updateTableColumns = (
    elementId: string,
    updater: (cols: PresetTableColumn[]) => PresetTableColumn[]
  ) => {
    updateElement(elementId, (el) => {
      if (!el.tableConfig) return el;
      return {
        ...el,
        tableConfig: {
          ...el.tableConfig,
          columns: updater(el.tableConfig.columns),
        },
      };
    });
  };

  const handleFileChosen = async (file: File) => {
    const mode = config.kind === "CUSTOM_UPLOAD" ? uploadMode : "replace";
    await onUploadTemplateFile(file, mode);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddBlankPage = () => {
    const pts = getPaperPoints(
      config.settings.paperSize || "a4",
      config.settings.orientation || "portrait"
    );
    const nextNum = config.pages.length + 1;
    const newPage: PresetPage = {
      id: `custom-blank-${Date.now()}`,
      pageNumber: nextNum,
      label: `Blank Page ${nextNum}`,
      sourceType: "image",
      widthPt: pts.widthPt,
      heightPt: pts.heightPt,
      orientation: config.settings.orientation || "portrait",
    };

    onChangeConfig((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));
    onSelectPage(newPage.id);
  };

  const handleMovePage = (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= config.pages.length) return;
    onChangeConfig((prev) => {
      const copy = [...prev.pages];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, item);
      return {
        ...prev,
        pages: copy.map((p, idx) => ({ ...p, pageNumber: idx + 1 })),
      };
    });
  };

  const handleDeletePage = (pageId: string) => {
    if (config.pages.length <= 1) return;
    const remaining = config.pages.filter((p) => p.id !== pageId);
    const nextPageId = remaining[0].id;
    onChangeConfig((prev) => ({
      ...prev,
      pages: prev.pages
        .filter((p) => p.id !== pageId)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 })),
      elements: prev.elements.filter((el) => el.pageId !== pageId),
    }));
    if (activePageId === pageId) {
      onSelectPage(nextPageId);
    }
  };

  const handleCampusSelect = (campusKey: string) => {
    const cfg = getMinsuCampusConfig(campusKey);
    updateSettings({
      campus: cfg.label,
      heiName: cfg.heiName,
      heiAddress: cfg.heiAddress,
    });
  };

  const handleSignatoryChange = (
    sigKey: string,
    field: keyof PresetSignatoryDefault,
    val: string
  ) => {
    const current = config.settings.signatories || {};
    const existing = current[sigKey] || { name: "", position: "" };
    updateSettings({
      signatories: {
        ...current,
        [sigKey]: {
          ...existing,
          [field]: val,
        },
      },
    });
  };

  const extraConditions = Array.isArray(config.settings.extraDefaults?.conditions)
    ? (config.settings.extraDefaults?.conditions as string[])
    : [];

  return (
    <aside className="bg-white rounded-2xl border border-[#D6DDD8] apple-shadow flex flex-col overflow-hidden h-full max-h-[calc(100vh-170px)]">
      {/* Apple Segmented Sub-Tab Strip */}
      <div className="p-2.5 border-b border-[#D6DDD8] bg-[#F6F8F6] shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white border border-[#D6DDD8]/80">
          <button
            type="button"
            onClick={() => onTabChange("template")}
            className={`apple-press px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === "template"
                ? "bg-[#1B5E20] text-white shadow-xs"
                : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pages</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("defaults")}
            className={`apple-press px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === "defaults"
                ? "bg-[#1B5E20] text-white shadow-xs"
                : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("inspector")}
            className={`apple-press px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
              activeTab === "inspector"
                ? "bg-[#1B5E20] text-white shadow-xs"
                : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Inspector</span>
            {selectedElement && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705] shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Inspector / Controls Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 apple-scrollbar">
        {/* ================= TAB 1: TEMPLATE & PAGES ================= */}
        {activeTab === "template" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("Files")) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  if (!isDropZoneActive) setIsDropZoneActive(true);
                }
              }}
              onDragLeave={() => setIsDropZoneActive(false)}
              onDrop={(e) => {
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  e.preventDefault();
                  setIsDropZoneActive(false);
                  void handleFileChosen(e.dataTransfer.files[0]);
                }
              }}
              className={`space-y-2.5 p-3 rounded-xl border border-dashed transition-colors ${
                isDropZoneActive
                  ? "border-[#1B5E20] bg-[#DCEFDD]/60"
                  : "border-[#1B5E20]/50 bg-[#F1F8F1]/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#123F17] flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
                  {config.kind === "CUSTOM_UPLOAD"
                    ? "Upload PDF / Image Base"
                    : isPresetDefault
                    ? "Upload PDF / Image (New Preset)"
                    : "Upload PDF / Image Template"}
                </p>
                {config.kind === "CUSTOM_UPLOAD" && (
                  <div className="inline-flex rounded-lg border border-[#D6DDD8] bg-white p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setUploadMode("replace")}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        uploadMode === "replace"
                          ? "bg-[#1B5E20] text-white"
                          : "text-[#55645B] hover:text-[#1F2A24]"
                      }`}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("append")}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        uploadMode === "append"
                          ? "bg-[#1B5E20] text-white"
                          : "text-[#55645B] hover:text-[#1F2A24]"
                      }`}
                    >
                      Append
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFileChosen(f);
                }}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingTemplate}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-[#1B5E20]/30 bg-white hover:bg-[#DCEFDD]/40 text-xs font-semibold text-[#1B5E20] flex items-center justify-center gap-2 transition-colors apple-press disabled:opacity-60"
              >
                {uploadingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading & Extracting...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    Choose or Drop PDF / Image
                  </>
                )}
              </button>
              <p className="text-[10px] text-[#55645B] leading-relaxed">
                {config.kind === "CUSTOM_UPLOAD"
                  ? "Multi-page PDFs, PNG, JPG, or WebP (max 15 MB). Auto-saves immediately."
                  : isPresetDefault
                  ? "Uploading here creates a new Custom Preset inheriting Preset 1's settings."
                  : "Converts this copied preset into an uploaded PDF/Image template (retains settings)."}
              </p>

              {uploadError && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
              {uploadNotice && (
                <div className="flex items-start gap-1.5 text-[11px] text-[#123F17] bg-[#DCEFDD] border border-[#1B5E20]/20 rounded-lg p-2">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{uploadNotice}</span>
                </div>
              )}
            </div>

            {config.kind !== "CUSTOM_UPLOAD" && (
              <div className="p-3 rounded-xl bg-[#F1F8F1] border border-[#1B5E20]/20 space-y-1">
                <p className="text-xs font-bold text-[#123F17] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
                  Built-In Annex {annexNumber} Blueprint
                </p>
                <p className="text-[11px] text-[#55645B] leading-relaxed">
                  Retains all native tables & CHED compliance layout. Tune defaults under{" "}
                  <strong>Settings</strong> or drag custom overlay elements onto any tab in the middle canvas.
                </p>
              </div>
            )}

            {/* Paper Size & Print Orientation */}
            <div className="space-y-2.5 pt-1 border-t border-[#D6DDD8]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                Paper & Print Layout
              </p>
              <div>
                <label
                  htmlFor="preset-paper-size"
                  className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                >
                  Paper Size
                </label>
                <select
                  id="preset-paper-size"
                  value={config.settings.paperSize || "a4"}
                  onChange={(e) => {
                    const nextSize = e.target.value as PaperSize;
                    updateSettings({ paperSize: nextSize });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none"
                >
                  {Object.values(PAPER_SIZE_CONFIGS).map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.label} ({cfg.sublabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[#1F2A24] mb-1">
                  Default Print Orientation
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["portrait", "landscape"] as const).map((orient) => (
                    <button
                      key={orient}
                      type="button"
                      onClick={() => updateSettings({ orientation: orient })}
                      className={`apple-press py-1.5 px-2.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                        config.settings.orientation === orient
                          ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                          : "bg-white text-[#55645B] border-[#D6DDD8] hover:text-[#1F2A24]"
                      }`}
                    >
                      {orient}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Pages Manager */}
            <div className="space-y-2 pt-2 border-t border-[#D6DDD8]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                  Template Pages ({config.pages.length})
                </p>
                {config.kind === "CUSTOM_UPLOAD" && (
                  <button
                    type="button"
                    onClick={handleAddBlankPage}
                    className="text-[11px] font-semibold text-[#1B5E20] hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    Blank Page
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {config.pages.map((page, idx) => {
                  const isActive = page.id === activePageId;
                  const countOnPage = config.elements.filter((el) => el.pageId === page.id).length;
                  return (
                    <div
                      key={page.id}
                      onClick={() => onSelectPage(page.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                        isActive
                          ? "border-[#1B5E20] bg-[#F1F8F1] shadow-2xs"
                          : "border-[#D6DDD8] bg-white hover:bg-[#F6F8F6]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-[#1B5E20] text-white"
                                : "bg-[#F6F8F6] text-[#55645B]"
                            }`}
                          >
                            {page.pageNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1F2A24] truncate">
                              {page.label}
                            </p>
                            <p className="text-[10px] text-[#55645B] flex items-center gap-1">
                              {page.sourceType === "pdf" ? (
                                <FileText className="w-2.5 h-2.5" />
                              ) : (
                                <ImageIcon className="w-2.5 h-2.5" />
                              )}
                              <span>
                                {page.orientation} • {Math.round(page.widthPt)}×{Math.round(page.heightPt)}pt • {countOnPage} el
                              </span>
                            </p>
                          </div>
                        </div>

                        {config.kind === "CUSTOM_UPLOAD" && (
                          <div
                            className="flex items-center gap-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMovePage(idx, -1)}
                              title="Move Page Up"
                              className="p-1 rounded hover:bg-[#DCEFDD] text-[#55645B] disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === config.pages.length - 1}
                              onClick={() => handleMovePage(idx, 1)}
                              title="Move Page Down"
                              className="p-1 rounded hover:bg-[#DCEFDD] text-[#55645B] disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={config.pages.length <= 1}
                              onClick={() => handleDeletePage(page.id)}
                              title="Remove Page"
                              className="p-1 rounded hover:bg-red-50 text-red-600 disabled:opacity-30"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isActive && config.kind === "CUSTOM_UPLOAD" && (
                        <div className="mt-2 pt-2 border-t border-[#D6DDD8]/70" onClick={(e) => e.stopPropagation()}>
                          <label
                            htmlFor={`page-label-${page.id}`}
                            className="block text-[10px] font-semibold text-[#55645B] mb-0.5"
                          >
                            Page Label
                          </label>
                          <input
                            id={`page-label-${page.id}`}
                            type="text"
                            value={page.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              onChangeConfig((prev) => ({
                                ...prev,
                                pages: prev.pages.map((p) =>
                                  p.id === page.id ? { ...p, label: val } : p
                                ),
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs rounded-md border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MODULES & RETAINED DEFAULTS ================= */}
        {activeTab === "defaults" && (
          <div className="space-y-4">
            {/* Workspace Modules (Custom & Built-in) */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                Interactive Workspace Modules
              </p>
              <div className="space-y-1.5">
                {MODULE_META.map((mod) => {
                  const enabled = config.modules[mod.key];
                  return (
                    <label
                      key={mod.key}
                      className="flex items-start justify-between gap-2.5 p-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F1F8F1]/60 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1F2A24]">{mod.label}</p>
                        <p className="text-[10px] text-[#55645B] leading-snug">{mod.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          onChangeConfig((prev) => ({
                            ...prev,
                            modules: {
                              ...prev.modules,
                              [mod.key]: checked,
                            },
                          }));
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-[#D6DDD8] text-[#1B5E20] focus:ring-[#1B5E20] accent-[#1B5E20] shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Retained Campus & HEI Settings */}
            <div className="space-y-2.5 pt-3 border-t border-[#D6DDD8]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                Retained Campus & Academic Defaults
              </p>
              <div>
                <label
                  htmlFor="preset-campus"
                  className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                >
                  Default Campus
                </label>
                <select
                  id="preset-campus"
                  value={config.settings.campus || ""}
                  onChange={(e) => handleCampusSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none"
                >
                  {MINSU_CAMPUSES.map((c) => (
                    <option key={c.key} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="preset-region"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Region Code
                  </label>
                  <input
                    id="preset-region"
                    type="text"
                    value={config.settings.regionCode || ""}
                    onChange={(e) => updateSettings({ regionCode: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="preset-heicode"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    HEI Code
                  </label>
                  <input
                    id="preset-heicode"
                    type="text"
                    value={config.settings.heiCode || ""}
                    onChange={(e) => updateSettings({ heiCode: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="preset-heiname"
                  className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                >
                  HEI Name Override
                </label>
                <input
                  id="preset-heiname"
                  type="text"
                  value={config.settings.heiName || ""}
                  onChange={(e) => updateSettings({ heiName: e.target.value })}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="preset-heiaddr"
                  className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                >
                  HEI Address
                </label>
                <input
                  id="preset-heiaddr"
                  type="text"
                  value={config.settings.heiAddress || ""}
                  onChange={(e) => updateSettings({ heiAddress: e.target.value })}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="preset-ay"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Academic Year
                  </label>
                  <input
                    id="preset-ay"
                    type="text"
                    value={config.settings.academicYear || ""}
                    onChange={(e) => updateSettings({ academicYear: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="preset-term"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Semester / Term
                  </label>
                  <select
                    id="preset-term"
                    value={config.settings.termCode || "1"}
                    onChange={(e) => updateSettings({ termCode: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  >
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="preset-batch"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Default Batch #
                  </label>
                  <input
                    id="preset-batch"
                    type="text"
                    value={config.settings.batchNumber || ""}
                    onChange={(e) => updateSettings({ batchNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="preset-tranche"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Tranche #
                  </label>
                  <input
                    id="preset-tranche"
                    type="text"
                    value={config.settings.trancheNumber || ""}
                    onChange={(e) => updateSettings({ trancheNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Stipend Rate & Management Fee Defaults */}
            <div className="space-y-2.5 pt-3 border-t border-[#D6DDD8]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                Retained Financial Defaults
              </p>
              <StipendTierSelector
                selectedTier={config.settings.stipendTier || "7500"}
                currentAmount={config.settings.stipendPerGrantee ?? 7500}
                customInputValue={String(config.settings.stipendPerGrantee ?? 7500)}
                onTierChange={(tier, amount) =>
                  updateSettings({
                    stipendTier: tier,
                    stipendPerGrantee: amount,
                  })
                }
                onCustomInputChange={(_raw, num) =>
                  updateSettings({
                    stipendTier: "custom",
                    stipendPerGrantee: num,
                  })
                }
                label="Default Stipend Tier"
              />
              <div>
                <label
                  htmlFor="preset-fee-rate"
                  className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                >
                  Admin Support Fee Rate (decimal, 0.005 = 0.5%)
                </label>
                <input
                  id="preset-fee-rate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="0.1"
                  value={config.settings.managementFeeRate ?? 0.005}
                  onChange={(e) =>
                    updateSettings({
                      managementFeeRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                />
              </div>
            </div>

            {/* Retained Institutional Logos */}
            <div className="space-y-2 pt-3 border-t border-[#D6DDD8]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                  Preset Header Logos
                </p>
                {config.settings.headerLogos && (
                  <button
                    type="button"
                    onClick={() => updateSettings({ headerLogos: undefined })}
                    className="text-[10px] font-semibold text-[#1B5E20] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Global
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-[#55645B]">Left Seal</span>
                  <AnnexLogo
                    position="left"
                    config={config.settings.headerLogos?.leftLogo}
                    editable
                    className="w-12 h-12"
                    onLogoChange={(newLogo) =>
                      updateSettings({
                        headerLogos: {
                          ...config.settings.headerLogos,
                          leftLogo: newLogo,
                        },
                      })
                    }
                  />
                </div>
                <div className="p-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-[#55645B]">Right Seal</span>
                  <AnnexLogo
                    position="right"
                    config={config.settings.headerLogos?.rightLogo}
                    editable
                    className="w-12 h-12"
                    onLogoChange={(newLogo) =>
                      updateSettings({
                        headerLogos: {
                          ...config.settings.headerLogos,
                          rightLogo: newLogo,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Retained Signatories */}
            {config.settings.signatories &&
              Object.keys(config.settings.signatories).length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#D6DDD8]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                    Retained Signatories
                  </p>
                  <div className="space-y-2">
                    {Object.entries(config.settings.signatories).map(([sigKey, sig]) => (
                      <div
                        key={sigKey}
                        className="p-2.5 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/70 space-y-1.5"
                      >
                        <p className="text-[10px] font-bold uppercase text-[#1B5E20]">
                          {sigKey.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <div>
                          <label
                            htmlFor={`sig-name-${sigKey}`}
                            className="block text-[10px] text-[#55645B]"
                          >
                            Name
                          </label>
                          <input
                            id={`sig-name-${sigKey}`}
                            type="text"
                            value={sig.name}
                            onChange={(e) => handleSignatoryChange(sigKey, "name", e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-md border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`sig-pos-${sigKey}`}
                            className="block text-[10px] text-[#55645B]"
                          >
                            Title / Position
                          </label>
                          <input
                            id={`sig-pos-${sigKey}`}
                            type="text"
                            value={sig.position}
                            onChange={(e) =>
                              handleSignatoryChange(sigKey, "position", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs rounded-md border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                          />
                        </div>
                        {sig.office !== undefined && (
                          <div>
                            <label
                              htmlFor={`sig-office-${sigKey}`}
                              className="block text-[10px] text-[#55645B]"
                            >
                              Office
                            </label>
                            <input
                              id={`sig-office-${sigKey}`}
                              type="text"
                              value={sig.office || ""}
                              onChange={(e) =>
                                handleSignatoryChange(sigKey, "office", e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs rounded-md border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Annex-Specific Retained Extras */}
            {annexNumber === 1 && (
              <div className="space-y-2 pt-3 border-t border-[#D6DDD8]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                  Annex 1 Cover Defaults
                </p>
                <div>
                  <label
                    htmlFor="preset-a1-agency"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Default Target Agency
                  </label>
                  <input
                    id="preset-a1-agency"
                    type="text"
                    value={String(config.settings.extraDefaults?.target_agency || "")}
                    onChange={(e) => updateExtraDefault("target_agency", e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="preset-a1-remarks"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Default Endorsement Remarks
                  </label>
                  <textarea
                    id="preset-a1-remarks"
                    rows={2}
                    value={String(config.settings.extraDefaults?.remarks || "")}
                    onChange={(e) => updateExtraDefault("remarks", e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
            )}

            {(annexNumber === 3 || annexNumber === 4) && config.settings.notary && (
              <div className="space-y-2 pt-3 border-t border-[#D6DDD8]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                  Notarial Block Defaults
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="preset-notary-issued"
                      className="block text-[10px] font-semibold text-[#1F2A24] mb-0.5"
                    >
                      Issued At
                    </label>
                    <input
                      id="preset-notary-issued"
                      type="text"
                      value={config.settings.notary.issuedAt || ""}
                      onChange={(e) =>
                        updateSettings({
                          notary: { ...config.settings.notary, issuedAt: e.target.value },
                        })
                      }
                      className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="preset-notary-series"
                      className="block text-[10px] font-semibold text-[#1F2A24] mb-0.5"
                    >
                      Series
                    </label>
                    <input
                      id="preset-notary-series"
                      type="text"
                      value={config.settings.notary.series || ""}
                      onChange={(e) =>
                        updateSettings({
                          notary: { ...config.settings.notary, series: e.target.value },
                        })
                      }
                      className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                    />
                  </div>
                </div>
              </div>
            )}

            {annexNumber === 10 && (
              <div className="space-y-2 pt-3 border-t border-[#D6DDD8]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                  Notice of Award Defaults
                </p>
                <div>
                  <label
                    htmlFor="preset-a10-memo"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Memorandum Order Reference
                  </label>
                  <input
                    id="preset-a10-memo"
                    type="text"
                    value={String(config.settings.extraDefaults?.memorandumOrderRef || "")}
                    onChange={(e) => updateExtraDefault("memorandumOrderRef", e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="preset-a10-cond"
                    className="block text-[11px] font-semibold text-[#1F2A24] mb-1"
                  >
                    Award Conditions (one per line)
                  </label>
                  <textarea
                    id="preset-a10-cond"
                    rows={4}
                    value={extraConditions.join("\n")}
                    onChange={(e) =>
                      updateExtraDefault(
                        "conditions",
                        e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ELEMENT INSPECTOR ================= */}
        {activeTab === "inspector" && (
          <div className="space-y-3.5">
            {!selectedElement ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] text-center space-y-1">
                  <Crosshair className="w-5 h-5 text-[#1B5E20] mx-auto" />
                  <p className="text-xs font-bold text-[#1F2A24]">No Element Selected</p>
                  <p className="text-[11px] text-[#55645B]">
                    Click an element on the middle canvas or select from the current page layer list below.
                  </p>
                </div>

                {activePageElements.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                      Elements on Active Page ({activePageElements.length})
                    </p>
                    {activePageElements.map((el) => (
                      <button
                        key={el.id}
                        type="button"
                        onClick={() => onSelectElement(el.id)}
                        className="w-full text-left px-2.5 py-2 rounded-lg border border-[#D6DDD8] bg-white hover:border-[#1B5E20] hover:bg-[#F1F8F1] flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-[#1F2A24] truncate">{el.label}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#F6F8F6] text-[#55645B]">
                          {el.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Element Header + Quick Actions */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F1F8F1] border border-[#1B5E20]/20">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1B5E20] text-white">
                      {selectedElement.type}
                    </span>
                    <p className="text-xs font-bold text-[#1F2A24] truncate mt-1">
                      {selectedElement.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateElement(selectedElement.id)}
                      title="Duplicate Element"
                      className="p-1.5 rounded-lg bg-white border border-[#D6DDD8] text-[#1B5E20] hover:bg-[#DCEFDD] apple-press"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteElement(selectedElement.id)}
                      title="Delete Element"
                      className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 apple-press"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Label & Data Properties */}
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="el-label"
                      className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                    >
                      Field Label
                    </label>
                    <input
                      id="el-label"
                      type="text"
                      value={selectedElement.label}
                      onChange={(e) =>
                        updateElement(selectedElement.id, (el) => ({
                          ...el,
                          label: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                    />
                  </div>

                  {(selectedElement.type === "textbox" ||
                    selectedElement.type === "textarea" ||
                    selectedElement.type === "date" ||
                    selectedElement.type === "checkbox") && (
                    <div>
                      <label
                        htmlFor="el-fieldkey"
                        className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                      >
                        Workspace Field Key
                      </label>
                      <input
                        id="el-fieldkey"
                        type="text"
                        value={selectedElement.fieldKey || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            fieldKey: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                      />
                    </div>
                  )}

                  {selectedElement.type === "static_text" && (
                    <div>
                      <label
                        htmlFor="el-static"
                        className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                      >
                        Static Text Content
                      </label>
                      <textarea
                        id="el-static"
                        rows={2}
                        value={selectedElement.staticText || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            staticText: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                      />
                    </div>
                  )}

                  {selectedElement.type === "bound_field" && (
                    <div>
                      <label
                        htmlFor="el-binding"
                        className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                      >
                        Bound Workspace Variable
                      </label>
                      <select
                        id="el-binding"
                        value={selectedElement.bindingKey || ""}
                        onChange={(e) => {
                          const nextKey = e.target.value;
                          const matched = availableVars.find((v) => v.key === nextKey);
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            bindingKey: nextKey,
                            label: matched ? matched.label : el.label,
                          }));
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                      >
                        <option value="">-- Select Variable --</option>
                        {availableVars.map((v) => (
                          <option key={v.key} value={v.key}>
                            {v.label} ({`{{${v.key}}}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedElement.type === "textbox" ||
                    selectedElement.type === "textarea" ||
                    selectedElement.type === "date") && (
                    <>
                      <div>
                        <label
                          htmlFor="el-defaultval"
                          className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                        >
                          Default Value
                        </label>
                        <input
                          id="el-defaultval"
                          type={selectedElement.type === "date" ? "date" : "text"}
                          value={selectedElement.defaultValue || ""}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              defaultValue: e.target.value,
                            }))
                          }
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[#1F2A24] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedElement.required)}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              required: e.target.checked,
                            }))
                          }
                          className="rounded border-[#D6DDD8] accent-[#1B5E20]"
                        />
                        <span>Required in Interactive Workspace</span>
                      </label>
                    </>
                  )}

                  {selectedElement.type === "checkbox" && (
                    <label className="flex items-center gap-2 text-xs text-[#1F2A24] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedElement.checkedDefault)}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            checkedDefault: e.target.checked,
                          }))
                        }
                        className="rounded border-[#D6DDD8] accent-[#1B5E20]"
                      />
                      <span>Checked by Default</span>
                    </label>
                  )}

                  {selectedElement.type === "logo" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="el-logoslot"
                        className="block text-[11px] font-semibold text-[#1F2A24]"
                      >
                        Logo Source Slot
                      </label>
                      <select
                        id="el-logoslot"
                        value={selectedElement.logoSlot || "left"}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            logoSlot: e.target.value as "left" | "right" | "custom",
                          }))
                        }
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                      >
                        <option value="left">Preset Left Institutional Seal</option>
                        <option value="right">Preset Right Agency Seal</option>
                        <option value="custom">Custom Image URL / Upload</option>
                      </select>

                      {selectedElement.logoSlot === "custom" && (
                        <div>
                          <label
                            htmlFor="el-logourl"
                            className="block text-[11px] font-semibold text-[#1F2A24] mb-0.5"
                          >
                            Image URL
                          </label>
                          <input
                            id="el-logourl"
                            type="text"
                            placeholder="/api/media/logo/..."
                            value={selectedElement.logoUrl || ""}
                            onChange={(e) =>
                              updateElement(selectedElement.id, (el) => ({
                                ...el,
                                logoUrl: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Geometry (% of Page) */}
                <div className="pt-2.5 border-t border-[#D6DDD8] space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                    Position & Frame (% of Page)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="el-x" className="block text-[10px] text-[#55645B]">
                        X (%)
                      </label>
                      <input
                        id="el-x"
                        type="number"
                        step="0.5"
                        min="0"
                        max="98"
                        value={Number(selectedElement.xPct.toFixed(1))}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            xPct: Math.min(98, Math.max(0, parseFloat(e.target.value) || 0)),
                          }))
                        }
                        className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label htmlFor="el-y" className="block text-[10px] text-[#55645B]">
                        Y (%)
                      </label>
                      <input
                        id="el-y"
                        type="number"
                        step="0.5"
                        min="0"
                        max="98"
                        value={Number(selectedElement.yPct.toFixed(1))}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            yPct: Math.min(98, Math.max(0, parseFloat(e.target.value) || 0)),
                          }))
                        }
                        className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label htmlFor="el-w" className="block text-[10px] text-[#55645B]">
                        Width (%)
                      </label>
                      <input
                        id="el-w"
                        type="number"
                        step="0.5"
                        min="2"
                        max="100"
                        value={Number(selectedElement.wPct.toFixed(1))}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            wPct: Math.min(100 - el.xPct, Math.max(2, parseFloat(e.target.value) || 10)),
                          }))
                        }
                        className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label htmlFor="el-h" className="block text-[10px] text-[#55645B]">
                        Height (%)
                      </label>
                      <input
                        id="el-h"
                        type="number"
                        step="0.5"
                        min="1.5"
                        max="100"
                        value={Number(selectedElement.hPct.toFixed(1))}
                        onChange={(e) =>
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            hPct: Math.min(100 - el.yPct, Math.max(1.5, parseFloat(e.target.value) || 4)),
                          }))
                        }
                        className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography & Style (for non-logo / non-table or general container) */}
                {selectedElement.type !== "data_table" && selectedElement.type !== "logo" && (
                  <div className="pt-2.5 border-t border-[#D6DDD8] space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                      Typography & Box Style
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="el-font" className="block text-[10px] text-[#55645B]">
                          PDF Font
                        </label>
                        <select
                          id="el-font"
                          value={selectedElement.style?.fontFamily || "Helvetica"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: {
                                ...el.style,
                                fontFamily: e.target.value as "Helvetica" | "Times" | "Courier",
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] bg-white outline-none focus:ring-2 focus:ring-[#1B5E20]"
                        >
                          <option value="Helvetica">Sans (Helvetica)</option>
                          <option value="Times">Serif (Times)</option>
                          <option value="Courier">Mono (Courier)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="el-fontsize" className="block text-[10px] text-[#55645B]">
                          Size (pt)
                        </label>
                        <input
                          id="el-fontsize"
                          type="number"
                          min="6"
                          max="48"
                          value={selectedElement.style?.fontSizePt ?? 10}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: {
                                ...el.style,
                                fontSizePt: Math.min(48, Math.max(6, parseInt(e.target.value, 10) || 10)),
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex rounded-lg border border-[#D6DDD8] p-0.5 bg-[#F6F8F6]">
                        <button
                          type="button"
                          onClick={() =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: { ...el.style, bold: !el.style?.bold },
                            }))
                          }
                          className={`p-1.5 rounded-md ${
                            selectedElement.style?.bold
                              ? "bg-[#1B5E20] text-white"
                              : "text-[#55645B] hover:text-[#1F2A24]"
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: { ...el.style, italic: !el.style?.italic },
                            }))
                          }
                          className={`p-1.5 rounded-md ${
                            selectedElement.style?.italic
                              ? "bg-[#1B5E20] text-white"
                              : "text-[#55645B] hover:text-[#1F2A24]"
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="inline-flex rounded-lg border border-[#D6DDD8] p-0.5 bg-[#F6F8F6]">
                        {(
                          [
                            { id: "left", icon: AlignLeft },
                            { id: "center", icon: AlignCenter },
                            { id: "right", icon: AlignRight },
                          ] as const
                        ).map((al) => {
                          const Icon = al.icon;
                          const active = (selectedElement.style?.align || "left") === al.id;
                          return (
                            <button
                              key={al.id}
                              type="button"
                              onClick={() =>
                                updateElement(selectedElement.id, (el) => ({
                                  ...el,
                                  style: { ...el.style, align: al.id },
                                }))
                              }
                              className={`p-1.5 rounded-md ${
                                active
                                  ? "bg-[#1B5E20] text-white"
                                  : "text-[#55645B] hover:text-[#1F2A24]"
                              }`}
                              title={`Align ${al.id}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-[#55645B] mb-1">
                        Ink Color
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {COLOR_SWATCHES.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, (el) => ({
                                ...el,
                                style: { ...el.style, color: hex },
                              }))
                            }
                            style={{ backgroundColor: hex }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
                              (selectedElement.style?.color || "#1F2A24").toUpperCase() ===
                              hex.toUpperCase()
                                ? "border-[#F2B705] scale-110"
                                : "border-white shadow-xs"
                            }`}
                            title={hex}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedElement.style?.color || "#1F2A24"}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: { ...el.style, color: e.target.value },
                            }))
                          }
                          aria-label="Custom ink color"
                          className="w-6 h-6 rounded border border-[#D6DDD8] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="el-borderw" className="block text-[10px] text-[#55645B]">
                          Border Width (px)
                        </label>
                        <input
                          id="el-borderw"
                          type="number"
                          min="0"
                          max="4"
                          value={selectedElement.style?.borderWidth ?? 0}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: {
                                ...el.style,
                                borderWidth: Math.min(4, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="el-bg" className="block text-[10px] text-[#55645B]">
                          Fill Background
                        </label>
                        <select
                          id="el-bg"
                          value={selectedElement.style?.backgroundColor || ""}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              style: {
                                ...el.style,
                                backgroundColor: e.target.value || undefined,
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#D6DDD8] bg-white outline-none"
                        >
                          <option value="">Transparent</option>
                          <option value="#FFFFFF">Solid White</option>
                          <option value="#F1F8F1">MinSU Light Green</option>
                          <option value="#FFF1C2">MinSU Light Gold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Data Table Config */}
                {selectedElement.type === "data_table" && selectedElement.tableConfig && (
                  <div className="pt-2.5 border-t border-[#D6DDD8] space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                      Dynamic Table Settings
                    </p>
                    <div>
                      <label htmlFor="el-tbl-src" className="block text-[11px] font-semibold text-[#1F2A24] mb-1">
                        Data Source
                      </label>
                      <select
                        id="el-tbl-src"
                        value={selectedElement.tableConfig.dataSource}
                        onChange={(e) => {
                          const nextSrc = e.target.value as PresetTableDataSource;
                          updateElement(selectedElement.id, (el) => ({
                            ...el,
                            tableConfig: el.tableConfig
                              ? {
                                  ...el.tableConfig,
                                  dataSource: nextSrc,
                                  columns: getDefaultTableColumnsForSource(nextSrc),
                                }
                              : undefined,
                          }));
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-white focus:ring-2 focus:ring-[#1B5E20] outline-none"
                      >
                        {TABLE_SOURCES.map((src) => (
                          <option key={src.value} value={src.value}>
                            {src.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="el-tbl-rowh" className="block text-[10px] text-[#55645B]">
                          Row Height (pt)
                        </label>
                        <input
                          id="el-tbl-rowh"
                          type="number"
                          min="12"
                          max="48"
                          value={selectedElement.tableConfig.rowHeightPt}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              tableConfig: el.tableConfig
                                ? {
                                    ...el.tableConfig,
                                    rowHeightPt: Math.min(
                                      48,
                                      Math.max(12, parseInt(e.target.value, 10) || 18)
                                    ),
                                  }
                                : undefined,
                            }))
                          }
                          className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="el-tbl-fs" className="block text-[10px] text-[#55645B]">
                          Cell Font (pt)
                        </label>
                        <input
                          id="el-tbl-fs"
                          type="number"
                          min="6"
                          max="14"
                          value={selectedElement.tableConfig.fontSizePt ?? 8}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              tableConfig: el.tableConfig
                                ? {
                                    ...el.tableConfig,
                                    fontSizePt: Math.min(
                                      14,
                                      Math.max(6, parseInt(e.target.value, 10) || 8)
                                    ),
                                  }
                                : undefined,
                            }))
                          }
                          className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-[#D6DDD8] outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-xs text-[#1F2A24] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedElement.tableConfig.showHeader !== false}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              tableConfig: el.tableConfig
                                ? { ...el.tableConfig, showHeader: e.target.checked }
                                : undefined,
                            }))
                          }
                          className="rounded border-[#D6DDD8] accent-[#1B5E20]"
                        />
                        <span>Show Table Header Row</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[#1F2A24] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedElement.tableConfig.autoPaginate !== false}
                          onChange={(e) =>
                            updateElement(selectedElement.id, (el) => ({
                              ...el,
                              tableConfig: el.tableConfig
                                ? { ...el.tableConfig, autoPaginate: e.target.checked }
                                : undefined,
                            }))
                          }
                          className="rounded border-[#D6DDD8] accent-[#1B5E20]"
                        />
                        <span>Auto-Paginate Large Batches</span>
                      </label>
                    </div>

                    {/* Editable Columns Builder */}
                    {(() => {
                      const cols = selectedElement.tableConfig.columns;
                      const knownFields = getAvailableTableColumnFields(
                        selectedElement.tableConfig.dataSource
                      );
                      const knownKeySet = new Set(knownFields.map((f) => f.key));
                      const totalWidthPct = Math.round(
                        cols.reduce((acc, c) => acc + (c.widthPct || 0), 0)
                      );
                      const isBalanced = totalWidthPct >= 99 && totalWidthPct <= 101;

                      return (
                        <div className="space-y-2 pt-1.5 border-t border-[#D6DDD8]/70">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
                                Columns ({cols.length})
                              </p>
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                  isBalanced
                                    ? "bg-[#DCEFDD] text-[#123F17]"
                                    : "bg-[#FFF1C2] text-[#B88A00]"
                                }`}
                                title="Column widths auto-scale cleanly when printed, or click Fit 100%"
                              >
                                {totalWidthPct}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateTableColumns(selectedElement.id, (prev) =>
                                    normalizeTableColumnWidths(prev)
                                  )
                                }
                                title="Scale column widths proportionally to 100%"
                                className="px-1.5 py-0.5 rounded border border-[#D6DDD8] bg-white hover:bg-[#F1F8F1] text-[10px] font-semibold text-[#55645B] hover:text-[#1B5E20]"
                              >
                                Fit 100%
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const src = selectedElement.tableConfig!.dataSource;
                                  updateTableColumns(selectedElement.id, () =>
                                    getDefaultTableColumnsForSource(src)
                                  );
                                }}
                                title="Reset columns to data source defaults"
                                className="p-1 rounded border border-[#D6DDD8] bg-white hover:bg-[#F1F8F1] text-[#55645B] hover:text-[#1B5E20]"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateTableColumns(selectedElement.id, (prev) => {
                                    const used = new Set(prev.map((c) => c.key));
                                    const nextSuggested = knownFields.find(
                                      (f) => !used.has(f.key)
                                    );
                                    const fallbackIdx = prev.length + 1;
                                    const newCol: PresetTableColumn = nextSuggested
                                      ? {
                                          key: nextSuggested.key,
                                          label: nextSuggested.label,
                                          widthPct: 14,
                                          align: nextSuggested.align || "left",
                                          format: nextSuggested.format || "text",
                                        }
                                      : {
                                          key: `customCol${fallbackIdx}`,
                                          label: `Column ${fallbackIdx}`,
                                          widthPct: 14,
                                          align: "left",
                                          format: "text",
                                        };
                                    return [...prev, newCol];
                                  })
                                }
                                className="px-2 py-0.5 rounded-md bg-[#1B5E20] hover:bg-[#25702A] text-white text-[10px] font-semibold inline-flex items-center gap-0.5 apple-press"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5 apple-scrollbar">
                            {cols.map((col: PresetTableColumn, colIdx: number) => {
                              const isCustomKey = !knownKeySet.has(col.key);
                              return (
                                <div
                                  key={`col-${colIdx}`}
                                  className="p-2 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/80 space-y-1.5"
                                >
                                  {/* Row 1: Order #, Label, Move Up/Down, Delete */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono font-bold text-[#55645B] w-4 shrink-0 text-center">
                                      {colIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={col.label}
                                      placeholder="Column Header"
                                      aria-label={`Column ${colIdx + 1} header label`}
                                      onChange={(e) => {
                                        const nextLabel = e.target.value;
                                        updateTableColumns(selectedElement.id, (prev) =>
                                          prev.map((c, idx) =>
                                            idx === colIdx ? { ...c, label: nextLabel } : c
                                          )
                                        );
                                      }}
                                      className="flex-1 min-w-0 bg-white px-2 py-1 rounded-md border border-[#D6DDD8] text-xs font-semibold text-[#1F2A24] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                                    />
                                    <button
                                      type="button"
                                      disabled={colIdx === 0}
                                      onClick={() =>
                                        updateTableColumns(selectedElement.id, (prev) => {
                                          if (colIdx === 0) return prev;
                                          const copy = [...prev];
                                          [copy[colIdx - 1], copy[colIdx]] = [
                                            copy[colIdx],
                                            copy[colIdx - 1],
                                          ];
                                          return copy;
                                        })
                                      }
                                      title="Move Left / Up"
                                      className="p-1 rounded hover:bg-[#DCEFDD] text-[#55645B] disabled:opacity-30"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={colIdx === cols.length - 1}
                                      onClick={() =>
                                        updateTableColumns(selectedElement.id, (prev) => {
                                          if (colIdx >= prev.length - 1) return prev;
                                          const copy = [...prev];
                                          [copy[colIdx], copy[colIdx + 1]] = [
                                            copy[colIdx + 1],
                                            copy[colIdx],
                                          ];
                                          return copy;
                                        })
                                      }
                                      title="Move Right / Down"
                                      className="p-1 rounded hover:bg-[#DCEFDD] text-[#55645B] disabled:opacity-30"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cols.length <= 1}
                                      onClick={() =>
                                        updateTableColumns(selectedElement.id, (prev) =>
                                          prev.length <= 1
                                            ? prev
                                            : prev.filter((_, idx) => idx !== colIdx)
                                        )
                                      }
                                      title="Remove Column"
                                      className="p-1 rounded hover:bg-red-50 text-red-600 disabled:opacity-30"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Row 2: Bound Data Field Key + Width % */}
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={isCustomKey ? "__custom__" : col.key}
                                      aria-label={`Column ${colIdx + 1} data field`}
                                      onChange={(e) => {
                                        const picked = e.target.value;
                                        if (picked === "__custom__") {
                                          const fallbackCustomKey = isCustomKey
                                            ? col.key
                                            : `customCol${colIdx + 1}`;
                                          updateTableColumns(selectedElement.id, (prev) =>
                                            prev.map((c, idx) =>
                                              idx === colIdx
                                                ? { ...c, key: fallbackCustomKey }
                                                : c
                                            )
                                          );
                                          return;
                                        }
                                        const meta = knownFields.find((f) => f.key === picked);
                                        updateTableColumns(selectedElement.id, (prev) =>
                                          prev.map((c, idx) => {
                                            if (idx !== colIdx) return c;
                                            return {
                                              ...c,
                                              key: picked,
                                              label: meta?.label || c.label,
                                              align: meta?.align || c.align,
                                              format: meta?.format || c.format,
                                            };
                                          })
                                        );
                                      }}
                                      className="flex-1 min-w-0 bg-white px-1.5 py-1 rounded-md border border-[#D6DDD8] text-[11px] text-[#1F2A24] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                                    >
                                      {knownFields.map((f) => (
                                        <option key={f.key} value={f.key}>
                                          {f.label} ({f.key})
                                        </option>
                                      ))}
                                      <option value="__custom__">Custom Field Key...</option>
                                    </select>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <input
                                        type="number"
                                        min="4"
                                        max="100"
                                        value={col.widthPct}
                                        aria-label={`Column ${colIdx + 1} width percent`}
                                        onChange={(e) => {
                                          const w = Math.max(
                                            4,
                                            Math.min(100, Number(e.target.value) || 10)
                                          );
                                          updateTableColumns(selectedElement.id, (prev) =>
                                            prev.map((c, idx) =>
                                              idx === colIdx ? { ...c, widthPct: w } : c
                                            )
                                          );
                                        }}
                                        className="w-11 bg-white px-1 py-1 rounded-md border border-[#D6DDD8] font-mono text-[10px] text-right outline-none"
                                      />
                                      <span className="text-[10px] text-[#55645B]">%</span>
                                    </div>
                                  </div>

                                  {isCustomKey && (
                                    <input
                                      type="text"
                                      value={col.key}
                                      placeholder="e.g. remarks or zipCode"
                                      aria-label={`Column ${colIdx + 1} custom field key`}
                                      onChange={(e) => {
                                        const cleanKey = e.target.value.replace(/\s+/g, "_");
                                        updateTableColumns(selectedElement.id, (prev) =>
                                          prev.map((c, idx) =>
                                            idx === colIdx ? { ...c, key: cleanKey } : c
                                          )
                                        );
                                      }}
                                      className="w-full bg-white px-2 py-1 rounded-md border border-[#1B5E20]/40 text-[11px] font-mono text-[#123F17] outline-none focus:ring-2 focus:ring-[#1B5E20]"
                                    />
                                  )}

                                  {/* Row 3: Alignment & Value Format */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="inline-flex rounded-md border border-[#D6DDD8] bg-white p-0.5">
                                      {(
                                        [
                                          { id: "left", icon: AlignLeft },
                                          { id: "center", icon: AlignCenter },
                                          { id: "right", icon: AlignRight },
                                        ] as const
                                      ).map((al) => {
                                        const AlignIcon = al.icon;
                                        const activeAlign = (col.align || "left") === al.id;
                                        return (
                                          <button
                                            key={al.id}
                                            type="button"
                                            onClick={() =>
                                              updateTableColumns(selectedElement.id, (prev) =>
                                                prev.map((c, idx) =>
                                                  idx === colIdx ? { ...c, align: al.id } : c
                                                )
                                              )
                                            }
                                            className={`p-1 rounded-xs ${
                                              activeAlign
                                                ? "bg-[#1B5E20] text-white"
                                                : "text-[#55645B] hover:text-[#1F2A24]"
                                            }`}
                                            title={`Align ${al.id}`}
                                          >
                                            <AlignIcon className="w-3 h-3" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <select
                                      value={col.format || "text"}
                                      aria-label={`Column ${colIdx + 1} format`}
                                      onChange={(e) => {
                                        const fmt = e.target.value as PresetTableColumn["format"];
                                        updateTableColumns(selectedElement.id, (prev) =>
                                          prev.map((c, idx) =>
                                            idx === colIdx ? { ...c, format: fmt } : c
                                          )
                                        );
                                      }}
                                      className="flex-1 bg-white px-1.5 py-1 rounded-md border border-[#D6DDD8] text-[10px] text-[#1F2A24] outline-none"
                                    >
                                      <option value="text">Text</option>
                                      <option value="currency">Currency (₱)</option>
                                      <option value="number">Number</option>
                                      <option value="date">Date</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

