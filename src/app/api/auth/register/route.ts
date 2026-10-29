import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail, validatePassword, sanitizeText } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting: max 5 registrations per 10 minutes per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${clientIp}`, { limit: 5, windowMs: 600000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many accounts created from this network. Please try again later.",
        },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
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
        { error: passCheck.message || "Password does not meet security requirements" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Students register with open registration as decided in Branch 8
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // Auto-login upon registration
    await createSession(newUser.id);

    await logAudit({
      actorId: newUser.id,
      action: "STUDENT_REGISTRATION",
      entity: "user",
      entityId: newUser.id,
      details: { email: newUser.email },
    });

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register account" },
      { status: 500 }
    );
  }
}
