"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { LogIn, KeyRound, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ContinuousRegistrationModal } from "@/components/auth/continuous-registration-modal";
import { OtpInput } from "@/components/auth/otp-input";
import { motion } from "motion/react";

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
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

  // Sync mode when initialMode prop changes (without cascading effect)
  if (prevInitialMode !== initialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"password" | "totp">("password");
  const [requiresTwoFactorStep, setRequiresTwoFactorStep] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear errors when switching modes or closing
  const switchMode = (newMode: "login" | "register") => {
    setError(null);
    setRequiresTwoFactorStep(false);
    setMode(newMode);
  };

  const handleClose = () => {
    setError(null);
    setCode("");
    setRequiresTwoFactorStep(false);
    onClose();
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
        body: JSON.stringify({ email, password, code, authMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to log in. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      if (data.requiresTwoFactor) {
        setRequiresTwoFactorStep(true);
        setCode("");
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
        <div className="relative inline-flex p-1 mt-2.5 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-xs font-semibold">
          <button
            type="button"
            className="relative z-10 px-3 sm:px-4 py-1.5 rounded-lg text-[#1B5E20] font-bold transition-all active:scale-95"
          >
            <motion.div
              layoutId="auth-tab-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className="relative z-10 px-3 sm:px-4 py-1.5 rounded-lg text-[#55645B] hover:text-[#1F2A24] transition-all active:scale-95"
          >
            Register Student (Annex 1)
          </button>
        </div>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleLogin} className="space-y-1">
        <FormField
          id="m-email"
          label="Email Address"
          required
          error={error && error.toLowerCase().includes("email") ? error : undefined}
          helperText="Use your registered MinSU email account"
        >
          {({ id, className, hasError, ...fieldProps }) => (
            <input
              id={id}
              type="email"
              placeholder="name@minsu.edu.ph"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              autoComplete="email"
              className={className}
              {...fieldProps}
            />
          )}
        </FormField>

        {/* Dual Mode Switcher: Password vs Authenticator Code */}
        <div className="relative flex p-1 my-2 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setRequiresTwoFactorStep(false);
              setCode("");
              if (error) setError(null);
            }}
            className={`relative z-10 flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              authMode === "password" ? "text-[#1B5E20] font-bold" : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            {authMode === "password" && (
              <motion.div
                layoutId="auth-login-mode-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("totp");
              setRequiresTwoFactorStep(false);
              if (error) setError(null);
            }}
            className={`relative z-10 flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              authMode === "totp" ? "text-[#1B5E20] font-bold" : "text-[#55645B] hover:text-[#1F2A24]"
            }`}
          >
            {authMode === "totp" && (
              <motion.div
                layoutId="auth-login-mode-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticator Code</span>
          </button>
        </div>

        {authMode === "password" && !requiresTwoFactorStep ? (
          <div>
            <FormField
              id="m-password"
              label="Password"
              required
              error={error && !error.toLowerCase().includes("email") ? error : undefined}
            >
              {({ id, className, hasError, ...fieldProps }) => (
                <input
                  id={id}
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="current-password"
                  className={className}
                  {...fieldProps}
                />
              )}
            </FormField>
            <p className="text-[10px] text-[#55645B] mt-1 text-right">
              Forgot password? Ask your Admin to reset it, or switch to <strong>Authenticator Code</strong>.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8]/80 text-center space-y-2 my-1">
            <span className="text-[11px] font-bold text-[#1F2A24] block">
              {requiresTwoFactorStep
                ? "Second-Factor Verification: Enter 6-digit code from Microsoft Authenticator:"
                : "Enter 6-digit code from Microsoft Authenticator:"}
            </span>
            <OtpInput
              value={code}
              onChange={(val) => {
                setCode(val);
                if (error) setError(null);
              }}
              error={error}
              disabled={isLoading}
            />
            <div className="pt-1">
              <input
                type="text"
                placeholder="Or enter 8-character recovery code"
                value={code.length > 6 ? code : ""}
                onChange={(e) => {
                  setCode(e.target.value.trim());
                  if (error) setError(null);
                }}
                className="w-full text-center text-xs py-1.5 px-2 rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] font-mono focus:border-[#1B5E20] outline-none placeholder:text-[11px] placeholder:font-sans"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2 h-10 text-xs sm:text-sm font-semibold rounded-xl shadow-sm"
          variant="primary"
          isLoading={isLoading}
        >
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          {authMode === "password" ? "Sign In with Password" : "Sign In with Authenticator"}
        </Button>
      </form>
    </Modal>
  );
}
