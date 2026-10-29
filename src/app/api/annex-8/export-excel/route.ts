import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex8FormData } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    let formData: Annex8FormData;
    let fileTitle = "Annex_8_RCI";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex8FormData;
      fileTitle = `Annex_8_RCI_${(doc.title || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    } else {
      return NextResponse.json(
        { error: "Missing documentId parameter" },
        { status: 400 }
      );
    }

    return generateExcelResponse(formData, fileTitle);
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const formData = body as Annex8FormData;
    const fileTitle = `Annex_8_RCI_${(formData.reportNo || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    return generateExcelResponse(formData, fileTitle);
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}

async function generateExcelResponse(formData: Annex8FormData, fileTitle: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mindoro State University - MinSU DocTrack";
  workbook.created = new Date();

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const headerFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };

  const ws = workbook.addWorksheet("RCI", {
    pageSetup: {
      paperSize: 9, // A4 / Letter
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });

  // Column widths matching 6 visible column categories in RCI tab
  ws.columns = [
    { width: 14 }, // A: Date
    { width: 16 }, // B: Check No.
    { width: 20 }, // C: DV/Payroll No.
    { width: 38 }, // D: Payee
    { width: 24 }, // E: Purpose of Payment (TES/ASC)
    { width: 18 }, // F: Amount
  ];

  // Top Tag
  ws.getCell("F1").value = "TDP Form - Annex 8 (RCI)";
  ws.getCell("F1").font = { name: "Arial", size: 10, italic: true };
  ws.getCell("F1").alignment = { horizontal: "right" };

  // Title
  ws.mergeCells("A3:F3");
  ws.getCell("A3").value = "REPORT OF CHECKS ISSUED";
  ws.getCell("A3").font = { name: "Arial", size: 13, bold: true };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

  // HEI Name & Address
  ws.mergeCells("A4:F4");
  ws.getCell("A4").value = formData.heiName;
  ws.getCell("A4").font = { name: "Arial", size: 11, bold: true };
  ws.getCell("A4").alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("A5:F5");
  ws.getCell("A5").value = formData.heiAddress;
  ws.getCell("A5").font = { name: "Arial", size: 9 };
  ws.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };

  // Date
  ws.mergeCells("A6:F6");
  ws.getCell("A6").value = `Date: ${formData.reportDate || "___________________________"}`;
  ws.getCell("A6").font = { name: "Arial", size: 9 };
  ws.getCell("A6").alignment = { horizontal: "center", vertical: "middle" };

  // Identification fields
  ws.getCell("A8").value = "HEI Name:";
  ws.getCell("A8").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("B8:C8");
  ws.getCell("B8").value = formData.heiName;
  ws.getCell("B8").font = { name: "Arial", size: 9 };

  ws.getCell("E8").value = "Report No.:";
  ws.getCell("E8").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("F8").value = formData.reportNo;
  ws.getCell("F8").font = { name: "Arial", size: 9 };
  ws.getCell("F8").border = { bottom: { style: "thin" } };

  ws.getCell("E9").value = "Sheet No.:";
  ws.getCell("E9").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("F9").value = formData.sheetNo;
  ws.getCell("F9").font = { name: "Arial", size: 9 };
  ws.getCell("F9").border = { bottom: { style: "thin" } };

  // Table Headers (Rows 11 & 12)
  ws.mergeCells("A11:B11");
  ws.getCell("A11").value = "Check Issued";
  ws.getCell("A11").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("A11").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A11").fill = headerFill;

  ws.getCell("A12").value = "Date";
  ws.getCell("A12").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("A12").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A12").fill = headerFill;

  ws.getCell("B12").value = "Check No.";
  ws.getCell("B12").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("B12").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("B12").fill = headerFill;

  const standardCols = [
    { col: "C", title: "DV/Payroll No." },
    { col: "D", title: "Payee" },
    { col: "E", title: "Purpose of Payment\n(TES/ASC)" },
    { col: "F", title: "Amount" },
  ];

  standardCols.forEach(({ col, title }) => {
    ws.mergeCells(`${col}11:${col}12`);
    const cell = ws.getCell(`${col}11`);
    cell.value = title;
    cell.font = { name: "Arial", size: 9, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = headerFill;
  });

  ["A", "B", "C", "D", "E", "F"].forEach((col) => {
    ws.getCell(`${col}11`).border = borderThin;
    ws.getCell(`${col}12`).border = borderThin;
  });

  // Data rows
  let rowIdx = 13;
  const startDataRow = rowIdx;

  formData.entries.forEach((entry) => {
    ws.getCell(`A${rowIdx}`).value = entry.checkDate;
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`B${rowIdx}`).value = entry.checkNo;
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`C${rowIdx}`).value = entry.dvPayrollNo;
    ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`D${rowIdx}`).value = entry.payee;
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`E${rowIdx}`).value = entry.purposeOfPayment;
    ws.getCell(`E${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`F${rowIdx}`).value = Number(entry.amount) || 0;
    ws.getCell(`F${rowIdx}`).numFmt = '#,##0.00';
    ws.getCell(`F${rowIdx}`).alignment = { horizontal: "right" };

    ["A", "B", "C", "D", "E", "F"].forEach((col) => {
      const cell = ws.getCell(`${col}${rowIdx}`);
      cell.font = { name: "Arial", size: 9 };
      cell.border = borderThin;
    });

    rowIdx++;
  });

  // Empty filler rows up to 10 minimum
  const minRows = 10;
  const currentCount = formData.entries.length;
  if (currentCount < minRows) {
    for (let i = 0; i < minRows - currentCount; i++) {
      ["A", "B", "C", "D", "E", "F"].forEach((col) => {
        const cell = ws.getCell(`${col}${rowIdx}`);
        cell.border = borderThin;
      });
      rowIdx++;
    }
  }

  // TOTAL Row
  ws.mergeCells(`A${rowIdx}:E${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "TOTAL";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`A${rowIdx}`).border = borderThin;

  ws.getCell(`F${rowIdx}`).value = { formula: `SUM(F${startDataRow}:F${rowIdx - 1})`, result: formData.totalAmount };
  ws.getCell(`F${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`F${rowIdx}`).numFmt = '₱#,##0.00';
  ws.getCell(`F${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`F${rowIdx}`).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "double" },
  };

  rowIdx += 2;

  // CERTIFICATION BOX
  const certStartRow = rowIdx;
  ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "C E R T I F I C A T I O N";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
  rowIdx++;

  ws.mergeCells(`A${rowIdx}:F${rowIdx + 1}`);
  ws.getCell(`A${rowIdx}`).value =
    `I hereby certify on my official oath that this Report of Checks Issued in one (1) sheet is a full, true and correct statement of all checks issued by me during the period stated above for which Check Nos. ${formData.checkNoFrom || "__________"} to ${formData.checkNoTo || "__________"} inclusive, were actually issued by me in payment for obligations shown in the attached disbursement vouchers/payroll.`;
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 9 };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  rowIdx += 4;

  // Cashier Signature
  ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
  ws.getCell(`C${rowIdx}`).value = formData.cashierName;
  ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`C${rowIdx}`).border = { bottom: { style: "thin" } };
  rowIdx++;

  ws.mergeCells(`C${rowIdx}:D${rowIdx}`);
  ws.getCell(`C${rowIdx}`).value = "(Signature above printed name)\nCashier";
  ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center", wrapText: true };
  rowIdx += 2;

  ws.mergeCells(`B${rowIdx}:E${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = `Date Signed: ${formData.dateSigned}`;
  ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9 };
  ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

  // Box border around certification
  for (let r = certStartRow; r <= rowIdx + 1; r++) {
    for (const c of ["A", "B", "C", "D", "E", "F"]) {
      const cell = ws.getCell(`${c}${r}`);
      const borders: Partial<ExcelJS.Borders> = {};
      if (r === certStartRow) borders.top = { style: "medium" };
      if (r === rowIdx + 1) borders.bottom = { style: "medium" };
      if (c === "A") borders.left = { style: "medium" };
      if (c === "F") borders.right = { style: "medium" };
      cell.border = { ...cell.border, ...borders };
    }
  }

  rowIdx += 3;

  // Lower Signatory Tri-Block
  // Accountant
  ws.getCell(`A${rowIdx}`).value = "Certified true and correct by:";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 9, italic: true };
  rowIdx += 2;

  ws.mergeCells(`A${rowIdx}:C${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = formData.accountantName;
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`A${rowIdx}`).border = { bottom: { style: "thin" } };
  rowIdx++;

  ws.mergeCells(`A${rowIdx}:C${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "(Signature over printed name)\nAccountant";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center", wrapText: true };
  rowIdx += 3;

  // President and Auditor
  ws.getCell(`A${rowIdx}`).value = "Approved by:";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 9, italic: true };

  ws.getCell(`D${rowIdx}`).value = "Verified by:";
  ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 9, italic: true };
  rowIdx += 2;

  ws.mergeCells(`A${rowIdx}:C${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = formData.presidentName;
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`A${rowIdx}`).border = { bottom: { style: "thin" } };

  ws.mergeCells(`D${rowIdx}:F${rowIdx}`);
  ws.getCell(`D${rowIdx}`).value = formData.auditorName;
  ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`D${rowIdx}`).border = { bottom: { style: "thin" } };
  rowIdx++;

  ws.mergeCells(`A${rowIdx}:C${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "(Signature over printed name)\nHead/President of HEI";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

  ws.mergeCells(`D${rowIdx}:F${rowIdx}`);
  ws.getCell(`D${rowIdx}`).value = "(Signature over printed name)\nFor Public HEIs: COA/State Auditor\nFor Private HEIs: Internal/External Auditor";
  ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileTitle}.xlsx"`,
    },
  });
}
