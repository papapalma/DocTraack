"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import {
  PWA_SHELL_CACHE_NAME,
  PWA_STARTUP_MODE_KEY,
  PwaCacheDiagnostics,
  PwaStartupMode,
  InstallPlatformHint,
  ServiceWorkerStatus,
  detectInstallPlatform,
  detectStandaloneMode,
  getPwaStartupMode,
  inspectPwaCacheDiagnostics,
  isValidPwaStartupMode,
  purgePwaCachesOnLogout,
  savePwaStartupMode,
} from "@/lib/pwa";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextValue {
  isStandalone: boolean;
  canInstall: boolean;
  installPlatform: InstallPlatformHint;
  swStatus: ServiceWorkerStatus;
  swVersion: string;
  cacheStats: PwaCacheDiagnostics;
  startupMode: PwaStartupMode;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  checkForUpdates: () => Promise<boolean>;
  applyUpdate: () => void;
  clearAppCache: () => Promise<boolean>;
  refreshDiagnostics: () => Promise<void>;
  setStartupMode: (mode: PwaStartupMode) => void;
}

const DEFAULT_CACHE_STATS: PwaCacheDiagnostics = {
  cachedUrlsCount: 0,
  usageBytes: null,
  quotaBytes: null,
};

const PwaContext = createContext<PwaContextValue>({
  isStandalone: false,
  canInstall: false,
  installPlatform: "other",
  swStatus: "idle",
  swVersion: PWA_SHELL_CACHE_NAME,
  cacheStats: DEFAULT_CACHE_STATS,
  startupMode: "default",
  promptInstall: async () => "unavailable",
  checkForUpdates: async () => false,
  applyUpdate: () => {},
  clearAppCache: async () => false,
  refreshDiagnostics: async () => {},
  setStartupMode: () => {},
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installPlatform, setInstallPlatform] =
    useState<InstallPlatformHint>("other");
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>("idle");
  const [cacheStats, setCacheStats] =
    useState<PwaCacheDiagnostics>(DEFAULT_CACHE_STATS);
  const [startupMode, setStartupModeState] =
    useState<PwaStartupMode>("default");
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const reloadingOnUpdateRef = useRef(false);

  const refreshDiagnostics = useCallback(async () => {
    const stats = await inspectPwaCacheDiagnostics();
    setCacheStats(stats);
  }, []);

  const setStartupMode = useCallback((mode: PwaStartupMode) => {
    savePwaStartupMode(mode);
    setStartupModeState(mode);
  }, []);

  // Track standalone display mode, install prompt, and startup mode sync
  useEffect(() => {
    setIsStandalone(detectStandaloneMode());
    setInstallPlatform(detectInstallPlatform());
    setStartupModeState(getPwaStartupMode());
    void refreshDiagnostics();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = () => {
      setIsStandalone(detectStandaloneMode());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PWA_STARTUP_MODE_KEY) {
        setStartupModeState(
          isValidPwaStartupMode(event.newValue) ? event.newValue : "default"
        );
      }
    };

    mediaQuery.addEventListener("change", handleDisplayChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleDisplayChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshDiagnostics]);

  // Register Service Worker & track non-destructive update lifecycle
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setSwStatus("unsupported");
      return;
    }

    let cancelled = false;

    const attachWaitingWorker = (worker: ServiceWorker) => {
      waitingWorkerRef.current = worker;
      if (!cancelled) {
        setSwStatus("update-available");
        setUpdateBannerDismissed(false);
      }
    };

    const registerWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (cancelled) return;
        registrationRef.current = reg;

        if (reg.waiting) {
          attachWaitingWorker(reg.waiting);
        } else if (reg.active || reg.installing) {
          setSwStatus("active");
        }

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              attachWaitingWorker(installing);
            } else if (installing.state === "activated" && !cancelled) {
              setSwStatus("active");
              void refreshDiagnostics();
            }
          });
        });

        await refreshDiagnostics();
      } catch {
        if (!cancelled) {
          setSwStatus("error");
        }
      }
    };

    const handleControllerChange = () => {
      if (reloadingOnUpdateRef.current) {
        reloadingOnUpdateRef.current = false;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );
    void registerWorker();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [refreshDiagnostics]);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return choice.outcome;
    } catch {
      return "unavailable";
    }
  }, [deferredPrompt]);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }
    try {
      const reg =
        registrationRef.current ??
        (await navigator.serviceWorker.getRegistration("/"));
      if (!reg) return false;
      registrationRef.current = reg;
      await reg.update();

      if (reg.waiting) {
        waitingWorkerRef.current = reg.waiting;
        setSwStatus("update-available");
        setUpdateBannerDismissed(false);
        return true;
      }
      await refreshDiagnostics();
      return false;
    } catch {
      return false;
    }
  }, [refreshDiagnostics]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current ?? registrationRef.current?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    reloadingOnUpdateRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const clearAppCache = useCallback(async (): Promise<boolean> => {
    try {
      await purgePwaCachesOnLogout();
      await refreshDiagnostics();
      return true;
    } catch {
      return false;
    }
  }, [refreshDiagnostics]);

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        canInstall: Boolean(deferredPrompt) && !isStandalone,
        installPlatform,
        swStatus,
        swVersion: PWA_SHELL_CACHE_NAME,
        cacheStats,
        startupMode,
        promptInstall,
        checkForUpdates,
        applyUpdate,
        clearAppCache,
        refreshDiagnostics,
        setStartupMode,
      }}
    >
      {children}

      {/* Non-destructive App Update Prompt (never reloads mid-form without user confirmation) */}
      {swStatus === "update-available" && !updateBannerDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl border border-[#F2B705]/50 bg-[#123F17] p-4 text-white shadow-[0_14px_36px_rgba(18,63,23,0.35)] print:hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#F2B705] text-[#123F17]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-heading text-xs font-bold text-white">
                  New MinSU DocTrack Update Ready
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#DCEFDD]">
                  Save any open work, then reload to apply the latest app version.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyUpdate}
                    className="apple-press inline-flex items-center gap-1.5 rounded-xl bg-[#F2B705] px-3 py-1.5 text-xs font-bold text-[#123F17] hover:bg-[#F9C733]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Update & Reload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateBannerDismissed(true)}
                    className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#DCEFDD] hover:bg-white/10"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUpdateBannerDismissed(true)}
              aria-label="Dismiss update notice"
              className="rounded-lg p-1 text-[#DCEFDD]/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaContextValue {
  return useContext(PwaContext);
}
