"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Sparkles, GraduationCap, Shield } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ContinuousRegistrationModal } from "@/components/auth/continuous-registration-modal";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  redirectUrl?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  redirectUrl,
}: AuthModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Sync mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear errors when switching modes or closing
  const switchMode = (newMode: "login" | "register") => {
    setError(null);
    setMode(newMode);
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Quick Demo Account Auto-Fill
  const fillRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Password@123");
    setError(null);
  };

  // If in register mode, render the continuous Annex 1 registration modal
  if (mode === "register") {
    return (
      <ContinuousRegistrationModal
        isOpen={isOpen}
        onClose={handleClose}
        onSwitchToLogin={() => switchMode("login")}
      />
    );
  }


  // Login Submit
  const handleLogin = async (e: React.FormEvent) => {
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
        setError(data.error || "Failed to log in. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      handleClose();

      const from = redirectUrl || searchParams?.get("from");
      if (from && from !== "/" && from !== "/login") {
        router.push(from);
      } else if (data.user?.role === "STUDENT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      className="p-4 sm:p-6"
      showCloseButton={true}
    >
      {/* Header with MinSU Identity */}
      <div className="text-center pb-3.5 mb-3.5 border-b border-[#D6DDD8]/70 flex flex-col items-center">
        <Logo size="md" className="mb-2 shadow-xs sm:hidden" />
        <Logo size="lg" className="mb-2 shadow-sm hidden sm:flex" />
        <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#1B5E20] tracking-tight">
          Sign In to MinSU DocTrack
        </h2>
        <p className="text-[11px] sm:text-xs text-[#55645B] mt-0.5 max-w-sm">
          Enter your institutional or applicant account credentials
        </p>

        {/* Tab Switcher Pills */}
        <div className="inline-flex p-1 mt-2.5 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-xs font-semibold">
          <button
            type="button"
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-white text-[#1B5E20] shadow-xs font-bold transition-all"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className="px-3 sm:px-4 py-1.5 rounded-lg text-[#55645B] hover:text-[#1F2A24] transition-all"
          >
            Register Student (Annex 1)
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 mb-3.5 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/30 text-xs text-[#B3261E] font-medium leading-relaxed animate-in fade-in">
          {error}
        </div>
      )}

      {/* LOGIN FORM */}
      <form onSubmit={handleLogin} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="m-email" required className="text-xs font-semibold text-[#1F2A24]">
            Email Address
          </Label>
          <Input
            id="m-email"
            type="email"
            placeholder="name@minsu.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 text-base sm:text-xs rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="m-password" required className="text-xs font-semibold text-[#1F2A24]">
            Password
          </Label>
          <Input
            id="m-password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-10 text-base sm:text-xs rounded-xl"
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2 h-10 text-xs sm:text-sm font-semibold rounded-xl shadow-sm"
          variant="primary"
          isLoading={isLoading}
        >
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          Sign In
        </Button>

        {/* Quick Demo Presets */}
        <div className="pt-2.5 mt-2.5 border-t border-[#D6DDD8]/60">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B5E20] mb-2">
            <Sparkles className="w-3 h-3 text-[#F2B705]" />
            <span>One-Click Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => fillRole("admin@minsu.edu.ph")}
              className="py-1.5 px-2 rounded-lg border border-[#D6DDD8]/80 bg-white hover:bg-[#F1F8F1] active:scale-95 transition-all text-left text-[#1F2A24] font-medium flex items-center justify-between shadow-2xs"
            >
              <span>Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
            </button>
            <button
              type="button"
              onClick={() => fillRole("director@minsu.edu.ph")}
              className="py-1.5 px-2 rounded-lg border border-[#D6DDD8]/80 bg-white hover:bg-[#F1F8F1] active:scale-95 transition-all text-left text-[#1F2A24] font-medium flex items-center justify-between shadow-2xs"
            >
              <span>Director</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
            </button>
            <button
              type="button"
              onClick={() => fillRole("staff@minsu.edu.ph")}
              className="py-1.5 px-2 rounded-lg border border-[#D6DDD8]/80 bg-white hover:bg-[#F1F8F1] active:scale-95 transition-all text-left text-[#1F2A24] font-medium flex items-center justify-between shadow-2xs"
            >
              <span>Staff</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
            </button>
            <button
              type="button"
              onClick={() => fillRole("accounting@minsu.edu.ph")}
              className="py-1.5 px-2 rounded-lg border border-[#D6DDD8]/80 bg-white hover:bg-[#F1F8F1] active:scale-95 transition-all text-left text-[#1F2A24] font-medium flex items-center justify-between shadow-2xs"
            >
              <span>Accounting</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
            </button>
            <button
              type="button"
              onClick={() => fillRole("student@minsu.edu.ph")}
              className="py-1.5 px-2 rounded-lg border border-[#D6DDD8]/80 bg-white hover:bg-[#F1F8F1] active:scale-95 transition-all text-left text-[#1F2A24] font-medium flex items-center justify-between shadow-2xs col-span-2 sm:col-span-1"
            >
              <span>Student</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705]" />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
