/**
 * Unit Tests for Annex Preset System, RBAC, Upload Validation, Pagination & PDF Export
 * Run with: npx tsx tests/annex-presets.test.ts
 */

import assert from "assert";
import { PDFDocument } from "pdf-lib";
import { canManageAnnexPresets, canSelectAnnexPreset } from "../src/lib/rbac";
import {
  PRESET_SUPPORTED_ANNEX_NUMBERS,
  isPresetSupportedAnnex,
  buildDefaultPreset1Config,
  buildEmptyCustomPresetConfig,
  getDefaultTableSourceForAnnex,
  getDefaultTableColumnsForSource,
  getAvailableTableColumnFields,
  normalizeTableColumnWidths,
  getFormDataArrayKeyForTableSource,
  chunkTableRows,
  validatePresetUploadBytes,
  applyPresetSettingsToAnnexDefaults,
} from "../src/lib/annex-presets";
import {
  expandPresetPageSlices,
  exportCustomPresetPdf,
} from "../src/lib/preset-pdf-export";
import type { AnnexPresetConfig } from "../src/types/presets";
import type { Role } from "../src/types";

async function runTests() {
  console.log("Starting Annex Presets Unit Tests...\n");

  // 1. RBAC Verification
  console.log("1. Testing Annex Preset RBAC matrix...");
  const allRoles: Role[] = ["STAFF", "DIRECTOR", "ACCOUNTING", "SYSTEM_ADMIN", "STUDENT"];
  for (const role of allRoles) {
    assert.strictEqual(
      canManageAnnexPresets(role),
      role === "STAFF",
      `Expected canManageAnnexPresets("${role}") to be ${role === "STAFF"}`
    );
  }

  for (const annex of [1, 3, 4, 5, 6, 7, 8, 9, 10]) {
    assert.strictEqual(canSelectAnnexPreset("STAFF", annex), true);
  }
  assert.strictEqual(canSelectAnnexPreset("STAFF", 2), false);

  for (const annex of [6, 7, 8, 9]) {
    assert.strictEqual(canSelectAnnexPreset("ACCOUNTING", annex), true);
  }
  for (const annex of [1, 2, 3, 4, 5, 10]) {
    assert.strictEqual(canSelectAnnexPreset("ACCOUNTING", annex), false);
  }
  for (const role of ["DIRECTOR", "SYSTEM_ADMIN", "STUDENT"] as Role[]) {
    for (const annex of PRESET_SUPPORTED_ANNEX_NUMBERS) {
      assert.strictEqual(canSelectAnnexPreset(role, annex), false);
    }
  }

  // 2. Preset Supported Annexes & Retained Settings across Annexes 3-10
  console.log("2. Testing Preset 1 defaults & retained settings merge (Annexes 3-10)...");
  for (const n of [1, 3, 4, 5, 6, 7, 8, 9, 10]) {
    assert.strictEqual(isPresetSupportedAnnex(n), true);
  }
  assert.strictEqual(isPresetSupportedAnnex(2), false);
  assert.strictEqual(isPresetSupportedAnnex(11), false);

  for (const annexNumber of [3, 4, 5, 6, 7, 8, 9, 10]) {
    const preset1 = buildDefaultPreset1Config(annexNumber);
    assert.strictEqual(preset1.kind, "BUILT_IN");
    assert.ok(preset1.pages.length >= 1);

    const customized: AnnexPresetConfig = {
      ...preset1,
      settings: {
        ...preset1.settings,
        campus: "Calapan Campus",
        heiName: "Mindoro State University — Calapan Campus",
        heiAddress: "Masipit, Calapan City, Oriental Mindoro",
        regionCode: "IV-B",
        heiCode: "04101",
        academicYear: "2026-2027",
        termCode: "2",
        trancheNumber: "Tranche 2",
        batchNumber: "Batch 4",
        stipendTier: "7500",
        stipendPerGrantee: 15000,
        managementFeeRate: 0.05,
        headerLogos: {
          ...preset1.settings.headerLogos,
          leftLogo: {
            type: "custom",
            url: "/api/media/annex-preset/sample-left.png",
            alt: "MinSU Logo",
          },
        },
        signatories: {
          ...preset1.settings.signatories,
          preparedBy: { name: "Maria Clara", position: "TDP Coordinator" },
          certifiedBy: { name: "Dr. Jose Rizal", position: "Registrar" },
          approvedBy: { name: "Dr. Enya Santos", position: "Campus Director" },
          signatory: { name: "Dr. Enya Santos", position: "Campus Director" },
        },
        extraDefaults: {
          memorandumOrderRef: "CMO No. 99 s. 2026",
          conditions: ["Condition A", "Condition B"],
        },
      },
      elements: [
        {
          id: "extra-field-1",
          pageId: preset1.pages[0]?.id || "page-1",
          type: "textbox",
          label: "Custom Voucher Ref",
          fieldKey: "voucherRef",
          defaultValue: "VCH-2026-01",
          xPct: 10,
          yPct: 10,
          wPct: 30,
          hPct: 5,
        },
        {
          id: "extra-check-1",
          pageId: preset1.pages[0]?.id || "page-1",
          type: "checkbox",
          label: "Verified Flag",
          fieldKey: "verifiedFlag",
          checkedDefault: true,
          xPct: 45,
          yPct: 10,
          wPct: 5,
          hPct: 5,
        },
      ],
    };

    const merged = applyPresetSettingsToAnnexDefaults<Record<string, unknown>>(
      annexNumber,
      { headerLogos: { rightLogo: { type: "preset", presetId: "ched" } } },
      customized
    );

    const customFields = merged.customFields as Record<string, unknown>;
    assert.strictEqual(customFields.voucherRef, "VCH-2026-01");
    assert.strictEqual(customFields.verifiedFlag, true);
    assert.strictEqual(
      ((merged.headerLogos as Record<string, unknown>).leftLogo as Record<string, unknown>).url,
      "/api/media/annex-preset/sample-left.png"
    );

    if ([3, 4].includes(annexNumber)) {
      assert.strictEqual(merged.academicYear, "2026-2027");
      assert.strictEqual(merged.stipendTier, "7500");
      assert.strictEqual(merged.stipendPerGrantee, 15000);
    }
    if (annexNumber === 5) {
      assert.strictEqual(merged.region, "IV-B");
      assert.strictEqual(merged.term, "2nd");
    }
    if (annexNumber === 6) {
      assert.strictEqual(merged.heiName, "Mindoro State University — Calapan Campus");
    }
    if (annexNumber === 7) {
      assert.strictEqual(merged.entityName, "Mindoro State University — Calapan Campus");
      assert.strictEqual(merged.disbursingOfficerName, "Maria Clara");
    }
    if (annexNumber === 8) {
      assert.strictEqual(merged.cashierName, "Maria Clara");
      assert.strictEqual(merged.accountantName, "Dr. Jose Rizal");
      assert.strictEqual(merged.presidentName, "Dr. Enya Santos");
    }
    if (annexNumber === 9) {
      assert.strictEqual(merged.campus, "Calapan Campus");
      assert.strictEqual(merged.stipendAmountPerScholar, 15000);
    }
    if (annexNumber === 10) {
      assert.strictEqual(merged.defaultAcademicYear, "2026-2027");
      assert.strictEqual(merged.defaultStartingSemester, "2nd");
      assert.strictEqual(merged.stipendAmountPerSem, 15000);
      assert.strictEqual(merged.memorandumOrderRef, "CMO No. 99 s. 2026");
    }
  }

  // 3. Magic-byte Upload Security Validation
  console.log("3. Testing magic-byte file upload validation...");
  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
  const pdfCheck = validatePresetUploadBytes(pdfBytes, "application/pdf");
  assert.strictEqual(pdfCheck.valid, true);
  assert.strictEqual(pdfCheck.detectedExt, ".pdf");

  // Windows browser / drag-drop often reports octet-stream or empty MIME for .pdf files
  const pdfOctetCheck = validatePresetUploadBytes(pdfBytes, "application/octet-stream");
  assert.strictEqual(pdfOctetCheck.valid, true);
  assert.strictEqual(pdfOctetCheck.detectedExt, ".pdf");

  const pdfEmptyMimeCheck = validatePresetUploadBytes(pdfBytes, "");
  assert.strictEqual(pdfEmptyMimeCheck.valid, true);
  assert.strictEqual(pdfEmptyMimeCheck.detectedExt, ".pdf");

  // PDF with leading UTF-8 BOM / whitespace within first 1024 bytes
  const pdfBomBytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x20, 0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  const pdfBomCheck = validatePresetUploadBytes(pdfBomBytes, "application/pdf");
  assert.strictEqual(pdfBomCheck.valid, true);
  assert.strictEqual(pdfBomCheck.detectedExt, ".pdf");

  // Reject dangerous/mismatched MIME claims on %PDF- bytes
  assert.strictEqual(validatePresetUploadBytes(pdfBytes, "text/html").valid, false);
  assert.strictEqual(validatePresetUploadBytes(pdfBytes, "image/svg+xml").valid, false);

  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const pngCheck = validatePresetUploadBytes(pngBytes, "image/png");
  assert.strictEqual(pngCheck.valid, true);
  assert.strictEqual(pngCheck.detectedExt, ".png");

  const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const jpgCheck = validatePresetUploadBytes(jpgBytes, "image/jpeg");
  assert.strictEqual(jpgCheck.valid, true);
  assert.strictEqual(jpgCheck.detectedExt, ".jpg");

  const webpBytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
  const webpCheck = validatePresetUploadBytes(webpBytes, "image/webp");
  assert.strictEqual(webpCheck.valid, true);
  assert.strictEqual(webpCheck.detectedExt, ".webp");

  const svgSpoof = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.strictEqual(validatePresetUploadBytes(svgSpoof, "image/png").valid, false);
  assert.strictEqual(validatePresetUploadBytes(svgSpoof, "image/svg+xml").valid, false);

  const htmlSpoof = new TextEncoder().encode("<!DOCTYPE html><html><body>x</body></html>");
  assert.strictEqual(validatePresetUploadBytes(htmlSpoof, "application/pdf").valid, false);
  assert.strictEqual(validatePresetUploadBytes(new Uint8Array([1, 2, 3]), "image/png").valid, false);

  // 4. 350-Row Table Chunking & Page Slice Expansion
  console.log("4. Testing 350-row table pagination & slice expansion...");
  const rows350 = Array.from({ length: 350 }, (_, idx) => ({
    seq: idx + 1,
    awardNumber: `TDP-2026-${String(idx + 1).padStart(4, "0")}`,
    lastName: `DELA CRUZ`,
    firstName: `JUAN ${idx + 1}`,
    middleName: `SANTOS`,
    program: `BSIT`,
    yearLevel: `3`,
    amount: 7500,
  }));

  const manualChunks = chunkTableRows(rows350, 25);
  assert.strictEqual(manualChunks.length, 14);
  assert.strictEqual(
    manualChunks.reduce((acc, c) => acc + c.length, 0),
    350
  );

  const emptyCustom = buildEmptyCustomPresetConfig(4);
  const dataSource = getDefaultTableSourceForAnnex(4);
  const columns = getDefaultTableColumnsForSource(dataSource);
  const customConfig: AnnexPresetConfig = {
    ...emptyCustom,
    pages: [
      {
        id: "custom-page-1",
        pageNumber: 1,
        label: "Page 1",
        sourceType: "pdf",
        fileUrl: "/api/media/annex-preset/mock.pdf",
        pdfPageIndex: 0,
        widthPt: 612,
        heightPt: 792,
        orientation: "portrait",
      },
    ],
    elements: [
      {
        id: "title-box",
        pageId: "custom-page-1",
        type: "bound_field",
        label: "Academic Year",
        bindingKey: "academicYear",
        xPct: 10,
        yPct: 8,
        wPct: 40,
        hPct: 4,
        style: { fontSizePt: 11, bold: true, fontFamily: "Helvetica" },
      },
      {
        id: "grantee-table-1",
        pageId: "custom-page-1",
        type: "data_table",
        label: "Grantees Masterlist Table",
        xPct: 5,
        yPct: 18,
        wPct: 90,
        hPct: 50,
        tableConfig: {
          dataSource,
          columns,
          rowHeightPt: 18,
          headerBgColor: "#1B5E20",
          showHeader: true,
          autoPaginate: true,
        },
      },
    ],
  };

  const formData: Record<string, unknown> = {
    academicYear: "2026-2027",
    grantees: rows350,
  };

  const slices = expandPresetPageSlices(customConfig, formData);
  // boxHeightPt = 0.5 * 792 = 396pt; header = 22pt -> (396 - 22) / 18 = 20 rows/page -> 18 pages
  assert.strictEqual(slices.length, 18);
  const totalSlicedRows = slices.reduce(
    (sum, s) => sum + (s.tableSliceMap["grantee-table-1"]?.length || 0),
    0
  );
  assert.strictEqual(totalSlicedRows, 350);
  assert.strictEqual(slices[0].tableSliceMap["grantee-table-1"][0].seq, 1);
  assert.strictEqual(
    slices[slices.length - 1].tableSliceMap["grantee-table-1"].slice(-1)[0].seq,
    350
  );

  // 5. Flattened Multi-Page PDF Export via pdf-lib
  console.log("5. Testing flattened multi-page PDF export with pdf-lib...");
  const baseDoc = await PDFDocument.create();
  baseDoc.addPage([612, 792]);
  const basePdfBytes = await baseDoc.save();

  const exportedBytes = await exportCustomPresetPdf(
    customConfig,
    formData,
    async () => basePdfBytes
  );

  assert.ok(exportedBytes.length > 500, "Expected non-trivial PDF output");
  assert.strictEqual(
    String.fromCharCode(...exportedBytes.slice(0, 5)),
    "%PDF-",
    "Expected %PDF- header"
  );

  const parsedExport = await PDFDocument.load(exportedBytes);
  assert.strictEqual(
    parsedExport.getPageCount(),
    slices.length,
    `Expected ${slices.length} exported PDF pages for 350 grantee rows`
  );

  // 6. Editable Dynamic Table Columns, Width Normalization & Currency/Custom Column PDF Export
  console.log("6. Testing editable Dynamic Table columns, normalization & currency PDF export...");
  const granteeFieldOptions = getAvailableTableColumnFields("grantees");
  assert.ok(granteeFieldOptions.some((f) => f.key === "remarks"));
  assert.ok(granteeFieldOptions.some((f) => f.key === "middleInitial"));
  assert.strictEqual(getFormDataArrayKeyForTableSource("annex1Students"), "students");
  assert.strictEqual(getFormDataArrayKeyForTableSource("heis"), "heis");
  assert.strictEqual(getFormDataArrayKeyForTableSource("adaEntries"), "entries");

  const unbalancedColumns = [
    { key: "controlNumber", label: "Seq No.", widthPct: 20, align: "center" as const, format: "text" as const },
    { key: "lastName", label: "Surname", widthPct: 40, align: "left" as const, format: "text" as const },
    { key: "totalAmount", label: "Stipend (₱)", widthPct: 45, align: "right" as const, format: "currency" as const },
    { key: "remarks", label: "Remarks", widthPct: 30, align: "left" as const, format: "text" as const },
  ];
  const normalizedCols = normalizeTableColumnWidths(unbalancedColumns);
  assert.strictEqual(
    normalizedCols.reduce((sum, col) => sum + col.widthPct, 0),
    100,
    "Normalized column widths must sum cleanly to 100%"
  );

  const customColConfig: AnnexPresetConfig = {
    ...customConfig,
    elements: [
      {
        id: "edited-table-1",
        pageId: "custom-page-1",
        type: "data_table",
        label: "Edited Grantees Table",
        xPct: 5,
        yPct: 15,
        wPct: 90,
        hPct: 60,
        tableConfig: {
          dataSource: "grantees",
          columns: unbalancedColumns,
          rowHeightPt: 18,
          headerBgColor: "#1B5E20",
          showHeader: true,
          autoPaginate: true,
        },
      },
    ],
  };

  const customTableExport = await exportCustomPresetPdf(
    customColConfig,
    {
      grantees: [
        {
          controlNumber: "00001",
          lastName: "DELA CRUZ",
          totalAmount: 7500,
          remarks: "Approved Batch 1",
        },
      ],
    },
    async () => basePdfBytes
  );
  assert.ok(customTableExport.length > 500, "Expected non-trivial PDF output with currency & custom column");
  const parsedCustomColPdf = await PDFDocument.load(customTableExport);
  assert.strictEqual(parsedCustomColPdf.getPageCount(), 1);

  console.log("\n✅ All Annex Presets unit tests passed!");
}

runTests().catch((err) => {
  console.error("❌ Annex Presets unit tests failed:", err);
  process.exit(1);
});
