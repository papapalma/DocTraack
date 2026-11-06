"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  X,
  Upload,
  Check,
  Building2,
  Trash2,
  Sparkles,
  AlertCircle,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoConfig, LogoLibraryItem } from "@/types";
import { cn } from "@/lib/utils";

interface CertificateLogoRendererProps {
  config?: LogoConfig;
  fallbackUrl?: string;
  className?: string;
  alt?: string;
}

export function CertificateLogoRenderer({
  config,
  fallbackUrl = "/logo.png",
  className = "w-full h-full",
  alt = "Institutional Seal",
}: CertificateLogoRendererProps) {
  const [imageError, setImageError] = useState(false);
  const targetUrl = config?.url || fallbackUrl;

  useEffect(() => {
    setImageError(false);
  }, [targetUrl]);

  if (!targetUrl || imageError) {
    if (fallbackUrl && targetUrl !== fallbackUrl && !imageError) {
      return (
        <img
          src={fallbackUrl}
          alt={alt}
          className={cn("w-full h-full object-contain", className)}
          onError={() => setImageError(true)}
        />
      );
    }
    return (
      <div className={cn("w-full h-full flex items-center justify-center text-neutral-300", className)}>
        <ImageIcon className="w-1/2 h-1/2 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={targetUrl}
      alt={config?.alt || alt}
      className={cn("w-full h-full object-contain drop-shadow-xs", className)}
      onError={() => setImageError(true)}
    />
  );
}

interface CertificateLogoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  currentConfig?: LogoConfig;
  onSelect: (config: LogoConfig) => void;
}

export function CertificateLogoPickerModal({
  isOpen,
  onClose,
  title,
  description = "Select from institutional uploaded logos or upload a new seal image",
  currentConfig,
  onSelect,
}: CertificateLogoPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [library, setLibrary] = useState<LogoLibraryItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentConfig?.url || "");
  const [selectedAlt, setSelectedAlt] = useState<string>(currentConfig?.alt || "");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  // Load system-wide logo library from /api/branding
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingLibrary(true);
    setUploadError(null);

    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const lib: LogoLibraryItem[] = data.library || data.logos?.library || [];
        setLibrary(lib);

        // Pre-select current URL if matches
        if (currentConfig?.url) {
          setSelectedUrl(currentConfig.url);
          setSelectedAlt(currentConfig.alt || "Selected Logo");
        } else if (lib.length > 0 && !selectedUrl) {
          setSelectedUrl(lib[0].url);
          setSelectedAlt(lib[0].name);
        }
      })
      .catch((err) => {
        console.error("Failed to load logo library:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingLibrary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentConfig]);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid image type. Please select PNG, JPG, WebP, or SVG.");
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
      data.append("position", "left");

      const res = await fetch("/api/branding/logo/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload logo.");
      }

      if (json.libraryItem) {
        setLibrary((prev) => {
          const exists = prev.some((i) => i.url === json.libraryItem.url);
          return exists ? prev : [json.libraryItem, ...prev];
        });
      }

      setSelectedUrl(json.url);
      setSelectedAlt(json.libraryItem?.name || file.name);
      setActiveTab("library");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLibraryItem = async (e: React.MouseEvent, item: LogoLibraryItem) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove "${item.name}" from the system logo library?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branding?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLibrary((prev) => prev.filter((i) => i.id !== item.id && i.url !== item.url));
        if (selectedUrl === item.url) {
          setSelectedUrl("");
          setSelectedAlt("");
        }
      }
    } catch (err) {
      console.error("Delete logo error:", err);
    }
  };

  const handleApply = () => {
    if (!selectedUrl) {
      onSelect({
        type: "custom",
        url: "",
        alt: "None",
      });
    } else {
      onSelect({
        type: "custom",
        url: selectedUrl,
        alt: selectedAlt || "Institutional Logo",
      });
    }
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain p-3 sm:p-6 flex min-h-full items-center justify-center"
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

          {/* Dialog Card with Apple Fluid Spring Motion */}
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
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] border border-[#D6DDD8] overflow-hidden flex flex-col my-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MinSU Green Gradient Header */}
            <div className="bg-gradient-to-r from-[#123F17] via-[#164D1C] to-[#1B5E20] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#123F17] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F2B705]/20 border border-[#F2B705]/30 flex items-center justify-center text-[#F9C733] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold font-heading text-white truncate">
                    {title}
                  </h2>
                  <p className="text-xs text-[#DCEFDD] truncate">{description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center apple-press transition-colors shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apple 2-Tab Segmented Switcher (Saved Library vs Direct Upload) */}
            <div className="p-3 sm:p-4 pb-0 bg-[#F6F8F6] border-b border-[#D6DDD8] shrink-0">
              <div className="grid grid-cols-2 p-1 bg-neutral-200/80 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className={cn(
                    "py-2 px-3 rounded-xl transition-all apple-press flex items-center justify-center gap-2 text-center",
                    activeTab === "library"
                      ? "bg-white text-[#123F17] shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  )}
                >
                  <Building2 className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <span>System Logo Library ({library.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={cn(
                    "py-2 px-3 rounded-xl transition-all apple-press flex items-center justify-center gap-2 text-center",
                    activeTab === "upload"
                      ? "bg-white text-[#123F17] shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  )}
                >
                  <Upload className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <span>Upload New Seal</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto apple-scrollbar flex-1 max-h-[calc(92vh-180px)]">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* TAB 1: SAVED SYSTEM LIBRARY */}
              {activeTab === "library" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                      Available Uploaded Logos
                    </span>
                    <span className="text-[11px] text-[#55645B]">
                      Click any logo to select
                    </span>
                  </div>

                  {loadingLibrary ? (
                    <div className="py-12 text-center space-y-2">
                      <div className="w-7 h-7 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-[#55645B]">Loading system logos...</p>
                    </div>
                  ) : library.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-[#D6DDD8] rounded-2xl space-y-2">
                      <Building2 className="w-8 h-8 text-[#55645B] mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-[#1F2A24]">
                        No logos uploaded yet.
                      </p>
                      <p className="text-[11px] text-[#55645B]">
                        Switch to the Upload tab to add official institutional seals.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("upload")}
                        className="text-xs mt-2"
                      >
                        Upload a Logo Now
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Blank / None option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUrl("");
                          setSelectedAlt("None / Blank");
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press relative",
                          !selectedUrl
                            ? "border-[#1B5E20] bg-[#DCEFDD]/80 ring-2 ring-[#1B5E20]/20 shadow-xs font-bold"
                            : "border-[#D6DDD8] bg-white hover:bg-[#F6F8F6] text-[#1F2A24]"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-[#D6DDD8] flex items-center justify-center shrink-0 text-neutral-400">
                          <EyeOff className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-[#1F2A24] truncate">
                            None / Blank
                          </div>
                          <div className="text-[10px] text-[#55645B] truncate mt-0.5">
                            Leave logo slot empty
                          </div>
                        </div>
                        {!selectedUrl && (
                          <div className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>

                      {/* Uploaded Library Items */}
                      {library.map((item) => {
                        const isSelected = selectedUrl === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedUrl(item.url);
                              setSelectedAlt(item.name);
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press relative group",
                              isSelected
                                ? "border-[#1B5E20] bg-[#DCEFDD]/80 ring-2 ring-[#1B5E20]/20 shadow-xs font-bold"
                                : "border-[#D6DDD8] bg-white hover:bg-[#F6F8F6] text-[#1F2A24]"
                            )}
                          >
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#D6DDD8] p-1 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-[#1F2A24] truncate font-medium">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-[#55645B] truncate mt-0.5">
                                Institutional Seal
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteLibraryItem(e, item)}
                                className="p-1 text-[#55645B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove from system library"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPLOAD NEW LOGO */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all apple-press flex flex-col items-center justify-center space-y-3",
                      dragActive
                        ? "border-[#1B5E20] bg-[#DCEFDD]/50 ring-4 ring-[#1B5E20]/10"
                        : "border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F6F8F6] hover:border-[#1B5E20]"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    {uploading ? (
                      <div className="space-y-2 py-4">
                        <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-[#1B5E20]">
                          Uploading logo to system and updating library...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shadow-xs">
                          <Upload className="w-7 h-7 text-[#1B5E20]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1F2A24]">
                            Drag & drop seal image here
                          </p>
                          <p className="text-xs text-[#55645B] mt-0.5">
                            or click to browse from your computer
                          </p>
                        </div>
                        <p className="text-[11px] text-[#55645B] bg-white px-3 py-1 rounded-full border border-[#D6DDD8]">
                          PNG, JPG, WebP or SVG • Max 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Active Selection Preview Card */}
              <div className="p-3.5 bg-[#F6F8F6] rounded-2xl border border-[#D6DDD8] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1F2A24]">Selected Seal:</div>
                  <div className="text-[11px] text-[#55645B] truncate max-w-xs">
                    {selectedUrl ? selectedAlt || "Custom Logo" : "None / Blank"}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl border border-[#D6DDD8] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {selectedUrl ? (
                    <img src={selectedUrl} alt="Selected" className="w-full h-full object-contain" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 sm:px-6 py-4 bg-[#F6F8F6] border-t border-[#D6DDD8] flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs apple-press rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApply}
                disabled={uploading}
                className="text-xs bg-[#1B5E20] hover:bg-[#164D1C] text-white font-semibold apple-press rounded-xl shadow-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Apply to Certificate
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

