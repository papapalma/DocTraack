"use client";

import React from "react";
import { Annex7FormData } from "@/types";
import { Annex7SheetSuite } from "./annex-7-sheet-suite";
import { AnnexPresetConfig } from "@/types/presets";

interface Annex7ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex7FormData;
  presetId?: string;
  presetConfig?: AnnexPresetConfig;
  onSaved?: () => void;
}

export function Annex7Viewer({
  documentId,
  documentTitle,
  formData,
  presetId,
  presetConfig,
  onSaved,
}: Annex7ViewerProps) {
  return (
    <Annex7SheetSuite
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
