"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { DownloadHUD, DownloadItem, detectFileType, DownloadFileType } from "@/components/ui/download-hud";

interface DownloadFileOptions {
  url: string;
  filename?: string;
  fallbackName?: string;
  triggerElement?: HTMLElement | null;
}

interface DownloadBlobOptions {
  blob: Blob;
  filename: string;
  triggerElement?: HTMLElement | null;
}

interface DownloadContextType {
  items: DownloadItem[];
  isDownloading: boolean;
  downloadFile: (options: DownloadFileOptions) => Promise<boolean>;
  downloadBlob: (options: DownloadBlobOptions) => void;
  dismissDownload: (id: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

function extractFilenameFromHeader(header: string | null): string | null {
  if (!header) return null;

  // Handle RFC 5987 / 6266 (filename*=UTF-8''...)
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  // Handle standard filename="..." or filename=...
  const match = header.match(/filename=["']?([^"';]+)["']?/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

function deriveFallbackFilename(url: string, explicitFallback?: string): string {
  if (explicitFallback && explicitFallback.trim() && explicitFallback !== "true") {
    return explicitFallback;
  }

  try {
    const parsed = new URL(url, window.location.href);
    const pathname = parsed.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "export";
    const format = parsed.searchParams.get("format");

    if (pathname.includes("/verification/runs/")) {
      return format === "csv" ? "Verification_Report.csv" : "Verification_3Form_Report.xlsx";
    }

    if (pathname.includes("/verification/templates/")) {
      return `${lastPart}_template_doctrack.csv`;
    }

    // Detect format from search query or route
    if (format === "csv") return `${lastPart}.csv`;
    if (format === "excel" || pathname.includes("export-excel")) return `${lastPart}.xlsx`;
    if (format === "doc" || pathname.includes("export-doc")) return `${lastPart}.doc`;
    if (format === "pdf") return `${lastPart}.pdf`;

    return `${lastPart}.download`;
  } catch {
    return "document_export.download";
  }
}

function triggerNativeBlobSave(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = filename;
  a.setAttribute("data-no-download-intercept", "true");
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const dismissDownload = useCallback((id: string) => {
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setTriggerElementState = (element: HTMLElement | null | undefined, loading: boolean) => {
    if (!element) return;
    if (loading) {
      element.setAttribute("data-download-loading", "true");
      element.style.pointerEvents = "none";
      element.classList.add("opacity-80");
    } else {
      element.removeAttribute("data-download-loading");
      element.style.pointerEvents = "";
      element.classList.remove("opacity-80");
    }
  };

  const downloadBlob = useCallback(
    ({ blob, filename, triggerElement }: DownloadBlobOptions) => {
      const id = "dl-" + Math.random().toString(36).substring(2, 9);
      const fileType = detectFileType(filename);

      setTriggerElementState(triggerElement, true);

      const newItem: DownloadItem = {
        id,
        filename,
        fileType,
        status: "downloading",
        startedAt: Date.now(),
      };

      setItems((prev) => [newItem, ...prev.slice(0, 4)]);

      // Slight natural tick to render downloading state smoothly
      setTimeout(() => {
        triggerNativeBlobSave(blob, filename);
        setTriggerElementState(triggerElement, false);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "completed" } : item
          )
        );

        timeoutsRef.current[id] = setTimeout(() => {
          dismissDownload(id);
        }, 3500);
      }, 300);
    },
    [dismissDownload]
  );

  const downloadFile = useCallback(
    async ({
      url,
      filename,
      fallbackName,
      triggerElement,
    }: DownloadFileOptions): Promise<boolean> => {
      const id = "dl-" + Math.random().toString(36).substring(2, 9);
      const initialName = filename || deriveFallbackFilename(url, fallbackName);
      const fileType = detectFileType(initialName, url);

      setTriggerElementState(triggerElement, true);

      const newItem: DownloadItem = {
        id,
        url,
        filename: initialName,
        fileType,
        status: "preparing",
        startedAt: Date.now(),
        retry: () => {
          dismissDownload(id);
          downloadFile({ url, filename, fallbackName, triggerElement });
        },
      };

      setItems((prev) => [newItem, ...prev.slice(0, 4)]);

      try {
        const res = await fetch(url);

        if (!res.ok) {
          let errorMsg = `Server error (${res.status})`;
          try {
            const errData = await res.json();
            if (errData?.error) errorMsg = errData.error;
          } catch {
            // response was not JSON
          }
          throw new Error(errorMsg);
        }

        // Extract filename from response headers if available
        const disposition = res.headers.get("content-disposition");
        const serverFilename = extractFilenameFromHeader(disposition);
        const resolvedFilename = serverFilename || initialName;
        const resolvedFileType = detectFileType(resolvedFilename, url);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  filename: resolvedFilename,
                  fileType: resolvedFileType,
                  status: "downloading",
                }
              : item
          )
        );

        const blob = await res.blob();
        triggerNativeBlobSave(blob, resolvedFilename);
        setTriggerElementState(triggerElement, false);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "completed" } : item
          )
        );

        // Schedule auto dismissal
        timeoutsRef.current[id] = setTimeout(() => {
          dismissDownload(id);
        }, 3500);

        return true;
      } catch (err: unknown) {
        setTriggerElementState(triggerElement, false);
        const message = err instanceof Error ? err.message : "Failed to download file";

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "error",
                  errorMessage: message,
                }
              : item
          )
        );
        return false;
      }
    },
    [dismissDownload]
  );

  // Global Click Interceptor for <a download> and export endpoints
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Find closest anchor tag
      const target = (event.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!target) return;

      const isExplicitNoIntercept = target.getAttribute("data-no-download-intercept") === "true";
      if (isExplicitNoIntercept) return;

      // Check URL validity
      const href = target.getAttribute("href");
      if (!href || href === "#" || href.startsWith("javascript:")) return;

      const hasDownloadAttr = target.hasAttribute("download");
      const isDownloadUrl =
        href.includes("/export") ||
        href.includes("/export-excel") ||
        href.includes("/export-doc") ||
        href.includes("format=excel") ||
        href.includes("format=csv") ||
        href.includes("format=doc") ||
        href.includes("format=pdf") ||
        href.includes("/templates/");

      if (!hasDownloadAttr && !isDownloadUrl) {
        return;
      }

      // Intercept and handle via DownloadProvider
      event.preventDefault();
      const fallback = target.getAttribute("download") || undefined;

      downloadFile({
        url: target.href,
        fallbackName: fallback,
        triggerElement: target,
      });
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [downloadFile]);

  const isDownloading = items.some(
    (i) => i.status === "preparing" || i.status === "downloading"
  );

  return (
    <DownloadContext.Provider
      value={{
        items,
        isDownloading,
        downloadFile,
        downloadBlob,
        dismissDownload,
      }}
    >
      {children}
      <DownloadHUD items={items} onDismiss={dismissDownload} />
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
}

