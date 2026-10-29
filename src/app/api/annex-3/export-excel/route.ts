import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex3FormData } from "@/types";

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

    let formData: Annex3FormData;
    let fileTitle = "Annex_3_Continuing_Billing_Suite";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex3FormData;
      fileTitle = `Annex_3_${(formData.referenceNumber || doc.title).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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
      fgColor: { argb: "FFF0FDF4" }, // light emerald
    };

    // ==========================================
    // SHEET 1: Form 1 - Billing Statement
    // ==========================================
    const ws1 = workbook.addWorksheet("1 - Billing Statement", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws1.views = [{ showGridLines: true }];

    ws1.columns = [
      { width: 5 },  // A
      { width: 28 }, // B
      { width: 20 }, // C
      { width: 18 }, // D
      { width: 18 }, // E
      { width: 20 }, // F
    ];

    ws1.mergeCells("A1:F1");
    ws1.getCell("A1").value = "Annex 3 - TDP Continuing Form 1";
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
    ws1.getCell("A6").font = { name: "Arial", size: 14, bold: true };
    ws1.getCell("A6").alignment = { horizontal: "center" };

    ws1.mergeCells("A7:F7");
    const termLabel = formData.termCode === "1" ? "1st semester" : "2nd semester";
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

    // Financial Table
    const r15 = ws1.getRow(15);
    r15.values = ["", "Responsibility Center", "Particulars", "Account Code", "Amount (PHP)", ""];
    ws1.mergeCells("B15:C15");
    ws1.mergeCells("E15:F15");
    ws1.getCell("B15").fill = headerFill;
    ws1.getCell("D15").fill = headerFill;
    ws1.getCell("E15").fill = headerFill;
    ws1.getCell("B15").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("D15").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("E15").font = { name: "Arial", size: 10, bold: true };
    ws1.getCell("B15").border = borderThin;
    ws1.getCell("D15").border = borderThin;
    ws1.getCell("E15").border = borderThin;

    ws1.mergeCells("B16:C17");
    ws1.getCell("B16").value = "CHED - Regional Office MIMAROPA\nRequest for payment of TDP-TES grant as per attached supporting documents.";
    ws1.getCell("B16").alignment = { wrapText: true, vertical: "top" };
    ws1.getCell("B16").border = borderThin;

    ws1.mergeCells("E16:F17");
    ws1.getCell("E16").value = formData.grandTotalBilling;
    ws1.getCell("E16").numFmt = "₱#,##0.00";
    ws1.getCell("E16").font = { name: "Arial", size: 11, bold: true };
    ws1.getCell("E16").alignment = { horizontal: "right", vertical: "middle" };
    ws1.getCell("E16").border = borderThin;

    // Breakdown rows
    ws1.mergeCells("B19:D19");
    ws1.getCell("B19").value = "Total number of TDP-TES student-grantees in the Higher Education Institution (HEI):";
    ws1.mergeCells("E19:F19");
    ws1.getCell("E19").value = formData.totalGrantees;
    ws1.getCell("E19").font = { bold: true };
    ws1.getCell("E19").alignment = { horizontal: "right" };

    ws1.mergeCells("B20:D20");
    ws1.getCell("B20").value = "Total TDP-TES subsidy (PHP 7,500.00 per grantee):";
    ws1.mergeCells("E20:F20");
    ws1.getCell("E20").value = formData.totalSubsidy;
    ws1.getCell("E20").numFmt = "₱#,##0.00";
    ws1.getCell("E20").font = { bold: true };
    ws1.getCell("E20").alignment = { horizontal: "right" };

    ws1.mergeCells("B21:D21");
    ws1.getCell("B21").value = "Add .5% (.005) Management Fee for Partner Institutions:";
    ws1.mergeCells("E21:F21");
    ws1.getCell("E21").value = formData.managementFeeAmount;
    ws1.getCell("E21").numFmt = "₱#,##0.00";
    ws1.getCell("E21").alignment = { horizontal: "right" };

    ws1.mergeCells("B22:D22");
    ws1.getCell("B22").value = "TOTAL: TDP-TES Billing Amount:";
    ws1.getCell("B22").font = { bold: true };
    ws1.mergeCells("E22:F22");
    ws1.getCell("E22").value = formData.grandTotalBilling;
    ws1.getCell("E22").numFmt = "₱#,##0.00";
    ws1.getCell("E22").font = { bold: true, size: 11 };
    ws1.getCell("E22").alignment = { horizontal: "right" };
    ws1.getCell("E22").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };

    // Signatures
    ws1.getCell("B25").value = "Certified:";
    ws1.getCell("B25").font = { bold: true };
    ws1.getCell("D25").value = "Approved:";
    ws1.getCell("D25").font = { bold: true };

    ws1.getCell("B27").value = formData.signatories?.accountingHead?.name || "Atty. Juan De Castro";
    ws1.getCell("B27").font = { bold: true };
    ws1.getCell("B28").value = "Head, Accounting / Authorized Representative";

    ws1.getCell("D27").value = formData.signatories?.president?.name || "Dr. Enya Marie D. Apostol";
    ws1.getCell("D27").font = { bold: true };
    ws1.getCell("D28").value = "University President / Authorized Representative";

    // ==========================================
    // SHEET 2: Form 2 - Grantee Details
    // ==========================================
    const ws2 = workbook.addWorksheet("2 - Grantee Details", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });
    ws2.views = [{ showGridLines: true }];

    ws2.columns = [
      { width: 12 }, // Control No
      { width: 14 }, // Student No
      { width: 22 }, // TDP Award No
      { width: 16 }, // Last Name
      { width: 18 }, // Given Name
      { width: 8 },  // MI
      { width: 8 },  // Sex
      { width: 12 }, // Birthdate
      { width: 28 }, // Degree Program
      { width: 10 }, // Year Level
      { width: 25 }, // Email
      { width: 14 }, // Phone
      { width: 10 }, // Batch
      { width: 14 }, // Semester Amt
      { width: 14 }, // Total Amt
    ];

    ws2.mergeCells("A1:O1");
    ws2.getCell("A1").value = "Annex 3 - TDP Continuing Form 2: CONSOLIDATED CONTINUING TDP GRANTEES DETAILS";
    ws2.getCell("A1").font = { name: "Arial", size: 12, bold: true };

    ws2.mergeCells("A2:O2");
    ws2.getCell("A2").value = `Reference No.: ${formData.referenceNumber} | Date: ${formData.billingDate} | TDP Batch ${formData.batchNumber}`;
    ws2.getCell("A2").font = { name: "Arial", size: 10, italic: true };

    const f2Headers = [
      "5-digit Control Number",
      "Student Number",
      "TDP Award Number",
      "Last Name",
      "Given Name",
      "Middle Initial",
      "Sex at Birth",
      "Birthdate",
      "Degree Program",
      "Year Level",
      "E-mail Address",
      "Phone Number",
      "TDP Batch",
      "Semester Amount",
      "TOTAL AMOUNT",
    ];

    const hRow = ws2.getRow(4);
    hRow.values = f2Headers;
    hRow.font = { name: "Arial", size: 9, bold: true };
    hRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    hRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = borderThin;
    });

    let curRow = 5;
    (formData.billedGrantees || []).forEach((g) => {
      const row = ws2.getRow(curRow++);
      row.values = [
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
        g.semesterAmount,
        g.totalAmount,
      ];
      row.font = { name: "Arial", size: 9 };
      row.getCell(14).numFmt = "₱#,##0.00";
      row.getCell(15).numFmt = "₱#,##0.00";
      row.eachCell((c) => (c.border = borderThin));
    });

    // Summary Total Row
    const sumRow = ws2.getRow(curRow++);
    sumRow.getCell(1).value = "TOTAL TULONG DUNONG PROGRAM";
    ws2.mergeCells(`A${curRow - 1}:M${curRow - 1}`);
    sumRow.getCell(1).font = { bold: true };
    sumRow.getCell(14).value = formData.totalSubsidy;
    sumRow.getCell(14).numFmt = "₱#,##0.00";
    sumRow.getCell(15).value = formData.totalSubsidy;
    sumRow.getCell(15).numFmt = "₱#,##0.00";
    sumRow.font = { bold: true };
    sumRow.eachCell((c) => (c.border = borderThin));

    const feeRow = ws2.getRow(curRow++);
    feeRow.getCell(1).value = "Add .05 percent (.005) Management Fee for Partner Institutions";
    ws2.mergeCells(`A${curRow - 1}:N${curRow - 1}`);
    feeRow.getCell(15).value = formData.managementFeeAmount;
    feeRow.getCell(15).numFmt = "₱#,##0.00";
    feeRow.font = { bold: true };
    feeRow.eachCell((c) => (c.border = borderThin));

    const gRow = ws2.getRow(curRow++);
    gRow.getCell(1).value = "TOTAL TDP BILLING ALL CAMPUSES";
    ws2.mergeCells(`A${curRow - 1}:N${curRow - 1}`);
    gRow.getCell(15).value = formData.grandTotalBilling;
    gRow.getCell(15).numFmt = "₱#,##0.00";
    gRow.font = { bold: true, size: 10 };
    gRow.getCell(15).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    gRow.eachCell((c) => (c.border = borderThin));

    // ==========================================
    // SHEET 3: Form 3 - Other Continuing Grantees
    // ==========================================
    const ws3 = workbook.addWorksheet("3 - Other Continuing Grantees", {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });
    ws3.views = [{ showGridLines: true }];

    ws3.columns = [
      { width: 12 }, // Control No
      { width: 14 }, // Student No
      { width: 22 }, // TDP Award No
      { width: 16 }, // Last Name
      { width: 18 }, // Given Name
      { width: 8 },  // MI
      { width: 8 },  // Sex
      { width: 12 }, // Birthdate
      { width: 28 }, // Degree Program
      { width: 10 }, // Year Level
      { width: 16 }, // Status
      { width: 32 }, // Remarks
    ];

    ws3.mergeCells("A1:L1");
    ws3.getCell("A1").value = "Annex 3 - TDP Continuing Form 3: OTHER CONTINUING GRANTEES (NOT BILLED THIS TERM)";
    ws3.getCell("A1").font = { name: "Arial", size: 12, bold: true };

    const f3Headers = [
      "5-digit Control Number",
      "Student Number",
      "TDP Award Number",
      "Last Name",
      "Given Name",
      "Middle Initial",
      "Sex at Birth",
      "Birthdate",
      "Degree Program",
      "Year Level",
      "Status",
      "Remarks",
    ];

    const hRow3 = ws3.getRow(4);
    hRow3.values = f3Headers;
    hRow3.font = { name: "Arial", size: 9, bold: true };
    hRow3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    hRow3.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = borderThin;
    });

    let curRow3 = 5;
    (formData.otherGrantees || []).forEach((g) => {
      const row = ws3.getRow(curRow3++);
      row.values = [
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
        g.status,
        g.remarks,
      ];
      row.font = { name: "Arial", size: 9 };
      row.eachCell((c) => (c.border = borderThin));
    });

    if (!formData.otherGrantees || formData.otherGrantees.length === 0) {
      const emptyRow = ws3.getRow(5);
      emptyRow.getCell(1).value = "No unbilled continuing grantees for this batch.";
      ws3.mergeCells("A5:L5");
      emptyRow.font = { italic: true, color: { argb: "FF666666" } };
      emptyRow.alignment = { horizontal: "center" };
    }

    // ==========================================
    // SHEET 4: Form 4 - Certification
    // ==========================================
    const ws4 = workbook.addWorksheet("4 - Certification", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws4.views = [{ showGridLines: true }];

    ws4.columns = [
      { width: 6 },
      { width: 34 },
      { width: 20 },
      { width: 22 },
      { width: 6 },
    ];

    ws4.mergeCells("B2:D2");
    ws4.getCell("B2").value = "Republic of the Philippines";
    ws4.getCell("B2").alignment = { horizontal: "center" };

    ws4.mergeCells("B3:D3");
    ws4.getCell("B3").value = formData.heiName || "Mindoro State University";
    ws4.getCell("B3").font = { name: "Arial", size: 12, bold: true };
    ws4.getCell("B3").alignment = { horizontal: "center" };

    ws4.mergeCells("B4:D4");
    ws4.getCell("B4").value = formData.heiAddress || "Alcate, Victoria, Oriental Mindoro";
    ws4.getCell("B4").font = { name: "Arial", size: 9, italic: true };
    ws4.getCell("B4").alignment = { horizontal: "center" };

    ws4.mergeCells("B6:D6");
    ws4.getCell("B6").value = "CERTIFICATION";
    ws4.getCell("B6").font = { name: "Arial", size: 14, bold: true };
    ws4.getCell("B6").alignment = { horizontal: "center" };

    ws4.getCell("B8").value = "TO WHOM IT MAY CONCERN:";
    ws4.getCell("B8").font = { bold: true };

    ws4.mergeCells("B10:D12");
    ws4.getCell("B10").value =
      `This is to certify that the total number of TDP grantees by campus as shown below, are qualified to avail of the Tulong Dunong Program (TDP) under R.A. No. 10931 also known as Universal Access to Quality Tertiary Education (UAQTE) for the ${termLabel} of Academic Year ${formData.academicYear}.`;
    ws4.getCell("B10").alignment = { wrapText: true };

    // Tally table per campus
    const certHeaders = ["", "Name of Campus", "Batch Number", "Number of TDP Grantees", ""];
    const certHRow = ws4.getRow(14);
    certHRow.values = certHeaders;
    certHRow.font = { bold: true };
    ws4.getCell("B14").fill = headerFill;
    ws4.getCell("C14").fill = headerFill;
    ws4.getCell("D14").fill = headerFill;
    ws4.getCell("B14").border = borderThin;
    ws4.getCell("C14").border = borderThin;
    ws4.getCell("D14").border = borderThin;

    // Aggregate by campus from Form 2
    const campusCounts: Record<string, number> = {};
    (formData.billedGrantees || []).forEach((g) => {
      const camp = g.campus || "Main Campus (Victoria / Alcate)";
      campusCounts[camp] = (campusCounts[camp] || 0) + 1;
    });

    let cRow = 15;
    Object.entries(campusCounts).forEach(([campusName, count]) => {
      const row = ws4.getRow(cRow++);
      row.values = ["", campusName, `Batch ${formData.batchNumber}`, count, ""];
      row.getCell(2).border = borderThin;
      row.getCell(3).border = borderThin;
      row.getCell(4).border = borderThin;
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(4).alignment = { horizontal: "right" };
    });

    // Total row
    const cTotal = ws4.getRow(cRow++);
    cTotal.values = ["", "Total", "", formData.totalGrantees, ""];
    cTotal.font = { bold: true };
    cTotal.getCell(2).border = borderThin;
    cTotal.getCell(3).border = borderThin;
    cTotal.getCell(4).border = borderThin;
    cTotal.getCell(4).alignment = { horizontal: "right" };

    cRow++;
    ws4.mergeCells(`B${cRow}:D${cRow + 2}`);
    ws4.getCell(`B${cRow}`).value =
      "This further certifies that the students' information indicated in the billing statement of the Annex 3 - Tulong Dunong Program Continuing Form 2 is accurate and complete.\n\nThis certification is being issued in accordance with the UniFAST Memorandum Circular (JMC) No. 02 Series of 2022, on the Enhanced Guidelines of the Tulong Dunong Program (TDP).";
    ws4.getCell(`B${cRow}`).alignment = { wrapText: true };

    cRow += 4;
    ws4.getCell(`D${cRow}`).value = "Certified by:";
    cRow += 2;
    ws4.getCell(`D${cRow}`).value = formData.signatories?.registrar?.name || "Dr. Nemo R. San Pedro";
    ws4.getCell(`D${cRow}`).font = { bold: true };
    ws4.getCell(`D${cRow + 1}`).value = "University Registrar";

    cRow += 3;
    ws4.getCell(`D${cRow}`).value = "Approved by:";
    cRow += 2;
    ws4.getCell(`D${cRow}`).value = formData.signatories?.president?.name || "Dr. Enya Marie D. Apostol";
    ws4.getCell(`D${cRow}`).font = { bold: true };
    ws4.getCell(`D${cRow + 1}`).value = "University President (must be notarized)";

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
    console.error("Failed to export Annex 3 Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Annex 3 Excel spreadsheet" },
      { status: 500 }
    );
  }
}
