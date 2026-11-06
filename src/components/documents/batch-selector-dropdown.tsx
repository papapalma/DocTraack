"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Layers, Check, ChevronDown, AlertCircle, X, Sparkles, Users } from "lucide-react";
import { BatchItem } from "@/app/api/batches/route";

export interface BatchSelectorDropdownProps {
  selectedBatches: number[];
  onBatchesChange: (batches: number[]) => void;
  alreadyInjectedBatches?: (number | string)[];
  onInject?: (batchesToInject: number[]) => void;
  maxBatches?: number;
  className?: string;
  allowDirectAction?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const FALLBACK_BATCHES: BatchItem[] = [
  { batchNumber: 1, label: "Batch 1", callTitle: "TDP Intake Cohort (Batch 1)", totalApplications: 35, acceptedCount: 35, isActive: true },
  { batchNumber: 2, label: "Batch 2", callTitle: "TDP Intake Cohort (Batch 2)", totalApplications: 350, acceptedCount: 350, isActive: true },
  { batchNumber: 3, label: "Batch 3", callTitle: "TDP Intake Cohort (Batch 3)", totalApplications: 1000, acceptedCount: 1000, isActive: true },
];

export function BatchSelectorDropdown({
  selectedBatches,
  onBatchesChange,
  alreadyInjectedBatches = [],
  onInject,
  maxBatches = 3,
  className = "",
  allowDirectAction = false,
  disabled = false,
  placeholder = "Select Batch(es)",
}: BatchSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<BatchItem[]>(FALLBACK_BATCHES);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionAlert, setRejectionAlert] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize alreadyInjectedBatches into string array for robust comparison
  const normalizedInjected = useMemo(() => {
    return alreadyInjectedBatches.map((b) => String(b).trim());
  }, [alreadyInjectedBatches]);

  // Load available batches from API with resilient abort and fallback handling
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchBatches() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/batches", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.batches) && data.batches.length > 0) {
            setAvailableBatches(data.batches);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // Retain fallback batches gracefully during dev server restart or offline state
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBatches();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle a single batch
  const handleToggleBatch = (batchNumber: number) => {
    setRejectionAlert(null);
    const bStr = String(batchNumber);

    // If already injected in document, show immediate alert
    if (normalizedInjected.includes(bStr)) {
      setRejectionAlert(`Batch ${batchNumber} has already been injected into this document.`);
      return;
    }

    if (selectedBatches.includes(batchNumber)) {
      onBatchesChange(selectedBatches.filter((b) => b !== batchNumber));
    } else {
      if (selectedBatches.length >= maxBatches) {
        setRejectionAlert(`You can select at most ${maxBatches} batches to combine at one time.`);
        return;
      }
      const updated = [...selectedBatches, batchNumber].sort((a, b) => a - b);
      onBatchesChange(updated);
    }
  };

  const handleRemoveChip = (e: React.MouseEvent, batchNumber: number) => {
    e.stopPropagation();
    onBatchesChange(selectedBatches.filter((b) => b !== batchNumber));
  };

  const handleInjectClick = () => {
    if (selectedBatches.length === 0) return;

    // Double check if any selected batch was already injected
    const alreadyPresent = selectedBatches.filter((b) => normalizedInjected.includes(String(b)));
    if (alreadyPresent.length > 0) {
      setRejectionAlert(`Batch ${alreadyPresent.join(", ")} has already been injected into this document.`);
      return;
    }

    if (onInject) {
      onInject(selectedBatches);
      setIsOpen(false);
    }
  };

  // Compute total accepted scholars for currently selected batches
  const selectedGranteesTotal = useMemo(() => {
    return availableBatches
      .filter((b) => selectedBatches.includes(b.batchNumber))
      .reduce((acc, curr) => acc + curr.acceptedCount, 0);
  }, [availableBatches, selectedBatches]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setRejectionAlert(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (!disabled && e.target === e.currentTarget) {
              e.preventDefault();
              setIsOpen(!isOpen);
              setRejectionAlert(null);
            }
          }
        }}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all apple-press select-none outline-none ${
          isOpen
            ? "border-minsu-green-700 ring-2 ring-minsu-green-700/20 bg-white"
            : "border-line bg-page/50 hover:bg-white hover:border-minsu-green-600/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Layers className="w-4 h-4 text-minsu-green-700 shrink-0" />
          {selectedBatches.length === 0 ? (
            <span className="text-xs text-ink-muted font-medium">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedBatches.map((b) => {
                const bInfo = availableBatches.find((item) => item.batchNumber === b);
                return (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-minsu-green-100 text-minsu-green-900 border border-minsu-green-700/20 shadow-2xs"
                  >
                    <span>Batch {b}</span>
                    {bInfo && (
                      <span className="text-[10px] text-minsu-green-700 font-normal">
                        ({bInfo.acceptedCount})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveChip(e, b)}
                      className="hover:text-red-600 rounded-full p-0.5 transition-colors"
                      title={`Remove Batch ${b}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedBatches.length > 0 && (
            <span className="text-[11px] font-semibold text-minsu-gold-600 bg-minsu-gold-100 px-2 py-0.5 rounded-md">
              {selectedBatches.length} of {maxBatches} selected
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-ink-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-minsu-green-700" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 p-3 bg-white/95 backdrop-blur-xl rounded-2xl border border-line apple-shadow text-ink space-y-3"
          style={{
            animation: "fadeScaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Header Info */}
          <div className="flex items-center justify-between pb-2 border-b border-line text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-minsu-green-900 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-minsu-gold-500" />
              <span>Select TDP Intake Batches (1 to {maxBatches})</span>
            </div>
            {selectedBatches.length > 0 && (
              <button
                type="button"
                onClick={() => onBatchesChange([])}
                className="text-[11px] text-red-600 hover:underline font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Re-injection / Validation Alert Banner */}
          {rejectionAlert && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-minsu-gold-500/40 text-xs font-medium text-amber-900 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-minsu-gold-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{rejectionAlert}</div>
              <button
                type="button"
                onClick={() => setRejectionAlert(null)}
                className="text-amber-800 hover:text-amber-950"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Batches List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto apple-scrollbar">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-ink-muted">Loading available batches...</div>
            ) : availableBatches.length === 0 ? (
              <div className="py-4 text-center text-xs text-ink-muted">No active batches detected.</div>
            ) : (
              availableBatches.map((item) => {
                const isSelected = selectedBatches.includes(item.batchNumber);
                const isAlreadyInjected = normalizedInjected.includes(String(item.batchNumber));

                return (
                  <div
                    key={item.batchNumber}
                    onClick={() => handleToggleBatch(item.batchNumber)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all apple-press cursor-pointer ${
                      isAlreadyInjected
                        ? "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100"
                        : isSelected
                        ? "bg-minsu-green-50 border-minsu-green-700/40 ring-1 ring-minsu-green-700/20"
                        : "bg-white border-line hover:border-minsu-green-600/30 hover:bg-page/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-minsu-green-700 border-minsu-green-700 text-white"
                            : "border-line bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-ink">{item.label}</span>
                          {isAlreadyInjected ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Already Injected
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-minsu-green-100 text-minsu-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted truncate max-w-xs">{item.callTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      <Users className="w-3 h-3 text-minsu-green-700" />
                      <span className="font-bold text-xs font-mono text-minsu-green-900">
                        {item.acceptedCount}
                      </span>
                      <span className="text-[10px] text-ink-muted">scholars</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Footer if allowDirectAction is true */}
          {allowDirectAction && onInject && (
            <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
              <span className="text-xs text-ink-muted font-medium">
                {selectedBatches.length > 0 ? (
                  <span>
                    Total: <strong className="text-minsu-green-900 font-bold">{selectedGranteesTotal}</strong> scholars
                  </span>
                ) : (
                  <span>Choose batches above</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleInjectClick}
                disabled={selectedBatches.length === 0}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all apple-press ${
                  selectedBatches.length > 0
                    ? "bg-minsu-green-700 hover:bg-minsu-green-600 shadow-sm"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Inject Selected ({selectedBatches.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

