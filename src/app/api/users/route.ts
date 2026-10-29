import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Role } from "@prisma/client";
import { isValidEmail, validatePassword, sanitizeText } from "@/lib/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
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

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await logAudit({
      actorId: currentUser.id,
      action: "USER_CREATED",
      entity: "user",
      entityId: newUser.id,
      details: { role: newUser.role, email: newUser.email },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id, active, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Protect against self-deactivation of system admin
    if (id === currentUser.id && active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own administrative account." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (role !== undefined) updateData.role = role as Role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    await logAudit({
      actorId: currentUser.id,
      action: "USER_UPDATED",
      entity: "user",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
