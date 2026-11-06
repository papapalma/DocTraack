"use client";

import React, { useRef, useEffect } from "react";
import { motion, useAnimation } from "motion/react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  error,
  disabled = false,
  autoFocus = true,
  className = "",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const controls = useAnimation();

  // Split value into array of single digits
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Trigger Apple error shake on error update
  useEffect(() => {
    if (error) {
      controls.start({
        x: [-8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.32, ease: "easeInOut" },
      });
    }
  }, [error, controls]);

  // Auto-focus first input on mount if requested
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1); // Take latest char
    if (!/^\d*$/.test(char)) return; // Only allow digits

    const newDigits = [...digits];
    newDigits[index] = char;
    const nextVal = newDigits.join("");
    onChange(nextVal);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextVal.length === length && onComplete) {
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").trim().replace(/\D/g, "");
    if (!pasted) return;

    const newCode = pasted.slice(0, length);
    onChange(newCode);

    // Focus last filled index or next
    const targetIdx = Math.min(newCode.length, length - 1);
    inputRefs.current[targetIdx]?.focus();

    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        animate={controls}
        className="flex items-center justify-center gap-2 sm:gap-2.5"
      >
        {Array.from({ length }).map((_, idx) => {
          const isFilled = !!digits[idx];
          const hasError = !!error;

          return (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.95 }}
              animate={isFilled ? { scale: [0.94, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="relative"
            >
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digits[idx]}
                disabled={disabled}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all outline-none shadow-2xs ${
                  hasError
                    ? "border-red-400 bg-red-50/40 text-red-700 ring-2 ring-red-400/30"
                    : isFilled
                    ? "border-[#1B5E20] bg-[#F1F8F1]/60 text-[#123F17] shadow-xs"
                    : "border-[#D6DDD8] bg-white text-[#1F2A24] hover:border-[#1B5E20]/50 focus:border-[#1B5E20] focus:ring-2 focus:ring-[#F2B705]/50 focus:bg-white"
                }`}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-red-600 mt-2 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

