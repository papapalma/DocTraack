"use client";

import React from "react";
import { Annex6FormData } from "@/types";
import { Annex6SheetSuite } from "./annex-6-sheet-suite";

interface Annex6ViewerProps {
  documentId: string;
  documentTitle: string;
  formData: Annex6FormData;
  onSaved?: () => void;
}

export function Annex6Viewer({
  documentId,
  documentTitle,
  formData,
  onSaved,
}: Annex6ViewerProps) {
  return (
    <Annex6SheetSuite
      mode="view"
      documentId={documentId}
      documentTitle={documentTitle}
      initialData={formData}
      onSaved={onSaved}
    />
  );
}
