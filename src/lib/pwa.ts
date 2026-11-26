/**
 * Progressive Web App (PWA) Shared Utilities, Startup Mode Persistence & RA 10173 Cache Hygiene
 */

import type { MetadataRoute } from "next";

export const PWA_CACHE_PREFIX = "minsu-doctrack-";
export const PWA_SHELL_CACHE_NAME = "minsu-doctrack-shell-v1";
export const PWA_STARTUP_MODE_KEY = "minsu_pwa_startup_mode";

export type PwaStartupMode = "default" | "kiosk" | "kiosk-display";

export type InstallPlatformHint =
  | "chromium"
  | "ios"
  | "macos-safari"
  | "firefox"
  | "other";

export type ServiceWorkerStatus =
  | "idle"
  | "active"
  | "update-available"
  | "unsupported"
  | "error";

export interface PwaCacheDiagnostics {
  cachedUrlsCount: number;
  usageBytes: number | null;
  quotaBytes: number | null;
}

export function isValidPwaStartupMode(value: unknown): value is PwaStartupMode {
  return value === "default" || value === "kiosk" || value === "kiosk-display";
}

export function getPwaStartupMode(): PwaStartupMode {
  if (typeof window === "undefined") return "default";
  try {
    const raw = window.localStorage.getItem(PWA_STARTUP_MODE_KEY);
    return isValidPwaStartupMode(raw) ? raw : "default";
  } catch {
    return "default";
  }
}

export function savePwaStartupMode(mode: PwaStartupMode): void {
  if (typeof window === "undefined") return;
  try {
    if (mode === "default") {
      window.localStorage.removeItem(PWA_STARTUP_MODE_KEY);
    } else {
      window.localStorage.setItem(PWA_STARTUP_MODE_KEY, mode);
    }
  } catch {
    // Ignore storage quota or restricted-mode errors
  }
}

export function getStartupTargetHref(mode: PwaStartupMode): string | null {
  switch (mode) {
    case "kiosk":
      return "/kiosk";
    case "kiosk-display":
      return "/kiosk/display";
    case "default":
    default:
      return null;
  }
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function detectStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mqStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const mqFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
    const iosStandalone = Boolean(
      (window.navigator as NavigatorWithStandalone).standalone
    );
    return mqStandalone || mqFullscreen || iosStandalone;
  } catch {
    return false;
  }
}

export function detectInstallPlatform(): InstallPlatformHint {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent || "";
  const isTouchMac =
    /Macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/i.test(ua) || isTouchMac) {
    return "ios";
  }
  if (/Firefox\//i.test(ua)) {
    return "firefox";
  }
  if (/Safari\//i.test(ua) && !/Chrom(e|ium)|Edg|OPR/i.test(ua)) {
    return "macos-safari";
  }
  if (/Chrom(e|ium)|Edg|OPR/i.test(ua)) {
    return "chromium";
  }
  return "other";
}

export async function inspectPwaCacheDiagnostics(): Promise<PwaCacheDiagnostics> {
  if (typeof window === "undefined") {
    return { cachedUrlsCount: 0, usageBytes: null, quotaBytes: null };
  }

  let cachedUrlsCount = 0;
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;

  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      const appKeys = keys.filter((k) => k.startsWith(PWA_CACHE_PREFIX));
      for (const key of appKeys) {
        const cache = await window.caches.open(key);
        const requests = await cache.keys();
        cachedUrlsCount += requests.length;
      }
    }
  } catch {
    // Ignore restricted CacheStorage environments
  }

  try {
    if (window.navigator.storage && typeof window.navigator.storage.estimate === "function") {
      const estimate = await window.navigator.storage.estimate();
      usageBytes = typeof estimate.usage === "number" ? estimate.usage : null;
      quotaBytes = typeof estimate.quota === "number" ? estimate.quota : null;
    }
  } catch {
    // Ignore storage estimate failures
  }

  return { cachedUrlsCount, usageBytes, quotaBytes };
}

/**
 * Purges all MinSU DocTrack Service Worker CacheStorage buckets and notifies the active SW.
 * Invoked automatically on user Sign Out and when clicking "Clear Cached App Assets" in Settings.
 */
export async function purgePwaCachesOnLogout(): Promise<number> {
  if (typeof window === "undefined") return 0;

  let removedCount = 0;

  try {
    if ("serviceWorker" in window.navigator && window.navigator.serviceWorker.controller) {
      window.navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_PWA_CACHE",
      });
    }
  } catch {
    // Non-blocking in restricted/iframe contexts
  }

  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      const targets = keys.filter((k) => k.startsWith(PWA_CACHE_PREFIX));
      await Promise.all(
        targets.map(async (key) => {
          const deleted = await window.caches.delete(key);
          if (deleted) removedCount += 1;
        })
      );
    }
  } catch {
    // Non-blocking in insecure HTTP or private browsing contexts
  }

  return removedCount;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildKioskManifest(): MetadataRoute.Manifest {
  return {
    id: "/kiosk",
    name: "MinSU DocTrack — Walk-In Queue Kiosk",
    short_name: "MinSU Kiosk",
    description:
      "Mindoro State University Tulong Dunong Program self-service walk-in queueing terminal and live lobby display.",
    start_url: "/kiosk",
    scope: "/kiosk",
    display: "standalone",
    orientation: "any",
    background_color: "#F6F8F6",
    theme_color: "#1B5E20",
    categories: ["education", "utilities", "government"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Touch Check-In Kiosk",
        short_name: "Check-In",
        description: "Open the self-service walk-in ticket terminal",
        url: "/kiosk",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Lobby Overhead Display",
        short_name: "TV Display",
        description: "Open the overhead Now Serving monitor board",
        url: "/kiosk/display",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
