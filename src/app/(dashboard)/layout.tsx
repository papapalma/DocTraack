"use client";

import React, { useEffect, Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { SessionProvider, useSession } from "@/components/providers/session-provider";
import { useRouter } from "next/navigation";
import { NavProvider } from "@/components/layout/nav-context";
import { DashboardSkeleton } from "@/components/ui/skeleton";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/?auth=login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <NavProvider>
      <div className="min-h-screen bg-[#F6F8F6] flex flex-col">
        <Topbar />
        <div className="flex flex-1 min-w-0">
          <Suspense fallback={<div className="hidden md:block sticky top-16 w-64 shrink-0 bg-white/90 backdrop-blur-xl border-r border-[#D6DDD8] h-[calc(100vh-4rem)]" />}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
            {children}
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
