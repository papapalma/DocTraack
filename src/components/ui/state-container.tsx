"use client";

import React from "react";
import { AlertCircle, RefreshCw, FolderOpen, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateConfig {
  whatWentWrong: string;
  context: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export interface EmptyStateConfig {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
}

export interface StateContainerProps {
  isLoading?: boolean;
  isSlow?: boolean;
  skeletonFallback?: React.ReactNode;
  error?: ErrorStateConfig | null;
  isEmpty?: boolean;
  emptyConfig?: EmptyStateConfig;
  children: React.ReactNode;
}

export function StateContainer({
  isLoading,
  isSlow,
  skeletonFallback,
  error,
  isEmpty,
  emptyConfig,
  children,
}: StateContainerProps) {
  // 1. Loading State (Skeleton Loading)
  if (isLoading) {
    return (
      <div className="space-y-3">
        {isSlow && (
          <div
            role="status"
            className="rounded-xl border border-[#F2B705]/40 bg-[#FFF1C2]/60 p-3.5 flex items-center justify-between text-xs sm:text-sm text-[#1F2A24] animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B88A00] animate-spin shrink-0" />
              <span>
                <strong>Taking longer than expected.</strong> High server traffic or poor connection. Please keep this tab open...
              </span>
            </div>
          </div>
        )}
        {skeletonFallback}
      </div>
    );
  }

  // 2. 3-Part Error State
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-2xl border border-red-200 bg-red-50/70 p-6 sm:p-8 text-center max-w-lg mx-auto my-8 apple-shadow transition-all"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>

        {/* Part 1: What went wrong */}
        <h3 className="font-heading font-semibold text-lg text-red-950 mb-1">
          {error.whatWentWrong}
        </h3>

        {/* Part 2: Context / Whose fault (calm, non-punitive) */}
        <p className="text-xs sm:text-sm text-red-800/80 mb-6 leading-relaxed max-w-md mx-auto">
          {error.context}
        </p>

        {/* Part 3: How to fix it */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {error.onRetry && (
            <Button
              onClick={error.onRetry}
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
          )}

          {error.onGoBack && (
            <Button
              onClick={error.onGoBack}
              variant="outline"
              size="sm"
              className="border-[#D6DDD8] text-[#55645B]"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty State (Zero Data)
  if (isEmpty && emptyConfig) {
    const Icon = emptyConfig.icon || FolderOpen;

    return (
      <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl border border-dashed border-[#D6DDD8] bg-white/60 my-6 transition-all">
        <div className="w-14 h-14 rounded-2xl bg-[#F1F8F1] border border-[#DCEFDD] flex items-center justify-center text-[#1B5E20] mb-4 apple-shadow">
          <Icon className="w-7 h-7" />
        </div>

        <h3 className="font-heading font-semibold text-base sm:text-lg text-[#1F2A24] mb-1">
          {emptyConfig.title}
        </h3>

        <p className="text-xs sm:text-sm text-[#55645B] max-w-md mb-6 leading-relaxed">
          {emptyConfig.description}
        </p>

        {emptyConfig.actionLabel && emptyConfig.onAction && (
          <Button
            onClick={emptyConfig.onAction}
            variant="primary"
            size="sm"
            className="shadow-sm"
          >
            {emptyConfig.actionLabel}
          </Button>
        )}

        {emptyConfig.secondaryAction && (
          <div className="mt-3">{emptyConfig.secondaryAction}</div>
        )}
      </div>
    );
  }

  // 4. Content / Normal Render
  return <>{children}</>;
}

