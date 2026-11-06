"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, SessionProvider } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Megaphone, FileText, User, Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalSkeleton } from "@/components/ui/skeleton";
import { LogoutModal } from "@/components/auth/logout-modal";
import { Logo } from "@/components/ui/logo";
import { motion } from "motion/react";
import { PageTransition } from "@/components/ui/page-transition";

function StudentNav() {
  const pathname = usePathname();
  const navLinks = [
    { label: "Active Calls", href: "/portal", icon: Megaphone },
    { label: "Announcements", href: "/portal/announcements", icon: BellRing },
    { label: "My Applications", href: "/portal/applications", icon: FileText },
    { label: "Profile", href: "/portal/profile", icon: User },
  ];

  return (
    <nav className="bg-white border-b border-[#D6DDD8] px-3 sm:px-8 overflow-x-auto">
      <div className="max-w-5xl mx-auto flex gap-4 sm:gap-6 min-w-max">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-2 py-3 text-sm font-semibold transition-colors whitespace-nowrap active:scale-95",
                isActive
                  ? "text-[#1B5E20]"
                  : "text-[#55645B] hover:text-[#1F2A24]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="student-nav-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B5E20]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function StudentPortalContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/?auth=login");
      } else if (user.role !== "STUDENT") {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  if (!user || user.role !== "STUDENT") return null;

  return (
    <div className="h-screen overflow-hidden bg-[#F6F8F6] flex flex-col print:h-auto print:overflow-visible">
      {/* Student Portal Header */}
      <header className="shrink-0 z-40 h-16 bg-[#1B5E20] border-b-2 border-[#F2B705] text-white flex items-center justify-between px-3 sm:px-8 shadow-md print:hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/portal" className="flex items-center gap-2 sm:gap-2.5">
            <Logo size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base sm:text-lg text-white">
                  MinSU DocTrack
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F2B705] text-[#123F17]">
                  Portal
                </span>
              </div>
              <p className="text-[10px] text-[#DCEFDD] hidden xs:block">
                TDP Online Application (Annex 2)
              </p>
            </div>
          </Link>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/portal/announcements"
            className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 active:scale-90 rounded-full transition-all duration-150"
            title="Announcements & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F2B705] rounded-full ring-2 ring-[#1B5E20]" />
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-white/90">
            <User className="w-4 h-4 text-[#F2B705]" />
            <span className="font-semibold">{user.name}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutModal(true)}
            className="text-white hover:bg-white/10 text-xs gap-1.5 h-8 px-2 sm:px-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Confirmation Modal Before Logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        userName={user.name}
      />

      {/* Student Nav Bar with Suspense */}
      <div className="shrink-0 z-30 print:hidden">
        <Suspense fallback={<div className="h-11 bg-white border-b border-[#D6DDD8]" />}>
          <StudentNav />
        </Suspense>
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 h-full min-h-0 overflow-y-auto w-full apple-scrollbar print:h-auto print:overflow-visible flex flex-col justify-between">
        <div className="max-w-5xl mx-auto w-full p-3 sm:p-6 md:p-8 min-w-0 flex-1">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </div>

        {/* Footer */}
        <footer className="py-4 border-t border-[#D6DDD8] bg-white text-center text-xs text-[#55645B] shrink-0 print:hidden">
          <p>© 2026 Mindoro State University • Student Financial Assistance & Grants Office</p>
        </footer>
      </main>
    </div>
  );
}

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <StudentPortalContent>{children}</StudentPortalContent>
    </SessionProvider>
  );
}
