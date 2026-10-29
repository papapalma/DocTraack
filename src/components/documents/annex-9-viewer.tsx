"use client";

import React from "react";
import { Annex9FormData } from "@/types";
import { Annex9SheetSuite } from "./annex-9-sheet-suite";

interface Annex9ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex9FormData;
  onSaved?: () => void;
}

export function Annex9Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex9ViewerProps) {
  return (
    <Annex9SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
