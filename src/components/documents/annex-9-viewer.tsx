"use client";

import React from "react";
import { Annex9FormData } from "@/types";
import { Annex9SheetSuite } from "./annex-9-sheet-suite";
import { AnnexPresetConfig } from "@/types/presets";

interface Annex9ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex9FormData;
  presetId?: string;
  presetConfig?: AnnexPresetConfig;
  onSaved?: () => void;
}

export function Annex9Viewer({
  documentId,
  documentTitle,
  formData,
  presetId,
  presetConfig,
  onSaved,
}: Annex9ViewerProps) {
  return (
    <Annex9SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      presetId={presetId}
      presetConfig={presetConfig}
      onSaved={onSaved}
    />
  );
}
