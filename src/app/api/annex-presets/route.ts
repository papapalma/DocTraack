import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAnnexPresets, canSelectAnnexPreset } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  buildDefaultPreset1Config,
  buildEmptyCustomPresetConfig,
  isPresetSupportedAnnex,
} from "@/lib/annex-presets";
import { ensureDefaultPresetsSeeded } from "@/lib/annex-presets-server";
import { AnnexPresetKind, Prisma } from "@prisma/client";
import { AnnexPresetConfig } from "@/types/presets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STAFF" && user.role !== "ACCOUNTING") {
      return NextResponse.json(
        { error: "Access denied. Only Staff and Accounting Officers can inspect annex presets." },
        { status: 403 }
      );
    }

    await ensureDefaultPresetsSeeded(user.role === "STAFF" ? user.id : undefined);

    const { searchParams } = new URL(req.url);
    const annexNumberParam = searchParams.get("annexNumber");
    const includeInactive =
      searchParams.get("includeInactive") === "true" && canManageAnnexPresets(user.role);

    const whereClause: Prisma.AnnexPresetWhereInput = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (annexNumberParam) {
      const annexNumber = parseInt(annexNumberParam, 10);
      if (!isPresetSupportedAnnex(annexNumber)) {
        return NextResponse.json(
          { error: `Annex ${annexNumberParam} does not use presets.` },
          { status: 400 }
        );
      }
      if (!canSelectAnnexPreset(user.role, annexNumber)) {
        return NextResponse.json(
          { error: `Role ${user.role} is not permitted to access Annex ${annexNumber} presets.` },
          { status: 403 }
        );
      }
      whereClause.annexType = { number: annexNumber };
    } else if (user.role === "ACCOUNTING") {
      whereClause.annexType = { number: { in: [6, 7, 8, 9] } };
    } else {
      whereClause.annexType = { number: { in: [1, 3, 4, 5, 6, 7, 8, 9, 10] } };
    }

    const presets = await prisma.annexPreset.findMany({
      where: whereClause,
      include: {
        annexType: {
          select: { id: true, number: true, name: true, creatorRoles: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: [
        { annexType: { number: "asc" } },
        { isDefault: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ presets });
  } catch (error) {
    console.error("Fetch annex presets error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve annex presets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnexPresets(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff Coordinators can create or manage annex presets." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      annexNumber,
      name,
      description,
      kind,
      isDefault,
      cloneFromId,
      config,
    } = body as {
      annexNumber?: number;
      name?: string;
      description?: string;
      kind?: AnnexPresetKind;
      isDefault?: boolean;
      cloneFromId?: string;
      config?: AnnexPresetConfig;
    };

    const parsedNumber = Number(annexNumber);
    if (!isPresetSupportedAnnex(parsedNumber)) {
      return NextResponse.json(
        { error: "Valid Annex number (1, 3–10) is required." },
        { status: 400 }
      );
    }

    const annexType = await prisma.annexType.findUnique({
      where: { number: parsedNumber },
    });

    if (!annexType) {
      return NextResponse.json({ error: "Annex type not found." }, { status: 404 });
    }

    await ensureDefaultPresetsSeeded(user.id);

    const existingCount = await prisma.annexPreset.count({
      where: { annexTypeId: annexType.id },
    });

    let resolvedKind: AnnexPresetKind =
      kind === "BUILT_IN" ? AnnexPresetKind.BUILT_IN : AnnexPresetKind.CUSTOM_UPLOAD;
    let resolvedConfig: AnnexPresetConfig =
      resolvedKind === "BUILT_IN"
        ? buildDefaultPreset1Config(parsedNumber)
        : buildEmptyCustomPresetConfig(parsedNumber);

    if (cloneFromId) {
      const source = await prisma.annexPreset.findUnique({
        where: { id: cloneFromId },
      });
      if (!source || source.annexTypeId !== annexType.id) {
        return NextResponse.json(
          { error: "Source preset for cloning was not found for this Annex." },
          { status: 404 }
        );
      }
      resolvedKind = source.kind;
      resolvedConfig = JSON.parse(JSON.stringify(source.config)) as AnnexPresetConfig;
    } else if (config) {
      resolvedConfig = config;
    }

    const trimmedName =
      (name || "").trim() || `Preset ${existingCount + 1} — Custom Annex ${parsedNumber}`;

    const preset = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.annexPreset.updateMany({
          where: { annexTypeId: annexType.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.annexPreset.create({
        data: {
          annexTypeId: annexType.id,
          name: trimmedName,
          description: description?.trim() || null,
          kind: resolvedKind,
          isDefault: Boolean(isDefault),
          isActive: true,
          sortOrder: existingCount + 1,
          config: resolvedConfig as unknown as Prisma.InputJsonValue,
          createdById: user.id,
          updatedById: user.id,
        },
        include: {
          annexType: {
            select: { id: true, number: true, name: true, creatorRoles: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          updatedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: {
            select: { documents: true },
          },
        },
      });
    });

    await logAudit({
      actorId: user.id,
      action: cloneFromId ? "PRESET_CLONED" : "PRESET_CREATED",
      entity: "annex_preset",
      entityId: preset.id,
      details: {
        annexNumber: parsedNumber,
        name: preset.name,
        kind: preset.kind,
        isDefault: preset.isDefault,
        clonedFromId: cloneFromId || null,
      },
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error("Create annex preset error:", error);
    return NextResponse.json(
      { error: "Failed to create annex preset" },
      { status: 500 }
    );
  }
}

