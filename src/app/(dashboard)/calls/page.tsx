"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { StateContainer, ErrorStateConfig } from "@/components/ui/state-container";

interface CallItem {
  id: string;
  title: string;
  description?: string;
  batchNumber?: number;
  startDate?: string;
  deadline: string;
  windowStatus?: "UPCOMING" | "OPEN" | "CLOSED";
  isCurrentlyOpen?: boolean;
  _count?: { applications: number };
}

export default function CallsManagementPage() {
  const router = useRouter();
  const { user } = useSession();
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<ErrorStateConfig | null>(null);

  const loadCalls = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/calls");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load calls`);
      }
      const data = await res.json();
      setCalls(data.calls || []);
    } catch (e) {
      console.error("Error loading calls:", e);
      setFetchError({
        whatWentWrong: "Unable to load Annex 2 applicant calls",
        context: typeof navigator !== "undefined" && !navigator.onLine
          ? "Your device is currently offline. Reconnect to load open student application windows."
          : "The server timed out or was temporarily unreachable. Please retry.",
        onRetry: () => loadCalls(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  if (!user) return null;

  if (user.role === "SYSTEM_ADMIN") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Applicant calls are managed exclusively by TDP Staff Coordinators.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Annex 2: Calls for TDP Applicants
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              {calls.length} Active Calls
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Publish application windows, manage criteria, and monitor online student submissions.
          </p>
        </div>

        {user.role === "STAFF" && (
          <Link href="/calls/new">
            <Button variant="primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Open New Call (Annex 2)
            </Button>
          </Link>
        )}
      </div>

      {/* Calls Grid */}
      <Card>
        <CardContent className="p-0">
          <StateContainer
            isLoading={isLoading}
            skeletonFallback={<SkeletonTableRows count={4} />}
            error={fetchError}
            isEmpty={!isLoading && !fetchError && calls.length === 0}
            emptyConfig={{
              title: "No Applicant Calls Published",
              description: "Open a new call for applicants to begin receiving online student grant submissions.",
              icon: Megaphone,
              actionLabel: user.role === "STAFF" ? "Publish Call (Annex 2)" : undefined,
              onAction: user.role === "STAFF" ? () => router.push("/calls/new") : undefined,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Call Title</th>
                    <th className="py-3.5 px-4">Intake Window</th>
                    <th className="py-3.5 px-4">Applications</th>
                    <th className="py-3.5 px-4">Window Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {calls.map((call) => {
                    const now = new Date();
                    const start = call.startDate ? new Date(call.startDate) : null;
                    const end = new Date(call.deadline);
                    const isUpcoming = start ? now < start : false;
                    const isClosed = now > end;
                    const isOpen = !isUpcoming && !isClosed;

                    return (
                      <tr
                        key={call.id}
                        className="hover:bg-[#F6F8F6] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B5E20] text-white shadow-xs">
                            Batch {call.batchNumber || 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#1F2A24]">
                            {call.title}
                          </p>
                          <p className="text-xs text-[#55645B] line-clamp-1">
                            {call.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] space-y-0.5">
                          {start && (
                            <p className="text-[11px] text-[#55645B]">
                              <span className="font-semibold text-[#1F2A24]">Opens:</span>{" "}
                              {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                          <p className="text-[11px] text-[#55645B]">
                            <span className="font-semibold text-[#1F2A24]">Closes:</span>{" "}
                            {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-[#1B5E20]">
                          {call._count?.applications || 0} Grantees Applied
                        </td>
                        <td className="py-3.5 px-4">
                          {isOpen && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                              Open (Active)
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                              Upcoming Window
                            </span>
                          )}
                          {isClosed && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDE8E7] text-[#B3261E] border border-[#B3261E]/30">
                              Window Closed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/portal/calls/${call.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="apple-press h-8 text-xs font-semibold">
                              View Portal
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </StateContainer>
        </CardContent>
      </Card>
    </div>
  );
}
