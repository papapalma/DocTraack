"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleOnline = () => {
      setShowReconnected(true);
      timer = setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="sticky top-0 z-50 bg-[#1B5E20] text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all duration-300 animate-in slide-in-from-top"
      >
        <CheckCircle2 className="w-4 h-4 text-[#F2B705]" />
        <span>Connection Restored. System is back online.</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 bg-[#1F2A24] text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-lg flex items-center justify-between transition-all duration-300 animate-in slide-in-from-top"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <WifiOff className="w-4 h-4 text-[#F2B705] shrink-0" />
        <p className="truncate sm:overflow-visible sm:whitespace-normal">
          <strong className="font-semibold text-white">No Internet Connection.</strong>{" "}
          <span className="text-white/80">
            Showing cached content. Edits are saved locally and will sync when reconnected.
          </span>
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        type="button"
        className="ml-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all duration-150"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry</span>
      </button>
    </div>
  );
}
