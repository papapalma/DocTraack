import {
  AnnexPresetConfig,
  PresetModulesConfig,
  PresetPage,
  PresetRetainedSettings,
  PresetTableColumn,
  PresetTableDataSource,
} from "@/types/presets";
import { PAPER_SIZE_CONFIGS, PaperSize } from "@/types";
import { getMinsuCampusConfig } from "./campus-constants";

export const PRESET_SUPPORTED_ANNEX_NUMBERS = [1, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function isPresetSupportedAnnex(annexNumber: number): boolean {
  return (PRESET_SUPPORTED_ANNEX_NUMBERS as readonly number[]).includes(annexNumber);
}

export function getPaperPoints(
  paperSize: PaperSize,
  orientation: "portrait" | "landscape"
): { widthPt: number; heightPt: number } {
  const cfg = PAPER_SIZE_CONFIGS[paperSize] || PAPER_SIZE_CONFIGS.a4;
  const baseWidthPt = Math.round(cfg.widthIn * 72);
  const baseHeightPt = Math.round(cfg.heightIn * 72);
  return orientation === "landscape"
    ? { widthPt: baseHeightPt, heightPt: baseWidthPt }
    : { widthPt: baseWidthPt, heightPt: baseHeightPt };
}

export function getDefaultSignatoriesForAnnex(
  annexNumber: number
): PresetRetainedSettings["signatories"] {
  if (annexNumber === 5) {
    return {
      preparedBy: { name: "TDP FOCAL PERSON", position: "CHED Regional Office MIMAROPA" },
      certifiedBy: { name: "DR. EDNA IMELDA F. LEGAZPI", position: "Director IV, CHEDRO MIMAROPA" },
    };
  }
  if (annexNumber === 6 || annexNumber === 7 || annexNumber === 8) {
    return {
      preparedBy: { name: "MA. ELENA L. BAUTISTA, CPA", position: "Chief Accountant / Authorized Representative" },
      certifiedBy: { name: "ENGR. EDWIN C. CAYETANO", position: "HEI TES Focal Person" },
      approvedBy: { name: "DR. EMMANUEL C. MACALALAD", position: "University President" },
    };
  }
  if (annexNumber === 10) {
    return {
      signatory: {
        name: "DR. EDNA IMELDA F. LEGAZPI",
        position: "Director IV",
        office: "Office of the Director IV, CHED Regional Office MIMAROPA",
      },
    };
  }
  return {
    accountingHead: {
      name: "MA. ELENA L. BAUTISTA, CPA",
      position: "Chief Accountant / Authorized Representative",
    },
    president: {
      name: "DR. EMMANUEL C. MACALALAD",
      position: "University President",
    },
    tesFocalPerson: {
      name: "ENGR. EDWIN C. CAYETANO",
      position: "HEI TES Focal Person / Scholarship Coordinator",
    },
    registrar: {
      name: "ATTY. ROWENA S. DE GUZMAN",
      position: "University Registrar",
    },
  };
}

export function getBuiltInPagesForAnnex(annexNumber: number): PresetPage[] {
  const portraitA4 = getPaperPoints("a4", "portrait");
  const landscapeA4 = getPaperPoints("a4", "landscape");

  switch (annexNumber) {
    case 1:
      return [
        {
          id: "builtin-a1-masterlist",
          pageNumber: 1,
          label: "Annex 1: Grantee Submission & Masterlist",
          sourceType: "builtin-tab",
          ...landscapeA4,
          orientation: "landscape",
          tabKey: "masterlist",
        },
      ];
    case 3:
      return [
        { id: "builtin-a3-tab1", pageNumber: 1, label: "Form 1: Continuing Billing Statement", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "tab1" },
        { id: "builtin-a3-tab2", pageNumber: 2, label: "Form 2: Billed Continuing Grantees", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "tab2" },
        { id: "builtin-a3-tab3", pageNumber: 3, label: "Form 3: Other Grantees Status", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "tab3" },
        { id: "builtin-a3-tab4", pageNumber: 4, label: "Form 4: Certification & Notarial", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "tab4" },
      ];
    case 4:
      return [
        { id: "builtin-a4-tab1", pageNumber: 1, label: "Form 1: New Billing Statement", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "tab1" },
        { id: "builtin-a4-tab2", pageNumber: 2, label: "Form 2: New Grantees Roster", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "tab2" },
        { id: "builtin-a4-tab3", pageNumber: 3, label: "Form 3: Certification & Notarial", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "tab3" },
      ];
    case 5:
      return [
        { id: "builtin-a5-sheet", pageNumber: 1, label: "Regional Certification of Qualified Grantees", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "sheet" },
      ];
    case 6:
      return [
        { id: "builtin-a6-sheet", pageNumber: 1, label: "Certificate of Fund Utilization (FUR)", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "sheet" },
      ];
    case 7:
      return [
        { id: "builtin-a7-sheet", pageNumber: 1, label: "Report of Advice to Debit Account (ADA)", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "sheet" },
      ];
    case 8:
      return [
        { id: "builtin-a8-sheet", pageNumber: 1, label: "Report of Checks Issued (RCI)", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "sheet" },
      ];
    case 9:
      return [
        { id: "builtin-a9-sheet", pageNumber: 1, label: "TDP Stipend Payroll Sheet", sourceType: "builtin-tab", ...landscapeA4, orientation: "landscape", tabKey: "sheet" },
      ];
    case 10:
      return [
        { id: "builtin-a10-sheet", pageNumber: 1, label: "Notice of Award (NOA) Letter", sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "sheet" },
      ];
    default:
      return [
        { id: `builtin-a${annexNumber}-sheet`, pageNumber: 1, label: `Annex ${annexNumber} Sheet`, sourceType: "builtin-tab", ...portraitA4, orientation: "portrait", tabKey: "sheet" },
      ];
  }
}

export function buildDefaultPreset1Config(annexNumber: number): AnnexPresetConfig {
  const campusCfg = getMinsuCampusConfig("Bongabong Campus");
  const isLandscapePrimary = annexNumber === 1 || annexNumber === 7 || annexNumber === 8 || annexNumber === 9;

  return {
    kind: "BUILT_IN",
    annexNumber,
    version: 1,
    pages: getBuiltInPagesForAnnex(annexNumber),
    elements: [],
    modules: {
      batchInjection: [1, 3, 4, 9, 10].includes(annexNumber),
      stipendCalculator: [3, 4, 9, 10].includes(annexNumber),
      campusParameters: true,
      signatories: annexNumber >= 3 && annexNumber <= 10,
      granteeTable: [1, 3, 4, 5, 7, 8, 9, 10].includes(annexNumber),
      coverFields: annexNumber === 1,
    },
    settings: {
      paperSize: "a4",
      orientation: isLandscapePrimary ? "landscape" : "portrait",
      campus: campusCfg.label,
      regionCode: "MIMAROPA",
      heiCode: "MINSU",
      heiName: campusCfg.heiName,
      heiAddress: campusCfg.heiAddress,
      academicYear: "2026-2027",
      termCode: "1",
      trancheNumber: "1",
      batchNumber: "1",
      stipendTier: "7500",
      stipendPerGrantee: 7500,
      managementFeeRate: 0.005,
      signatories: getDefaultSignatoriesForAnnex(annexNumber),
      notary: {
        docNo: "___",
        pageNo: "___",
        bookNo: "___",
        series: String(new Date().getFullYear()),
        issuedAt: "Bongabong, Oriental Mindoro",
      },
      extraDefaults:
        annexNumber === 1
          ? {
              target_agency: "Commission on Higher Education (CHED) / UniFAST",
              remarks: "Official batch submission of validated student grantees for executive endorsement.",
            }
          : annexNumber === 10
          ? {
              memorandumOrderRef: "Sec. 9 of the UniFAST Memorandum Order No. 3 series 2024",
              conditions: [
                "Meet the retention policy of your HEI;",
                "Carry a full load per semester as prescribed by your curriculum;",
                "Finish your degree within the prescribed time frame;",
                "Not be a recipient of any other government-funded scholarship or grant-in-aid program.",
              ],
            }
          : {},
    },
  };
}

export function buildEmptyCustomPresetConfig(annexNumber: number): AnnexPresetConfig {
  const base = buildDefaultPreset1Config(annexNumber);
  const portraitA4 = getPaperPoints("a4", "portrait");
  return {
    ...base,
    kind: "CUSTOM_UPLOAD",
    pages: [
      {
        id: `custom-page-1-${Date.now()}`,
        pageNumber: 1,
        label: "Page 1 (Upload PDF or Image)",
        sourceType: "image",
        ...portraitA4,
        orientation: "portrait",
      },
    ],
    elements: [],
    // Custom presets start lean; Staff explicitly toggles Batch Injection & other modules on as desired
    modules: {
      batchInjection: false,
      stipendCalculator: false,
      campusParameters: false,
      signatories: false,
      granteeTable: false,
      coverFields: false,
    },
  };
}

export interface BindingVariableOption {
  key: string;
  label: string;
  category: string;
  sampleValue: string;
  isCurrency?: boolean;
}

export function getAvailableBindingVariables(
  annexNumber: number,
  modules: PresetModulesConfig
): BindingVariableOption[] {
  const vars: BindingVariableOption[] = [
    { key: "billingDate", label: "Document Date", category: "General", sampleValue: "November 11, 2026" },
    { key: "referenceNumber", label: "Reference No.", category: "General", sampleValue: "MIMAROPA-MINSU-2026-1-1:1" },
    { key: "academicYear", label: "Academic Year", category: "General", sampleValue: "2026-2027" },
    { key: "termLabel", label: "Semester / Term", category: "General", sampleValue: "1st Semester" },
  ];

  if (modules.campusParameters) {
    vars.push(
      { key: "heiName", label: "HEI Name", category: "Campus & HEI", sampleValue: "MINDORO STATE UNIVERSITY - MAIN CAMPUS" },
      { key: "heiAddress", label: "HEI Address", category: "Campus & HEI", sampleValue: "Alcate, Victoria, Oriental Mindoro" },
      { key: "campus", label: "Campus Name", category: "Campus & HEI", sampleValue: "Main Campus (Victoria / Alcate)" },
      { key: "regionCode", label: "Region Code", category: "Campus & HEI", sampleValue: "MIMAROPA" },
      { key: "heiCode", label: "HEI Code", category: "Campus & HEI", sampleValue: "MINSU" },
      { key: "batchNumber", label: "Batch Number(s)", category: "Campus & HEI", sampleValue: "1" },
      { key: "trancheNumber", label: "Tranche Number", category: "Campus & HEI", sampleValue: "1" }
    );
  }

  if (modules.stipendCalculator || modules.batchInjection) {
    vars.push(
      { key: "totalGrantees", label: "Total Grantees Count", category: "Totals & Stipend", sampleValue: "35" },
      { key: "stipendPerGrantee", label: "Stipend Rate / Grantee", category: "Totals & Stipend", sampleValue: "₱7,500.00", isCurrency: true },
      { key: "totalSubsidy", label: "Total TDP Subsidy", category: "Totals & Stipend", sampleValue: "₱262,500.00", isCurrency: true },
      { key: "managementFeeAmount", label: "Admin Fee (0.5%)", category: "Totals & Stipend", sampleValue: "₱1,312.50", isCurrency: true },
      { key: "grandTotalBilling", label: "Grand Total Billing", category: "Totals & Stipend", sampleValue: "₱263,812.50", isCurrency: true }
    );
  }

  if (modules.signatories) {
    vars.push(
      { key: "signatories.president.name", label: "University President Name", category: "Signatories", sampleValue: "DR. EMMANUEL C. MACALALAD" },
      { key: "signatories.president.position", label: "President Title", category: "Signatories", sampleValue: "University President" },
      { key: "signatories.accountingHead.name", label: "Chief Accountant Name", category: "Signatories", sampleValue: "MA. ELENA L. BAUTISTA, CPA" },
      { key: "signatories.accountingHead.position", label: "Accountant Title", category: "Signatories", sampleValue: "Chief Accountant / Authorized Representative" },
      { key: "signatories.tesFocalPerson.name", label: "TES Focal Person Name", category: "Signatories", sampleValue: "ENGR. EDWIN C. CAYETANO" },
      { key: "signatories.tesFocalPerson.position", label: "Focal Person Title", category: "Signatories", sampleValue: "HEI TES Focal Person" },
      { key: "signatories.registrar.name", label: "Registrar Name", category: "Signatories", sampleValue: "ATTY. ROWENA S. DE GUZMAN" },
      { key: "signatories.registrar.position", label: "Registrar Title", category: "Signatories", sampleValue: "University Registrar" }
    );
  }

  if (annexNumber === 1 && modules.coverFields) {
    vars.push(
      { key: "target_agency", label: "Concerned Agency", category: "Annex 1 Cover", sampleValue: "CHED / UniFAST Regional Office" },
      { key: "transmittal_number", label: "Transmittal Reference", category: "Annex 1 Cover", sampleValue: "MINSU-ANNEX1-2026-1001" },
      { key: "submission_date", label: "Submission Date", category: "Annex 1 Cover", sampleValue: "2026-11-11" },
      { key: "total_grantees", label: "Compiled Grantees Total", category: "Annex 1 Cover", sampleValue: "35" },
      { key: "remarks", label: "Endorsement Remarks", category: "Annex 1 Cover", sampleValue: "Officially validated TDP grantees" }
    );
  }

  if (annexNumber === 6) {
    vars.push(
      { key: "checkNumber", label: "Check Number", category: "Annex 6 FUR", sampleValue: "LBP-2026-009841" },
      { key: "checkDate", label: "Check Date", category: "Annex 6 FUR", sampleValue: "November 11, 2026" },
      { key: "totalFundsReceived", label: "Total Funds Received", category: "Annex 6 FUR", sampleValue: "₱753,750.00", isCurrency: true },
      { key: "totalStipendUtilized", label: "Total Stipend Utilized", category: "Annex 6 FUR", sampleValue: "₱750,000.00", isCurrency: true }
    );
  }

  return vars;
}

export function getDefaultTableSourceForAnnex(annexNumber: number): PresetTableDataSource {
  switch (annexNumber) {
    case 1:
      return "annex1Students";
    case 5:
      return "heis";
    case 7:
      return "adaEntries";
    case 8:
      return "checkEntries";
    default:
      return "grantees";
  }
}

export function getDefaultTableColumnsForSource(source: PresetTableDataSource): PresetTableColumn[] {
  switch (source) {
    case "annex1Students":
      return [
        { key: "seq", label: "Seq", widthPct: 7, align: "center", format: "number" },
        { key: "student_id", label: "Student ID", widthPct: 16, align: "left", format: "text" },
        { key: "last_name", label: "Last Name", widthPct: 18, align: "left", format: "text" },
        { key: "given_name", label: "Given Name", widthPct: 18, align: "left", format: "text" },
        { key: "course_degree", label: "Degree Program", widthPct: 26, align: "left", format: "text" },
        { key: "year_level", label: "Yr", widthPct: 6, align: "center", format: "text" },
        { key: "hei_campus", label: "Campus", widthPct: 9, align: "left", format: "text" },
      ];
    case "heis":
      return [
        { key: "seq", label: "No.", widthPct: 10, align: "center", format: "number" },
        { key: "nameOfHei", label: "Name of HEI", widthPct: 55, align: "left", format: "text" },
        { key: "heiType", label: "Type", widthPct: 15, align: "center", format: "text" },
        { key: "numberTdpGrantees", label: "TDP Grantees", widthPct: 20, align: "right", format: "number" },
      ];
    case "adaEntries":
      return [
        { key: "adaDate", label: "Date", widthPct: 14, align: "left", format: "date" },
        { key: "adaSerialNo", label: "ADA Serial No.", widthPct: 20, align: "left", format: "text" },
        { key: "dvPayrollNo", label: "DV / Payroll", widthPct: 18, align: "left", format: "text" },
        { key: "payee", label: "Payee", widthPct: 30, align: "left", format: "text" },
        { key: "amount", label: "Amount", widthPct: 18, align: "right", format: "currency" },
      ];
    case "checkEntries":
      return [
        { key: "checkDate", label: "Check Date", widthPct: 14, align: "left", format: "date" },
        { key: "checkNo", label: "Check No.", widthPct: 16, align: "left", format: "text" },
        { key: "dvPayrollNo", label: "DV / Payroll", widthPct: 18, align: "left", format: "text" },
        { key: "payee", label: "Payee", widthPct: 34, align: "left", format: "text" },
        { key: "amount", label: "Amount", widthPct: 18, align: "right", format: "currency" },
      ];
    case "otherGrantees":
      return [
        { key: "controlNumber", label: "Ctrl #", widthPct: 10, align: "center", format: "text" },
        { key: "studentNumber", label: "Student No.", widthPct: 16, align: "left", format: "text" },
        { key: "lastName", label: "Last Name", widthPct: 18, align: "left", format: "text" },
        { key: "givenName", label: "Given Name", widthPct: 18, align: "left", format: "text" },
        { key: "degreeProgram", label: "Program", widthPct: 22, align: "left", format: "text" },
        { key: "status", label: "Status", widthPct: 16, align: "left", format: "text" },
      ];
    case "grantees":
    default:
      return [
        { key: "controlNumber", label: "Ctrl #", widthPct: 8, align: "center", format: "text" },
        { key: "studentNumber", label: "Student No.", widthPct: 14, align: "left", format: "text" },
        { key: "tdpAwardNumber", label: "Award No.", widthPct: 18, align: "left", format: "text" },
        { key: "lastName", label: "Last Name", widthPct: 15, align: "left", format: "text" },
        { key: "givenName", label: "Given Name", widthPct: 15, align: "left", format: "text" },
        { key: "degreeProgram", label: "Program", widthPct: 18, align: "left", format: "text" },
        { key: "totalAmount", label: "Amount", widthPct: 12, align: "right", format: "currency" },
      ];
  }
}

export interface TableFieldOption {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  format?: "text" | "currency" | "number" | "date";
}

/**
 * Known data fields per Dynamic Table source for dropdown selection in Preset Studio.
 */
export function getAvailableTableColumnFields(
  source: PresetTableDataSource
): TableFieldOption[] {
  const defaults = getDefaultTableColumnsForSource(source).map((c) => ({
    key: c.key,
    label: c.label,
    align: c.align,
    format: c.format,
  }));

  const extrasBySource: Record<PresetTableDataSource, TableFieldOption[]> = {
    grantees: [
      { key: "middleInitial", label: "M.I.", align: "center", format: "text" },
      { key: "sex", label: "Sex", align: "center", format: "text" },
      { key: "birthdate", label: "Birthdate", align: "left", format: "date" },
      { key: "yearLevel", label: "Year Level", align: "center", format: "text" },
      { key: "campus", label: "Campus", align: "left", format: "text" },
      { key: "email", label: "Email", align: "left", format: "text" },
      { key: "phone", label: "Contact No.", align: "left", format: "text" },
      { key: "tdpBatch", label: "Batch", align: "center", format: "text" },
      { key: "semesterAmount", label: "Semester Amount", align: "right", format: "currency" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
    otherGrantees: [
      { key: "middleName", label: "Middle Name", align: "left", format: "text" },
      { key: "yearLevel", label: "Year Level", align: "center", format: "text" },
      { key: "campus", label: "Campus", align: "left", format: "text" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
    annex1Students: [
      { key: "middle_name", label: "Middle Name", align: "left", format: "text" },
      { key: "sex", label: "Sex", align: "center", format: "text" },
      { key: "birthdate", label: "Birthdate", align: "left", format: "date" },
      { key: "contact_number", label: "Contact No.", align: "left", format: "text" },
      { key: "email", label: "Email", align: "left", format: "text" },
      { key: "zip_code", label: "ZIP Code", align: "center", format: "text" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
    heis: [
      { key: "heiCode", label: "HEI Code", align: "left", format: "text" },
      { key: "region", label: "Region", align: "center", format: "text" },
      { key: "totalAmount", label: "Total Amount", align: "right", format: "currency" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
    adaEntries: [
      { key: "seq", label: "No.", align: "center", format: "number" },
      { key: "orsBursNo", label: "ORS / BURS No.", align: "left", format: "text" },
      { key: "particulars", label: "Particulars", align: "left", format: "text" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
    checkEntries: [
      { key: "seq", label: "No.", align: "center", format: "number" },
      { key: "bankBranch", label: "Bank / Branch", align: "left", format: "text" },
      { key: "particulars", label: "Particulars", align: "left", format: "text" },
      { key: "remarks", label: "Remarks", align: "left", format: "text" },
    ],
  };

  const seen = new Set(defaults.map((d) => d.key));
  const combined: TableFieldOption[] = [...defaults];
  for (const item of extrasBySource[source] || []) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      combined.push(item);
    }
  }
  return combined;
}

/**
 * Proportionally scales Dynamic Table column widths so they sum cleanly to 100%.
 */
export function normalizeTableColumnWidths(
  columns: PresetTableColumn[]
): PresetTableColumn[] {
  if (columns.length === 0) return columns;
  const total = columns.reduce((acc, c) => acc + Math.max(1, c.widthPct || 1), 0);
  let remaining = 100;
  return columns.map((col, idx) => {
    if (idx === columns.length - 1) {
      return { ...col, widthPct: Math.max(4, remaining) };
    }
    const scaled = Math.max(4, Math.round((Math.max(1, col.widthPct || 1) / total) * 100));
    remaining -= scaled;
    return { ...col, widthPct: scaled };
  });
}

/**
 * Returns the canonical formData array property name backing a Dynamic Table data source.
 */
export function getFormDataArrayKeyForTableSource(
  source: PresetTableDataSource
): string {
  switch (source) {
    case "annex1Students":
      return "students";
    case "otherGrantees":
      return "otherGrantees";
    case "heis":
      return "heis";
    case "adaEntries":
    case "checkEntries":
      return "entries";
    case "grantees":
    default:
      return "grantees";
  }
}

const CURRENCY_KEYS = new Set([
  "stipendPerGrantee",
  "totalSubsidy",
  "managementFeeAmount",
  "grandTotalBilling",
  "totalFundsReceived",
  "totalStipendUtilized",
  "firstSemTotalAmount",
  "secondSemTotalAmount",
  "grandTotalAmount",
  "stipendAmountPerSem",
  "tdpAmount",
  "semesterAmount",
  "totalAmount",
  "amount",
]);

export function formatPhpCurrency(val: number): string {
  return `₱${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function resolveFormDataValue(
  pathKey: string | undefined,
  formData: Record<string, unknown>
): string {
  if (!pathKey) return "";
  if (pathKey === "termLabel") {
    const code = String(formData.termCode || "1");
    return code === "2" ? "2nd Semester" : "1st Semester";
  }

  const parts = pathKey.split(".");
  let cursor: unknown = formData;
  for (const part of parts) {
    if (cursor && typeof cursor === "object" && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      cursor = undefined;
      break;
    }
  }

  if (cursor === undefined || cursor === null) {
    const customFields = formData.customFields as Record<string, unknown> | undefined;
    if (customFields && pathKey in customFields) {
      cursor = customFields[pathKey];
    }
  }

  if (cursor === undefined || cursor === null) return "";

  const leaf = parts[parts.length - 1];
  if (CURRENCY_KEYS.has(leaf) && typeof cursor === "number") {
    return formatPhpCurrency(cursor);
  }
  if (CURRENCY_KEYS.has(leaf) && typeof cursor === "string" && cursor.trim() !== "" && !isNaN(Number(cursor))) {
    return formatPhpCurrency(Number(cursor));
  }

  return String(cursor);
}

export function getTableRowsFromFormData(
  source: PresetTableDataSource,
  formData: Record<string, unknown>
): Record<string, unknown>[] {
  switch (source) {
    case "annex1Students":
      return Array.isArray(formData.students)
        ? (formData.students as Record<string, unknown>[])
        : Array.isArray(formData.grantees)
        ? (formData.grantees as Record<string, unknown>[])
        : [];
    case "otherGrantees":
      return Array.isArray(formData.otherGrantees)
        ? (formData.otherGrantees as Record<string, unknown>[])
        : [];
    case "heis":
      return Array.isArray(formData.heis) ? (formData.heis as Record<string, unknown>[]) : [];
    case "adaEntries":
      return Array.isArray(formData.entries) ? (formData.entries as Record<string, unknown>[]) : [];
    case "checkEntries":
      return Array.isArray(formData.entries) ? (formData.entries as Record<string, unknown>[]) : [];
    case "grantees":
    default:
      if (Array.isArray(formData.grantees)) return formData.grantees as Record<string, unknown>[];
      if (Array.isArray(formData.billedGrantees)) return formData.billedGrantees as Record<string, unknown>[];
      if (Array.isArray(formData.students)) return formData.students as Record<string, unknown>[];
      return [];
  }
}

export function chunkTableRows<T>(rows: T[], maxRowsPerPage: number): T[][] {
  const safeMax = Math.max(1, Math.floor(maxRowsPerPage));
  if (rows.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += safeMax) {
    chunks.push(rows.slice(i, i + safeMax));
  }
  return chunks;
}

export function formatTableCellValue(
  raw: unknown,
  format: PresetTableColumn["format"] = "text"
): string {
  if (raw === undefined || raw === null) return "";
  if (format === "currency") {
    const num = Number(raw);
    return Number.isFinite(num) ? formatPhpCurrency(num) : String(raw);
  }
  if (format === "number") {
    const num = Number(raw);
    return Number.isFinite(num) ? num.toLocaleString("en-US") : String(raw);
  }
  return String(raw);
}

/**
 * Magic-byte verification for uploaded preset base templates (PDF, PNG, JPEG, WebP).
 * Rejects spoofed files or SVG/HTML payloads at the trust boundary.
 */
const ALLOWED_PDF_DECLARED_MIMES = new Set([
  "",
  "application/pdf",
  "application/x-pdf",
  "application/octet-stream",
  "binary/octet-stream",
  "application/download",
  "application/acrobat",
  "application/vnd.adobe.pdf",
]);

function hasPdfHeaderSignature(bytes: Uint8Array): boolean {
  const scanLimit = Math.min(1024, bytes.length - 5);
  for (let i = 0; i <= scanLimit; i++) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46 &&
      bytes[i + 4] === 0x2d
    ) {
      return true;
    }
  }
  return false;
}

export function validatePresetUploadBytes(
  bytes: Uint8Array,
  declaredMime: string
): { valid: boolean; detectedExt?: ".pdf" | ".png" | ".jpg" | ".webp"; detectedMime?: string; reason?: string } {
  if (bytes.length < 8) {
    return { valid: false, reason: "Uploaded file is empty or truncated." };
  }

  const normalizedMime = declaredMime.split(";")[0].trim().toLowerCase();

  // %PDF- (25 50 44 46 2D) within the first 1024 bytes (allows UTF-8 BOM or leading whitespace per PDF spec)
  if (hasPdfHeaderSignature(bytes)) {
    if (!ALLOWED_PDF_DECLARED_MIMES.has(normalizedMime)) {
      return { valid: false, reason: "MIME type does not match PDF file signature." };
    }
    return { valid: true, detectedExt: ".pdf", detectedMime: "application/pdf" };
  }

  // PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, detectedExt: ".png", detectedMime: "image/png" };
  }

  // JPEG (FF D8 FF)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, detectedExt: ".jpg", detectedMime: "image/jpeg" };
  }

  // WebP ("RIFF" .... "WEBP")
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, detectedExt: ".webp", detectedMime: "image/webp" };
  }

  return {
    valid: false,
    reason: "Unsupported or invalid file format. Only valid PDF, PNG, JPG, or WebP files are allowed.",
  };
}

/**
 * Merges retained preset settings (`settings` + default custom fields) cleanly
 * into built-in Annex 3–10 `defaultData` structures when creating a document.
 */
export function applyPresetSettingsToAnnexDefaults<T extends Record<string, unknown>>(
  annexNumber: number,
  baseDefaults: T,
  presetConfig?: AnnexPresetConfig | null
): T {
  if (!presetConfig?.settings) return baseDefaults;
  const s = presetConfig.settings;
  const next: Record<string, unknown> = { ...baseDefaults };

  // Collect custom field defaults if elements exist on Preset 1
  if (Array.isArray(presetConfig.elements) && presetConfig.elements.length > 0) {
    const customFields: Record<string, unknown> = {
      ...((next.customFields as Record<string, unknown> | undefined) || {}),
    };
    for (const el of presetConfig.elements) {
      const k = el.fieldKey || el.id;
      if (customFields[k] === undefined) {
        if (el.type === "checkbox") customFields[k] = Boolean(el.checkedDefault);
        else if (el.defaultValue !== undefined) customFields[k] = el.defaultValue;
      }
    }
    next.customFields = customFields;
  }

  if (s.headerLogos) {
    next.headerLogos = {
      ...((next.headerLogos as Record<string, unknown> | undefined) || {}),
      ...s.headerLogos,
    };
  }

  if ([3, 4, 6, 8, 9, 10].includes(annexNumber) && s.heiName) {
    next.heiName = s.heiName;
  }
  if (annexNumber === 7 && s.heiName) {
    next.entityName = s.heiName;
  }
  if ([3, 4, 6, 8, 9].includes(annexNumber) && s.heiAddress) {
    next.heiAddress = s.heiAddress;
  }
  if ([4, 9, 10].includes(annexNumber) && s.campus) {
    next.campus = s.campus;
  }

  if ([3, 4].includes(annexNumber)) {
    if (s.regionCode) next.regionCode = s.regionCode;
    if (s.heiCode) next.heiCode = s.heiCode;
    if (s.academicYear) next.academicYear = s.academicYear;
    if (s.termCode) next.termCode = s.termCode;
    if (s.trancheNumber) next.trancheNumber = s.trancheNumber;
    if (s.batchNumber) next.batchNumber = s.batchNumber;
    if (s.stipendTier) next.stipendTier = s.stipendTier;
    if (s.stipendPerGrantee !== undefined) next.stipendPerGrantee = s.stipendPerGrantee;
    if (s.managementFeeRate !== undefined) next.managementFeeRate = s.managementFeeRate;
    if (s.notary) {
      next.notary = {
        ...((next.notary as Record<string, unknown> | undefined) || {}),
        ...s.notary,
      };
    }
    if (s.signatories) {
      next.signatories = {
        ...((next.signatories as Record<string, unknown> | undefined) || {}),
        ...s.signatories,
      };
    }
  }

  if (annexNumber === 5) {
    if (s.regionCode) next.region = s.regionCode;
    if (s.academicYear) next.academicYear = s.academicYear;
    if (s.termCode) next.term = s.termCode === "2" ? "2nd" : "1st";
    if (s.signatories) {
      const existingSig = (next.signatories as Record<string, unknown> | undefined) || {};
      next.signatories = {
        ...existingSig,
        ...(s.signatories.regionalCoordinator || s.signatories.preparedBy
          ? {
              regionalCoordinator:
                s.signatories.regionalCoordinator || s.signatories.preparedBy,
            }
          : {}),
        ...(s.signatories.chedroDirector || s.signatories.certifiedBy
          ? {
              chedroDirector:
                s.signatories.chedroDirector || s.signatories.certifiedBy,
            }
          : {}),
      };
    }
  }

  if (annexNumber === 6 && s.signatories) {
    const existingSig = (next.signatories as Record<string, unknown> | undefined) || {};
    next.signatories = {
      ...existingSig,
      ...(s.signatories.chiefAccountant || s.signatories.preparedBy
        ? {
            chiefAccountant:
              s.signatories.chiefAccountant || s.signatories.preparedBy,
          }
        : {}),
      ...(s.signatories.president || s.signatories.approvedBy
        ? {
            president: s.signatories.president || s.signatories.approvedBy,
          }
        : {}),
    };
  }

  if (annexNumber === 7 && s.signatories?.preparedBy) {
    if (s.signatories.preparedBy.name) next.disbursingOfficerName = s.signatories.preparedBy.name;
    if (s.signatories.preparedBy.position) {
      next.disbursingOfficerDesignation = s.signatories.preparedBy.position;
    }
  }

  if (annexNumber === 8 && s.signatories) {
    if (s.signatories.preparedBy?.name) next.cashierName = s.signatories.preparedBy.name;
    if (s.signatories.certifiedBy?.name) next.accountantName = s.signatories.certifiedBy.name;
    if (s.signatories.approvedBy?.name) next.presidentName = s.signatories.approvedBy.name;
  }

  if (annexNumber === 9) {
    if (s.academicYear) next.academicYear = s.academicYear;
    if (s.termCode) next.activeSemester = s.termCode;
    if (s.stipendTier) next.stipendTier = s.stipendTier;
    if (s.stipendPerGrantee !== undefined) {
      next.stipendAmountPerScholar = s.stipendPerGrantee;
    }
    if (s.signatories) {
      const existingSig = (next.signatories as Record<string, unknown> | undefined) || {};
      next.signatories = {
        ...existingSig,
        ...(s.signatories.tesFocalPerson ? { tesFocalPerson: s.signatories.tesFocalPerson } : {}),
        ...(s.signatories.registrar ? { registrar: s.signatories.registrar } : {}),
        ...(s.signatories.accountant || s.signatories.accountingHead
          ? { accountant: s.signatories.accountant || s.signatories.accountingHead }
          : {}),
        ...(s.signatories.president ? { president: s.signatories.president } : {}),
      };
    }
  }

  if (annexNumber === 10) {
    if (s.academicYear) next.defaultAcademicYear = s.academicYear;
    if (s.termCode) next.defaultStartingSemester = s.termCode === "2" ? "2nd" : "1st";
    if (s.stipendPerGrantee !== undefined) next.stipendAmountPerSem = s.stipendPerGrantee;
    if (s.signatories?.signatory) next.signatory = s.signatories.signatory;
    if (s.extraDefaults?.memorandumOrderRef) {
      next.memorandumOrderRef = s.extraDefaults.memorandumOrderRef;
    }
    if (Array.isArray(s.extraDefaults?.conditions) && s.extraDefaults.conditions.length > 0) {
      next.conditions = s.extraDefaults.conditions;
    }
  }

  return next as T;
}
