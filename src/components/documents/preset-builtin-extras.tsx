"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { AnnexPresetConfig } from "@/types/presets";

interface PresetBuiltinExtrasSectionProps {
  presetConfig?: AnnexPresetConfig | null;
  formData: Record<string, unknown>;
  canEdit?: boolean;
  onCustomFieldChange: (fieldKey: string, value: string | boolean) => void;
}

/**
 * Renders interactive inputs in the Built-In Annex workspace ONLY when Staff
 * added extra custom elements onto Preset 1 inside the Annex Preset Studio.
 */
export function PresetBuiltinExtrasSection({
  presetConfig,
  formData,
  canEdit = true,
  onCustomFieldChange,
}: PresetBuiltinExtrasSectionProps) {
  if (!presetConfig?.elements?.length) return null;

  const editableEls = presetConfig.elements.filter(
    (el) =>
      el.type === "textbox" ||
      el.type === "textarea" ||
      el.type === "date" ||
      el.type === "checkbox"
  );

  if (editableEls.length === 0) return null;

  const customFields = (formData.customFields as Record<string, unknown>) || {};

  return (
    <div className="bg-white rounded-xl border border-[#1B5E20]/25 p-4 space-y-3 shadow-xs print:hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#123F17] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
          Additional Preset Overlay Fields ({editableEls.length})
        </h3>
        <span className="text-[10px] text-[#55645B]">
          Printed directly on top of the active sheet
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {editableEls.map((el) => {
          const key = el.fieldKey || el.id;
          const val = customFields[key] ?? el.defaultValue ?? "";

          if (el.type === "checkbox") {
            return (
              <label
                key={el.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#D6DDD8] bg-[#F6F8F6] cursor-pointer"
              >
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(val)}
                  onChange={(e) => onCustomFieldChange(key, e.target.checked)}
                  className="h-4 w-4 accent-[#1B5E20]"
                />
                <span className="text-xs font-semibold text-[#1F2A24]">{el.label}</span>
              </label>
            );
          }

          if (el.type === "textarea") {
            return (
              <div key={el.id} className="sm:col-span-2">
                <label
                  htmlFor={`builtin-cf-${key}`}
                  className="block text-xs font-semibold text-[#1F2A24] mb-1"
                >
                  {el.label}
                </label>
                <textarea
                  id={`builtin-cf-${key}`}
                  rows={2}
                  disabled={!canEdit}
                  value={String(val)}
                  onChange={(e) => onCustomFieldChange(key, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
                />
              </div>
            );
          }

          return (
            <div key={el.id}>
              <label
                htmlFor={`builtin-cf-${key}`}
                className="block text-xs font-semibold text-[#1F2A24] mb-1"
              >
                {el.label}
              </label>
              <input
                id={`builtin-cf-${key}`}
                type={el.type === "date" ? "date" : "text"}
                disabled={!canEdit}
                value={String(val)}
                onChange={(e) => onCustomFieldChange(key, e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] focus:ring-2 focus:ring-[#1B5E20] outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

