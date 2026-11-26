"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Smartphone,
  Bell,
  ShieldCheck,
  Sparkles,
  Ticket,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { SkeletonForm } from "@/components/ui/skeleton";
import { PwaSettingsPanel } from "@/components/settings/pwa-settings-panel";
import { NotificationSettingsPanel } from "@/components/settings/notification-settings-panel";
import { SecuritySettingsPanel } from "@/components/settings/security-settings-panel";
import { GlobalBrandingModal } from "@/components/dashboard/global-branding-modal";

type SettingsTabKey = "app" | "notifications" | "security";

const SETTINGS_TABS: Array<{
  id: SettingsTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "app", label: "App & Device (PWA)", icon: Smartphone },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "security", label: "Security & Authenticator", icon: ShieldCheck },
];

function isSettingsTabKey(val: string | null): val is SettingsTabKey {
  return val === "app" || val === "notifications" || val === "security";
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "DIRECTOR":
      return "Campus Director";
    case "STAFF":
      return "Staff Coordinator";
    case "ACCOUNTING":
      return "Accounting Officer";
    case "SYSTEM_ADMIN":
      return "System Administrator";
    default:
      return role;
  }
}

function SettingsHubContent() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("app");
  const [showBrandingModal, setShowBrandingModal] = useState(false);

  useEffect(() => {
    const tabParam = searchParams?.get("tab") ?? null;
    if (isSettingsTabKey(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (!user) return null;

  const canConfigureBranding =
    user.role === "DIRECTOR" || user.role === "SYSTEM_ADMIN";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#D6DDD8] apple-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center font-heading font-bold text-lg shadow-xs shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-heading font-bold tracking-tight text-[#1F2A24]">
                Account & App Settings
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20">
                <Shield className="w-3 h-3 text-[#1B5E20]" />
                {getRoleLabel(user.role)}
              </span>
            </div>
            <p className="text-xs text-[#55645B] mt-1">
              {user.name} • <span className="font-mono">{user.email}</span> • Manage Progressive Web App installation, alerts, and 2FA security
            </p>
          </div>
        </div>

        {/* Role-Aware Institutional Quick Actions */}
        {(canConfigureBranding || user.role === "SYSTEM_ADMIN") && (
          <div className="flex flex-wrap items-center gap-2">
            {canConfigureBranding && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBrandingModal(true)}
                className="apple-press text-xs font-semibold border-[#D6DDD8]"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#B88A00]" />
                Annex Branding
              </Button>
            )}
            {user.role === "SYSTEM_ADMIN" && (
              <Link href="/queue">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="apple-press text-xs font-semibold border-[#D6DDD8]"
                >
                  <Ticket className="w-3.5 h-3.5 mr-1.5 text-[#1B5E20]" />
                  Kiosk Admin
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Segmented Spring Tabs */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="bg-white p-1.5 rounded-xl border border-[#D6DDD8] shadow-xs flex overflow-x-auto gap-1"
      >
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all select-none apple-press ${
                isActive
                  ? "text-[#1B5E20] shadow-xs"
                  : "text-[#55645B] hover:text-[#1F2A24] hover:bg-[#F6F8F6]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="dashboard-settings-tab-indicator"
                  className="absolute inset-0 bg-[#F1F8F1] border border-[#DCEFDD] rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10 shrink-0" />
              <span className="relative z-10 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      >
        {activeTab === "app" && <PwaSettingsPanel showStartupModeSelector />}
        {activeTab === "notifications" && <NotificationSettingsPanel />}
        {activeTab === "security" && <SecuritySettingsPanel />}
      </motion.div>

      <GlobalBrandingModal
        isOpen={showBrandingModal}
        onClose={() => setShowBrandingModal(false)}
      />
    </div>
  );
}

export default function DashboardSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-6">
          <SkeletonForm fields={6} />
        </div>
      }
    >
      <SettingsHubContent />
    </Suspense>
  );
}
