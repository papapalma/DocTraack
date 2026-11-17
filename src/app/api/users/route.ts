import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, revokeUserSessions } from "@/lib/auth";
import { writeAuditTx } from "@/lib/audit";
import { Role } from "@prisma/client";
import {
  isValidEmail,
  validatePassword,
  sanitizeText,
  safeJsonObject,
} from "@/lib/validation";

const VALID_ROLES = new Set<string>(Object.values(Role));

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsedLimit = parseInt(searchParams.get("limit") || "500", 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(1000, Math.max(1, parsedLimit))
      : 500;

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
      take,
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
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string" ||
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Invalid user role specified" },
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
        { error: "A user with this email already exists" },
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

      await writeAuditTx(tx, {
        actorId: currentUser.id,
        action: "USER_CREATED",
        entity: "user",
        entityId: created.id,
        req,
        details: { role: created.role, email: created.email },
      });

      return created;
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
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await safeJsonObject(req);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { id, active, role, password } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (id === currentUser.id && active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own administrative account." },
        { status: 400 }
      );
    }

    if (id === currentUser.id && role !== undefined && role !== currentUser.role) {
      return NextResponse.json(
        { error: "You cannot modify your own administrative role." },
        { status: 400 }
      );
    }

    const existingTarget = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, active: true },
    });
    if (!existingTarget) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: {
      active?: boolean;
      role?: Role;
      passwordHash?: string;
    } = {};

    if (active !== undefined) {
      if (typeof active !== "boolean") {
        return NextResponse.json(
          { error: "active must be a boolean" },
          { status: 400 }
        );
      }
      updateData.active = active;
    }

    if (role !== undefined) {
      if (typeof role !== "string" || !VALID_ROLES.has(role)) {
        return NextResponse.json(
          { error: "Invalid user role specified" },
          { status: 400 }
        );
      }
      updateData.role = role as Role;
    }

    if (password !== undefined) {
      if (typeof password !== "string") {
        return NextResponse.json(
          { error: "Password must be a string" },
          { status: 400 }
        );
      }
      const passCheck = validatePassword(password);
      if (!passCheck.valid) {
        return NextResponse.json(
          {
            error:
              passCheck.message ||
              "Password must be at least 8 characters with letters & numbers.",
          },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const shouldRevokeSessions = Boolean(
      updateData.passwordHash ||
        updateData.role !== undefined ||
        updateData.active === false
    );

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
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

      if (shouldRevokeSessions) {
        await revokeUserSessions(id, tx);
      }

      const actions: string[] = [];
      if (updateData.passwordHash) actions.push("ADMIN_RESET_PASSWORD");
      if (updateData.role !== undefined || updateData.active !== undefined) {
        actions.push("USER_UPDATED");
      }

      await writeAuditTx(tx, {
        actorId: currentUser.id,
        action: updateData.passwordHash ? "ADMIN_RESET_PASSWORD" : "USER_UPDATED",
        entity: "user",
        entityId: id,
        req,
        details: {
          active: updateData.active,
          role: updateData.role,
          passwordReset: Boolean(updateData.passwordHash),
          sessionsRevoked: shouldRevokeSessions,
          combinedActions: actions,
          resetBy: currentUser.email,
        },
      });

      return updated;
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
