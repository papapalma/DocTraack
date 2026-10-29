"use client";

import React from "react";
import { Annex4FormData } from "@/types";
import { Annex4SheetSuite } from "./annex-4-sheet-suite";

interface Annex4ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex4FormData;
  onSaved?: () => void;
}

export function Annex4Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex4ViewerProps) {
  return (
    <Annex4SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
