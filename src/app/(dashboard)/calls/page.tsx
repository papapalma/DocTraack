"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle, Calendar, Users, ArrowRight } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";

export default function CallsManagementPage() {
  const { user } = useSession();
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCalls() {
      try {
        const res = await fetch("/api/calls");
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCalls();
  }, []);

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
          {isLoading ? (
            <SkeletonTableRows count={4} />
          ) : calls.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No Applicant Calls Published
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Open a new call for applicants to begin receiving online student grant submissions.
              </p>
              {user.role === "STAFF" && (
                <Link href="/calls/new">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Publish Call (Annex 2)
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3.5 px-4">Call Title</th>
                    <th className="py-3.5 px-4">Deadline</th>
                    <th className="py-3.5 px-4">Submissions Received</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {calls.map((call) => {
                    const isClosed = new Date(call.deadline) < new Date();
                    return (
                      <tr
                        key={call.id}
                        className="hover:bg-[#F6F8F6] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#1F2A24]">
                            {call.title}
                          </p>
                          <p className="text-xs text-[#55645B] line-clamp-1">
                            {call.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B]">
                          {new Date(call.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-[#1B5E20]">
                          {call._count?.applications || 0} Grantees Applied
                        </td>
                        <td className="py-3.5 px-4">
                          {isClosed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDE8E7] text-[#B3261E]">
                              Closed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCEFDD] text-[#123F17]">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/portal/calls/${call.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              View Form
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
