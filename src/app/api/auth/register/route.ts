import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { Role } from "@prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isValidEmail,
  validatePassword,
  sanitizeText,
  safeJsonObject,
} from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${clientIp}`, {
      limit: 3,
      windowMs: 600000,
    });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Too many accounts created from this network. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanName = sanitizeText(name, 100);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { error: "Please provide a valid full name (min 2 characters)" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return NextResponse.json(
        {
          error:
            passCheck.message || "Password does not meet security requirements",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Unable to register with the provided email address." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: cleanName,
          email: normalizedEmail,
          passwordHash,
          role: Role.STUDENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await writeAuditTx(tx, {
        actorId: created.id,
        action: "STUDENT_REGISTRATION",
        entity: "user",
        entityId: created.id,
        req,
        details: { email: created.email },
      });

      return created;
    });

    await createSession(newUser.id, Role.STUDENT);

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register account" },
      { status: 500 }
    );
  }
}
