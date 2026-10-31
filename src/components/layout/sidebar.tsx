"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useNav } from "@/components/layout/nav-context";
import {
  FileText,
  CheckSquare,
  BarChart3,
  Send,
  Users,
  PlusCircle,
  Megaphone,
  LayoutDashboard,
  Bell,
  GraduationCap,
  X,
  Sparkles,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useSession();
  const { mobileOpen, desktopCollapsed, closeMobile } = useNav();

  // ONLY close mobile drawer when the route actually changes (prevents instant re-close bug)
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      closeMobile();
    }
  }, [pathname, closeMobile]);

  // Lock body scroll only when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (!user) return null;

  const role = user.role;

  // Build role-specific navigation items
  const getNavItems = (): NavItem[] => {
    switch (role) {
      case "DIRECTOR":
        return [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Review Queue", href: "/review", icon: CheckSquare },
          { label: "Student Masterlist (A-1)", href: "/registrations", icon: Users },
          { label: "All Documents", href: "/documents", icon: FileText },
          { label: "Executive Analytics", href: "/analytics", icon: BarChart3 },
          { label: "Notifications", href: "/notifications", icon: Bell },
        ];

      case "STAFF":
        return [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Student Registrations (A-1)", href: "/registrations", icon: Users },
          { label: "Annex Documents", href: "/documents", icon: FileText },
          { label: "Prepare Annex", href: "/documents/new", icon: PlusCircle },
          { label: "Applicant Calls (A-2)", href: "/calls", icon: Megaphone },
          { label: "Outgoing Documents", href: "/outgoing", icon: Send },
          { label: "Notifications", href: "/notifications", icon: Bell },
        ];

      case "ACCOUNTING":
        return [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Financial Annexes (6–9)", href: "/documents", icon: FileText },
          { label: "Prepare Annex (6–9)", href: "/documents/new", icon: PlusCircle },
          { label: "Notifications", href: "/notifications", icon: Bell },
        ];

      case "SYSTEM_ADMIN":
        return [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Notifications", href: "/notifications", icon: Bell },
          { label: "Landing Page Editor", href: "/landing-editor", icon: LayoutTemplate },
          { label: "User Management", href: "/users", icon: Users },
          { label: "Logs", href: "/audit-logs", icon: ShieldCheck },
        ];

      case "STUDENT":
        return [
          { label: "Portal", href: "/portal", icon: GraduationCap },
          { label: "Available Calls", href: "/portal", icon: Megaphone },
          { label: "Applications", href: "/portal/applications", icon: FileText },
        ];

      default:
        return [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  // Determine active item: exact match takes precedence, followed by longest prefix match
  const activeHref = (() => {
    const exact = navItems.find((item) => item.href === pathname);
    if (exact) return exact.href;

    const matching = navItems
      .filter((item) => item.href !== "/dashboard" && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length);

    return matching[0]?.href;
  })();

  const renderNavContent = (isCollapsed = false) => (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      {/* Scrollable Navigation Area with Apple Sleek Scrollbar */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 apple-scrollbar">
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold text-[#55645B]/80 tracking-widest uppercase mb-2.5">
              Platform Menu
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={closeMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] group",
                    isCollapsed
                      ? "justify-center p-3"
                      : "justify-between px-3.5 py-2.5",
                    isActive
                      ? "bg-[#DCEFDD] text-[#123F17] font-semibold shadow-xs"
                      : "text-[#1F2A24] hover:bg-[#F1F8F1] hover:text-[#1B5E20]"
                  )}
                >
                  <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-transform duration-150 group-hover:scale-110 shrink-0",
                        isActive
                          ? "text-[#1B5E20]"
                          : "text-[#55645B] group-hover:text-[#1B5E20]"
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <span className="w-1.5 h-4 rounded-full bg-[#F2B705] shadow-xs" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pinned Bottom Footer (Office Pill + Role Indicator) */}
      <div className="shrink-0 pt-3 space-y-3">
        {/* Quick TDP Office Pill */}
        {!isCollapsed && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F1F8F1] to-[#DCEFDD]/50 border border-[#DCEFDD] text-xs text-[#1F2A24] shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1B5E20] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
              <span>MinSU TDP Office</span>
            </div>
            <p className="text-[#55645B] leading-relaxed text-[11px]">
              Official TDP Annexes 1–10 automated tracking and transmittal system.
            </p>
          </div>
        )}

        {/* Role Indicator Footer */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-[#D6DDD8]/80 text-xs text-[#55645B] flex items-center justify-between px-2">
            <span className="font-medium">Active Role</span>
            <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#DCEFDD] text-[#123F17] text-[11px]">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Collapsible Sidebar with Apple Glassmorphic Styling */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 bg-white/90 backdrop-blur-xl border-r border-[#D6DDD8]/80 h-full flex-col justify-between p-4 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          desktopCollapsed ? "w-20" : "w-64"
        )}
      >
        {renderNavContent(desktopCollapsed)}
      </aside>

      {/* Mobile Drawer with Apple Blur Backdrop and Symmetric Slide In / Out */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none delay-150"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop with click-to-close */}
        <div
          onClick={closeMobile}
          className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Slide-over panel with Apple spring physics curve */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] z-[70] flex flex-col p-4 transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D6DDD8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F9C733] to-[#F2B705] flex items-center justify-center text-[#123F17] font-bold text-sm border-2 border-white shadow-xs">
                <span>M</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[#1B5E20] leading-tight">
                  MinSU DocTrack
                </h3>
                <p className="text-[10px] text-[#55645B]">
                  TDP Annex Management
                </p>
              </div>
            </div>
            <button
              onClick={closeMobile}
              type="button"
              className="p-1.5 rounded-xl text-[#55645B] hover:bg-[#F1F8F1] active:scale-95 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderNavContent(false)}
          </div>
        </div>
      </div>
    </>
  );
};
