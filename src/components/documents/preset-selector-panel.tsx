"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  Star,
  FileText,
  Sparkles,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { AnnexPresetRecord } from "@/types/presets";
import { Role } from "@/types";
import { canManageAnnexPresets } from "@/lib/rbac";

interface PresetSelectorPanelProps {
  annexNumber: number;
  presets: AnnexPresetRecord[];
  selectedPresetId: string;
  onSelectPreset: (preset: AnnexPresetRecord) => void;
  loading?: boolean;
  userRole?: Role;
  compact?: boolean;
}

export function PresetSelectorPanel({
  annexNumber,
  presets,
  selectedPresetId,
  onSelectPreset,
  loading = false,
  userRole,
  compact = false,
}: PresetSelectorPanelProps) {
  const canEditPresets = userRole ? canManageAnnexPresets(userRole) : false;

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] flex items-center gap-2 text-xs text-[#55645B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#1B5E20]" />
        Loading available presets for Annex {annexNumber}...
      </div>
    );
  }

  if (presets.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-[#D6DDD8] bg-white ${
        compact ? "p-3.5" : "p-4 sm:p-5"
      } space-y-3 apple-shadow`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-heading font-bold text-[#1F2A24]">
              Choose Template Preset — Annex {annexNumber}
            </h3>
            <p className="text-[11px] text-[#55645B]">
              Select which saved template & retained defaults to load into the Interactive Workspace.
            </p>
          </div>
        </div>

        {canEditPresets && (
          <Link
            href={`/annex-presets?annex=${annexNumber}${
              selectedPresetId ? `&presetId=${selectedPresetId}` : ""
            }`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1B5E20]/30 bg-[#F1F8F1] hover:bg-[#DCEFDD] text-[11px] font-semibold text-[#1B5E20] transition-colors apple-press"
          >
            <ExternalLink className="w-3 h-3" />
            Manage in Preset Studio
          </Link>
        )}
      </div>

      <div
        className={`grid gap-2.5 ${
          compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          const isCustom = preset.kind === "CUSTOM_UPLOAD";
          const pagesCount = preset.config?.pages?.length ?? 1;
          const elementsCount = preset.config?.elements?.length ?? 0;
          const settings = preset.config?.settings;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all apple-press flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-[#1B5E20] bg-[#F1F8F1] ring-2 ring-[#1B5E20]/20 shadow-xs"
                  : "border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-white hover:border-[#1B5E20]/50"
              }`}
            >
              <div className="space-y-1.5 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${
                        isCustom
                          ? "bg-[#FFF1C2] text-[#B88A00]"
                          : "bg-[#DCEFDD] text-[#123F17]"
                      }`}
                    >
                      {isCustom ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          Custom PDF/Img
                        </>
                      ) : (
                        <>
                          <FileText className="w-2.5 h-2.5" />
                          Built-In
                        </>
                      )}
                    </span>

                    {preset.isDefault && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-[#F9C733]/60 text-[#B88A00] inline-flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-[#F2B705]" />
                        Default
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#1F2A24] line-clamp-1">
                  {preset.name}
                </p>

                {preset.description && (
                  <p className="text-[11px] text-[#55645B] line-clamp-2">
                    {preset.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#D6DDD8]/70 flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#55645B]">
                <span className="font-medium text-[#1F2A24]">
                  {settings?.campus || "MinSU"} • AY {settings?.academicYear || "2026-2027"}
                </span>
                <span className="font-mono">
                  {pagesCount}p{elementsCount > 0 ? ` • ${elementsCount} fields` : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

