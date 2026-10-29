"use client";

import React from "react";
import { Annex8SheetSuite } from "./annex-8-sheet-suite";

interface Annex8CreatorProps {
  annexTypeId: string;
}

export function Annex8Creator({ annexTypeId }: Annex8CreatorProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 text-white rounded-2xl p-6 apple-shadow border border-minsu-green-800 print:hidden relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-minsu-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-minsu-gold-500/20 text-minsu-gold-400 border border-minsu-gold-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-minsu-gold-400 animate-pulse" />
              Check Disbursement Registry • Cashier & Disbursing Unit
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Prepare Annex 8: Report of Checks Issued (RCI)
            </h1>
            <p className="text-minsu-green-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Maintain the sequential check register for physical checks drawn against Mindoro State University's depository accounts for student stipends (TES) and management fees (ASC), backing up the FUR (Annex 6).
            </p>
          </div>
        </div>
      </div>

      <Annex8SheetSuite mode="create" annexTypeId={annexTypeId} />
    </div>
  );
}
