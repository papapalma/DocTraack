import { prisma } from "./prisma";

export async function logAudit(params: {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown> | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details ? (params.details as any) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
