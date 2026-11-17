"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Plus,
  Save,
  Copy,
  Trash2,
  Star,
  Pencil,
  Check,
  X,
  Undo2,
  Redo2,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  Sparkles,
  FilePlus2,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import {
  AnnexPresetConfig,
  AnnexPresetRecord,
  PresetElement,
  PresetPage,
} from "@/types/presets";
import {
  PRESET_SUPPORTED_ANNEX_NUMBERS,
  buildEmptyCustomPresetConfig,
  getDefaultTableColumnsForSource,
  getDefaultTableSourceForAnnex,
  isPresetSupportedAnnex,
} from "@/lib/annex-presets";
import {
  LeftStudioTab,
  StudioLeftControls,
} from "@/components/presets/studio-left-controls";
import { StudioCanvas } from "@/components/presets/studio-canvas";
import {
  PaletteDragPayload,
  StudioRightPalette,
} from "@/components/presets/studio-right-palette";

function buildElementFromPayload(
  payload: PaletteDragPayload,
  pageId: string,
  annexNumber: number,
  xPct: number,
  yPct: number
): PresetElement {
  const uid = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const tableSource = getDefaultTableSourceForAnnex(annexNumber);

  let defaultW = 24;
  let defaultH = 4.5;
  if (payload.type === "textarea") {
    defaultW = 36;
    defaultH = 11;
  } else if (payload.type === "data_table") {
    defaultW = 88;
    defaultH = 38;
  } else if (payload.type === "checkbox") {
    defaultW = 5;
    defaultH = 4;
  } else if (payload.type === "logo") {
    defaultW = 11;
    defaultH = 11;
  } else if (payload.type === "date") {
    defaultW = 20;
    defaultH = 4.5;
  }

  const clampedX = Math.max(0, Math.min(100 - defaultW, Number((xPct - defaultW / 2).toFixed(2))));
  const clampedY = Math.max(0, Math.min(100 - defaultH, Number((yPct - defaultH / 2).toFixed(2))));

  const cleanKey = payload.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    id: uid,
    pageId,
    type: payload.type,
    label: payload.label,
    fieldKey:
      payload.type === "textbox" ||
      payload.type === "textarea" ||
      payload.type === "date" ||
      payload.type === "checkbox"
        ? `${cleanKey || "field"}_${uid.slice(-4)}`
        : undefined,
    bindingKey: payload.bindingKey,
    staticText: payload.staticText,
    logoSlot: payload.logoSlot,
    xPct: clampedX,
    yPct: clampedY,
    wPct: defaultW,
    hPct: defaultH,
    zIndex: 10,
    style: {
      fontFamily: "Helvetica",
      fontSizePt: payload.type === "static_text" ? 11 : 10,
      bold: payload.type === "static_text",
      color: "#1F2A24",
      align: "left",
      borderWidth: payload.type === "textbox" || payload.type === "textarea" ? 1 : 0,
      borderColor: "#D6DDD8",
      backgroundColor: payload.type === "textbox" || payload.type === "textarea" ? "#FFFFFF" : undefined,
      paddingPx: 3,
    },
    tableConfig:
      payload.type === "data_table"
        ? {
            dataSource: tableSource,
            columns: getDefaultTableColumnsForSource(tableSource),
            rowHeightPt: 18,
            headerBgColor: "#1B5E20",
            headerTextColor: "#FFFFFF",
            showHeader: true,
            autoPaginate: true,
            fontSizePt: 8,
          }
        : undefined,
  };
}

function AnnexPresetsStudioInner() {
  const { user, isLoading: sessionLoading } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialAnnexParam = parseInt(searchParams.get("annex") || "4", 10);
  const initialAnnex = isPresetSupportedAnnex(initialAnnexParam) ? initialAnnexParam : 4;
  const initialPresetIdParam = searchParams.get("presetId");

  const [selectedAnnexNumber, setSelectedAnnexNumber] = useState<number>(initialAnnex);
  const [presets, setPresets] = useState<AnnexPresetRecord[]>([]);
  const [loadingPresets, setLoadingPresets] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string>("");

  const [draftName, setDraftName] = useState<string>("");
  const [editingName, setEditingName] = useState<boolean>(false);
  const [draftConfig, setDraftConfig] = useState<AnnexPresetConfig | null>(null);
  const [historyPast, setHistoryPast] = useState<AnnexPresetConfig[]>([]);
  const [historyFuture, setHistoryFuture] = useState<AnnexPresetConfig[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [activePageId, setActivePageId] = useState<string>("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftStudioTab>("template");
  const [previewMode, setPreviewMode] = useState<"preview-tokens" | "preview-sample">("preview-tokens");

  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingTemplate, setUploadingTemplate] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Inline Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [newPresetDescription, setNewPresetDescription] = useState<string>("");
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [creatingPreset, setCreatingPreset] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deletingPreset, setDeletingPreset] = useState<boolean>(false);

  const initialPresetAppliedRef = useRef<boolean>(false);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) || null,
    [presets, activePresetId]
  );

  const activePage = useMemo(() => {
    if (!draftConfig || draftConfig.pages.length === 0) return null;
    return draftConfig.pages.find((p) => p.id === activePageId) || draftConfig.pages[0];
  }, [draftConfig, activePageId]);

  const loadPresetIntoEditor = useCallback((preset: AnnexPresetRecord) => {
    const cloned = JSON.parse(JSON.stringify(preset.config)) as AnnexPresetConfig;
    setActivePresetId(preset.id);
    setDraftName(preset.name);
    setDraftConfig(cloned);
    setHistoryPast([]);
    setHistoryFuture([]);
    setIsDirty(false);
    setEditingName(false);
    setSelectedElementId(null);
    setUploadError(null);
    setUploadNotice(null);
    setActivePageId(cloned.pages?.[0]?.id || "");
  }, []);

  const fetchPresets = useCallback(
    async (annexNum: number, preferPresetId?: string | null) => {
      setLoadingPresets(true);
      setStatusMessage(null);
      try {
        const res = await fetch(
          `/api/annex-presets?annexNumber=${annexNum}&includeInactive=true`
        );
        const data = await res.json();
        if (!res.ok) {
          setStatusMessage({ type: "error", text: data.error || "Failed to load presets." });
          return;
        }
        const list = (data.presets || []) as AnnexPresetRecord[];
        setPresets(list);

        if (list.length > 0) {
          const preferred =
            (preferPresetId && list.find((p) => p.id === preferPresetId)) ||
            list.find((p) => p.isDefault) ||
            list[0];
          loadPresetIntoEditor(preferred);
        } else {
          setActivePresetId("");
          setDraftConfig(null);
        }
      } catch (err) {
        console.error("Failed to load presets:", err);
        setStatusMessage({ type: "error", text: "Network error loading presets." });
      } finally {
        setLoadingPresets(false);
      }
    },
    [loadPresetIntoEditor]
  );

  useEffect(() => {
    if (sessionLoading || !user || user.role !== "STAFF") return;
    const preferId = !initialPresetAppliedRef.current ? initialPresetIdParam : null;
    initialPresetAppliedRef.current = true;
    fetchPresets(selectedAnnexNumber, preferId);
  }, [sessionLoading, user, selectedAnnexNumber, initialPresetIdParam, fetchPresets]);

  const mutateConfig = useCallback(
    (updater: (prev: AnnexPresetConfig) => AnnexPresetConfig) => {
      setDraftConfig((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        if (next === prev) return prev;
        setHistoryPast((past) => [...past.slice(-29), prev]);
        setHistoryFuture([]);
        setIsDirty(true);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0 || !draftConfig) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [draftConfig, ...future]);
    setDraftConfig(previous);
    setIsDirty(true);
  }, [historyPast, draftConfig]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0 || !draftConfig) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, draftConfig]);
    setDraftConfig(next);
    setIsDirty(true);
  }, [historyFuture, draftConfig]);

  const handleSavePreset = useCallback(async () => {
    if (!activePreset || !draftConfig) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setStatusMessage({ type: "error", text: "Preset name cannot be empty." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/annex-presets/${activePreset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          config: draftConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to save preset." });
        return;
      }

      const updated = data.preset as AnnexPresetRecord;
      setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setDraftName(updated.name);
      setIsDirty(false);
      setEditingName(false);
      setStatusMessage({
        type: "success",
        text: `Saved "${updated.name}" & logged audit trail.`,
      });
    } catch (err) {
      console.error("Save preset error:", err);
      setStatusMessage({ type: "error", text: "Network error while saving preset." });
    } finally {
      setSaving(false);
    }
  }, [activePreset, draftConfig, draftName]);

  const handleSetDefault = async () => {
    if (!activePreset) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/annex-presets/${activePreset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to set default." });
        return;
      }
      const updated = data.preset as AnnexPresetRecord;
      setPresets((prev) =>
        prev.map((p) =>
          p.id === updated.id ? updated : { ...p, isDefault: false }
        )
      );
      setStatusMessage({
        type: "success",
        text: `"${updated.name}" is now the default preset for Annex ${selectedAnnexNumber}.`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Failed to set default preset." });
    } finally {
      setSaving(false);
    }
  };

  const uploadTemplateFile = useCallback(
    async (
      file: File,
      options?: {
        mode?: "replace" | "append";
        createNew?: { name: string; description?: string };
      }
    ): Promise<boolean> => {
      const MAX_CLIENT_UPLOAD_BYTES = 15 * 1024 * 1024;
      if (file.size === 0) {
        const msg = "Selected file is empty (0 bytes).";
        setUploadError(msg);
        setStatusMessage({ type: "error", text: msg });
        return false;
      }
      if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
        const msg = "Uploaded template file exceeds the 15 MB limit.";
        setUploadError(msg);
        setStatusMessage({ type: "error", text: msg });
        return false;
      }

      const mode = options?.mode || "replace";
      const shouldCreateNew =
        Boolean(options?.createNew) ||
        !activePreset ||
        (draftConfig?.kind === "BUILT_IN" && activePreset.isDefault);

      setUploadingTemplate(true);
      setUploadError(null);
      setUploadNotice(null);
      setStatusMessage(null);

      try {
        const startPageNumber =
          shouldCreateNew || mode === "replace"
            ? 1
            : (draftConfig?.pages.length ?? 0) + 1;

        const fd = new FormData();
        fd.append("file", file);
        fd.append("annexNumber", String(selectedAnnexNumber));
        if (!shouldCreateNew && activePreset?.id) {
          fd.append("presetId", activePreset.id);
        }
        fd.append("startPageNumber", String(startPageNumber));

        const uploadRes = await fetch("/api/annex-presets/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          const errMsg = uploadData.error || "Upload failed.";
          setUploadError(errMsg);
          setStatusMessage({ type: "error", text: errMsg });
          return false;
        }

        const uploadedPages = (uploadData.pages || []) as PresetPage[];
        if (uploadedPages.length === 0) {
          const errMsg = "Uploaded file produced zero pages.";
          setUploadError(errMsg);
          setStatusMessage({ type: "error", text: errMsg });
          return false;
        }

        if (shouldCreateNew) {
          const cleanStem = file.name.replace(/\.[^/.]+$/, "").trim();
          const newName =
            options?.createNew?.name?.trim() ||
            `Preset ${presets.length + 1}${cleanStem ? ` — ${cleanStem.slice(0, 48)}` : ""}`;

          const baseConfig = draftConfig
            ? (JSON.parse(JSON.stringify(draftConfig)) as AnnexPresetConfig)
            : buildEmptyCustomPresetConfig(selectedAnnexNumber);

          const nextConfig: AnnexPresetConfig = {
            ...baseConfig,
            annexNumber: selectedAnnexNumber,
            kind: "CUSTOM_UPLOAD",
            pages: uploadedPages,
            elements: [],
          };

          const createRes = await fetch("/api/annex-presets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              annexNumber: selectedAnnexNumber,
              name: newName,
              description: options?.createNew?.description?.trim() || undefined,
              kind: "CUSTOM_UPLOAD",
              config: nextConfig,
            }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) {
            const errMsg = createData.error || "Failed to save new custom preset.";
            setUploadError(errMsg);
            setStatusMessage({ type: "error", text: errMsg });
            return false;
          }

          const created = createData.preset as AnnexPresetRecord;
          setPresets((prev) => [...prev, created]);
          loadPresetIntoEditor(created);
          setLeftTab("template");
          const okMsg = `Created "${created.name}" (${uploadedPages.length} ${uploadedPages.length === 1 ? "page" : "pages"}). Drag textboxes onto the canvas.`;
          setUploadNotice(okMsg);
          setStatusMessage({ type: "success", text: okMsg });
          return true;
        }

        if (!activePreset || !draftConfig) return false;

        const nextPages =
          mode === "replace"
            ? uploadedPages
            : [...draftConfig.pages, ...uploadedPages].map((p, idx) => ({
                ...p,
                pageNumber: idx + 1,
              }));

        const validIds = new Set(nextPages.map((p) => p.id));
        const fallbackPageId = nextPages[0]?.id || uploadedPages[0].id;
        const nextElements =
          mode === "replace"
            ? draftConfig.elements.map((el) =>
                validIds.has(el.pageId) ? el : { ...el, pageId: fallbackPageId }
              )
            : draftConfig.elements;

        const nextConfig: AnnexPresetConfig = {
          ...draftConfig,
          kind: "CUSTOM_UPLOAD",
          pages: nextPages,
          elements: nextElements,
        };

        const patchRes = await fetch(`/api/annex-presets/${activePreset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draftName.trim() || activePreset.name,
            config: nextConfig,
          }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) {
          const errMsg = patchData.error || "Uploaded file, but failed to save preset.";
          setUploadError(errMsg);
          setStatusMessage({ type: "error", text: errMsg });
          return false;
        }

        const updated = patchData.preset as AnnexPresetRecord;
        setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        loadPresetIntoEditor(updated);
        setActivePageId(uploadedPages[0].id);
        setLeftTab("template");
        const okMsg = `Loaded & saved ${uploadedPages.length} ${uploadedPages.length === 1 ? "page" : "pages"} from ${file.name}.`;
        setUploadNotice(okMsg);
        setStatusMessage({ type: "success", text: okMsg });
        return true;
      } catch (err) {
        console.error("Preset file upload error:", err);
        const errMsg = "Network error while uploading template file.";
        setUploadError(errMsg);
        setStatusMessage({ type: "error", text: errMsg });
        return false;
      } finally {
        setUploadingTemplate(false);
      }
    },
    [
      activePreset,
      draftConfig,
      draftName,
      loadPresetIntoEditor,
      presets.length,
      selectedAnnexNumber,
    ]
  );

  const handleCreateCustomPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) return;

    setCreatingPreset(true);
    setStatusMessage(null);
    setUploadError(null);
    try {
      if (modalFile) {
        const ok = await uploadTemplateFile(modalFile, {
          createNew: {
            name: trimmed,
            description: newPresetDescription.trim() || undefined,
          },
        });
        if (ok) {
          setCreateModalOpen(false);
          setNewPresetName("");
          setNewPresetDescription("");
          setModalFile(null);
        }
        return;
      }

      const res = await fetch("/api/annex-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annexNumber: selectedAnnexNumber,
          name: trimmed,
          description: newPresetDescription.trim() || undefined,
          kind: "CUSTOM_UPLOAD",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to create preset." });
        return;
      }
      const created = data.preset as AnnexPresetRecord;
      setPresets((prev) => [...prev, created]);
      loadPresetIntoEditor(created);
      setLeftTab("template");
      setCreateModalOpen(false);
      setNewPresetName("");
      setNewPresetDescription("");
      setModalFile(null);
      setStatusMessage({
        type: "success",
        text: `Created "${created.name}". Upload a PDF/Image in the left panel or drag one directly onto the canvas.`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Network error creating preset." });
    } finally {
      setCreatingPreset(false);
    }
  };

  const handleCloneActivePreset = async () => {
    if (!activePreset) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/annex-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annexNumber: selectedAnnexNumber,
          name: `${draftName || activePreset.name} (Copy)`,
          cloneFromId: activePreset.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to clone preset." });
        return;
      }
      const cloned = data.preset as AnnexPresetRecord;
      setPresets((prev) => [...prev, cloned]);
      loadPresetIntoEditor(cloned);
      setStatusMessage({
        type: "success",
        text: `Cloned into "${cloned.name}".`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Failed to clone preset." });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeletePreset = async () => {
    if (!activePreset) return;
    setDeletingPreset(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/annex-presets/${activePreset.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Cannot delete preset." });
        setDeleteConfirmOpen(false);
        return;
      }
      const remaining = presets.filter((p) => p.id !== activePreset.id);
      setDeleteConfirmOpen(false);
      await fetchPresets(selectedAnnexNumber, remaining[0]?.id || null);
      setStatusMessage({
        type: "success",
        text: `Deleted preset "${activePreset.name}".`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Network error deleting preset." });
    } finally {
      setDeletingPreset(false);
    }
  };

  const insertElementAt = useCallback(
    (payload: PaletteDragPayload, xPct: number, yPct: number) => {
      if (!activePage) return;
      const newEl = buildElementFromPayload(
        payload,
        activePage.id,
        selectedAnnexNumber,
        xPct,
        yPct
      );
      mutateConfig((prev) => ({
        ...prev,
        elements: [...prev.elements, newEl],
      }));
      setSelectedElementId(newEl.id);
      setLeftTab("inspector");
    },
    [activePage, selectedAnnexNumber, mutateConfig]
  );

  const handleSelectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
    if (elementId) {
      setLeftTab("inspector");
    }
  }, []);

  const handleDeleteElement = useCallback(
    (elementId: string) => {
      mutateConfig((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== elementId),
      }));
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [mutateConfig, selectedElementId]
  );

  const handleDuplicateElement = useCallback(
    (elementId: string) => {
      if (!draftConfig) return;
      const src = draftConfig.elements.find((el) => el.id === elementId);
      if (!src) return;
      const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const dup: PresetElement = {
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        label: `${src.label} Copy`,
        fieldKey: src.fieldKey ? `${src.fieldKey}_${newId.slice(-4)}` : undefined,
        xPct: Math.min(98 - src.wPct, src.xPct + 2),
        yPct: Math.min(98 - src.hPct, src.yPct + 2),
      };
      mutateConfig((prev) => ({
        ...prev,
        elements: [...prev.elements, dup],
      }));
      setSelectedElementId(newId);
    },
    [draftConfig, mutateConfig]
  );

  // Studio Keyboard Shortcuts (Ctrl+S, Undo/Redo, Arrow Nudge, Delete)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSavePreset();
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (selectedElementId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleDeleteElement(selectedElementId);
          return;
        }

        const step = e.shiftKey ? 2 : 0.5;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          mutateConfig((prev) => ({
            ...prev,
            elements: prev.elements.map((el) => {
              if (el.id !== selectedElementId) return el;
              let { xPct, yPct } = el;
              if (e.key === "ArrowLeft") xPct = Math.max(0, xPct - step);
              if (e.key === "ArrowRight") xPct = Math.min(100 - el.wPct, xPct + step);
              if (e.key === "ArrowUp") yPct = Math.max(0, yPct - step);
              if (e.key === "ArrowDown") yPct = Math.min(100 - el.hPct, yPct + step);
              return {
                ...el,
                xPct: Number(xPct.toFixed(2)),
                yPct: Number(yPct.toFixed(2)),
              };
            }),
          }));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handleSavePreset,
    handleUndo,
    handleRedo,
    handleDeleteElement,
    selectedElementId,
    mutateConfig,
  ]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#55645B] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#1B5E20]" />
        Loading Annex Preset Studio...
      </div>
    );
  }

  if (!user || user.role !== "STAFF") {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-[#D6DDD8] p-8 text-center space-y-4 apple-shadow">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-heading font-bold text-[#1F2A24]">
          Staff Coordinator Access Required
        </h1>
        <p className="text-sm text-[#55645B]">
          Only TDP Staff Coordinators may create, upload templates, or customize Annex Presets. All preset modifications are forensically logged for System Administrators.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Studio Top Bar */}
      <header className="bg-white rounded-2xl border border-[#D6DDD8] p-3.5 sm:px-5 apple-shadow space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-heading font-bold text-[#1F2A24] tracking-tight">
                  Annex Preset Studio
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF1C2] text-[#B88A00] border border-[#F9C733]/40">
                  Staff Editor
                </span>
              </div>
              <p className="text-xs text-[#55645B]">
                Customize Built-in Preset 1 defaults or upload PDFs/images and drop live workspace elements for Annexes 1 & 3–10.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/documents/new?annex=${selectedAnnexNumber}`}
              className="px-3 py-1.5 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] hover:bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] flex items-center gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-[#1B5E20]" />
              Use in Prepare Annex
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setNewPresetName(`Preset ${presets.length + 1} — Custom Annex ${selectedAnnexNumber}`);
                setCreateModalOpen(true);
              }}
              className="text-xs h-8 border-[#1B5E20]/40 text-[#1B5E20] hover:bg-[#F1F8F1]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Custom Preset
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!activePreset || saving}
              onClick={handleSavePreset}
              className="text-xs h-8 bg-[#1B5E20] hover:bg-[#25702A]"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isDirty ? "Save Changes*" : "Saved"}
            </Button>
          </div>
        </div>

        {/* Annex Number Pill Strip + Active Preset Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#D6DDD8]/70">
          {/* Annex Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {PRESET_SUPPORTED_ANNEX_NUMBERS.map((num) => {
              const isSelected = num === selectedAnnexNumber;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setSelectedAnnexNumber(num);
                    router.replace(`/annex-presets?annex=${num}`);
                  }}
                  className={`apple-press px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-[#1B5E20] text-white shadow-2xs"
                      : "bg-[#F6F8F6] text-[#55645B] hover:text-[#1F2A24] hover:bg-[#DCEFDD]/50"
                  }`}
                >
                  Annex {num}
                </button>
              );
            })}
          </div>

          {/* Active Preset Switcher + Actions */}
          {activePreset && (
            <div className="flex flex-wrap items-center gap-1.5">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => {
                      setDraftName(e.target.value);
                      setIsDirty(true);
                    }}
                    aria-label="Rename active preset"
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#1B5E20] focus:outline-none w-56"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="p-1.5 rounded-lg bg-[#DCEFDD] text-[#123F17]"
                    title="Done renaming"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label="Select preset to edit"
                    value={activePresetId}
                    onChange={(e) => {
                      const found = presets.find((p) => p.id === e.target.value);
                      if (found) loadPresetIntoEditor(found);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] text-[#1F2A24] focus:ring-2 focus:ring-[#1B5E20] outline-none max-w-[260px]"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault ? "★" : ""} ({p.kind === "BUILT_IN" ? "Built-in" : "Custom"})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    title="Rename Preset"
                    className="p-1.5 rounded-lg border border-[#D6DDD8] bg-white hover:bg-[#F1F8F1] text-[#1F2A24] apple-press"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={activePreset.isDefault || saving}
                onClick={handleSetDefault}
                title={activePreset.isDefault ? "Default Preset" : "Set as Default Preset"}
                className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 apple-press ${
                  activePreset.isDefault
                    ? "bg-[#FFF1C2] border-[#F9C733]/50 text-[#B88A00]"
                    : "bg-white border-[#D6DDD8] text-[#55645B] hover:text-[#1F2A24]"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${activePreset.isDefault ? "fill-[#F2B705]" : ""}`} />
                <span className="hidden md:inline">
                  {activePreset.isDefault ? "Default" : "Set Default"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCloneActivePreset}
                disabled={saving}
                title="Duplicate Preset"
                className="p-1.5 rounded-lg border border-[#D6DDD8] bg-white hover:bg-[#F1F8F1] text-[#1F2A24] apple-press"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <div className="inline-flex rounded-lg border border-[#D6DDD8] bg-white overflow-hidden">
                <button
                  type="button"
                  disabled={historyPast.length === 0}
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 hover:bg-[#F1F8F1] text-[#1F2A24] disabled:opacity-30"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={historyFuture.length === 0}
                  onClick={handleRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 border-l border-[#D6DDD8] hover:bg-[#F1F8F1] text-[#1F2A24] disabled:opacity-30"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={presets.length <= 1 || deletingPreset}
                onClick={() => setDeleteConfirmOpen(true)}
                title={
                  presets.length <= 1
                    ? "Cannot delete the last remaining preset"
                    : "Delete Preset"
                }
                className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-35 apple-press"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Inline Feedback Toast / Banner */}
        {statusMessage && (
          <div
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
              statusMessage.type === "success"
                ? "bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {statusMessage.text}
            </span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="p-0.5 rounded hover:bg-black/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Main 3-Column Studio Layout: Left = Controls | Middle = Editor | Right = Palette */}
      {loadingPresets || !draftConfig || !activePage ? (
        <div className="bg-white rounded-2xl border border-[#D6DDD8] p-12 flex flex-col items-center justify-center gap-3 text-[#55645B] apple-shadow">
          <Loader2 className="w-6 h-6 animate-spin text-[#1B5E20]" />
          <p className="text-sm font-medium">
            Loading Annex {selectedAnnexNumber} studio workspace...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)_250px] xl:grid-cols-[320px_minmax(0,1fr)_280px] gap-4 items-stretch lg:h-[calc(100vh-225px)] min-h-[620px]">
          {/* LEFT COLUMN: Controls, Retained Settings & Element Inspector */}
          <StudioLeftControls
            annexNumber={selectedAnnexNumber}
            config={draftConfig}
            activePageId={activePage.id}
            selectedElementId={selectedElementId}
            activeTab={leftTab}
            isPresetDefault={Boolean(activePreset?.isDefault)}
            uploadingTemplate={uploadingTemplate}
            uploadError={uploadError}
            uploadNotice={uploadNotice}
            onUploadTemplateFile={(file, mode) =>
              uploadTemplateFile(file, { mode })
            }
            onTabChange={setLeftTab}
            onSelectPage={(pageId) => {
              setActivePageId(pageId);
              setSelectedElementId(null);
            }}
            onSelectElement={handleSelectElement}
            onChangeConfig={mutateConfig}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
          />

          {/* MIDDLE COLUMN: Interactive PDF / Blueprint Editor Canvas */}
          <StudioCanvas
            config={draftConfig}
            activePage={activePage}
            selectedElementId={selectedElementId}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            onSelectPage={(pageId) => {
              setActivePageId(pageId);
              setSelectedElementId(null);
            }}
            onSelectElement={handleSelectElement}
            onCommitElementGeometry={(elId, rect) => {
              mutateConfig((prev) => ({
                ...prev,
                elements: prev.elements.map((el) =>
                  el.id === elId ? { ...el, ...rect } : el
                ),
              }));
            }}
            onDropCreateElement={insertElementAt}
            onUploadTemplateFile={(file) => {
              void uploadTemplateFile(file, { mode: "replace" });
            }}
          />

          {/* RIGHT COLUMN: Drag & Drop Functions Palette */}
          <StudioRightPalette
            annexNumber={selectedAnnexNumber}
            modules={draftConfig.modules}
            onInsertElement={(payload) => insertElementAt(payload, 50, 32)}
          />
        </div>
      )}

      {/* Create New Custom Preset Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomPreset}
            className="bg-white rounded-2xl border border-[#D6DDD8] max-w-md w-full p-6 space-y-4 apple-shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-[#1F2A24]">
                Create Custom Annex {selectedAnnexNumber} Preset
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setModalFile(null);
                  setUploadError(null);
                }}
                className="p-1 rounded-lg text-[#55645B] hover:bg-[#F6F8F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#55645B]">
              Attach a PDF or image right away (or leave blank to upload later), then drag textboxes, dates, logos, or dynamic tables onto it.
            </p>
            <div>
              <label
                htmlFor="new-preset-name"
                className="block text-xs font-semibold text-[#1F2A24] mb-1"
              >
                Preset Name
              </label>
              <input
                id="new-preset-name"
                type="text"
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={`Preset ${presets.length + 1} — Revised CHED Format`}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="new-preset-desc"
                className="block text-xs font-semibold text-[#1F2A24] mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                id="new-preset-desc"
                rows={2}
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="e.g., 2026 UniFAST Memorandum revised layout"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="new-preset-file"
                className="block text-xs font-semibold text-[#1F2A24] mb-1"
              >
                PDF / Image Template File (Optional)
              </label>
              <label
                htmlFor="new-preset-file"
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("Files")) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDrop={(e) => {
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    e.preventDefault();
                    setModalFile(e.dataTransfer.files[0]);
                    setUploadError(null);
                  }
                }}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#1B5E20]/50 bg-[#F1F8F1]/60 hover:bg-[#DCEFDD]/40 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2 text-xs text-[#123F17] min-w-0">
                  <FileUp className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <span className="truncate font-medium">
                    {modalFile
                      ? `${modalFile.name} (${(modalFile.size / 1024).toFixed(0)} KB)`
                      : "Choose or drop PDF, PNG, JPG, or WebP (max 15 MB)"}
                  </span>
                </span>
                {modalFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalFile(null);
                      setUploadError(null);
                    }}
                    className="text-[11px] font-semibold text-red-700 hover:underline shrink-0"
                  >
                    Remove
                  </button>
                )}
              </label>
              <input
                id="new-preset-file"
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setModalFile(f);
                  setUploadError(null);
                  e.currentTarget.value = "";
                }}
                className="hidden"
              />
            </div>

            {uploadError && (
              <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false);
                  setModalFile(null);
                  setUploadError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creatingPreset || uploadingTemplate}>
                {creatingPreset || uploadingTemplate
                  ? modalFile
                    ? "Uploading & Creating..."
                    : "Creating..."
                  : modalFile
                  ? "Create & Upload PDF/Image"
                  : "Create Custom Preset"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Preset Confirmation Modal */}
      {deleteConfirmOpen && activePreset && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D6DDD8] max-w-md w-full p-6 space-y-4 apple-shadow">
            <h2 className="text-lg font-heading font-bold text-[#1F2A24]">
              Delete Preset?
            </h2>
            <p className="text-sm text-[#55645B]">
              Are you sure you want to delete <strong>{activePreset.name}</strong>? Existing documents already created with this preset retain their frozen snapshot and will not be affected.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deletingPreset}
                onClick={handleConfirmDeletePreset}
              >
                {deletingPreset ? "Deleting..." : "Delete Preset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnnexPresetsStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-[#55645B] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1B5E20]" />
          Loading Annex Preset Studio...
        </div>
      }
    >
      <AnnexPresetsStudioInner />
    </Suspense>
  );
}
