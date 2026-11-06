"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Award,
  Save,
  RotateCcw,
  Printer,
  Sparkles,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Type,
  Users,
  Eye,
  EyeOff,
  Maximize2,
  FileText,
  ShieldAlert,
  Pencil,
  Image as ImageIcon,
} from "lucide-react";
import {
  CertificateTemplateConfig,
  DEFAULT_CERTIFICATE_TEMPLATE,
  PAPER_SIZES,
  PaperSize,
  renderCertificateBody,
  StudentCertificateTokens,
} from "@/lib/certificate";
import { CertificateModal } from "@/components/certificate/certificate-modal";
import {
  CertificateLogoRenderer,
  CertificateLogoPickerModal,
} from "@/components/certificate/certificate-logo";
import Image from "next/image";

const TOKEN_SUGGESTIONS = [
  { token: "{student_name}", label: "Grantee Name" },
  { token: "{student_id}", label: "Student ID" },
  { token: "{course}", label: "Degree Course" },
  { token: "{campus}", label: "Campus" },
  { token: "{batch_number}", label: "Batch No." },
  { token: "{academic_year}", label: "A.Y." },
  { token: "{tracking_code}", label: "Tracking Ref" },
  { token: "{date_awarded}", label: "Date Awarded" },
];

export default function CertificateEditorPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();

  const [template, setTemplate] = useState<CertificateTemplateConfig>(DEFAULT_CERTIFICATE_TEMPLATE);
  const [initialTemplate, setInitialTemplate] = useState<CertificateTemplateConfig>(DEFAULT_CERTIFICATE_TEMPLATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test Print Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Logo Picker Modal State
  const [logoPickerState, setLogoPickerState] = useState<{
    isOpen: boolean;
    target: "left" | "center" | "right" | "watermark";
    title: string;
  }>({
    isOpen: false,
    target: "left",
    title: "Customize Left Header Logo",
  });

  // Active Editor Section Accordion
  const [activeSection, setActiveSection] = useState<"paper" | "header" | "title" | "fields" | "signatories">("paper");

  // Sample student data for real-time visual inspection
  const sampleStudent = {
    name: "JUAN DELA CRUZ",
    studentId: "2024-00123-BC",
    course: "Bachelor of Science in Information Technology",
    campus: "Bongabong Campus",
    batchNumber: 1,
    trackingCode: "MINSU-TDP-2026-B1-9F2A1",
    dateAwarded: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };

  useEffect(() => {
    async function loadTemplate() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/certificate/template");
        if (res.ok) {
          const data = await res.json();
          if (data.template) {
            setTemplate(data.template);
            setInitialTemplate(data.template);
          }
        } else {
          setErrorMessage("Failed to load certificate template.");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Network error loading certificate template.");
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadTemplate();
    }
  }, [user]);

  // Intercept standard browser print shortcuts (Ctrl+P / Cmd+P) to launch calibrated certificate print modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPreviewModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Strict RBAC Gate: Staff and Director ONLY. Admin is completely excluded.
  if (!isSessionLoading && user) {
    if (user.role !== "STAFF" && user.role !== "DIRECTOR") {
      return (
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FDE8E7] text-[#B3261E] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-heading font-bold text-[#1F2A24]">
            Access Restricted
          </h1>
          <p className="text-xs text-[#55645B] max-w-md mx-auto">
            The Certificate Designer is exclusively restricted to the <strong>TDP Staff Coordinator</strong> and <strong>Campus Director</strong>. System administrators and other roles do not have permission to modify award credentials.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      );
    }
  }

  const updateField = (field: keyof CertificateTemplateConfig, value: any) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleInsertToken = (token: string) => {
    setTemplate((prev) => ({
      ...prev,
      bodyText: (prev.bodyText || "") + " " + token,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/certificate/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save certificate design.");
        setIsSaving(false);
        return;
      }

      setInitialTemplate(data.template || template);
      setTemplate(data.template || template);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch {
      setErrorMessage("Network error while saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm("Are you sure you want to reset the certificate design to official MinSU defaults?")) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/certificate/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToDefault: true }),
      });

      const data = await res.json();
      if (res.ok) {
        setTemplate(data.template || DEFAULT_CERTIFICATE_TEMPLATE);
        setInitialTemplate(data.template || DEFAULT_CERTIFICATE_TEMPLATE);
        setSaveSuccess(true);
      }
    } catch {
      setErrorMessage("Failed to reset template.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-[#1B5E20]">Loading Certificate Designer...</p>
      </div>
    );
  }

  const currentPaper = PAPER_SIZES[template.paperSize || "A4"] || PAPER_SIZES.A4;
  const tokens: StudentCertificateTokens = {
    student_name: sampleStudent.name,
    student_id: sampleStudent.studentId,
    course: sampleStudent.course,
    campus: sampleStudent.campus,
    batch_number: sampleStudent.batchNumber,
    academic_year: "A.Y. 2026-2027",
    tracking_code: sampleStudent.trackingCode,
    date_awarded: template.customDateAwarded || sampleStudent.dateAwarded,
  };
  const liveRenderedBody = renderCertificateBody(template.bodyText, tokens);
  const hasChanges = JSON.stringify(template) !== JSON.stringify(initialTemplate);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6DDD8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1B5E20] text-white flex items-center justify-center font-bold shadow-xs">
            <Award className="w-6 h-6 text-[#F2B705]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-bold text-[#1B5E20]">
                TDP Certificate Designer
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCEFDD] text-[#123F17] uppercase tracking-wider">
                Staff & Director Exclusive
              </span>
            </div>
            <p className="text-xs text-[#55645B] mt-0.5">
              Customize institutional logos, paper size, award citations, signatories, and toggle any data element on or off.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="apple-press text-xs text-[#55645B]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Default
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="apple-press text-xs font-semibold text-[#1B5E20] border-[#1B5E20]/30"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Test Print
          </Button>

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
            {isSaving ? "Saving..." : "Save Design"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#DCEFDD] border border-[#2E7D32]/30 flex items-center gap-2 text-xs text-[#123F17]">
          <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" />
          <span className="font-semibold">Certificate design template successfully updated! All student certificates will now render with these settings.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 flex items-center gap-2 text-xs text-[#B3261E]">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Split Grid: Left Controls, Right Real-time Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Add/Remove Toggles (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Accordion Headers */}
          <div className="bg-white p-1 rounded-xl border border-[#D6DDD8] flex overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveSection("paper")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === "paper" ? "bg-[#1B5E20] text-white shadow-xs" : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              Paper Size
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("header")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === "header" ? "bg-[#1B5E20] text-white shadow-xs" : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              Header & Logos
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("title")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === "title" ? "bg-[#1B5E20] text-white shadow-xs" : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              Citation Body
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("fields")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === "fields" ? "bg-[#1B5E20] text-white shadow-xs" : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              Data Fields
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("signatories")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSection === "signatories" ? "bg-[#1B5E20] text-white shadow-xs" : "text-[#55645B] hover:text-[#1F2A24]"
              }`}
            >
              Signatories
            </button>
          </div>

          {/* Section 1: Paper Size Selection */}
          {activeSection === "paper" && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#1B5E20]" />
                  Paper Size & Framing Options
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose the standard paper dimensions for printing and PDF generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Certificate Paper Dimensions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PAPER_SIZES) as PaperSize[]).map((sizeKey) => {
                      const p = PAPER_SIZES[sizeKey];
                      const isSelected = template.paperSize === sizeKey;
                      return (
                        <button
                          key={sizeKey}
                          type="button"
                          onClick={() => updateField("paperSize", sizeKey)}
                          className={`p-3 rounded-xl border text-left transition apple-press flex flex-col justify-between ${
                            isSelected
                              ? "border-[#1B5E20] bg-[#F1F8F1] ring-2 ring-[#1B5E20]/20"
                              : "border-[#D6DDD8] bg-white hover:border-[#1B5E20]/50"
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? "text-[#1B5E20]" : "text-[#1F2A24]"}`}>
                            {p.name}
                          </span>
                          <span className="text-[11px] text-[#55645B] mt-0.5">{p.dimensions}</span>
                          <span className="text-[10px] text-[#B88A00] font-mono mt-1">Aspect: {p.aspectRatio}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D6DDD8] space-y-3">
                  <h4 className="text-xs font-bold text-[#1F2A24]">Visual Framing Accents</h4>
                  <div className="p-3 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1B5E20]" />
                        <span className="text-xs font-bold text-[#1F2A24]">Background Watermark Seal</span>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[11px] font-semibold text-[#1B5E20]">
                          {template.showWatermark ? "Enabled" : "Disabled"}
                        </span>
                        <input
                          type="checkbox"
                          checked={template.showWatermark}
                          onChange={(e) => updateField("showWatermark", e.target.checked)}
                          className="w-4 h-4 accent-[#1B5E20] rounded"
                        />
                      </label>
                    </div>

                    {template.showWatermark && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#D6DDD8]/60">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#D6DDD8] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <CertificateLogoRenderer
                              config={template.watermarkLogoConfig}
                              fallbackUrl="/minsu-seal.png"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-[11px] text-[#55645B] truncate">
                            {template.watermarkLogoConfig?.alt || "MinSU Watermark Seal"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setLogoPickerState({
                              isOpen: true,
                              target: "watermark",
                              title: "Customize Background Watermark Seal",
                            })
                          }
                          className="h-7 text-[11px] px-2 text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#F1F8F1] apple-press"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Change
                        </Button>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-[#F6F8F6]">
                    <span className="text-xs font-medium text-[#1F2A24]">Show Ornate Corner Borders</span>
                    <input
                      type="checkbox"
                      checked={template.showCornerBorders}
                      onChange={(e) => updateField("showCornerBorders", e.target.checked)}
                      className="w-4 h-4 accent-[#1B5E20] rounded"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Header & Logos (Add/Remove Toggles) */}
          {activeSection === "header" && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1B5E20]" />
                  Header Seals & Institutional Titles
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose uploaded institutional seals and toggle header elements on or off.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {/* Logo Customization Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                      Header Seals (System Uploads)
                    </h4>
                    <span className="text-[10px] text-[#55645B]">
                      Customizable per slot
                    </span>
                  </div>

                  {/* Left Seal Card */}
                  <div className="p-3 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1B5E20]" />
                        <span className="text-xs font-bold text-[#1F2A24]">Left Header Seal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("showLeftLogo", !template.showLeftLogo)}
                        className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                      >
                        {template.showLeftLogo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                        {template.showLeftLogo ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#D6DDD8]/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#D6DDD8] p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                          <CertificateLogoRenderer
                            config={template.leftLogoConfig}
                            fallbackUrl="/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1F2A24] truncate">
                            {template.leftLogoConfig?.alt || "Institutional Left Seal"}
                          </p>
                          <p className="text-[10px] text-[#55645B] truncate">
                            {template.leftLogoConfig?.url ? "System Uploaded Image" : "Default Seal"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLogoPickerState({
                            isOpen: true,
                            target: "left",
                            title: "Customize Left Header Seal",
                          })
                        }
                        className="h-7 text-[11px] px-2 text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#F1F8F1] apple-press"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Center Seal Card */}
                  <div className="p-3 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#B88A00]" />
                        <span className="text-xs font-bold text-[#1F2A24]">Center Header Seal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("showCenterLogo", !template.showCenterLogo)}
                        className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                      >
                        {template.showCenterLogo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                        {template.showCenterLogo ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#D6DDD8]/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#D6DDD8] p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                          <CertificateLogoRenderer
                            config={template.centerLogoConfig}
                            fallbackUrl="/logo.png"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1F2A24] truncate">
                            {template.centerLogoConfig?.alt || "MinSU University Crest"}
                          </p>
                          <p className="text-[10px] text-[#55645B] truncate">
                            {template.centerLogoConfig?.url ? "System Uploaded Image" : "Default Seal"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLogoPickerState({
                            isOpen: true,
                            target: "center",
                            title: "Customize Center Header Seal",
                          })
                        }
                        className="h-7 text-[11px] px-2 text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#F1F8F1] apple-press"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Right Seal Card */}
                  <div className="p-3 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1B5E20]" />
                        <span className="text-xs font-bold text-[#1F2A24]">Right Header Seal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("showRightLogo", !template.showRightLogo)}
                        className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                      >
                        {template.showRightLogo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                        {template.showRightLogo ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#D6DDD8]/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#D6DDD8] p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                          <CertificateLogoRenderer
                            config={template.rightLogoConfig}
                            fallbackUrl="/api/media/logo/logo-1793718328666-3e70a8323e95.png"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1F2A24] truncate">
                            {template.rightLogoConfig?.alt || "Institutional Right Seal"}
                          </p>
                          <p className="text-[10px] text-[#55645B] truncate">
                            {template.rightLogoConfig?.url ? "System Uploaded Image" : "Default Seal"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLogoPickerState({
                            isOpen: true,
                            target: "right",
                            title: "Customize Right Header Seal",
                          })
                        }
                        className="h-7 text-[11px] px-2 text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#F1F8F1] apple-press"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Republic Text */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="republicText">Republic Line</Label>
                    <button
                      type="button"
                      onClick={() => updateField("showRepublicText", !template.showRepublicText)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showRepublicText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showRepublicText ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <Input
                    id="republicText"
                    value={template.republicText}
                    onChange={(e) => updateField("republicText", e.target.value)}
                    disabled={!template.showRepublicText}
                  />
                </div>

                {/* Agency Text */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agencyText">Agency Header Text</Label>
                    <button
                      type="button"
                      onClick={() => updateField("showAgencyText", !template.showAgencyText)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showAgencyText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showAgencyText ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <Input
                    id="agencyText"
                    value={template.agencyText}
                    onChange={(e) => updateField("agencyText", e.target.value)}
                    disabled={!template.showAgencyText}
                  />
                </div>

                {/* University Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="universityName">University Name</Label>
                    <button
                      type="button"
                      onClick={() => updateField("showUniversityName", !template.showUniversityName)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showUniversityName ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showUniversityName ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <Input
                    id="universityName"
                    value={template.universityName}
                    onChange={(e) => updateField("universityName", e.target.value)}
                    disabled={!template.showUniversityName}
                  />
                </div>

                {/* Campus Subtitle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="campusName">Campus Subheader / Address</Label>
                    <button
                      type="button"
                      onClick={() => updateField("showCampusName", !template.showCampusName)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showCampusName ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showCampusName ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <Input
                    id="campusName"
                    value={template.campusName}
                    onChange={(e) => updateField("campusName", e.target.value)}
                    disabled={!template.showCampusName}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Title & Award Citation Body */}
          {activeSection === "title" && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#1B5E20]" />
                  Award Citation & Custom Body Text
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize the award headline and paragraph copy using dynamic placeholders.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="title">Main Certificate Title</Label>
                  <Input
                    id="title"
                    value={template.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="subtitle">Subtitle / Program Name</Label>
                  <Input
                    id="subtitle"
                    value={template.subtitle}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="awardPrefix">Award Prefix Clause</Label>
                  <Input
                    id="awardPrefix"
                    value={template.awardPrefix}
                    onChange={(e) => updateField("awardPrefix", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bodyText">Citation Body Text</Label>
                    <span className="text-[10px] text-[#55645B]">Click token below to insert:</span>
                  </div>
                  <textarea
                    id="bodyText"
                    rows={4}
                    value={template.bodyText}
                    onChange={(e) => updateField("bodyText", e.target.value)}
                    className="w-full rounded-lg border border-[#D6DDD8] bg-white p-2.5 text-xs text-[#1F2A24] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none transition"
                  />
                  {/* Token Insert Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {TOKEN_SUGGESTIONS.map((t) => (
                      <button
                        key={t.token}
                        type="button"
                        onClick={() => handleInsertToken(t.token)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F1F8F1] text-[#1B5E20] border border-[#DCEFDD] hover:bg-[#DCEFDD] transition apple-press"
                      >
                        +{t.token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Note Toggle */}
                <div className="pt-3 border-t border-[#D6DDD8] space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="additionalNoteText">Optional Additional Clause / Note</Label>
                    <button
                      type="button"
                      onClick={() => updateField("showAdditionalNote", !template.showAdditionalNote)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showAdditionalNote ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showAdditionalNote ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <Input
                    id="additionalNoteText"
                    value={template.additionalNoteText}
                    onChange={(e) => updateField("additionalNoteText", e.target.value)}
                    disabled={!template.showAdditionalNote}
                    placeholder="Enter custom footnote or compliance statement..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Individual Data Item Toggles (Add/Remove) */}
          {activeSection === "fields" && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1B5E20]" />
                  Add or Remove Certificate Data Elements
                </CardTitle>
                <CardDescription className="text-xs">
                  Switch individual student metadata fields on or off as needed for this batch.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">Student ID Number</p>
                    <p className="text-[11px] text-[#55645B]">Show MinSU student ID badge below name</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showStudentId}
                    onChange={(e) => updateField("showStudentId", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">Degree Program / Course</p>
                    <p className="text-[11px] text-[#55645B]">Show grantee's degree program & major</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showCourse}
                    onChange={(e) => updateField("showCourse", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">Campus Enrolled</p>
                    <p className="text-[11px] text-[#55645B]">Show student's enrolled campus</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showCampus}
                    onChange={(e) => updateField("showCampus", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">TDP Batch Badge</p>
                    <p className="text-[11px] text-[#55645B]">Display batch intake badge pill</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showBatch}
                    onChange={(e) => updateField("showBatch", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">Tracking Reference Code</p>
                    <p className="text-[11px] text-[#55645B]">Show official tracking code at bottom center seal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showTrackingCode}
                    onChange={(e) => updateField("showTrackingCode", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#D6DDD8] hover:bg-[#F6F8F6] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#1F2A24]">Date of Award</p>
                    <p className="text-[11px] text-[#55645B]">Display date awarded at footer</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={template.showDateAwarded}
                    onChange={(e) => updateField("showDateAwarded", e.target.checked)}
                    className="w-4 h-4 accent-[#1B5E20]"
                  />
                </label>

                {template.showDateAwarded && (
                  <div className="pt-1">
                    <Label htmlFor="customDateAwarded">Custom Date String (Optional Override)</Label>
                    <Input
                      id="customDateAwarded"
                      value={template.customDateAwarded}
                      onChange={(e) => updateField("customDateAwarded", e.target.value)}
                      placeholder="e.g. November 5, 2026 (leave blank for live date)"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 5: Signatories (Add/Remove & Edit) */}
          {activeSection === "signatories" && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-[#D6DDD8]">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1B5E20]" />
                  Signatories & Officials
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize coordinator & president signatories or toggle them on or off.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Signatory 1 */}
                <div className="p-3 bg-[#F6F8F6] rounded-xl space-y-2 border border-[#D6DDD8]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1B5E20]">Signatory 1 (Left / Coordinator)</h4>
                    <button
                      type="button"
                      onClick={() => updateField("showSignatory1", !template.showSignatory1)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showSignatory1 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showSignatory1 ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signatory1Name">Full Name & Degree</Label>
                    <Input
                      id="signatory1Name"
                      value={template.signatory1Name}
                      onChange={(e) => updateField("signatory1Name", e.target.value)}
                      disabled={!template.showSignatory1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signatory1Title">Designation / Title</Label>
                    <Input
                      id="signatory1Title"
                      value={template.signatory1Title}
                      onChange={(e) => updateField("signatory1Title", e.target.value)}
                      disabled={!template.showSignatory1}
                    />
                  </div>
                </div>

                {/* Signatory 2 */}
                <div className="p-3 bg-[#F6F8F6] rounded-xl space-y-2 border border-[#D6DDD8]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1B5E20]">Signatory 2 (Right / Director)</h4>
                    <button
                      type="button"
                      onClick={() => updateField("showSignatory2", !template.showSignatory2)}
                      className="text-[11px] font-semibold text-[#1B5E20] flex items-center gap-1"
                    >
                      {template.showSignatory2 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                      {template.showSignatory2 ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signatory2Name">Full Name & Degree</Label>
                    <Input
                      id="signatory2Name"
                      value={template.signatory2Name}
                      onChange={(e) => updateField("signatory2Name", e.target.value)}
                      disabled={!template.showSignatory2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signatory2Title">Designation / Title</Label>
                    <Input
                      id="signatory2Title"
                      value={template.signatory2Title}
                      onChange={(e) => updateField("signatory2Title", e.target.value)}
                      disabled={!template.showSignatory2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Live Interactive Landscape Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-2 sticky top-4">
          <div className="flex items-center justify-between text-xs text-[#55645B] px-1">
            <span className="font-semibold flex items-center gap-1.5 text-[#1B5E20]">
              <Eye className="w-3.5 h-3.5" />
              Live Interactive Certificate Preview
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-[#DCEFDD] text-[#123F17] px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                {currentPaper.name} ({currentPaper.dimensions})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                className="h-6 text-[11px] text-[#1B5E20] hover:bg-[#F1F8F1] px-2"
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                Pop-out
              </Button>
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div className="bg-[#EAEFEA] p-2 sm:p-4 rounded-2xl border border-[#D6DDD8] shadow-sm overflow-hidden flex items-center justify-center">
            <div
              className="w-full bg-white text-[#1F2A24] shadow-lg relative select-none transition-all duration-300"
              style={{
                aspectRatio: currentPaper.aspectRatio,
              }}
            >
              {/* Outer MinSU Emerald & Gold Border */}
              <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between border-[5px] border-[#1B5E20] relative overflow-hidden bg-white">
                {/* Inner Gold Inset Border */}
                <div className="absolute inset-1.5 border border-[#F2B705] pointer-events-none" />

                {/* Corner Ornaments */}
                {template.showCornerBorders && (
                  <>
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-[#1B5E20] pointer-events-none" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-[#1B5E20] pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-[#1B5E20] pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-[#1B5E20] pointer-events-none" />
                  </>
                )}

                {/* Watermark Crest */}
                {template.showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.045] pointer-events-none select-none">
                    <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
                      <CertificateLogoRenderer
                        config={template.watermarkLogoConfig}
                        fallbackUrl="/minsu-seal.png"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* 1. Header & Seals */}
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-full flex items-center justify-between px-2 sm:px-4 mb-1">
                    {/* Left Logo */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {template.showLeftLogo && (
                        <div
                          className="w-9 h-9 flex items-center justify-center cursor-pointer group relative rounded-lg hover:ring-2 hover:ring-[#1B5E20]/30 transition apple-press"
                          onClick={() =>
                            setLogoPickerState({
                              isOpen: true,
                              target: "left",
                              title: "Customize Left Header Seal",
                            })
                          }
                          title="Click to customize Left Header Seal"
                        >
                          <CertificateLogoRenderer
                            config={template.leftLogoConfig}
                            fallbackUrl="/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Pencil className="w-3 h-3 text-[#F2B705]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center Institutional Typography & Optional Center Seal */}
                    <div className="space-y-0.5 px-2 flex flex-col items-center">
                      {template.showRepublicText && (
                        <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#55645B] font-semibold">
                          {template.republicText}
                        </p>
                      )}
                      {template.showAgencyText && (
                        <p className="text-[7px] sm:text-[8px] uppercase tracking-wider text-[#B88A00] font-bold">
                          {template.agencyText}
                        </p>
                      )}

                      {/* Optional Center Seal */}
                      {template.showCenterLogo && (
                        <div
                          className="w-7 h-7 my-0.5 flex items-center justify-center cursor-pointer group relative rounded-lg hover:ring-2 hover:ring-[#1B5E20]/30 transition apple-press"
                          onClick={() =>
                            setLogoPickerState({
                              isOpen: true,
                              target: "center",
                              title: "Customize Center Header Seal",
                            })
                          }
                          title="Click to customize Center Header Seal"
                        >
                          <CertificateLogoRenderer
                            config={template.centerLogoConfig}
                            fallbackUrl="/logo.png"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Pencil className="w-2.5 h-2.5 text-[#F2B705]" />
                          </div>
                        </div>
                      )}

                      {template.showUniversityName && (
                        <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#1B5E20] tracking-tight">
                          {template.universityName}
                        </h3>
                      )}
                      {template.showCampusName && (
                        <p className="text-[8px] text-[#55645B] font-medium line-clamp-1">
                          {template.campusName}
                        </p>
                      )}
                    </div>

                    {/* Right Logo */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {template.showRightLogo && (
                        <div
                          className="w-9 h-9 flex items-center justify-center cursor-pointer group relative rounded-lg hover:ring-2 hover:ring-[#1B5E20]/30 transition apple-press"
                          onClick={() =>
                            setLogoPickerState({
                              isOpen: true,
                              target: "right",
                              title: "Customize Right Header Seal",
                            })
                          }
                          title="Click to customize Right Header Seal"
                        >
                          <CertificateLogoRenderer
                            config={template.rightLogoConfig}
                            fallbackUrl="/api/media/logo/logo-1793718328666-3e70a8323e95.png"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Pencil className="w-3 h-3 text-[#F2B705]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-2/3 mx-auto h-[1px] bg-gradient-to-r from-transparent via-[#F2B705] to-transparent my-0.5" />
                </div>

                {/* 2. Certificate Title & Awardee */}
                <div className="relative z-10 text-center my-auto py-1 space-y-1">
                  <div className="space-y-0.5">
                    <h1 className="text-xs sm:text-sm font-heading font-black tracking-wider text-[#1B5E20] uppercase">
                      {template.title}
                    </h1>
                    {template.subtitle && (
                      <p className="text-[8px] sm:text-[9px] font-semibold text-[#B88A00]">
                        {template.subtitle}
                      </p>
                    )}
                  </div>

                  <p className="text-[8px] italic text-[#55645B]">
                    {template.awardPrefix}
                  </p>

                  <div className="py-0.5">
                    <h2 className="text-sm sm:text-base font-heading font-black text-[#1F2A24] tracking-tight underline decoration-[#F2B705] underline-offset-4">
                      {sampleStudent.name}
                    </h2>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[8px] text-[#55645B]">
                    {template.showStudentId && (
                      <span className="px-1.5 py-0.2 bg-[#F1F8F1] border border-[#DCEFDD] rounded font-mono font-bold text-[#1B5E20]">
                        {sampleStudent.studentId}
                      </span>
                    )}
                    {template.showCourse && (
                      <span className="font-semibold text-[#1F2A24]">
                        {sampleStudent.course}
                      </span>
                    )}
                    {template.showCampus && (
                      <span>• {sampleStudent.campus}</span>
                    )}
                    {template.showBatch && (
                      <span className="px-1.5 py-0.2 rounded font-bold bg-[#1B5E20] text-white text-[7px]">
                        Batch {sampleStudent.batchNumber}
                      </span>
                    )}
                  </div>

                  {/* Body Paragraph */}
                  <div className="max-w-md mx-auto px-2 pt-1">
                    <p className="text-[8px] sm:text-[9px] leading-relaxed text-[#1F2A24] line-clamp-3">
                      {liveRenderedBody}
                    </p>
                  </div>

                  {/* Additional Note */}
                  {template.showAdditionalNote && template.additionalNoteText && (
                    <div className="max-w-sm mx-auto pt-0.5">
                      <p className="text-[7px] text-[#55645B] italic line-clamp-2">
                        &ldquo;{template.additionalNoteText}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Signatories & Bottom */}
                <div className="relative z-10 pt-1.5 border-t border-[#D6DDD8]/60 mt-auto">
                  <div className="flex items-end justify-between px-3 sm:px-6 text-center text-[8px]">
                    {/* Signatory 1 */}
                    <div className="w-32 space-y-0.5">
                      {template.showSignatory1 ? (
                        <>
                          <div className="h-5 flex items-end justify-center">
                            <div className="w-24 border-b border-[#1F2A24]" />
                          </div>
                          <p className="font-heading font-bold text-[8px] uppercase text-[#1F2A24] truncate">
                            {template.signatory1Name}
                          </p>
                          <p className="text-[7px] text-[#55645B] truncate">
                            {template.signatory1Title}
                          </p>
                        </>
                      ) : (
                        <div className="h-8" />
                      )}
                    </div>

                    {/* Center Seal */}
                    <div className="space-y-0.5 text-center">
                      {template.showDateAwarded && (
                        <p className="text-[7px] text-[#55645B]">
                          {tokens.date_awarded}
                        </p>
                      )}
                      {template.showTrackingCode && (
                        <p className="font-mono text-[7px] text-[#55645B]">
                          {tokens.tracking_code}
                        </p>
                      )}
                    </div>

                    {/* Signatory 2 */}
                    <div className="w-32 space-y-0.5">
                      {template.showSignatory2 ? (
                        <>
                          <div className="h-5 flex items-end justify-center">
                            <div className="w-24 border-b border-[#1F2A24]" />
                          </div>
                          <p className="font-heading font-bold text-[8px] uppercase text-[#1F2A24] truncate">
                            {template.signatory2Name}
                          </p>
                          <p className="text-[7px] text-[#55645B] truncate">
                            {template.signatory2Title}
                          </p>
                        </>
                      ) : (
                        <div className="h-8" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-out Full Test Print Modal */}
      {previewModalOpen && (
        <CertificateModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          studentData={sampleStudent}
          overrideTemplate={template}
        />
      )}

      {/* Apple-styled Logo Picker Modal (Saved System Library & Direct Upload) */}
      {logoPickerState.isOpen && (
        <CertificateLogoPickerModal
          isOpen={logoPickerState.isOpen}
          onClose={() => setLogoPickerState((p) => ({ ...p, isOpen: false }))}
          title={logoPickerState.title}
          currentConfig={
            logoPickerState.target === "left"
              ? template.leftLogoConfig
              : logoPickerState.target === "center"
              ? template.centerLogoConfig
              : logoPickerState.target === "right"
              ? template.rightLogoConfig
              : template.watermarkLogoConfig
          }
          onSelect={(newConfig) => {
            const fieldMap: Record<string, keyof CertificateTemplateConfig> = {
              left: "leftLogoConfig",
              center: "centerLogoConfig",
              right: "rightLogoConfig",
              watermark: "watermarkLogoConfig",
            };
            const fieldKey = fieldMap[logoPickerState.target];
            if (fieldKey) {
              updateField(fieldKey, newConfig);
            }
          }}
        />
      )}
    </div>
  );
}
