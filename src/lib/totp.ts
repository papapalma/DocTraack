import crypto from "crypto";
import bcrypt from "bcryptjs";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer to RFC 4648 Base32 without padding.
 */
export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string into a Buffer.
 */
export function decodeBase32(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      if (char === "=") break;
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret formatted for Microsoft Authenticator.
 * Standard length: 20 bytes (160 bits) -> 32 characters in Base32.
 */
export function generateBase32Secret(byteLength: number = 20): string {
  const randomBytes = crypto.randomBytes(byteLength);
  return encodeBase32(randomBytes);
}

/**
 * Formats a secret for manual entry into Microsoft Authenticator (e.g. ABCD EFGH JKLM NPQR).
 */
export function formatSecretForDisplay(secret: string): string {
  const cleaned = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join(" ");
}

/**
 * Generates a 6-digit Time-based One-Time Password (RFC 6238).
 */
export function generateTOTP(
  secret: string,
  timestampMs: number = Date.now(),
  timeStepSec: number = 30,
  digits: number = 6
): string {
  const secretBuffer = decodeBase32(secret);
  const counter = Math.floor(timestampMs / 1000 / timeStepSec);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Verifies a 6-digit TOTP code against the secret within a drift window.
 * Default window = 1 allows -30s to +30s tolerance.
 */
export function verifyTOTP(
  token: string,
  secret: string,
  windowSteps: number = 1,
  timeStepSec: number = 30
): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const now = Date.now();
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const timestamp = now + i * timeStepSec * 1000;
    const expected = generateTOTP(secret, timestamp, timeStepSec, 6);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates the standard otpauth URI compatible with Microsoft Authenticator.
 */
export function generateOTPAuthUrl(
  accountName: string,
  secret: string,
  issuer: string = "Mindoro State University"
): string {
  const cleanAccount = accountName.trim();
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(cleanAccount)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generates emergency backup recovery codes (8 codes of 8 hex digits formatted XXXX-XXXX).
 * Hashes each code with bcrypt (10 rounds).
 */
export async function generateRecoveryCodes(count: number = 8): Promise<{
  plainCodes: string[];
  hashedCodes: string[];
}> {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const code = `${p1}-${p2}`;
    plainCodes.push(code);
    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verifies an emergency backup recovery code against an array of bcrypt-hashed codes.
 * Returns the updated array with the used code removed if valid.
 */
export async function verifyRecoveryCode(
  inputCode: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; remainingHashedCodes: string[] }> {
  if (!inputCode || !Array.isArray(hashedCodes) || hashedCodes.length === 0) {
    return { valid: false, remainingHashedCodes: hashedCodes || [] };
  }

  const cleanInput = inputCode.trim().toUpperCase();
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(cleanInput, hashedCodes[i]);
    if (isMatch) {
      const remainingHashedCodes = hashedCodes.filter((_, idx) => idx !== i);
      return { valid: true, remainingHashedCodes };
    }
  }

  return { valid: false, remainingHashedCodes: hashedCodes };
}

