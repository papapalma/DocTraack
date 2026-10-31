"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChedLogo, UniFastLogo } from "@/components/documents/ched-unifast-logos";
import { LogoConfig, LogoPresetId, HeaderLogosConfig } from "@/types";
import { cn } from "@/lib/utils";

interface GlobalBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (logos: HeaderLogosConfig) => void;
}

const PRESET_OPTIONS: { id: LogoPresetId; label: string }[] = [
  { id: "ched", label: "CHED Official" },
  { id: "unifast", label: "UniFAST Official" },
  { id: "minsu", label: "MinSU University" },
  { id: "none", label: "None / Blank" },
];

export function GlobalBrandingModal({
  isOpen,
  onClose,
  onSaved,
}: GlobalBrandingModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [leftLogo, setLeftLogo] = useState<LogoConfig>({
    type: "preset",
    presetId: "ched",
    alt: "CHED Logo",
  });
  const [rightLogo, setRightLogo] = useState<LogoConfig>({
    type: "preset",
    presetId: "unifast",
    alt: "UniFAST Logo",
  });

  const [uploadingSide, setUploadingSide] = useState<"left" | "right" | null>(null);

  // Load existing global settings
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.logos) {
          if (data.logos.leftLogo) setLeftLogo(data.logos.leftLogo);
          if (data.logos.rightLogo) setRightLogo(data.logos.rightLogo);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load branding:", err);
        if (mounted) setError("Could not load current branding settings.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleFileUpload = async (file: File, side: "left" | "right") => {
    try {
      setUploadingSide(side);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("position", side);

      const res = await fetch("/api/branding/logo/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Upload failed");
      }

      const newLogo: LogoConfig = {
        type: "custom",
        url: json.url,
        alt: file.name.replace(/\.[^/.]+$/, ""),
      };

      if (side === "left") {
        setLeftLogo(newLogo);
      } else {
        setRightLogo(newLogo);
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Failed to upload logo.";
      setError(message);
    } finally {
      setUploadingSide(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload: HeaderLogosConfig = {
        leftLogo,
        rightLogo,
      };

      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save global branding");
      }

      setSuccess(true);
      if (onSaved) onSaved(payload);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      console.error("Save branding error:", err);
      const message = err instanceof Error ? err.message : "Failed to save global defaults.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setLeftLogo({
      type: "preset",
      presetId: "ched",
      alt: "CHED Logo",
    });
    setRightLogo({
      type: "preset",
      presetId: "unifast",
      alt: "UniFAST Logo",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col transform transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 text-white px-6 py-4 flex items-center justify-between border-b border-minsu-green-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-minsu-gold-500/20 border border-minsu-gold-500/30 flex items-center justify-center text-minsu-gold-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Global Annex Document Branding
              </h2>
              <p className="text-xs text-minsu-green-100">
                Configure default institutional letterhead logos across all TDP Annexes
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-minsu-green-100 text-minsu-green-700 border border-minsu-green-600/30 rounded-xl text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>Global branding defaults saved and updated on disk successfully!</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-minsu-green-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-ink-muted">Loading branding configurations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT LOGO COLUMN */}
              <div className="p-4 rounded-xl border border-line bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Left Header Logo
                  </span>
                  <span className="text-[10px] bg-minsu-gold-100 text-minsu-gold-600 font-semibold px-2 py-0.5 rounded-full border border-minsu-gold-400/30">
                    Default: CHED
                  </span>
                </div>

                {/* Preview Box */}
                <div className="w-24 h-24 mx-auto rounded-xl bg-white border border-line p-2 shadow-xs flex items-center justify-center">
                  {leftLogo.type === "preset" ? (
                    leftLogo.presetId === "ched" ? (
                      <ChedLogo className="w-16 h-16" />
                    ) : leftLogo.presetId === "unifast" ? (
                      <UniFastLogo className="w-16 h-16" />
                    ) : leftLogo.presetId === "minsu" ? (
                      <img src="/logo.png" alt="MinSU" className="w-16 h-16 object-contain" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-neutral-400" />
                    )
                  ) : leftLogo.url ? (
                    <img src={leftLogo.url} alt="Custom" className="w-16 h-16 object-contain" />
                  ) : null}
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-ink-muted block">Choose Preset:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setLeftLogo({
                            type: "preset",
                            presetId: opt.id,
                            alt: opt.label,
                          })
                        }
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all apple-press text-center",
                          leftLogo.type === "preset" && leftLogo.presetId === opt.id
                            ? "bg-minsu-green-700 text-white border-minsu-green-700 shadow-xs"
                            : "bg-white text-ink border-line hover:bg-neutral-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload Trigger */}
                <div className="pt-1">
                  <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-minsu-green-600/40 bg-minsu-green-50/50 hover:bg-minsu-green-50 cursor-pointer transition-all apple-press text-xs font-semibold text-minsu-green-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingSide === "left" ? "Uploading to disk..." : "Upload New File"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingSide !== null}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "left");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* RIGHT LOGO COLUMN */}
              <div className="p-4 rounded-xl border border-line bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Right Header Logo
                  </span>
                  <span className="text-[10px] bg-minsu-gold-100 text-minsu-gold-600 font-semibold px-2 py-0.5 rounded-full border border-minsu-gold-400/30">
                    Default: UniFAST
                  </span>
                </div>

                {/* Preview Box */}
                <div className="w-24 h-24 mx-auto rounded-xl bg-white border border-line p-2 shadow-xs flex items-center justify-center">
                  {rightLogo.type === "preset" ? (
                    rightLogo.presetId === "ched" ? (
                      <ChedLogo className="w-16 h-16" />
                    ) : rightLogo.presetId === "unifast" ? (
                      <UniFastLogo className="w-16 h-16" />
                    ) : rightLogo.presetId === "minsu" ? (
                      <img src="/logo.png" alt="MinSU" className="w-16 h-16 object-contain" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-neutral-400" />
                    )
                  ) : rightLogo.url ? (
                    <img src={rightLogo.url} alt="Custom" className="w-16 h-16 object-contain" />
                  ) : null}
                </div>

                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-ink-muted block">Choose Preset:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setRightLogo({
                            type: "preset",
                            presetId: opt.id,
                            alt: opt.label,
                          })
                        }
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all apple-press text-center",
                          rightLogo.type === "preset" && rightLogo.presetId === opt.id
                            ? "bg-minsu-green-700 text-white border-minsu-green-700 shadow-xs"
                            : "bg-white text-ink border-line hover:bg-neutral-100"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload Trigger */}
                <div className="pt-1">
                  <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-minsu-green-600/40 bg-minsu-green-50/50 hover:bg-minsu-green-50 cursor-pointer transition-all apple-press text-xs font-semibold text-minsu-green-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingSide === "right" ? "Uploading to disk..." : "Upload New File"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingSide !== null}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "right");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-line flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            disabled={saving || loading}
            className="text-xs text-neutral-600 hover:text-neutral-900 apple-press"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset to CHED & UniFAST
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-xs apple-press"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving || loading}
              className="text-xs bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-semibold apple-press"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {saving ? "Saving to Disk..." : "Save Global Defaults"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
