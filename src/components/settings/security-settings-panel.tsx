"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, KeyRound, Lock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AuthenticatorLockStep } from "@/components/auth/authenticator-lock-step";
import { useSession } from "@/hooks/use-session";

interface TotpSetupPayload {
  userId?: string;
  accountName?: string;
  secret: string;
  formattedSecret: string;
  qrSvg: string;
  requiresReauth?: boolean;
  error?: string;
}

export function SecuritySettingsPanel() {
  const { user, refresh } = useSession();
  const [setupModalData, setSetupModalData] = useState<TotpSetupPayload | null>(
    null
  );
  const [isGeneratingSetup, setIsGeneratingSetup] = useState(false);
  const [showReauthBox, setShowReauthBox] = useState(false);
  const [reauthInput, setReauthInput] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);

  if (!user) return null;

  const handleOpenSetup = async () => {
    if (user.twoFactorEnabled) {
      setShowReauthBox(true);
      setReauthError(null);
      return;
    }

    try {
      setIsGeneratingSetup(true);
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as TotpSetupPayload;
      if (res.ok) {
        setSetupModalData(data);
      } else if (data.requiresReauth) {
        setShowReauthBox(true);
      }
    } catch (e) {
      console.error("Failed to generate 2FA setup:", e);
    } finally {
      setIsGeneratingSetup(false);
    }
  };

  const handleVerifyReauth = async () => {
    try {
      setIsGeneratingSetup(true);
      setReauthError(null);
      const trimmed = reauthInput.trim();
      const payload =
        /^\d{6}$/.test(trimmed) || /^[A-F0-9]{4}-[A-F0-9]{4}$/i.test(trimmed)
          ? { currentCode: trimmed }
          : { currentPassword: reauthInput };

      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as TotpSetupPayload;
      if (res.ok) {
        setSetupModalData(data);
        setShowReauthBox(false);
        setReauthInput("");
      } else {
        setReauthError(data.error || "Verification failed.");
      }
    } catch {
      setReauthError("Network error while verifying.");
    } finally {
      setIsGeneratingSetup(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card 1: Microsoft Authenticator 2FA */}
      <Card className="border-[#D6DDD8] bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-[#D6DDD8]/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base text-[#1F2A24] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1B5E20]" />
                <span>Microsoft Authenticator (TOTP 2FA)</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#55645B] mt-0.5">
                Two-Factor Authentication status and rotating 6-digit security code enrollment.
              </CardDescription>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                user.twoFactorEnabled
                  ? "bg-[#DCEFDD] text-[#123F17]"
                  : "bg-[#FFF1C2] text-[#B88A00]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  user.twoFactorEnabled ? "bg-[#2E7D32]" : "bg-[#B88A00]"
                }`}
              />
              {user.twoFactorEnabled ? "Active & Enrolled" : "Not Yet Enrolled"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-[#55645B] leading-relaxed">
            Protect your institutional account using rotating 6-digit verification codes in{" "}
            <strong className="text-[#1F2A24]">Microsoft Authenticator</strong> (or any RFC 6238 TOTP app). Once enrolled, you can sign in rapidly using your authenticator code.
          </p>

          <div className="pt-2 space-y-2.5">
            {showReauthBox ? (
              <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8] space-y-2.5 max-w-md">
                <label
                  htmlFor="settings-reauth-input"
                  className="block text-xs font-semibold text-[#1F2A24]"
                >
                  Confirm current password or active 6-digit Authenticator code to reconfigure:
                </label>
                <input
                  id="settings-reauth-input"
                  type="password"
                  value={reauthInput}
                  onChange={(e) => {
                    setReauthInput(e.target.value);
                    if (reauthError) setReauthError(null);
                  }}
                  placeholder="Current password or 6-digit code"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#D6DDD8] bg-white text-[#1F2A24] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition"
                />
                {reauthError && (
                  <p className="text-[11px] text-[#B3261E] font-medium">
                    {reauthError}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isGeneratingSetup}
                    onClick={handleVerifyReauth}
                    className="text-xs apple-press"
                  >
                    Verify & Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReauthBox(false);
                      setReauthInput("");
                      setReauthError(null);
                    }}
                    className="text-xs apple-press"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenSetup}
                isLoading={isGeneratingSetup}
                className="apple-press text-xs font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#1B5E20]" />
                <span>
                  {user.twoFactorEnabled
                    ? "Reconfigure Authenticator / Recovery Codes"
                    : "Set Up Microsoft Authenticator"}
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Institutional Password Governance */}
      <Card className="border-[#D6DDD8] bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-[#D6DDD8]/60">
          <CardTitle className="text-base text-[#1F2A24] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#B88A00]" />
            <span>Institutional Password & Session Governance</span>
          </CardTitle>
          <CardDescription className="text-xs text-[#55645B] mt-0.5">
            Credential administration and RA 10173 audit-trail compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {user.role === "SYSTEM_ADMIN" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F1F8F1] border border-[#1B5E20]/20 text-xs text-[#1F2A24]">
              <div className="space-y-1">
                <p className="font-bold text-[#123F17]">
                  Administrator Credential Controls
                </p>
                <p className="text-[#55645B] text-[11px] leading-relaxed">
                  As a System Administrator, you can reset passwords and manage activation status for institutional accounts in User Management.
                </p>
              </div>
              <Link href="/users" className="shrink-0">
                <Button variant="primary" size="sm" className="text-xs apple-press">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Open User Management
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/50 text-xs text-[#1F2A24] space-y-1.5">
              <p className="font-bold text-[#B88A00]">
                Centralized Credential Protection
              </p>
              <p className="text-[#55645B] leading-relaxed text-[11px]">
                To preserve non-repudiation across official TDP Annex endorsements and financial payroll records, password resets are centrally logged and issued by the{" "}
                <strong className="text-[#1F2A24]">Campus System Administrator</strong> (<code className="font-bold text-[#1B5E20]">admin@minsu.edu.ph</code>).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!setupModalData}
        onClose={() => setSetupModalData(null)}
        title="Microsoft Authenticator Configuration"
        maxWidth="md"
      >
        {setupModalData && (
          <div className="py-2">
            <AuthenticatorLockStep
              userId={user.id || setupModalData.userId || ""}
              email={user.email || setupModalData.accountName || ""}
              secret={setupModalData.secret}
              formattedSecret={setupModalData.formattedSecret}
              qrSvg={setupModalData.qrSvg}
              onSuccess={() => {
                setSetupModalData(null);
                void refresh();
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
