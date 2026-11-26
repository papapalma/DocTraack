"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Download,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  HardDrive,
  Monitor,
  Ticket,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Share,
  PlusSquare,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/components/providers/pwa-provider";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { formatBytes, PwaStartupMode } from "@/lib/pwa";

interface PwaSettingsPanelProps {
  showStartupModeSelector?: boolean;
}

const STARTUP_OPTIONS: Array<{
  mode: PwaStartupMode;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: "default",
    title: "Default Role Workspace",
    subtitle: "Opens your authenticated Dashboard or Student Portal automatically.",
    badge: "Standard",
    icon: LayoutDashboard,
  },
  {
    mode: "kiosk",
    title: "Walk-In Touch Kiosk (/kiosk)",
    subtitle: "Boots straight into self-service ticket check-in on lobby tablets.",
    badge: "Lobby Tablet",
    icon: Ticket,
  },
  {
    mode: "kiosk-display",
    title: "Lobby Overhead TV (/kiosk/display)",
    subtitle: "Boots straight into the live Now Serving monitor board.",
    badge: "TV Monitor",
    icon: Monitor,
  },
];

export function PwaSettingsPanel({
  showStartupModeSelector = true,
}: PwaSettingsPanelProps) {
  const {
    isStandalone,
    canInstall,
    installPlatform,
    swStatus,
    swVersion,
    cacheStats,
    startupMode,
    promptInstall,
    checkForUpdates,
    applyUpdate,
    clearAppCache,
    setStartupMode,
  } = usePwa();

  const isOnline = useOnlineStatus();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "info";
    text: string;
  } | null>(null);

  const showTransientFeedback = (tone: "success" | "info", text: string) => {
    setFeedback({ tone, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        showTransientFeedback(
          "success",
          "MinSU DocTrack is being added to your home screen / desktop!"
        );
      } else if (outcome === "dismissed") {
        showTransientFeedback(
          "info",
          "Installation prompt dismissed. You can install anytime from here or your browser bar."
        );
      } else {
        showTransientFeedback(
          "info",
          "Follow the browser-specific steps below to add MinSU DocTrack to your device."
        );
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const foundWaiting = await checkForUpdates();
      if (foundWaiting) {
        showTransientFeedback(
          "success",
          "A new app update is ready! Click 'Apply Update & Reload' to activate it."
        );
      } else {
        showTransientFeedback(
          "success",
          "MinSU DocTrack is up to date with the latest campus release."
        );
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const ok = await clearAppCache();
      if (ok) {
        showTransientFeedback(
          "success",
          "Cleared cached static app-shell assets on this device."
        );
      }
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold animate-in fade-in duration-150 ${
            feedback.tone === "success"
              ? "border-[#1B5E20]/25 bg-[#DCEFDD] text-[#123F17]"
              : "border-[#F2B705]/45 bg-[#FFF1C2] text-[#1F2A24]"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1B5E20]" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-[#B88A00]" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Card 1: App Installation & Standalone Status */}
      <Card className="border-[#D6DDD8] bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-[#D6DDD8]/60 pb-4 bg-gradient-to-r from-[#F1F8F1] to-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-heading font-bold text-[#1B5E20] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1B5E20]" />
                <span>Install MinSU DocTrack App (PWA)</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#55645B] mt-0.5">
                Launch DocTrack from your phone home screen, dock, or taskbar with a full-screen standalone window.
              </CardDescription>
            </div>

            {isStandalone ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1B5E20]/25 bg-[#DCEFDD] px-3 py-1 text-xs font-bold text-[#123F17]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E20]" />
                Installed (Standalone)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F2B705]/40 bg-[#FFF1C2] px-3 py-1 text-xs font-bold text-[#B88A00]">
                <Sparkles className="h-3.5 w-3.5 text-[#B88A00]" />
                Browser Mode
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {isStandalone ? (
            <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#F1F8F1] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#123F17]">
                  Running as an Installed Application
                </p>
                <p className="text-xs text-[#55645B] leading-relaxed">
                  You are using the standalone MinSU DocTrack app with native window chrome, app shortcuts, and offline shell protection enabled.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1B5E20] px-3.5 py-2 text-xs font-bold text-white">
                <CheckCircle2 className="h-4 w-4 text-[#F2B705]" />
                Active on Device
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/80 p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1F2A24]">
                    {canInstall
                      ? "Ready for One-Click Installation"
                      : "Add to Home Screen or Desktop"}
                  </h3>
                  <p className="text-xs text-[#55645B] leading-relaxed">
                    {canInstall
                      ? "Your browser supports direct app installation with official MinSU icons and quick-jump shortcuts."
                      : "Install MinSU DocTrack for instant dock/home-screen launch, distraction-free full-screen views, and resilient offline fallback."}
                  </p>
                </div>

                {canInstall && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    isLoading={isInstalling}
                    onClick={handleInstallClick}
                    className="shrink-0 apple-press font-semibold shadow-sm"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Install App Now
                  </Button>
                )}
              </div>

              {/* Platform-specific Manual Guide when native prompt isn't active */}
              {!canInstall && (
                <div className="rounded-2xl border border-[#D6DDD8] bg-white p-4 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1B5E20]">
                    {installPlatform === "ios"
                      ? "How to Install on iPhone or iPad (Safari)"
                      : installPlatform === "macos-safari"
                      ? "How to Install on macOS (Safari)"
                      : installPlatform === "firefox"
                      ? "How to Install on Firefox / Other Browsers"
                      : "How to Install on Chrome or Microsoft Edge"}
                  </p>

                  {installPlatform === "ios" ? (
                    <ol className="space-y-2 text-xs text-[#1F2A24]">
                      <li className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCEFDD] text-[11px] font-bold text-[#123F17]">
                          1
                        </span>
                        <span className="flex flex-wrap items-center gap-1">
                          Tap the <strong>Share</strong> button
                          <Share className="inline h-3.5 w-3.5 text-[#1B5E20]" /> in Safari&apos;s toolbar.
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCEFDD] text-[11px] font-bold text-[#123F17]">
                          2
                        </span>
                        <span className="flex flex-wrap items-center gap-1">
                          Scroll down and select <strong>Add to Home Screen</strong>
                          <PlusSquare className="inline h-3.5 w-3.5 text-[#1B5E20]" />.
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCEFDD] text-[11px] font-bold text-[#123F17]">
                          3
                        </span>
                        <span>
                          Tap <strong>Add</strong> in the top-right corner to place the MinSU DocTrack icon on your screen.
                        </span>
                      </li>
                    </ol>
                  ) : installPlatform === "macos-safari" ? (
                    <p className="text-xs text-[#55645B] leading-relaxed">
                      In the macOS menu bar at the top of your screen, click{" "}
                      <strong className="text-[#1F2A24]">File → Add to Dock…</strong>{" "}
                      and confirm <strong className="text-[#1F2A24]">Add</strong> to launch MinSU DocTrack as a standalone Mac app.
                    </p>
                  ) : installPlatform === "firefox" ? (
                    <p className="text-xs text-[#55645B] leading-relaxed">
                      On Android Firefox, open the browser menu (<strong className="text-[#1F2A24]">⋮</strong>) and tap{" "}
                      <strong className="text-[#1F2A24]">Install</strong>. On desktop, open MinSU DocTrack in{" "}
                      <strong className="text-[#1F2A24]">Google Chrome</strong>,{" "}
                      <strong className="text-[#1F2A24]">Microsoft Edge</strong>, or{" "}
                      <strong className="text-[#1F2A24]">Safari</strong> for full desktop PWA window installation.
                    </p>
                  ) : (
                    <p className="text-xs text-[#55645B] leading-relaxed">
                      Click the <strong className="text-[#1F2A24]">Install MinSU DocTrack</strong> icon on the right side of your browser&apos;s address bar, or open browser menu{" "}
                      <strong className="text-[#1F2A24]">⋮ → Cast, save, and share → Install page as app…</strong>{" "}
                      (if already installed on this computer, choose <strong className="text-[#1F2A24]">Open in app</strong> in the address bar).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Device Startup Mode Selector (Operational & Admin Roles) */}
      {showStartupModeSelector && (
        <Card className="border-[#D6DDD8] bg-white shadow-xs">
          <CardHeader className="border-b border-[#D6DDD8]/60 pb-4">
            <CardTitle className="text-base font-heading font-bold text-[#1F2A24] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#1B5E20]" />
              <span>Device Startup Target (Standalone Launch)</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#55645B] mt-0.5">
              Choose which screen opens automatically when this device launches the installed MinSU DocTrack app. Lobby tablets can also install directly from <code className="font-mono text-[#1B5E20]">/kiosk</code>.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STARTUP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = startupMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => {
                      setStartupMode(opt.mode);
                      showTransientFeedback(
                        "success",
                        `Saved device startup mode: ${opt.title}`
                      );
                    }}
                    aria-pressed={active}
                    className={`apple-press text-left rounded-2xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                      active
                        ? "border-[#1B5E20] bg-[#F1F8F1] ring-2 ring-[#1B5E20]/20"
                        : "border-[#D6DDD8] bg-white hover:border-[#1B5E20]/40 hover:bg-[#F6F8F6]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            active
                              ? "bg-[#1B5E20] text-white"
                              : "bg-[#F6F8F6] text-[#1B5E20] border border-[#D6DDD8]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            active
                              ? "bg-[#1B5E20] text-white"
                              : "bg-neutral-100 text-[#55645B]"
                          }`}
                        >
                          {active ? "Selected" : opt.badge}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1F2A24]">
                        {opt.title}
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#55645B]">
                        {opt.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: Offline Shell, Updates & Cache Diagnostics */}
      <Card className="border-[#D6DDD8] bg-white shadow-xs">
        <CardHeader className="border-b border-[#D6DDD8]/60 pb-4">
          <CardTitle className="text-base font-heading font-bold text-[#1F2A24] flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#B88A00]" />
            <span>Offline Shell, App Updates & Cache Maintenance</span>
          </CardTitle>
          <CardDescription className="text-xs text-[#55645B] mt-0.5">
            Inspect Service Worker status, check for new campus releases, or reset cached static shell files.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/70 p-3.5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#55645B]">
                Network Status
              </p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1F2A24]">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-[#1B5E20]" />
                    <span className="text-[#1B5E20]">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-[#B88A00]" />
                    <span className="text-[#B88A00]">Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/70 p-3.5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#55645B]">
                App Shell Worker
              </p>
              <p className="text-sm font-bold text-[#1F2A24]">
                {swStatus === "active" && (
                  <span className="text-[#1B5E20]">Active & Ready</span>
                )}
                {swStatus === "update-available" && (
                  <span className="text-[#B88A00]">Update Waiting</span>
                )}
                {swStatus === "idle" && <span>Initializing…</span>}
                {swStatus === "unsupported" && (
                  <span className="text-[#55645B]">Unsupported Browser</span>
                )}
                {swStatus === "error" && (
                  <span className="text-[#55645B]">Dev / Unregistered</span>
                )}
              </p>
              <p className="font-mono text-[10px] text-[#55645B] truncate">
                {swVersion}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D6DDD8] bg-[#F6F8F6]/70 p-3.5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#55645B]">
                Cached Shell Assets
              </p>
              <p className="text-sm font-bold text-[#1F2A24] tabular-nums">
                {cacheStats.cachedUrlsCount} static files
              </p>
              <p className="text-[10px] text-[#55645B] tabular-nums">
                Storage used: {formatBytes(cacheStats.usageBytes)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6DDD8] bg-[#FFFDF5] p-3.5 flex items-start gap-2.5 text-xs text-[#1F2A24]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#1B5E20] mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[#55645B]">
              <strong className="text-[#1F2A24]">RA 10173 Privacy Guarantee:</strong>{" "}
              Authenticated pages, <code className="font-mono text-[#1B5E20]">/api/*</code> responses, student rosters, and financial exports are strictly excluded from offline caching and are automatically cleared whenever you sign out.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {swStatus === "update-available" && (
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={applyUpdate}
                className="apple-press text-xs font-bold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Apply Update & Reload
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isCheckingUpdate}
              onClick={handleCheckUpdates}
              className="apple-press text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-[#1B5E20]" />
              Check for App Updates
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isClearingCache}
              onClick={handleClearCache}
              className="apple-press text-xs text-[#B3261E] border-[#D6DDD8] hover:bg-[#FDE8E7]/60"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear Cached App Assets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
