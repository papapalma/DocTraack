import { Role } from "@/types";

export const SESSION_COOKIE_NAME = "minsu_session_token";
export const SESSION_META_COOKIE_NAME = "minsu_session_meta";
export const TWO_FA_SETUP_COOKIE_NAME = "minsu_2fa_setup_token";
export const TWO_FA_PENDING_COOKIE_NAME = "minsu_2fa_pending";

const KNOWN_WEAK_SECRET = "minsu_doctrack_secure_session_secret_2026";
const DEV_FALLBACK_KEY = "minsu_dev_only_ephemeral_fallback_secret_do_not_use_in_prod_2026";
const VALID_ROLES = new Set<Role>([
  "DIRECTOR",
  "STAFF",
  "ACCOUNTING",
  "SYSTEM_ADMIN",
  "STUDENT",
]);

export interface EdgeSessionMeta {
  sub: string;
  role: Role;
  exp: number;
}

function getSigningSecretMaterial(): string {
  const configured = process.env.SESSION_SECRET?.trim() ?? "";
  if (process.env.NODE_ENV === "production") {
    if (!configured || configured.length < 32 || configured === KNOWN_WEAK_SECRET) {
      throw new Error(
        "FATAL: SESSION_SECRET must be set to a strong non-default secret (>=32 chars) in production."
      );
    }
    return configured;
  }
  return configured.length >= 16 ? configured : DEV_FALLBACK_KEY;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const base64 = padded + "=".repeat(padLen);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSigningSecretMaterial());
  return crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a generic purpose-bound payload for short-lived HttpOnly flow cookies.
 */
export async function signScopedToken<T extends Record<string, unknown>>(
  payload: T,
  purpose: string,
  ttlMs: number
): Promise<string> {
  const fullPayload = {
    ...payload,
    purpose,
    exp: Date.now() + ttlMs,
  };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(fullPayload));
  const payloadB64 = toBase64Url(payloadBytes);
  const key = await importHmacKey();
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return `${payloadB64}.${toBase64Url(new Uint8Array(sigBuffer))}`;
}

/**
 * Verifies an HMAC-SHA256 scoped token created by signScopedToken.
 */
export async function verifyScopedToken<T extends Record<string, unknown>>(
  token: string | undefined | null,
  expectedPurpose: string
): Promise<(T & { purpose: string; exp: number }) | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const sigBytes = fromBase64Url(sigB64);
  if (!sigBytes) return null;

  try {
    const key = await importHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const payloadBytes = fromBase64Url(payloadB64);
    if (!payloadBytes) return null;
    const decoded = JSON.parse(new TextDecoder().decode(payloadBytes)) as Record<
      string,
      unknown
    >;

    if (
      decoded.purpose !== expectedPurpose ||
      typeof decoded.exp !== "number" ||
      decoded.exp <= Date.now()
    ) {
      return null;
    }
    return decoded as T & { purpose: string; exp: number };
  } catch {
    return null;
  }
}

export async function signEdgeSessionMeta(
  meta: EdgeSessionMeta
): Promise<string> {
  const ttl = Math.max(1000, meta.exp - Date.now());
  return signScopedToken(
    { sub: meta.sub, role: meta.role },
    "edge_session",
    ttl
  );
}

export async function verifyEdgeSessionMeta(
  token: string | undefined | null
): Promise<EdgeSessionMeta | null> {
  const parsed = await verifyScopedToken<{ sub?: unknown; role?: unknown }>(
    token,
    "edge_session"
  );
  if (!parsed) return null;
  if (
    typeof parsed.sub !== "string" ||
    !parsed.sub ||
    typeof parsed.role !== "string" ||
    !VALID_ROLES.has(parsed.role as Role)
  ) {
    return null;
  }
  return {
    sub: parsed.sub,
    role: parsed.role as Role,
    exp: parsed.exp,
  };
}

