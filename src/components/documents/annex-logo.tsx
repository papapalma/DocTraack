"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LogoConfig,
  LogoPresetId,
  HeaderLogosConfig,
  LogoLibraryItem,
} from "@/types";
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

// Shared in-memory cache to prevent multiple concurrent requests for global branding
let cachedBranding: HeaderLogosConfig | null = null;
let cachedBrandingPromise: Promise<HeaderLogosConfig> | null = null;

export async function fetchGlobalBrandingCached(): Promise<HeaderLogosConfig> {
  if (cachedBranding) return cachedBranding;
  if (!cachedBrandingPromise) {
    cachedBrandingPromise = fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        const logos = data.logos || {};
        cachedBranding = logos;
        return logos;
      })
      .catch((err) => {
        console.error("Failed to fetch global branding:", err);
        return {
          leftLogo: { type: "custom", url: "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png", alt: "Institutional Left Seal" },
          rightLogo: { type: "custom", url: "/api/media/logo/logo-1793718328666-3e70a8323e95.png", alt: "Institutional Right Seal" },
        };
      })
      .finally(() => {
        cachedBrandingPromise = null;
      });
  }
  return cachedBrandingPromise;
}

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
  const [globalDefault, setGlobalDefault] = useState<LogoConfig | null>(() => {
    if (!cachedBranding) return null;
    return position === "left" ? cachedBranding.leftLogo || null : cachedBranding.rightLogo || null;
  });

  // If no document-specific config is present, fetch and inherit global institutional branding
  useEffect(() => {
    if (!config) {
      fetchGlobalBrandingCached().then((branding) => {
        const logo = position === "left" ? branding.leftLogo : branding.rightLogo;
        if (logo) setGlobalDefault(logo);
      });
    }
  }, [config, position]);

  // Resolved effective config: Explicit Document Override > Global Institutional Default > Uploaded Fallback
  const currentConfig: LogoConfig = config || globalDefault || {
    type: "custom",
    url: position === "left"
      ? "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
      : "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
    alt: position === "left" ? "Institutional Left Seal" : "Institutional Right Seal",
  };

  // Render the logo graphic based on config (Custom uploaded streamed URL or clean fallback)
  const renderGraphic = () => {
    if (currentConfig.presetId === "none" || (currentConfig.type === "custom" && currentConfig.url === "")) {
      return <div className={cn("opacity-0 pointer-events-none", className)} />;
    }

    const imageUrl =
      currentConfig.url ||
      (currentConfig.presetId === "minsu"
        ? "/logo.png"
        : position === "left"
        ? "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
        : "/api/media/logo/logo-1793718328666-3e70a8323e95.png");

    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <img
          src={imageUrl}
          alt={currentConfig.alt || "Annex Logo"}
          className="w-full h-full object-contain drop-shadow-xs"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
        />
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "relative group inline-flex items-center justify-center select-none",
          editable && "cursor-pointer"
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
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

      {/* Apple-styled Fluid Logo Editor Modal rendered via Portal */}
      {isModalOpen && (
        <AnnexLogoEditorModal
          position={position}
          currentConfig={currentConfig}
          defaultPreset={defaultPreset}
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
  defaultPreset?: LogoPresetId;
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
  const [mounted, setMounted] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();

  const [library, setLibrary] = useState<LogoLibraryItem[]>([]);
  const [globalDefaults, setGlobalDefaults] = useState<HeaderLogosConfig | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  const [selectedLibraryUrl, setSelectedLibraryUrl] = useState<string>(
    currentConfig.type === "custom" ? currentConfig.url || "" : ""
  );
  const [customUrl, setCustomUrl] = useState<string>(currentConfig.url || "");
  const [altText, setAltText] = useState<string>(currentConfig.alt || "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Institutional Logo Library & Global Defaults
  useEffect(() => {
    let isMounted = true;
    setLoadingLibrary(true);

    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const lib: LogoLibraryItem[] = data.library || data.logos?.library || [];
        setLibrary(lib);
        if (data.logos) {
          setGlobalDefaults(data.logos);
        }
        // If currentConfig is custom, check if it matches a library item
        if (currentConfig.type === "custom" && currentConfig.url) {
          const match = lib.find((i) => i.url === currentConfig.url);
          if (match) {
            setActiveTab("library");
            setSelectedLibraryUrl(match.url);
          } else {
            setActiveTab("upload");
          }
        } else if (lib.length > 0 && activeTab === "library" && !selectedLibraryUrl) {
          setSelectedLibraryUrl(lib[0].url);
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
  }, [currentConfig]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle file upload
  const handleFile = async (file: File) => {
    setUploadError(null);

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
      if (json.libraryItem) {
        setLibrary((prev) => [json.libraryItem, ...prev]);
        setSelectedLibraryUrl(json.url);
      }
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
    if (activeTab === "library") {
      const match = library.find((i) => i.url === selectedLibraryUrl);
      if (!match && !selectedLibraryUrl) {
        onSave({
          type: "custom",
          url: "",
          alt: "None",
        });
        return;
      }
      onSave({
        type: "custom",
        url: selectedLibraryUrl,
        alt: match?.name || "Institutional Logo",
      });
    } else {
      if (!customUrl) {
        setUploadError("Please upload an image or choose a logo from the library.");
        return;
      }
      onSave({
        type: "custom",
        url: customUrl,
        alt: altText || "Custom Annex Logo",
      });
    }
  };

  // Reverts to Global Institutional Branding configured by Administrator
  const handleResetToGlobalDefault = () => {
    const defaultLogo =
      position === "left"
        ? globalDefaults?.leftLogo
        : globalDefaults?.rightLogo;

    if (defaultLogo && defaultLogo.url) {
      onSave(defaultLogo);
    } else {
      onSave({
        type: "custom",
        url: position === "left"
          ? "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
          : "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
        alt: position === "left" ? "Institutional Left Seal" : "Institutional Right Seal",
      });
    }
  };

  if (!mounted) return null;

  return createPortal(
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

      {/* Dialog Card with Apple spring motion */}
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.25)] border border-[#D6DDD8] overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MinSU Green Gradient Header */}
        <div className="bg-gradient-to-r from-[#123F17] via-[#164D1C] to-[#1B5E20] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#123F17] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#F2B705]/20 border border-[#F2B705]/30 flex items-center justify-center text-[#F9C733] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-heading capitalize text-white truncate">
                Customize {position} Header Logo
              </h2>
              <p className="text-xs text-[#DCEFDD] truncate">
                Select from Institutional Library or upload a new seal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center apple-press transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Segmented 2-Tab Switcher */}
        <div className="p-3 sm:p-4 pb-0 bg-[#F6F8F6] border-b border-[#D6DDD8] shrink-0">
          <div className="grid grid-cols-2 p-1 bg-neutral-200/80 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={cn(
                "py-1.5 px-2 rounded-xl transition-all apple-press flex items-center justify-center gap-1.5 text-center truncate",
                activeTab === "library"
                  ? "bg-white text-[#123F17] shadow-xs font-bold"
                  : "text-[#55645B] hover:text-[#1F2A24]"
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
              <span className="truncate">Saved Library ({library.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "py-1.5 px-2 rounded-xl transition-all apple-press flex items-center justify-center gap-1.5 text-center truncate",
                activeTab === "upload"
                  ? "bg-white text-[#123F17] shadow-xs font-bold"
                  : "text-[#55645B] hover:text-[#1F2A24]"
              )}
            >
              <Upload className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
              <span className="truncate">Upload</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto apple-scrollbar flex-1 max-h-[calc(92vh-190px)]">
          {/* TAB 1: INSTITUTIONAL LOGO LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider block">
                  Institutional Custom Logos
                </label>
                <span className="text-[11px] text-[#55645B]">
                  {library.length} available
                </span>
              </div>

              {loadingLibrary ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-7 h-7 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#55645B]">Loading saved logos...</p>
                </div>
              ) : library.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#D6DDD8] rounded-2xl space-y-2">
                  <Building2 className="w-8 h-8 text-[#55645B] mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-[#1F2A24]">
                    No custom logos uploaded yet.
                  </p>
                  <p className="text-[11px] text-[#55645B]">
                    Upload a new logo using the Upload tab, or configure in Admin Global Branding.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("upload")}
                    className="text-xs mt-2"
                  >
                    Go to Upload Tab
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* None / Blank option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLibraryUrl("");
                      setCustomUrl("");
                      setAltText("None");
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press relative",
                      !selectedLibraryUrl
                        ? "border-[#1B5E20] bg-[#DCEFDD]/80 ring-2 ring-[#1B5E20]/20 shadow-xs font-bold"
                        : "border-[#D6DDD8] bg-white hover:bg-[#F6F8F6] text-[#1F2A24]"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-[#D6DDD8] flex items-center justify-center shrink-0 text-neutral-400">
                      <EyeOff className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#1F2A24] truncate">None / Blank</div>
                      <div className="text-[10px] text-[#55645B] truncate mt-0.5">
                        Leave header space empty
                      </div>
                    </div>
                    {!selectedLibraryUrl && (
                      <div className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>

                  {library.map((item) => {
                    const isSelected = selectedLibraryUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedLibraryUrl(item.url);
                          setCustomUrl(item.url);
                          setAltText(item.name);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press relative",
                          isSelected
                            ? "border-[#1B5E20] bg-[#DCEFDD]/80 ring-2 ring-[#1B5E20]/20 shadow-xs font-bold"
                            : "border-[#D6DDD8] bg-white hover:bg-[#F6F8F6] text-[#1F2A24]"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#D6DDD8] p-1 shadow-xs flex items-center justify-center shrink-0">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-[#1F2A24] truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[#55645B] truncate mt-0.5">
                            Institutional Seal
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider block mb-1.5">
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
                    "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all apple-press flex flex-col items-center justify-center space-y-2",
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
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploading ? (
                    <div className="space-y-2 py-4">
                      <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-[#1B5E20]">
                        Saving logo to disk & updating library...
                      </p>
                    </div>
                  ) : customUrl ? (
                    <div className="space-y-2">
                      <div className="w-20 h-20 mx-auto rounded-2xl border border-[#D6DDD8] bg-white p-2 shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                          src={customUrl}
                          alt="Uploaded Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs font-bold text-[#1B5E20] flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Logo Uploaded & Added to Library
                      </p>
                      <p className="text-[11px] text-[#55645B]">
                        Click or drag to replace image
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1B5E20]">
                          Click to upload
                        </span>{" "}
                        <span className="text-xs text-[#55645B]">or drag & drop</span>
                      </div>
                      <p className="text-[10px] text-[#55645B]">
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
            </div>
          )}

          {/* Live Document Preview Box */}
          <div className="p-3.5 bg-[#F6F8F6] rounded-2xl border border-[#D6DDD8] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1F2A24]">Preview in Document Header:</div>
              <div className="text-[10px] text-[#55645B]">
                {activeTab === "library"
                  ? selectedLibraryUrl
                    ? "Institutional Seal"
                    : "None / Blank"
                  : "Direct Upload"}
              </div>
            </div>
            <div className="w-14 h-14 bg-white rounded-xl border border-[#D6DDD8] p-1.5 shadow-2xs flex items-center justify-center overflow-hidden">
              {activeTab === "library" ? (
                selectedLibraryUrl ? (
                  <img src={selectedLibraryUrl} alt="Library Logo" className="w-12 h-12 object-contain" />
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
        <div className="px-5 sm:px-6 py-4 bg-[#F6F8F6] border-t border-[#D6DDD8] flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToGlobalDefault}
            className="text-xs text-[#55645B] hover:text-[#1F2A24] apple-press"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset to Global Default
          </Button>

          <div className="flex items-center gap-2">
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
              Apply to Document
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
