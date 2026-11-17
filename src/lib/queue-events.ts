import { EventEmitter } from "events";
import type { QueueEventType, QueueRealtimeEvent } from "@/types/queue";

interface QueueEventHub {
  emitter: EventEmitter;
  version: number;
}

const globalForQueue = globalThis as unknown as {
  minsuQueueHub: QueueEventHub | undefined;
};

const hub: QueueEventHub =
  globalForQueue.minsuQueueHub ?? {
    emitter: new EventEmitter(),
    version: 1,
  };

hub.emitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalForQueue.minsuQueueHub = hub;
}

export function getQueueVersion(): number {
  return hub.version;
}

export function emitQueueEvent(params: {
  type: QueueEventType;
  campus: string;
  queueDate: string;
  ticketNumber?: string;
  counterName?: string;
  recallTick?: number;
}): QueueRealtimeEvent {
  hub.version += 1;
  const event: QueueRealtimeEvent = {
    ...params,
    version: hub.version,
    timestamp: new Date().toISOString(),
  };
  hub.emitter.emit("queue-change", event);
  return event;
}

export function subscribeQueueEvents(
  listener: (event: QueueRealtimeEvent) => void
): () => void {
  hub.emitter.on("queue-change", listener);
  return () => {
    hub.emitter.off("queue-change", listener);
  };
}

