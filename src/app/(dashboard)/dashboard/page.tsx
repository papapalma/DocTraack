"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/documents/status-badge";
import { Skeleton, SkeletonTableRows } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  Users,
  ShieldCheck,
  LayoutTemplate,
  Activity,
  Lock,
  UserCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useSession();

  // State for Operational roles (STAFF, ACCOUNTING, DIRECTOR)
  const [documents, setDocuments] = useState<any[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(true);

  // State for SYSTEM_ADMIN
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<{
    totalEvents: number;
    todayEvents: number;
    activeActors: number;
    authEvents: number;
  } | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.role === "SYSTEM_ADMIN") {
      async function loadAdminData() {
        try {
          const [usersRes, logsRes] = await Promise.all([
            fetch("/api/users"),
            fetch("/api/audit-logs?limit=5"),
          ]);

          if (usersRes.ok) {
            const data = await usersRes.json();
            setAdminUsers(data.users || []);
          }

          if (logsRes.ok) {
            const data = await logsRes.json();
            setAdminLogs(data.logs || []);
            setAdminMetrics(data.metrics || null);
          }
        } catch (e) {
          console.error("Failed to load admin dashboard data:", e);
        } finally {
          setIsAdminLoading(false);
        }
      }
      loadAdminData();
    } else {
      async function loadDocs() {
        try {
          const res = await fetch("/api/documents");
          if (res.ok) {
            const data = await res.json();
            setDocuments(data.documents || []);
          }
        } catch (e) {
          console.error("Failed to load dashboard documents:", e);
        } finally {
          setIsDocsLoading(false);
        }
      }
      loadDocs();
    }
  }, [user]);

  if (!user) return null;

  // -------------------------------------------------------------
  // SYSTEM_ADMIN DEDICATED DASHBOARD
  // -------------------------------------------------------------
  if (user.role === "SYSTEM_ADMIN") {
    const activeUsersCount = adminUsers.filter((u) => u.active !== false).length;

    return (
      <div className="space-y-6">
        {/* Welcome Glass Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-[#D6DDD8]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-[#1B5E20] tracking-tight">
                System Administration Console
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#123F17] text-white shadow-xs">
                SYSTEM_ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#55645B] mt-1.5 leading-relaxed">
              Mindoro State University • Platform Security, User Provisioning & Public Portal Management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Link href="/users" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto shadow-sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/landing-editor" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto border-[#1B5E20] text-[#1B5E20]">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                CMS Editor
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Registered Users */}
          <Card className="rounded-2xl border border-[#D6DDD8]/80 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#55645B] uppercase tracking-wider">
                  Total Users
                </p>
                {isAdminLoading ? (
                  <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                ) : (
                  <h3 className="text-3xl font-extrabold font-heading text-[#1F2A24] mt-1 tracking-tight">
                    {adminUsers.length}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCEFDD] to-[#F1F8F1] text-[#1B5E20] flex items-center justify-center shadow-xs border border-[#1B5E20]/10">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Active Accounts */}
          <Card className="rounded-2xl border border-[#2E7D32]/30 bg-gradient-to-br from-white to-[#F4FAF4] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wider">
                  Active Accounts
                </p>
                {isAdminLoading ? (
                  <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                ) : (
                  <h3 className="text-3xl font-extrabold font-heading text-[#2E7D32] mt-1 tracking-tight">
                    {activeUsersCount}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCEFDD] to-[#E9F6EA] text-[#2E7D32] flex items-center justify-center shadow-xs border border-[#2E7D32]/20">
                <UserCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Today's Events */}
          <Card className="rounded-2xl border border-[#F2B705]/40 bg-gradient-to-br from-white to-[#FFFDF5] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#B88A00] uppercase tracking-wider">
                  Events Today
                </p>
                {isAdminLoading ? (
                  <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                ) : (
                  <h3 className="text-3xl font-extrabold font-heading text-[#B88A00] mt-1 tracking-tight">
                    {adminMetrics?.todayEvents ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF1C2] to-[#FFF9E6] text-[#B88A00] flex items-center justify-center shadow-xs border border-[#F2B705]/20">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Total Audit Logs */}
          <Card className="rounded-2xl border border-[#123F17]/30 bg-gradient-to-br from-white to-[#F1F8F1] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#123F17] uppercase tracking-wider">
                  Total Audit Trail
                </p>
                {isAdminLoading ? (
                  <Skeleton className="h-8 w-12 rounded-lg mt-1" />
                ) : (
                  <h3 className="text-3xl font-extrabold font-heading text-[#123F17] mt-1 tracking-tight">
                    {adminMetrics?.totalEvents ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#123F17] to-[#1B5E20] text-white flex items-center justify-center shadow-xs border border-white/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/users" className="block group">
            <Card className="h-full rounded-2xl border border-[#D6DDD8]/80 hover:border-[#1B5E20]/40 transition-all p-5 hover:shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors flex items-center gap-1.5">
                    User Management
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                    Create institutional accounts (`STAFF`, `ACCOUNTING`, `DIRECTOR`), assign roles, or toggle access.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/audit-logs" className="block group">
            <Card className="h-full rounded-2xl border border-[#D6DDD8]/80 hover:border-[#1B5E20]/40 transition-all p-5 hover:shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors flex items-center gap-1.5">
                    Security Audit Trail
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                    Review immutable event logs, user activities, status diffs, and export records to CSV or JSON.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/landing-editor" className="block group">
            <Card className="h-full rounded-2xl border border-[#D6DDD8]/80 hover:border-[#1B5E20]/40 transition-all p-5 hover:shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F1F8F1] text-[#123F17] flex items-center justify-center shrink-0">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors flex items-center gap-1.5">
                    Landing Page CMS
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                    Configure hero titles, notices, FAQs, and office contact info with split-screen live preview.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Live Security Audit Activity */}
        <Card className="rounded-3xl border border-[#D6DDD8]/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 gap-2 border-b border-[#D6DDD8]/50">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Recent System Security Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest security audit events recorded across all user sessions and institutional actions
              </CardDescription>
            </div>
            <Link href="/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1B5E20] -ml-2 sm:ml-0">
                View Full Audit Logs
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-3 sm:p-6 pt-0">
            {isAdminLoading ? (
              <SkeletonTableRows count={4} />
            ) : adminLogs.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F2A24]">No audit events recorded yet</h4>
                <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
                  System actions, status changes, and user management events will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F1F8F1]/60 text-xs font-semibold text-[#1F2A24] uppercase border-y border-[#D6DDD8]/60">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]/50">
                    {adminLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F6F8F6] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#1B5E20]">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#1F2A24]">
                          {log.actor?.name || "System"}
                          <span className="text-[10px] text-[#55645B] block font-normal">
                            {log.actor?.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] font-mono">
                          {log.entity}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] text-right">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Integrity & Security Status */}
        <div className="p-4 rounded-2xl bg-[#DCEFDD]/50 border border-[#1B5E20]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#123F17]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#1B5E20] shrink-0" />
            <span className="font-semibold">
              Security Architecture Enforced: Edge RBAC active • HTTP-Only Cookie Sessions • Immutable Audit Trail
            </span>
          </div>
          <span className="text-[11px] text-[#55645B]">
            MinSU DocTrack v1.0
          </span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // OPERATIONAL ROLES DASHBOARD (STAFF, ACCOUNTING, DIRECTOR)
  // -------------------------------------------------------------
  const submittedCount = documents.filter((d) => d.status === "SUBMITTED" || d.status === "RESUBMITTED").length;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;
  const transmittedCount = documents.filter((d) => d.status === "TRANSMITTED").length;
  const returnedCount = documents.filter((d) => d.status === "RETURNED").length;

  return (
    <div className="space-y-6">
      {/* Apple-style Welcome Glass Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-[#D6DDD8]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-[#1B5E20] tracking-tight">
              Welcome back, {user.name}
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#DCEFDD] text-[#123F17] shadow-xs">
              {user.role}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#55645B] mt-1.5 leading-relaxed">
            Mindoro State University • Tulong Dunong Program Annex Processing System
          </p>
        </div>

        {/* Primary Call to Action */}
        <div className="w-full sm:w-auto">
          {user.role === "DIRECTOR" && submittedCount > 0 && (
            <Link href="/review" className="block sm:inline-block w-full sm:w-auto">
              <Button variant="accent" size="md" className="w-full sm:w-auto shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Review Pending ({submittedCount})
              </Button>
            </Link>
          )}

          {(user.role === "STAFF" || user.role === "ACCOUNTING") && (
            <Link href="/documents/new" className="block sm:inline-block w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto shadow-sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Prepare New Annex
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards: Apple Rounded-2xl with Gentle Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Documents */}
        <Card className="rounded-2xl border border-[#D6DDD8]/80 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#55645B] uppercase tracking-wider">
                Total Documents
              </p>
              {isDocsLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg mt-1" />
              ) : (
                <h3 className="text-3xl font-extrabold font-heading text-[#1F2A24] mt-1 tracking-tight">
                  {documents.length}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCEFDD] to-[#F1F8F1] text-[#1B5E20] flex items-center justify-center shadow-xs border border-[#1B5E20]/10">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card className="rounded-2xl border border-[#F2B705]/40 bg-gradient-to-br from-white to-[#FFFDF5] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#B88A00] uppercase tracking-wider">
                Pending Review
              </p>
              {isDocsLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg mt-1" />
              ) : (
                <h3 className="text-3xl font-extrabold font-heading text-[#B88A00] mt-1 tracking-tight">
                  {submittedCount}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF1C2] to-[#FFF9E6] text-[#B88A00] flex items-center justify-center shadow-xs border border-[#F2B705]/20">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="rounded-2xl border border-[#2E7D32]/30 bg-gradient-to-br from-white to-[#F4FAF4] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wider">
                Approved
              </p>
              {isDocsLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg mt-1" />
              ) : (
                <h3 className="text-3xl font-extrabold font-heading text-[#2E7D32] mt-1 tracking-tight">
                  {approvedCount}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCEFDD] to-[#E9F6EA] text-[#2E7D32] flex items-center justify-center shadow-xs border border-[#2E7D32]/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Transmitted */}
        <Card className="rounded-2xl border border-[#123F17]/30 bg-gradient-to-br from-white to-[#F1F8F1] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#123F17] uppercase tracking-wider">
                Transmitted
              </p>
              {isDocsLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg mt-1" />
              ) : (
                <h3 className="text-3xl font-extrabold font-heading text-[#123F17] mt-1 tracking-tight">
                  {transmittedCount}
                </h3>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#123F17] to-[#1B5E20] text-white flex items-center justify-center shadow-xs border border-white/20">
              <Send className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue Alert for Director */}
      {user.role === "DIRECTOR" && submittedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF1C2]/60 backdrop-blur-md border border-[#F2B705]/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-[#B88A00] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm sm:text-base text-[#123F17]">
                Action Required: {submittedCount} Annex Document{submittedCount > 1 ? "s" : ""} Awaiting Review
              </p>
              <p className="text-xs text-[#55645B] mt-0.5">
                Staff have submitted annexes for your formal review and university endorsement.
              </p>
            </div>
          </div>
          <Link href="/review" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto shrink-0 shadow-sm">
              Open Review Queue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Returned Documents Alert for Preparer */}
      {(user.role === "STAFF" || user.role === "ACCOUNTING") && returnedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FDE8E7]/70 backdrop-blur-md border border-[#B3261E]/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm sm:text-base text-[#B3261E]">
                Attention: {returnedCount} Document{returnedCount > 1 ? "s" : ""} Returned for Revision
              </p>
              <p className="text-xs text-[#55645B] mt-0.5">
                The Director has requested updates. Please review the remarks and resubmit.
              </p>
            </div>
          </div>
          <Link href="/documents" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0 border-[#B3261E] text-[#B3261E]">
              View Returned
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Documents Card */}
      <Card className="rounded-3xl border border-[#D6DDD8]/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 gap-2 border-b border-[#D6DDD8]/50">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">Recent Annex Documents</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Latest TDP Annex submissions, reviews, and processing states
            </CardDescription>
          </div>
          <Link href="/documents">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1B5E20] -ml-2 sm:ml-0">
              View All Documents
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 pt-0">
          {isDocsLoading ? (
            <SkeletonTableRows count={4} />
          ) : documents.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#1F2A24]">No documents yet</h4>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Begin by preparing your first TDP Annex document using the template generator.
              </p>
              {(user.role === "STAFF" || user.role === "ACCOUNTING") && (
                <Link href="/documents/new">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Create First Annex
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards (visible < md) */}
              <div className="md:hidden divide-y divide-[#D6DDD8]/70">
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#123F17] bg-[#DCEFDD] px-2.5 py-0.5 rounded-full">
                        Annex {doc.annexType?.number}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="block font-semibold text-sm text-[#1F2A24] hover:text-[#1B5E20] leading-snug active:opacity-75 transition-opacity"
                    >
                      {doc.title}
                    </Link>
                    <div className="flex items-center justify-between text-[11px] text-[#55645B] pt-1">
                      <span>By: {doc.createdBy?.name}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (visible md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F1F8F1]/60 text-xs font-semibold text-[#1F2A24] uppercase border-y border-[#D6DDD8]/60">
                    <tr>
                      <th className="py-3 px-4">Annex #</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Prepared By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]/50">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#F6F8F6] transition-colors group">
                        <td className="py-3.5 px-4 font-bold text-[#1B5E20]">
                          Annex {doc.annexType?.number}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors">
                          {doc.title}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B]">
                          {doc.createdBy?.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B]">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="secondary" size="sm" className="h-7 text-xs font-medium">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
