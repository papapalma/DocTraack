import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex6FormData } from "@/types";

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

    let formData: Annex6FormData;
    let fileTitle = "Annex_6_Fund_Utilization_Report";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex6FormData;
      fileTitle = `Annex_6_FUR_${(doc.title || "MinSU").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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

    const ws = workbook.addWorksheet("FUR", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws.views = [{ showGridLines: true }];

    ws.columns = [
      { width: 5 },  // A
      { width: 32 }, // B: Category / Check details
      { width: 38 }, // C: Line Items
      { width: 20 }, // D: Sub-amounts
      { width: 22 }, // E: Main totals
      { width: 5 },  // F
    ];

    // Header
    ws.mergeCells("B2:E2");
    ws.getCell("B2").value = "FUND UTILIZATION REPORT (FUR)";
    ws.getCell("B2").font = { name: "Arial", size: 12, bold: true };
    ws.getCell("B2").alignment = { horizontal: "center" };

    ws.mergeCells("B3:E3");
    ws.getCell("B3").value = formData.heiName || "MINDORO STATE UNIVERSITY";
    ws.getCell("B3").font = { name: "Arial", size: 11, bold: true };
    ws.getCell("B3").alignment = { horizontal: "center" };

    ws.mergeCells("B4:E4");
    ws.getCell("B4").value = formData.heiAddress || "Alcate, Victoria, Oriental Mindoro";
    ws.getCell("B4").font = { name: "Arial", size: 9, italic: true };
    ws.getCell("B4").alignment = { horizontal: "center" };

    ws.mergeCells("B5:E5");
    ws.getCell("B5").value = "Fund Utilization Report of the TDP/Management Fee";
    ws.getCell("B5").font = { name: "Arial", size: 10, bold: true };
    ws.getCell("B5").alignment = { horizontal: "center" };

    ws.mergeCells("B6:E6");
    ws.getCell("B6").value = `For the Covered Period of ${formData.coveredPeriod}`;
    ws.getCell("B6").font = { name: "Arial", size: 10 };
    ws.getCell("B6").alignment = { horizontal: "center" };

    // Row 8: FUNDS RECEIVED
    const r8 = ws.getRow(8);
    r8.values = ["", "FUNDS RECEIVED", "", "", ""];
    ws.mergeCells("B8:D8");
    [r8.getCell(2), r8.getCell(3), r8.getCell(4), r8.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.fill = headerFill;
      c.border = borderThin;
    });

    // Row 9: Check details & Stipend
    ws.getCell("B9").value = `Check No. ${formData.checkNumber || ""}  Check Date: ${formData.checkDate || ""}`;
    ws.getCell("B9").font = { name: "Arial", size: 9 };
    ws.getCell("C9").value = "Total Stipend";
    ws.getCell("C9").font = { name: "Arial", size: 9, italic: true };
    ws.getCell("D9").value = formData.totalStipendReceived;
    ws.getCell("D9").numFmt = "₱#,##0.00";
    ws.getCell("D9").font = { name: "Arial", size: 9, bold: true };
    ws.getCell("D9").alignment = { horizontal: "right" };
    ws.getCell("E9").value = formData.totalFundsReceived;
    ws.getCell("E9").numFmt = "₱#,##0.00";
    ws.getCell("E9").font = { name: "Arial", size: 10, bold: true };
    ws.getCell("E9").alignment = { horizontal: "right" };
    ["B9", "C9", "D9", "E9"].forEach((ref) => (ws.getCell(ref).border = borderThin));

    // Row 10: Total ASC
    ws.getCell("B10").value = "";
    ws.getCell("C10").value = "Total ASC";
    ws.getCell("C10").font = { name: "Arial", size: 9, italic: true };
    ws.getCell("D10").value = formData.totalAscReceived;
    ws.getCell("D10").numFmt = "₱#,##0.00";
    ws.getCell("D10").font = { name: "Arial", size: 9, bold: true };
    ws.getCell("D10").alignment = { horizontal: "right" };
    ws.getCell("E10").value = "";
    ["B10", "C10", "D10", "E10"].forEach((ref) => (ws.getCell(ref).border = borderThin));

    // Row 12: Less: FUND UTILIZED
    const r12 = ws.getRow(12);
    r12.values = ["", "Less: FUND UTILIZED", "", "", ""];
    ws.mergeCells("B12:E12");
    [r12.getCell(2), r12.getCell(3), r12.getCell(4), r12.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.fill = headerFill;
      c.border = borderThin;
    });

    const r13 = ws.getRow(13);
    r13.values = ["", "Disbursements (see attached RCI/RADAI to support Disbursement)", "", "", ""];
    ws.mergeCells("B13:E13");
    [r13.getCell(2), r13.getCell(3), r13.getCell(4), r13.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 8, italic: true };
      c.border = borderThin;
    });

    // Row 15: MOOE - STIPEND
    ws.getCell("B15").value = "MOOE - STIPEND";
    ws.getCell("B15").font = { name: "Arial", size: 9, bold: true };
    ws.getCell("C15").value = "Total Stipend per Semester basis";
    ws.getCell("C15").font = { name: "Arial", size: 9, italic: true };
    ws.getCell("D15").value = formData.totalStipendUtilized;
    ws.getCell("D15").numFmt = "₱#,##0.00";
    ws.getCell("D15").font = { name: "Arial", size: 9, bold: true };
    ws.getCell("D15").alignment = { horizontal: "right" };
    ws.getCell("E15").value = "";
    ["B15", "C15", "D15", "E15"].forEach((ref) => (ws.getCell(ref).border = borderThin));

    // Row 17: MOOE - Management Fee Header
    ws.getCell("B17").value = "MOOE - Management Fee";
    ws.getCell("B17").font = { name: "Arial", size: 9, bold: true };
    ["B17", "C17", "D17", "E17"].forEach((ref) => (ws.getCell(ref).border = borderThin));

    const mgmtItems = [
      { label: "Office Supplies Expenses", val: formData.managementFeeExpenses.officeSupplies },
      { label: "Communication Expenses", val: formData.managementFeeExpenses.communication },
      { label: "Traveling Expenses - Local", val: formData.managementFeeExpenses.travelingLocal },
      { label: "Representation Expenses (Meetings, orientation, seminars, general assembly)", val: formData.managementFeeExpenses.representation },
      { label: "Other Professional Services (Salary of staff)", val: formData.managementFeeExpenses.otherProfessionalServices },
      { label: "Legal Services (Notarization of docs)", val: formData.managementFeeExpenses.legalServices },
      { label: "Other Expenses (cash cards, service fee for remittance center)", val: formData.managementFeeExpenses.otherExpenses },
    ];

    let rowIdx = 18;
    mgmtItems.forEach((item) => {
      ws.getCell(`B${rowIdx}`).value = "";
      ws.getCell(`C${rowIdx}`).value = item.label;
      ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
      ws.getCell(`D${rowIdx}`).value = item.val;
      ws.getCell(`D${rowIdx}`).numFmt = "₱#,##0.00";
      ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 9 };
      ws.getCell(`D${rowIdx}`).alignment = { horizontal: "right" };
      ws.getCell(`E${rowIdx}`).value = "";
      [`B${rowIdx}`, `C${rowIdx}`, `D${rowIdx}`, `E${rowIdx}`].forEach((ref) => (ws.getCell(ref).border = borderThin));
      rowIdx++;
    });

    // Subtotal Management Fee and Total Utilized
    ws.getCell(`B${rowIdx}`).value = "";
    ws.getCell(`C${rowIdx}`).value = "Subtotal Management Fee";
    ws.getCell(`C${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
    ws.getCell(`D${rowIdx}`).value = formData.totalManagementFeeUtilized;
    ws.getCell(`D${rowIdx}`).numFmt = "₱#,##0.00";
    ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 9, bold: true };
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "right" };

    ws.getCell(`E${rowIdx}`).value = formData.totalFundsUtilized;
    ws.getCell(`E${rowIdx}`).numFmt = "₱#,##0.00";
    ws.getCell(`E${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(`E${rowIdx}`).alignment = { horizontal: "right" };
    [`B${rowIdx}`, `C${rowIdx}`, `D${rowIdx}`, `E${rowIdx}`].forEach((ref) => (ws.getCell(ref).border = borderThin));
    rowIdx++;

    // Row: Balance
    const rBal = ws.getRow(rowIdx);
    rBal.values = ["", "Balance", "", "", formData.balance];
    ws.mergeCells(`B${rowIdx}:D${rowIdx}`);
    [rBal.getCell(2), rBal.getCell(3), rBal.getCell(4), rBal.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 10, bold: true };
      c.border = borderThin;
    });
    rBal.getCell(5).numFmt = "₱#,##0.00";
    rBal.getCell(5).font = { name: "Arial", size: 11, bold: true };
    rBal.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    rBal.getCell(5).alignment = { horizontal: "right" };
    rowIdx += 3;

    // Signatories
    ws.getCell(`B${rowIdx}`).value = "Certified correct by:";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9, italic: true };
    ws.getCell(`D${rowIdx}`).value = "Approved by:";
    ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 9, italic: true };
    rowIdx += 3;

    ws.getCell(`B${rowIdx}`).value = formData.signatories?.chiefAccountant?.name || "MA. ELENA L. BAUTISTA, CPA";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

    ws.mergeCells(`D${rowIdx}:E${rowIdx}`);
    ws.getCell(`D${rowIdx}`).value = formData.signatories?.president?.name || "DR. EMMANUEL C. MACALALAD";
    ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx += 1;

    ws.getCell(`B${rowIdx}`).value = formData.signatories?.chiefAccountant?.position || "Chief Accountant";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9 };
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

    ws.mergeCells(`D${rowIdx}:E${rowIdx}`);
    ws.getCell(`D${rowIdx}`).value = formData.signatories?.president?.position || "Head/President of HEI";
    ws.getCell(`D${rowIdx}`).font = { name: "Arial", size: 9 };
    ws.getCell(`D${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx += 3;

    // Auditor
    ws.getCell(`B${rowIdx}`).value = "Verified/Audited by:";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9, italic: true };
    rowIdx += 3;

    ws.getCell(`B${rowIdx}`).value = formData.signatories?.auditor?.name || "ATTY. CRISTINA M. MERCADO";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 10, bold: true };
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx += 1;

    ws.getCell(`B${rowIdx}`).value = formData.signatories?.auditor?.position || "COA/State Auditor (for SUCs/LUCs)";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 9 };
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };
    rowIdx += 1;

    ws.getCell(`B${rowIdx}`).value = formData.signatories?.auditor?.agency || "Internal/External Auditor (for PHEIs)";
    ws.getCell(`B${rowIdx}`).font = { name: "Arial", size: 8, italic: true };
    ws.getCell(`B${rowIdx}`).alignment = { horizontal: "center" };

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
