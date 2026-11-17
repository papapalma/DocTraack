"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { QueueRealtimeEvent } from "@/types/queue";

const QUEUE_BROADCAST_CHANNEL = "minsu-queue-sync";

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot() {
  return true;
}

export function broadcastQueueSync(campus?: string | null) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(QUEUE_BROADCAST_CHANNEL);
    channel.postMessage({
      campus: campus || null,
      timestamp: Date.now(),
    });
    channel.close();
  } catch {
    // Ignore BroadcastChannel errors in restricted contexts
  }
}

interface UseQueueStreamOptions {
  campus?: string | null;
  enabled?: boolean;
  onEvent?: (event: QueueRealtimeEvent) => void;
  onRefresh?: () => void;
  fallbackPollMs?: number;
}

export function useQueueStream({
  campus,
  enabled = true,
  onEvent,
  onRefresh,
  fallbackPollMs = 4000,
}: UseQueueStreamOptions) {
  const [streamConnected, setStreamConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  const onEventRef = useRef(onEvent);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      onRefreshRef.current?.();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const query = campus ? `?campus=${encodeURIComponent(campus)}` : "";
    const streamUrl = `/api/queue/stream${query}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);
      eventSource.addEventListener("connected", () => {
        setStreamConnected(true);
      });
      eventSource.addEventListener("queue-change", (raw) => {
        setStreamConnected(true);
        try {
          const parsed = JSON.parse(
            (raw as MessageEvent<string>).data
          ) as QueueRealtimeEvent;
          setLastEventAt(parsed.timestamp);
          onEventRef.current?.(parsed);
        } catch {
          // Malformed SSE payload
        }
        onRefreshRef.current?.();
      });
      eventSource.onerror = () => {
        setStreamConnected(false);
      };
    } catch {
      // EventSource unsupported or failed
    }

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(QUEUE_BROADCAST_CHANNEL);
        bc.onmessage = (msg) => {
          const payload = msg.data as { campus?: string | null } | undefined;
          if (!campus || !payload?.campus || payload.campus === campus) {
            onRefreshRef.current?.();
          }
        };
      } catch {
        bc = null;
      }
    }

    return () => {
      eventSource?.close();
      bc?.close();
      setStreamConnected(false);
    };
  }, [campus, enabled]);

  const isConnected = enabled && streamConnected;

  // Safety fallback polling when SSE drops, plus slow 15s drift sync while connected
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const intervalMs = isConnected
      ? Math.max(fallbackPollMs * 3, 15000)
      : fallbackPollMs;
    const id = window.setInterval(() => {
      onRefreshRef.current?.();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, isConnected, fallbackPollMs]);

  return {
    isConnected,
    isOnline,
    lastEventAt,
  };
}
