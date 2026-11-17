"use client";

import React from "react";
import {
  AnnexPresetConfig,
  PresetElement,
} from "@/types/presets";
import {
  formatTableCellValue,
  getTableRowsFromFormData,
  resolveFormDataValue,
} from "@/lib/annex-presets";
import { Check } from "lucide-react";

interface PresetOverlayLayerProps {
  config: AnnexPresetConfig;
  pageId: string;
  formData: Record<string, unknown>;
  displayMode: "view" | "interactive" | "preview-tokens" | "preview-sample";
  tableRowsOverride?: Record<string, Record<string, unknown>[]>;
  onCustomFieldChange?: (fieldKey: string, value: string | boolean) => void;
  className?: string;
}

const SAMPLE_DATA: Record<string, unknown> = {
  billingDate: "November 11, 2026",
  referenceNumber: "MIMAROPA-MINSU-2026-1-1:1",
  academicYear: "2026-2027",
  termCode: "1",
  heiName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
  heiAddress: "Labasan, Bongabong, Oriental Mindoro",
  campus: "Bongabong Campus",
  regionCode: "MIMAROPA",
  heiCode: "MINSU",
  batchNumber: "1",
  trancheNumber: "1",
  totalGrantees: 35,
  stipendPerGrantee: 7500,
  totalSubsidy: 262500,
  managementFeeAmount: 1312.5,
  grandTotalBilling: 263812.5,
  target_agency: "Commission on Higher Education (CHED) / UniFAST",
  transmittal_number: "MINSU-ANNEX1-2026-1001",
  submission_date: "2026-11-11",
  total_grantees: 35,
  remarks: "Official validated batch submission",
  signatories: {
    president: { name: "DR. EMMANUEL C. MACALALAD", position: "University President" },
    accountingHead: { name: "MA. ELENA L. BAUTISTA, CPA", position: "Chief Accountant" },
    tesFocalPerson: { name: "ENGR. EDWIN C. CAYETANO", position: "HEI TES Focal Person" },
    registrar: { name: "ATTY. ROWENA S. DE GUZMAN", position: "University Registrar" },
  },
  grantees: [
    {
      controlNumber: "00001",
      studentNumber: "2024-00001-BC",
      tdpAwardNumber: "2024-TDP-4060-00001",
      lastName: "DELA CRUZ",
      givenName: "JUAN",
      middleInitial: "S.",
      sex: "M",
      birthdate: "2004-05-12",
      degreeProgram: "BS Information Technology",
      yearLevel: "3",
      campus: "Bongabong Campus",
      email: "juan.delacruz@minsu.edu.ph",
      phone: "09171234567",
      tdpBatch: "1",
      semesterAmount: 7500,
      totalAmount: 7500,
      remarks: "Validated",
    },
    {
      controlNumber: "00002",
      studentNumber: "2024-00002-BC",
      tdpAwardNumber: "2024-TDP-4060-00002",
      lastName: "SANTOS",
      givenName: "MARIA",
      middleInitial: "R.",
      sex: "F",
      birthdate: "2005-02-19",
      degreeProgram: "BS Fisheries",
      yearLevel: "2",
      campus: "Bongabong Campus",
      email: "maria.santos@minsu.edu.ph",
      phone: "09181234567",
      tdpBatch: "1",
      semesterAmount: 7500,
      totalAmount: 7500,
      remarks: "Validated",
    },
  ],
  students: [
    {
      seq: 1,
      student_id: "2024-00001-BC",
      last_name: "DELA CRUZ",
      given_name: "JUAN",
      middle_name: "SANTOS",
      sex: "M",
      birthdate: "2004-05-12",
      course_degree: "BS Information Technology",
      year_level: "3",
      hei_campus: "Bongabong Campus",
      remarks: "Active",
    },
  ],
  otherGrantees: [
    {
      controlNumber: "00001",
      studentNumber: "2024-00010-BC",
      lastName: "REYES",
      givenName: "CARLO",
      degreeProgram: "BS Agriculture",
      status: "Transferred",
      remarks: "Pending verification",
    },
  ],
  heis: [
    {
      seq: 1,
      heiCode: "04101",
      nameOfHei: "Mindoro State University — Bongabong Campus",
      heiType: "SUC",
      region: "IV-B",
      numberTdpGrantees: 35,
      totalAmount: 262500,
    },
  ],
  entries: [
    {
      seq: 1,
      adaDate: "2026-11-11",
      checkDate: "2026-11-11",
      adaSerialNo: "ADA-2026-001",
      checkNo: "CHK-009841",
      dvPayrollNo: "DV-2026-11-04",
      payee: "TDP Grantees Batch 1 (35)",
      amount: 262500,
      remarks: "Released",
    },
  ],
};

function getFontFamilyCss(font?: "Helvetica" | "Times" | "Courier"): string {
  if (font === "Times") return '"Times New Roman", Georgia, serif';
  if (font === "Courier") return '"Courier New", monospace';
  return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

export function PresetOverlayLayer({
  config,
  pageId,
  formData,
  displayMode,
  tableRowsOverride,
  onCustomFieldChange,
  className = "",
}: PresetOverlayLayerProps) {
  const elements = (config.elements || [])
    .filter((el) => el.pageId === pageId)
    .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

  if (elements.length === 0) return null;

  const activeData =
    displayMode === "preview-sample"
      ? { ...SAMPLE_DATA, ...formData }
      : formData;

  const customFields = (activeData.customFields as Record<string, unknown>) || {};

  const renderElementContent = (el: PresetElement) => {
    const fieldKey = el.fieldKey || el.id;
    const fontFamily = getFontFamilyCss(el.style?.fontFamily);
    const textAlign = el.style?.align || "left";
    const fontSize = `${el.style?.fontSizePt || 10}pt`;
    const color = el.style?.color || "#1F2A24";

    const commonTextStyle: React.CSSProperties = {
      fontFamily,
      fontSize,
      fontWeight: el.style?.bold ? 700 : 400,
      fontStyle: el.style?.italic ? "italic" : "normal",
      color,
      textAlign,
      lineHeight: 1.25,
    };

    if (el.type === "data_table" && el.tableConfig) {
      const cfg = el.tableConfig;
      const cols = cfg.columns || [];
      const totalWidthPct =
        cols.reduce((acc, c) => acc + Math.max(1, c.widthPct || 1), 0) || 100;
      const rows =
        tableRowsOverride?.[el.id] ??
        getTableRowsFromFormData(cfg.dataSource, activeData);

      return (
        <div className="w-full h-full overflow-hidden flex flex-col bg-white/95">
          <table className="w-full border-collapse table-fixed" style={{ fontSize: `${cfg.fontSizePt || 8}pt` }}>
            {cfg.showHeader !== false && (
              <thead>
                <tr
                  style={{
                    backgroundColor: cfg.headerBgColor || "#1B5E20",
                    color: cfg.headerTextColor || "#FFFFFF",
                  }}
                >
                  {cols.map((col, colIdx) => (
                    <th
                      key={`${col.key}-${colIdx}`}
                      style={{
                        width: `${(Math.max(1, col.widthPct || 1) / totalWidthPct) * 100}%`,
                        textAlign: col.align || "left",
                        height: `${cfg.rowHeightPt || 18}pt`,
                      }}
                      className="px-1.5 font-bold border border-[#D6DDD8] truncate"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(1, cols.length)}
                    className="py-3 px-2 text-center text-[#55645B] italic border border-[#D6DDD8]"
                  >
                    {displayMode === "preview-tokens"
                      ? `Dynamic Table (${cfg.dataSource})`
                      : "No records loaded yet"}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-[#F6F8F6]" : "bg-white"}>
                    {cols.map((col, colIdx) => (
                      <td
                        key={`${col.key}-${colIdx}`}
                        style={{
                          textAlign: col.align || "left",
                          height: `${cfg.rowHeightPt || 18}pt`,
                        }}
                        className="px-1.5 border border-[#D6DDD8] text-[#1F2A24] truncate"
                      >
                        {formatTableCellValue(row[col.key], col.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (el.type === "logo") {
      const headerLogos = activeData.headerLogos as
        | { leftLogo?: { url?: string }; rightLogo?: { url?: string } }
        | undefined;
      const fallbackLeft = "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png";
      const fallbackRight = "/api/media/logo/logo-1793718328666-3e70a8323e95.png";
      const src =
        el.logoUrl ||
        (el.logoSlot === "left"
          ? headerLogos?.leftLogo?.url || config.settings?.headerLogos?.leftLogo?.url || fallbackLeft
          : el.logoSlot === "right"
          ? headerLogos?.rightLogo?.url || config.settings?.headerLogos?.rightLogo?.url || fallbackRight
          : "/logo.png");

      return (
        <div className="w-full h-full flex items-center justify-center p-0.5">
          <img
            src={src}
            alt={el.label || "Seal"}
            className="max-w-full max-h-full object-contain pointer-events-none select-none"
          />
        </div>
      );
    }

    if (el.type === "checkbox") {
      const isChecked =
        displayMode === "preview-tokens"
          ? Boolean(el.checkedDefault)
          : Boolean(customFields[fieldKey] ?? el.checkedDefault);

      if (displayMode === "interactive" && onCustomFieldChange) {
        return (
          <button
            type="button"
            onClick={() => onCustomFieldChange(fieldKey, !isChecked)}
            aria-label={el.label}
            className="w-full h-full flex items-center justify-center border border-[#1F2A24]/60 rounded-xs bg-white/80 hover:bg-[#F1F8F1] print:border-[#1F2A24] print:bg-transparent"
          >
            {isChecked && <Check className="w-3.5 h-3.5 text-[#1B5E20] stroke-[3]" />}
          </button>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center border border-[#1F2A24]/70 rounded-xs">
          {isChecked && <Check className="w-3.5 h-3.5 text-[#1F2A24] stroke-[3]" />}
        </div>
      );
    }

    if (el.type === "static_text") {
      return (
        <div className="w-full h-full overflow-hidden whitespace-pre-wrap px-1 py-0.5" style={commonTextStyle}>
          {el.staticText || el.label}
        </div>
      );
    }

    if (el.type === "bound_field") {
      const value =
        displayMode === "preview-tokens"
          ? `{{${el.bindingKey || "field"}}}`
          : resolveFormDataValue(el.bindingKey, activeData) || el.defaultValue || "";
      return (
        <div className="w-full h-full overflow-hidden whitespace-pre-wrap px-1 py-0.5" style={commonTextStyle}>
          {value}
        </div>
      );
    }

    // Editable fields: textbox, textarea, date
    const currentValue =
      displayMode === "preview-tokens"
        ? `[${el.label}]`
        : String(customFields[fieldKey] ?? el.defaultValue ?? "");

    if (displayMode === "interactive" && onCustomFieldChange) {
      if (el.type === "textarea") {
        return (
          <textarea
            value={currentValue}
            onChange={(e) => onCustomFieldChange(fieldKey, e.target.value)}
            placeholder={el.placeholder || el.label}
            style={commonTextStyle}
            className="w-full h-full resize-none bg-white/75 border border-dashed border-[#1B5E20]/40 rounded-xs px-1 py-0.5 focus:outline-none focus:border-[#1B5E20] focus:bg-white print:border-none print:bg-transparent"
          />
        );
      }
      return (
        <input
          type={el.type === "date" ? "date" : "text"}
          value={currentValue}
          onChange={(e) => onCustomFieldChange(fieldKey, e.target.value)}
          placeholder={el.placeholder || el.label}
          style={commonTextStyle}
          className="w-full h-full bg-white/75 border border-dashed border-[#1B5E20]/40 rounded-xs px-1 py-0.5 focus:outline-none focus:border-[#1B5E20] focus:bg-white print:border-none print:bg-transparent"
        />
      );
    }

    return (
      <div className="w-full h-full overflow-hidden whitespace-pre-wrap px-1 py-0.5" style={commonTextStyle}>
        {currentValue}
      </div>
    );
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {elements.map((el) => {
        const bg =
          el.style?.backgroundColor && el.style.backgroundColor !== "transparent"
            ? el.style.backgroundColor
            : undefined;
        const border =
          el.style?.borderWidth && el.style.borderWidth > 0
            ? `${el.style.borderWidth}px solid ${el.style.borderColor || "#1F2A24"}`
            : undefined;

        return (
          <div
            key={el.id}
            style={{
              left: `${el.xPct}%`,
              top: `${el.yPct}%`,
              width: `${el.wPct}%`,
              height: `${el.hPct}%`,
              zIndex: el.zIndex ?? 1,
              backgroundColor: bg,
              border,
            }}
            className={
              displayMode === "interactive"
                ? "absolute pointer-events-auto"
                : "absolute pointer-events-none"
            }
          >
            {renderElementContent(el)}
          </div>
        );
      })}
    </div>
  );
}

