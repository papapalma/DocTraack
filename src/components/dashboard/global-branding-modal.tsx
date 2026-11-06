"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  X,
  Upload,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Trash2,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LogoConfig,
  LogoPresetId,
  HeaderLogosConfig,
  LogoLibraryItem,
} from "@/types";
import { cn } from "@/lib/utils";

interface GlobalBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (logos: HeaderLogosConfig) => void;
}

export function GlobalBrandingModal({
  isOpen,
  onClose,
  onSaved,
}: GlobalBrandingModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [leftLogo, setLeftLogo] = useState<LogoConfig>({
    type: "custom",
    url: "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png",
    alt: "Institutional Left Seal",
  });
  const [rightLogo, setRightLogo] = useState<LogoConfig>({
    type: "custom",
    url: "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
    alt: "Institutional Right Seal",
  });
  const [library, setLibrary] = useState<LogoLibraryItem[]>([]);

  const [uploadingSide, setUploadingSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key & scroll lock
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Load existing global settings & logo library
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSuccess(false);

    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.logos) {
          if (data.logos.leftLogo) setLeftLogo(data.logos.leftLogo);
          if (data.logos.rightLogo) setRightLogo(data.logos.rightLogo);
          if (Array.isArray(data.logos.library)) setLibrary(data.logos.library);
        }
        if (Array.isArray(data.library)) {
          setLibrary(data.library);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load branding:", err);
        if (isMounted) setError("Could not load current branding settings.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
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

      const uploadedLogo: LogoConfig = {
        type: "custom",
        url: json.url,
        alt: json.libraryItem?.name || `Custom ${side} logo`,
      };

      if (side === "left") {
        setLeftLogo(uploadedLogo);
      } else {
        setRightLogo(uploadedLogo);
      }

      if (json.libraryItem) {
        setLibrary((prev) => {
          const exists = prev.some((item) => item.url === json.libraryItem.url);
          if (exists) return prev;
          return [json.libraryItem, ...prev];
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setUploadingSide(null);
    }
  };

  const handleDeleteLibraryItem = async (e: React.MouseEvent, item: LogoLibraryItem) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove "${item.name}" from the Institutional Logo Library?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branding?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove item");

      setLibrary((prev) => prev.filter((i) => i.id !== item.id && i.url !== item.url));

      // If active logo was deleted, revert that slot to default uploaded logo or blank
      if (leftLogo.type === "custom" && leftLogo.url === item.url) {
        setLeftLogo({ type: "custom", url: "/logo.png", alt: "MinSU University Crest" });
      }
      if (rightLogo.type === "custom" && rightLogo.url === item.url) {
        setRightLogo({ type: "custom", url: "/logo.png", alt: "MinSU University Crest" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete item.";
      setError(message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leftLogo,
          rightLogo,
          library,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update branding.");
      }

      setSuccess(true);
      if (onSaved) {
        onSaved({ leftLogo, rightLogo, library });
      }

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save global defaults.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setLeftLogo({
      type: "custom",
      url: "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png",
      alt: "Institutional Left Seal",
    });
    setRightLogo({
      type: "custom",
      url: "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
      alt: "Institutional Right Seal",
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain p-3 sm:p-6 flex min-h-full items-center justify-center"
        >
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Dialog Card with Apple spring motion & proper vertical sizing */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
              mass: 0.85,
            }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] border border-[#D6DDD8] overflow-hidden flex flex-col my-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Branded MinSU Green Gradient Header */}
            <div className="bg-gradient-to-r from-[#123F17] via-[#164D1C] to-[#1B5E20] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#123F17] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F2B705]/20 border border-[#F2B705]/30 flex items-center justify-center text-[#F9C733] shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold font-heading text-white truncate">
                    Global Annex Document Branding
                  </h2>
                  <p className="text-xs text-[#DCEFDD] truncate">
                    Institutional header logo defaults & persistent logo library for all TDP Annexes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center apple-press transition-colors shrink-0 ml-2"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto apple-scrollbar flex-1 max-h-[calc(92vh-140px)]">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/30 rounded-xl text-xs font-semibold">
                  <Check className="w-4 h-4 shrink-0 text-[#1B5E20]" />
                  <span>Global branding defaults saved and synchronized across all Annex documents!</span>
                </div>
              )}

              {loading ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#55645B]">Loading branding settings and logo library...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* LEFT LOGO COLUMN */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/70 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1B5E20]" />
                          Left Header Logo
                        </span>
                        <span className="text-[10px] bg-[#FFF1C2] text-[#8C6B00] font-semibold px-2 py-0.5 rounded-full border border-[#F2B705]/40">
                          Default: CHED
                        </span>
                      </div>

                      {/* Animated Logo Preview Box */}
                      <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-[#D6DDD8] p-3 shadow-xs flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={leftLogo.url || "none"}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-20 h-20 flex items-center justify-center"
                          >
                            {leftLogo.url ? (
                              <img src={leftLogo.url} alt={leftLogo.alt || "Custom"} className="w-20 h-20 object-contain drop-shadow-xs" />
                            ) : (
                              <EyeOff className="w-8 h-8 text-neutral-400" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Institutional Logo Library Selection */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-[#1B5E20] uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#B88A00]" />
                            Institutional Logo Library:
                          </span>
                          <span className="text-[10px] text-[#55645B] font-normal">
                            ({library.length})
                          </span>
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto apple-scrollbar pr-0.5">
                          {/* Blank / None option */}
                          <div
                            onClick={() =>
                              setLeftLogo({
                                type: "custom",
                                url: "",
                                alt: "None / Blank",
                              })
                            }
                            className={cn(
                              "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all apple-press",
                              !leftLogo.url
                                ? "bg-[#DCEFDD] border-[#1B5E20] text-[#123F17] ring-1 ring-[#1B5E20]/20 font-semibold"
                                : "bg-white border-[#D6DDD8] hover:bg-[#F1F8F1] text-[#1F2A24]"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-[#D6DDD8] flex items-center justify-center shrink-0 text-neutral-400">
                                <EyeOff className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs truncate">None / Blank</span>
                            </div>
                            {!leftLogo.url && (
                              <span className="text-[10px] bg-[#1B5E20] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Active
                              </span>
                            )}
                          </div>

                          {library.map((item) => {
                            const isSelected = leftLogo.url === item.url;
                            return (
                              <div
                                key={item.id}
                                onClick={() =>
                                  setLeftLogo({
                                    type: "custom",
                                    url: item.url,
                                    alt: item.name,
                                  })
                                }
                                className={cn(
                                  "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all apple-press",
                                  isSelected
                                    ? "bg-[#DCEFDD] border-[#1B5E20] text-[#123F17] ring-1 ring-[#1B5E20]/20 font-semibold"
                                    : "bg-white border-[#D6DDD8] hover:bg-[#F1F8F1] text-[#1F2A24]"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D6DDD8] p-0.5 flex items-center justify-center shrink-0">
                                    <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-xs truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isSelected && (
                                    <span className="text-[10px] bg-[#1B5E20] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      Active
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteLibraryItem(e, item)}
                                    className="p-1 text-[#55645B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove from library"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* File Upload Trigger */}
                    <div className="pt-2">
                      <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-[#1B5E20]/50 bg-[#DCEFDD]/40 hover:bg-[#DCEFDD]/70 cursor-pointer transition-all apple-press text-xs font-semibold text-[#1B5E20] shadow-xs">
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingSide === "left" ? "Uploading & saving to disk..." : "Upload New Institutional Logo"}
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
                  <div className="p-4 sm:p-5 rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/70 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#B88A00]" />
                          Right Header Logo
                        </span>
                        <span className="text-[10px] bg-[#FFF1C2] text-[#8C6B00] font-semibold px-2 py-0.5 rounded-full border border-[#F2B705]/40">
                          Default: UniFAST
                        </span>
                      </div>

                      {/* Animated Logo Preview Box */}
                      <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-[#D6DDD8] p-3 shadow-xs flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={rightLogo.url || "none"}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-20 h-20 flex items-center justify-center"
                          >
                            {rightLogo.url ? (
                              <img src={rightLogo.url} alt={rightLogo.alt || "Custom"} className="w-20 h-20 object-contain drop-shadow-xs" />
                            ) : (
                              <EyeOff className="w-8 h-8 text-neutral-400" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Institutional Logo Library Selection */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-[#1B5E20] uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#B88A00]" />
                            Institutional Logo Library:
                          </span>
                          <span className="text-[10px] text-[#55645B] font-normal">
                            ({library.length})
                          </span>
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto apple-scrollbar pr-0.5">
                          {/* Blank / None option */}
                          <div
                            onClick={() =>
                              setRightLogo({
                                type: "custom",
                                url: "",
                                alt: "None / Blank",
                              })
                            }
                            className={cn(
                              "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all apple-press",
                              !rightLogo.url
                                ? "bg-[#DCEFDD] border-[#1B5E20] text-[#123F17] ring-1 ring-[#1B5E20]/20 font-semibold"
                                : "bg-white border-[#D6DDD8] hover:bg-[#F1F8F1] text-[#1F2A24]"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-[#D6DDD8] flex items-center justify-center shrink-0 text-neutral-400">
                                <EyeOff className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs truncate">None / Blank</span>
                            </div>
                            {!rightLogo.url && (
                              <span className="text-[10px] bg-[#1B5E20] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Active
                              </span>
                            )}
                          </div>

                          {library.map((item) => {
                            const isSelected = rightLogo.url === item.url;
                            return (
                              <div
                                key={item.id}
                                onClick={() =>
                                  setRightLogo({
                                    type: "custom",
                                    url: item.url,
                                    alt: item.name,
                                  })
                                }
                                className={cn(
                                  "p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all apple-press",
                                  isSelected
                                    ? "bg-[#DCEFDD] border-[#1B5E20] text-[#123F17] ring-1 ring-[#1B5E20]/20 font-semibold"
                                    : "bg-white border-[#D6DDD8] hover:bg-[#F1F8F1] text-[#1F2A24]"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-white border border-[#D6DDD8] p-0.5 flex items-center justify-center shrink-0">
                                    <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-xs truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isSelected && (
                                    <span className="text-[10px] bg-[#1B5E20] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      Active
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteLibraryItem(e, item)}
                                    className="p-1 text-[#55645B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove from library"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* File Upload Trigger */}
                    <div className="pt-2">
                      <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-[#1B5E20]/50 bg-[#DCEFDD]/40 hover:bg-[#DCEFDD]/70 cursor-pointer transition-all apple-press text-xs font-semibold text-[#1B5E20] shadow-xs">
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingSide === "right" ? "Uploading & saving to disk..." : "Upload New Institutional Logo"}
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

            {/* Modal Action Footer */}
            <div className="px-5 sm:px-6 py-4 bg-[#F6F8F6] border-t border-[#D6DDD8] flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                disabled={saving || loading}
                className="text-xs text-[#55645B] hover:text-[#1F2A24] apple-press"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset to Default Seals
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                  className="text-xs apple-press rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="text-xs bg-[#1B5E20] hover:bg-[#164D1C] text-white font-semibold apple-press rounded-xl shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {saving ? "Saving to Disk..." : "Save Global Defaults"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
