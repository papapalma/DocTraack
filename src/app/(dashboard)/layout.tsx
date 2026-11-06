"use client";

import React, { useEffect, Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { SessionProvider, useSession } from "@/components/providers/session-provider";
import { useRouter, usePathname } from "next/navigation";
import { NavProvider } from "@/components/layout/nav-context";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PageTransition } from "@/components/ui/page-transition";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/?auth=login");
      } else if (user.role === "STUDENT") {
        router.replace("/portal");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || user.role === "STUDENT") return null;

  return (
    <NavProvider>
      <OfflineBanner />
      <div className="h-screen overflow-hidden bg-[#F6F8F6] flex flex-col print:h-auto print:overflow-visible print:bg-white">
        <div className="topbar-container shrink-0 z-40 print:hidden">
          <Topbar />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden print:block print:min-h-0 print:overflow-visible">
          <div className="sidebar-container shrink-0 h-full print:hidden">
            <Suspense fallback={<div className="hidden md:block w-64 shrink-0 bg-white/90 backdrop-blur-xl border-r border-[#D6DDD8] h-full" />}>
              <Sidebar />
            </Suspense>
          </div>
          <main className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 apple-scrollbar print:h-auto print:overflow-visible print:p-0 print:m-0 print:max-w-none">
            <PageTransition key={pathname}>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </NavProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
