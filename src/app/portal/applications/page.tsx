"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyApps() {
      try {
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyApps();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
            Submitted / Queued
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30">
            Under Office Review
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B5E20] text-white">
            Accepted / Awarded
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDE8E7] text-[#B3261E]">
            Ineligible
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
            My TDP Grant Applications
          </h1>
          <p className="text-sm text-[#55645B] mt-1">
            Track the verification progress and outcome of your submitted applications.
          </p>
        </div>

        <Link href="/portal">
          <Button variant="primary" size="sm">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Apply to New Call
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={3} />
          ) : applications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No Applications Submitted Yet
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                You haven't submitted any Annex 2 grant applications yet. Check available calls to apply.
              </p>
              <Link href="/portal">
                <Button variant="primary" size="sm">
                  View Available Calls
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3.5 px-4">TDP Call Program</th>
                    <th className="py-3.5 px-4">Tracking Reference</th>
                    <th className="py-3.5 px-4">Date Submitted</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-[#F6F8F6] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#1F2A24]">
                        {app.call?.title || "TDP Grant Call"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#1B5E20]">
                        {app.trackingCode}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#55645B]">
                        {new Date(app.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
