import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[#D6DDD8]/60 dark:bg-[#D6DDD8]/30",
        className
      )}
      {...props}
    />
  );
}

/** Pre-composed skeleton for a card with header and lines */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 rounded-2xl bg-white border border-[#D6DDD8]/70 space-y-4 shadow-xs", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

/** Pre-composed skeleton rows for table views */
export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#D6DDD8]/60">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full shrink-0 hidden sm:block" />
          <Skeleton className="h-4 w-28 shrink-0 hidden md:block" />
          <Skeleton className="h-8 w-16 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Pre-composed form skeleton for application & annex forms */
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D6DDD8]/80 space-y-6 shadow-sm">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="pt-4 flex justify-end gap-3 border-t border-[#D6DDD8]/50">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

/** Inner Dashboard Content Skeleton (for use when layout header & sidebar are already mounted) */
export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Welcome Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-white border border-[#D6DDD8]/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-[#D6DDD8]/80 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="w-12 h-12 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Table Container Skeleton */}
      <div className="bg-white rounded-3xl border border-[#D6DDD8]/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#D6DDD8]/60 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <SkeletonTableRows count={5} />
      </div>
    </div>
  );
}

/** Full Dashboard Layout Skeleton (Topbar + Sidebar + Content) */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F8F6] flex flex-col selection:bg-[#F2B705]/30">
      {/* Topbar Skeleton */}
      <header className="sticky top-0 z-30 h-16 bg-[#164D1C] border-b border-[#F2B705]/40 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full bg-white/20" />
          <div className="space-y-1 hidden sm:block">
            <Skeleton className="h-4 w-28 bg-white/20" />
            <Skeleton className="h-2.5 w-40 bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
          <Skeleton className="h-8 w-28 rounded-full bg-white/20 hidden md:block" />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar Skeleton (desktop) */}
        <aside className="w-64 bg-[#123F17] border-r border-[#1B5E20] p-4 hidden lg:flex flex-col gap-2 shrink-0">
          <Skeleton className="h-4 w-24 bg-white/15 mb-2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
              <Skeleton className="w-5 h-5 rounded-md bg-white/20 shrink-0" />
              <Skeleton className="h-3.5 w-32 bg-white/15" />
            </div>
          ))}
          <div className="mt-auto pt-4 border-t border-white/10">
            <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
          </div>
        </aside>

        {/* Content Shell Skeleton */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}

/** Inner Portal Content Skeleton (for use when portal header & student nav are already mounted) */
export function PortalContentSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-white border border-[#D6DDD8]/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 2-column Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/** Full Student Portal Layout Skeleton */
export function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-[#F6F8F6] flex flex-col selection:bg-[#F2B705]/30">
      {/* Portal Header Skeleton */}
      <header className="sticky top-0 z-30 h-16 bg-[#1B5E20] border-b border-[#F2B705]/40 text-white flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full bg-white/20" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-2.5 w-44 bg-white/10 hidden sm:block" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
          <Skeleton className="h-8 w-20 rounded-xl bg-white/15" />
        </div>
      </header>

      {/* Main Portal Content Skeleton */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <PortalContentSkeleton />
      </main>
    </div>
  );
}
