"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Send, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { SkeletonForm } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import {
  isValidPhilippineMobile,
  isValidStudentId,
  isValidGWA,
  isValidIncome,
} from "@/lib/validation";

export default function StudentApplicationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();

  const [call, setCall] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    student_id_number: "",
    campus: "Main Campus (Alcate)",
    program_course: "",
    year_level: "1st Year",
    contact_number: "",
    family_monthly_income: "",
    latest_gwa: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Success Confirmation State
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  useEffect(() => {
    async function fetchCall() {
      try {
        const res = await fetch("/api/calls");
        if (res.ok) {
          const data = await res.json();
          const found = (data.calls || []).find((c: any) => c.id === id);
          setCall(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCall();
  }, [id]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAutoFillProfile = async () => {
    setIsAutofilling(true);
    setError(null);
    try {
      const res = await fetch("/api/registrations");
      if (!res.ok) {
        throw new Error("Could not retrieve registration profile.");
      }
      const data = await res.json();
      const reg = data.application?.formData;
      if (!reg) {
        setError("No registered profile found. Please fill in your details manually.");
        setIsAutofilling(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        student_id_number: reg.student_id || prev.student_id_number,
        campus: reg.hei_campus?.includes("Calapan")
          ? "Calapan City Campus"
          : reg.hei_campus?.includes("Bongabong")
          ? "Bongabong Campus"
          : "Main Campus (Alcate)",
        program_course: reg.course_degree || prev.program_course,
        year_level:
          reg.year_level === "1"
            ? "1st Year"
            : reg.year_level === "2"
            ? "2nd Year"
            : reg.year_level === "3"
            ? "3rd Year"
            : reg.year_level === "4"
            ? "4th Year"
            : prev.year_level,
        contact_number: reg.contact_number || prev.contact_number,
      }));

      // Clear related field errors
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.student_id_number;
        delete next.program_course;
        delete next.contact_number;
        return next;
      });

      setAutofillSuccess(true);
      setTimeout(() => setAutofillSuccess(false), 4000);
    } catch {
      setError("Unable to auto-fill profile details. Please fill manually.");
    } finally {
      setIsAutofilling(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanId = (formData.student_id_number || "").trim();
    if (!cleanId) {
      errors.student_id_number = "MinSU Student ID number is required.";
    } else if (!isValidStudentId(cleanId)) {
      errors.student_id_number = "Format must be 6-25 alphanumeric characters with hyphens (e.g. 2024-00123-BC).";
    }

    if (!formData.program_course?.trim()) {
      errors.program_course = "Degree Program / Course is required.";
    }

    const cleanPhone = (formData.contact_number || "").trim();
    if (!cleanPhone) {
      errors.contact_number = "Active mobile number is required.";
    } else if (!isValidPhilippineMobile(cleanPhone)) {
      errors.contact_number = "Must be a valid 11-digit Philippine mobile number (09XXXXXXXXX).";
    }

    const incomeCheck = isValidIncome(formData.family_monthly_income);
    if (!incomeCheck.valid) {
      errors.family_monthly_income = incomeCheck.message || "Monthly family gross income must be greater than 0.";
    }

    const gwaCheck = isValidGWA(formData.latest_gwa);
    if (!gwaCheck.valid) {
      errors.latest_gwa = gwaCheck.message || "GWA must be 1.00-3.00 (College scale) or 75-100 (Percentage scale).";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields before submitting.");
      return false;
    }

    setFieldErrors({});
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: id,
          formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error?.includes("Student ID")) {
          setFieldErrors((prev) => ({ ...prev, student_id_number: data.error }));
        }
        setError(data.error || "Failed to submit application.");
        setIsSubmitting(false);
        return;
      }

      setSubmittedApp(data.application);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <SkeletonForm fields={6} />
      </div>
    );
  }

  // Success Confirmation View
  if (submittedApp) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-xl mx-auto py-8"
      >
        <Card className="border-[#1B5E20] shadow-lg text-center p-8 bg-white space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1B5E20] text-white mx-auto mb-2">
              TDP Batch {submittedApp.batchNumber || call?.batchNumber || 1} Intake
            </div>
            <h2 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-[#55645B]">
              Your TDP Annex 2 application has been formally logged under <strong>Batch {submittedApp.batchNumber || call?.batchNumber || 1}</strong> in the MinSU DocTrack system.
            </p>
          </div>

          {/* Tracking Code Box */}
          <div className="p-4 rounded-xl bg-[#F1F8F1] border border-[#DCEFDD] space-y-1">
            <span className="text-xs uppercase font-semibold text-[#55645B] tracking-wider">
              Application Tracking Reference Code
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-[#1B5E20] tracking-wide select-all">
              {submittedApp.trackingCode}
            </div>
            <p className="text-[11px] text-[#55645B]">
              Keep this batch-assigned tracking code for your personal reference and campus status inquiries.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/portal/applications">
              <Button variant="primary" size="md" className="apple-press">
                View My Applications
              </Button>
            </Link>
            <Link href="/portal">
              <Button variant="outline" size="md" className="apple-press">
                Browse More Calls
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    );
  }

  const now = new Date();
  const start = call?.startDate ? new Date(call.startDate) : null;
  const end = call?.deadline ? new Date(call.deadline) : null;
  const isUpcoming = start ? now < start : false;
  const isClosed = end ? now > end : false;
  const isWindowOpen = !isUpcoming && !isClosed;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/portal">
        <Button variant="ghost" size="sm" className="text-xs text-[#55645B]">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Calls
        </Button>
      </Link>

      <Card className="bg-white">
        <CardHeader className="border-b border-[#D6DDD8] pb-4">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1B5E20] text-white">
                Batch {call?.batchNumber || 1}
              </span>
              <span className="font-semibold text-[#1B5E20] bg-[#DCEFDD] px-2 py-0.5 rounded text-[11px]">
                Annex 2 Application Form
              </span>
            </div>

            {call?.deadline && (
              <span className={`font-medium flex items-center gap-1 text-xs ${isClosed ? "text-[#B3261E]" : "text-[#B88A00]"}`}>
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {new Date(call.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
          <CardTitle className="text-xl">{call?.title || "TDP Grant Application"}</CardTitle>
          <CardDescription>{call?.description}</CardDescription>

          <div className="pt-2 text-[11px] text-[#55645B] space-y-0.5">
            {start && (
              <p>
                <span className="font-semibold text-[#1F2A24]">Intake Window Opens:</span>{" "}
                {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {end && (
              <p>
                <span className="font-semibold text-[#1F2A24]">Intake Window Closes:</span>{" "}
                {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isUpcoming && (
            <div className="p-4 mb-5 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/50 text-xs text-[#B88A00] font-medium space-y-1">
              <p className="font-bold text-[#1F2A24]">Application Window Not Open Yet</p>
              <p>This Batch {call?.batchNumber || 1} intake window opens on {start?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Submissions cannot be accepted prior to opening.</p>
            </div>
          )}

          {isClosed && (
            <div className="p-4 mb-5 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 text-xs text-[#B3261E] font-medium space-y-1">
              <p className="font-bold text-[#B3261E]">Application Window Closed</p>
              <p>The deadline for this Batch {call?.batchNumber || 1} intake window passed on {end?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Submissions are now locked.</p>
            </div>
          )}

          {error && (
            <div className="p-4 mb-5 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 text-xs text-[#B3261E] font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Fill From Verified Profile Banner */}
          <div className="p-3.5 mb-5 rounded-xl bg-[#F1F8F1] border border-[#DCEFDD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#B88A00]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F2A24]">
                  Registered Student Profile
                </p>
                <p className="text-[11px] text-[#55645B]">
                  Pre-populate your verified Student ID, campus, degree course, and contact number.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autofillSuccess && (
                <span className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1 bg-[#DCEFDD] px-2 py-1 rounded-md animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Profile Filled!
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoFillProfile}
                disabled={isAutofilling}
                className="apple-press text-xs font-semibold text-[#1B5E20] border-[#1B5E20]/30 shrink-0 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#B88A00]" />
                {isAutofilling ? "Loading Profile..." : "Fill from my profile"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="applicant_name">Applicant Full Name</Label>
                <Input id="applicant_name" value={user.name} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="applicant_email">Email Address</Label>
                <Input id="applicant_email" value={user.email} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="student_id_number" required>
                  MinSU Student ID Number
                </Label>
                <Input
                  id="student_id_number"
                  placeholder="e.g. 2023-01234-MC"
                  value={formData.student_id_number}
                  onChange={(e) => updateField("student_id_number", e.target.value)}
                  error={fieldErrors.student_id_number}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campus" required>
                  Campus Enrolled
                </Label>
                <select
                  id="campus"
                  value={formData.campus}
                  onChange={(e) => updateField("campus", e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
                >
                  <option value="Main Campus (Alcate)">Main Campus (Alcate)</option>
                  <option value="Calapan City Campus">Calapan City Campus</option>
                  <option value="Bongabong Campus">Bongabong Campus</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="program_course" required>
                  Degree Program / Course & Major
                </Label>
                <Input
                  id="program_course"
                  placeholder="e.g. Bachelor of Science in Information Technology"
                  value={formData.program_course}
                  onChange={(e) => updateField("program_course", e.target.value)}
                  error={fieldErrors.program_course}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="year_level" required>
                  Year Level
                </Label>
                <select
                  id="year_level"
                  value={formData.year_level}
                  onChange={(e) => updateField("year_level", e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact_number" required>
                  Active Mobile Number
                </Label>
                <Input
                  id="contact_number"
                  placeholder="e.g. 0917-123-4567"
                  value={formData.contact_number}
                  onChange={(e) => updateField("contact_number", e.target.value)}
                  error={fieldErrors.contact_number}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="family_income" required>
                  Monthly Family Gross Income (PHP)
                </Label>
                <Input
                  id="family_income"
                  type="number"
                  placeholder="e.g. 15000"
                  value={formData.family_monthly_income}
                  onChange={(e) => updateField("family_monthly_income", e.target.value)}
                  error={fieldErrors.family_monthly_income}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="latest_gwa" required>
                  Previous Semester GWA
                </Label>
                <Input
                  id="latest_gwa"
                  placeholder="e.g. 1.75 or 88.5"
                  value={formData.latest_gwa}
                  onChange={(e) => updateField("latest_gwa", e.target.value)}
                  error={fieldErrors.latest_gwa}
                  required
                />
                <span className="text-[11px] text-[#55645B]">
                  Accepts 1.00–3.00 (College scale) or 75–100 (Percentage scale)
                </span>
              </div>
            </div>

            {/* Confirmation & Pledge */}
            <div className="p-3 rounded-lg bg-[#F1F8F1] border border-[#DCEFDD] text-xs text-[#1F2A24] space-y-1 mt-4">
              <p className="font-semibold text-[#1B5E20]">Applicant Certification</p>
              <p className="text-[#55645B] leading-relaxed">
                By submitting this form, I solemnly certify that the information entered is accurate, true, and verifiable in official MinSU student records.
              </p>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="apple-press w-full mt-4"
              isLoading={isSubmitting}
              disabled={!isWindowOpen || isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isClosed
                ? "Window Closed"
                : isUpcoming
                ? "Window Not Open Yet"
                : `Submit Batch ${call?.batchNumber || 1} TDP Application`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
