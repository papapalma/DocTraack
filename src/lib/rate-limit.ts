/**
 * In-memory sliding window rate limiter for security protection
 * Protects against brute-force attacks and denial-of-service attempts.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number; // in milliseconds
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

  if (record.timestamps.length >= options.limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = options.windowMs - (now - oldestTimestamp);
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 1000),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: options.limit - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
