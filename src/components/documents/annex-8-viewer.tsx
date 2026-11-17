"use client";

import React from "react";
import { Annex8FormData } from "@/types";
import { Annex8SheetSuite } from "./annex-8-sheet-suite";
import { AnnexPresetConfig } from "@/types/presets";

interface Annex8ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex8FormData;
  presetId?: string;
  presetConfig?: AnnexPresetConfig;
  onSaved?: () => void;
}

export function Annex8Viewer({
  documentId,
  documentTitle,
  formData,
  presetId,
  presetConfig,
  onSaved,
}: Annex8ViewerProps) {
  return (
    <Annex8SheetSuite
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
