"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  GraduationCap,
  MapPin,
  Users,
  BadgePercent,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldCheck,
  Calendar,
  Sparkles,
  Bell,
  BellRing,
  Radio,
  Clock,
  KeyRound,
} from "lucide-react";
import { SkeletonForm } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { AuthenticatorLockStep } from "@/components/auth/authenticator-lock-step";
import { motion, AnimatePresence } from "motion/react";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  displayBrowserNotification,
} from "@/lib/client-notifications";
import {
  isValidPhilippineMobile,
  isValidStudentId,
  isValidPersonName,
  isValidGWA,
  isValidIncome,
} from "@/lib/validation";

type TabKey = "academic" | "contact" | "family" | "financial" | "notifications" | "security";

const TABS: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "academic", label: "Personal & Academic", icon: GraduationCap },
  { id: "contact", label: "Contact & Residence", icon: MapPin },
  { id: "family", label: "Parental Background", icon: Users },
  { id: "financial", label: "Scholarship & Grants", icon: BadgePercent },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "security", label: "Security & Authenticator", icon: ShieldCheck },
];

export default function StudentProfilePage() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("academic");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Notification Preferences States
  const [notifyAnnouncements, setNotifyAnnouncements] = useState<boolean>(true);
  const [notifyPush, setNotifyPush] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [testPushSent, setTestPushSent] = useState<boolean>(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);
  const [prefsSuccess, setPrefsSuccess] = useState<boolean>(false);

  // Setup modal for Microsoft Authenticator
  const [setupModalData, setSetupModalData] = useState<any | null>(null);
  const [isGeneratingSetup, setIsGeneratingSetup] = useState(false);

  // Auto-switch to tab from query params (e.g. ?tab=notifications)
  useEffect(() => {
    const tabParam = searchParams?.get("tab") as TabKey | null;
    if (tabParam && ["academic", "contact", "family", "financial", "notifications", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Original profile from server for diff/revert
  const [originalProfile, setOriginalProfile] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLockedStudentId, setIsLockedStudentId] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setNotifyAnnouncements(data.notifyAnnouncements ?? true);
          setNotifyPush(data.notifyPush ?? false);
        }
      } catch (e) {
        console.error("Error loading user preferences:", e);
      }
      setPushPermission(getBrowserNotificationPermission());
    }
    loadPreferences();
  }, []);

  const handleSavePreferences = async (ann: boolean, push: boolean) => {
    try {
      setIsSavingPrefs(true);
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyAnnouncements: ann, notifyPush: push }),
      });
      if (res.ok) {
        setPrefsSuccess(true);
        setTimeout(() => setPrefsSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleToggleAnnouncements = () => {
    const nextVal = !notifyAnnouncements;
    setNotifyAnnouncements(nextVal);
    handleSavePreferences(nextVal, notifyPush);
  };

  const handleEnablePush = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      setNotifyPush(true);
      await handleSavePreferences(notifyAnnouncements, true);
      displayBrowserNotification("MinSU DocTrack Notifications Enabled!", {
        body: "You will now receive desktop alerts for TDP announcements and schedules.",
      });
      setTestPushSent(true);
      setTimeout(() => setTestPushSent(false), 3000);
    } else {
      setNotifyPush(false);
      await handleSavePreferences(notifyAnnouncements, false);
    }
  };

  const handleTogglePush = () => {
    if (pushPermission !== "granted") {
      handleEnablePush();
      return;
    }
    const nextVal = !notifyPush;
    setNotifyPush(nextVal);
    handleSavePreferences(notifyAnnouncements, nextVal);
  };

  const handleSendTestPush = () => {
    const success = displayBrowserNotification("🔔 MinSU TDP Test Alert", {
      body: "This is a test notification from MinSU DocTrack. Your desktop alerts are configured properly!",
    });
    if (success) {
      setTestPushSent(true);
      setTimeout(() => setTestPushSent(false), 3000);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/registrations");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || {};
          setOriginalProfile(p);
          setFormData(p);
          setIsLockedStudentId(!!data.isLockedStudentId);
          setApplications(data.allApplications || (data.application ? [data.application] : []));
        } else {
          setErrorMessage("Failed to load student profile details.");
        }
      } catch (e) {
        console.error(e);
        setErrorMessage("Network error loading profile details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReset = () => {
    setFormData(originalProfile);
    setFieldErrors({});
    setErrorMessage(null);
    setSaveSuccess(false);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Student ID
    const studentId = (formData.student_id || formData.student_id_number || "").trim();
    if (!studentId) {
      errors.student_id = "Student ID number is required.";
    } else if (!isValidStudentId(studentId)) {
      errors.student_id = "Must be a valid MinSU ID (e.g. 2024-00123-BC).";
    }

    // Names
    if (formData.given_name && !isValidPersonName(formData.given_name)) {
      errors.given_name = "Given name contains invalid characters.";
    }
    if (formData.last_name && !isValidPersonName(formData.last_name)) {
      errors.last_name = "Last name contains invalid characters.";
    }

    // Contact
    if (formData.contact_number && !isValidPhilippineMobile(formData.contact_number)) {
      errors.contact_number = "Must be a valid 11-digit mobile number (09XXXXXXXXX).";
    }

    // Parent Contacts
    if (formData.father_contact_number && !isValidPhilippineMobile(formData.father_contact_number)) {
      errors.father_contact_number = "Must be a valid 11-digit mobile number (09XXXXXXXXX).";
    }
    if (formData.mother_contact_number && !isValidPhilippineMobile(formData.mother_contact_number)) {
      errors.mother_contact_number = "Must be a valid 11-digit mobile number (09XXXXXXXXX).";
    }

    // Financials
    if (formData.family_monthly_income !== undefined && formData.family_monthly_income !== "") {
      const incCheck = isValidIncome(formData.family_monthly_income);
      if (!incCheck.valid) {
        errors.family_monthly_income = incCheck.message || "Income must be greater than 0.";
      }
    }

    if (formData.latest_gwa !== undefined && formData.latest_gwa !== "") {
      const gwaCheck = isValidGWA(formData.latest_gwa);
      if (!gwaCheck.valid) {
        errors.latest_gwa = gwaCheck.message || "GWA must be 1.00-3.00 or 75-100.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please correct the highlighted fields before saving.");
      return false;
    }

    setFieldErrors({});
    setErrorMessage(null);
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile.");
        setIsSaving(false);
        return;
      }

      setOriginalProfile(data.profile || formData);
      setFormData(data.profile || formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch {
      setErrorMessage("A network error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonForm fields={8} />
      </div>
    );
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalProfile);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#D6DDD8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center font-heading font-bold text-lg shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "ST"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1F2A24]">
                {formData.given_name || formData.last_name
                  ? `${formData.given_name || ""} ${formData.last_name || ""}`.trim()
                  : user?.name}
              </h1>
              {isLockedStudentId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#2E7D32]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B5E20]" />
                  Verified Grantee
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                  <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
                  Editable Profile
                </span>
              )}
            </div>
            <p className="text-xs text-[#55645B] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Student ID: <strong className="font-mono text-[#1B5E20]">{formData.student_id || formData.student_id_number || "Not set"}</strong></span>
              <span>•</span>
              <span>{formData.campus || "MinSU"}</span>
              <span>•</span>
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="apple-press text-xs text-[#55645B]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
            className="apple-press text-xs font-semibold shadow-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-4 rounded-xl bg-[#DCEFDD] border border-[#2E7D32]/30 flex items-center justify-between text-xs text-[#123F17]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" />
              <span className="font-semibold">Student profile successfully updated and synchronized across all applications!</span>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 flex items-center gap-2 text-xs text-[#B3261E]"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Control / Navigation */}
      <div className="bg-white p-1.5 rounded-xl border border-[#D6DDD8] shadow-xs flex overflow-x-auto gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all select-none apple-press ${
                isActive
                  ? "text-[#1B5E20] shadow-xs"
                  : "text-[#55645B] hover:text-[#1F2A24] hover:bg-[#F6F8F6]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute inset-0 bg-[#F1F8F1] border border-[#DCEFDD] rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Personal & Academic Info */}
        {activeTab === "academic" && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card className="bg-white">
              <CardHeader className="border-b border-[#D6DDD8] pb-4">
                <CardTitle className="text-lg">Personal & Academic Identification</CardTitle>
                <CardDescription>
                  Your official identity registered under the Tulong Dunong Program.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isLockedStudentId && (
                  <div className="p-3 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/50 flex items-start gap-2.5 text-xs text-[#B88A00]">
                    <Lock className="w-4 h-4 text-[#B88A00] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#1F2A24]">Student ID Number Locked</p>
                      <p className="text-[11px] text-[#55645B]">
                        Your Student ID has been validated by Staff and included in official Masterlists. It cannot be altered online to preserve official university accreditation.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="student_id" required>
                      MinSU Student ID Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="student_id"
                        value={formData.student_id || formData.student_id_number || ""}
                        onChange={(e) => updateField("student_id", e.target.value)}
                        disabled={isLockedStudentId}
                        placeholder="e.g. 2024-00123-BC"
                        error={fieldErrors.student_id}
                        className={isLockedStudentId ? "bg-[#F6F8F6] text-[#55645B] cursor-not-allowed pr-9 font-mono" : "font-mono"}
                        required
                      />
                      {isLockedStudentId && (
                        <Lock className="w-4 h-4 text-[#55645B] absolute right-3 top-3" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="campus" required>
                      Campus Enrolled
                    </Label>
                    <select
                      id="campus"
                      value={formData.campus || formData.hei_campus || "Main Campus (Alcate)"}
                      onChange={(e) => {
                        updateField("campus", e.target.value);
                        updateField("hei_campus", e.target.value);
                      }}
                      className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition"
                    >
                      <option value="Main Campus (Alcate)">Main Campus (Alcate)</option>
                      <option value="Calapan City Campus">Calapan City Campus</option>
                      <option value="Bongabong Campus">Bongabong Campus</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="given_name" required>
                      Given / First Name
                    </Label>
                    <Input
                      id="given_name"
                      value={formData.given_name || ""}
                      onChange={(e) => updateField("given_name", e.target.value)}
                      placeholder="e.g. Juan"
                      error={fieldErrors.given_name}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name || ""}
                      onChange={(e) => updateField("middle_name", e.target.value)}
                      placeholder="e.g. Santos (leave blank if none)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" required>
                      Last / Family Name
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name || ""}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      placeholder="e.g. Dela Cruz"
                      error={fieldErrors.last_name}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ext_name">Suffix (Extension Name)</Label>
                    <Input
                      id="ext_name"
                      value={formData.ext_name || ""}
                      onChange={(e) => updateField("ext_name", e.target.value)}
                      placeholder="e.g. Jr., III (optional)"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="course_degree" required>
                      Degree Program / Course
                    </Label>
                    <Input
                      id="course_degree"
                      value={formData.course_degree || formData.program_course || ""}
                      onChange={(e) => {
                        updateField("course_degree", e.target.value);
                        updateField("program_course", e.target.value);
                      }}
                      placeholder="e.g. Bachelor of Science in Information Technology"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="year_level" required>
                      Year Level
                    </Label>
                    <select
                      id="year_level"
                      value={formData.year_level || "1"}
                      onChange={(e) => updateField("year_level", e.target.value)}
                      className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="1st Year">1st Year (Annex 2 format)</option>
                      <option value="2nd Year">2nd Year (Annex 2 format)</option>
                      <option value="3rd Year">3rd Year (Annex 2 format)</option>
                      <option value="4th Year">4th Year (Annex 2 format)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" required>
                      Gender
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender || "M"}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birthdate">Date of Birth</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={formData.birthdate || ""}
                      onChange={(e) => updateField("birthdate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab 2: Contact & Residence */}
        {activeTab === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card className="bg-white">
              <CardHeader className="border-b border-[#D6DDD8] pb-4">
                <CardTitle className="text-lg">Contact Information & Permanent Residence</CardTitle>
                <CardDescription>
                  Keep your mobile number and mailing address updated for official TDP disbursements.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Registered Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || formData.email || ""}
                      disabled
                      className="bg-[#F6F8F6] text-[#55645B] cursor-not-allowed"
                    />
                    <p className="text-[11px] text-[#55645B]">Email address is bound to your login credentials.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact_number" required>
                      Active Philippine Mobile Number
                    </Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number || ""}
                      onChange={(e) => updateField("contact_number", e.target.value)}
                      placeholder="09XXXXXXXXX"
                      error={fieldErrors.contact_number}
                      required
                    />
                    <p className="text-[11px] text-[#55645B]">Used for SMS disbursement alerts and batch releases.</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="street_barangay" required>
                      Street / Sitio / Barangay
                    </Label>
                    <Input
                      id="street_barangay"
                      value={formData.street_barangay || ""}
                      onChange={(e) => updateField("street_barangay", e.target.value)}
                      placeholder="e.g. Purok 3, Barangay Alcate"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="town_city" required>
                      City / Municipality
                    </Label>
                    <Input
                      id="town_city"
                      value={formData.town_city || ""}
                      onChange={(e) => updateField("town_city", e.target.value)}
                      placeholder="e.g. Victoria"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="province" required>
                      Province
                    </Label>
                    <Input
                      id="province"
                      value={formData.province || "Oriental Mindoro"}
                      onChange={(e) => updateField("province", e.target.value)}
                      placeholder="e.g. Oriental Mindoro"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="zipcode">Zip Code</Label>
                    <Input
                      id="zipcode"
                      value={formData.zipcode || "5200"}
                      onChange={(e) => updateField("zipcode", e.target.value)}
                      placeholder="e.g. 5205"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab 3: Parental Background */}
        {activeTab === "family" && (
          <motion.div
            key="family"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card className="bg-white">
              <CardHeader className="border-b border-[#D6DDD8] pb-4">
                <CardTitle className="text-lg">Parental & Guardian Information</CardTitle>
                <CardDescription>
                  Required under CHED / UniFAST Annex 1 continuous reporting.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Father Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B5E20] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Father's Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="father_given_name">Given Name</Label>
                      <Input
                        id="father_given_name"
                        value={formData.father_given_name || ""}
                        onChange={(e) => updateField("father_given_name", e.target.value)}
                        placeholder="Father's first name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="father_middle_name">Middle Name</Label>
                      <Input
                        id="father_middle_name"
                        value={formData.father_middle_name || ""}
                        onChange={(e) => updateField("father_middle_name", e.target.value)}
                        placeholder="Father's middle name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="father_last_name">Last Name</Label>
                      <Input
                        id="father_last_name"
                        value={formData.father_last_name || ""}
                        onChange={(e) => updateField("father_last_name", e.target.value)}
                        placeholder="Father's last name"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="father_contact_number">Mobile Number</Label>
                      <Input
                        id="father_contact_number"
                        value={formData.father_contact_number || ""}
                        onChange={(e) => updateField("father_contact_number", e.target.value)}
                        placeholder="09XXXXXXXXX"
                        error={fieldErrors.father_contact_number}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="father_email">Email (Optional)</Label>
                      <Input
                        id="father_email"
                        value={formData.father_email || ""}
                        onChange={(e) => updateField("father_email", e.target.value)}
                        placeholder="father@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Info */}
                <div className="space-y-3 pt-3 border-t border-[#D6DDD8]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B5E20] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Mother's Maiden Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="mother_given_name">Given Name</Label>
                      <Input
                        id="mother_given_name"
                        value={formData.mother_given_name || ""}
                        onChange={(e) => updateField("mother_given_name", e.target.value)}
                        placeholder="Mother's first name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mother_middle_name">Middle Name</Label>
                      <Input
                        id="mother_middle_name"
                        value={formData.mother_middle_name || ""}
                        onChange={(e) => updateField("mother_middle_name", e.target.value)}
                        placeholder="Mother's middle name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mother_last_name">Maiden Last Name</Label>
                      <Input
                        id="mother_last_name"
                        value={formData.mother_last_name || ""}
                        onChange={(e) => updateField("mother_last_name", e.target.value)}
                        placeholder="Mother's maiden name"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="mother_contact_number">Mobile Number</Label>
                      <Input
                        id="mother_contact_number"
                        value={formData.mother_contact_number || ""}
                        onChange={(e) => updateField("mother_contact_number", e.target.value)}
                        placeholder="09XXXXXXXXX"
                        error={fieldErrors.mother_contact_number}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mother_email">Email (Optional)</Label>
                      <Input
                        id="mother_email"
                        value={formData.mother_email || ""}
                        onChange={(e) => updateField("mother_email", e.target.value)}
                        placeholder="mother@email.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab 4: Scholarship & Financials */}
        {activeTab === "financial" && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card className="bg-white">
              <CardHeader className="border-b border-[#D6DDD8] pb-4">
                <CardTitle className="text-lg">Academic Standing & Financial Details</CardTitle>
                <CardDescription>
                  Evaluated during batch selection and qualification cross-checks.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="family_monthly_income">
                      Monthly Family Gross Income (PHP)
                    </Label>
                    <Input
                      id="family_monthly_income"
                      type="number"
                      value={formData.family_monthly_income || ""}
                      onChange={(e) => updateField("family_monthly_income", e.target.value)}
                      placeholder="e.g. 15000"
                      error={fieldErrors.family_monthly_income}
                    />
                    <p className="text-[11px] text-[#55645B]">Combined gross household income from all sources.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="latest_gwa">
                      Previous Semester General Weighted Average (GWA)
                    </Label>
                    <Input
                      id="latest_gwa"
                      value={formData.latest_gwa || ""}
                      onChange={(e) => updateField("latest_gwa", e.target.value)}
                      placeholder="e.g. 1.75 or 88.5"
                      error={fieldErrors.latest_gwa}
                    />
                    <p className="text-[11px] text-[#55645B]">Accepts 1.00–3.00 (College scale) or 75–100 (Percentage scale).</p>
                  </div>
                </div>

                {/* Applications History Section */}
                <div className="pt-4 border-t border-[#D6DDD8] space-y-3">
                  <h3 className="text-sm font-bold text-[#1F2A24] flex items-center gap-2">
                    <BadgePercent className="w-4 h-4 text-[#1B5E20]" />
                    Linked TDP Applications & Grant Records
                  </h3>

                  {applications.length === 0 ? (
                    <p className="text-xs text-[#55645B]">No applications submitted under this account yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#1B5E20]">
                                {app.trackingCode}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCEFDD] text-[#123F17]">
                                Batch {app.batchNumber || 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#55645B] mt-0.5">
                              Submitted: {new Date(app.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          <div>
                            {app.status === "ACCEPTED" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B5E20] text-white">
                                Validated Grantee
                              </span>
                            )}
                            {app.status === "SUBMITTED" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00]">
                                Under Office Review
                              </span>
                            )}
                            {app.status === "REJECTED" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDE8E7] text-[#B3261E]">
                                Ineligible / Needs Rectification
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tab 5: Notification Preferences & Alerts */}
        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card className="border-[#D6DDD8] bg-white shadow-xs overflow-hidden">
              <CardHeader className="border-b border-[#D6DDD8]/60 pb-4 bg-gradient-to-r from-[#F1F8F1] to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-heading font-bold text-[#1B5E20] flex items-center gap-2">
                      <BellRing className="w-5 h-5 text-[#B88A00]" />
                      Announcement & Alert Settings
                    </CardTitle>
                    <CardDescription className="text-xs text-[#55645B] mt-0.5">
                      Choose how you receive important TDP updates, submission deadlines, and payroll release notices.
                    </CardDescription>
                  </div>

                  {prefsSuccess && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
                      Preferences Saved
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Setting 1: In-App Announcement Alerts */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F6F8F6] transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-[#1F2A24]">
                        In-App Announcement Alerts
                      </h4>
                    </div>
                    <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
                      Receive notifications with unread badges inside MinSU DocTrack when staff publishes new official TDP notices, batch deadlines, or memo circulars.
                    </p>
                  </div>

                  {/* Tactile Apple Spring Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAnnouncements}
                    disabled={isSavingPrefs}
                    aria-label="Toggle in-app announcements"
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:ring-offset-2 ${
                      notifyAnnouncements ? "bg-[#1B5E20]" : "bg-neutral-300"
                    }`}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 ${
                        notifyAnnouncements ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Setting 2: Browser Web Push Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F6F8F6] transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-[#1F2A24]">
                        Browser Desktop Push Alerts
                      </h4>
                    </div>
                    <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
                      Receive instantaneous pop-up notifications on your desktop or device even when you have other windows or tabs active.
                    </p>

                    <div className="pl-10 flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-[#55645B]">Status:</span>
                      {pushPermission === "granted" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/30">
                          <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" />
                          Browser Permission Granted
                        </span>
                      )}
                      {pushPermission === "denied" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Permission Blocked in Browser Settings
                        </span>
                      )}
                      {pushPermission === "default" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                          <Clock className="w-3 h-3" />
                          Permission Not Yet Requested
                        </span>
                      )}
                      {pushPermission === "unsupported" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                          Not Supported on this Device
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 pl-10 sm:pl-0">
                    {pushPermission === "granted" ? (
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendTestPush}
                          className="text-xs h-8 border-[#D6DDD8] text-[#1F2A24] apple-press"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-[#F2B705]" />
                          Send Test Alert
                        </Button>

                        <button
                          type="button"
                          onClick={handleTogglePush}
                          disabled={isSavingPrefs}
                          aria-label="Toggle browser push alerts"
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:ring-offset-2 ${
                            notifyPush ? "bg-[#1B5E20]" : "bg-neutral-300"
                          }`}
                        >
                          <motion.span
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 ${
                              notifyPush ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ) : pushPermission === "unsupported" ? (
                      <span className="text-xs text-neutral-400">Unavailable</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleEnablePush}
                        className="bg-[#1B5E20] hover:bg-[#164D1C] text-white text-xs h-8 px-3 rounded-xl apple-press"
                      >
                        <Radio className="w-3.5 h-3.5 mr-1" />
                        Enable Browser Alerts
                      </Button>
                    )}
                  </div>
                </div>

                {testPushSent && (
                  <div className="p-3 rounded-xl bg-[#DCEFDD] border border-[#1B5E20]/30 text-xs text-[#123F17] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B5E20] shrink-0" />
                    <span>Test alert dispatched! Look for the notification prompt on your screen.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TAB 6: SECURITY & AUTHENTICATOR */}
        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="space-y-4"
          >
            {/* Card 1: Microsoft Authenticator */}
            <Card className="border-[#D6DDD8] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-[#1F2A24] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#1B5E20]" />
                      <span>Microsoft Authenticator Protection</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-[#55645B] mt-0.5">
                      Two-Factor Authentication (2FA) status and mobile authenticator configuration.
                    </CardDescription>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      user?.twoFactorEnabled
                        ? "bg-[#DCEFDD] text-[#123F17]"
                        : "bg-[#FFF1C2] text-[#B88A00]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user?.twoFactorEnabled ? "bg-[#2E7D32]" : "bg-[#B88A00]"
                      }`}
                    />
                    {user?.twoFactorEnabled ? "Active & Enrolled" : "Setup Required"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs text-[#55645B] leading-relaxed">
                  Your MinSU account can be authenticated using 6-digit rotating security codes generated by the <strong>Microsoft Authenticator</strong> app on your smartphone. When enabled, you can sign in with your authenticator code anytime without needing your password.
                </p>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setIsGeneratingSetup(true);
                        const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
                        if (res.ok) {
                          const data = await res.json();
                          setSetupModalData(data);
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsGeneratingSetup(false);
                      }
                    }}
                    isLoading={isGeneratingSetup}
                    className="apple-press text-xs font-semibold"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#1B5E20]" />
                    <span>{user?.twoFactorEnabled ? "Reconfigure Authenticator / QR Code" : "Set Up Microsoft Authenticator"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Password Policy */}
            <Card className="border-[#D6DDD8] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]/60">
                <CardTitle className="text-base text-[#1F2A24] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#B88A00]" />
                  <span>Institutional Password Policy</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#55645B] mt-0.5">
                  Rules and guidelines regarding your student portal password.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#FFFDF5] border border-[#F2B705]/50 text-xs text-[#1F2A24] space-y-1.5">
                  <p className="font-bold text-[#B88A00] flex items-center gap-1.5">
                    <span>🔒 Password Modifications Restricted</span>
                  </p>
                  <p className="text-[#55645B] leading-relaxed text-[11px]">
                    To safeguard student identities, scholarship eligibility rosters, and financial payroll data in compliance with Republic Act 10173 (Data Privacy Act of 2012), <strong>students cannot change passwords self-service</strong>.
                  </p>
                  <p className="text-[#55645B] leading-relaxed text-[11px]">
                    If you have forgotten your password or require a password reset, please contact the <strong>Campus System Administrator</strong> at <code className="font-bold text-[#1B5E20]">admin@minsu.edu.ph</code> or visit the IT Services / Registrar Office on your campus.
                  </p>
                </div>

                <p className="text-xs text-[#55645B]">
                  <strong>Tip:</strong> Even if you forget your password, you can always log in directly using the <strong>Authenticator Code</strong> option on the login screen!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bottom Save Bar */}
        {activeTab !== "notifications" && activeTab !== "security" && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#55645B]">
              {hasChanges ? (
                <span className="text-[#B88A00] font-medium">• Unsaved changes pending</span>
              ) : (
                <span className="text-[#1B5E20] font-medium">✔ Profile is up to date</span>
              )}
            </p>

            <div className="flex items-center gap-2.5">
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="apple-press text-xs"
                >
                  Cancel Changes
                </Button>
              )}

              <Button
                type="submit"
                variant="accent"
                size="md"
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                className="apple-press text-xs font-semibold px-6 shadow-xs"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? "Saving..." : "Save Profile Updates"}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Microsoft Authenticator Setup Modal */}
      <Modal
        isOpen={!!setupModalData}
        onClose={() => setSetupModalData(null)}
        title="Microsoft Authenticator Configuration"
        maxWidth="md"
      >
        {setupModalData && (
          <div className="py-2">
            <AuthenticatorLockStep
              userId={user?.id || setupModalData.userId || ""}
              email={user?.email || setupModalData.accountName || ""}
              secret={setupModalData.secret}
              formattedSecret={setupModalData.formattedSecret}
              qrSvg={setupModalData.qrSvg}
              onSuccess={() => {
                setSetupModalData(null);
                window.location.reload();
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

