"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/documents/status-badge";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, ArrowRight, CheckCheck, FileText } from "lucide-react";

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
          ) : (
            <>
              {/* Mobile Cards View (< md) */}
              <div className="md:hidden divide-y divide-[#D6DDD8] p-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1B5E20] bg-[#DCEFDD] px-2 py-0.5 rounded">
                        Annex {doc.annexType?.number}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>

                    <div>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-semibold text-sm text-[#1F2A24] hover:text-[#1B5E20] leading-snug block"
                      >
                        {doc.title}
                      </Link>
                      <p className="text-xs text-[#55645B] mt-0.5">
                        {doc.annexType?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#55645B] pt-1 border-t border-[#D6DDD8]/50">
                      <span>Prepared by: {doc.createdBy?.name}</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <Link href={`/documents/${doc.id}`} className="block pt-1">
                      <Button variant="accent" size="sm" className="w-full h-8 text-xs font-semibold justify-center">
                        Review & Endorse
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">Prepared By</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]">
                    {documents.map((doc) => (
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
                          <span className="block text-xs text-[#55645B]">
                            {doc.annexType?.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-[#1F2A24]">
                            {doc.createdBy?.name}
                          </div>
                          <div className="text-[#55645B]">
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
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="accent" size="sm" className="h-8 text-xs font-semibold">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
