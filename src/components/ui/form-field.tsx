"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  className?: string;
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
  className,
  children,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const inputClass = cn(
    "w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1F2A24] transition-all outline-none",
    hasError
      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20 focus:border-red-600 focus:ring-red-500/30"
      : "border-[#D6DDD8] focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/20 bg-white"
  );

  return (
    <div className={cn("flex flex-col gap-1.5 mb-4", className)}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-semibold text-[#1F2A24]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {helperText && !hasError && (
          <span id={helperId} className="text-[11px] text-[#55645B]">
            {helperText}
          </span>
        )}
      </div>

      {children({
        id,
        hasError,
        "aria-invalid": hasError,
        "aria-describedby": hasError ? errorId : helperText ? helperId : undefined,
        className: inputClass,
      })}

      {hasError && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-red-600 mt-0.5 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

