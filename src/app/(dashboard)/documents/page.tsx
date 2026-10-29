"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/documents/status-badge";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { DocumentStatus } from "@/types";
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

export default function DocumentsPage() {
  const { user } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnex, setSelectedAnnex] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Search query
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.annexType?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Annex filter
      const matchesAnnex =
        selectedAnnex === "ALL" || doc.annexType?.number.toString() === selectedAnnex;

      // Status filter
      const matchesStatus =
        selectedStatus === "ALL" || doc.status === selectedStatus;

      return matchesSearch && matchesAnnex && matchesStatus;
    });
  }, [documents, searchQuery, selectedAnnex, selectedStatus]);

  if (!user) return null;

  if (user.role === "SYSTEM_ADMIN") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Annex documents are managed and reviewed exclusively by operational roles (Staff, Accounting, Director).
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
            TDP Annex Documents
          </h1>
          <p className="text-sm text-[#55645B] mt-0.5">
            Manage, review, track and transmit Annexes 1 through 10
          </p>
        </div>

        {(user.role === "STAFF" || user.role === "ACCOUNTING") && (
          <Link href="/documents/new">
            <Button variant="primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Prepare New Annex
            </Button>
          </Link>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search by title, preparer, annex..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 w-full rounded-lg border border-[#D6DDD8] bg-white text-sm focus-visible:outline-none focus-visible:border-[#1B5E20] focus-visible:ring-2 focus-visible:ring-[#1B5E20]/20"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Annex Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#55645B]">
                <Filter className="w-3.5 h-3.5" />
                <span>Annex:</span>
              </div>
              <select
                value={selectedAnnex}
                onChange={(e) => setSelectedAnnex(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#D6DDD8] bg-white text-xs font-medium text-[#1F2A24] focus-visible:outline-none"
              >
                <option value="ALL">All Annexes (1-10)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num.toString()}>
                    Annex {num}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#55645B] ml-2">
                <span>Status:</span>
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#D6DDD8] bg-white text-xs font-medium text-[#1F2A24] focus-visible:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="RESUBMITTED">Resubmitted</option>
                <option value="APPROVED">Approved</option>
                <option value="RETURNED">Returned</option>
                <option value="UPLOADED">Scan Uploaded</option>
                <option value="TRANSMITTED">Transmitted</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {(searchQuery || selectedAnnex !== "ALL" || selectedStatus !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedAnnex("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="text-xs h-9 text-[#B3261E]"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={6} />
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No documents found
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                {documents.length === 0
                  ? "There are currently no annex documents in the system."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {(user.role === "STAFF" || user.role === "ACCOUNTING") && (
                <Link href="/documents/new">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Prepare New Annex
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< md) */}
              <div className="md:hidden divide-y divide-[#D6DDD8] p-3">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#DCEFDD] text-[#123F17] font-bold text-xs">
                        Annex {doc.annexType?.number}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>

                    <div>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-semibold text-sm text-[#1F2A24] hover:text-[#1B5E20] transition-colors block leading-snug"
                      >
                        {doc.title}
                      </Link>
                      <p className="text-xs text-[#55645B] mt-0.5">
                        {doc.annexType?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#55645B] pt-1 border-t border-[#D6DDD8]/50">
                      <span>By: {doc.createdBy?.name} ({doc.createdBy?.role})</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <Link href={`/documents/${doc.id}`} className="block pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-8 text-xs font-medium justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Open Document
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                    <tr>
                      <th className="py-3.5 px-4">Annex</th>
                      <th className="py-3.5 px-4">Title & Description</th>
                      <th className="py-3.5 px-4">Prepared By</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Last Updated</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]">
                    {filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-[#F6F8F6] transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#DCEFDD] text-[#123F17] font-bold text-xs">
                            A{doc.annexType?.number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-semibold text-[#1F2A24] hover:text-[#1B5E20] transition-colors block"
                          >
                            {doc.title}
                          </Link>
                          <span className="text-xs text-[#55645B]">
                            {doc.annexType?.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-[#1F2A24]">
                            {doc.createdBy?.name}
                          </div>
                          <div className="text-[11px] text-[#55645B]">
                            {doc.createdBy?.role}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#55645B]">
                          {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/documents/${doc.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs font-medium"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Open
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
