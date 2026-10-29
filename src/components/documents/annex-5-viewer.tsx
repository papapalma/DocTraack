"use client";

import React from "react";
import { Annex5FormData } from "@/types";
import { Annex5SheetSuite } from "./annex-5-sheet-suite";

interface Annex5ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex5FormData;
  onSaved?: () => void;
}

export function Annex5Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex5ViewerProps) {
  return (
    <Annex5SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
