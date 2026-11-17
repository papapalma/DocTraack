"use client";

import React, { useMemo, useState } from "react";
import {
  Type,
  AlignLeft,
  Calendar,
  CheckSquare,
  Table2,
  Image as ImageIcon,
  Tag,
  Sparkles,
  Search,
  Plus,
  GripVertical,
} from "lucide-react";
import {
  PresetElementType,
  PresetModulesConfig,
} from "@/types/presets";
import { getAvailableBindingVariables } from "@/lib/annex-presets";

export interface PaletteDragPayload {
  type: PresetElementType;
  label: string;
  bindingKey?: string;
  staticText?: string;
  logoSlot?: "left" | "right" | "custom";
}

interface StudioRightPaletteProps {
  annexNumber: number;
  modules: PresetModulesConfig;
  onInsertElement: (payload: PaletteDragPayload) => void;
}

const CORE_BLOCKS: {
  type: PresetElementType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    type: "textbox",
    label: "Editable Textbox",
    description: "Single-line input in workspace & on sheet",
    icon: Type,
    accent: "bg-[#DCEFDD] text-[#1B5E20]",
  },
  {
    type: "textarea",
    label: "Multi-line Paragraph",
    description: "Wrapped notes or certification block",
    icon: AlignLeft,
    accent: "bg-[#DCEFDD] text-[#1B5E20]",
  },
  {
    type: "date",
    label: "Date Field",
    description: "Calendar date input & formatted print",
    icon: Calendar,
    accent: "bg-[#FFF1C2] text-[#B88A00]",
  },
  {
    type: "checkbox",
    label: "Checkbox / Tick",
    description: "Interactive checkmark box",
    icon: CheckSquare,
    accent: "bg-[#FFF1C2] text-[#B88A00]",
  },
  {
    type: "data_table",
    label: "Dynamic Data Table",
    description: "Auto-paginating batch/grantee roster",
    icon: Table2,
    accent: "bg-[#1B5E20] text-white",
  },
  {
    type: "static_text",
    label: "Static Label / Heading",
    description: "Fixed text printed onto the PDF",
    icon: Tag,
    accent: "bg-slate-100 text-[#1F2A24]",
  },
  {
    type: "logo",
    label: "Institutional Logo / Seal",
    description: "Left, Right, or custom uploaded seal",
    icon: ImageIcon,
    accent: "bg-slate-100 text-[#1F2A24]",
  },
];

export function StudioRightPalette({
  annexNumber,
  modules,
  onInsertElement,
}: StudioRightPaletteProps) {
  const [varSearch, setVarSearch] = useState("");

  const availableVars = useMemo(
    () => getAvailableBindingVariables(annexNumber, modules),
    [annexNumber, modules]
  );

  const filteredVars = useMemo(() => {
    const q = varSearch.trim().toLowerCase();
    if (!q) return availableVars;
    return availableVars.filter(
      (v) =>
        v.label.toLowerCase().includes(q) ||
        v.key.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
    );
  }, [availableVars, varSearch]);

  const groupedVars = useMemo(() => {
    const groups = new Map<string, typeof filteredVars>();
    for (const v of filteredVars) {
      const list = groups.get(v.category) || [];
      list.push(v);
      groups.set(v.category, list);
    }
    return Array.from(groups.entries());
  }, [filteredVars]);

  const handleDragStart = (
    e: React.DragEvent<HTMLElement>,
    payload: PaletteDragPayload
  ) => {
    e.dataTransfer.setData("application/x-minsu-preset-element", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="bg-white rounded-2xl border border-[#D6DDD8] apple-shadow flex flex-col overflow-hidden h-full max-h-[calc(100vh-170px)]">
      <div className="px-4 py-3 border-b border-[#D6DDD8] bg-[#F1F8F1]/60 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#123F17] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
            Drag & Drop Elements
          </h2>
          <span className="text-[10px] font-semibold text-[#55645B]">
            Drag or Click +
          </span>
        </div>
        <p className="text-[11px] text-[#55645B] mt-0.5">
          Drop textboxes, tables, or bound fields directly onto the page.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 apple-scrollbar">
        {/* Core Draggable Blocks */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B] px-1">
            Form & PDF Elements
          </p>
          <div className="space-y-1.5">
            {CORE_BLOCKS.map((item) => {
              const Icon = item.icon;
              const payload: PaletteDragPayload = {
                type: item.type,
                label: item.label,
                logoSlot: item.type === "logo" ? "left" : undefined,
                staticText: item.type === "static_text" ? "Official Note" : undefined,
              };
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, payload)}
                  className="group flex items-center gap-2.5 p-2 rounded-xl border border-[#D6DDD8] bg-white hover:border-[#1B5E20] hover:bg-[#F1F8F1]/60 cursor-grab active:cursor-grabbing transition-colors apple-press"
                >
                  <GripVertical className="w-3.5 h-3.5 text-[#55645B]/50 group-hover:text-[#1B5E20] shrink-0" />
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1F2A24] truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[#55645B] truncate">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInsertElement(payload)}
                    title={`Insert ${item.label}`}
                    className="p-1.5 rounded-lg text-[#1B5E20] hover:bg-[#DCEFDD] transition-colors shrink-0 apple-press"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Workspace Variables */}
        <div className="pt-3 border-t border-[#D6DDD8] space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#55645B]">
              Bound Workspace Variables
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DCEFDD] text-[#123F17] font-bold tabular-nums">
              {availableVars.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#55645B]" />
            <input
              type="text"
              placeholder="Filter bound fields..."
              value={varSearch}
              onChange={(e) => setVarSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-[#D6DDD8] bg-[#F6F8F6] focus:outline-none focus:border-[#1B5E20]"
            />
          </div>

          <div className="space-y-3">
            {groupedVars.map(([category, vars]) => (
              <div key={category} className="space-y-1">
                <p className="text-[10px] font-bold text-[#1B5E20] px-1">{category}</p>
                <div className="space-y-1">
                  {vars.map((v) => {
                    const payload: PaletteDragPayload = {
                      type: "bound_field",
                      label: v.label,
                      bindingKey: v.key,
                    };
                    return (
                      <div
                        key={v.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, payload)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#D6DDD8]/80 bg-[#F6F8F6] hover:bg-[#F1F8F1] hover:border-[#1B5E20] cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#1F2A24] truncate">
                            {v.label}
                          </p>
                          <p className="text-[10px] font-mono text-[#55645B] truncate">
                            {`{{${v.key}}}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onInsertElement(payload)}
                          title={`Insert {{${v.key}}}`}
                          className="p-1 rounded text-[#1B5E20] hover:bg-[#DCEFDD] shrink-0 apple-press"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

