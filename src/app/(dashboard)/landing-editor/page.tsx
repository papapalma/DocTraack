"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  EligibilitySectionConfig,
  LeadershipTrustSectionConfig,
  LandingStyleSettings,
  DEFAULT_STYLE_SETTINGS,
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
  Sliders,
  Image as ImageIcon,
  Maximize2,
  X,
  HelpCircle,
  BarChart3,
  PhoneCall,
  Award,
  Megaphone,
} from "lucide-react";

const SECTION_TEMPLATES: {
  type: SectionType;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: "HERO",
    title: "Keynote Hero",
    badge: "Intro",
    description: "Keynote headline, MinSU 3D Crest orbit, and primary CTA buttons.",
    icon: Sparkles,
  },
  {
    type: "ANNOUNCEMENT",
    title: "Announcement Banner",
    badge: "Alert",
    description: "Time-sensitive intake alert bar with optional link.",
    icon: Megaphone,
  },
  {
    type: "WORKFLOW",
    title: "Annex Workflow Cards",
    badge: "Process",
    description: "Interactive visual cards detailing TDP submission lifecycle.",
    icon: Layers,
  },
  {
    type: "ELIGIBILITY_CHECKER",
    title: "Eligibility Checker",
    badge: "Tool",
    description: "Interactive 3-step self-assessment for prospective scholars.",
    icon: CheckCircle2,
  },
  {
    type: "LEADERSHIP_TRUST",
    title: "Leadership & Trust",
    badge: "Governance",
    description: "Director endorsement message, seals, and CHED compliance.",
    icon: Award,
  },
  {
    type: "STATS",
    title: "Program Stats Grid",
    badge: "Metrics",
    description: "Key performance figures, audited beneficiaries, and campus metrics.",
    icon: BarChart3,
  },
  {
    type: "FAQ",
    title: "FAQ Accordion",
    badge: "Support",
    description: "Expandable answers to common scholarship applicant questions.",
    icon: HelpCircle,
  },
  {
    type: "CONTACT",
    title: "Office Directory",
    badge: "Contact",
    description: "MinSU campus office addresses, hotlines, and operating hours.",
    icon: PhoneCall,
  },
];

export default function LandingEditorPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const router = useRouter();

  const [draftSections, setDraftSections] = useState<LandingSection[]>([]);
  const [publishedSections, setPublishedSections] = useState<LandingSection[]>([]);
  const [styleSettings, setStyleSettings] = useState<LandingStyleSettings>(DEFAULT_STYLE_SETTINGS);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(640);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  const [fullscreenViewport, setFullscreenViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Confirmation & Preview Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [previewAuthOpen, setPreviewAuthOpen] = useState(false);
  const [previewAuthMode, setPreviewAuthMode] = useState<"login" | "register">("login");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const addSectionMenuRef = useRef<HTMLDivElement>(null);

  // Close Add Section menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addSectionMenuRef.current &&
        !addSectionMenuRef.current.contains(event.target as Node)
      ) {
        setIsAddSectionOpen(false);
      }
    };
    if (isAddSectionOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddSectionOpen]);

  // Synchronize state to preview iframes (both in-page and fullscreen)
  const sendPreviewUpdate = useCallback(
    (sections: LandingSection[], styles: LandingStyleSettings) => {
      try {
        sessionStorage.setItem(
          "minsu_landing_preview_draft",
          JSON.stringify({ sections, styleSettings: styles })
        );
      } catch {}

      const message = {
        type: "MINSU_LANDING_PREVIEW_UPDATE",
        sections,
        styleSettings: styles,
      };

      previewIframeRef.current?.contentWindow?.postMessage(message, "*");
      fullscreenIframeRef.current?.contentWindow?.postMessage(message, "*");
    },
    []
  );

  // Send updates to iframe whenever draftSections or styleSettings change
  useEffect(() => {
    if (draftSections.length > 0) {
      sendPreviewUpdate(draftSections, styleSettings);
    }
  }, [draftSections, styleSettings, sendPreviewUpdate]);

  // When preview iframe announces it is ready, send the latest state immediately
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "MINSU_PREVIEW_READY") {
        sendPreviewUpdate(draftSections, styleSettings);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [draftSections, styleSettings, sendPreviewUpdate]);

  // ResizeObserver for dynamic preview container width
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcut to close Fullscreen Preview on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullscreenPreview) {
        setShowFullscreenPreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFullscreenPreview]);

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
          if (data.config?.styleSettings) {
            setStyleSettings(data.config.styleSettings);
          }
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

  // Auto-save draft changes to backend
  const saveDraftToBackend = async (
    newDraft: LandingSection[],
    newStyle?: LandingStyleSettings
  ) => {
    setIsSaving(true);
    setHasUnpublishedChanges(true);
    try {
      await fetch("/api/landing/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftSections: newDraft,
          styleSettings: newStyle || styleSettings,
        }),
      });
    } catch (e) {
      console.error("Error auto-saving draft:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStyleSettings = (updates: Partial<LandingStyleSettings>) => {
    const updated = { ...styleSettings, ...updates };
    setStyleSettings(updated);
    saveDraftToBackend(draftSections, updated);
  };

  const handleUploadImage = async (
    file: File,
    category: "background" | "director" | "ched" | "general"
  ): Promise<string | null> => {
    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch("/api/landing/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setFeedbackMsg({ type: "error", text: err.error || "Failed to upload image" });
        return null;
      }

      const data = await res.json();
      setFeedbackMsg({ type: "success", text: "Image uploaded successfully!" });
      return data.url;
    } catch (e) {
      console.error("Upload error:", e);
      setFeedbackMsg({ type: "error", text: "Image upload failed." });
      return null;
    } finally {
      setIsUploadingMedia(false);
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
      case "ELIGIBILITY_CHECKER":
        newSection = {
          id: newId,
          type: "ELIGIBILITY_CHECKER",
          title: "TDP Eligibility Checker",
          enabled: true,
          content: {
            sectionTitle: "Check Your TDP Grant Eligibility",
            sectionSubtitle:
              "Fast 3-step self-assessment for Mindoro State University students under CHED TDP-TES guidelines.",
            badgeText: "CHED-UniFAST Guidelines",
            grantAmount: "₱7,500.00 / Semester",
            guidelinesUrl: "#",
          },
        };
        break;
      case "LEADERSHIP_TRUST":
        newSection = {
          id: newId,
          type: "LEADERSHIP_TRUST",
          title: "Leadership & Institutional Trust",
          enabled: true,
          content: {
            sectionTitle: "Institutional Leadership & Trust",
            sectionSubtitle:
              "Mindoro State University's commitment to transparent, timely financial assistance through digitized Annex workflows.",
            directorName: "Campus Director",
            directorTitle: "Mindoro State University - Bongabong Campus",
            directorMessage:
              "MinSU DocTrack upholds our commitment to good governance, accountability, and student welfare. By modernizing our Annex 1 to 10 transmittal pipeline with CHED and UniFAST, we ensure every deserving student receives their financial assistance without delays.",
            directorImage: "/director.png",
            chedLogoImage: "/ched-unifast.png",
            minsuSealImage: "/minsu-seal.png",
            chedAccreditationTitle: "CHED-UniFAST Compliant Workflow",
            chedAccreditationDetails:
              "Fully aligned with UniFAST Memorandum Orders for Tulong Dunong Program fund disbursement, electronic billing (Annex 1), and certified master lists (Annex 3).",
            coreValues: [
              {
                title: "Institutional Excellence",
                description: "Precision auditing and verifiable agency transmittal archives.",
                tag: "EXCELLENCE",
              },
              {
                title: "Transparency & Integrity",
                description: "Immutable digital audit trails for every document decision and approval.",
                tag: "INTEGRITY",
              },
              {
                title: "Dedicated Public Service",
                description: "Empowering MinSU scholars through streamlined financial assistance access.",
                tag: "SERVICE",
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
    setFeedbackMsg({
      type: "success",
      text: `Added new ${newSection.title} to draft!`,
    });

    // Smooth scroll to the newly added section in the editor accordion
    setTimeout(() => {
      const el = document.getElementById(`section-item-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
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
        const data = await res.json();
        setPublishedSections([...draftSections]);
        if (data.config?.styleSettings) {
          setStyleSettings(data.config.styleSettings);
        }
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
        const data = await res.json();
        setDraftSections([...publishedSections]);
        if (data.config?.styleSettings) {
          setStyleSettings(data.config.styleSettings);
        }
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

  // Scaled preview dimensions
  const availableWidth = Math.max(containerWidth - 32, 280);
  let targetWidth = 1280;
  let targetHeight = 840;
  let scale = 1;

  if (viewport === "desktop") {
    targetWidth = 1280;
    targetHeight = 840;
    scale = Math.min(1, availableWidth / 1280);
  } else if (viewport === "tablet") {
    targetWidth = 768;
    targetHeight = 900;
    scale = Math.min(1, availableWidth / 768);
  } else {
    targetWidth = 375;
    targetHeight = 740;
    scale = Math.min(1, availableWidth / 375);
  }

  const outerWidth = Math.round(targetWidth * scale);
  const outerHeight = Math.min(760, Math.round(targetHeight * scale));

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
          {/* Visual & Motion Studio Card */}
          <div className="bg-white rounded-3xl border border-[#D6DDD8]/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6DDD8]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF1C2] text-[#8C6B00] flex items-center justify-center border border-[#F2B705]/40 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#B88A00]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1F2A24] leading-tight">
                    Motion & Styling Studio
                  </h3>
                  <p className="text-[11px] text-[#55645B]">
                    Apple-grade physics, background imagery, & contrast controls
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Motion Experience Level */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1F2A24] flex items-center justify-between">
                <span>Motion Experience</span>
                <span className="text-[10px] font-normal text-[#55645B] capitalize">
                  Current: {styleSettings.motionLevel}
                </span>
              </Label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8]">
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ motionLevel: "fluid" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                    styleSettings.motionLevel === "fluid"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  <span className="flex items-center gap-1">Fluid ✦</span>
                  <span className="text-[9px] opacity-80">Apple Springs</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ motionLevel: "subtle" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                    styleSettings.motionLevel === "subtle"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  <span>Subtle</span>
                  <span className="text-[9px] opacity-80">Soft Fades</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ motionLevel: "off" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                    styleSettings.motionLevel === "off"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  <span>Off</span>
                  <span className="text-[9px] opacity-80">Zero Motion</span>
                </button>
              </div>
            </div>

            {/* 2. Campus Background Image & Uploader */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1F2A24]">
                Campus Background Photo
              </Label>
              <div className="flex gap-2">
                <Input
                  value={styleSettings.customBgImage || ""}
                  onChange={(e) => updateStyleSettings({ customBgImage: e.target.value })}
                  placeholder="/campus-bg.jpg"
                  className="h-9 text-xs rounded-xl flex-1"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#DCEFDD] text-[#123F17] hover:bg-[#c9e7cb] rounded-xl cursor-pointer border border-[#1B5E20]/20 transition shrink-0">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploadingMedia ? "..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingMedia}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await handleUploadImage(file, "background");
                      if (url) updateStyleSettings({ customBgImage: url });
                    }}
                  />
                </label>
              </div>
              <p className="text-[10px] text-[#55645B]">
                Upload high-res aerial MinSU campus photograph (JPEG, PNG, WebP up to 10MB).
              </p>
            </div>

            {/* 3. Frosted Glass Tint & Contrast */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1F2A24] flex items-center justify-between">
                <span>Frosted Glass Tint & Contrast</span>
                <span className="text-[10px] font-normal text-[#55645B]">
                  {styleSettings.bgOverlayOpacity === "light"
                    ? "75% Tint"
                    : styleSettings.bgOverlayOpacity === "balanced"
                    ? "85% Tint (Recommended)"
                    : "94% Deep Tint"}
                </span>
              </Label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8]">
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ bgOverlayOpacity: "light" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    styleSettings.bgOverlayOpacity === "light"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  Light (75%)
                </button>
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ bgOverlayOpacity: "balanced" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    styleSettings.bgOverlayOpacity === "balanced"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  Balanced (85%)
                </button>
                <button
                  type="button"
                  onClick={() => updateStyleSettings({ bgOverlayOpacity: "deep" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    styleSettings.bgOverlayOpacity === "deep"
                      ? "bg-[#1B5E20] text-white shadow-xs font-bold"
                      : "text-[#55645B] hover:text-[#1F2A24]"
                  }`}
                >
                  Deep (94%)
                </button>
              </div>
            </div>

            {/* 4. Interactive 3D MinSU Crest Orbit */}
            <div className="pt-2 border-t border-[#D6DDD8]/60 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-[#1F2A24]">
                  3D Interactive Shield Orbit
                </Label>
                <p className="text-[10px] text-[#55645B]">
                  Golden gyroscopic rings & floating particle dust in hero
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateStyleSettings({ enable3DOrbit: !styleSettings.enable3DOrbit })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  styleSettings.enable3DOrbit ? "bg-[#1B5E20]" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    styleSettings.enable3DOrbit ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section Accordions */}
          <div className="bg-white rounded-3xl border border-[#D6DDD8]/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6DDD8]/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1B5E20]" />
                <h3 className="font-heading font-bold text-base text-[#1F2A24]">
                  Section Manager ({draftSections.length})
                </h3>
              </div>

              {/* Add Section Dropdown Menu */}
              <div ref={addSectionMenuRef} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddSectionOpen((prev) => !prev)}
                  className="h-8 text-xs font-semibold apple-press flex items-center gap-1.5 border-[#1B5E20]/30 text-[#1B5E20] hover:bg-[#F1F8F1]"
                  aria-expanded={isAddSectionOpen}
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddSectionOpen ? "rotate-45" : ""}`} />
                  Add Section
                </Button>

                {isAddSectionOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#D6DDD8] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[#D6DDD8]/60 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1F2A24] uppercase tracking-wider">
                        Choose Section Type
                      </span>
                      <span className="text-[10px] text-[#55645B]">
                        Click to append
                      </span>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto space-y-1 apple-scrollbar p-1">
                      {SECTION_TEMPLATES.map((tmpl) => {
                        const Icon = tmpl.icon;
                        return (
                          <button
                            key={tmpl.type}
                            type="button"
                            onClick={() => {
                              addSection(tmpl.type);
                              setIsAddSectionOpen(false);
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-[#F1F8F1] transition-all flex items-start gap-2.5 group apple-press border border-transparent hover:border-[#1B5E20]/20"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1B5E20] group-hover:text-white transition-colors">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-heading font-bold text-xs text-[#1F2A24] group-hover:text-[#1B5E20] transition-colors truncate">
                                  {tmpl.title}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-[#55645B] font-semibold uppercase">
                                  {tmpl.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#55645B] line-clamp-1 mt-0.5 leading-snug">
                                {tmpl.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List of Modular Sections */}
            <div className="space-y-3">
              {draftSections.map((section, idx) => {
                const isExpanded = activeAccordion === section.id;

                return (
                  <div
                    key={section.id}
                    id={`section-item-${section.id}`}
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

                        {/* Section 7: ELIGIBILITY_CHECKER Config Editor */}
                        {section.type === "ELIGIBILITY_CHECKER" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Section Title</Label>
                              <Input
                                value={(section.content as EligibilitySectionConfig).sectionTitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionTitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Section Subtitle</Label>
                              <Input
                                value={(section.content as EligibilitySectionConfig).sectionSubtitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { sectionSubtitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Estimated Grant Stipend</Label>
                              <Input
                                value={(section.content as EligibilitySectionConfig).grantAmount}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { grantAmount: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                          </div>
                        )}

                        {/* Section 8: LEADERSHIP_TRUST Config Editor */}
                        {section.type === "LEADERSHIP_TRUST" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Campus Director Name</Label>
                              <Input
                                value={(section.content as LeadershipTrustSectionConfig).directorName}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { directorName: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Campus Director Title</Label>
                              <Input
                                value={(section.content as LeadershipTrustSectionConfig).directorTitle}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { directorTitle: e.target.value })
                                }
                                className="h-9 text-xs rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-bold text-[#1F2A24]">Director Endorsement Quote</Label>
                              <textarea
                                value={(section.content as LeadershipTrustSectionConfig).directorMessage}
                                onChange={(e) =>
                                  updateSectionContent(section.id, { directorMessage: e.target.value })
                                }
                                rows={3}
                                className="w-full p-2.5 rounded-xl border border-[#D6DDD8] text-xs focus:outline-none focus:ring-1 focus:ring-[#1B5E20] mt-1"
                              />
                            </div>
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-[#1F2A24]">Campus Director Portrait</Label>
                                <div className="flex gap-1.5">
                                  <Input
                                    value={(section.content as LeadershipTrustSectionConfig).directorImage || ""}
                                    onChange={(e) =>
                                      updateSectionContent(section.id, { directorImage: e.target.value })
                                    }
                                    placeholder="/director.jpg"
                                    className="h-9 text-xs rounded-xl flex-1"
                                  />
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#DCEFDD] text-[#123F17] hover:bg-[#c9e7cb] rounded-xl cursor-pointer border border-[#1B5E20]/20 transition shrink-0">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingMedia}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = await handleUploadImage(file, "director");
                                        if (url) updateSectionContent(section.id, { directorImage: url });
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-[#1F2A24]">CHED & Institutional Partner Logo</Label>
                                <div className="flex gap-1.5">
                                  <Input
                                    value={(section.content as LeadershipTrustSectionConfig).chedLogoImage || ""}
                                    onChange={(e) =>
                                      updateSectionContent(section.id, { chedLogoImage: e.target.value })
                                    }
                                    placeholder="/ched-unifast.png"
                                    className="h-9 text-xs rounded-xl flex-1"
                                  />
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FFF1C2] text-[#8C6B00] hover:bg-[#fee79a] rounded-xl cursor-pointer border border-[#F2B705]/40 transition shrink-0">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingMedia}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = await handleUploadImage(file, "ched");
                                        if (url) updateSectionContent(section.id, { chedLogoImage: url });
                                      }}
                                    />
                                  </label>
                                </div>
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
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[#D6DDD8]/60 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B5E20]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Live Interactive Preview</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F1F8F1] text-[#55645B] border border-[#D6DDD8] hidden sm:inline font-semibold">
                  {viewport === "desktop" ? "1280px" : viewport === "tablet" ? "768px" : "375px"}
                  {scale < 1 && ` • ${Math.round(scale * 100)}%`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Viewport switchers */}
                <div className="inline-flex p-0.5 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all apple-press ${
                      viewport === "desktop" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                    }`}
                    title="Desktop View (1280px)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("tablet")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all apple-press ${
                      viewport === "tablet" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                    }`}
                    title="Tablet View (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all apple-press ${
                      viewport === "mobile" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                    }`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                {/* Expand Fullscreen Preview Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullscreenPreview(true)}
                  className="apple-press text-xs font-semibold text-[#1B5E20] border-[#1B5E20]/30 hover:bg-[#DCEFDD]/50 h-7 px-2.5"
                  title="Open In-App Fullscreen Studio (ESC to exit)"
                >
                  <Maximize2 className="w-3.5 h-3.5 sm:mr-1 text-[#1B5E20]" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </Button>
              </div>
            </div>

            {/* Responsive Scaled Simulation Container */}
            <div
              ref={previewContainerRef}
              className="bg-[#EAEFEA] p-2 sm:p-4 rounded-2xl flex justify-center items-start min-h-[550px] max-h-[780px] overflow-hidden"
            >
              <div
                style={{
                  width: `${outerWidth}px`,
                  height: `${outerHeight}px`,
                }}
                className="relative bg-white rounded-2xl shadow-md border border-[#D6DDD8] overflow-hidden transition-all duration-300"
              >
                <div
                  style={{
                    width: `${targetWidth}px`,
                    height: `${outerHeight / scale}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  className="w-full h-full overflow-hidden"
                >
                  <iframe
                    ref={previewIframeRef}
                    src="/landing-preview"
                    title="Live Device Preview"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Glass Fullscreen Studio Modal */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Top Floating Glass Header */}
          <div className="h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-[#D6DDD8] px-3 sm:px-6 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B5E20] animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-[#1B5E20] uppercase tracking-wide">
                  Fullscreen Studio Preview
                </span>
              </div>
              <span className="text-xs text-[#55645B] hidden md:inline">
                • Live Interactive Simulation (ESC to exit)
              </span>
            </div>

            {/* Viewport Toggles inside Fullscreen */}
            <div className="inline-flex p-1 bg-[#F1F8F1] rounded-xl border border-[#D6DDD8]/70 text-xs">
              <button
                type="button"
                onClick={() => setFullscreenViewport("desktop")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all apple-press ${
                  fullscreenViewport === "desktop" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreenViewport("tablet")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all apple-press ${
                  fullscreenViewport === "tablet" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreenViewport("mobile")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all apple-press ${
                  fullscreenViewport === "mobile" ? "bg-white text-[#1B5E20] shadow-2xs font-bold" : "text-[#55645B]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Top Bar Actions: Publish Live & Close */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowFullscreenPreview(false);
                  setShowPublishModal(true);
                }}
                disabled={!hasUnpublishedChanges || isSaving}
                className="apple-press text-xs font-bold shadow-xs bg-[#1B5E20] hover:bg-[#164D1C]"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Publish Live
              </Button>

              <button
                type="button"
                onClick={() => setShowFullscreenPreview(false)}
                className="p-1.5 rounded-lg text-[#55645B] hover:text-[#1F2A24] hover:bg-black/5 transition apple-press"
                title="Close Fullscreen (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Body Frame */}
          <div className="flex-1 overflow-y-auto bg-[#EAEFEA] flex justify-center items-start p-0 sm:p-4">
            <div
              className={`bg-white shadow-2xl transition-all duration-300 ${
                fullscreenViewport === "desktop"
                  ? "w-full h-full"
                  : fullscreenViewport === "tablet"
                  ? "w-[768px] h-[95vh] my-4 rounded-2xl border border-[#D6DDD8] overflow-hidden"
                  : "w-[375px] h-[812px] my-4 rounded-3xl border-4 border-[#1F2A24] shadow-2xl overflow-hidden"
              }`}
            >
              <iframe
                ref={fullscreenIframeRef}
                src="/landing-preview"
                title="Fullscreen Preview"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}

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
