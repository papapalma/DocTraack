"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Search, SearchX, RotateCcw } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { useTable } from "@/hooks/use-table";
import { SortableTh } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    paginatedItems: paginatedApps,
  } = useTable({
    data: applications,
    initialPageSize: 10,
    initialSortKey: "submittedAt",
    initialSortDirection: "desc",
    searchFields: [
      (a) => a.call?.title,
      (a) => `Batch ${a.batchNumber}`,
      (a) => a.trackingCode,
      (a) => a.status,
    ],
    getSortValue: (app, key) => {
      if (key === "batchNumber") return Number(app.batchNumber || 1);
      if (key === "callTitle") return app.call?.title || "";
      if (key === "trackingCode") return app.trackingCode || "";
      if (key === "submittedAt") return app.submittedAt || "";
      if (key === "status") return app.status || "";
      return undefined;
    },
  });

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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40 whitespace-nowrap">
            Submitted / Queued
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30 whitespace-nowrap">
            Under Office Review
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B5E20] text-white whitespace-nowrap">
            Accepted / Awarded
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDE8E7] text-[#B3261E] whitespace-nowrap">
            Ineligible
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button variant="primary" size="sm" className="apple-press">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Apply to New Call
          </Button>
        </Link>
      </div>

      {/* Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search by program, tracking code, or status..."
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

      {/* Applications Table Card */}
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
                You haven&apos;t submitted any Annex 2 grant applications yet. Check available calls to apply.
              </p>
              <Link href="/portal">
                <Button variant="primary" size="sm" className="apple-press">
                  View Available Calls
                </Button>
              </Link>
            </div>
          ) : paginatedApps.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#55645B] mx-auto mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No applications found matching &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Check for typos or reset your search to see all of your submissions.
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
                <table className="w-full text-left text-sm min-w-[850px]">
                  <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8] sticky top-0 z-10">
                    <tr>
                      <SortableTh
                        label="Batch"
                        sortKey="batchNumber"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="100px"
                      />
                      <SortableTh
                        label="TDP Call Program"
                        sortKey="callTitle"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="260px"
                      />
                      <SortableTh
                        label="Tracking Reference"
                        sortKey="trackingCode"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="180px"
                      />
                      <SortableTh
                        label="Date Submitted"
                        sortKey="submittedAt"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="140px"
                      />
                      <SortableTh
                        label="Verification Status"
                        sortKey="status"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="160px"
                        align="right"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]">
                    {paginatedApps.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-[#F6F8F6] transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1B5E20] text-white tabular-nums">
                            Batch {app.batchNumber || 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#1F2A24] break-words">
                          {app.call?.title || "TDP Grant Call"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#1B5E20] tabular-nums whitespace-nowrap">
                          {app.trackingCode}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] tabular-nums whitespace-nowrap">
                          {new Date(app.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {getStatusBadge(app.status)}
                        </td>
                      </tr>
                    ))}
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
                itemLabel="applications"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
