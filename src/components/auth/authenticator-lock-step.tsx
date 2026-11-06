"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import {
  ShieldCheck,
  Copy,
  Check,
  Download,
  ArrowRight,
  Smartphone,
  Lock,
  KeyRound,
  AlertCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthenticatorLockStepProps {
  userId: string;
  email: string;
  qrSvg: string;
  secret: string;
  formattedSecret: string;
  onSuccess?: () => void;
}

export function AuthenticatorLockStep({
  userId,
  email,
  qrSvg,
  secret,
  formattedSecret,
  onSuccess,
}: AuthenticatorLockStepProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedAllRecovery, setCopiedAllRecovery] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleLockAccount = async (inputCode?: string) => {
    const codeToSubmit = inputCode || code;
    if (codeToSubmit.length !== 6) {
      setError("Please enter the complete 6-digit code from Microsoft Authenticator.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: codeToSubmit }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Please check the code in your app.");
        setIsLoading(false);
        return;
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setIsLoading(false);
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const content = `MinSU DocTrack - Emergency Backup Recovery Codes\nAccount: ${email}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these one-time recovery codes safe. Each code can only be used once.\n\n${recoveryCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n")}\n\nMindoro State University`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minsu-doctrack-recovery-codes-${email.split("@")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAllRecovery = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedAllRecovery(true);
    setTimeout(() => setCopiedAllRecovery(false), 2500);
  };

  const handleProceedToPortal = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/portal");
      router.refresh();
    }
  };

  // State 2: Lock Completed & Display Recovery Codes
  if (recoveryCodes) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="space-y-4 text-center max-w-md mx-auto py-2"
      >
        <div className="w-14 h-14 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-heading font-extrabold text-[#1B5E20]">
            Account Successfully Locked!
          </h3>
          <p className="text-xs text-[#55645B] mt-1">
            Your MinSU account is now protected with Microsoft Authenticator.
          </p>
        </div>

        {/* Recovery Codes Callout */}
        <div className="p-4 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/60 text-left shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F2A24]">
            <KeyRound className="w-4 h-4 text-[#B88A00]" />
            <span>Emergency Backup Recovery Codes</span>
          </div>
          <p className="text-[11px] text-[#55645B] leading-relaxed">
            If you lose access to your phone or Microsoft Authenticator, these 8 single-use codes are the only way to log in:
          </p>

          <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-white rounded-lg border border-[#D6DDD8]/80 font-mono text-xs font-bold text-[#1F2A24] text-center">
            {recoveryCodes.map((rc, idx) => (
              <span key={idx} className="py-1 px-1.5 bg-[#F6F8F6] rounded border border-neutral-200">
                {rc}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadRecoveryCodes}
              className="apple-press flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#1B5E20] text-white hover:bg-[#164D1C] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAllRecovery}
              className="apple-press py-1.5 px-3 text-xs font-semibold rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] hover:bg-[#F1F8F1] flex items-center gap-1 transition-all"
            >
              {copiedAllRecovery ? <Check className="w-3.5 h-3.5 text-[#1B5E20]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAllRecovery ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleProceedToPortal}
          variant="primary"
          className="w-full h-11 text-sm font-bold rounded-xl shadow-sm"
        >
          <span>Continue to Student Portal</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </motion.div>
    );
  }

  // State 1: Active QR Code & 6-Digit Verification
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCEFDD] text-[#123F17]">
          <Lock className="w-3.5 h-3.5 text-[#1B5E20]" />
          <span>Step 6: Mandatory Security Lock</span>
        </div>
        <h3 className="text-lg font-heading font-extrabold text-[#1B5E20]">
          Lock Account with Microsoft Authenticator
        </h3>
        <p className="text-xs text-[#55645B]">
          Scan the QR code below using the Microsoft Authenticator app on your phone.
        </p>
      </div>

      {/* QR Code Presentation */}
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#D6DDD8] shadow-sm">
        <div
          className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center overflow-hidden"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#55645B]">
          <Smartphone className="w-3.5 h-3.5 text-[#1B5E20]" />
          <span>Compatible with <strong>Microsoft Authenticator</strong> on iOS & Android</span>
        </div>
      </div>

      {/* Manual Entry Key */}
      <div className="p-3 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-center space-y-1">
        <span className="text-[11px] font-semibold text-[#55645B] block">
          Cannot scan QR? Enter this key manually in your app:
        </span>
        <div className="flex items-center justify-center gap-2">
          <code className="text-xs font-mono font-bold text-[#1B5E20] tracking-wider select-all">
            {formattedSecret}
          </code>
          <button
            type="button"
            onClick={handleCopySecret}
            className="apple-press p-1 text-[#55645B] hover:text-[#1B5E20] rounded transition-all"
            title="Copy Secret Key"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-[#1B5E20]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Microsoft Authenticator Instructions */}
      <div className="p-3 rounded-xl bg-neutral-50/80 border border-[#D6DDD8] text-left text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-[#1F2A24] text-[11px]">
          <Info className="w-3.5 h-3.5 text-[#1B5E20] shrink-0" />
          <span>Setup tip for Microsoft Authenticator:</span>
        </div>
        <ol className="list-decimal list-inside text-[11px] text-[#55645B] space-y-1 pl-0.5 leading-relaxed">
          <li>In the app, tap <strong>+</strong> (Add account).</li>
          <li>Choose <strong>&quot;Other (Google, Facebook, etc.)&quot;</strong>.</li>
          <li>Scan the QR code, or tap <em>Or enter code manually</em> to paste the secret key.</li>
        </ol>
        <div className="p-2 rounded-lg bg-[#FFFDF5] border border-[#F2B705]/50 text-[10.5px] text-[#B88A00] leading-snug">
          <strong>⚠️ Note:</strong> If the app asks for a <strong>&quot;Code and URL&quot;</strong>, tap Back and choose <strong>&quot;Other account&quot;</strong> instead of &quot;Work or school&quot;.
        </div>
      </div>

      {/* 6-Digit OTP Verification */}
      <div className="space-y-2 pt-1 text-center">
        <label className="text-xs font-bold text-[#1F2A24] block">
          Enter 6-digit code shown in Microsoft Authenticator:
        </label>
        <OtpInput
          value={code}
          onChange={(val) => {
            setCode(val);
            if (error) setError(null);
          }}
          onComplete={(completedCode) => handleLockAccount(completedCode)}
          error={error}
          disabled={isLoading}
        />
      </div>

      <Button
        type="button"
        onClick={() => handleLockAccount()}
        isLoading={isLoading}
        disabled={code.length !== 6 || isLoading}
        variant="primary"
        className="w-full h-11 text-sm font-bold rounded-xl shadow-sm"
      >
        <ShieldCheck className="w-4 h-4 mr-1.5" />
        <span>Verify & Lock Account</span>
      </Button>
    </div>
  );
}

