"use client";

import * as React from "react";
import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showCloseButton?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  className,
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
        >
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Dialog Surface with Apple spring scale entrance & exit */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
              mass: 0.85,
            }}
            className={cn(
              "relative z-10 w-full rounded-2xl bg-white border border-[#D6DDD8]/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-4 sm:p-6 max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain my-auto",
              maxWidthMap[maxWidth],
              className
            )}
          >
            {/* Floating Close Button for modals without header or when explicitly enabled */}
            {showCloseButton && !(title || description) && (
              <button
                onClick={onClose}
                type="button"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-xl text-[#55645B] hover:text-[#1F2A24] bg-black/5 hover:bg-black/10 active:scale-95 transition-all shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-[#D6DDD8]/70">
                <div>
                  {typeof title === "string" ? (
                    <h3 className="text-lg font-heading font-bold text-[#1B5E20]">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {description && (
                    <p className="text-xs text-[#55645B] mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    type="button"
                    className="p-1.5 rounded-xl text-[#55645B] hover:text-[#1F2A24] hover:bg-[#F1F8F1] active:scale-95 transition-all shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
