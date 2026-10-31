# UI/UX Resilience States Catalog & Code Recipes

This companion catalog provides production-ready code patterns, design tokens, copy guidelines, and simulation steps for the **10 Critical UI States**.

All code snippets follow the **MinSU DocTrack Design System** (`minsu-green-700`, `minsu-gold-500`, Inter/Montserrat typography, Apple tactile motion, and strict TypeScript).

---

## 1. Empty State Recipe

```tsx
import React from "react";
import { FolderOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-line bg-surface/50 my-6">
      <div className="w-14 h-14 rounded-2xl bg-minsu-green-50 border border-minsu-green-100 flex items-center justify-center text-minsu-green-700 mb-4 apple-shadow">
        <FolderOpen className="w-7 h-7" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted max-w-md mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-medium text-sm apple-press apple-shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}

      {secondaryAction && <div className="mt-3">{secondaryAction}</div>}
    </div>
  );
}
```

---

## 2. Skeleton Loading Recipe (Table & Card)

```tsx
import React from "react";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-2xl border border-line bg-surface overflow-hidden apple-shadow">
      {/* Table Header Skeleton */}
      <div className="bg-neutral-50/80 px-6 py-3.5 border-b border-line flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-neutral-200/80 rounded animate-pulse" style={{ width: `${100 / cols}%` }} />
        ))}
      </div>
      
      {/* Table Rows Skeleton */}
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-neutral-100 rounded animate-pulse"
                style={{
                  width: c === 0 ? "35%" : `${80 / cols}%`,
                  opacity: 1 - r * 0.12,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. 3-Part Error State Recipe

```tsx
import React from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  whatWentWrong: string;
  whoseFaultOrContext: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function ErrorState({
  whatWentWrong,
  whoseFaultOrContext,
  onRetry,
  onGoBack,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 sm:p-8 text-center max-w-lg mx-auto my-8 apple-shadow">
      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>

      {/* Part 1: What went wrong */}
      <h3 className="font-heading font-semibold text-lg text-red-950 mb-1">
        {whatWentWrong}
      </h3>

      {/* Part 2: Context / Whose fault (calm, non-punitive) */}
      <p className="text-sm text-red-800/80 mb-6 leading-relaxed">
        {whoseFaultOrContext}
      </p>

      {/* Part 3: How to fix it */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm apple-press transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-ink-muted border border-line font-medium text-sm apple-press transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Previous Screen</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 4. No Internet / Offline Indicator Recipe

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-50 bg-neutral-900 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-minsu-gold-400 shrink-0" />
        <span>
          <strong>No Internet Connection.</strong> Showing cached content. You can continue reviewing documents; edits will sync when reconnected.
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="ml-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}
```

---

## 5. Slow Network / Progressive Loader Recipe

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Clock, XCircle } from "lucide-react";

export function useSlowNetworkNotice(isLoading: boolean, thresholdMs = 3500) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), thresholdMs);
    return () => clearTimeout(timer);
  }, [isLoading, thresholdMs]);

  return isSlow;
}

export function SlowLoadingNotice({ onCancel }: { onCancel?: () => void }) {
  return (
    <div className="rounded-xl border border-minsu-gold-400/40 bg-minsu-gold-100/60 p-4 flex items-center justify-between text-xs sm:text-sm text-ink max-w-md mx-auto my-3 animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-minsu-gold-600 animate-spin" />
        <span>Taking longer than expected... High server traffic or slow network.</span>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-ink-muted hover:text-ink font-medium underline ml-2 text-xs"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
```

---

## 6. Zero Search Results Recipe

```tsx
import React from "react";
import { SearchX, RotateCcw } from "lucide-react";

interface NoSearchResultsProps {
  query: string;
  suggestedCorrection?: string;
  onSelectSuggestion?: (suggestion: string) => void;
  onClearFilters: () => void;
}

export function NoSearchResults({
  query,
  suggestedCorrection,
  onSelectSuggestion,
  onClearFilters,
}: NoSearchResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-6">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-ink-muted mb-3">
        <SearchX className="w-6 h-6" />
      </div>
      <h4 className="font-heading font-semibold text-ink text-base mb-1">
        No matches found for &ldquo;{query}&rdquo;
      </h4>

      {suggestedCorrection && onSelectSuggestion ? (
        <p className="text-sm text-ink-muted mb-4">
          Did you mean{" "}
          <button
            onClick={() => onSelectSuggestion(suggestedCorrection)}
            className="text-minsu-green-700 font-semibold underline underline-offset-2 hover:text-minsu-green-600"
          >
            {suggestedCorrection}
          </button>
          ?
        </p>
      ) : (
        <p className="text-sm text-ink-muted max-w-sm mb-4">
          Check for spelling mistakes, broaden search terms, or remove active filter criteria.
        </p>
      )}

      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-neutral-50 text-ink font-medium text-xs sm:text-sm apple-press transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Clear Search & Filters</span>
      </button>
    </div>
  );
}
```

---

## 7. Permission Denied Recipe

```tsx
import React from "react";
import { ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";

export function PermissionDeniedView({
  requiredRole = "Campus Director",
  actionName = "approve this document transmittal",
  onGoBack,
}: {
  requiredRole?: string;
  actionName?: string;
  onGoBack?: () => void;
}) {
  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-neutral-200 bg-surface text-center apple-shadow">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h2 className="font-heading font-bold text-xl text-ink mb-2">Access Restricted</h2>
      <p className="text-sm text-ink-muted leading-relaxed mb-6">
        You do not have the required permissions to {actionName}. This action is restricted to accounts with the <strong className="text-ink font-semibold">{requiredRole}</strong> role.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface hover:bg-neutral-50 text-ink font-medium text-sm apple-press transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Safety</span>
          </button>
        )}
        <a
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-medium text-sm apple-press transition-colors shadow-sm"
        >
          <KeyRound className="w-4 h-4" />
          <span>Dashboard</span>
        </a>
      </div>
    </div>
  );
}
```

---

## 8. Session Expired & Draft Preservation Recipe

```tsx
"use client";

import React, { useEffect } from "react";
import { Lock, Save } from "lucide-react";

export function useDraftAutoSave<T>(storageKey: string, data: T, isDirty: boolean) {
  // Auto-save active draft to localStorage before unload or session loss
  useEffect(() => {
    if (!isDirty) return;
    try {
      localStorage.setItem(`minsu_draft_${storageKey}`, JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn("Draft auto-save failed", e);
    }
  }, [storageKey, data, isDirty]);

  const loadDraft = (): { data: T; savedAt: string } | null => {
    try {
      const item = localStorage.getItem(`minsu_draft_${storageKey}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  };

  const clearDraft = () => localStorage.removeItem(`minsu_draft_${storageKey}`);

  return { loadDraft, clearDraft };
}

export function SessionExpiredModal({
  isOpen,
  onReLoginSuccess,
}: {
  isOpen: boolean;
  onReLoginSuccess: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-line p-6 text-center apple-shadow">
        <div className="w-12 h-12 rounded-full bg-minsu-gold-100 text-minsu-gold-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-semibold text-lg text-ink mb-1">Session Timed Out</h3>
        <p className="text-xs text-ink-muted mb-4 flex items-center justify-center gap-1.5 text-minsu-green-700">
          <Save className="w-3.5 h-3.5" />
          <span>Your active inputs have been safely preserved.</span>
        </p>
        <p className="text-xs text-ink-muted mb-6">
          Please re-authenticate to continue where you left off.
        </p>
        <button
          onClick={onReLoginSuccess}
          className="w-full py-2.5 rounded-xl bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-medium text-sm apple-press transition-colors shadow-sm"
        >
          Sign In to Continue
        </button>
      </div>
    </div>
  );
}
```

---

## 9. Inline Form Field Validation Recipe

```tsx
import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: (props: {
    id: string;
    hasError: boolean;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    className: string;
  }) => React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  helperText,
  required,
  children,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink transition-all outline-none ${
    hasError
      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20 focus:border-red-600"
      : "border-line focus:border-minsu-green-700 focus:ring-2 focus:ring-minsu-green-700/20 bg-surface"
  }`;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-semibold text-ink">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {helperText && !hasError && (
          <span id={helperId} className="text-[11px] text-ink-muted">
            {helperText}
          </span>
        )}
      </div>

      {children({
        id,
        hasError,
        "aria-invalid": hasError,
        "aria-describedby": hasError ? errorId : helperId,
        className: inputClass,
      })}

      {hasError && (
        <div id={errorId} className="flex items-center gap-1.5 text-xs text-red-600 mt-0.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 10. 3-Part Success Confirmation Recipe

```tsx
import React from "react";
import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";

interface SuccessStateProps {
  confirmText: string;
  reassureDetails: {
    referenceCode?: string;
    message: string;
  };
  nextSteps: {
    primaryActionLabel: string;
    onPrimaryAction: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
  };
}

export function SuccessStateCard({
  confirmText,
  reassureDetails,
  nextSteps,
}: SuccessStateProps) {
  return (
    <div className="rounded-2xl border border-minsu-green-600/30 bg-minsu-green-50/60 p-6 sm:p-8 text-center max-w-lg mx-auto my-8 apple-shadow">
      {/* Visual Badge */}
      <div className="w-14 h-14 rounded-2xl bg-minsu-green-100 border border-minsu-green-600/20 flex items-center justify-center text-minsu-green-700 mx-auto mb-4 apple-shadow">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      {/* Part 1: Confirm */}
      <h3 className="font-heading font-bold text-xl text-minsu-green-900 mb-1">
        {confirmText}
      </h3>

      {/* Part 2: Reassure */}
      <div className="bg-white/80 rounded-xl border border-minsu-green-100 p-3 my-4 inline-block text-left max-w-sm">
        {reassureDetails.referenceCode && (
          <p className="text-xs font-mono font-bold text-minsu-green-800 mb-0.5">
            Ref: {reassureDetails.referenceCode}
          </p>
        )}
        <p className="text-xs text-ink-muted leading-relaxed">
          {reassureDetails.message}
        </p>
      </div>

      {/* Part 3: Show What Happens Next */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
        <button
          onClick={nextSteps.onPrimaryAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-medium text-sm apple-press transition-colors shadow-sm"
        >
          <span>{nextSteps.primaryActionLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        {nextSteps.secondaryActionLabel && nextSteps.onSecondaryAction && (
          <button
            onClick={nextSteps.onSecondaryAction}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface hover:bg-neutral-50 text-ink font-medium text-sm apple-press transition-colors"
          >
            <span>{nextSteps.secondaryActionLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
```

