"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Send, Calendar, ShieldCheck } from "lucide-react";
import { SkeletonForm } from "@/components/ui/skeleton";

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
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="max-w-xl mx-auto py-8">
        <Card className="border-[#1B5E20] shadow-lg text-center p-8 bg-white space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-[#55645B]">
              Your TDP Annex 2 application has been formally logged in the MinSU DocTrack system.
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
              Keep this tracking code for your personal reference and campus status inquiries.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/portal/applications">
              <Button variant="primary" size="md">
                View My Applications
              </Button>
            </Link>
            <Link href="/portal">
              <Button variant="outline" size="md">
                Browse More Calls
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/portal">
        <Button variant="ghost" size="sm" className="text-xs text-[#55645B]">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Calls
        </Button>
      </Link>

      <Card>
        <CardHeader className="border-b border-[#D6DDD8] pb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[#1B5E20] bg-[#DCEFDD] px-2 py-0.5 rounded">
              Annex 2 Application Form
            </span>
            {call?.deadline && (
              <span className="text-[#B88A00] font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {new Date(call.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
          <CardTitle className="text-xl">{call?.title || "TDP Grant Application"}</CardTitle>
          <CardDescription>{call?.description}</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="p-4 mb-5 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 text-xs text-[#B3261E] font-medium">
              {error}
            </div>
          )}

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
                  onChange={(e) =>
                    setFormData({ ...formData, student_id_number: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, campus: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, program_course: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, year_level: e.target.value })
                  }
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
                  placeholder="0917-123-4567"
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_number: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      family_monthly_income: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="latest_gwa" required>
                  Previous Semester GWA
                </Label>
                <Input
                  id="latest_gwa"
                  placeholder="e.g. 1.75"
                  value={formData.latest_gwa}
                  onChange={(e) =>
                    setFormData({ ...formData, latest_gwa: e.target.value })
                  }
                  required
                />
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
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit TDP Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
