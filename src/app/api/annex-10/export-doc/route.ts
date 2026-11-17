import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canExportAnnex } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  escapeHtml,
  safeJsonObject,
  sanitizeDownloadFilename,
} from "@/lib/validation";
import { Annex10FormData } from "@/types";
import { Role } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canExportAnnex(user.role as Role, 10)) {
      return NextResponse.json(
        { error: "Forbidden: Only Staff Coordinators or Campus Director may export Annex 10." },
        { status: 403 }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const formData = body.formData as Annex10FormData | undefined;
    const granteeId =
      typeof body.granteeId === "string" ? body.granteeId : undefined;
    const title = typeof body.title === "string" ? body.title : undefined;

    if (
      !formData ||
      !Array.isArray(formData.grantees) ||
      formData.grantees.length === 0 ||
      formData.grantees.length > 500
    ) {
      return NextResponse.json(
        { error: "Invalid form data: 1 to 500 grantees are required." },
        { status: 400 }
      );
    }

    const granteesToExport = granteeId
      ? formData.grantees.filter((g) => g.id === granteeId)
      : formData.grantees;

    if (granteesToExport.length === 0) {
      return NextResponse.json(
        { error: "Requested grantee not found." },
        { status: 404 }
      );
    }

    const labelRight =
      formData.topRightLabelType === "annex3_original"
        ? "Annex 3 - NOA"
        : formData.topRightLabelType === "both"
        ? "TDP Form - Annex 10 (Annex 3 - NOA)"
        : "TDP Form – Annex 10 (NOA)";

    const safeDocTitle = escapeHtml(title || "Notice of Award (NOA)");
    const safeLetterDate = escapeHtml(formData.letterDate);
    const conditionsList = Array.isArray(formData.conditions)
      ? formData.conditions
      : [];
    const safeMemoRef = escapeHtml(formData.memorandumOrderRef);
    const signatory = formData.signatory || {
      name: "",
      position: "",
      office: "",
    };

    let docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${safeDocTitle}</title>
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
      const safeName = escapeHtml(grantee.granteeName);
      const safeAddress = escapeHtml(grantee.address);
      const safeCity = escapeHtml(grantee.cityMunicipality);
      const safeSalutation = escapeHtml(
        grantee.salutation || `Dear Mr./Ms. ${grantee.granteeName || ""}:`
      );
      const safeAwardNo = escapeHtml(grantee.awardNo);
      const numericStipend = Number(grantee.stipendAmount) || 0;
      const safeSem = escapeHtml(grantee.startingSemester);
      const safeAy = escapeHtml(grantee.academicYear);

      docHtml += `
        <div class="${idx < granteesToExport.length - 1 ? "page-break" : ""}">
          <table class="top-label-table">
            <tr>
              <td align="left" style="width: 50%;">CHED-UniFAST-NOA</td>
              <td align="right" style="width: 50%;">${escapeHtml(labelRight)}</td>
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
            <div>${safeLetterDate}</div>
            <br/>
            <div><strong>${safeName}</strong></div>
            <div>${safeAddress}</div>
            <div>${safeCity}</div>
            <br/>
            <div>${safeSalutation}</div>
          </div>

          <div class="award-paragraph">
            We are pleased to inform that you are qualified as a TDP-TES grantee with Award No. <strong>TDP-TES${safeAwardNo}</strong>. Subject to availability of funds as provided in the General Appropriations Act and provisions of issuances issued by CHED/UniFAST, you will receive PhP ${escapeHtml(numericStipend.toLocaleString())} per semester starting the <strong>${safeSem} Semester of AY ${safeAy}</strong>. Once qualified, a TDP grantee will continue to receive grants provided that you are enrolled every semester and complies with the documentary requirements, and retention policy of his Higher Education Institution pursuant to the maximum residency rule.
          </div>

          <div>As TDP-TES grantee, you must comply with the following conditions:</div>
          <ul class="conditions-list" style="list-style-type: disc;">
            ${conditionsList.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
          </ul>

          <div class="warning-text">
            Please be advised that failure to comply with the above conditions will be grounds for the termination of your grants per ${safeMemoRef}.
          </div>

          <div class="signatory-block">
            <div>Very truly yours,</div>
            <br/><br/>
            <div><strong>${escapeHtml(signatory.name)}</strong></div>
            <div>${escapeHtml(signatory.position)}</div>
            <div>${escapeHtml(signatory.office)}</div>
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

    await logAudit({
      actorId: user.id,
      action: "ANNEX_10_DOC_EXPORTED",
      entity: "document",
      entityId: granteeId || "batch",
      req,
      details: { granteeCount: granteesToExport.length },
    });

    const filename = sanitizeDownloadFilename(
      title ? `Annex10_${title}` : "Annex10_NOA",
      "Annex10_NOA"
    );

    return new Response("\ufeff" + docHtml, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.doc"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Export DOC error:", error);
    return NextResponse.json(
      { error: "Failed to generate document export." },
      { status: 500 }
    );
  }
}
