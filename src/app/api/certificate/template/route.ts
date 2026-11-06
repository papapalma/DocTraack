import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  CertificateTemplateConfig,
  PAPER_SIZES,
  PaperSize,
} from "@/lib/certificate";
import {
  getCertificateTemplate,
  saveCertificateTemplate,
} from "@/lib/certificate-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await getCertificateTemplate();
    return NextResponse.json({ template, paperSizes: PAPER_SIZES });
  } catch (error) {
    console.error("Get certificate template error:", error);
    return NextResponse.json(
      { error: "Failed to load certificate template" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict RBAC: Staff and Director ONLY. Admin is completely excluded.
    if (user.role !== Role.STAFF && user.role !== Role.DIRECTOR) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Certificate design customization is exclusively restricted to TDP Staff and Campus Director.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Reset to default action
    if (body.resetToDefault === true) {
      await saveCertificateTemplate(DEFAULT_CERTIFICATE_TEMPLATE);
      await logAudit({
        actorId: user.id,
        action: "CERTIFICATE_TEMPLATE_RESET",
        entity: "certificate_template",
        entityId: "default",
        details: { resetBy: user.email },
      });
      return NextResponse.json({
        message: "Certificate template reset to MinSU default",
        template: DEFAULT_CERTIFICATE_TEMPLATE,
      });
    }

    const current = await getCertificateTemplate();

    // Validate paper size
    const paperSize: PaperSize =
      body.paperSize && PAPER_SIZES[body.paperSize as PaperSize]
        ? (body.paperSize as PaperSize)
        : current.paperSize || "A4";

    const updatedTemplate: CertificateTemplateConfig = {
      ...current,
      ...body,
      paperSize,
    };

    await saveCertificateTemplate(updatedTemplate);

    await logAudit({
      actorId: user.id,
      action: "CERTIFICATE_TEMPLATE_UPDATED",
      entity: "certificate_template",
      entityId: "global",
      details: {
        paperSize: updatedTemplate.paperSize,
        title: updatedTemplate.title,
        updatedBy: user.email,
      },
    });

    return NextResponse.json({
      message: "Certificate template saved successfully",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Save certificate template error:", error);
    return NextResponse.json(
      { error: "Failed to save certificate template configuration" },
      { status: 500 }
    );
  }
}

