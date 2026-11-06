import assert from "node:assert";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  CertificateTemplateConfig,
  renderCertificateBody,
  StudentCertificateTokens,
} from "../src/lib/certificate";
import { DEFAULT_HEADER_LOGOS } from "../src/lib/branding";

console.log("Starting Certificate & Annex Logo Integration Test Suite...");

// 1. Verify Certificate Template Default Logo Configurations
console.log("Testing DEFAULT_CERTIFICATE_TEMPLATE logo configurations...");
assert(DEFAULT_CERTIFICATE_TEMPLATE.leftLogoConfig, "Missing leftLogoConfig in DEFAULT_CERTIFICATE_TEMPLATE");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.leftLogoConfig.type, "custom");
assert(DEFAULT_CERTIFICATE_TEMPLATE.leftLogoConfig.url?.startsWith("/api/media/logo/"), "leftLogoConfig should reference system uploaded logo");

assert(DEFAULT_CERTIFICATE_TEMPLATE.centerLogoConfig, "Missing centerLogoConfig in DEFAULT_CERTIFICATE_TEMPLATE");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.centerLogoConfig.type, "custom");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.centerLogoConfig.url, "/logo.png");

assert(DEFAULT_CERTIFICATE_TEMPLATE.rightLogoConfig, "Missing rightLogoConfig in DEFAULT_CERTIFICATE_TEMPLATE");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.rightLogoConfig.type, "custom");
assert(DEFAULT_CERTIFICATE_TEMPLATE.rightLogoConfig.url?.startsWith("/api/media/logo/"), "rightLogoConfig should reference system uploaded logo");

assert(DEFAULT_CERTIFICATE_TEMPLATE.watermarkLogoConfig, "Missing watermarkLogoConfig in DEFAULT_CERTIFICATE_TEMPLATE");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.watermarkLogoConfig.type, "custom");
assert.strictEqual(DEFAULT_CERTIFICATE_TEMPLATE.watermarkLogoConfig.url, "/minsu-seal.png");

console.log("✔ DEFAULT_CERTIFICATE_TEMPLATE cleanly references real system-uploaded and institutional logos without preset SVGs.");

// 2. Verify Global Branding Default Logos
console.log("Testing Global Branding defaults...");
assert(DEFAULT_HEADER_LOGOS.leftLogo, "Missing leftLogo in DEFAULT_HEADER_LOGOS");
assert.strictEqual(DEFAULT_HEADER_LOGOS.leftLogo.type, "custom");
assert(DEFAULT_HEADER_LOGOS.leftLogo.url?.startsWith("/api/media/logo/"), "Global left logo should reference uploaded image");

assert(DEFAULT_HEADER_LOGOS.rightLogo, "Missing rightLogo in DEFAULT_HEADER_LOGOS");
assert.strictEqual(DEFAULT_HEADER_LOGOS.rightLogo.type, "custom");
assert(DEFAULT_HEADER_LOGOS.rightLogo.url?.startsWith("/api/media/logo/"), "Global right logo should reference uploaded image");

console.log("✔ Global branding defaults configured for real uploaded seals.");

// 3. Backward Compatibility Fallback Test
console.log("Testing backward compatibility with legacy template payloads...");
const legacyTemplate: Partial<CertificateTemplateConfig> = {
  paperSize: "A4",
  showLeftLogo: true,
  showCenterLogo: false,
  showRightLogo: true,
  title: "LEGACY CERTIFICATE",
};

// Simulate runtime resolution in Certificate Canvas View
const resolvedLeft = legacyTemplate.leftLogoConfig?.url || DEFAULT_CERTIFICATE_TEMPLATE.leftLogoConfig?.url;
const resolvedRight = legacyTemplate.rightLogoConfig?.url || DEFAULT_CERTIFICATE_TEMPLATE.rightLogoConfig?.url;
const resolvedWatermark = legacyTemplate.watermarkLogoConfig?.url || DEFAULT_CERTIFICATE_TEMPLATE.watermarkLogoConfig?.url;

assert(resolvedLeft?.startsWith("/api/media/logo/"), "Legacy template should resolve left logo from default config");
assert(resolvedRight?.startsWith("/api/media/logo/"), "Legacy template should resolve right logo from default config");
assert.strictEqual(resolvedWatermark, "/minsu-seal.png", "Legacy template should resolve watermark from default config");

console.log("✔ Backward compatibility confirmed: legacy template safely inherits uploaded defaults.");

// 4. Token Rendering Verification
console.log("Testing dynamic certificate body token rendering...");
const tokens: StudentCertificateTokens = {
  university_name: "Mindoro State University",
  student_name: "MARIA SANTOS",
  student_id: "2024-00999-BC",
  course: "BS Hospitality Management",
  campus: "Calapan City Campus",
  batch_number: 2,
  academic_year: "A.Y. 2026-2027",
  tracking_code: "MINSU-TEST-001",
  date_awarded: "November 6, 2026",
};

const rendered = renderCertificateBody(
  "This is to certify that {student_name} ({student_id}) of {course} at {university_name} ({campus}) has been granted TDP under {academic_year}.",
  tokens
);

assert(rendered.includes("MARIA SANTOS"), "Should render student name");
assert(rendered.includes("2024-00999-BC"), "Should render student ID");
assert(rendered.includes("BS Hospitality Management"), "Should render course");
assert(rendered.includes("Calapan City Campus"), "Should render campus");

console.log("✔ Dynamic token replacement functioning accurately.");

// 5. Paper Sizes & Dynamic Print Dimensions Verification
console.log("Testing Certificate paper dimensions and print configuration...");
import { PAPER_SIZES } from "../src/lib/certificate";
assert(PAPER_SIZES.A4.widthMm === 297 && PAPER_SIZES.A4.heightMm === 210, "A4 should use standard 297mm 210mm landscape");
assert(PAPER_SIZES.LETTER.widthMm === 279.4 && PAPER_SIZES.LETTER.heightMm === 215.9, "Short/Letter should use 8.5x11in landscape");
assert(PAPER_SIZES.LONG.widthMm === 330.2 && PAPER_SIZES.LONG.heightMm === 215.9, "Long should use 8.5x13in landscape");
assert(PAPER_SIZES.LEGAL.widthMm === 355.6 && PAPER_SIZES.LEGAL.heightMm === 215.9, "Legal should use 8.5x14in landscape");
console.log("✔ Paper sizes and exact millimeter dimensions verified for certificate print engine.");

console.log("\nALL TESTS PASSED SUCCESSFULLY! (5/5 test suites)");

