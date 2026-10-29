import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex9FormData } from "@/types";

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

    let formData: Annex9FormData;
    let fileTitle = "Annex_9_TDP_Payroll";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex9FormData;
      fileTitle = `Annex_9_Payroll_${(doc.title || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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
    const formData = body as Annex9FormData;
    const fileTitle = `Annex_9_Payroll_${formData.academicYear || "AY"}_Sem${formData.activeSemester || "1"}`;

    return generateExcelResponse(formData, fileTitle);
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}

async function generateExcelResponse(formData: Annex9FormData, fileTitle: string) {
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

  const semFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F8F1" }, // light green
  };

  const ws = workbook.addWorksheet("General Payroll", {
    pageSetup: {
      paperSize: 9, // Letter/A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });

  // Column widths matching 14 columns
  ws.columns = [
    { width: 8 },  // A: Seq. No.
    { width: 22 }, // B: TDP Award No.
    { width: 16 }, // C: Student ID No.
    { width: 18 }, // D: Last Name
    { width: 18 }, // E: Given Name
    { width: 8 },  // F: M.I.
    { width: 28 }, // G: Degree Program
    { width: 10 }, // H: Year Level
    { width: 18 }, // I: First Sem - Total Amount Received
    { width: 14 }, // J: First Sem - Date Received
    { width: 20 }, // K: First Sem - Student's Signature
    { width: 18 }, // L: Second Sem - Total Amount Received
    { width: 14 }, // M: Second Sem - Date Received
    { width: 20 }, // N: Second Sem - Student's Signature
  ];

  // Top Tag
  ws.getCell("N1").value = "TDP Form - Annex 9";
  ws.getCell("N1").font = { name: "Arial", size: 10, italic: true };
  ws.getCell("N1").alignment = { horizontal: "right" };

  // Republic of the Philippines
  ws.mergeCells("A3:N3");
  ws.getCell("A3").value = "Republic of the Philippines";
  ws.getCell("A3").font = { name: "Arial", size: 9 };
  ws.getCell("A3").alignment = { horizontal: "center" };

  // HEI Name & Address
  ws.mergeCells("A4:N4");
  ws.getCell("A4").value = formData.heiName;
  ws.getCell("A4").font = { name: "Arial", size: 11, bold: true };
  ws.getCell("A4").alignment = { horizontal: "center" };

  ws.mergeCells("A5:N5");
  ws.getCell("A5").value = formData.heiAddress;
  ws.getCell("A5").font = { name: "Arial", size: 9 };
  ws.getCell("A5").alignment = { horizontal: "center" };

  // Payroll Title
  ws.mergeCells("A7:N7");
  ws.getCell("A7").value = "TULONG DUNONG PROGRAM - TERTIARY EDUCATION SUBSIDY (TDP-TES) PAYROLL";
  ws.getCell("A7").font = { name: "Arial", size: 12, bold: true };
  ws.getCell("A7").alignment = { horizontal: "center" };

  // Headers (Row 9 & 10)
  ws.mergeCells("A9:H9");
  ws.getCell("A9").value = "Student's Profile";
  ws.getCell("A9").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("A9").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A9").fill = headerFill;

  ws.mergeCells("I9:K9");
  ws.getCell("I9").value = "First Semester";
  ws.getCell("I9").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("I9").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("I9").fill = semFill;

  ws.mergeCells("L9:N9");
  ws.getCell("L9").value = "Second Semester";
  ws.getCell("L9").font = { name: "Arial", size: 9, bold: true };
  ws.getCell("L9").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("L9").fill = semFill;

  const subHeaders = [
    { col: "A", title: "Seq. No." },
    { col: "B", title: "TDP Award No." },
    { col: "C", title: "Student ID No." },
    { col: "D", title: "Last Name" },
    { col: "E", title: "Given Name" },
    { col: "F", title: "M.I." },
    { col: "G", title: "Degree Program" },
    { col: "H", title: "Year Level" },
    { col: "I", title: "Total Amount Received" },
    { col: "J", title: "Date Received" },
    { col: "K", title: "Student's Signature" },
    { col: "L", title: "Total Amount Received" },
    { col: "M", title: "Date Received" },
    { col: "N", title: "Student's Signature" },
  ];

  subHeaders.forEach(({ col, title }) => {
    const cell = ws.getCell(`${col}10`);
    cell.value = title;
    cell.font = { name: "Arial", size: 8.5, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = headerFill;
  });

  const allCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
  allCols.forEach((col) => {
    ws.getCell(`${col}9`).border = borderThin;
    ws.getCell(`${col}10`).border = borderThin;
  });

  // Data rows
  let rowIdx = 11;
  const startDataRow = rowIdx;

  formData.grantees.forEach((g) => {
    ws.getCell(`A${rowIdx}`).value = g.seqNo;
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`B${rowIdx}`).value = g.tdpAwardNo;
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`C${rowIdx}`).value = g.studentIdNo;
    ws.getCell(`C${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`D${rowIdx}`).value = g.lastName;
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`E${rowIdx}`).value = g.givenName;
    ws.getCell(`E${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`F${rowIdx}`).value = g.middleInitial;
    ws.getCell(`F${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`G${rowIdx}`).value = g.degreeProgram;
    ws.getCell(`G${rowIdx}`).alignment = { horizontal: "left" };

    ws.getCell(`H${rowIdx}`).value = g.yearLevel;
    ws.getCell(`H${rowIdx}`).alignment = { horizontal: "center" };

    // 1st Sem
    ws.getCell(`I${rowIdx}`).value = Number(g.firstSemAmount) || 0;
    ws.getCell(`I${rowIdx}`).numFmt = '#,##0.00';
    ws.getCell(`I${rowIdx}`).alignment = { horizontal: "right" };

    ws.getCell(`J${rowIdx}`).value = g.firstSemDateReceived;
    ws.getCell(`J${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`K${rowIdx}`).value = g.firstSemSignature;
    ws.getCell(`K${rowIdx}`).alignment = { horizontal: "center" };

    // 2nd Sem
    ws.getCell(`L${rowIdx}`).value = Number(g.secondSemAmount) || 0;
    ws.getCell(`L${rowIdx}`).numFmt = '#,##0.00';
    ws.getCell(`L${rowIdx}`).alignment = { horizontal: "right" };

    ws.getCell(`M${rowIdx}`).value = g.secondSemDateReceived;
    ws.getCell(`M${rowIdx}`).alignment = { horizontal: "center" };

    ws.getCell(`N${rowIdx}`).value = g.secondSemSignature;
    ws.getCell(`N${rowIdx}`).alignment = { horizontal: "center" };

    allCols.forEach((col) => {
      const cell = ws.getCell(`${col}${rowIdx}`);
      cell.font = { name: "Arial", size: 8.5 };
      cell.border = borderThin;
    });

    rowIdx++;
  });

  // Empty filler rows up to 25 rows min
  const minRows = 25;
  const currentCount = formData.grantees.length;
  if (currentCount < minRows) {
    for (let i = 0; i < minRows - currentCount; i++) {
      ws.getCell(`A${rowIdx}`).value = currentCount + i + 1;
      ws.getCell(`A${rowIdx}`).alignment = { horizontal: "center" };
      allCols.forEach((col) => {
        const cell = ws.getCell(`${col}${rowIdx}`);
        cell.font = { name: "Arial", size: 8.5 };
        cell.border = borderThin;
      });
      rowIdx++;
    }
  }

  // TOTAL Row
  ws.mergeCells(`A${rowIdx}:H${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "TOTAL";
  ws.getCell(`A${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`A${rowIdx}`).border = borderThin;

  // 1st Sem Total
  ws.getCell(`I${rowIdx}`).value = { formula: `SUM(I${startDataRow}:I${rowIdx - 1})`, result: formData.firstSemTotalAmount };
  ws.getCell(`I${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`I${rowIdx}`).numFmt = '₱#,##0.00';
  ws.getCell(`I${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`I${rowIdx}`).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "double" },
  };

  ws.mergeCells(`J${rowIdx}:K${rowIdx}`);
  ws.getCell(`J${rowIdx}`).border = borderThin;
  ws.getCell(`K${rowIdx}`).border = borderThin;

  // 2nd Sem Total
  ws.getCell(`L${rowIdx}`).value = { formula: `SUM(L${startDataRow}:L${rowIdx - 1})`, result: formData.secondSemTotalAmount };
  ws.getCell(`L${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`L${rowIdx}`).numFmt = '₱#,##0.00';
  ws.getCell(`L${rowIdx}`).alignment = { horizontal: "right" };
  ws.getCell(`L${rowIdx}`).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "double" },
  };

  ws.mergeCells(`M${rowIdx}:N${rowIdx}`);
  ws.getCell(`M${rowIdx}`).border = borderThin;
  ws.getCell(`N${rowIdx}`).border = borderThin;

  rowIdx += 3;

  // Quadruple Signatory Hierarchy
  // Row headers
  ws.getCell(`B${rowIdx}`).value = "Prepared by:";
  ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 8.5, italic: true };

  ws.getCell(`F${rowIdx}`).value = "Verified by:";
  ws.getCell(`F${rowIdx}`).font = { name: "Arial", size: 8.5, italic: true };

  ws.getCell(`I${rowIdx}`).value = "Certified true and correct by:";
  ws.getCell(`I${rowIdx}`).font = { name: "Arial", size: 8.5, italic: true };

  ws.getCell(`L${rowIdx}`).value = "Approved by:";
  ws.getCell(`L${rowIdx}`).font = { name: "Arial", size: 8.5, italic: true };

  rowIdx += 2;

  // Names
  ws.mergeCells(`B${rowIdx}:D${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = formData.signatories?.tesFocalPerson?.name || "DR. ARNEIL G. PEREZ";
  ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`B${rowIdx}`).border = { bottom: { style: "thin" } };

  ws.mergeCells(`F${rowIdx}:H${rowIdx}`);
  ws.getCell(`F${rowIdx}`).value = formData.signatories?.registrar?.name || "DR. NEMIA H. CHAVEZ";
  ws.getCell(`F${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`F${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`F${rowIdx}`).border = { bottom: { style: "thin" } };

  ws.mergeCells(`I${rowIdx}:K${rowIdx}`);
  ws.getCell(`I${rowIdx}`).value = formData.signatories?.accountant?.name || "MA. ELENA L. BAUTISTA, CPA";
  ws.getCell(`I${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`I${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`I${rowIdx}`).border = { bottom: { style: "thin" } };

  ws.mergeCells(`L${rowIdx}:N${rowIdx}`);
  ws.getCell(`L${rowIdx}`).value = formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD";
  ws.getCell(`L${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
  ws.getCell(`L${rowIdx}`).alignment = { horizontal: "center" };
  ws.getCell(`L${rowIdx}`).border = { bottom: { style: "thin" } };

  rowIdx++;

  // Subtitles
  ws.mergeCells(`B${rowIdx}:D${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = "(Signature above printed name)\nTES Focal Person/Scholarship Coordinator";
  ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 7.5, italic: true };
  ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

  ws.mergeCells(`F${rowIdx}:H${rowIdx}`);
  ws.getCell(`F${rowIdx}`).value = "(Signature above printed name)\nUniversity/College Registrar";
  ws.getCell(`F${rowIdx}`).font = { name: "Arial", size: 7.5, italic: true };
  ws.getCell(`F${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

  ws.mergeCells(`I${rowIdx}:K${rowIdx}`);
  ws.getCell(`I${rowIdx}`).value = "(Signature above printed name)\nAccountant";
  ws.getCell(`I${rowIdx}`).font = { name: "Arial", size: 7.5, italic: true };
  ws.getCell(`I${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

  ws.mergeCells(`L${rowIdx}:N${rowIdx}`);
  ws.getCell(`L${rowIdx}`).value = "(Signature above printed name)\nHead/President of HEI";
  ws.getCell(`L${rowIdx}`).font = { name: "Arial", size: 7.5, italic: true };
  ws.getCell(`L${rowIdx}`).alignment = { horizontal: "center", wrapText: true };

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
