"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userName?: string;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoggingOut ? () => {} : onClose}
      maxWidth="sm"
      className="p-6 text-center"
    >
      {/* Icon Badge */}
      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FDE8E7] text-[#B3261E] flex items-center justify-center mb-4 border border-[#B3261E]/20 shadow-xs">
        <LogOut className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-heading font-bold text-[#1F2A24] tracking-tight">
        Confirm Sign Out
      </h3>

      <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
        Are you sure you want to sign out
        {userName ? (
          <>
            , <span className="font-semibold text-[#1F2A24]">{userName}</span>?
          </>
        ) : (
          "?"
        )}{" "}
        You will need to sign in again to access the portal.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isLoggingOut}
          className="w-1/2 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="md"
          onClick={handleConfirm}
          isLoading={isLoggingOut}
          className="w-1/2 rounded-xl shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </Modal>
  );
}
