/**
 * Security validation and input sanitization utilities
 */
import type ExcelJS from "exceljs";

// Standard RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common disposable/temporary email provider domains to reject for student accounts
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "trashmail.com",
]);

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return false;
  }
  return true;
}

export function isAllowedEmailDomain(email: string): { valid: boolean; message?: string } {
  if (!isValidEmail(email)) {
    return { valid: false, message: "Please provide a valid email address format." };
  }
  const domain = email.trim().toLowerCase().split("@")[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, message: "Temporary or disposable email addresses are not permitted." };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { valid: false, message: "Password cannot exceed 128 characters" };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: "Password must contain at least one letter and one number" };
  }
  return { valid: true };
}

export function sanitizeText(input: string, maxLength = 2000): string {
  if (!input || typeof input !== "string") return "";
  // Strip null bytes and control characters (except newline and tab)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim().slice(0, maxLength);
}

/**
 * 1. Philippine Mobile Phone Validator
 * Validates 11-digit 09XXXXXXXXX or +639XXXXXXXXX
 */
export function isValidPhilippineMobile(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.replace(/[\s-]/g, "");
  return /^(09\d{9}|\+639\d{9}|639\d{9})$/.test(clean);
}

export function normalizePhilippineMobile(phone: string): string {
  const clean = (phone || "").replace(/[\s-]/g, "");
  if (clean.startsWith("+63")) {
    return "0" + clean.slice(3);
  }
  if (clean.startsWith("63") && clean.length === 12) {
    return "0" + clean.slice(2);
  }
  return clean;
}

/**
 * 2. Global MinSU Student ID Validator
 * MinSU format: alphanumeric with hyphens, 6 to 25 characters (e.g. 2024-00123-BC, 2023-01234-MC)
 */
export function isValidStudentId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length < 6 || trimmed.length > 25) return false;
  // Must contain alphanumeric characters with optional single hyphens separating parts
  return /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(trimmed);
}

/**
 * 3. Minimum Age Validator (from birthdate string YYYY-MM-DD)
 * Enforces student age >= 15 years old and not in future
 */
export function isMinimumAge(birthdateStr: string, minAge = 15): { valid: boolean; age?: number; message?: string } {
  if (!birthdateStr) {
    return { valid: false, message: "Birthdate is required." };
  }
  const birth = new Date(birthdateStr);
  if (isNaN(birth.getTime())) {
    return { valid: false, message: "Please provide a valid birthdate." };
  }

  const today = new Date();
  if (birth > today) {
    return { valid: false, message: "Birthdate cannot be in the future." };
  }

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { valid: false, age, message: `Applicant must be at least ${minAge} years of age.` };
  }

  if (age > 90) {
    return { valid: false, age, message: "Please enter a valid birthdate." };
  }

  return { valid: true, age };
}

/**
 * 4. Dual-Scale GWA Validator
 * Accepts either:
 * - College Scale: 1.00 <= GWA <= 3.00
 * - OR Percentage Scale: 75 <= GWA <= 100
 */
export function isValidGWA(gwaInput: string | number): {
  valid: boolean;
  normalized?: number;
  scale?: "college" | "percentage";
  message?: string;
} {
  if (gwaInput === "" || gwaInput === null || gwaInput === undefined) {
    return { valid: false, message: "GWA is required." };
  }
  const clean = String(gwaInput).trim();
  const num = parseFloat(clean);
  if (isNaN(num)) {
    return { valid: false, message: "Please enter a valid numeric GWA." };
  }

  // College Scale: 1.00 <= GWA <= 3.00
  if (num >= 1.0 && num <= 3.0) {
    return { valid: true, normalized: Math.round(num * 100) / 100, scale: "college" };
  }

  // Percentage Scale: 75.0 <= GWA <= 100.0
  if (num >= 75.0 && num <= 100.0) {
    return { valid: true, normalized: Math.round(num * 100) / 100, scale: "percentage" };
  }

  return {
    valid: false,
    message: "GWA must be between 1.00 - 3.00 (College scale) or 75 - 100 (Percentage scale).",
  };
}

/**
 * 5. Positive Income Validator
 * Must be a positive numeric value (> 0)
 */
export function isValidIncome(incomeInput: string | number): { valid: boolean; value?: number; message?: string } {
  if (incomeInput === "" || incomeInput === null || incomeInput === undefined) {
    return { valid: false, message: "Monthly family gross income is required." };
  }
  const clean = String(incomeInput).replace(/[,\s₱]/g, "").trim();
  const num = parseFloat(clean);
  if (isNaN(num)) {
    return { valid: false, message: "Please enter a valid numeric income amount." };
  }
  if (num <= 0) {
    return { valid: false, message: "Monthly family gross income must be greater than 0." };
  }
  if (num > 10000000) {
    return { valid: false, message: "Income amount exceeds permissible limit." };
  }
  return { valid: true, value: num };
}

/**
 * 6. Person Name Validator
 * Validates names contain only letters, hyphens, periods, and spaces
 */
export function isValidPersonName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  // Unicode letter characters, periods, apostrophes, hyphens, spaces
  return /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'.-]+$/.test(trimmed);
}

/**
 * Escapes HTML special characters for safe HTML/Word rendering.
 */
export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}

const FORMULA_TRIGGER_REGEX = /^[\t\r ]*[=+\-@]|^[\t\r]/;

/**
 * Neutralizes spreadsheet formula injection (CWE-1236) by prefixing an apostrophe
 * whenever a cell starts with =, +, -, @, tab, or carriage return.
 */
export function neutralizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (!str) return "";
  return FORMULA_TRIGGER_REGEX.test(str) ? `'${str}` : str;
}

/**
 * Neutralizes all plain-string cells across an ExcelJS workbook before serialization.
 */
export function sanitizeExcelWorkbook(workbook: ExcelJS.Workbook): void {
  for (const ws of workbook.worksheets) {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === "string") {
          cell.value = neutralizeSpreadsheetCell(cell.value);
        }
      });
    });
  }
}

/**
 * Escapes and formula-neutralizes a cell for standard comma-delimited CSV output.
 */
export function escapeCsvCell(value: unknown): string {
  const neutralized = neutralizeSpreadsheetCell(value);
  return `"${neutralized.replace(/"/g, '""')}"`;
}

/**
 * Sanitizes and formula-neutralizes a cell for pipe-delimited CSV export (strips |, CR, LF).
 */
export function sanitizePipeCsvCell(value: unknown): string {
  const flat =
    value === null || value === undefined
      ? ""
      : String(value).replace(/[|\r\n]+/g, " ");
  return neutralizeSpreadsheetCell(flat);
}

/**
 * Restricts download header filenames to safe ASCII tokens.
 */
export function sanitizeDownloadFilename(
  name: string,
  fallback = "export"
): string {
  const clean = (name || "")
    .replace(/\.{2,}/g, "_")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 100);
  return clean || fallback;
}

/**
 * Validates that an external link uses an explicit HTTP/HTTPS scheme (blocks javascript:, data:, vbscript:).
 */
export function parseSafeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048 || /[\x00-\x1F\x7F]/.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates either an internal root-relative path (/api/media/... or /logo.png)
 * or an explicit HTTP/HTTPS URL (blocks protocol-relative //, javascript:, data:).
 */
export function parseSafeAssetUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048 || /[\x00-\x1F\x7F]/.test(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }
  return parseSafeHttpUrl(trimmed);
}

/**
 * Safely parses a JSON request body as a plain non-array object.
 */
export async function safeJsonObject(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
