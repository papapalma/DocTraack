"use client";

import React from "react";
import { Annex7FormData } from "@/types";
import { Annex7SheetSuite } from "./annex-7-sheet-suite";

interface Annex7ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex7FormData;
  onSaved?: () => void;
}

export function Annex7Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex7ViewerProps) {
  return (
    <Annex7SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
