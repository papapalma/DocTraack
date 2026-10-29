"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  GraduationCap,
  MapPin,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface ContinuousRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const HEI_OPTIONS = [
  {
    uii: "4060",
    name: "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
    campus: "Main Campus (Victoria / Alcate)",
  },
  {
    uii: "4163",
    name: "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-CALAPAN CITY CAMPUS",
    campus: "Calapan City Campus",
  },
  {
    uii: "4178",
    name: "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-BONGABONG CAMPUS",
    campus: "Bongabong Campus",
  },
];

const SECTIONS = [
  { id: 1, title: "Account & Credentials", icon: ShieldCheck },
  { id: 2, title: "Student Identification", icon: User },
  { id: 3, title: "Academic Profile & HEI", icon: GraduationCap },
  { id: 4, title: "Permanent Address & Contact", icon: MapPin },
  { id: 5, title: "Parental Information", icon: Users },
];

export function ContinuousRegistrationModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: ContinuousRegistrationModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2: Identification
    student_id: "",
    last_name: "",
    given_name: "",
    ext_name: "",
    middle_name: "",

    // Step 3: Profile & HEI
    gender: "M",
    birthdate: "",
    course_degree: "",
    year_level: "1",
    hei_uii: "4060",
    hei_name: "MINDORO STATE COLLEGE OF AGRICULTURE AND TECHNOLOGY-MAIN CAMPUS",
    hei_campus: "Main Campus (Victoria / Alcate)",

    // Step 4: Address & Contact
    street_barangay: "",
    town_city: "",
    province: "Oriental Mindoro",
    zipcode: "5200",
    contact_number: "",

    // Step 5: Parents
    father_last_name: "",
    father_given_name: "",
    father_middle_name: "",
    father_contact_number: "",
    father_email: "",
    mother_last_name: "",
    mother_given_name: "",
    mother_middle_name: "",
    mother_contact_number: "",
    mother_email: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);

    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please complete all account fields.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        setError("Password must contain both letters and numbers.");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.student_id.trim()) {
        setError("MinSU Student ID number is required.");
        return false;
      }
      if (!formData.last_name.trim() || !formData.given_name.trim()) {
        setError("Last Name and Given Name are required.");
        return false;
      }
    }

    if (step === 3) {
      if (!formData.course_degree.trim()) {
        setError("Please enter your complete Course / Degree program.");
        return false;
      }
      if (!formData.birthdate) {
        setError("Please enter your birthdate.");
        return false;
      }
    }

    if (step === 4) {
      if (!formData.street_barangay.trim() || !formData.town_city.trim() || !formData.province.trim()) {
        setError("Please provide your complete permanent address.");
        return false;
      }
      if (!formData.contact_number.trim()) {
        setError("Please enter an active contact number.");
        return false;
      }
    }

    if (step === 5) {
      if (!formData.father_last_name.trim() || !formData.mother_last_name.trim()) {
        setError("Please provide Father's last name and Mother's maiden last name.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, SECTIONS.length));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit Annex 1 registration.");
        setIsLoading(false);
        return;
      }

      onClose();
      router.push("/portal");
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      className="p-4 sm:p-6 max-h-[92vh] overflow-y-auto"
      showCloseButton={true}
    >
      {/* Header */}
      <div className="text-center pb-4 mb-4 border-b border-[#D6DDD8]/70 flex flex-col items-center">
        <Logo size="md" className="mb-2 shadow-xs" />
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DCEFDD] text-[#123F17] uppercase tracking-wide flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" />
            Official Annex 1 Form
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1B5E20] tracking-tight mt-1">
          TDP Student Portal Registration
        </h2>
        <p className="text-xs text-[#55645B] mt-0.5 max-w-md">
          Complete the continuous Annex 1 form below. Once registered, your application will be validated by the TDP Coordinator.
        </p>

        {/* Continuous Steps Indicator */}
        <div className="w-full mt-4 flex items-center justify-between gap-1 max-w-lg mx-auto">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isCompleted = currentStep > sec.id;
            const isCurrent = currentStep === sec.id;
            return (
              <div
                key={sec.id}
                className="flex-1 flex flex-col items-center cursor-pointer group"
                onClick={() => {
                  if (sec.id < currentStep) setCurrentStep(sec.id);
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#1B5E20] text-white"
                      : isCurrent
                      ? "bg-[#DCEFDD] text-[#123F17] border-2 border-[#1B5E20] shadow-sm"
                      : "bg-[#F1F8F1] text-[#55645B] border border-[#D6DDD8]"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold text-center truncate max-w-[70px] ${
                    isCurrent ? "text-[#1B5E20]" : "text-[#55645B]"
                  }`}
                >
                  {sec.title.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/30 text-xs text-[#B3261E] font-medium leading-relaxed">
          {error}
        </div>
      )}

      {/* Continuous Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* STEP 1: ACCOUNT & CREDENTIALS */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="border-b border-[#D6DDD8] pb-2">
              <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1B5E20]" />
                Step 1: Portal Login Account Credentials
              </h3>
              <p className="text-xs text-[#55645B]">
                Create the email and password you will use to check your application status.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-email" required className="text-xs font-semibold">
                Official Student Email Address
              </Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="student@minsu.edu.ph"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-pass" required className="text-xs font-semibold">
                  Password (min 8 chars, letters & numbers)
                </Label>
                <Input
                  id="reg-pass"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-confirm" required className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STUDENT IDENTIFICATION */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="border-b border-[#D6DDD8] pb-2">
              <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#1B5E20]" />
                Step 2: Student Identification & Official Name
              </h3>
              <p className="text-xs text-[#55645B]">
                As recorded in your official HEI / MinSU registrar credentials.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-id" required className="text-xs font-semibold">
                Student ID Number
              </Label>
              <Input
                id="reg-id"
                placeholder="e.g. 2023-01234-MC"
                value={formData.student_id}
                onChange={(e) => handleChange("student_id", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-last" required className="text-xs font-semibold">
                  Last Name
                </Label>
                <Input
                  id="reg-last"
                  placeholder="e.g. DELA CRUZ"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-given" required className="text-xs font-semibold">
                  Given Name
                </Label>
                <Input
                  id="reg-given"
                  placeholder="e.g. JUAN"
                  value={formData.given_name}
                  onChange={(e) => handleChange("given_name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-ext" className="text-xs font-semibold">
                  Ext. Name (e.g. Jr., III, N/A)
                </Label>
                <Input
                  id="reg-ext"
                  placeholder="e.g. JR. (leave blank if none)"
                  value={formData.ext_name}
                  onChange={(e) => handleChange("ext_name", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-mid" className="text-xs font-semibold">
                  Middle Name
                </Label>
                <Input
                  id="reg-mid"
                  placeholder="e.g. SANTOS"
                  value={formData.middle_name}
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ACADEMIC PROFILE & HEI */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="border-b border-[#D6DDD8] pb-2">
              <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#1B5E20]" />
                Step 3: Student Academic Profile & Higher Education Institution
              </h3>
              <p className="text-xs text-[#55645B]">
                Academic program, enrolled campus, and demographic data for Annex 1.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-gender" required className="text-xs font-semibold">
                  Gender (M/F/or specify)
                </Label>
                <select
                  id="reg-gender"
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="Non-Binary">Non-Binary / Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-bday" required className="text-xs font-semibold">
                  Birthdate (d/mm/yyyy)
                </Label>
                <Input
                  id="reg-bday"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleChange("birthdate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="reg-course" required className="text-xs font-semibold">
                  Complete Name of Course / Degree Program
                </Label>
                <Input
                  id="reg-course"
                  placeholder="e.g. Bachelor of Science in Information Technology"
                  value={formData.course_degree}
                  onChange={(e) => handleChange("course_degree", e.target.value)}
                  required
                />
                <span className="text-[11px] text-[#55645B]">
                  Should be consistent with your HEI registrar record.
                </span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-year" required className="text-xs font-semibold">
                  Year Level (1/2/3/4/5)
                </Label>
                <select
                  id="reg-year"
                  value={formData.year_level}
                  onChange={(e) => handleChange("year_level", e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="reg-hei" required className="text-xs font-semibold">
                  Higher Education Institution (HEI UII & Name)
                </Label>
                <select
                  id="reg-hei"
                  value={formData.hei_uii}
                  onChange={(e) => {
                    const selected = HEI_OPTIONS.find((h) => h.uii === e.target.value);
                    if (selected) {
                      setFormData((prev) => ({
                        ...prev,
                        hei_uii: selected.uii,
                        hei_name: selected.name,
                        hei_campus: selected.campus,
                      }));
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:border-[#1B5E20]"
                >
                  {HEI_OPTIONS.map((hei) => (
                    <option key={hei.uii} value={hei.uii}>
                      {hei.uii} — {hei.name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#55645B] bg-[#F1F8F1] px-2.5 py-1 rounded-md border border-[#DCEFDD]">
                  <span>HEI UII: <strong className="font-mono text-[#1B5E20]">{formData.hei_uii}</strong></span>
                  <span>Campus: <strong className="text-[#1F2A24]">{formData.hei_campus}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PERMANENT ADDRESS & CONTACT */}
        {currentStep === 4 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="border-b border-[#D6DDD8] pb-2">
              <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1B5E20]" />
                Step 4: Permanent Address & Contact Details
              </h3>
              <p className="text-xs text-[#55645B]">
                Your home address and mobile number for verification and transmittal.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-street" required className="text-xs font-semibold">
                Street & Barangay
              </Label>
              <Input
                id="reg-street"
                placeholder="e.g. Sitio Ilang-Ilang, Brgy. Masipit"
                value={formData.street_barangay}
                onChange={(e) => handleChange("street_barangay", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-town" required className="text-xs font-semibold">
                  Town / City / Muni
                </Label>
                <Input
                  id="reg-town"
                  placeholder="e.g. Calapan City"
                  value={formData.town_city}
                  onChange={(e) => handleChange("town_city", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-prov" required className="text-xs font-semibold">
                  Province
                </Label>
                <Input
                  id="reg-prov"
                  placeholder="e.g. Oriental Mindoro"
                  value={formData.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-zip" required className="text-xs font-semibold">
                  Zipcode
                </Label>
                <Input
                  id="reg-zip"
                  placeholder="e.g. 5200"
                  value={formData.zipcode}
                  onChange={(e) => handleChange("zipcode", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-contact" required className="text-xs font-semibold">
                Contact Number (Active Mobile)
              </Label>
              <Input
                id="reg-contact"
                placeholder="e.g. 0917-123-4567"
                value={formData.contact_number}
                onChange={(e) => handleChange("contact_number", e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* STEP 5: PARENTAL INFORMATION */}
        {currentStep === 5 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="border-b border-[#D6DDD8] pb-2">
              <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1B5E20]" />
                Step 5: Parental Information
              </h3>
              <p className="text-xs text-[#55645B]">
                Father&apos;s full name and Mother&apos;s maiden name as required by Annex 1.
              </p>
            </div>

            {/* Father's Info */}
            <div className="p-3.5 bg-[#F1F8F1] rounded-xl border border-[#DCEFDD] space-y-2.5">
              <span className="text-xs font-bold text-[#1B5E20] block">
                Father&apos;s Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Last Name"
                  value={formData.father_last_name}
                  onChange={(e) => handleChange("father_last_name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Given Name"
                  value={formData.father_given_name}
                  onChange={(e) => handleChange("father_given_name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Middle Name (Optional)"
                  value={formData.father_middle_name}
                  onChange={(e) => handleChange("father_middle_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="reg-father-contact" className="text-[11px] font-semibold text-[#1F2A24]">
                    Father&apos;s Contact Number
                  </Label>
                  <Input
                    id="reg-father-contact"
                    placeholder="e.g. 0918-123-4567"
                    value={formData.father_contact_number}
                    onChange={(e) => handleChange("father_contact_number", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-father-email" className="text-[11px] font-semibold text-[#1F2A24]">
                    Father&apos;s Email Address
                  </Label>
                  <Input
                    id="reg-father-email"
                    type="email"
                    placeholder="father@example.com"
                    value={formData.father_email}
                    onChange={(e) => handleChange("father_email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Mother's Info */}
            <div className="p-3.5 bg-[#F1F8F1] rounded-xl border border-[#DCEFDD] space-y-2.5">
              <span className="text-xs font-bold text-[#1B5E20] block">
                Mother&apos;s Maiden Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Maiden Last Name"
                  value={formData.mother_last_name}
                  onChange={(e) => handleChange("mother_last_name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Given Name"
                  value={formData.mother_given_name}
                  onChange={(e) => handleChange("mother_given_name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Maiden Middle Name"
                  value={formData.mother_middle_name}
                  onChange={(e) => handleChange("mother_middle_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="reg-mother-contact" className="text-[11px] font-semibold text-[#1F2A24]">
                    Mother&apos;s Contact Number
                  </Label>
                  <Input
                    id="reg-mother-contact"
                    placeholder="e.g. 0919-876-5432"
                    value={formData.mother_contact_number}
                    onChange={(e) => handleChange("mother_contact_number", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-mother-email" className="text-[11px] font-semibold text-[#1F2A24]">
                    Mother&apos;s Email Address
                  </Label>
                  <Input
                    id="reg-mother-email"
                    type="email"
                    placeholder="mother@example.com"
                    value={formData.mother_email}
                    onChange={(e) => handleChange("mother_email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FFF1C2]/60 rounded-xl border border-[#F2B705]/40 text-xs text-[#1F2A24] space-y-1">
              <p className="font-semibold text-[#B88A00]">Applicant Declaration</p>
              <p className="text-[#55645B] leading-relaxed">
                By submitting this Annex 1 registration, I hereby swear that all information provided is accurate and authentic.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#D6DDD8] flex items-center justify-between gap-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Previous Section
            </Button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-[#1B5E20] font-semibold hover:underline"
            >
              Already registered? Sign in
            </button>
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
            >
              Next Section
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="font-bold shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Submit Annex 1 Registration
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
