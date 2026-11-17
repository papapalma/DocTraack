import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  checkRateLimit,
  clearFailures,
  getClientIp,
  isLockedOut,
  recordFailure,
} from "@/lib/rate-limit";
import { ensureQueueBootstrap } from "@/lib/queue";
import { safeJsonObject } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const lockCheck = isLockedOut(`kiosk_pin_lock:${clientIp}`);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: "Kiosk PIN entry temporarily locked due to repeated invalid attempts." },
        {
          status: 429,
          headers: {
            "Retry-After": lockCheck.retryAfterSec.toString(),
          },
        }
      );
    }

    const rateCheck = checkRateLimit(`kiosk_pin:${clientIp}`, {
      limit: 5,
      windowMs: 60000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many PIN attempts. Please wait 1 minute." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    await ensureQueueBootstrap();
    const body = await safeJsonObject(req);
    const pin = body && typeof body.pin === "string" ? body.pin.trim() : "";

    const config = await prisma.queueConfig.findUnique({
      where: { id: "default" },
      select: { kioskPinHash: true },
    });

    // If no PIN is configured by System Admin, allow immediate local device settings toggle
    if (!config?.kioskPinHash) {
      return NextResponse.json({ verified: true, pinRequired: false });
    }

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "Please enter the 4–6 digit Kiosk Admin PIN." },
        { status: 400 }
      );
    }

    const match = await bcrypt.compare(pin, config.kioskPinHash);
    if (!match) {
      recordFailure(`kiosk_pin_lock:${clientIp}`, 5, 5 * 60 * 1000);
      await logAudit({
        actorId: null,
        action: "KIOSK_PIN_FAILED",
        entity: "queue_config",
        entityId: "default",
        req,
      });
      return NextResponse.json(
        { error: "Incorrect Kiosk Admin PIN." },
        { status: 401 }
      );
    }

    clearFailures(`kiosk_pin_lock:${clientIp}`);
    return NextResponse.json({ verified: true, pinRequired: true });
  } catch (error) {
    console.error("Kiosk PIN verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify kiosk PIN" },
      { status: 500 }
    );
  }
}

