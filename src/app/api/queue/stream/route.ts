import { NextRequest, NextResponse } from "next/server";
import { getQueueVersion, subscribeQueueEvents } from "@/lib/queue-events";
import { normalizeQueueCampus } from "@/lib/queue";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_SSE_PER_IP = 5;
const MAX_SSE_GLOBAL = 150;
let activeGlobalSse = 0;
const activeSseByIp = new Map<string, number>();

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const ipCount = activeSseByIp.get(clientIp) || 0;
  if (activeGlobalSse >= MAX_SSE_GLOBAL || ipCount >= MAX_SSE_PER_IP) {
    return NextResponse.json(
      { error: "Too many active live display connections." },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  activeGlobalSse++;
  activeSseByIp.set(clientIp, ipCount + 1);

  const { searchParams } = new URL(req.url);
  const rawCampus = searchParams.get("campus");
  const campusFilter = rawCampus ? normalizeQueueCampus(rawCampus) : null;

  const encoder = new TextEncoder();
  let released = false;
  const releaseConnection = () => {
    if (released) return;
    released = true;
    activeGlobalSse = Math.max(0, activeGlobalSse - 1);
    const cur = activeSseByIp.get(clientIp) || 0;
    if (cur <= 1) {
      activeSseByIp.delete(clientIp);
    } else {
      activeSseByIp.set(clientIp, cur - 1);
    }
  };

  let onCleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const sendEvent = (eventName: string, payload: unknown) => {
        if (closed) return;
        try {
          const chunk = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
          releaseConnection();
        }
      };

      // Initial connection handshake with current version
      sendEvent("connected", {
        version: getQueueVersion(),
        campus: campusFilter,
        timestamp: new Date().toISOString(),
      });

      const unsubscribe = subscribeQueueEvents((event) => {
        if (
          !campusFilter ||
          event.campus === campusFilter ||
          event.type === "CONFIG_UPDATE" ||
          event.type === "SERVICE_UPDATE"
        ) {
          sendEvent("queue-change", event);
        }
      });

      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          closed = true;
          releaseConnection();
        }
      }, 20000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        releaseConnection();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      onCleanup = cleanup;
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      onCleanup?.();
      releaseConnection();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

