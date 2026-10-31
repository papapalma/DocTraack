"use client";

import React, { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useNav } from "@/components/layout/nav-context";
import { Bell, LogOut, User as UserIcon, Shield, Menu, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoutModal } from "@/components/auth/logout-modal";
import { Logo } from "@/components/ui/logo";
import { GlobalBrandingModal } from "@/components/dashboard/global-branding-modal";

export const Topbar: React.FC = () => {
  const { user, logout } = useSession();
  const { toggleSidebar } = useNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "DIRECTOR":
        return "Director";
      case "STAFF":
        return "Staff Coordinator";
      case "ACCOUNTING":
        return "Accounting Officer";
      case "SYSTEM_ADMIN":
        return "System Admin";
      case "STUDENT":
        return "Student";
      default:
        return role || "Guest";
    }
  };

  return (
    <header className="shrink-0 z-40 h-16 w-full bg-[#1B5E20]/95 backdrop-blur-xl text-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-b border-[#F2B705]/30 flex items-center justify-between px-3 sm:px-6 transition-colors">
      {/* Brand & Sidebar Toggle Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          type="button"
          aria-label="Toggle navigation menu"
          className="p-2 -ml-1 text-white hover:bg-white/10 active:scale-95 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group active:scale-[0.98] transition-transform">
          <Logo size="md" className="group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-base sm:text-xl tracking-tight text-white leading-tight">
                MinSU DocTrack
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2B705] text-[#123F17] shadow-xs">
                TDP
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#DCEFDD]/90 font-medium leading-none hidden xs:block sm:block">
              Mindoro State University • Annex Workflow
            </p>
          </div>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell Link */}
        <Link
          href="/notifications"
          className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 active:scale-90 rounded-full transition-all duration-150"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#F2B705] rounded-full ring-2 ring-[#1B5E20] shadow-xs" />
        </Link>

        {/* User profile & Role Badge */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex items-center gap-2.5 py-1.5 px-2.5 sm:px-3 rounded-xl hover:bg-white/10 active:scale-[0.97] transition-all duration-150 text-left border border-transparent",
                menuOpen && "bg-white/15 border-white/20"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#123F17] to-[#164D1C] border border-[#F2B705]/80 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-semibold text-white flex items-center gap-1">
                  <span>{user.name}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-white/70 transition-transform duration-200", menuOpen && "rotate-180")} />
                </div>
                <div className="text-[11px] text-[#F2B705] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 inline" />
                  {getRoleDisplayName(user.role)}
                </div>
              </div>
            </button>

            {/* Floating Glass Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white/95 backdrop-blur-2xl text-[#1F2A24] shadow-[0_12px_40px_-5px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)] p-1.5 z-50 origin-top-right transform-gpu animate-in fade-in zoom-in-95 duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="px-3.5 py-2.5 border-b border-[#D6DDD8]/60 mb-1">
                    <p className="text-sm font-bold text-[#1F2A24] truncate">{user.name}</p>
                    <p className="text-xs text-[#55645B] truncate mt-0.5">{user.email}</p>
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFDD] text-[#123F17]">
                      <Shield className="w-2.5 h-2.5" />
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1F2A24] hover:bg-[#F1F8F1] active:bg-[#DCEFDD] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#1B5E20]" />
                      Dashboard
                    </Link>

                    {(user.role === "SYSTEM_ADMIN" || user.role === "DIRECTOR") && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowBrandingModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#1F2A24] hover:bg-[#F1F8F1] active:bg-[#DCEFDD] transition-colors text-left"
                      >
                        <Sparkles className="w-4 h-4 text-[#B88A00]" />
                        Annex Logos & Branding
                      </button>
                    )}
                  </div>

                  <div className="border-t border-[#D6DDD8]/60 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#B3261E] hover:bg-[#FDE8E7] active:bg-[#FAD1CF] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        userName={user?.name}
      />

      {/* Global Branding & Logos Modal */}
      <GlobalBrandingModal
        isOpen={showBrandingModal}
        onClose={() => setShowBrandingModal(false)}
      />
    </header>
  );
};
