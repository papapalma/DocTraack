import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex4FormData } from "@/types";

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

    let formData: Annex4FormData;
    let fileTitle = "Annex_4_New_TDP_Billing_Package";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex4FormData;
      fileTitle = `Annex_4_${(formData.referenceNumber || doc.title).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    } else {
      return NextResponse.json(
        { error: "Missing documentId parameter" },
        { status: 400 }
      );
    }

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
      fgColor: { argb: "FFF0FDF4" }, // light green
    };

    const termLabel = formData.termCode === "1" ? "1st semester" : "2nd semester";

    // ==========================================
    // SHEET 1: Form 1 - Billing Statement
    // ==========================================
    const ws1 = workbook.addWorksheet("Form 1 - Billing Statement", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws1.views = [{ showGridLines: true }];

    ws1.columns = [
      { width: 5 },  // A
      { width: 28 }, // B
      { width: 22 }, // C
      { width: 18 }, // D
      { width: 18 }, // E
      { width: 20 }, // F
    ];

    ws1.mergeCells("A1:F1");
    ws1.getCell("A1").value = "Annex 4 - New TDP Form 1";
    ws1.getCell("A1").font = { name: "Arial", size: 11, bold: true };
    ws1.getCell("A1").alignment = { horizontal: "right" };

    ws1.mergeCells("A2:F2");
    ws1.getCell("A2").value = "Republic of the Philippines";
    ws1.getCell("A2").font = { name: "Arial", size: 10 };
    ws1.getCell("A2").alignment = { horizontal: "center" };

    ws1.mergeCells("A3:F3");
    ws1.getCell("A3").value = formData.heiName || "Mindoro State University";
    ws1.getCell("A3").font = { name: "Arial", size: 12, bold: true };
    ws1.getCell("A3").alignment = { horizontal: "center" };

    ws1.mergeCells("A4:F4");
    ws1.getCell("A4").value = formData.heiAddress || "Alcate, Victoria, Oriental Mindoro";
    ws1.getCell("A4").font = { name: "Arial", size: 9, italic: true };
    ws1.getCell("A4").alignment = { horizontal: "center" };

    ws1.mergeCells("A6:F6");
    ws1.getCell("A6").value = "CONSOLIDATED TDP BILLING STATEMENT";
    ws1.getCell("A6").font = { name: "Arial", size: 13, bold: true };
    ws1.getCell("A6").alignment = { horizontal: "center" };

    ws1.mergeCells("A7:F7");
    ws1.getCell("A7").value = `TDP Batch ${formData.batchNumber} - ${termLabel}, AY ${formData.academicYear}`;
    ws1.getCell("A7").font = { name: "Arial", size: 11, bold: true };
    ws1.getCell("A7").alignment = { horizontal: "center" };

    ws1.getCell("D9").value = "TDP-TES Billing Statement Reference No.:";
    ws1.getCell("D9").font = { name: "Arial", size: 10, bold: true };
    ws1.mergeCells("E9:F9");
    ws1.getCell("E9").value = formData.referenceNumber;
    ws1.getCell("E9").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("E9").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };

    ws1.getCell("D10").value = "Date:";
    ws1.getCell("D10").font = { name: "Arial", size: 10, bold: true };
    ws1.mergeCells("E10:F10");
    ws1.getCell("E10").value = formData.billingDate;
    ws1.getCell("E10").font = { name: "Arial", size: 10 };

    ws1.getCell("B12").value = "To:";
    ws1.getCell("B12").font = { name: "Arial", size: 10, bold: true };
    ws1.mergeCells("C12:F12");
    ws1.getCell("C12").value = "CHED - Regional Office MIMAROPA";
    ws1.getCell("C12").font = { name: "Arial", size: 10, bold: true };

    ws1.getCell("B13").value = "Address:";
    ws1.getCell("B13").font = { name: "Arial", size: 10, bold: true };
    ws1.mergeCells("C13:F13");
    ws1.getCell("C13").value = "2F HEDC Bldg., C.P. Garcia Ave., UP Diliman, Quezon City";
    ws1.getCell("C13").font = { name: "Arial", size: 10 };

    // Financial Table Header
    const r15 = ws1.getRow(15);
    r15.values = ["", "Responsibility Center", "Particulars", "Account Code", "Amount (PHP)", ""];
    ws1.mergeCells("B15:C15");
    ws1.mergeCells("E15:F15");
    [r15.getCell(2), r15.getCell(3), r15.getCell(4), r15.getCell(5), r15.getCell(6)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.fill = headerFill;
      c.border = borderThin;
    });

    // Row 16: Request Particulars
    ws1.getCell("B16").value = "CHED - Regional Office IV-B";
    ws1.getCell("B16").font = { name: "Arial", size: 9, bold: true };
    ws1.getCell("C16").value = `Request for payment of the Tulong Dunong Program - Tertiary Education Subsidy (TDP-TES) grant for ${termLabel}, Academic Year ${formData.academicYear} to be charged against funds for Universal Access to Quality Tertiary Education (UAQTE).`;
    ws1.getCell("C16").font = { name: "Arial", size: 9 };
    ws1.getCell("C16").alignment = { wrapText: true };
    ws1.getCell("D16").value = "";
    ws1.mergeCells("E16:F16");
    ws1.getCell("E16").value = formData.grandTotalBilling;
    ws1.getCell("E16").numFmt = "₱#,##0.00";
    ws1.getCell("E16").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("E16").alignment = { horizontal: "right" };
    ["B16", "C16", "D16", "E16", "F16"].forEach((ref) => {
      ws1.getCell(ref).border = borderThin;
    });

    // Row 17: Total student grantees count
    ws1.mergeCells("B17:C17");
    ws1.getCell("B17").value = "Total number of TDP-TES student-grantees in the Higher Education Institution (HEI):";
    ws1.getCell("B17").font = { name: "Arial", size: 9, bold: true };
    ws1.getCell("D17").value = formData.totalGrantees;
    ws1.getCell("D17").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("D17").alignment = { horizontal: "center" };
    ws1.mergeCells("E17:F17");
    ["B17", "C17", "D17", "E17", "F17"].forEach((ref) => (ws1.getCell(ref).border = borderThin));

    // Row 18: Total TDP-TES subsidy
    ws1.mergeCells("B18:C18");
    ws1.getCell("B18").value = "Total TDP-TES subsidy";
    ws1.getCell("B18").font = { name: "Arial", size: 9, bold: true };
    ws1.getCell("D18").value = "";
    ws1.mergeCells("E18:F18");
    ws1.getCell("E18").value = formData.totalSubsidy;
    ws1.getCell("E18").numFmt = "₱#,##0.00";
    ws1.getCell("E18").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("E18").alignment = { horizontal: "right" };
    ["B18", "C18", "D18", "E18", "F18"].forEach((ref) => (ws1.getCell(ref).border = borderThin));

    // Row 19: Management Fee
    ws1.mergeCells("B19:C19");
    ws1.getCell("B19").value = "Add .5% (.005) Management Fee for Partner Institutions";
    ws1.getCell("B19").font = { name: "Arial", size: 9, bold: true };
    ws1.getCell("D19").value = "";
    ws1.mergeCells("E19:F19");
    ws1.getCell("E19").value = formData.managementFeeAmount;
    ws1.getCell("E19").numFmt = "₱#,##0.00";
    ws1.getCell("E19").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("E19").alignment = { horizontal: "right" };
    ["B19", "C19", "D19", "E19", "F19"].forEach((ref) => (ws1.getCell(ref).border = borderThin));

    // Row 20: TOTAL
    ws1.mergeCells("B20:C20");
    ws1.getCell("B20").value = "TOTAL: TDP-TES Billing Amount";
    ws1.getCell("B20").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("D20").value = "";
    ws1.mergeCells("E20:F20");
    ws1.getCell("E20").value = formData.grandTotalBilling;
    ws1.getCell("E20").numFmt = "₱#,##0.00";
    ws1.getCell("E20").font = { name: "Arial", size: 11, bold: true };
    ws1.getCell("E20").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    ws1.getCell("E20").alignment = { horizontal: "right" };
    ["B20", "C20", "D20", "E20", "F20"].forEach((ref) => (ws1.getCell(ref).border = borderThin));

    // Signatories on Form 1
    ws1.mergeCells("B23:C23");
    ws1.getCell("B23").value = "Certified:";
    ws1.getCell("B23").font = { name: "Arial", size: 10, bold: true };
    ws1.mergeCells("D23:F23");
    ws1.getCell("D23").value = "Approved:";
    ws1.getCell("D23").font = { name: "Arial", size: 10, bold: true };

    ws1.mergeCells("B26:C26");
    ws1.getCell("B26").value = formData.signatories?.accountingHead?.name || "MA. ELENA L. BAUTISTA, CPA";
    ws1.getCell("B26").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("B26").alignment = { horizontal: "center" };

    ws1.mergeCells("B27:C27");
    ws1.getCell("B27").value = formData.signatories?.accountingHead?.position || "Head, Accounting/Authorized Representative";
    ws1.getCell("B27").font = { name: "Arial", size: 9 };
    ws1.getCell("B27").alignment = { horizontal: "center" };

    ws1.mergeCells("D26:F26");
    ws1.getCell("D26").value = formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD";
    ws1.getCell("D26").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("D26").alignment = { horizontal: "center" };

    ws1.mergeCells("D27:F27");
    ws1.getCell("D27").value = formData.signatories?.president?.position || "President/Authorized Representative";
    ws1.getCell("D27").font = { name: "Arial", size: 9 };
    ws1.getCell("D27").alignment = { horizontal: "center" };

    // ==========================================
    // SHEET 2: Form 2 - New Grantee Details (15 Cols)
    // ==========================================
    const ws2 = workbook.addWorksheet("Form 2 - New Grantee Details", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });
    ws2.views = [{ showGridLines: true }];

    ws2.columns = [
      { width: 14 }, // Control Number
      { width: 16 }, // Student Number
      { width: 22 }, // Award Number
      { width: 18 }, // Last Name
      { width: 18 }, // Given Name
      { width: 8 },  // MI
      { width: 8 },  // Sex
      { width: 14 }, // Birthdate
      { width: 26 }, // Program
      { width: 8 },  // Year
      { width: 26 }, // Email
      { width: 16 }, // Phone
      { width: 12 }, // Batch
      { width: 14 }, // Amount
      { width: 14 }, // Total Amount
    ];

    ws2.mergeCells("A1:O1");
    ws2.getCell("A1").value = "Annex 4 - New TDP Form 2";
    ws2.getCell("A1").font = { name: "Arial", size: 11, bold: true };
    ws2.getCell("A1").alignment = { horizontal: "right" };

    ws2.mergeCells("A2:O2");
    ws2.getCell("A2").value = "CONSOLIDATED NEW TDP DETAILS";
    ws2.getCell("A2").font = { name: "Arial", size: 13, bold: true };
    ws2.getCell("A2").alignment = { horizontal: "center" };

    ws2.mergeCells("A3:O3");
    ws2.getCell("A3").value = `TDP Batch ${formData.batchNumber} - ${termLabel}, AY ${formData.academicYear} | Campus: ${formData.campus}`;
    ws2.getCell("A3").font = { name: "Arial", size: 10, bold: true };
    ws2.getCell("A3").alignment = { horizontal: "center" };

    ws2.getCell("L5").value = "Reference No.:";
    ws2.getCell("L5").font = { name: "Arial", size: 9, bold: true };
    ws2.mergeCells("M5:O5");
    ws2.getCell("M5").value = formData.referenceNumber;
    ws2.getCell("M5").font = { name: "Arial", size: 9, bold: true };

    // 15-Column Header Row
    const headerRow = ws2.getRow(7);
    headerRow.values = [
      "Control No.",
      "Student No.",
      "TDP Award No.",
      "Last Name",
      "Given Name",
      "M.I.",
      "Sex",
      "Birthdate",
      "Degree Program",
      "Year",
      "E-mail Address",
      "Phone Number",
      "TDP Batch",
      "TDP Amount",
      "TOTAL AMOUNT",
    ];
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true };
      cell.fill = headerFill;
      cell.border = borderThin;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let currentRow = 8;
    formData.grantees.forEach((g) => {
      const r = ws2.getRow(currentRow);
      r.values = [
        g.controlNumber,
        g.studentNumber,
        g.tdpAwardNumber,
        g.lastName,
        g.givenName,
        g.middleInitial,
        g.sex,
        g.birthdate,
        g.degreeProgram,
        g.yearLevel,
        g.email,
        g.phone,
        g.tdpBatch,
        g.tdpAmount,
        g.totalAmount,
      ];

      r.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 9 };
        cell.border = borderThin;
        if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 6 || colNum === 7 || colNum === 8 || colNum === 10 || colNum === 12 || colNum === 13) {
          cell.alignment = { horizontal: "center" };
        } else if (colNum === 14 || colNum === 15) {
          cell.alignment = { horizontal: "right" };
          cell.numFmt = "₱#,##0.00";
        }
      });
      currentRow++;
    });

    // Summary Rows
    const sumRow1 = ws2.getRow(currentRow);
    sumRow1.getCell(1).value = "TOTAL TULONG DUNONG PROGRAM";
    ws2.mergeCells(`A${currentRow}:M${currentRow}`);
    sumRow1.getCell(1).font = { name: "Arial", size: 9, bold: true };
    sumRow1.getCell(14).value = formData.totalSubsidy;
    sumRow1.getCell(15).value = formData.totalSubsidy;
    [14, 15].forEach((c) => {
      sumRow1.getCell(c).numFmt = "₱#,##0.00";
      sumRow1.getCell(c).font = { name: "Arial", size: 9, bold: true };
    });
    for (let i = 1; i <= 15; i++) sumRow1.getCell(i).border = borderThin;
    currentRow++;

    const sumRow2 = ws2.getRow(currentRow);
    sumRow2.getCell(1).value = "Add .5 percent (.005%) Administrative Support for Partner Institutions";
    ws2.mergeCells(`A${currentRow}:M${currentRow}`);
    sumRow2.getCell(1).font = { name: "Arial", size: 9, bold: true };
    sumRow2.getCell(14).value = formData.managementFeeAmount;
    sumRow2.getCell(15).value = formData.managementFeeAmount;
    [14, 15].forEach((c) => {
      sumRow2.getCell(c).numFmt = "₱#,##0.00";
      sumRow2.getCell(c).font = { name: "Arial", size: 9, bold: true };
    });
    for (let i = 1; i <= 15; i++) sumRow2.getCell(i).border = borderThin;
    currentRow++;

    const sumRow3 = ws2.getRow(currentRow);
    sumRow3.getCell(1).value = `TOTAL TDP BILLING PER CAMPUS (${formData.campus})`;
    ws2.mergeCells(`A${currentRow}:M${currentRow}`);
    sumRow3.getCell(1).font = { name: "Arial", size: 9, bold: true };
    sumRow3.getCell(14).value = formData.grandTotalBilling;
    sumRow3.getCell(15).value = formData.grandTotalBilling;
    [14, 15].forEach((c) => {
      sumRow3.getCell(c).numFmt = "₱#,##0.00";
      sumRow3.getCell(c).font = { name: "Arial", size: 10, bold: true };
    });
    for (let i = 1; i <= 15; i++) sumRow3.getCell(i).border = borderThin;
    currentRow += 2;

    // 4 Signatories
    ws2.getCell(`A${currentRow}`).value = "Prepared by:";
    ws2.getCell(`E${currentRow}`).value = "Certified as to enrollment:";
    ws2.getCell(`I${currentRow}`).value = "Certified as to finance:";
    ws2.getCell(`M${currentRow}`).value = "Approved by:";

    currentRow += 2;
    ws2.getCell(`A${currentRow}`).value = formData.signatories?.tesFocalPerson?.name || "ENGR. EDWIN C. CAYETANO";
    ws2.getCell(`A${currentRow}`).font = { bold: true };
    ws2.getCell(`E${currentRow}`).value = formData.signatories?.registrar?.name || "ATTY. ROWENA S. DE GUZMAN";
    ws2.getCell(`E${currentRow}`).font = { bold: true };
    ws2.getCell(`I${currentRow}`).value = formData.signatories?.accountingHead?.name || "MA. ELENA L. BAUTISTA, CPA";
    ws2.getCell(`I${currentRow}`).font = { bold: true };
    ws2.getCell(`M${currentRow}`).value = formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD";
    ws2.getCell(`M${currentRow}`).font = { bold: true };

    // ==========================================
    // SHEET 3: Form 3 - Certification
    // ==========================================
    const ws3 = workbook.addWorksheet("Form 3 - Certification", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws3.views = [{ showGridLines: true }];

    ws3.columns = [
      { width: 5 },  // A
      { width: 30 }, // B
      { width: 20 }, // C
      { width: 25 }, // D
    ];

    ws3.mergeCells("A1:D1");
    ws3.getCell("A1").value = "Annex 4 - New TDP Form 3";
    ws3.getCell("A1").font = { name: "Arial", size: 11, bold: true };
    ws3.getCell("A1").alignment = { horizontal: "right" };

    ws3.mergeCells("A3:D3");
    ws3.getCell("A3").value = "Republic of the Philippines";
    ws3.getCell("A3").font = { name: "Arial", size: 10 };
    ws3.getCell("A3").alignment = { horizontal: "center" };

    ws3.mergeCells("A4:D4");
    ws3.getCell("A4").value = formData.heiName || "Mindoro State University";
    ws3.getCell("A4").font = { name: "Arial", size: 12, bold: true };
    ws3.getCell("A4").alignment = { horizontal: "center" };

    ws3.mergeCells("A5:D5");
    ws3.getCell("A5").value = formData.heiAddress || "Alcate, Victoria, Oriental Mindoro";
    ws3.getCell("A5").font = { name: "Arial", size: 9, italic: true };
    ws3.getCell("A5").alignment = { horizontal: "center" };

    ws3.mergeCells("C7:D7");
    ws3.getCell("C7").value = `Date: ${formData.billingDate}`;
    ws3.getCell("C7").font = { name: "Arial", size: 10 };
    ws3.getCell("C7").alignment = { horizontal: "right" };

    ws3.mergeCells("A9:D9");
    ws3.getCell("A9").value = "CERTIFICATION";
    ws3.getCell("A9").font = { name: "Arial", size: 14, bold: true };
    ws3.getCell("A9").alignment = { horizontal: "center" };

    ws3.mergeCells("A11:D11");
    ws3.getCell("A11").value = "TO WHOM IT MAY CONCERN:";
    ws3.getCell("A11").font = { name: "Arial", size: 10, bold: true };

    ws3.mergeCells("A13:D14");
    ws3.getCell("A13").value = `This is to certify that the total number of TDP grantees by campus as shown below, are qualified to avail of the Tulong Dunong Program (TDP) under R.A. No. 10931 also known as Universal Access to Quality Tertiary Education (UAQTE) for the ${termLabel} of Academic Year ${formData.academicYear}.`;
    ws3.getCell("A13").font = { name: "Arial", size: 10 };
    ws3.getCell("A13").alignment = { wrapText: true };

    // Table on Form 3
    const f3Header = ws3.getRow(16);
    f3Header.values = ["", "Name of Campus", "Batch Number", "Number of TDP Grantees"];
    [f3Header.getCell(2), f3Header.getCell(3), f3Header.getCell(4)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.fill = headerFill;
      c.border = borderThin;
      c.alignment = { horizontal: "center" };
    });

    const f3Data = ws3.getRow(17);
    f3Data.values = ["", formData.campus, formData.batchNumber, formData.totalGrantees];
    [f3Data.getCell(2), f3Data.getCell(3), f3Data.getCell(4)].forEach((c) => {
      c.font = { name: "Arial", size: 10 };
      c.border = borderThin;
    });
    f3Data.getCell(3).alignment = { horizontal: "center" };
    f3Data.getCell(4).alignment = { horizontal: "center" };

    const f3Total = ws3.getRow(18);
    f3Total.values = ["", "Total", "", formData.totalGrantees];
    ws3.mergeCells("B18:C18");
    [f3Total.getCell(2), f3Total.getCell(3), f3Total.getCell(4)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.border = borderThin;
    });
    f3Total.getCell(4).alignment = { horizontal: "center" };

    ws3.mergeCells("A20:D21");
    ws3.getCell("A20").value = "This further certifies that the students' information indicated in the billing statement of the Masterlist of New TDP Grantees (Annex 4) is accurate and complete.";
    ws3.getCell("A20").font = { name: "Arial", size: 10 };
    ws3.getCell("A20").alignment = { wrapText: true };

    ws3.mergeCells("A23:D24");
    ws3.getCell("A23").value = `This certification is being issued in accordance with the UniFAST Memorandum Circular (JMC) No. ${formData.jmcNumber || "04"} Series of ${formData.jmcSeries || "2022"}, on the Enhanced Guidelines of the Tulong Dunong Program (TDP).`;
    ws3.getCell("A23").font = { name: "Arial", size: 10 };
    ws3.getCell("A23").alignment = { wrapText: true };

    // Signatures
    ws3.getCell("B27").value = "Certified by:";
    ws3.getCell("B27").font = { name: "Arial", size: 10, italic: true };
    ws3.getCell("B29").value = formData.signatories?.registrar?.name || "ATTY. ROWENA S. DE GUZMAN";
    ws3.getCell("B29").font = { name: "Arial", size: 10, bold: true };
    ws3.getCell("B30").value = "Signature over Printed Name of the School Registrar";
    ws3.getCell("B30").font = { name: "Arial", size: 9 };

    ws3.getCell("B33").value = "Approved by:";
    ws3.getCell("B33").font = { name: "Arial", size: 10, italic: true };
    ws3.getCell("B35").value = formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD";
    ws3.getCell("B35").font = { name: "Arial", size: 10, bold: true };
    ws3.getCell("B36").value = "Signature over Printed Name of the President of the HEIs";
    ws3.getCell("B36").font = { name: "Arial", size: 9 };

    // Write binary buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileTitle}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
