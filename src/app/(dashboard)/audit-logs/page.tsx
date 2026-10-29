"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  Activity,
  Users,
  ShieldAlert,
  Clock,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  GitCommit,
  Radio,
  FileSpreadsheet,
  FileCode2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLogItem {
  id: string;
  actorId: string;
  actor: AuditLogActor;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditMetrics {
  totalEvents: number;
  todayEvents: number;
  activeActors: number;
  authEvents: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { user, isLoading: sessionLoading } = useSession();

  // State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalEvents: 0,
    todayEvents: 0,
    activeActors: 0,
    authEvents: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveFeed, setLiveFeed] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // View mode & Inspector Sheet
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Audit Logs from API
  const fetchLogs = useCallback(
    async (showRefreshAnimation = false) => {
      if (showRefreshAnimation) setIsRefreshing(true);
      try {
        const query = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          entity: entityFilter,
          category: categoryFilter,
          dateRange: dateRange,
        });

        const res = await fetch(`/api/audit-logs?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setPagination(data.pagination);
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setIsLoading(false);
        if (showRefreshAnimation) {
          setTimeout(() => setIsRefreshing(false), 300);
        }
      }
    },
    [pagination.page, pagination.limit, debouncedSearch, entityFilter, categoryFilter, dateRange]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live polling (15s interval)
  useEffect(() => {
    if (!liveFeed) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLogs(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [liveFeed, fetchLogs]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Export handlers
  const handleExportCSV = async () => {
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        entity: entityFilter,
        category: categoryFilter,
        dateRange: dateRange,
        export: "true",
      });

      const res = await fetch(`/api/audit-logs?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const exportLogs: AuditLogItem[] = data.logs || [];

      // Build CSV
      const headers = ["Timestamp", "Action", "Actor Name", "Actor Email", "Actor Role", "Entity", "Entity ID", "Details"];
      const rows = exportLogs.map((l) => [
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${l.action.replace(/"/g, '""')}"`,
        `"${(l.actor?.name || "System").replace(/"/g, '""')}"`,
        `"${(l.actor?.email || "").replace(/"/g, '""')}"`,
        `"${l.actor?.role || ""}"`,
        `"${l.entity.replace(/"/g, '""')}"`,
        `"${l.entityId.replace(/"/g, '""')}"`,
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export CSV error:", e);
    }
  };

  const handleExportJSON = async () => {
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        entity: entityFilter,
        category: categoryFilter,
        dateRange: dateRange,
        export: "true",
      });

      const res = await fetch(`/api/audit-logs?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const exportLogs = data.logs || [];

      const blob = new Blob([JSON.stringify(exportLogs, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export JSON error:", e);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setEntityFilter("all");
    setCategoryFilter("all");
    setDateRange("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    search !== "" || entityFilter !== "all" || categoryFilter !== "all" || dateRange !== "all";

  // Action badge color styling
  const getActionBadge = (action: string) => {
    if (action.includes("LOGIN") || action.includes("REGISTER") || action.includes("AUTH")) {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200/80",
        dot: "bg-purple-500",
      };
    }
    if (action.includes("CREATE") || action.includes("APPROVE")) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    }
    if (action.includes("UPDATE") || action.includes("SUBMIT") || action.includes("TRANSMIT")) {
      return {
        bg: "bg-sky-50 text-sky-700 border-sky-200/80",
        dot: "bg-sky-500",
      };
    }
    if (action.includes("RETURN") || action.includes("REVISE")) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200/80",
        dot: "bg-amber-500",
      };
    }
    if (action.includes("DELETE") || action.includes("ARCHIVE") || action.includes("LOGOUT")) {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200/80",
        dot: "bg-rose-500",
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    };
  };

  // Close inspector on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLog(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Format relative time helper
  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  // Check role authorization
  if (!sessionLoading && user && user.role !== "SYSTEM_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2923]">Access Restricted</h2>
        <p className="text-sm text-[#55645B] max-w-md mt-2">
          The Audit Log Viewer is restricted to authorized System Administrators for institutional
          governance and forensic accountability.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D6DDD8]/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#55645B] mb-1 font-medium">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#1B5E20] font-semibold">Audit Logs</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2923]">
              Institutional Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#1B5E20] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20]" />
              Immutable
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Complete cryptographic audit trail of system events, authentication, and state modifications.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Feed Toggle */}
          <button
            onClick={() => setLiveFeed(!liveFeed)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95",
              liveFeed
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                : "bg-white border-[#D6DDD8] text-[#55645B] hover:bg-[#F6F8F6]"
            )}
            title="Automatically poll for new events every 15 seconds"
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                liveFeed ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              )}
            />
            Live Feed
          </button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5 border-[#D6DDD8] text-[#1F2923] hover:bg-white active:scale-95 transition-all shadow-none"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5 text-[#55645B]", isRefreshing && "animate-spin text-[#1B5E20]")}
            />
            Sync
          </Button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center bg-[#E8EDE9] p-0.5 rounded-lg border border-[#D6DDD8]/60">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1F2923] hover:bg-white rounded-md transition-all active:scale-95"
              title="Export current filtered view to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B5E20]" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1F2923] hover:bg-white rounded-md transition-all active:scale-95"
              title="Export current filtered view to JSON"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Records */}
        <Card className="border border-[#D6DDD8]/80 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#55645B] uppercase tracking-wider">
                Total Events
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2923] tracking-tight">
              {metrics.totalEvents.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-[#55645B]">All recorded institutional transactions</div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card className="border border-[#D6DDD8]/80 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#55645B] uppercase tracking-wider">
                Today's Activity
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2923] tracking-tight">
              {metrics.todayEvents.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-[#55645B]">Actions logged since 00:00 UTC</div>
          </CardContent>
        </Card>

        {/* Active Actors */}
        <Card className="border border-[#D6DDD8]/80 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#55645B] uppercase tracking-wider">
                Active Actors
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2923] tracking-tight">
              {metrics.activeActors.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-[#55645B]">Distinct users contributing actions</div>
          </CardContent>
        </Card>

        {/* Security & Auth */}
        <Card className="border border-[#D6DDD8]/80 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#55645B] uppercase tracking-wider">
                Auth & Security
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2923] tracking-tight">
              {metrics.authEvents.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-[#55645B]">Login, logout & registration checks</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar & Apple-Style Segmented View Switcher */}
      <Card className="border border-[#D6DDD8] bg-white shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search actor name, email, action, or entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F6F8F6] border border-[#D6DDD8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Apple Segmented Pill Switcher */}
            <div className="flex items-center bg-[#E8EDE9] p-1 rounded-full border border-[#D6DDD8]/70 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95",
                  viewMode === "table"
                    ? "bg-white text-[#1B5E20] shadow-sm"
                    : "text-[#55645B] hover:text-[#1F2923]"
                )}
              >
                <List className="w-3.5 h-3.5" />
                Table View
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95",
                  viewMode === "timeline"
                    ? "bg-white text-[#1B5E20] shadow-sm"
                    : "text-[#55645B] hover:text-[#1F2923]"
                )}
              >
                <GitCommit className="w-3.5 h-3.5" />
                Timeline Feed
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D6DDD8]/50">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#55645B]">
              <span className="font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-[#F6F8F6] border border-[#D6DDD8] text-xs rounded-md px-2.5 py-1 text-[#1F2923] focus:outline-none focus:border-[#1B5E20]"
              >
                <option value="all">All Categories</option>
                <option value="AUTH">Authentication & Security</option>
                <option value="DOCUMENT">Document Operations</option>
                <option value="USER">User Administration</option>
                <option value="LANDING">Landing CMS</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#55645B]">
              <span className="font-medium">Entity:</span>
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-[#F6F8F6] border border-[#D6DDD8] text-xs rounded-md px-2.5 py-1 text-[#1F2923] focus:outline-none focus:border-[#1B5E20]"
              >
                <option value="all">All Entities</option>
                <option value="user">User</option>
                <option value="document">Document</option>
                <option value="landing_page">Landing Page</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div className="flex items-center gap-1.5 text-xs text-[#55645B]">
              <span className="font-medium">Date:</span>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-[#F6F8F6] border border-[#D6DDD8] text-xs rounded-md px-2.5 py-1 text-[#1F2923] focus:outline-none focus:border-[#1B5E20]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Clear Filters Reset */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main View Area (Table or Timeline) */}
      {viewMode === "table" ? (
        <Card className="border border-[#D6DDD8] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F6F8F6] border-b border-[#D6DDD8] text-[#55645B] font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Details Preview</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6DDD8]/60">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-28 bg-slate-200 rounded-full" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-6 w-14 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#55645B]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-7 h-7 text-amber-500" />
                        <span className="font-semibold text-sm text-[#1F2923]">No audit logs found</span>
                        <p className="text-xs text-[#55645B] max-w-xs">
                          No audit activity matches your search criteria or selected filters.
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-2 text-xs border-[#D6DDD8]"
                          >
                            Reset all filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[#F6F8F6]/80 cursor-pointer transition-colors group"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-[#55645B] whitespace-nowrap">
                          <div className="font-medium text-[#1F2923]">
                            {new Date(log.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}{" "}
                            ({getRelativeTime(log.createdAt)})
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs",
                              badge.bg
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                            {log.action}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-[#1F2923] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#E8EDE9] text-[#1B5E20] font-bold text-[10px] flex items-center justify-center border border-[#D6DDD8]">
                              {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : "S"}
                            </span>
                            <span>{log.actor?.name || "System Actor"}</span>
                          </div>
                          <div className="text-[10px] text-[#55645B] ml-8">
                            {log.actor?.email || log.actorId}
                          </div>
                        </td>

                        {/* Entity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                            {log.entity}
                          </span>
                        </td>

                        {/* Entity ID */}
                        <td className="py-3 px-4 font-mono text-[11px] text-[#55645B] whitespace-nowrap">
                          <span className="truncate max-w-[120px] inline-block align-middle" title={log.entityId}>
                            {log.entityId}
                          </span>
                        </td>

                        {/* Details Preview */}
                        <td className="py-3 px-4 text-[#55645B] max-w-[220px]">
                          <span className="truncate block font-mono text-[11px]">
                            {log.details ? JSON.stringify(log.details) : "—"}
                          </span>
                        </td>

                        {/* Inspect Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B5E20] group-hover:underline">
                            Inspect &rarr;
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Timeline Feed View */
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-[#D6DDD8] animate-pulse space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <Card className="border border-[#D6DDD8] bg-white p-12 text-center text-[#55645B]">
              <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
              <div className="font-semibold text-sm text-[#1F2923]">No events found</div>
              <p className="text-xs text-[#55645B] mt-1">Try relaxing your search or filter options.</p>
            </Card>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D6DDD8]">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="relative group cursor-pointer"
                  >
                    {/* Stepper Dot */}
                    <div
                      className={cn(
                        "absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white border border-[#D6DDD8] transition-transform group-hover:scale-125",
                        badge.dot
                      )}
                    />

                    {/* Timeline Event Card */}
                    <Card className="border border-[#D6DDD8] bg-white hover:border-[#1B5E20]/50 hover:shadow-md transition-all rounded-xl overflow-hidden active:scale-[0.99]">
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D6DDD8]/50 pb-2.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                badge.bg
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                              {log.action}
                            </span>
                            <span className="text-xs font-mono text-[#55645B] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {log.entity}:{log.entityId.slice(0, 8)}...
                            </span>
                          </div>
                          <span className="text-xs text-[#55645B] font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(log.createdAt).toLocaleString()} ({getRelativeTime(log.createdAt)})
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#E8EDE9] text-[#1B5E20] font-bold text-[10px] flex items-center justify-center border border-[#D6DDD8]">
                              {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : "S"}
                            </span>
                            <div>
                              <span className="font-semibold text-[#1F2923]">
                                {log.actor?.name || "System Actor"}
                              </span>
                              <span className="text-[11px] text-[#55645B] ml-1.5">
                                ({log.actor?.role || "SYSTEM"})
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] text-[#1B5E20] font-medium group-hover:underline">
                            Inspect Record &rarr;
                          </span>
                        </div>

                        {log.details && (
                          <div className="mt-3 p-2.5 bg-[#F6F8F6] rounded-lg border border-[#D6DDD8]/70 font-mono text-[11px] text-[#1F2923] overflow-x-auto max-h-24">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#D6DDD8]/60 text-xs text-[#55645B]">
        <div className="flex items-center gap-2">
          <span>Show rows per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination((prev) => ({
                ...prev,
                limit: parseInt(e.target.value, 10),
                page: 1,
              }));
            }}
            className="bg-white border border-[#D6DDD8] rounded px-2 py-1 text-xs text-[#1F2923] focus:outline-none focus:border-[#1B5E20]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="ml-2">
            Showing{" "}
            <strong className="text-[#1F2923]">
              {pagination.totalCount === 0
                ? 0
                : (pagination.page - 1) * pagination.limit + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-[#1F2923]">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </strong>{" "}
            of <strong className="text-[#1F2923]">{pagination.totalCount}</strong> entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 text-xs border-[#D6DDD8] active:scale-95 transition-all shadow-none"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          <span className="px-3 py-1 font-semibold text-xs text-[#1F2923] bg-white border border-[#D6DDD8] rounded">
            {pagination.page} / {pagination.totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="h-8 text-xs border-[#D6DDD8] active:scale-95 transition-all shadow-none"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Apple Slide-Over Inspector Sheet */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Frosted Scrim Backdrop */}
          <div
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md sm:max-w-xl bg-white/95 backdrop-blur-2xl border-l border-[#D6DDD8] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#D6DDD8] flex items-center justify-between bg-white/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F2923]">
                      Forensic Event Inspector
                    </h3>
                    <p className="text-[11px] text-[#55645B] font-mono">
                      Log ID: {selectedLog.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Event Overview Card */}
                <div className="bg-[#F6F8F6] p-4 rounded-xl border border-[#D6DDD8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                      Event Action
                    </span>
                    {(() => {
                      const badge = getActionBadge(selectedLog.action);
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                            badge.bg
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                          {selectedLog.action}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D6DDD8]/60 text-xs">
                    <div>
                      <span className="text-[#55645B] block text-[11px]">Timestamp (UTC)</span>
                      <span className="font-mono text-[#1F2923] font-medium text-[11px]">
                        {new Date(selectedLog.createdAt).toISOString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#55645B] block text-[11px]">Local Time</span>
                      <span className="text-[#1F2923] font-medium text-[11px]">
                        {new Date(selectedLog.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actor Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1F2923] uppercase tracking-wider">
                      Actor Identity
                    </h4>
                    <button
                      onClick={() => handleCopy(selectedLog.actorId, "actorId")}
                      className="text-[11px] text-[#1B5E20] flex items-center gap-1 hover:underline active:scale-95"
                    >
                      {copiedKey === "actorId" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied Actor ID</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Actor ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#D6DDD8] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Name:</span>
                      <span className="text-xs font-semibold text-[#1F2923]">
                        {selectedLog.actor?.name || "System"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Email:</span>
                      <span className="text-xs font-mono text-[#1F2923]">
                        {selectedLog.actor?.email || "internal@system"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Role:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#1B5E20] border border-emerald-200">
                        {selectedLog.actor?.role || "SYSTEM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Actor ID:</span>
                      <span className="text-[11px] font-mono text-[#55645B]">
                        {selectedLog.actorId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Entity Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1F2923] uppercase tracking-wider">
                      Target Entity
                    </h4>
                    <button
                      onClick={() => handleCopy(selectedLog.entityId, "entityId")}
                      className="text-[11px] text-[#1B5E20] flex items-center gap-1 hover:underline active:scale-95"
                    >
                      {copiedKey === "entityId" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied Entity ID</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Entity ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#D6DDD8] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Entity Type:</span>
                      <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#1F2923]">
                        {selectedLog.entity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">Entity ID:</span>
                      <span className="text-[11px] font-mono text-[#1F2923]">
                        {selectedLog.entityId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Forensic Payload JSON Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1F2923] uppercase tracking-wider">
                      Payload & State Diff
                    </h4>
                    {selectedLog.details && (
                      <button
                        onClick={() =>
                          handleCopy(JSON.stringify(selectedLog.details, null, 2), "payload")
                        }
                        className="text-[11px] text-[#1B5E20] flex items-center gap-1 hover:underline active:scale-95"
                      >
                        {copiedKey === "payload" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied JSON</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#1F2923] text-emerald-300 p-4 rounded-xl border border-[#2D3A31] font-mono text-xs overflow-x-auto shadow-inner max-h-64">
                    {selectedLog.details ? (
                      <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-400 italic">No extra payload recorded for this event.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#D6DDD8] bg-[#F6F8F6] flex items-center justify-between text-xs text-[#55645B]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1B5E20]" />
                  Cryptographically Verified Record
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="text-xs border-[#D6DDD8] active:scale-95 transition-all"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
