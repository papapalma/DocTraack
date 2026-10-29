import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApplicationStatus, Role } from "@prisma/client";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be Staff, Director, Accounting, or Admin
    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    let students: any[] = [];
    let fileTitle = "Annex_1_Masterlist_TDP_Grantees";

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
      });
      if (doc && doc.formData) {
        const formData = doc.formData as any;
        students = Array.isArray(formData.students) ? formData.students : [];
        fileTitle = `Annex_1_${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      }
    } else {
      // Fetch all validated/accepted student applications
      const applications = await prisma.application.findMany({
        where: { status: ApplicationStatus.ACCEPTED },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: "asc" },
      });

      students = applications.map((app, idx) => {
        const d = (app.formData as any) || {};
        return {
          seq: idx + 1,
          student_id: d.student_id || app.student.id,
          last_name: d.last_name || "",
          given_name: d.given_name || "",
          ext_name: d.ext_name || "",
          middle_name: d.middle_name || "",
          gender: d.gender || "M",
          birthdate: d.birthdate || "",
          course_degree: d.course_degree || "",
          year_level: d.year_level || "1",
          street_barangay: d.street_barangay || "",
          town_city: d.town_city || "",
          province: d.province || "",
          zipcode: d.zipcode || "",
          contact_number: d.contact_number || "",
          email: d.email || app.student.email,
          hei_uii: d.hei_uii || "4060",
          hei_name: d.hei_name || "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
          hei_campus: d.hei_campus || "Main Campus (Victoria / Alcate)",
          father_last_name: d.father_last_name || "",
          father_given_name: d.father_given_name || "",
          father_middle_name: d.father_middle_name || "",
          father_contact_number: d.father_contact_number || "",
          father_email: d.father_email || "",
          mother_last_name: d.mother_last_name || "",
          mother_given_name: d.mother_given_name || "",
          mother_middle_name: d.mother_middle_name || "",
          mother_contact_number: d.mother_contact_number || "",
          mother_email: d.mother_email || "",
          parent_contact_number: d.parent_contact_number || "",
          parent_email: d.parent_email || "",
        };
      });
    }

    // Create Excel Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mindoro State University - TDP DocTrack";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Annex 1 Grantees", {
      views: [{ showGridLines: true }],
    });

    // Color definitions matching the template image:
    // Cyan/Blue for Category Band: #0070C0
    // Red for Sub-headers: #C00000
    const blueHeaderFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };

    const redHeaderFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC00000" },
    };

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Row 1: Category Groups (Merged cells with Blue Fill)
    worksheet.mergeCells("A1:A1");
    worksheet.getCell("A1").value = "";

    worksheet.mergeCells("B1:B1");
    worksheet.getCell("B1").value = "";

    worksheet.mergeCells("C1:F1");
    worksheet.getCell("C1").value = "STUDENT'S NAME";

    worksheet.mergeCells("G1:J1");
    worksheet.getCell("G1").value = "STUDENT'S PROFILE";

    worksheet.mergeCells("K1:N1");
    worksheet.getCell("K1").value = "PERMANENT ADDRESS";

    worksheet.mergeCells("O1:O1");
    worksheet.getCell("O1").value = "";

    worksheet.mergeCells("P1:P1");
    worksheet.getCell("P1").value = "";

    worksheet.mergeCells("Q1:R1");
    worksheet.getCell("Q1").value = "Higher Education Institution";

    worksheet.mergeCells("S1:U1");
    worksheet.getCell("S1").value = "FATHER'S NAME";

    worksheet.mergeCells("V1:X1");
    worksheet.getCell("V1").value = "MOTHER'S MAIDEN NAME";

    // Style Row 1
    const row1 = worksheet.getRow(1);
    row1.height = 28;
    for (let c = 1; c <= 24; c++) {
      const cell = row1.getCell(c);
      cell.fill = blueHeaderFill;
      cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    }

    // Row 2: Sub-Column Headers (Red Fill)
    const subHeaders = [
      "SEQ",
      "STUDENT ID",
      "LAST NAME",
      "GIVEN NAME",
      "EXT. NAME",
      "MIDDLE NAME",
      "GENDER\n(M/F/or specify)",
      "BIRTHDATE\n(d/mm/yyyy)",
      "COMPLETE NAME OF COURSE/DEGREE\nPROGRAM (Should be consistent with your HEI registry)",
      "YEAR LEVEL\n(1/2/3/4/5)",
      "STREET & BARANGAY",
      "TOWN/CITY/MUNI",
      "PROVINCE",
      "ZIPCODE",
      "CONTACT NUMBER",
      "EMAIL ADDRESS",
      "HEI UII",
      "HEI NAME",
      "LAST NAME",
      "GIVEN NAME",
      "MIDDLE NAME",
      "LAST NAME",
      "GIVEN NAME",
      "MIDDLE NAME",
    ];

    const row2 = worksheet.getRow(2);
    row2.height = 42;
    subHeaders.forEach((headerText, index) => {
      const cell = row2.getCell(index + 1);
      cell.value = headerText;
      cell.fill = redHeaderFill;
      cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = borderStyle;
    });

    // Column Widths
    const columnWidths = [
      6,  // SEQ
      18, // STUDENT ID
      16, // LAST NAME
      16, // GIVEN NAME
      10, // EXT. NAME
      16, // MIDDLE NAME
      14, // GENDER
      14, // BIRTHDATE
      36, // COURSE/DEGREE
      12, // YEAR LEVEL
      24, // STREET & BARANGAY
      18, // TOWN/CITY
      18, // PROVINCE
      12, // ZIPCODE
      18, // CONTACT NUMBER
      28, // EMAIL ADDRESS
      14, // HEI UII
      48, // HEI NAME
      16, // FATHER LAST NAME
      16, // FATHER GIVEN NAME
      16, // FATHER MIDDLE NAME
      16, // MOTHER LAST NAME
      16, // MOTHER GIVEN NAME
      16, // MOTHER MIDDLE NAME
    ];

    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // Data Rows
    students.forEach((student, index) => {
      const rowIndex = index + 3;
      const dataRow = worksheet.getRow(rowIndex);
      dataRow.height = 22;

      const rowData = [
        student.seq || index + 1,
        student.student_id || "",
        (student.last_name || "").toUpperCase(),
        (student.given_name || "").toUpperCase(),
        student.ext_name || "",
        (student.middle_name || "").toUpperCase(),
        student.gender || "",
        student.birthdate || "",
        student.course_degree || "",
        student.year_level || "",
        student.street_barangay || "",
        student.town_city || "",
        student.province || "",
        student.zipcode || "",
        student.contact_number || "",
        student.email || "",
        student.hei_uii || "4060",
        student.hei_name || "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
        (student.father_last_name || "").toUpperCase(),
        (student.father_given_name || "").toUpperCase(),
        (student.father_middle_name || "").toUpperCase(),
        (student.mother_last_name || "").toUpperCase(),
        (student.mother_given_name || "").toUpperCase(),
        (student.mother_middle_name || "").toUpperCase(),
      ];

      rowData.forEach((val, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: "Arial", size: 9 };
        cell.border = borderStyle;

        // Center align specific columns (SEQ, STUDENT ID, GENDER, BIRTHDATE, YEAR, ZIP, HEI UII)
        if ([1, 2, 7, 8, 10, 14, 17].includes(colIdx + 1)) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
    });

    // Generate binary buffer
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
    console.error("Export Excel error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
