"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/documents/status-badge";
import { Send, Search, ExternalLink, Eye, FileText, CheckCircle2 } from "lucide-react";
import { SkeletonTableRows } from "@/components/ui/skeleton";

export default function OutgoingDocumentsPage() {
  const { user } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchOutgoing() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          const outgoing = (data.documents || []).filter(
            (d: any) => d.status === "TRANSMITTED" || d.status === "ARCHIVED"
          );
          setDocuments(outgoing);
        }
      } catch (e) {
        console.error("Failed to load outgoing documents:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOutgoing();
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const titleMatch = doc.title.toLowerCase().includes(q);
      const recipientMatch = doc.transmittal?.recipient?.toLowerCase().includes(q);
      return titleMatch || recipientMatch;
    });
  }, [documents, searchQuery]);

  if (!user) return null;

  if (user.role === "SYSTEM_ADMIN" || user.role === "STUDENT") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Outgoing transmittals are managed by TDP Staff Coordinators and Accounting Officers.
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
              Outgoing Documents & Transmittals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              {documents.length} Dispatched
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Official log of all TDP Annexes submitted to external agencies (CHED, UniFAST, DBM) and recorded online.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
            <input
              type="text"
              placeholder="Search by recipient agency or document title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 w-full rounded-lg border border-[#D6DDD8] bg-white text-sm focus-visible:outline-none focus-visible:border-[#1B5E20]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Outgoing Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={5} />
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No outgoing transmittals recorded
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
                Approved documents will appear here once Staff marks them as transmitted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3.5 px-4">Annex</th>
                    <th className="py-3.5 px-4">Document Title</th>
                    <th className="py-3.5 px-4">Recipient Agency</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Dispatched Date</th>
                    <th className="py-3.5 px-4">Online Storage</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#F6F8F6] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[#1B5E20]">
                        Annex {doc.annexType?.number}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-semibold text-[#1F2A24] hover:text-[#1B5E20]"
                        >
                          {doc.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={doc.status} size="sm" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1F2A24]">
                        {doc.transmittal?.recipient || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs uppercase font-semibold text-[#55645B]">
                        {doc.transmittal?.method || "manual"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#55645B]">
                        {doc.transmittal?.sentAt
                          ? new Date(doc.transmittal.sentAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {doc.transmittal?.driveLink ? (
                          <a
                            href={doc.transmittal.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#1B5E20] hover:underline gap-1 font-medium"
                          >
                            Drive Link
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#55645B] italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/documents/${doc.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                        </Link>
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
