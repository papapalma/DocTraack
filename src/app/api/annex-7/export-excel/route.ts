import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex7FormData } from "@/types";

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

    let formData: Annex7FormData;
    let fileTitle = "Annex_7_RADAI";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex7FormData;
      fileTitle = `Annex_7_RADAI_${(doc.title || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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
    const formData = body as Annex7FormData;
    const fileTitle = `Annex_7_RADAI_${(formData.reportNo || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    return generateExcelResponse(formData, fileTitle);
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}

async function generateExcelResponse(formData: Annex7FormData, fileTitle: string) {
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
    fgColor: { argb: "FFF8FAFC" }, // very light gray
  };

  const ws = workbook.addWorksheet("RADAI", {
    pageSetup: {
      paperSize: 9, // A4 / Letter
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });

  // Column widths matching official table
  ws.columns = [
    { width: 14 }, // A: ADA Date
    { width: 18 }, // B: ADA Serial No.
    { width: 18 }, // C: DV/Payroll No.
    { width: 18 }, // D: ORS/BURS No.
    { width: 18 }, // E: Responsibility Center Code
    { width: 35 }, // F: Payee
    { width: 16 }, // G: UACS Object Code
    { width: 40 }, // H: Nature of Payment
    { width: 18 }, // I: Amount
  ];

  // Top Tag
  ws.getCell("I1").value = "TDP Form - Annex 7";
  ws.getCell("I1").font = { name: "Arial", size: 10, italic: true };
  ws.getCell("I1").alignment = { horizontal: "right" };

  // Title
  ws.mergeCells("A3:I3");
  ws.getCell("A3").value = "REPORT OF ADVICE TO DEBIT ACCOUNT ISSUED";
  ws.getCell("A3").font = { name: "Arial", size: 13, bold: true };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

  // Period Covered
  ws.mergeCells("A4:I4");
  ws.getCell("A4").value = `Period Covered: ${formData.periodCovered || "___________________________"}`;
  ws.getCell("A4").font = { name: "Arial", size: 10 };
  ws.getCell("A4").alignment = { horizontal: "center", vertical: "middle" };

  // Identification rows
  // Row 6
  ws.getCell("A6").value = "Entity Name :";
  ws.getCell("A6").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("B6:E6");
  ws.getCell("B6").value = formData.entityName;
  ws.getCell("B6").font = { name: "Arial", size: 9 };
  ws.getCell("B6").border = { bottom: { style: "thin" } };

  ws.getCell("G6").value = "Report No.:";
  ws.getCell("G6").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("H6:I6");
  ws.getCell("H6").value = formData.reportNo;
  ws.getCell("H6").font = { name: "Arial", size: 9 };
  ws.getCell("H6").border = { bottom: { style: "thin" } };

  // Row 7
  ws.getCell("A7").value = "Fund Cluster :";
  ws.getCell("A7").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("B7:E7");
  ws.getCell("B7").value = formData.fundCluster;
  ws.getCell("B7").font = { name: "Arial", size: 9 };
  ws.getCell("B7").border = { bottom: { style: "thin" } };

  ws.getCell("G7").value = "Sheet No.:";
  ws.getCell("G7").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("H7:I7");
  ws.getCell("H7").value = formData.sheetNo;
  ws.getCell("H7").font = { name: "Arial", size: 9 };
  ws.getCell("H7").border = { bottom: { style: "thin" } };

  // Row 8
  ws.getCell("A8").value = "Bank Name/Account No. :";
  ws.getCell("A8").font = { name: "Arial", size: 9, bold: true };
  ws.mergeCells("B8:E8");
  ws.getCell("B8").value = formData.bankNameAccountNo;
  ws.getCell("B8").font = { name: "Arial", size: 9 };
  ws.getCell("B8").border = { bottom: { style: "thin" } };

  // Table Headers (Rows 10 & 11)
  ws.mergeCells("A10:B10");
  ws.getCell("A10").value = "ADA";
  ws.getCell("A10").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("A10").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A10").fill = headerFill;

  ws.getCell("A11").value = "Date";
  ws.getCell("A11").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("A11").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A11").fill = headerFill;

  ws.getCell("B11").value = "Serial No.";
  ws.getCell("B11").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("B11").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("B11").fill = headerFill;

  const standardCols = [
    { col: "C", title: "DV/Payroll No." },
    { col: "D", title: "ORS/BURS No." },
    { col: "E", title: "Responsibility Center Code" },
    { col: "F", title: "Payee" },
    { col: "G", title: "UACS Object Code" },
    { col: "H", title: "Nature of Payment" },
    { col: "I", title: "Amount" },
  ];

  standardCols.forEach(({ col, title }) => {
    ws.mergeCells(`${col}10:${col}11`);
    const cell = ws.getCell(`${col}10`);
    cell.value = title;
    cell.font = { name: "Arial", size: 9, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = headerFill;
  });

  // Apply borders to headers
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
    ws.getCell(`${col}10`).border = borderThin;
    ws.getCell(`${col}11`).border = borderThin;
  });

  // Data rows
  let rowIdx = 12;
  const startDataRow = rowIdx;

  formData.entries.forEach((entry) => {
    ws.getCell(`A${rowIdx}`).value = entry.adaDate;
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`B${rowIdx}`).value = entry.adaSerialNo;
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`C${rowIdx}`).value = entry.dvPayrollNo;
    ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`D${rowIdx}`).value = entry.orsBursNo;
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`E${rowIdx}`).value = entry.responsibilityCenterCode;
    ws.getCell(`E${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`F${rowIdx}`).value = entry.payee;
    ws.getCell(`F${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`G${rowIdx}`).value = entry.uacsObjectCode;
    ws.getCell(`G${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`H${rowIdx}`).value = entry.natureOfPayment;
    ws.getCell(`H${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`I${rowIdx}`).value = Number(entry.amount) || 0;
    ws.getCell(`I${rowIdx}`).numFmt = '#,##0.00';
    ws.getCell(`I${rowIdx}`).alignment = { horizontal: "right" };

    ["A", "B", "C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
      const cell = ws.getCell(`${col}${rowIdx}`);
      cell.font = { name: "Arial", size: 9 };
      cell.border = borderThin;
    });

    rowIdx++;
  });

  // Empty filler rows up to 15
  const minRows = 15;
  const currentCount = formData.entries.length;
  if (currentCount < minRows) {
    for (let i = 0; i < minRows - currentCount; i++) {
      ["A", "B", "C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
        const cell = ws.getCell(`${col}${rowIdx}`);
        cell.border = borderThin;
      });
      rowIdx++;
    }
  }

  // Total row
  ws.mergeCells(`A${rowIdx}:H${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "TOTAL";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`A${rowIdx}`).border = borderThin;

  ws.getCell(`I${rowIdx}`).value = { formula: `SUM(I${startDataRow}:I${rowIdx - 1})`, result: formData.totalAmount };
  ws.getCell(`I${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`I${rowIdx}`).numFmt = '₱#,##0.00';
  ws.getCell(`I${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`I${rowIdx}`).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "double" },
  };

  rowIdx += 2;

  // CERTIFICATION BOX
  const certStartRow = rowIdx;
  ws.mergeCells(`A${rowIdx}:I${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "CERTIFICATION";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
  rowIdx++;

  ws.mergeCells(`B${rowIdx}:H${rowIdx + 1}`);
  ws.getCell(`B${rowIdx}`).value =
    `I hereby certify on my official oath that the above is a true statement of all ADAs issued by me during the period stated above for which ADA Nos. ${formData.adaNoFrom || "__________"} to ${formData.adaNoTo || "__________"} inclusive, were actually issued by me in the amounts shown thereon.`;
  ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9 };
  ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  rowIdx += 4;

  // Signature lines
  ws.mergeCells(`D${rowIdx}:F${rowIdx}`);
  ws.getCell(`D${rowIdx}`).value = formData.disbursingOfficerName;
  ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
  ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`D${rowIdx}`).border = { bottom: { style: "thin" } };
  rowIdx++;

  ws.mergeCells(`D${rowIdx}:F${rowIdx}`);
  ws.getCell(`D${rowIdx}`).value = "Name and Signature of Disbursing Officer/Cashier";
  ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };
  rowIdx += 2;

  // Designation and Date
  ws.getCell(`C${rowIdx}`).value = formData.disbursingOfficerDesignation;
  ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`C${rowIdx}`).border = { bottom: { style: "thin" } };

  ws.getCell(`G${rowIdx}`).value = formData.certificationDate;
  ws.getCell(`G${rowIdx}`).font = { name: "Arial", size: 9 };
  ws.getCell(`G${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`G${rowIdx}`).border = { bottom: { style: "thin" } };
  rowIdx++;

  ws.getCell(`C${rowIdx}`).value = "Official Designation";
  ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };

  ws.getCell(`G${rowIdx}`).value = "Date";
  ws.getCell(`G${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
  ws.getCell(`G${rowIdx}`).alignment = { horizontal: "center" };

  // Box border around the whole certification block
  for (let r = certStartRow; r <= rowIdx + 1; r++) {
    for (const c of ["A", "B", "C", "D", "E", "F", "G", "H", "I"]) {
      const cell = ws.getCell(`${c}${r}`);
      const borders: Partial<ExcelJS.Borders> = {};
      if (r === certStartRow) borders.top = { style: "medium" };
      if (r === rowIdx + 1) borders.bottom = { style: "medium" };
      if (c === "A") borders.left = { style: "medium" };
      if (c === "I") borders.right = { style: "medium" };
      cell.border = { ...cell.border, ...borders };
    }
  }

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
