"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle, Settings2, ExternalLink, Search, SearchX, RotateCcw } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { StateContainer, ErrorStateConfig } from "@/components/ui/state-container";
import { CreateCallModal } from "@/components/calls/create-call-modal";
import { CallDetailsModal, CallDetailsItem } from "@/components/calls/call-details-modal";
import { useTable } from "@/hooks/use-table";
import { SortableTh } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function CallsManagementPage() {
  const router = useRouter();
  const { user } = useSession();
  const [calls, setCalls] = useState<CallDetailsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<ErrorStateConfig | null>(null);

  // Modal Control States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallDetailsItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Table Search, Sort, and Pagination Hook
  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDirection,
    onSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems: paginatedCalls,
  } = useTable({
    data: calls,
    initialPageSize: 10,
    initialSortKey: "batchNumber",
    initialSortDirection: "desc",
    searchFields: [
      (c) => c.title,
      (c) => `Batch ${c.batchNumber}`,
      (c) => c.description,
      (c) => (c.isActive ? "Active Open" : "Closed"),
    ],
    getSortValue: (call, key) => {
      if (key === "applications") return call._count?.applications || 0;
      if (key === "windowStatus") {
        const now = new Date();
        const end = new Date(call.deadline);
        const start = call.startDate ? new Date(call.startDate) : null;
        if (!call.isActive || now > end) return 3;
        if (start && now < start) return 2;
        return 1;
      }
      return undefined;
    },
  });

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

  const handleSelectCall = (call: CallDetailsItem) => {
    setSelectedCall(call);
    setIsDetailsModalOpen(true);
  };

  const handleCallCreated = async () => {
    await loadCalls();
  };

  const handleCallUpdated = async () => {
    await loadCalls();
    if (selectedCall) {
      try {
        const res = await fetch(`/api/calls/${selectedCall.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.call) {
            setSelectedCall(data.call);
          }
        }
      } catch (err) {
        console.error("Error refreshing selected call:", err);
      }
    }
  };

  if (!user) return null;

  if (user.role !== "STAFF" && user.role !== "DIRECTOR") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Applicant calls are managed exclusively by TDP Staff Coordinators and Campus Directors.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const maxBatch = calls.reduce((max, c) => Math.max(max, c.batchNumber || 1), 0);
  const nextBatchNumber = maxBatch > 0 ? maxBatch + 1 : 1;

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
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="apple-press bg-[#1B5E20] hover:bg-[#25702A] text-white flex items-center gap-2 font-semibold shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Open New Call (Annex 2)
          </Button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search applicant calls by title, batch, or guidelines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 w-full rounded-xl border border-[#D6DDD8] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20] focus-visible:border-[#1B5E20] transition"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs h-9 text-[#B3261E] self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
              onAction: user.role === "STAFF" ? () => setIsCreateModalOpen(true) : undefined,
            }}
          >
            {paginatedCalls.length === 0 && calls.length > 0 ? (
              <div className="py-14 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#55645B] mx-auto mb-3">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#1F2A24]">
                  No applicant calls found matching &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                  Check your spelling or reset the search to view all applicant windows.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Clear Search
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[880px]">
                    <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8] sticky top-0 z-10">
                      <tr>
                        <SortableTh
                          label="Batch"
                          sortKey="batchNumber"
                          currentSortKey={sortKey}
                          currentDirection={sortDirection}
                          onSort={onSort}
                          minWidth="110px"
                        />
                        <SortableTh
                          label="Call Title"
                          sortKey="title"
                          currentSortKey={sortKey}
                          currentDirection={sortDirection}
                          onSort={onSort}
                          minWidth="280px"
                        />
                        <SortableTh
                          label="Intake Window"
                          sortKey="deadline"
                          currentSortKey={sortKey}
                          currentDirection={sortDirection}
                          onSort={onSort}
                          minWidth="180px"
                        />
                        <SortableTh
                          label="Applications"
                          sortKey="applications"
                          currentSortKey={sortKey}
                          currentDirection={sortDirection}
                          onSort={onSort}
                          minWidth="150px"
                        />
                        <SortableTh
                          label="Window Status"
                          sortKey="windowStatus"
                          currentSortKey={sortKey}
                          currentDirection={sortDirection}
                          onSort={onSort}
                          minWidth="140px"
                        />
                        <th className="py-3.5 px-4 text-right uppercase tracking-wider text-xs font-semibold text-[#1F2A24] min-w-[120px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D6DDD8]">
                      {paginatedCalls.map((call) => {
                        const now = new Date();
                        const start = call.startDate ? new Date(call.startDate) : null;
                        const end = new Date(call.deadline);
                        const isUpcoming = start ? now < start : false;
                        const isClosed = !call.isActive || now > end;
                        const isOpen = call.isActive && !isUpcoming && !isClosed;

                        return (
                          <tr
                            key={call.id}
                            onClick={() => handleSelectCall(call)}
                            className="hover:bg-[#F6F8F6] transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B5E20] text-white shadow-xs tabular-nums">
                                Batch {call.batchNumber || 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors break-words">
                                {call.title}
                              </p>
                              <p className="text-xs text-[#55645B] line-clamp-2 mt-0.5">
                                {call.description || "No specific guidelines provided."}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[#55645B] space-y-0.5 whitespace-nowrap">
                              {start && (
                                <p className="text-[11px] text-[#55645B] tabular-nums">
                                  <span className="font-semibold text-[#1F2A24]">Opens:</span>{" "}
                                  {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                              )}
                              <p className="text-[11px] text-[#55645B] tabular-nums">
                                <span className="font-semibold text-[#1F2A24]">Closes:</span>{" "}
                                {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-xs text-[#1B5E20] tabular-nums whitespace-nowrap">
                              {call._count?.applications || 0} Grantees Applied
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
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
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectCall(call);
                                  }}
                                  className="apple-press h-8 text-xs font-semibold text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#DCEFDD] flex items-center gap-1.5"
                                >
                                  <Settings2 className="w-3.5 h-3.5" />
                                  Manage
                                </Button>

                                <Link
                                  href={`/portal/calls/${call.id}`}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="apple-press h-8 text-xs font-semibold flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#55645B]" />
                                    Portal View
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="calls"
                />
              </>
            )}
          </StateContainer>
        </CardContent>
      </Card>

      {/* Modal 1: Create Call Modal */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCallCreated={handleCallCreated}
        defaultBatchNumber={nextBatchNumber}
      />

      {/* Modal 2: Call Details & Management Modal */}
      <CallDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCall(null);
        }}
        call={selectedCall}
        onCallUpdated={handleCallUpdated}
      />
    </div>
  );
}
