import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getClientIp } from "./rate-limit";

const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "secret",
  "twofactorsecret",
  "twofactorrecoverycodes",
  "recoverycodes",
  "token",
  "kioskpin",
  "pin",
]);

function redactSensitiveDetails(
  obj: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  if (depth > 3) return { _truncated: true };
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      out[key] = redactSensitiveDetails(val as Record<string, unknown>, depth + 1);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export interface AuditParams {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string | null;
  req?: Request;
  details?: Record<string, unknown> | null;
}

function buildAuditCreateInput(
  params: AuditParams
): Prisma.AuditLogUncheckedCreateInput {
  const ip =
    params.ipAddress !== undefined
      ? params.ipAddress
      : params.req
      ? getClientIp(params.req)
      : null;

  return {
    actorId: params.actorId ?? null,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    ipAddress: ip,
    details: params.details
      ? (redactSensitiveDetails(params.details) as Prisma.InputJsonValue)
      : undefined,
  };
}

/**
 * Writes an audit record inside an existing Prisma transaction so critical mutations fail closed.
 */
export async function writeAuditTx(
  tx: Prisma.TransactionClient,
  params: AuditParams
) {
  return tx.auditLog.create({
    data: buildAuditCreateInput(params),
  });
}

export async function logAudit(params: AuditParams) {
  try {
    return await prisma.auditLog.create({
      data: buildAuditCreateInput(params),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
