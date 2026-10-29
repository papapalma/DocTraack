"use client";

import React from "react";
import { Annex4SheetSuite } from "./annex-4-sheet-suite";

interface Annex4CreatorProps {
  annexTypeId: string;
}

export function Annex4Creator({ annexTypeId }: Annex4CreatorProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 text-white rounded-2xl p-6 apple-shadow border border-minsu-green-800 print:hidden relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-minsu-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-minsu-gold-500/20 text-minsu-gold-400 border border-minsu-gold-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-minsu-gold-400 animate-pulse" />
              Official New TDP 3-Tab Suite • Batch Billing Package
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Prepare Annex 4: Consolidated New TDP Billing Statement
            </h1>
            <p className="text-minsu-green-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Compile new TDP grantees per campus, calculate the ₱7,500 stipend and 0.5% administrative support fee, and generate official CHED Form 1, Form 2, and Form 3 documents.
            </p>
          </div>
        </div>
      </div>

      <Annex4SheetSuite mode="create" annexTypeId={annexTypeId} />
    </div>
  );
}
