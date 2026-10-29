"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Megaphone, Calendar, ArrowRight, CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldCheck } from "lucide-react";

export default function StudentPortalHomePage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [myRegistration, setMyRegistration] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const [callsRes, regRes] = await Promise.all([
          fetch("/api/calls"),
          fetch("/api/registrations"),
        ]);

        if (callsRes.ok) {
          const data = await callsRes.json();
          setCalls(data.calls || []);
        }

        if (regRes.ok) {
          const regData = await regRes.json();
          setMyRegistration(regData.application || null);
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
                  <p className="text-xs text-[#55645B]">
                    Tracking Reference: <span className="font-mono font-bold text-[#1B5E20]">{myRegistration.trackingCode}</span>
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
                  <p className="text-xs text-[#55645B]">
                    Tracking Reference: <span className="font-mono font-bold text-[#1B5E20]">{myRegistration.trackingCode}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calls.map((call) => {
            const isDeadlinePassed = new Date(call.deadline) < new Date();
            return (
              <Card
                key={call.id}
                className="hover:border-[#1B5E20]/40 transition-colors flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCEFDD] text-[#123F17]">
                      Annex 2 Call
                    </span>
                    <span
                      className={`text-xs font-medium flex items-center gap-1 ${
                        isDeadlinePassed ? "text-[#B3261E]" : "text-[#B88A00]"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Deadline: {new Date(call.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-[#1F2A24]">
                    {call.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {call.description || "Official Call for Tulong Dunong Program Student Grantees."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="pt-4 border-t border-[#D6DDD8] flex items-center justify-between">
                    <span className="text-xs text-[#55645B]">
                      {call._count?.applications || 0} Applications Submitted
                    </span>

                    <Link href={`/portal/calls/${call.id}`}>
                      <Button
                        variant={isDeadlinePassed ? "secondary" : "primary"}
                        size="sm"
                        disabled={isDeadlinePassed}
                      >
                        {isDeadlinePassed ? "Call Closed" : "Apply Now"}
                        {!isDeadlinePassed && (
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        )}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
