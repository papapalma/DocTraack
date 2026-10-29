import { NextRequest, NextResponse } from "next/server";
import { Annex10FormData } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, granteeId, title } = body as {
      formData: Annex10FormData;
      granteeId?: string;
      title?: string;
    };

    if (!formData || !formData.grantees || formData.grantees.length === 0) {
      return NextResponse.json(
        { error: "Invalid form data: grantees are required." },
        { status: 400 }
      );
    }

    const granteesToExport = granteeId
      ? formData.grantees.filter((g) => g.id === granteeId)
      : formData.grantees;

    const labelRight =
      formData.topRightLabelType === "annex3_original"
        ? "Annex 3 - NOA"
        : formData.topRightLabelType === "both"
        ? "TDP Form - Annex 10 (Annex 3 - NOA)"
        : "TDP Form – Annex 10 (NOA)";

    let docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title || "Notice of Award (NOA)"}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 0.8in 0.8in 0.8in 0.8in;
            mso-header-margin: 0.5in;
            mso-footer-margin: 0.5in;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.35;
            color: #000000;
          }
          .page-break {
            page-break-after: always;
          }
          .top-label-table {
            width: 100%;
            margin-bottom: 8px;
            font-size: 9.5pt;
            font-weight: bold;
          }
          .header-table {
            width: 100%;
            text-align: center;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .title-bold {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 6px;
            text-align: center;
          }
          .addressee-block {
            margin-top: 14px;
            margin-bottom: 14px;
            font-size: 10pt;
          }
          .award-paragraph {
            text-align: justify;
            margin-bottom: 12px;
            line-height: 1.35;
          }
          .conditions-list {
            margin-top: 4px;
            margin-bottom: 12px;
            padding-left: 20px;
          }
          .conditions-list li {
            margin-bottom: 6px;
            text-align: justify;
          }
          .warning-text {
            text-align: justify;
            margin-top: 10px;
            margin-bottom: 16px;
          }
          .signatory-block {
            margin-top: 20px;
            margin-bottom: 25px;
          }
          .footer-note {
            text-align: center;
            font-size: 9.5pt;
            font-weight: bold;
            font-style: italic;
            margin-top: 25px;
          }
        </style>
      </head>
      <body>
    `;

    granteesToExport.forEach((grantee, idx) => {
      docHtml += `
        <div class="${idx < granteesToExport.length - 1 ? "page-break" : ""}">
          <table class="top-label-table">
            <tr>
              <td align="left" style="width: 50%;">CHED-UniFAST-NOA</td>
              <td align="right" style="width: 50%;">${labelRight}</td>
            </tr>
          </table>

          <table class="header-table">
            <tr>
              <td style="text-align: center;">
                <div style="font-size: 10pt;">Republic of the Philippines</div>
                <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">Unified Student Financial Assistance System for Tertiary Education</div>
                <div style="font-size: 8.5pt;">Ground Floor, Bldg. E, UP Ayala Land Technohub Complex, Commonwealth Ave., Diliman, Quezon City</div>
                <div style="font-size: 8.5pt;">Email: unifastsecretariat@ched.gov.ph</div>
              </td>
            </tr>
          </table>

          <div class="title-bold">
            TULONG DUNONG PROGRAM UNDER THE TERTIARY EDUCATION SUBSIDY<br/>(TDP-TES)<br/>NOTICE OF AWARD
          </div>

          <div class="addressee-block">
            <div>${formData.letterDate}</div>
            <br/>
            <div><strong>${grantee.granteeName}</strong></div>
            <div>${grantee.address}</div>
            <div>${grantee.cityMunicipality}</div>
            <br/>
            <div>${grantee.salutation || `Dear Mr./Ms. ${grantee.granteeName}:`}</div>
          </div>

          <div class="award-paragraph">
            We are pleased to inform that you are qualified as a TDP-TES grantee with Award No. <strong>TDP-TES${grantee.awardNo}</strong>. Subject to availability of funds as provided in the General Appropriations Act and provisions of issuances issued by CHED/UniFAST, you will receive PhP ${grantee.stipendAmount.toLocaleString()} per semester starting the <strong>${grantee.startingSemester} Semester of AY ${grantee.academicYear}</strong>. Once qualified, a TDP grantee will continue to receive grants provided that you are enrolled every semester and complies with the documentary requirements, and retention policy of his Higher Education Institution pursuant to the maximum residency rule.
          </div>

          <div>As TDP-TES grantee, you must comply with the following conditions:</div>
          <ul class="conditions-list" style="list-style-type: disc;">
            ${formData.conditions.map((c) => `<li>${c}</li>`).join("")}
          </ul>

          <div class="warning-text">
            Please be advised that failure to comply with the above conditions will be grounds for the termination of your grants per ${formData.memorandumOrderRef}.
          </div>

          <div class="signatory-block">
            <div>Very truly yours,</div>
            <br/><br/>
            <div><strong>${formData.signatory.name}</strong></div>
            <div>${formData.signatory.position}</div>
            <div>${formData.signatory.office}</div>
          </div>

          <div class="footer-note">
            ***This Notice of Award is not for sale and is issued only once to qualified applicants.***
          </div>
        </div>
      `;
    });

    docHtml += `
      </body>
      </html>
    `;

    return new Response("\ufeff" + docHtml, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="Annex10_NOA.doc"`,
      },
    });
  } catch (error: any) {
    console.error("Export DOC error:", error);
    return NextResponse.json(
      { error: "Failed to generate document export: " + error.message },
      { status: 500 }
    );
  }
}
