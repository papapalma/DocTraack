import { LogoConfig } from "@/types";

export type PaperSize = "A4" | "LETTER" | "LONG" | "LEGAL";

export interface PaperSizeMeta {
  name: string;
  label: string;
  dimensions: string;
  printCss: string;
  aspectRatio: string;
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZES: Record<PaperSize, PaperSizeMeta> = {
  A4: {
    name: "A4",
    label: "A4 Standard (210 × 297 mm)",
    dimensions: "210 × 297 mm",
    printCss: "size: A4 landscape;",
    aspectRatio: "297 / 210", // ~1.414
    widthMm: 297,
    heightMm: 210,
  },
  LETTER: {
    name: "Short / Letter",
    label: "Short / Letter (8.5 × 11 in)",
    dimensions: "8.5 × 11 in",
    printCss: "size: letter landscape;",
    aspectRatio: "11 / 8.5", // ~1.294
    widthMm: 279.4,
    heightMm: 215.9,
  },
  LONG: {
    name: "Long / Folio",
    label: "Long / Folio (8.5 × 13 in - Philippine Standard)",
    dimensions: "8.5 × 13 in",
    printCss: "size: 13in 8.5in;",
    aspectRatio: "13 / 8.5", // ~1.529
    widthMm: 330.2,
    heightMm: 215.9,
  },
  LEGAL: {
    name: "Legal",
    label: "US Legal (8.5 × 14 in)",
    dimensions: "8.5 × 14 in",
    printCss: "size: legal landscape;",
    aspectRatio: "14 / 8.5", // ~1.647
    widthMm: 355.6,
    heightMm: 215.9,
  },
};

export interface CertificateTemplateConfig {
  // Paper Size
  paperSize: PaperSize;

  // Header & Seals (All Toggleable)
  showLeftLogo: boolean;
  showCenterLogo: boolean;
  showRightLogo: boolean;
  leftLogoConfig?: LogoConfig;
  centerLogoConfig?: LogoConfig;
  rightLogoConfig?: LogoConfig;
  showRepublicText: boolean;
  republicText: string;
  showAgencyText: boolean;
  agencyText: string;
  showUniversityName: boolean;
  universityName: string;
  showCampusName: boolean;
  campusName: string;

  // Title & Award Headline
  title: string;
  subtitle: string;
  awardPrefix: string; // e.g. "This is proudly presented to"

  // Citation Body Copy
  bodyText: string;

  // Individual Student Field Visibility Toggles
  showStudentId: boolean;
  showCourse: boolean;
  showCampus: boolean;
  showBatch: boolean;
  showTrackingCode: boolean;
  showDateAwarded: boolean;
  customDateAwarded: string; // optional override string (e.g. "Given this 5th day of November...")

  // Additional Custom Clause/Note (Toggleable)
  showAdditionalNote: boolean;
  additionalNoteText: string;

  // Signatories (Each Toggleable)
  showSignatory1: boolean;
  signatory1Name: string;
  signatory1Title: string;
  showSignatory2: boolean;
  signatory2Name: string;
  signatory2Title: string;

  // Visual Themes & Framing
  primaryColor: string; // MinSU Green
  accentColor: string; // MinSU Gold
  showWatermark: boolean;
  watermarkLogoConfig?: LogoConfig;
  showCornerBorders: boolean;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateConfig = {
  paperSize: "A4",

  showLeftLogo: true,
  showCenterLogo: false,
  showRightLogo: true,

  leftLogoConfig: {
    type: "custom",
    url: "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png",
    alt: "Institutional Left Seal",
  },
  centerLogoConfig: {
    type: "custom",
    url: "/logo.png",
    alt: "MinSU University Crest",
  },
  rightLogoConfig: {
    type: "custom",
    url: "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
    alt: "Institutional Right Seal",
  },

  showRepublicText: true,
  republicText: "Republic of the Philippines",

  showAgencyText: true,
  agencyText: "COMMISSION ON HIGHER EDUCATION • UNIFAST",

  showUniversityName: true,
  universityName: "MINDORO STATE UNIVERSITY",

  showCampusName: true,
  campusName: "Bongabong Campus • Labasan, Bongabong, Oriental Mindoro",

  title: "CERTIFICATE OF NO OTHER SCHOLAR",
  subtitle: "Verification of Non-Availment of Other Government or Private Scholarship",
  awardPrefix: "This official certification is issued to",

  bodyText:
    "for being officially enrolled as a bona fide student at {university_name} ({campus}) for Academic Year {academic_year}, and having been duly verified through the MinSU 3-Way Cross-Check Verification System as having NO other active government or private scholarship grants under CHED / UniFAST guidelines.",

  showStudentId: true,
  showCourse: true,
  showCampus: true,
  showBatch: true,
  showTrackingCode: true,
  showDateAwarded: true,
  customDateAwarded: "",

  showAdditionalNote: true,
  additionalNoteText:
    "This certification is issued upon official verification for scholarship qualification and compliance records.",

  showSignatory1: true,
  signatory1Name: "DR. NEMESIO H. DAVALOS",
  signatory1Title: "TDP Institutional Coordinator",

  showSignatory2: true,
  signatory2Name: "DR. EMMANUEL C. SISON",
  signatory2Title: "Campus Director / University President",

  primaryColor: "#1B5E20",
  accentColor: "#F2B705",
  showWatermark: true,
  watermarkLogoConfig: {
    type: "custom",
    url: "/minsu-seal.png",
    alt: "MinSU Watermark Seal",
  },
  showCornerBorders: true,
};

export interface StudentCertificateTokens {
  university_name?: string;
  student_name: string;
  student_id: string;
  course: string;
  campus: string;
  batch_number: string | number;
  academic_year: string;
  tracking_code: string;
  date_awarded: string;
}

export function renderCertificateBody(
  templateText: string,
  tokens: Partial<StudentCertificateTokens>
): string {
  if (!templateText) return "";
  let rendered = templateText;

  const map: Record<string, string> = {
    "{university_name}": tokens.university_name || "Mindoro State University",
    "{student_name}": tokens.student_name || "Juan Dela Cruz",
    "{student_id}": tokens.student_id || "2024-00123-BC",
    "{course}": tokens.course || "Bachelor of Science in Information Technology",
    "{campus}": tokens.campus || "Bongabong Campus",
    "{batch_number}": String(tokens.batch_number || 1),
    "{academic_year}": tokens.academic_year || "2026-2027",
    "{tracking_code}": tokens.tracking_code || "MINSU-VERIFY-2026-REG01",
    "{date_awarded}": tokens.date_awarded || new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };

  for (const [key, value] of Object.entries(map)) {
    rendered = rendered.replaceAll(key, value);
  }

  return rendered;
}

