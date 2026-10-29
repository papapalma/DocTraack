"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FileSpreadsheet,
  Send,
  Eye,
  Filter,
  Download,
  AlertTriangle,
  User,
  GraduationCap,
  MapPin,
  Calendar,
} from "lucide-react";

export default function RegistrationsValidationPage() {
  const { user } = useSession();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "SUBMITTED" | "ACCEPTED" | "REJECTED">("SUBMITTED");

  // Selected student for detail inspection
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Review action modal state
  const [reviewAction, setReviewAction] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Compile Annex 1 document modal state
  const [compileModalOpen, setCompileModalOpen] = useState(false);
  const [compileAgency, setCompileAgency] = useState("Commission on Higher Education (CHED) / UniFAST");
  const [compileAY, setCompileAY] = useState("A.Y. 2026-2027, 1st Semester");
  const [compileRemarks, setCompileRemarks] = useState("Official batch submission of validated student grantees for executive endorsement.");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/registrations");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Filtered list
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab !== "ALL" && app.status !== activeTab) {
        return false;
      }
      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const d = app.formData || {};
      const name = `${d.given_name || ""} ${d.last_name || ""} ${app.student?.name || ""}`.toLowerCase();
      const studentId = (d.student_id || "").toLowerCase();
      const course = (d.course_degree || "").toLowerCase();
      const code = (app.trackingCode || "").toLowerCase();
      return name.includes(q) || studentId.includes(q) || course.includes(q) || code.includes(q);
    });
  }, [applications, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "SUBMITTED").length;
    const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    return { total, pending, accepted, rejected };
  }, [applications]);

  // Handle Accept or Reject
  const handleConfirmReview = async () => {
    if (!selectedApp || !reviewAction) return;

    if (reviewAction === "REJECT" && !rejectComment.trim()) {
      setReviewError("Please provide a reason / comment explaining why the registration is rejected.");
      return;
    }

    setReviewError(null);
    setIsSubmittingReview(true);

    try {
      const res = await fetch(`/api/registrations/${selectedApp.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          comment: rejectComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
        setIsSubmittingReview(false);
        return;
      }

      // Refresh data
      await fetchRegistrations();
      setReviewAction(null);
      setRejectComment("");
      setSelectedApp(null);
    } catch {
      setReviewError("Network error occurred.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Compile into Annex 1 Document
  const handleCompileAnnex1 = async () => {
    setIsCompiling(true);
    setCompileSuccess(null);

    try {
      const res = await fetch("/api/annex-1/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAgency: compileAgency,
          academicYear: compileAY,
          remarks: compileRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to compile Annex 1 document");
        setIsCompiling(false);
        return;
      }

      setCompileSuccess(
        `Successfully compiled ${data.totalGrantees} accepted student grantees into Annex 1 Document: "${data.document.title}". It has been submitted directly to the Director Review Queue.`
      );
      await fetchRegistrations();
    } catch (err) {
      console.error(err);
      alert("Failed to compile Annex 1 document");
    } finally {
      setIsCompiling(false);
    }
  };

  if (!user) return null;

  if (user.role !== "STAFF" && user.role !== "DIRECTOR") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          This portal is reserved for TDP Staff Coordinators and Reviewers.
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
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Annex 1: Student Registrations & Validation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              {counts.total} Registered
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Validate incoming student registrations, approve candidates for the Annex 1 Masterlist, or reject with feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Excel Button */}
          <a href="/api/annex-1/export-excel" download>
            <Button variant="outline" size="sm" className="font-semibold border-[#1B5E20] text-[#1B5E20] hover:bg-[#F1F8F1]">
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#1B5E20]" />
              Export Excel (.xlsx)
            </Button>
          </a>

          {/* Compile to Annex 1 Document Button */}
          {user.role === "STAFF" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCompileSuccess(null);
                setCompileModalOpen(true);
              }}
              disabled={counts.accepted === 0}
              className="font-semibold shadow-xs"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Compile Annex 1 for Director ({counts.accepted})
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-[#D6DDD8] bg-white">
          <div className="flex items-center justify-between text-[#55645B] text-xs font-semibold">
            <span>Total Registered</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-[#1F2A24] mt-2">
            {counts.total}
          </div>
        </Card>

        <Card className="p-4 border-[#F2B705]/40 bg-[#FFFDF5]">
          <div className="flex items-center justify-between text-[#B88A00] text-xs font-semibold">
            <span>Pending Validation</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-[#B88A00] mt-2">
            {counts.pending}
          </div>
        </Card>

        <Card className="p-4 border-[#2E7D32]/30 bg-[#F5FAF5]">
          <div className="flex items-center justify-between text-[#1B5E20] text-xs font-semibold">
            <span>Accepted for Annex 1</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-[#1B5E20] mt-2">
            {counts.accepted}
          </div>
        </Card>

        <Card className="p-4 border-[#B3261E]/30 bg-[#FDF7F7]">
          <div className="flex items-center justify-between text-[#B3261E] text-xs font-semibold">
            <span>Needs Correction / Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-[#B3261E] mt-2">
            {counts.rejected}
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#D6DDD8] space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("SUBMITTED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "SUBMITTED"
                    ? "bg-white text-[#B88A00] shadow-xs font-bold"
                    : "text-[#55645B] hover:text-[#1F2A24]"
                }`}
              >
                Pending ({counts.pending})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ACCEPTED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ACCEPTED"
                    ? "bg-white text-[#1B5E20] shadow-xs font-bold"
                    : "text-[#55645B] hover:text-[#1F2A24]"
                }`}
              >
                Accepted ({counts.accepted})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("REJECTED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "REJECTED"
                    ? "bg-white text-[#B3261E] shadow-xs font-bold"
                    : "text-[#55645B] hover:text-[#1F2A24]"
                }`}
              >
                Rejected ({counts.rejected})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ALL"
                    ? "bg-white text-[#1F2A24] shadow-xs font-bold"
                    : "text-[#55645B] hover:text-[#1F2A24]"
                }`}
              >
                All ({counts.total})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search by student, ID, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 w-full rounded-lg border border-[#D6DDD8] bg-white text-xs focus-visible:outline-none focus-visible:border-[#1B5E20]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={5} />
          ) : filteredApps.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No Student Registrations Found
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
                There are currently no registrations matching this tab or search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F8F1] font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Full Name</th>
                    <th className="py-3 px-4">Degree Program & Year</th>
                    <th className="py-3 px-4">HEI UII & Campus</th>
                    <th className="py-3 px-4">Date Registered</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {filteredApps.map((app) => {
                    const d = app.formData || {};
                    const fullName = `${d.last_name ? d.last_name + ", " : ""}${d.given_name || app.student?.name || ""} ${d.ext_name || ""} ${d.middle_name || ""}`;

                    return (
                      <tr key={app.id} className="hover:bg-[#F6F8F6] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1B5E20]">
                          {d.student_id || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#1F2A24] text-xs">
                            {fullName}
                          </p>
                          <p className="text-[11px] text-[#55645B]">
                            {d.email || app.student?.email}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#1F2A24] line-clamp-1">
                            {d.course_degree || "N/A"}
                          </p>
                          <span className="text-[11px] text-[#55645B]">
                            Year Level {d.year_level || "1"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#55645B]">
                          <span className="font-mono font-bold text-[#1B5E20]">{d.hei_uii || "4060"}</span>
                          <span className="block text-[11px]">{d.hei_campus || "Main Campus (Alcate)"}</span>
                        </td>
                        <td className="py-3 px-4 text-[#55645B]">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {app.status === "SUBMITTED" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                              Pending Review
                            </span>
                          )}
                          {app.status === "ACCEPTED" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30">
                              Validated
                            </span>
                          )}
                          {app.status === "REJECTED" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDE8E7] text-[#B3261E] border border-[#B3261E]/30">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                            className="h-7 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#1B5E20]" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL INSPECTION MODAL */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          maxWidth="2xl"
          className="p-5 max-h-[90vh] overflow-y-auto"
          showCloseButton={true}
        >
          <div className="border-b border-[#D6DDD8] pb-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#DCEFDD] text-[#123F17] uppercase tracking-wide">
                Annex 1 Student Application
              </span>
              <span className="font-mono text-xs text-[#55645B]">
                Ref: {selectedApp.trackingCode}
              </span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-[#1B5E20] mt-1">
              {(selectedApp.formData?.last_name || "").toUpperCase()},{" "}
              {(selectedApp.formData?.given_name || "").toUpperCase()}{" "}
              {(selectedApp.formData?.ext_name || "").toUpperCase()}{" "}
              {(selectedApp.formData?.middle_name || "").toUpperCase()}
            </h2>
            <p className="text-xs text-[#55645B]">
              Student ID: <span className="font-mono font-bold text-[#1F2A24]">{selectedApp.formData?.student_id}</span> • Registered on {new Date(selectedApp.submittedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Rejection comment display if already rejected */}
          {selectedApp.status === "REJECTED" && selectedApp.reviewComment && (
            <div className="p-3 mb-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 text-xs text-[#B3261E] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Staff Rejection Feedback:
              </p>
              <p className="leading-relaxed pl-5 font-medium">
                &ldquo;{selectedApp.reviewComment}&rdquo;
              </p>
            </div>
          )}

          {/* Full Annex 1 Grid Preview */}
          <div className="space-y-4 text-xs">
            {/* Section 1: Profile & Degree */}
            <div className="p-3 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8] space-y-2">
              <span className="font-bold text-[#1B5E20] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Student Academic Profile
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#55645B] block text-[11px]">Degree Program:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.course_degree}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Year Level:</span>
                  <span className="font-semibold text-[#1F2A24]">Year {selectedApp.formData?.year_level}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Gender:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.gender}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Birthdate:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.birthdate}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">HEI UII:</span>
                  <span className="font-mono font-bold text-[#1B5E20]">{selectedApp.formData?.hei_uii || "4060"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#55645B] block text-[11px]">HEI Name:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.hei_name || "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY"}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Address & Contact */}
            <div className="p-3 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8] space-y-2">
              <span className="font-bold text-[#1B5E20] flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Permanent Address & Contact
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <span className="text-[#55645B] block text-[11px]">Street & Barangay:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.street_barangay}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Town / City:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.town_city}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Province:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.province}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Zipcode:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.zipcode}</span>
                </div>
                <div>
                  <span className="text-[#55645B] block text-[11px]">Contact Number:</span>
                  <span className="font-semibold text-[#1F2A24]">{selectedApp.formData?.contact_number}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Parents */}
            <div className="p-3 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8] space-y-2">
              <span className="font-bold text-[#1B5E20] flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Parental Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#D6DDD8] space-y-1">
                  <span className="text-[11px] text-[#1B5E20] block font-bold">Father&apos;s Information:</span>
                  <p className="font-bold text-[#1F2A24] text-xs">
                    {selectedApp.formData?.father_last_name}, {selectedApp.formData?.father_given_name} {selectedApp.formData?.father_middle_name || ""}
                  </p>
                  <p className="text-[11px] text-[#55645B]">
                    Contact: <strong className="text-[#1F2A24]">{selectedApp.formData?.father_contact_number || selectedApp.formData?.parent_contact_number || "Not provided"}</strong>
                  </p>
                  <p className="text-[11px] text-[#55645B]">
                    Email: <strong className="text-[#1F2A24]">{selectedApp.formData?.father_email || selectedApp.formData?.parent_email || "Not provided"}</strong>
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#D6DDD8] space-y-1">
                  <span className="text-[11px] text-[#1B5E20] block font-bold">Mother&apos;s Maiden Information:</span>
                  <p className="font-bold text-[#1F2A24] text-xs">
                    {selectedApp.formData?.mother_last_name}, {selectedApp.formData?.mother_given_name} {selectedApp.formData?.mother_middle_name || ""}
                  </p>
                  <p className="text-[11px] text-[#55645B]">
                    Contact: <strong className="text-[#1F2A24]">{selectedApp.formData?.mother_contact_number || "Not provided"}</strong>
                  </p>
                  <p className="text-[11px] text-[#55645B]">
                    Email: <strong className="text-[#1F2A24]">{selectedApp.formData?.mother_email || "Not provided"}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Actions for Staff */}
          {user.role === "STAFF" && (
            <div className="pt-4 mt-4 border-t border-[#D6DDD8] flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReviewAction("REJECT");
                    setReviewError(null);
                  }}
                  className="text-[#B3261E] border-[#B3261E]/40 hover:bg-[#FDE8E7]"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject / Needs Correction
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setReviewAction("ACCEPT");
                    setReviewError(null);
                  }}
                  className="font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Validate & Accept for Annex 1
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* CONFIRMATION / REJECTION COMMENT DIALOG */}
      {reviewAction && selectedApp && (
        <Modal
          isOpen={!!reviewAction}
          onClose={() => setReviewAction(null)}
          maxWidth="md"
          className="p-5"
          showCloseButton={true}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-heading font-bold text-[#1F2A24] flex items-center gap-2">
                {reviewAction === "ACCEPT" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                    Validate Student for Annex 1
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-[#B3261E]" />
                    Reject Student Registration
                  </>
                )}
              </h3>
              <p className="text-xs text-[#55645B] mt-1">
                Applicant: <strong>{selectedApp.formData?.given_name} {selectedApp.formData?.last_name}</strong> ({selectedApp.formData?.student_id})
              </p>
            </div>

            {reviewError && (
              <div className="p-3 rounded-lg bg-[#FDE8E7] text-xs text-[#B3261E] font-medium">
                {reviewError}
              </div>
            )}

            {reviewAction === "REJECT" ? (
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason" required className="text-xs font-semibold">
                  Feedback / Reason for Rejection (Visible to Student)
                </Label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  placeholder="e.g. Incomplete permanent address / Program name does not match registrar records. Please contact TDP coordinator."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full rounded-lg border border-[#D6DDD8] p-2.5 text-xs focus-visible:outline-none focus-visible:border-[#B3261E]"
                  required
                />
                <p className="text-[11px] text-[#55645B]">
                  An immediate in-app notification with this comment will be delivered to the student.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#F1F8F1] rounded-lg border border-[#DCEFDD] text-xs text-[#1F2A24] space-y-1">
                <p className="font-semibold text-[#1B5E20]">Endorsement Confirmation</p>
                <p className="text-[#55645B]">
                  This student will be marked as <strong>Validated</strong> and added to the official Annex 1 grantee candidate pool ready for Director endorsement.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#D6DDD8] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewAction(null)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === "ACCEPT" ? "primary" : "secondary"}
                size="sm"
                onClick={handleConfirmReview}
                isLoading={isSubmittingReview}
                className={reviewAction === "REJECT" ? "bg-[#B3261E] hover:bg-[#8F1D16] text-white" : ""}
              >
                {reviewAction === "ACCEPT" ? "Confirm & Validate" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPILE ANNEX 1 MODAL */}
      <Modal
        isOpen={compileModalOpen}
        onClose={() => setCompileModalOpen(false)}
        maxWidth="lg"
        className="p-5"
        showCloseButton={true}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-heading font-bold text-[#1B5E20] flex items-center gap-2">
              <Send className="w-5 h-5 text-[#1B5E20]" />
              Compile Official Annex 1 Document for Director
            </h3>
            <p className="text-xs text-[#55645B] mt-1">
              Package all {counts.accepted} validated student grantees into an official Annex 1 Document and submit directly to the Director Review Queue.
            </p>
          </div>

          {compileSuccess ? (
            <div className="p-4 rounded-xl bg-[#DCEFDD] border border-[#2E7D32]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#123F17] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                Annex 1 Successfully Submitted!
              </div>
              <p className="text-xs text-[#123F17] leading-relaxed">
                {compileSuccess}
              </p>
              <div className="pt-2">
                <Link href="/review">
                  <Button variant="primary" size="sm">
                    View in Director Review Queue
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="c-agency" required className="text-xs font-semibold">
                  Concerned Government Agency
                </Label>
                <Input
                  id="c-agency"
                  value={compileAgency}
                  onChange={(e) => setCompileAgency(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-ay" required className="text-xs font-semibold">
                  Academic Year & Semester
                </Label>
                <Input
                  id="c-ay"
                  value={compileAY}
                  onChange={(e) => setCompileAY(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-remarks" className="text-xs font-semibold">
                  Cover Letter & Endorsement Remarks
                </Label>
                <textarea
                  id="c-remarks"
                  rows={2}
                  value={compileRemarks}
                  onChange={(e) => setCompileRemarks(e.target.value)}
                  className="w-full rounded-lg border border-[#D6DDD8] p-2.5 text-xs focus-visible:outline-none"
                />
              </div>

              <div className="p-3 bg-[#F1F8F1] rounded-lg border border-[#DCEFDD] text-xs text-[#55645B]">
                Total Grantees Included: <strong className="text-[#1B5E20]">{counts.accepted} students</strong>
              </div>

              <div className="pt-3 border-t border-[#D6DDD8] flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompileModalOpen(false)}
                  disabled={isCompiling}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCompileAnnex1}
                  isLoading={isCompiling}
                  className="font-bold"
                >
                  Submit to Director
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
