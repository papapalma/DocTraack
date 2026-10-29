"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Download,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
  GraduationCap,
  Layers,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useSession();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (!user) return null;

  if (user.role !== "DIRECTOR") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          The Executive Analytics Dashboard is reserved for Campus Directors.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const annexNames: Record<number, string> = {
    1: "Submission to Agency",
    2: "Call for Applicants",
    3: "Continuing Billing",
    4: "New Billing",
    5: "Certificate of Qualified",
    6: "Fund Utilization",
    7: "Advance to Debit",
    8: "Check Issued",
    9: "Payroll",
    10: "Notice of Awards",
  };

  const summary = data?.summary || {};
  const annexCounts = data?.annexCounts || {};
  const statusCounts = data?.statusCounts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              TDP Executive Analytics & Insights
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              Live Metrics
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Turnaround times, approval velocity, annex distribution, and student participation rates.
          </p>
        </div>

        <a href="/api/analytics?format=csv" download>
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV Report
          </Button>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#1B5E20]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                Total Documents
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-16 my-1" />
              ) : (
                <h3 className="text-3xl font-bold font-heading text-[#1F2A24] mt-1">
                  {summary.totalDocs || 0}
                </h3>
              )}
              <p className="text-[11px] text-[#55645B] mt-0.5">Across Annexes 1–10</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#F2B705]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                Pending Review
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-16 my-1" />
              ) : (
                <h3 className="text-3xl font-bold font-heading text-[#B88A00] mt-1">
                  {summary.pendingReview || 0}
                </h3>
              )}
              <p className="text-[11px] text-[#55645B] mt-0.5">Awaiting signature</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#2E7D32]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                Approval Rate
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-16 my-1" />
              ) : (
                <h3 className="text-3xl font-bold font-heading text-[#2E7D32] mt-1">
                  {summary.approvalRate || 0}%
                </h3>
              )}
              <p className="text-[11px] text-[#55645B] mt-0.5">
                {summary.approvedTotal || 0} endorsed
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#DCEFDD] text-[#2E7D32] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#123F17]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                Student Applicants
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-16 my-1" />
              ) : (
                <h3 className="text-3xl font-bold font-heading text-[#123F17] mt-1">
                  {summary.totalApplications || 0}
                </h3>
              )}
              <p className="text-[11px] text-[#55645B] mt-0.5">Annex 2 Online Portal</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#DCEFDD] text-[#123F17] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Annex Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1B5E20]" />
              Distribution by Annex Schedule
            </CardTitle>
            <CardDescription>
              Volume of records initiated per Annex type
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const count = annexCounts[num] || 0;
              const maxCount = Math.max(...(Object.values(annexCounts) as number[]), 1);
              const percentage = Math.round((count / maxCount) * 100);

              return (
                <div key={num} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1F2A24]">
                      <strong className="text-[#1B5E20]">Annex {num}:</strong>{" "}
                      {annexNames[num]}
                    </span>
                    <span className="text-[#55645B] font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EBF1ED] overflow-hidden">
                    <div
                      className="h-full bg-[#1B5E20] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status Distribution Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1B5E20]" />
              Document Processing Pipeline Status
            </CardTitle>
            <CardDescription>
              Breakdown of active document states across all stages
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
                <p className="text-xs text-[#55645B] font-medium">Drafts</p>
                <h4 className="text-2xl font-bold text-[#55645B] mt-1">
                  {statusCounts.DRAFT || 0}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF1C2]/60 border border-[#F2B705]">
                <p className="text-xs text-[#B88A00] font-semibold">Submitted / Under Review</p>
                <h4 className="text-2xl font-bold text-[#B88A00] mt-1">
                  {(statusCounts.SUBMITTED || 0) + (statusCounts.RESUBMITTED || 0)}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#DCEFDD] border border-[#2E7D32]/30">
                <p className="text-xs text-[#2E7D32] font-semibold">Approved & Stamped</p>
                <h4 className="text-2xl font-bold text-[#2E7D32] mt-1">
                  {statusCounts.APPROVED || 0}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/30">
                <p className="text-xs text-[#B3261E] font-semibold">Returned for Revision</p>
                <h4 className="text-2xl font-bold text-[#B3261E] mt-1">
                  {statusCounts.RETURNED || 0}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#DCEFDD] border border-[#123F17]/30">
                <p className="text-xs text-[#123F17] font-semibold">Transmitted to Agency</p>
                <h4 className="text-2xl font-bold text-[#123F17] mt-1">
                  {statusCounts.TRANSMITTED || 0}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#E2E8F0] border border-[#CBD5E1]">
                <p className="text-xs text-[#4A5568] font-medium">Archived</p>
                <h4 className="text-2xl font-bold text-[#4A5568] mt-1">
                  {statusCounts.ARCHIVED || 0}
                </h4>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F1F8F1] border border-[#DCEFDD] text-xs text-[#123F17] space-y-1">
              <p className="font-semibold text-[#1B5E20]">Audit & Quality Note</p>
              <p className="text-[#55645B] leading-relaxed">
                All status transitions, review notes, and transmittal timestamps are permanently cryptographically linked in the institutional audit log table.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
