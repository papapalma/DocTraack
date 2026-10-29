"use client";

import React from "react";
import { Annex10FormData } from "@/types";
import { Annex10SheetSuite } from "./annex-10-sheet-suite";

interface Annex10ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex10FormData;
  onSaved?: () => void;
}

export function Annex10Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex10ViewerProps) {
  return (
    <Annex10SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
