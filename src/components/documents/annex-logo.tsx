"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Pencil,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { ChedLogo, UniFastLogo } from "./ched-unifast-logos";
import { Button } from "@/components/ui/button";
import { LogoConfig, LogoPresetId } from "@/types";
import { cn } from "@/lib/utils";

interface AnnexLogoProps {
  position: "left" | "right";
  config?: LogoConfig;
  defaultPreset?: LogoPresetId;
  editable?: boolean;
  documentId?: string;
  className?: string;
  onLogoChange?: (newConfig: LogoConfig) => void;
}

const PRESET_OPTIONS: { id: LogoPresetId; label: string; description: string }[] = [
  { id: "ched", label: "CHED Official", description: "Commission on Higher Education Seal" },
  { id: "unifast", label: "UniFAST Official", description: "Tertiary Education Subsidy Seal" },
  { id: "minsu", label: "MinSU University", description: "Mindoro State University Crest" },
  { id: "none", label: "None / Hide", description: "Leave header space blank" },
];

export function AnnexLogo({
  position,
  config,
  defaultPreset,
  editable = false,
  documentId,
  className = "w-16 h-16",
  onLogoChange,
}: AnnexLogoProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Resolved effective config
  const effectivePreset: LogoPresetId = defaultPreset || (position === "left" ? "ched" : "unifast");
  const currentConfig: LogoConfig = config || {
    type: "preset",
    presetId: effectivePreset,
    alt: position === "left" ? "CHED Logo" : "UniFAST Logo",
  };

  // Render the logo graphic based on config
  const renderGraphic = () => {
    if (currentConfig.type === "preset") {
      switch (currentConfig.presetId) {
        case "ched":
          return <ChedLogo className={cn("object-contain", className)} />;
        case "unifast":
          return <UniFastLogo className={cn("object-contain", className)} />;
        case "minsu":
          return (
            <div className={cn("relative flex items-center justify-center", className)}>
              <img
                src="/logo.png"
                alt="MinSU Logo"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
          );
        case "none":
          return <div className={cn("opacity-0 pointer-events-none", className)} />;
        default:
          return position === "left" ? (
            <ChedLogo className={cn("object-contain", className)} />
          ) : (
            <UniFastLogo className={cn("object-contain", className)} />
          );
      }
    }

    // Custom uploaded streamed URL
    if (currentConfig.url) {
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <img
            src={currentConfig.url}
            alt={currentConfig.alt || "Custom Annex Logo"}
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>
      );
    }

    // Fallback to default
    return position === "left" ? (
      <ChedLogo className={cn("object-contain", className)} />
    ) : (
      <UniFastLogo className={cn("object-contain", className)} />
    );
  };

  return (
    <>
      <div
        className={cn(
          "relative group inline-flex items-center justify-center select-none",
          editable && "cursor-pointer"
        )}
        onClick={() => {
          if (editable) setIsModalOpen(true);
        }}
        title={editable ? `Click to customize ${position} header logo` : undefined}
      >
        {renderGraphic()}

        {/* Hover / Edit Badge for Editable Mode (Hidden in Print) */}
        {editable && (
          <div className="absolute inset-0 rounded-lg bg-black/35 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center text-white apple-press print:hidden shadow-xs border border-white/30">
            <div className="flex items-center gap-1 bg-minsu-green-700/90 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight shadow-md">
              <Pencil className="w-3 h-3 text-minsu-gold-400" />
              <span>Change</span>
            </div>
          </div>
        )}
      </div>

      {/* Apple-styled Fluid Logo Editor Modal */}
      {isModalOpen && (
        <AnnexLogoEditorModal
          position={position}
          currentConfig={currentConfig}
          defaultPreset={effectivePreset}
          documentId={documentId}
          onClose={() => setIsModalOpen(false)}
          onSave={(newConfig) => {
            if (onLogoChange) {
              onLogoChange(newConfig);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}

interface AnnexLogoEditorModalProps {
  position: "left" | "right";
  currentConfig: LogoConfig;
  defaultPreset: LogoPresetId;
  documentId?: string;
  onClose: () => void;
  onSave: (config: LogoConfig) => void;
}

export function AnnexLogoEditorModal({
  position,
  currentConfig,
  defaultPreset,
  documentId,
  onClose,
  onSave,
}: AnnexLogoEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "upload">(
    currentConfig.type === "custom" ? "upload" : "preset"
  );
  const [selectedPreset, setSelectedPreset] = useState<LogoPresetId>(
    currentConfig.type === "preset" ? currentConfig.presetId || defaultPreset : defaultPreset
  );
  const [customUrl, setCustomUrl] = useState<string>(currentConfig.url || "");
  const [altText, setAltText] = useState<string>(currentConfig.alt || "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle file upload
  const handleFile = async (file: File) => {
    setUploadError(null);

    // Validation
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid image type. Please select a PNG, JPG, WebP, or SVG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image exceeds 5MB size limit.");
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);
      data.append("position", position);
      if (documentId) data.append("documentId", documentId);

      const res = await fetch("/api/branding/logo/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload logo");
      }

      setCustomUrl(json.url);
      setAltText(file.name.replace(/\.[^/.]+$/, ""));
      setActiveTab("upload");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Failed to upload image to disk.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (activeTab === "preset") {
      onSave({
        type: "preset",
        presetId: selectedPreset,
        alt: PRESET_OPTIONS.find((p) => p.id === selectedPreset)?.label || "Logo",
      });
    } else {
      if (!customUrl) {
        setUploadError("Please upload an image or choose a preset.");
        return;
      }
      onSave({
        type: "custom",
        url: customUrl,
        alt: altText || "Custom Annex Logo",
      });
    }
  };

  const handleReset = () => {
    onSave({
      type: "preset",
      presetId: defaultPreset,
      alt: defaultPreset === "ched" ? "CHED Logo" : "UniFAST Logo",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 text-white px-6 py-4 flex items-center justify-between border-b border-minsu-green-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-minsu-gold-500/20 border border-minsu-gold-500/30 flex items-center justify-center text-minsu-gold-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading capitalize text-white">
                Customize {position} Logo
              </h2>
              <p className="text-xs text-minsu-green-100">
                Annex official letterhead configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center apple-press transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Apple Segmented Style) */}
        <div className="p-4 pb-0 bg-neutral-50/50 border-b border-line">
          <div className="grid grid-cols-2 p-1 bg-neutral-200/70 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("preset")}
              className={cn(
                "py-1.5 px-3 rounded-lg transition-all duration-200 apple-press flex items-center justify-center gap-1.5",
                activeTab === "preset"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-minsu-gold-600" />
              <span>Official Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "py-1.5 px-3 rounded-lg transition-all duration-200 apple-press flex items-center justify-center gap-1.5",
                activeTab === "upload"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <Upload className="w-3.5 h-3.5 text-minsu-green-700" />
              <span>Upload Custom</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: PRESETS */}
          {activeTab === "preset" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Select Official Preset
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_OPTIONS.map((opt) => {
                  const isSelected = selectedPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPreset(opt.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 apple-press relative",
                        isSelected
                          ? "border-minsu-green-700 bg-minsu-green-50/80 ring-2 ring-minsu-green-700/20 shadow-xs"
                          : "border-line bg-white hover:bg-neutral-50 hover:border-neutral-400"
                      )}
                    >
                      {/* Active indicator badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-minsu-green-700 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}

                      {/* Graphic Preview */}
                      <div className="w-14 h-14 flex items-center justify-center mb-2">
                        {opt.id === "ched" && <ChedLogo className="w-12 h-12" />}
                        {opt.id === "unifast" && <UniFastLogo className="w-12 h-12" />}
                        {opt.id === "minsu" && (
                          <img
                            src="/logo.png"
                            alt="MinSU"
                            className="w-12 h-12 object-contain"
                          />
                        )}
                        {opt.id === "none" && (
                          <div className="w-10 h-10 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
                            <EyeOff className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-bold text-ink">{opt.label}</div>
                      <div className="text-[10px] text-ink-muted leading-tight mt-0.5">
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  Upload & Stream Logo from Disk
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 apple-press flex flex-col items-center justify-center space-y-2",
                    dragActive
                      ? "border-minsu-green-700 bg-minsu-green-50 ring-4 ring-minsu-green-700/10"
                      : "border-line bg-neutral-50/50 hover:bg-neutral-50 hover:border-minsu-green-600"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploading ? (
                    <div className="space-y-2 py-4">
                      <div className="w-8 h-8 border-3 border-minsu-green-700 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-minsu-green-700">
                        Saving logo to disk & preparing stream...
                      </p>
                    </div>
                  ) : customUrl ? (
                    <div className="space-y-2">
                      <div className="w-20 h-20 mx-auto rounded-xl border border-line bg-white p-2 shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src={customUrl}
                          alt="Uploaded Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs font-bold text-minsu-green-700 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Logo Uploaded & Ready
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Click or drag to replace image
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-minsu-green-100 text-minsu-green-700 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-minsu-green-700">
                          Click to upload
                        </span>{" "}
                        <span className="text-xs text-ink-muted">or drag & drop</span>
                      </div>
                      <p className="text-[10px] text-ink-muted">
                        PNG, JPG, WebP or SVG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {customUrl && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-ink-muted">
                    Streamed Media URL (Saved on Disk)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={customUrl}
                    className="w-full text-xs font-mono bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg border border-line select-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Live Header Preview Pill */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-line flex items-center justify-between">
            <div className="text-xs font-medium text-ink-muted">Preview in Header:</div>
            <div className="w-14 h-14 bg-white rounded-lg border border-line p-1 shadow-2xs flex items-center justify-center">
              {activeTab === "preset" ? (
                selectedPreset === "ched" ? (
                  <ChedLogo className="w-12 h-12" />
                ) : selectedPreset === "unifast" ? (
                  <UniFastLogo className="w-12 h-12" />
                ) : selectedPreset === "minsu" ? (
                  <img src="/logo.png" alt="MinSU" className="w-12 h-12 object-contain" />
                ) : (
                  <EyeOff className="w-5 h-5 text-neutral-400" />
                )
              ) : customUrl ? (
                <img src={customUrl} alt="Custom" className="w-12 h-12 object-contain" />
              ) : (
                <ImageIcon className="w-5 h-5 text-neutral-300" />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-line flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-neutral-600 hover:text-neutral-900 apple-press"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs apple-press"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              disabled={uploading}
              className="text-xs bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-semibold apple-press"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Apply to Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
