import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === Role.STUDENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type } = await params;

    if (type === "ched") {
      const csvContent =
        "lastName|firstName|middleName|School\r\n" +
        "DELA CRUZ|JUAN|SANTOS|Mindoro State University - Bongabong Campus\r\n" +
        "SANTOS|MARIA|LOPEZ|Mindoro State University - Bongabong Campus\r\n" +
        "REYES|PEDRO|AQUINO|Mindoro State University - Calapan Campus\r\n" +
        "MENDOZA|ANA|CRUZ|Mindoro State University - Main Campus (Victoria)\r\n";

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="ched_template_doctrack.csv"',
        },
      });
    }

    if (type === "registrar") {
      const csvContent =
        "lastName|firstName|middleName|School|IDnumber\r\n" +
        "DELA CRUZ|JUAN|SANTOS|Mindoro State University - Bongabong Campus|2024-00123-BC\r\n" +
        "SANTOS|MARIA|LOPEZ|Mindoro State University - Bongabong Campus|2024-00124-BC\r\n" +
        "REYES|PEDRO|AQUINO|Mindoro State University - Calapan Campus|2024-00201-CC\r\n" +
        "MENDOZA|ANA|CRUZ|Mindoro State University - Main Campus (Victoria)|2024-00301-MC\r\n";

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="registrar_template_doctrack.csv"',
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid template type. Use 'ched' or 'registrar'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}

