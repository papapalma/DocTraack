import assert from "node:assert";
import { detectFileType } from "../src/components/ui/download-hud";

console.log("===============================================================================");
console.log("Starting Universal Download Animation & File Detection Unit Test Suite");
console.log("===============================================================================");

// 1. Test File Type Detection
console.log("\n▶ Testing detectFileType for all supported document formats...");

assert.strictEqual(detectFileType("Annex_1_Masterlist.xlsx"), "excel");
assert.strictEqual(detectFileType("report.XLS"), "excel");
assert.strictEqual(detectFileType("/api/annex-1/export-excel"), "excel");
assert.strictEqual(detectFileType("Annex_10_NOA.doc"), "word");
assert.strictEqual(detectFileType("Notice_of_Award.docx"), "word");
assert.strictEqual(detectFileType("/api/annex-10/export-doc"), "word");
assert.strictEqual(detectFileType("student-report.pdf"), "pdf");
assert.strictEqual(detectFileType("audit-logs.csv"), "csv");
assert.strictEqual(detectFileType("/api/analytics?format=csv"), "csv");
assert.strictEqual(detectFileType("backup.json"), "json");
assert.strictEqual(detectFileType("unknown-file.bin"), "generic");
assert.strictEqual(detectFileType("", "https://minsu.edu.ph/export/file.pdf"), "pdf");
assert.strictEqual(detectFileType("", "/api/verification/runs/abc-123/export?format=excel"), "excel");
assert.strictEqual(detectFileType("", "/api/verification/runs/abc-123/export?format=csv"), "csv");
assert.strictEqual(detectFileType("ched_template_doctrack.csv", "/api/verification/templates/ched"), "csv");
assert.strictEqual(detectFileType("registrar_template_doctrack.csv", "/api/verification/templates/registrar"), "csv");

console.log("  ✔ All detectFileType tests passed accurately!");

// 2. Test Content-Disposition Header Extraction Logic
console.log("\n▶ Testing Content-Disposition header regex parsing...");

function parseHeader(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const match = header.match(/filename=["']?([^"';]+)["']?/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

assert.strictEqual(
  parseHeader('attachment; filename="Annex_1_TDP_Masterlist_2026.xlsx"'),
  "Annex_1_TDP_Masterlist_2026.xlsx"
);
assert.strictEqual(
  parseHeader("attachment; filename=Annex_8_RCI_Report.xlsx"),
  "Annex_8_RCI_Report.xlsx"
);
assert.strictEqual(
  parseHeader("attachment; filename*=UTF-8''Annex%209%20Payroll%202026.xlsx"),
  "Annex 9 Payroll 2026.xlsx"
);
assert.strictEqual(parseHeader(null), null);
assert.strictEqual(parseHeader("inline"), null);

console.log("  ✔ All Content-Disposition extraction tests passed!");

console.log("\n===============================================================================");
console.log("ALL DOWNLOAD ANIMATION UNIT TESTS PASSED SUCCESSFULLY! 🎉");
console.log("===============================================================================\n");

