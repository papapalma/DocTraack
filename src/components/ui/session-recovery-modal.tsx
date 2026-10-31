"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Save, AlertCircle, RefreshCw } from "lucide-react";

interface SessionRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReauthenticated: () => void;
}

export function SessionRecoveryModal({
  isOpen,
  onClose,
  onReauthenticated,
}: SessionRecoveryModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onReauthenticated();
      onClose();
    } catch {
      setError("Network or server error during authentication.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      className="p-5 sm:p-6"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#FFF1C2] border border-[#F9C733]/50 flex items-center justify-center text-[#B88A00] mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-heading font-bold text-lg text-[#1F2A24] mb-1">
          Session Expired
        </h3>

        <div className="p-2.5 rounded-xl bg-[#F1F8F1] border border-[#DCEFDD] text-xs text-[#123F17] flex items-center justify-center gap-2 mb-4">
          <Save className="w-4 h-4 text-[#1B5E20] shrink-0" />
          <span>Your active inputs & draft rows are safely preserved.</span>
        </div>

        <p className="text-xs text-[#55645B] mb-5 leading-relaxed">
          Please re-authenticate to renew your access token and submit your changes.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReLogin} className="space-y-3.5 text-left">
          <div className="space-y-1">
            <Label htmlFor="rec-email" className="text-xs font-semibold text-[#1F2A24]">
              Account Email
            </Label>
            <Input
              id="rec-email"
              type="email"
              placeholder="user@minsu.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec-password" className="text-xs font-semibold text-[#1F2A24]">
              Password
            </Label>
            <Input
              id="rec-password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full h-10 font-semibold"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Resume Session"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

