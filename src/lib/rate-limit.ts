/**
 * In-memory sliding window rate limiter & progressive account lockout store.
 * Protects against brute-force attacks and denial-of-service attempts.
 *
 * ponytail: process-local Map store — horizontal multi-replica scaling would
 * require swapping to Redis/PostgreSQL shared counters.
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface LockoutRecord {
  failures: number;
  lockedUntil: number;
  lastFailureAt: number;
}

const store = new Map<string, RateLimitRecord>();
const lockoutStore = new Map<string, LockoutRecord>();
const MAX_BUCKETS = 10000;

function pruneStores(now: number) {
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
  for (const [key, lock] of lockoutStore.entries()) {
    if (lock.lockedUntil < now && now - lock.lastFailureAt > 3600000) {
      lockoutStore.delete(key);
    }
  }
}

// Cleanup stale records periodically every 5 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    pruneStores(Date.now());
  }, 300000);
  if (typeof timer === "object" && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
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
  if (store.size > MAX_BUCKETS) {
    pruneStores(now);
  }

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

/**
 * Checks whether an account/action key is temporarily locked out due to repeated failures.
 */
export function isLockedOut(key: string): { locked: boolean; retryAfterSec: number } {
  const now = Date.now();
  const record = lockoutStore.get(key);
  if (!record) return { locked: false, retryAfterSec: 0 };

  if (now - record.lastFailureAt > 3600000 && record.lockedUntil <= now) {
    lockoutStore.delete(key);
    return { locked: false, retryAfterSec: 0 };
  }

  if (record.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((record.lockedUntil - now) / 1000)),
    };
  }

  return { locked: false, retryAfterSec: 0 };
}

/**
 * Records a failed verification attempt and triggers progressive lockout after threshold.
 */
export function recordFailure(
  key: string,
  maxFailures = 5,
  baseLockMs = 5 * 60 * 1000
): { locked: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (lockoutStore.size > MAX_BUCKETS) {
    pruneStores(now);
  }

  const prev = lockoutStore.get(key);
  const failures =
    prev && now - prev.lastFailureAt < 3600000 ? prev.failures + 1 : 1;

  let lockedUntil = prev?.lockedUntil ?? 0;
  if (failures >= maxFailures) {
    const multiplier = Math.min(8, Math.pow(2, Math.floor((failures - maxFailures) / 2)));
    lockedUntil = now + baseLockMs * multiplier;
  }

  lockoutStore.set(key, { failures, lockedUntil, lastFailureAt: now });
  if (lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
    };
  }
  return { locked: false, retryAfterSec: 0 };
}

export function clearFailures(key: string): void {
  lockoutStore.delete(key);
}

const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/;

function sanitizeIpToken(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const candidate = raw.trim().replace(/^\[|\]$/g, "");
  return IP_PATTERN.test(candidate) ? candidate : null;
}

/**
 * Extracts client IP safely. Only honors proxy headers when TRUST_PROXY=true,
 * reading from the rightmost trusted proxy hop rather than client-forged leftmost entries.
 */
export function getClientIp(req: Request): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const hops = forwarded
        .split(",")
        .map((s) => sanitizeIpToken(s))
        .filter((s): s is string => Boolean(s));
      if (hops.length > 0) {
        const trustedHopDepth = Math.max(
          1,
          parseInt(process.env.TRUST_PROXY_HOPS || "1", 10) || 1
        );
        const index = Math.max(0, hops.length - trustedHopDepth);
        return hops[index];
      }
    }
    const realIp = sanitizeIpToken(req.headers.get("x-real-ip"));
    if (realIp) {
      return realIp;
    }
  }

  return "direct-peer";
}
