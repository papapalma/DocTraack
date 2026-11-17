import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { KioskDisplayMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageQueueConfig } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { safeJsonObject } from "@/lib/validation";
import {
  ensureQueueBootstrap,
  getManilaQueueDate,
  normalizeQueueCampus,
  toPublicConfigDTO,
} from "@/lib/queue";
import { emitQueueEvent } from "@/lib/queue-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await ensureQueueBootstrap();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Fetch queue config error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve kiosk configuration" },
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
    if (!canManageQueueConfig(user.role)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only System Administrators can update Kiosk & Queue configuration.",
        },
        { status: 403 }
      );
    }

    await ensureQueueBootstrap();
    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const updateData: {
      kioskMode?: KioskDisplayMode;
      defaultCampus?: string;
      allowCampusSwitch?: boolean;
      showHomepageKioskButton?: boolean;
      showPrivacyMaskedNames?: boolean;
      enableThermalPrint?: boolean;
      autoPrintTicket?: boolean;
      enableSoundChime?: boolean;
      enableVoiceTts?: boolean;
      priorityRatio?: number;
      idleResetSeconds?: number;
      attractModeSeconds?: number;
      rateLimitBypassEnabled?: boolean;
      kioskPinHash?: string | null;
      updatedById: string;
    } = {
      updatedById: user.id,
    };

    if (
      body.kioskMode === "UNIFIED" ||
      body.kioskMode === "CHECK_IN_ONLY" ||
      body.kioskMode === "DISPLAY_ONLY"
    ) {
      updateData.kioskMode = body.kioskMode as KioskDisplayMode;
    }
    if (typeof body.defaultCampus === "string" && body.defaultCampus.trim()) {
      updateData.defaultCampus = normalizeQueueCampus(body.defaultCampus);
    }
    if (typeof body.allowCampusSwitch === "boolean") {
      updateData.allowCampusSwitch = body.allowCampusSwitch;
    }
    if (typeof body.showHomepageKioskButton === "boolean") {
      updateData.showHomepageKioskButton = body.showHomepageKioskButton;
    }
    if (typeof body.showPrivacyMaskedNames === "boolean") {
      updateData.showPrivacyMaskedNames = body.showPrivacyMaskedNames;
    }
    if (typeof body.enableThermalPrint === "boolean") {
      updateData.enableThermalPrint = body.enableThermalPrint;
    }
    if (typeof body.autoPrintTicket === "boolean") {
      updateData.autoPrintTicket = body.autoPrintTicket;
    }
    if (typeof body.enableSoundChime === "boolean") {
      updateData.enableSoundChime = body.enableSoundChime;
    }
    if (typeof body.enableVoiceTts === "boolean") {
      updateData.enableVoiceTts = body.enableVoiceTts;
    }
    if (typeof body.priorityRatio === "number") {
      updateData.priorityRatio = Math.max(-1, Math.min(5, Math.trunc(body.priorityRatio)));
    }
    if (typeof body.idleResetSeconds === "number") {
      updateData.idleResetSeconds = Math.max(
        8,
        Math.min(120, Math.trunc(body.idleResetSeconds))
      );
    }
    if (typeof body.attractModeSeconds === "number") {
      updateData.attractModeSeconds = Math.max(
        15,
        Math.min(300, Math.trunc(body.attractModeSeconds))
      );
    }
    if (typeof body.rateLimitBypassEnabled === "boolean") {
      updateData.rateLimitBypassEnabled = body.rateLimitBypassEnabled;
    }

    if (body.clearPin === true) {
      updateData.kioskPinHash = null;
    } else if (typeof body.kioskPin === "string" && body.kioskPin.trim()) {
      const pin = body.kioskPin.trim();
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json(
          { error: "Kiosk PIN must be 4 to 6 numeric digits." },
          { status: 400 }
        );
      }
      updateData.kioskPinHash = await bcrypt.hash(pin, 10);
    }

    const updated = await prisma.queueConfig.update({
      where: { id: "default" },
      data: updateData,
    });

    const publicDTO = toPublicConfigDTO(updated);

    await logAudit({
      actorId: user.id,
      action: "KIOSK_CONFIG_UPDATED",
      entity: "QUEUE_CONFIG",
      entityId: "default",
      details: {
        ...publicDTO,
        pinChanged: Boolean(body.kioskPin || body.clearPin),
      },
    });

    emitQueueEvent({
      type: "CONFIG_UPDATE",
      campus: publicDTO.defaultCampus,
      queueDate: getManilaQueueDate(),
    });

    return NextResponse.json({ config: publicDTO });
  } catch (error) {
    console.error("Update queue config error:", error);
    return NextResponse.json(
      { error: "Failed to update kiosk configuration" },
      { status: 500 }
    );
  }
}

