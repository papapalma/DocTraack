import assert from "node:assert";
import { PAPER_SIZE_CONFIGS, PaperSize } from "../src/types";

console.log("Starting Document Paper Sizes & Export Configurations Test Suite...");

// 1. Verify all 4 required paper sizes exist
const expectedSizes: PaperSize[] = ["a4", "short", "long", "legal"];
for (const size of expectedSizes) {
  assert(PAPER_SIZE_CONFIGS[size], `Missing configuration for paper size: ${size}`);
  const config = PAPER_SIZE_CONFIGS[size];
  assert(config.id === size, `Config id mismatch: ${config.id} vs ${size}`);
  assert(config.label.length > 0, `Missing label for: ${size}`);
  assert(config.widthMm > 0 && config.heightMm > 0, `Invalid mm dimensions for: ${size}`);
  assert(config.widthIn > 0 && config.heightIn > 0, `Invalid inch dimensions for: ${size}`);
  assert(config.cssSize.length > 0, `Missing cssSize for: ${size}`);
  assert(config.aspectRatio > 0 && config.aspectRatio < 1, `Invalid aspect ratio for: ${size}`);
}

console.log("✔ All 4 paper sizes (A4, Short, Long, Legal) correctly defined.");

// 2. Verify Philippine government dimensions
// A4: 210mm x 297mm
assert.strictEqual(PAPER_SIZE_CONFIGS.a4.widthMm, 210);
assert.strictEqual(PAPER_SIZE_CONFIGS.a4.heightMm, 297);
assert.strictEqual(PAPER_SIZE_CONFIGS.a4.cssSize, "210mm 297mm");

// Short: 8.5" x 11" (Letter)
assert.strictEqual(PAPER_SIZE_CONFIGS.short.widthIn, 8.5);
assert.strictEqual(PAPER_SIZE_CONFIGS.short.heightIn, 11.0);
assert.strictEqual(PAPER_SIZE_CONFIGS.short.cssSize, "8.5in 11in");

// Long: 8.5" x 13" (Philippine Folio)
assert.strictEqual(PAPER_SIZE_CONFIGS.long.widthIn, 8.5);
assert.strictEqual(PAPER_SIZE_CONFIGS.long.heightIn, 13.0);
assert.strictEqual(PAPER_SIZE_CONFIGS.long.cssSize, "8.5in 13in");

// Legal: 8.5" x 14" (US Legal)
assert.strictEqual(PAPER_SIZE_CONFIGS.legal.widthIn, 8.5);
assert.strictEqual(PAPER_SIZE_CONFIGS.legal.heightIn, 14.0);
assert.strictEqual(PAPER_SIZE_CONFIGS.legal.cssSize, "8.5in 14in");

console.log("✔ Philippine government & university paper dimensions accurately calibrated.");

// 3. Verify @page CSS syntax generation
function generatePageCss(size: PaperSize, orientation: "portrait" | "landscape"): string {
  const cfg = PAPER_SIZE_CONFIGS[size];
  return `@page { size: ${cfg.cssSize} ${orientation}; margin: 8mm 10mm; }`;
}

assert.strictEqual(
  generatePageCss("a4", "portrait"),
  "@page { size: 210mm 297mm portrait; margin: 8mm 10mm; }"
);
assert.strictEqual(
  generatePageCss("long", "landscape"),
  "@page { size: 8.5in 13in landscape; margin: 8mm 10mm; }"
);
assert.strictEqual(
  generatePageCss("short", "portrait"),
  "@page { size: 8.5in 11in portrait; margin: 8mm 10mm; }"
);
assert.strictEqual(
  generatePageCss("legal", "landscape"),
  "@page { size: 8.5in 14in landscape; margin: 8mm 10mm; }"
);

console.log("✔ Dynamic @page CSS rule generation verified.");
console.log("ALL DOCUMENT PAPER SIZES TESTS PASSED SUCCESSFULLY! 🎉");

