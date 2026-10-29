import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";
import { Annex5FormData } from "@/types";

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

    let formData: Annex5FormData;
    let fileTitle = "Annex_5_Regional_Certification";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { annexType: true },
      });

      if (!doc || !doc.formData) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      formData = doc.formData as unknown as Annex5FormData;
      fileTitle = `Annex_5_Certification_${(formData.region || "MIMAROPA").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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

    const ws = workbook.addWorksheet("Annex 5", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });
    ws.views = [{ showGridLines: true }];

    ws.columns = [
      { width: 5 },  // A
      { width: 10 }, // B: SEQ
      { width: 44 }, // C: NAME OF HEI
      { width: 22 }, // D: HEI TYPE
      { width: 26 }, // E: NUMBER TDP GRANTEES
      { width: 5 },  // F
    ];

    // Form tag
    ws.mergeCells("B1:E1");
    ws.getCell("B1").value = "TDP Form - Annex 5";
    ws.getCell("B1").font = { name: "Arial", size: 11, bold: true };
    ws.getCell("B1").alignment = { horizontal: "right" };

    // Header
    ws.mergeCells("B2:E2");
    ws.getCell("B2").value = "Republic of the Philippines";
    ws.getCell("B2").font = { name: "Arial", size: 10 };
    ws.getCell("B2").alignment = { horizontal: "center" };

    ws.mergeCells("B3:E3");
    ws.getCell("B3").value = "Unified Student Financial Assistance System for Tertiary Education";
    ws.getCell("B3").font = { name: "Arial", size: 11, bold: true };
    ws.getCell("B3").alignment = { horizontal: "center" };

    ws.mergeCells("B4:E4");
    ws.getCell("B4").value = "Ground Floor, Bldg. E, UP Ayala Land Technohub Complex, Commonwealth Ave., Diliman, Quezon City";
    ws.getCell("B4").font = { name: "Arial", size: 8, italic: true };
    ws.getCell("B4").alignment = { horizontal: "center" };

    ws.mergeCells("B5:E5");
    ws.getCell("B5").value = "Email: unifastsecretariat@ched.gov.ph";
    ws.getCell("B5").font = { name: "Arial", size: 8 };
    ws.getCell("B5").alignment = { horizontal: "center" };

    // Date
    ws.mergeCells("D7:E7");
    ws.getCell("D7").value = `Date: ${formData.date}`;
    ws.getCell("D7").font = { name: "Arial", size: 10 };
    ws.getCell("D7").alignment = { horizontal: "right" };

    // Title
    ws.mergeCells("B9:E9");
    ws.getCell("B9").value = "C E R T I F I C A T I O N";
    ws.getCell("B9").font = { name: "Arial", size: 14, bold: true };
    ws.getCell("B9").alignment = { horizontal: "center" };

    // Addressee
    ws.getCell("B11").value = "For:";
    ws.getCell("B11").font = { name: "Arial", size: 10, bold: true };
    ws.mergeCells("C11:E11");
    ws.getCell("C11").value = formData.addressee?.name || "ATTY. RYAN L. ESTEVEZ";
    ws.getCell("C11").font = { name: "Arial", size: 10, bold: true };

    ws.mergeCells("C12:E12");
    ws.getCell("C12").value = formData.addressee?.position || "Officer-in-Charge, Office of the Executive Director IV, UniFAST";
    ws.getCell("C12").font = { name: "Arial", size: 9 };

    ws.mergeCells("C13:E13");
    ws.getCell("C13").value = formData.addressee?.address || "Ground Floor, Technohub Building E, Ayala Land Commonwealth Avenue, Quezon City";
    ws.getCell("C13").font = { name: "Arial", size: 9 };

    // Paragraph 1
    ws.mergeCells("B15:E17");
    ws.getCell("B15").value = `Pursuant to the Memorandum Order ${formData.memoOrderNumber || "01"} s. ${formData.memoOrderYear || "2024"} issued by the UniFAST Secretariat to the UniFAST Regional Coordinators after the conduct of the verification and validation process, this Office hereby endorses and submits to the UniFAST Secretariat the Tulong-Dunong grantees enrolled in the ${formData.term || "2nd"} Semester, Academic Year ${formData.academicYear || "2023-2024"} in Higher Education Institutions (HEIs) registered in CHED Regional Office - ${formData.region || "MIMAROPA"}.`;
    ws.getCell("B15").font = { name: "Arial", size: 9 };
    ws.getCell("B15").alignment = { wrapText: true, vertical: "top" };

    // Paragraph 2
    ws.mergeCells("B19:E20");
    ws.getCell("B19").value = "Relative thereto, the undersigned certifies and attests to the veracity of the Certificate of Registration/ Registration Form with Assessment submitted by qualified Tulong-Dunong grantees in compliance with the prescribed TES-TDP guidelines approved by the UniFAST Board.";
    ws.getCell("B19").font = { name: "Arial", size: 9 };
    ws.getCell("B19").alignment = { wrapText: true, vertical: "top" };

    // Table Intro
    ws.mergeCells("B22:E22");
    ws.getCell("B22").value = "For your reference, the table below shows the list of Higher Education Institutions registered at CHED-RO. with the total number of qualified Tulong-Dunong grantees:";
    ws.getCell("B22").font = { name: "Arial", size: 9 };

    // Table Header
    const r24 = ws.getRow(24);
    r24.values = ["", "SEQ", "NAME OF HEI", "HEI TYPE", "NUMBER TDP GRANTEES"];
    [r24.getCell(2), r24.getCell(3), r24.getCell(4), r24.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 9, bold: true };
      c.fill = headerFill;
      c.border = borderThin;
      c.alignment = { horizontal: "center", vertical: "middle" };
    });

    let currentRow = 25;
    formData.heis.forEach((hei) => {
      const r = ws.getRow(currentRow);
      r.values = ["", hei.seq, hei.nameOfHei, hei.heiType, hei.numberTdpGrantees];
      [r.getCell(2), r.getCell(3), r.getCell(4), r.getCell(5)].forEach((c) => {
        c.font = { name: "Arial", size: 9 };
        c.border = borderThin;
      });
      r.getCell(2).alignment = { horizontal: "center" };
      r.getCell(4).alignment = { horizontal: "center" };
      r.getCell(5).alignment = { horizontal: "center" };
      r.getCell(5).font = { name: "Arial", size: 9, bold: true };
      currentRow++;
    });

    // Total Row
    const totalRow = ws.getRow(currentRow);
    totalRow.values = ["", "Total", "", "", formData.totalGrantees];
    ws.mergeCells(`B${currentRow}:D${currentRow}`);
    [totalRow.getCell(2), totalRow.getCell(3), totalRow.getCell(4), totalRow.getCell(5)].forEach((c) => {
      c.font = { name: "Arial", size: 9, bold: true };
      c.border = borderThin;
    });
    totalRow.getCell(5).alignment = { horizontal: "center" };
    currentRow += 2;

    // Closing Paragraph
    ws.mergeCells(`B${currentRow}:E${currentRow + 1}`);
    ws.getCell(`B${currentRow}`).value = 'This certification is issued in order to facilitate the disbursement and release of funds intended for TDP beneficiaries in compliance with the Implementing Rules and Regulations of Republic Act 10931 "The Universal Access to Quality Tertiary Education".';
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 9 };
    ws.getCell(`B${currentRow}`).alignment = { wrapText: true, vertical: "top" };
    currentRow += 3;

    // Signatories
    ws.getCell(`B${currentRow}`).value = "Verified and Validated by:";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 9, italic: true };
    currentRow += 2;

    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = formData.signatories?.regionalCoordinator?.name || "[NAME & SIGNATURE]";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 10, bold: true };

    currentRow += 1;
    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = formData.signatories?.regionalCoordinator?.position || "Regional Coordinator";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 9 };

    currentRow += 2;
    ws.getCell(`B${currentRow}`).value = "Attested by:";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 9, italic: true };

    currentRow += 2;
    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = formData.signatories?.chedroDirector?.name || "EDNA IMELDA F. LEGAZPI";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 10, bold: true };

    currentRow += 1;
    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    ws.getCell(`B${currentRow}`).value = formData.signatories?.chedroDirector?.office || "Director IV, Office of the Director IV, CHEDRO MIMAROPA";
    ws.getCell(`B${currentRow}`).font = { name: "Arial", size: 9 };

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
