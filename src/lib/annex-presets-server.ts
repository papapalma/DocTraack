import { prisma } from "@/lib/prisma";
import { AnnexPresetKind, Prisma, Role } from "@prisma/client";
import {
  buildDefaultPreset1Config,
  PRESET_SUPPORTED_ANNEX_NUMBERS,
} from "./annex-presets";
import { AnnexPresetConfig } from "@/types/presets";

/**
 * Ensures every document-generating Annex (1, 3–10) has at least Preset 1 seeded.
 * Safe and idempotent for existing databases without needing a full DB reset.
 */
export async function ensureDefaultPresetsSeeded(preferredActorId?: string): Promise<void> {
  const annexTypes = await prisma.annexType.findMany({
    where: {
      number: { in: [...PRESET_SUPPORTED_ANNEX_NUMBERS] },
    },
    include: {
      presets: {
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { number: "asc" },
  });

  const missing = annexTypes.filter((a) => a.presets.length === 0);
  if (missing.length === 0) return;

  let creatorId = preferredActorId;
  if (!creatorId) {
    const staffUser = await prisma.user.findFirst({
      where: { role: Role.STAFF, active: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (staffUser) {
      creatorId = staffUser.id;
    } else {
      const anyUser = await prisma.user.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      creatorId = anyUser?.id;
    }
  }

  if (!creatorId) return;

  for (const annex of missing) {
    const config = buildDefaultPreset1Config(annex.number);
    await prisma.annexPreset.create({
      data: {
        annexTypeId: annex.id,
        name: `Preset 1 — Official Annex ${annex.number} Standard`,
        description: `Built-in official CHED/UniFAST ${annex.name} template and interactive workspace.`,
        kind: AnnexPresetKind.BUILT_IN,
        isDefault: true,
        isActive: true,
        sortOrder: 1,
        config: config as unknown as Prisma.InputJsonValue,
        createdById: creatorId,
        updatedById: creatorId,
      },
    });
  }
}

export async function resolveAnnexPresetForDocument(
  annexTypeId: string,
  annexNumber: number,
  requestedPresetId?: string | null
): Promise<{
  presetId: string | null;
  presetName: string;
  presetConfig: AnnexPresetConfig;
}> {
  await ensureDefaultPresetsSeeded();

  if (requestedPresetId) {
    const requested = await prisma.annexPreset.findFirst({
      where: {
        id: requestedPresetId,
        annexTypeId,
        isActive: true,
      },
    });
    if (requested) {
      return {
        presetId: requested.id,
        presetName: requested.name,
        presetConfig: requested.config as unknown as AnnexPresetConfig,
      };
    }
  }

  const fallback = await prisma.annexPreset.findFirst({
    where: {
      annexTypeId,
      isActive: true,
    },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (fallback) {
    return {
      presetId: fallback.id,
      presetName: fallback.name,
      presetConfig: fallback.config as unknown as AnnexPresetConfig,
    };
  }

  return {
    presetId: null,
    presetName: `Preset 1 — Official Annex ${annexNumber} Standard`,
    presetConfig: buildDefaultPreset1Config(annexNumber),
  };
}

