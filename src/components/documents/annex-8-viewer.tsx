"use client";

import React from "react";
import { Annex8FormData } from "@/types";
import { Annex8SheetSuite } from "./annex-8-sheet-suite";

interface Annex8ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex8FormData;
  onSaved?: () => void;
}

export function Annex8Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex8ViewerProps) {
  return (
    <Annex8SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
