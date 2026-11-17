"use client";

import React from "react";
import { Annex3FormData } from "@/types";
import { Annex3SheetSuite } from "./annex-3-sheet-suite";
import { AnnexPresetConfig } from "@/types/presets";

interface Annex3ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex3FormData;
  presetId?: string;
  presetConfig?: AnnexPresetConfig;
  onSaved?: () => void;
}

export function Annex3Viewer({
  documentId,
  documentTitle,
  formData,
  presetId,
  presetConfig,
  onSaved,
}: Annex3ViewerProps) {
  return (
    <Annex3SheetSuite
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
