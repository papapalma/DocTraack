"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Megaphone, Calendar, ArrowRight, CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldCheck, BellRing, Pin } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/page-transition";

export default function StudentPortalHomePage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [myRegistration, setMyRegistration] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const [callsRes, regRes, annRes] = await Promise.all([
          fetch("/api/calls"),
          fetch("/api/registrations"),
          fetch("/api/announcements?limit=2"),
        ]);

        if (callsRes.ok) {
          const data = await callsRes.json();
          setCalls(data.calls || []);
        }

        if (regRes.ok) {
          const regData = await regRes.json();
          setMyRegistration(regData.application || null);
        }

        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData.announcements || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortalData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Card for Newly Registered Students Without Active Applications */}
      {!myRegistration && !isLoading && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F1F8F1] to-white border border-[#1B5E20]/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#F2B705]" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-[#1B5E20]">
                Welcome to your MinSU Student Portal!
              </h3>
              <p className="text-xs text-[#55645B] mt-0.5 leading-relaxed max-w-xl">
                Your student profile is saved and locked with Microsoft Authenticator. Please browse the available scholarship calls below to manually submit your grant application.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Status Banner for Student */}
      {myRegistration && (
        <div>
          {myRegistration.status === "SUBMITTED" && (
            <div className="p-5 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/50 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2A24]">
                    Annex 1 Registration Status: Under Review by Staff
                  </h3>
                  <p className="text-xs text-[#55645B] flex items-center gap-2 mt-0.5">
                    <span>Tracking Reference: <strong className="font-mono text-[#1B5E20]">{myRegistration.trackingCode}</strong></span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#DCEFDD] text-[#123F17]">
                      Batch {myRegistration.batchNumber || 1}
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
                Your Annex 1 student registration has been received and is currently undergoing verification by the TDP Coordinator. Your account is in <strong>read-only mode</strong> until Staff validation is completed.
              </p>
            </div>
          )}

          {myRegistration.status === "ACCEPTED" && (
            <div className="p-5 rounded-xl bg-[#F5FAF5] border border-[#2E7D32]/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1B5E20]">
                    Annex 1 Registration Validated!
                  </h3>
                  <p className="text-xs text-[#55645B] flex items-center gap-2 mt-0.5">
                    <span>Tracking Reference: <strong className="font-mono text-[#1B5E20]">{myRegistration.trackingCode}</strong></span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#DCEFDD] text-[#123F17]">
                      Batch {myRegistration.batchNumber || 1}
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#1F2A24] pl-10 leading-relaxed">
                Congratulations! Your student registration details have been validated by Staff and included in the Annex 1 Masterlist submitted for Campus Director confirmation.
              </p>
            </div>
          )}

          {myRegistration.status === "REJECTED" && (
            <div className="p-5 rounded-xl bg-[#FDF7F7] border border-[#B3261E]/40 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FDE8E7] text-[#B3261E] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#B3261E]">
                    Annex 1 Registration Needs Correction / Rejected
                  </h3>
                  <p className="text-xs text-[#55645B]">
                    Tracking Reference: <span className="font-mono font-bold text-[#1F2A24]">{myRegistration.trackingCode}</span>
                  </p>
                </div>
              </div>
              {myRegistration.reviewComment && (
                <div className="ml-10 p-3 rounded-lg bg-white border border-[#B3261E]/30 text-xs">
                  <span className="font-bold text-[#B3261E] block mb-0.5">Staff Coordinator Feedback:</span>
                  <p className="text-[#1F2A24] font-medium italic">
                    &ldquo;{myRegistration.reviewComment}&rdquo;
                  </p>
                </div>
              )}
              <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
                Please contact the MinSU TDP Staff Coordinator at the Student Affairs & Services Office to rectify your details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Announcements Highlight Section for Students */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold text-[#1B5E20] flex items-center gap-1.5 uppercase tracking-wide">
              <BellRing className="w-4 h-4 text-[#B88A00]" />
              <span>Official Announcements</span>
            </h2>
            <Link
              href="/portal/announcements"
              className="text-xs font-bold text-[#1B5E20] hover:underline flex items-center gap-1 group"
            >
              <span>View all notices ({announcements.length})</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {announcements.map((item) => (
              <Link key={item.id} href="/portal/announcements" className="block group">
                <div
                  className={`p-4 rounded-xl border transition-all duration-200 bg-white hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col justify-between ${
                    item.isPinned
                      ? "border-[#F2B705] bg-gradient-to-br from-[#FFFDF5] to-white ring-1 ring-[#F2B705]/30"
                      : "border-[#D6DDD8]"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                            <Pin className="w-2.5 h-2.5 fill-[#B88A00]" />
                            Pinned
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DCEFDD] text-[#123F17]">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#55645B]">
                        {new Date(item.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#55645B] line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-2 text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1 mt-2 border-t border-neutral-100">
                    <span>Read full announcement</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
            Available TDP Grant Applications
          </h1>
          <p className="text-sm text-[#55645B] mt-1">
            Browse active calls for applicants, review guidelines, and submit your Annex 2 application online.
          </p>
        </div>
      </div>

      {/* Calls Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1F2A24]">
              No Active Calls at this Time
            </h3>
            <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
              The TDP Office has not opened any applicant calls right now. Please check back regularly for announcements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calls.map((call) => {
            const now = new Date();
            const start = call.startDate ? new Date(call.startDate) : null;
            const end = new Date(call.deadline);
            const isUpcoming = start ? now < start : false;
            const isClosed = now > end;
            const isOpen = !isUpcoming && !isClosed;
            const isAlreadyAccepted = myRegistration?.status === "ACCEPTED";

            return (
              <StaggerItem key={call.id}>
                <Card
                  className="hover:border-[#1B5E20]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full bg-white"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1B5E20] text-white">
                          Batch {call.batchNumber || 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCEFDD] text-[#123F17]">
                          Annex 2 Call
                        </span>
                      </div>

                      {isOpen && (
                        <span className="text-xs font-semibold text-[#1B5E20] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                          Open Window
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs font-semibold text-[#B88A00] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Upcoming
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-xs font-semibold text-[#B3261E] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Closed
                        </span>
                      )}
                    </div>

                    <CardTitle className="text-lg text-[#1F2A24]">
                      {call.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {call.description || "Official Call for Tulong Dunong Program Student Grantees."}
                    </CardDescription>

                    <div className="pt-2 text-[11px] text-[#55645B] space-y-0.5">
                      {start && (
                        <p>
                          <span className="font-semibold text-[#1F2A24]">Window Opens:</span>{" "}
                          {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold text-[#1F2A24]">Window Deadline:</span>{" "}
                        {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="pt-4 border-t border-[#D6DDD8] flex items-center justify-between">
                      <span className="text-xs text-[#55645B]">
                        {call._count?.applications || 0} Applications Submitted
                      </span>

                      {isAlreadyAccepted ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="text-xs font-semibold"
                        >
                          Already Accepted Grantee
                        </Button>
                      ) : isUpcoming ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="text-xs font-semibold"
                        >
                          Opens {start?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Button>
                      ) : isClosed ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="text-xs font-semibold"
                        >
                          Window Closed
                        </Button>
                      ) : (
                        <Link href={`/portal/calls/${call.id}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="apple-press text-xs font-semibold"
                          >
                            Apply for Batch {call.batchNumber || 1}
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
