import crypto from "crypto";

const KNOWN_WEAK_SECRET = "minsu_doctrack_secure_session_secret_2026";
const DEV_FALLBACK_KEY =
  "minsu_dev_only_ephemeral_fallback_secret_do_not_use_in_prod_2026";
const ENC_PREFIX = "enc:v1:";

function getMasterKey(): Buffer {
  const configured = process.env.SESSION_SECRET?.trim() ?? "";
  let material: string;

  if (process.env.NODE_ENV === "production") {
    if (!configured || configured.length < 32 || configured === KNOWN_WEAK_SECRET) {
      throw new Error(
        "FATAL: SESSION_SECRET must be set to a strong non-default secret (>=32 chars) in production."
      );
    }
    material = configured;
  } else {
    material = configured.length >= 16 ? configured : DEV_FALLBACK_KEY;
  }

  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(material, "utf8"),
      Buffer.from("minsu-doctrack-totp-box-salt-v1", "utf8"),
      Buffer.from("aes-256-gcm-totp-secret", "utf8"),
      32
    )
  );
}

/**
 * Encrypts sensitive strings (e.g., Base32 TOTP secrets) with AES-256-GCM.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext;

  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/**
 * Decrypts AES-256-GCM encrypted secrets, keeping backward read compatibility for legacy unencrypted Base32 values.
 */
export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) {
    return stored;
  }

  const body = stored.slice(ENC_PREFIX.length);
  const parts = body.split(".");
  if (parts.length !== 3) {
    throw new Error("Corrupted encrypted secret envelope");
  }

  const [ivB64, tagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(cipherB64, "base64url");

  const key = getMasterKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

