/**
 * Normalization utilities for Philippine Student Names and MinSU Campuses
 */

// Common Philippine name suffixes
const SUFFIX_REGEX = /\b(JR|SR|II|III|IV|V|VI)\b\.?/i;

/**
 * Strip diacritics and accents (e.g. "Peña" -> "Pena", "Níño" -> "Nino")
 */
export function stripDiacritics(str: string): string {
  if (!str) return "";
  // Normalize Ñ / ñ specifically first, then standard unicode NFD diacritic stripping
  return str
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Extract name suffix (Jr, Sr, III, etc.) and return the base name and suffix
 */
export function extractSuffix(name: string): { base: string; suffix: string } {
  if (!name) return { base: "", suffix: "" };
  const clean = name.trim();
  const match = clean.match(SUFFIX_REGEX);
  if (match) {
    const suffix = match[1].toUpperCase();
    const base = clean.replace(match[0], "").replace(/[,.]/g, "").trim().replace(/\s+/g, " ");
    return { base, suffix };
  }
  return { base: clean.replace(/[,.]/g, "").trim(), suffix: "" };
}

/**
 * Normalize a single name component (removes special characters, extra spaces, accents, and lowercase)
 */
export function cleanNameString(str: string): string {
  if (!str) return "";
  return stripDiacritics(str)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Comprehensive name normalizer for student comparisons
 */
export function normalizeStudentName(name: string): {
  normalized: string;
  base: string;
  suffix: string;
} {
  const { base, suffix } = extractSuffix(name);
  const cleanBase = cleanNameString(base);
  const cleanSuffix = suffix.trim().toUpperCase();
  const normalized = cleanSuffix ? `${cleanBase} ${cleanSuffix}` : cleanBase;
  return { normalized, base: cleanBase, suffix: cleanSuffix };
}

/**
 * Normalizes middle name and extracts middle initial
 */
export function normalizeMiddleName(middle?: string | null): {
  full: string;
  initial: string;
} {
  if (!middle) return { full: "", initial: "" };
  const clean = cleanNameString(middle);
  if (!clean) return { full: "", initial: "" };
  return {
    full: clean,
    initial: clean.charAt(0),
  };
}

/**
 * Checks whether two middle names are compatible:
 * - If either is missing/empty, returns true (missing middle name handled gracefully)
 * - If both are present, matches if full names match or initials match
 */
export function isMiddleNameCompatible(
  m1?: string | null,
  m2?: string | null
): boolean {
  if (!m1 || !m2) return true;
  const norm1 = normalizeMiddleName(m1);
  const norm2 = normalizeMiddleName(m2);
  if (!norm1.full || !norm2.full) return true;
  if (norm1.full === norm2.full) return true;
  return norm1.initial === norm2.initial;
}

/**
 * Standardize MinSU campus and school names to prevent mismatch from acronyms or punctuation
 */
export function canonicalizeCampus(school: string): {
  canonical: string;
  displayName: string;
  isMinSU: boolean;
} {
  if (!school) {
    return {
      canonical: "UNKNOWN",
      displayName: "Unknown School",
      isMinSU: false,
    };
  }

  const clean = cleanNameString(school);

  // Check for Bongabong Campus
  if (clean.includes("BONGABONG")) {
    return {
      canonical: "MINSU_BONGABONG",
      displayName: "Mindoro State University - Bongabong Campus",
      isMinSU: true,
    };
  }

  // Check for Calapan Campus
  if (clean.includes("CALAPAN")) {
    return {
      canonical: "MINSU_CALAPAN",
      displayName: "Mindoro State University - Calapan Campus",
      isMinSU: true,
    };
  }

  // Check for Main / Victoria / Alcate Campus
  if (
    clean.includes("VICTORIA") ||
    clean.includes("ALCATE") ||
    clean.includes("MAIN")
  ) {
    return {
      canonical: "MINSU_MAIN",
      displayName: "Mindoro State University - Main Campus (Victoria)",
      isMinSU: true,
    };
  }

  // General MinSU without campus specified
  if (clean.includes("MINSU") || clean.includes("MINDORO STATE")) {
    return {
      canonical: "MINSU_GENERAL",
      displayName: "Mindoro State University",
      isMinSU: true,
    };
  }

  // External HEI
  return {
    canonical: clean,
    displayName: school.trim(),
    isMinSU: false,
  };
}

/**
 * Builds the canonical lookup key for exact matching
 */
export function buildMatchKey(
  lastName: string,
  firstName: string,
  school: string
): string {
  const normLast = normalizeStudentName(lastName).normalized;
  const normFirst = normalizeStudentName(firstName).normalized;
  const normSchool = canonicalizeCampus(school).canonical;
  return `${normLast}|${normFirst}|${normSchool}`;
}
