"use client";

import React from "react";
import { Annex6SheetSuite } from "./annex-6-sheet-suite";

interface Annex6CreatorProps {
  annexTypeId: string;
}

export function Annex6Creator({ annexTypeId }: Annex6CreatorProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-minsu-green-900 via-minsu-green-800 to-minsu-green-700 text-white rounded-2xl p-6 apple-shadow border border-minsu-green-800 print:hidden relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-minsu-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-minsu-gold-500/20 text-minsu-gold-400 border border-minsu-gold-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-minsu-gold-400 animate-pulse" />
              Official Financial FUR Suite • Accounting & Disbursement Ledger
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Prepare Annex 6: Fund Utilization Report (FUR)
            </h1>
            <p className="text-minsu-green-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Record TDP funds received against check references, account for verified student stipend releases and management fee line-item disbursements, and report the certified unutilized balance to COA.
            </p>
          </div>
        </div>
      </div>

      <Annex6SheetSuite mode="create" annexTypeId={annexTypeId} />
    </div>
  );
}
