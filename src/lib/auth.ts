import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { Role, SessionUser } from "@/types";
import {
  SESSION_COOKIE_NAME,
  SESSION_META_COOKIE_NAME,
  signEdgeSessionMeta,
} from "./edge-session";

export { SESSION_COOKIE_NAME, SESSION_META_COOKIE_NAME };
const SESSION_MAX_AGE_DAYS = 7;

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function getAuthCookieFlags(expiresAt?: Date) {
  const secureCookie =
    process.env.COOKIE_SECURE === "false"
      ? false
      : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax" as const,
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  plainText: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashedPassword);
}

export async function revokeUserSessions(
  userId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<void> {
  await tx.session.deleteMany({
    where: { userId },
  });
}

export async function createSession(
  userId: string,
  knownRole?: Role
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  );

  let resolvedRole = knownRole;
  if (!resolvedRole) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!u) {
      throw new Error("Cannot create session for unknown user");
    }
    resolvedRole = u.role as Role;
  }

  await prisma.session.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  });

  const metaToken = await signEdgeSessionMeta({
    sub: userId,
    role: resolvedRole,
    exp: expiresAt.getTime(),
  });

  const cookieFlags = getAuthCookieFlags(expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieFlags);
  cookieStore.set(SESSION_META_COOKIE_NAME, metaToken, cookieFlags);

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      await prisma.session.deleteMany({
        where: {
          OR: [{ token: tokenHash }, { token }],
        },
      });
    } catch (err) {
      console.error("Failed to revoke session in database:", err);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_META_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  try {
    const session = await prisma.session.findUnique({
      where: { token: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            departmentId: true,
            studentProfile: true,
            twoFactorEnabled: true,
            twoFactorType: true,
            authenticatorLocked: true,
            notifyAnnouncements: true,
            notifyPush: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    if (!session.user.active) {
      await revokeUserSessions(session.user.id).catch(() => {});
      return null;
    }

    return session.user as SessionUser;
  } catch (err) {
    console.error("Error retrieving session:", err);
    return null;
  }
}
