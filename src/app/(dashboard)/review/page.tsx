"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/documents/status-badge";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, ArrowRight, CheckCheck, FileText, Search, SearchX, RotateCcw } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { SortableTh } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function ReviewQueuePage() {
  const { user } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingDocs() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          const pending = (data.documents || []).filter(
            (d: any) => d.status === "SUBMITTED" || d.status === "RESUBMITTED"
          );
          setDocuments(pending);
        }
      } catch (e) {
        console.error("Failed to fetch pending review documents:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPendingDocs();
  }, []);

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
    paginatedItems: paginatedReviewDocs,
  } = useTable({
    data: documents,
    initialPageSize: 10,
    initialSortKey: "updatedAt",
    initialSortDirection: "desc",
    searchFields: [
      (d) => d.title,
      (d) => `Annex ${d.annexType?.number}`,
      (d) => d.annexType?.name,
      (d) => d.createdBy?.name,
      (d) => d.status,
    ],
    getSortValue: (doc, key) => {
      if (key === "annexNumber") return doc.annexType?.number || 0;
      if (key === "creator") return doc.createdBy?.name || "";
      if (key === "title") return doc.title || "";
      if (key === "status") return doc.status || "";
      if (key === "updatedAt") return doc.updatedAt || "";
      return undefined;
    },
  });

  if (!user) return null;

  if (user.role !== "DIRECTOR") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          The Review Queue is reserved for Campus Directors and Executive Reviewers.
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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Director Review Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00]">
              {documents.length} Pending
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Review submitted TDP Annexes, endorse with signature, or return with corrective feedback.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search by annex title, type, or preparer..."
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

      {/* Queue Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#D6DDD8]">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B88A00]" />
            Documents Awaiting Executive Review
          </CardTitle>
          <CardDescription>
            Click any row to open the complete document fields and record your approval decision.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={5} />
          ) : documents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <CheckCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                Review Queue is Clear!
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
                There are currently no annex documents pending Director review or endorsement.
              </p>
            </div>
          ) : paginatedReviewDocs.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#55645B] mx-auto mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No pending documents found matching &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Check for typos or reset your search term to see all review items.
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
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8] sticky top-0 z-10">
                    <tr>
                      <SortableTh
                        label="Annex"
                        sortKey="annexNumber"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="95px"
                      />
                      <SortableTh
                        label="Title"
                        sortKey="title"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="280px"
                      />
                      <SortableTh
                        label="Prepared By"
                        sortKey="creator"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="180px"
                      />
                      <SortableTh
                        label="Status"
                        sortKey="status"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="140px"
                      />
                      <SortableTh
                        label="Submitted At"
                        sortKey="updatedAt"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="150px"
                      />
                      <th className="py-3.5 px-4 text-right uppercase tracking-wider text-xs font-semibold text-[#1F2A24] min-w-[140px]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]">
                    {paginatedReviewDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-[#F6F8F6] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#1B5E20] whitespace-nowrap">
                          Annex {doc.annexType?.number}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-semibold text-[#1F2A24] hover:text-[#1B5E20] block break-words"
                          >
                            {doc.title}
                          </Link>
                          <span className="block text-xs text-[#55645B] line-clamp-1 mt-0.5">
                            {doc.annexType?.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="font-semibold text-[#1F2A24]">
                            {doc.createdBy?.name || "System"}
                          </div>
                          <div className="text-[#55645B]">
                            {doc.createdBy?.role || "Operational"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={doc.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B] tabular-nums whitespace-nowrap">
                          {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="accent" size="sm" className="h-8 text-xs font-semibold apple-press">
                              Review & Endorse
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
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
                itemLabel="documents"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
