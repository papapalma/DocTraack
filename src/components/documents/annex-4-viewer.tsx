"use client";

import React from "react";
import { Annex4FormData } from "@/types";
import { Annex4SheetSuite } from "./annex-4-sheet-suite";
import { AnnexPresetConfig } from "@/types/presets";

interface Annex4ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex4FormData;
  presetId?: string;
  presetConfig?: AnnexPresetConfig;
  onSaved?: () => void;
}

export function Annex4Viewer({
  documentId,
  documentTitle,
  formData,
  presetId,
  presetConfig,
  onSaved,
}: Annex4ViewerProps) {
  return (
    <Annex4SheetSuite
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
