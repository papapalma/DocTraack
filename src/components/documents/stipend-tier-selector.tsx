"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, DollarSign } from "lucide-react";

export interface StipendTierSelectorProps {
  selectedTier: "7500" | "10000" | "custom";
  currentAmount: number;
  customInputValue: string;
  onTierChange: (tier: "7500" | "10000" | "custom", amount: number) => void;
  onCustomInputChange: (rawVal: string, numVal: number) => void;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StipendTierSelector({
  selectedTier,
  currentAmount,
  customInputValue,
  onTierChange,
  onCustomInputChange,
  label = "Stipend Rate",
  showIcon = false,
  className = "",
}: StipendTierSelectorProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && (
        <span className="text-[11px] font-bold text-ink-muted flex items-center gap-1.5 uppercase tracking-wider">
          {showIcon && <DollarSign className="w-3.5 h-3.5 text-minsu-green-700" />}
          {label}:
        </span>
      )}

      {/* Apple-style Segmented Pill Control */}
      <div className="inline-flex rounded-xl border border-line bg-page/90 p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => onTierChange("7500", 7500)}
          className={`apple-press px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTier === "7500"
              ? "bg-minsu-green-700 text-white shadow-xs"
              : "text-ink hover:text-minsu-green-800 hover:bg-white/60"
          }`}
          title="Standard statutory TDP stipend rate of ₱7,500.00"
        >
          {selectedTier === "7500" && <Check className="w-3.5 h-3.5 text-white" />}
          ₱7,500
        </button>

        <button
          type="button"
          onClick={() => onTierChange("10000", 10000)}
          className={`apple-press px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTier === "10000"
              ? "bg-minsu-green-700 text-white shadow-xs"
              : "text-ink hover:text-minsu-green-800 hover:bg-white/60"
          }`}
          title="Enhanced TDP stipend rate of ₱10,000.00"
        >
          {selectedTier === "10000" && <Check className="w-3.5 h-3.5 text-white" />}
          ₱10,000
        </button>

        <button
          type="button"
          onClick={() => {
            const num = Number(customInputValue) || currentAmount || 7500;
            onTierChange("custom", num);
          }}
          className={`apple-press px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTier === "custom"
              ? "bg-minsu-green-700 text-white shadow-xs"
              : "text-ink hover:text-minsu-green-800 hover:bg-white/60"
          }`}
          title="Specify a custom grant stipend amount per grantee"
        >
          {selectedTier === "custom" && <Check className="w-3.5 h-3.5 text-white" />}
          Custom
        </button>
      </div>

      {/* Inline Animated Custom Numeric Input */}
      <AnimatePresence>
        {selectedTier === "custom" && (
          <motion.div
            initial={{ opacity: 0, width: 0, scale: 0.95 }}
            animate={{ opacity: 1, width: "auto", scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative flex items-center overflow-hidden"
          >
            <div className="relative w-36">
              <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-ink-muted select-none">
                ₱
              </span>
              <input
                type="number"
                min="1"
                step="100"
                value={customInputValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  const num = Number(raw) || 0;
                  onCustomInputChange(raw, num);
                }}
                placeholder="Enter amount"
                className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-ink rounded-lg border border-minsu-green-700/50 bg-white focus:ring-2 focus:ring-minsu-green-700 focus:border-minsu-green-700 outline-none shadow-2xs"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

