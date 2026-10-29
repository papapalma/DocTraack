"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import {
  LandingSection,
  SectionType,
  HeroSectionConfig,
  AnnouncementSectionConfig,
  WorkflowSectionConfig,
  StatsSectionConfig,
  FaqSectionConfig,
  ContactSectionConfig,
} from "@/types/landing";
import { ModularLanding } from "@/components/landing/modular-landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  UploadCloud,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Edit3,
} from "lucide-react";

export default function LandingEditorPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const router = useRouter();

  const [draftSections, setDraftSections] = useState<LandingSection[]>([]);
  const [publishedSections, setPublishedSections] = useState<LandingSection[]>([]);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Confirmation & Preview Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [previewAuthOpen, setPreviewAuthOpen] = useState(false);
  const [previewAuthMode, setPreviewAuthMode] = useState<"login" | "register">("login");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/landing/admin");
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setDraftSections(data.config?.draftSections || []);
          setPublishedSections(data.config?.publishedSections || []);
          setHasUnpublishedChanges(data.config?.hasUnpublishedChanges || false);
          if (data.config?.draftSections?.[0]?.id) {
            setActiveAccordion(data.config.draftSections[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load landing config:", e);
      } finally {
        setIsLoading(false);
      }
    }

    if (!sessionLoading) {
      if (user && user.role !== "SYSTEM_ADMIN") {
        router.push("/dashboard");
      } else {
        loadConfig();
      }
    }
  }, [user, sessionLoading, router]);

  // Auto-save draft changes to backend (debounced)
  const saveDraftToBackend = async (newDraft: LandingSection[]) => {
    setIsSaving(true);
    setHasUnpublishedChanges(true);
    try {
      await fetch("/api/landing/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftSections: newDraft }),
      });
    } catch (e) {
      console.error("Error auto-saving draft:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder sections
  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftSections.length) return;

    const updated = [...draftSections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setDraftSections(updated);
    saveDraftToBackend(updated);
  };

  // Toggle visibility
  const toggleSectionEnabled = (id: string) => {
    const updated = draftSections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setDraftSections(updated);
    saveDraftToBackend(updated);
  };

  // Delete section
  const deleteSection = (id: string) => {
    if (draftSections.length <= 1) {
      alert("At least one section must remain on the landing page.");
      return;
    }
    const updated = draftSections.filter((s) => s.id !== id);
    setDraftSections(updated);
    saveDraftToBackend(updated);
  };

  // Update specific section content
  const updateSectionContent = (id: string, newContent: any) => {
    const updated = draftSections.map((s) =>
      s.id === id ? { ...s, content: { ...s.content, ...newContent } } : s
    );
    setDraftSections(updated);
    saveDraftToBackend(updated);
  };

  // Add new section
  const addSection = (type: SectionType) => {
    const newId = `sec-${type.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    let newSection: LandingSection;

    switch (type) {
      case "HERO":
        newSection = {
          id: newId,
          type: "HERO",
          title: "New Keynote Hero",
          enabled: true,
          content: {
            badgeText: "MinSU TDP System • Announcement",
            headlinePrefix: "Welcome to",
            headlineHighlight: "MinSU DocTrack",
            subheadline: "Empowering scholars with transparent digital workflows.",
            primaryCtaText: "Staff Login",
            primaryCtaAction: "login",
            secondaryCtaText: "Student Application",
            secondaryCtaAction: "register",
          },
        };
        break;
      case "ANNOUNCEMENT":
        newSection = {
          id: newId,
          type: "ANNOUNCEMENT",
          title: "Notice Banner",
          enabled: true,
          content: {
            badge: "UPDATE",
            message: "Important notice: Please verify your enrollment credentials.",
            linkText: "Learn More",
            linkUrl: "/?auth=login",
            variant: "info",
          },
        };
        break;
      case "WORKFLOW":
        newSection = {
          id: newId,
          type: "WORKFLOW",
          title: "Process Features",
          enabled: true,
          content: {
            sectionTitle: "Application & Review Lifecycle",
            sectionSubtitle: "Simple steps for grant processing.",
            cards: [
              {
                id: `card-${Date.now()}-1`,
                icon: "file-check",
                title: "Step 1: Submission",
                description: "Submit online or through office coordinators.",
              },
              {
                id: `card-${Date.now()}-2`,
                icon: "clock",
                title: "Step 2: Review",
                description: "Executive endorsement and compliance check.",
              },
            ],
          },
        };
        break;
      case "STATS":
        newSection = {
          id: newId,
          type: "STATS",
          title: "Program Metrics",
          enabled: true,
          content: {
            sectionTitle: "Key Indicators",
            sectionSubtitle: "Current semester participation highlights.",
            items: [
              { id: "stat-new-1", value: "1,500+", label: "Grant Beneficiaries" },
              { id: "stat-new-2", value: "100%", label: "Digital Audited" },
            ],
          },
        };
        break;
      case "FAQ":
        newSection = {
          id: newId,
          type: "FAQ",
          title: "Q&A Accordion",
          enabled: true,
          content: {
            sectionTitle: "Help & Questions",
            sectionSubtitle: "Common applicant inquiries.",
            items: [
              {
                id: `faq-${Date.now()}-1`,
                question: "What are the required documents?",
                answer: "Certificate of Registration (COR) and valid student ID.",
              },
            ],
          },
        };
        break;
      case "CONTACT":
        newSection = {
          id: newId,
          type: "CONTACT",
          title: "Office Directory",
          enabled: true,
          content: {
            sectionTitle: "Get in Touch",
            sectionSubtitle: "We are here to assist with your TDP applications.",
            officeLocation: "MinSU Main Campus, Alcate, Victoria, Oriental Mindoro",
            officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
            email: "tdp@minsu.edu.ph",
            hotline: "(043) 288-2026",
          },
        };
        break;
    }

    const updated = [...draftSections, newSection];
    setDraftSections(updated);
    setActiveAccordion(newId);
    saveDraftToBackend(updated);
  };

  // Publish Live Action
  const handlePublishLive = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/landing/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (res.ok) {
        setPublishedSections([...draftSections]);
        setHasUnpublishedChanges(false);
        setShowPublishModal(false);
        setFeedbackMsg({ type: "success", text: "Landing page published live to the public!" });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Failed to publish landing page." });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard Draft Action
  const handleDiscardDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/landing/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      });
      if (res.ok) {
        setDraftSections([...publishedSections]);
        setHasUnpublishedChanges(false);
        setShowDiscardModal(false);
        setFeedbackMsg({ type: "success", text: "Unpublished draft changes were discarded." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Failed to discard draft." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#1B5E20]/20 border-t-[#1B5E20] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#1F2A24]">Loading Landing Page CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#D6DDD8]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1B5E20] tracking-tight">
              Landing Page Visual CMS
            </h1>
            {hasUnpublishedChanges ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1C2] text-[#8C6B00] border border-[#F2B705]/40 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705] animate-pulse" />
                Unpublished Draft Changes
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
                All Changes Published Live
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#55645B] mt-1">
            System Admin Visual Editor: Customize section content, rearrange modular blocks, and preview in real time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {hasUnpublishedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardModal(true)}
              className="text-[#B3261E] border-[#B3261E]/30 hover:bg-[#FDE8E7]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Discard Draft
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPublishModal(true)}
            isLoading={isSaving}
            className="shadow-sm font-semibold"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Publish Live
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-[#DCEFDD] border-[#1B5E20]/30 text-[#123F17]"
              : "bg-[#FDE8E7] border-[#B3261E]/30 text-[#B3261E]"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split Screen Layout: Left Controls, Right Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Section Manager & Field Editors (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-[#D6DDD8]/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6DDD8]/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1B5E20]" />
                <h3 className="font-heading font-bold text-base text-[#1F2A24]">
                  Section Manager ({draftSections.length})
                </h3>
              </div>

              {/* Add Section Dropdown */}
              <div className="relative group">
                <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Section
                </Button>
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-[#D6DDD8]/80 shadow-xl p-1.5 z-50 hidden group-hover:block animate-in fade-in">
                  <button
                    onClick={() => addSection("HERO")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + Keynote Hero
                  </button>
                  <button
                    onClick={() => addSection("ANNOUNCEMENT")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + Announcement Banner
                  </button>
                  <button
                    onClick={() => addSection("WORKFLOW")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + Annex Workflow Cards
                  </button>
                  <button
                    onClick={() => addSection("STATS")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + Program Stats Grid
                  </button>
                  <button
                    onClick={() => addSection("FAQ")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + FAQ Accordion
                  </button>
                  <button
                    onClick={() => addSection("CONTACT")}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-[#F1F8F1] text-[#1F2A24]"
                  >
                    + Campus Office Info
                  </button>
                </div>
              </div>
            </div>

            {/* List of Modular Sections */}
            <div className="space-y-3">
              {draftSections.map((section, idx) => {
                const isExpanded = activeAccordion === section.id;

                return (
                  <div
                    key={section.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-[#1B5E20]/40 shadow-sm bg-white"
                        : "border-[#D6DDD8]/70 bg-[#F6F8F6]/50 hover:bg-white"
                    } ${!section.enabled ? "opacity-60" : ""}`}
                  >
                    {/* Header bar of section item */}
                    <div className="p-3.5 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Up/Down Reorder */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-black/5 disabled:opacity-20 transition-colors"
                            title="Move section up"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-[#55645B]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, "down")}
                            disabled={idx === draftSections.length - 1}
                            className="p-1 rounded hover:bg-black/5 disabled:opacity-20 transition-colors"
                            title="Move section down"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-[#55645B]" />
                          </button>
                        </div>

                        {/* Title & Badge */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setActiveAccordion(isExpanded ? null : section.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-xs sm:text-sm text-[#1F2A24] truncate">
                              {section.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E9F6EA] text-[#1B5E20] border border-[#1B5E20]/20 uppercase shrink-0">
                              {section.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#55645B] mt-0.5 truncate">
                            {section.enabled ? "Visible on landing page" : "Hidden from landing page"}
                          </p>
                        </div>
                      </div>

                      {/* Controls: Visibility, Edit, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(section.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            section.enabled
                              ? "text-[#1B5E20] hover:bg-[#F1F8F1]"
                              : "text-[#55645B] hover:bg-black/5"
                          }`}
                          title={section.enabled ? "Hide Section" : "Show Section"}
                        >
                          {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveAccordion(isExpanded ? null : section.id)}
                          className="p-1.5 rounded-lg text-[#55645B] hover:text-[#1F2A24] hover:bg-black/5 transition-colors"
                          title="Configure Section Content"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteSection(section.id)}
                          className="p-1.5 rounded-lg text-[#B3261E] hover:bg-[#FDE8E7] transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Section Editor Form */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#D6DDD8]/60 bg-[#FAFCFA] space-y-3.5 text-xs animate-in fade-in duration-150">
                        {/* Section 1: HERO Config Editor */}
                        {section.type === "HERO" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">
                                Status Capsule Text
                              </Label>
                              <Input
                                value={(section.content as HeroSectionConfig).badgeText}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { badgeText: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">
                                  Headline Prefix
                                </Label>
                                <Input
                                  value={(section.content as HeroSectionConfig).headlinePrefix}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { headlinePrefix: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">
                                  Highlight Text
                                </Label>
                                <Input
                                  value={(section.content as HeroSectionConfig).headlineHighlight}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { headlineHighlight: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">
                                Subheadline
                              </Label>
                              <textarea
                                value={(section.content as HeroSectionConfig).subheadline}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { subheadline: e.target.value })
                                }
                                rows={2}
                                className="w-full p-2.5 rounded-xl border border-[#D6DDD8] text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E20] mt-1 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">
                                  Primary Button Label
                                </Label>
                                <Input
                                  value={(section.content as HeroSectionConfig).primaryCtaText}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { primaryCtaText: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">
                                  Secondary Button Label
                                </Label>
                                <Input
                                  value={(section.content as HeroSectionConfig).secondaryCtaText}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { secondaryCtaText: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 2: ANNOUNCEMENT Config Editor */}
                        {section.type === "ANNOUNCEMENT" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Badge Text</Label>
                                <Input
                                  value={(section.content as AnnouncementSectionConfig).badge}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { badge: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Style Theme</Label>
                                <select
                                  value={(section.content as AnnouncementSectionConfig).variant}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { variant: e.target.value })
                                  }
                                  className="w-full h-9 px-2.5 rounded-xl border border-[#D6DDD8] bg-white text-xs mt-1"
                                >
                                  <option value="warning">Warning Gold</option>
                                  <option value="info">Info Blue</option>
                                  <option value="success">Success Green</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Message</Label>
                              <textarea
                                value={(section.content as AnnouncementSectionConfig).message}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { message: e.target.value })
                                }
                                rows={2}
                                className="w-full p-2.5 rounded-xl border border-[#D6DDD8] text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E20] mt-1 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Link Text</Label>
                                <Input
                                  value={(section.content as AnnouncementSectionConfig).linkText || ""}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { linkText: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Link URL</Label>
                                <Input
                                  value={(section.content as AnnouncementSectionConfig).linkUrl || ""}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { linkUrl: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Section 3: WORKFLOW Config Editor */}
                        {section.type === "WORKFLOW" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Section Title</Label>
                              <Input
                                value={(section.content as WorkflowSectionConfig).sectionTitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionTitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Subtitle</Label>
                              <Input
                                value={(section.content as WorkflowSectionConfig).sectionSubtitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionSubtitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <p className="text-[11px] font-bold text-[#1B5E20] pt-1">Cards ({section.content.cards?.length || 0}):</p>
                            {section.content.cards?.map((card: any, cIdx: number) => (
                              <div key={card.id || cIdx} className="p-2.5 rounded-xl border border-[#D6DDD8] bg-white space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Card Title"
                                    value={card.title}
                                    onChange={(e) => {
                                      const updatedCards = [...section.content.cards];
                                      updatedCards[cIdx].title = e.target.value;
                                      updateSectionContent(section.id, { cards: updatedCards });
                                    }}
                                    className="h-8 text-xs rounded-lg flex-1"
                                  />
                                  <Input
                                    placeholder="Badge"
                                    value={card.badge || ""}
                                    onChange={(e) => {
                                      const updatedCards = [...section.content.cards];
                                      updatedCards[cIdx].badge = e.target.value;
                                      updateSectionContent(section.id, { cards: updatedCards });
                                    }}
                                    className="h-8 text-xs rounded-lg w-24"
                                  />
                                </div>
                                <Input
                                  placeholder="Card Description"
                                  value={card.description}
                                  onChange={(e) => {
                                    const updatedCards = [...section.content.cards];
                                    updatedCards[cIdx].description = e.target.value;
                                    updateSectionContent(section.id, { cards: updatedCards });
                                  }}
                                  className="h-8 text-xs rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Section 4: STATS Config Editor */}
                        {section.type === "STATS" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Section Title</Label>
                              <Input
                                value={(section.content as StatsSectionConfig).sectionTitle || ""}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionTitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {section.content.items?.map((item: any, sIdx: number) => (
                                <div key={item.id || sIdx} className="p-2.5 rounded-xl border border-[#D6DDD8] bg-white space-y-1.5">
                                  <Input
                                    placeholder="Value (e.g. 100%)"
                                    value={item.value}
                                    onChange={(e) => {
                                      const updatedItems = [...section.content.items];
                                      updatedItems[sIdx].value = e.target.value;
                                      updateSectionContent(section.id, { items: updatedItems });
                                    }}
                                    className="h-8 text-xs font-bold text-[#1B5E20] rounded-lg"
                                  />
                                  <Input
                                    placeholder="Label"
                                    value={item.label}
                                    onChange={(e) => {
                                      const updatedItems = [...section.content.items];
                                      updatedItems[sIdx].label = e.target.value;
                                      updateSectionContent(section.id, { items: updatedItems });
                                    }}
                                    className="h-8 text-xs rounded-lg"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Section 5: FAQ Config Editor */}
                        {section.type === "FAQ" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Title</Label>
                              <Input
                                value={(section.content as FaqSectionConfig).sectionTitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionTitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            {section.content.items?.map((faq: any, fIdx: number) => (
                              <div key={faq.id || fIdx} className="p-2.5 rounded-xl border border-[#D6DDD8] bg-white space-y-2">
                                <Input
                                  placeholder="Question"
                                  value={faq.question}
                                  onChange={(e) => {
                                    const updatedFaqs = [...section.content.items];
                                    updatedFaqs[fIdx].question = e.target.value;
                                    updateSectionContent(section.id, { items: updatedFaqs });
                                  }}
                                  className="h-8 text-xs font-semibold rounded-lg"
                                />
                                <textarea
                                  placeholder="Answer"
                                  value={faq.answer}
                                  onChange={(e) => {
                                    const updatedFaqs = [...section.content.items];
                                    updatedFaqs[fIdx].answer = e.target.value;
                                    updateSectionContent(section.id, { items: updatedFaqs });
                                  }}
                                  rows={2}
                                  className="w-full p-2 rounded-lg border border-[#D6DDD8] text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E20]"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Section 6: CONTACT Config Editor */}
                        {section.type === "CONTACT" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Campus Office Address</Label>
                              <Input
                                value={(section.content as ContactSectionConfig).officeLocation}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { officeLocation: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Email</Label>
                                <Input
                                  value={(section.content as ContactSectionConfig).email}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { email: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Hotline</Label>
                                <Input
                                  value={(section.content as ContactSectionConfig).hotline}
                                  onChange={(e) =>
                                    updateSectionContent(section.id, { hotline: e.target.value })
                                  }
                                  className="h-9 text-xs rounded-xl mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Interactive Preview Frame (7 Cols on XL) */}
        <div className="xl:col-span-7 sticky top-20">
          <div className="bg-white rounded-3xl border border-[#D6DDD8]/80 p-4 shadow-sm space-y-3">
            {/* Viewport & Device Controls */}
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[#D6DDD8]/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B5E20]">
                <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                <span>Live Interactive Preview</span>
              </div>

              {/* Viewport switchers */}
              <div className="inline-flex p-1 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/70 text-xs">
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                    viewport === "desktop" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                    viewport === "tablet" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                    viewport === "mobile" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Responsive Simulation Container */}
            <div className="bg-[#EAEFEA] p-2 sm:p-4 rounded-2xl flex justify-center items-start min-h-[550px] max-h-[750px] overflow-y-auto">
              <div
                className={`bg-white rounded-2xl shadow-md border border-[#D6DDD8] overflow-hidden transition-all duration-300 ${
                  viewport === "desktop"
                    ? "w-full"
                    : viewport === "tablet"
                    ? "w-[768px] max-w-full"
                    : "w-[375px] max-w-full"
                }`}
              >
                <ModularLanding
                  sections={draftSections}
                  showHeader={true}
                  showFooter={true}
                  onAuthAction={(mode) => {
                    setPreviewAuthMode(mode);
                    setPreviewAuthOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Auth Modal */}
      <AuthModal
        isOpen={previewAuthOpen}
        onClose={() => setPreviewAuthOpen(false)}
        initialMode={previewAuthMode}
      />

      {/* Confirmation Modal: PUBLISH */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        maxWidth="sm"
        className="p-6 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mb-4 border border-[#1B5E20]/20 shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-bold text-[#1F2A24] tracking-tight">
          Publish Landing Page Live?
        </h3>
        <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
          Your draft updates will immediately become visible to all students, visitors, and university personnel.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowPublishModal(false)}
            className="w-1/2 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handlePublishLive}
            isLoading={isSaving}
            className="w-1/2 rounded-xl shadow-xs font-semibold"
          >
            Publish Live
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal: DISCARD */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        maxWidth="sm"
        className="p-6 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FDE8E7] text-[#B3261E] flex items-center justify-center mb-4 border border-[#B3261E]/20 shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-bold text-[#1F2A24] tracking-tight">
          Discard Draft Changes?
        </h3>
        <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
          This will revert your unpublished working draft back to the current live published version.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowDiscardModal(false)}
            className="w-1/2 rounded-xl"
          >
            Keep Editing
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={handleDiscardDraft}
            isLoading={isSaving}
            className="w-1/2 rounded-xl shadow-xs font-semibold"
          >
            Discard
          </Button>
        </div>
      </Modal>
    </div>
  );
}
