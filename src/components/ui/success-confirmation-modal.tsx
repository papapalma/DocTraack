"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";

export interface SuccessConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmTitle: string;
  reassureDetails: {
    referenceCode?: string;
    message: string;
  };
  nextSteps: {
    primaryLabel: string;
    onPrimaryAction: () => void;
    secondaryLabel?: string;
    onSecondaryAction?: () => void;
  };
}

export function SuccessConfirmationModal({
  isOpen,
  onClose,
  confirmTitle,
  reassureDetails,
  nextSteps,
}: SuccessConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      className="p-6 text-center"
      showCloseButton={true}
    >
      {/* Visual Badge */}
      <div className="w-14 h-14 rounded-2xl bg-[#DCEFDD] border border-[#2E7D32]/30 flex items-center justify-center text-[#1B5E20] mx-auto mb-4 apple-shadow animate-in zoom-in-95 duration-200">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      {/* Part 1: Confirm */}
      <h3 className="font-heading font-bold text-xl text-[#123F17] mb-1">
        {confirmTitle}
      </h3>

      {/* Part 2: Reassure */}
      <div className="bg-[#F1F8F1] rounded-xl border border-[#DCEFDD] p-3.5 my-4 text-left">
        {reassureDetails.referenceCode && (
          <p className="text-xs font-mono font-bold text-[#164D1C] mb-1">
            Ref: {reassureDetails.referenceCode}
          </p>
        )}
        <p className="text-xs text-[#55645B] leading-relaxed">
          {reassureDetails.message}
        </p>
      </div>

      {/* Part 3: Show What Happens Next */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-5">
        <Button
          onClick={() => {
            nextSteps.onPrimaryAction();
            onClose();
          }}
          variant="primary"
          className="w-full sm:w-auto flex-1 font-semibold text-xs h-10"
        >
          <span>{nextSteps.primaryLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>

        {nextSteps.secondaryLabel && nextSteps.onSecondaryAction && (
          <Button
            onClick={() => {
              nextSteps.onSecondaryAction!();
              onClose();
            }}
            variant="outline"
            className="w-full sm:w-auto text-xs h-10 text-[#55645B]"
          >
            <span>{nextSteps.secondaryLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </Modal>
  );
}

