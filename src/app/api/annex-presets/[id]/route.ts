import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageAnnexPresets, canSelectAnnexPreset } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { AnnexPresetKind, Prisma } from "@prisma/client";
import { AnnexPresetConfig } from "@/types/presets";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const preset = await prisma.annexPreset.findUnique({
      where: { id },
      include: {
        annexType: {
          select: { id: true, number: true, name: true, creatorRoles: true },
        },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        updatedBy: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { documents: true } },
      },
    });

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    if (!canSelectAnnexPreset(user.role, preset.annexType.number)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Get annex preset error:", error);
    return NextResponse.json({ error: "Failed to load preset" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnexPresets(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff Coordinators can modify annex presets." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.annexPreset.findUnique({
      where: { id },
      include: { annexType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      isDefault,
      isActive,
      config,
    } = body as {
      name?: string;
      description?: string | null;
      isDefault?: boolean;
      isActive?: boolean;
      config?: AnnexPresetConfig;
    };

    const nextName = name !== undefined ? name.trim() : existing.name;
    if (!nextName) {
      return NextResponse.json({ error: "Preset name cannot be empty." }, { status: 400 });
    }

    // Prevent disabling the only active preset for an Annex
    if (isActive === false && existing.isActive) {
      const otherActiveCount = await prisma.annexPreset.count({
        where: {
          annexTypeId: existing.annexTypeId,
          isActive: true,
          id: { not: existing.id },
        },
      });
      if (otherActiveCount === 0) {
        return NextResponse.json(
          { error: "Cannot deactivate the last remaining active preset for this Annex." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.annexPreset.updateMany({
          where: { annexTypeId: existing.annexTypeId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const resolvedKind =
        config?.kind === "CUSTOM_UPLOAD"
          ? AnnexPresetKind.CUSTOM_UPLOAD
          : config?.kind === "BUILT_IN"
          ? AnnexPresetKind.BUILT_IN
          : existing.kind;

      return tx.annexPreset.update({
        where: { id },
        data: {
          name: nextName,
          description: description !== undefined ? description?.trim() || null : existing.description,
          kind: resolvedKind,
          isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          config: (config ?? existing.config) as unknown as Prisma.InputJsonValue,
          updatedById: user.id,
        },
        include: {
          annexType: {
            select: { id: true, number: true, name: true, creatorRoles: true },
          },
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          updatedBy: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { documents: true } },
        },
      });
    });

    const isOnlyRename =
      name !== undefined &&
      nextName !== existing.name &&
      config === undefined &&
      isDefault === undefined;

    const action = isOnlyRename
      ? "PRESET_RENAMED"
      : isDefault === true && !existing.isDefault
      ? "PRESET_DEFAULT_SET"
      : "PRESET_UPDATED";

    await logAudit({
      actorId: user.id,
      action,
      entity: "annex_preset",
      entityId: updated.id,
      details: {
        annexNumber: existing.annexType.number,
        previousName: existing.name,
        newName: updated.name,
        isDefault: updated.isDefault,
        isActive: updated.isActive,
        elementCount: config?.elements?.length ?? undefined,
        pageCount: config?.pages?.length ?? undefined,
      },
    });

    return NextResponse.json({ preset: updated });
  } catch (error) {
    console.error("Update annex preset error:", error);
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageAnnexPresets(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only TDP Staff Coordinators can delete annex presets." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.annexPreset.findUnique({
      where: { id },
      include: { annexType: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const remainingActive = await prisma.annexPreset.findMany({
      where: {
        annexTypeId: existing.annexTypeId,
        id: { not: existing.id },
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    });

    if (remainingActive.length === 0) {
      return NextResponse.json(
        { error: "Each Annex must keep at least one active preset." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (existing.isDefault && remainingActive[0]) {
        await tx.annexPreset.update({
          where: { id: remainingActive[0].id },
          data: { isDefault: true },
        });
      }
      await tx.annexPreset.delete({ where: { id } });
    });

    await logAudit({
      actorId: user.id,
      action: "PRESET_DELETED",
      entity: "annex_preset",
      entityId: id,
      details: {
        annexNumber: existing.annexType.number,
        deletedName: existing.name,
        kind: existing.kind,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete annex preset error:", error);
    return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
  }
}

