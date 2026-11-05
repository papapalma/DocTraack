"use client";

import React, { useEffect, useState, Suspense } from "react";
import { ModularLanding } from "@/components/landing/modular-landing";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  LandingSection,
  LandingStyleSettings,
  DEFAULT_LANDING_SECTIONS,
  DEFAULT_STYLE_SETTINGS,
} from "@/types/landing";

function LandingPreviewContent() {
  const [sections, setSections] = useState<LandingSection[]>(DEFAULT_LANDING_SECTIONS);
  const [styleSettings, setStyleSettings] = useState<LandingStyleSettings>(DEFAULT_STYLE_SETTINGS);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    // 1. Initial state hydration from sessionStorage
    try {
      const storedDraft = sessionStorage.getItem("minsu_landing_preview_draft");
      if (storedDraft) {
        const parsed = JSON.parse(storedDraft);
        if (parsed.sections && Array.isArray(parsed.sections)) {
          setSections(parsed.sections);
        }
        if (parsed.styleSettings) {
          setStyleSettings(parsed.styleSettings);
        }
      }
    } catch {
      // Fallback to default
    }

    // 2. Listen for live real-time postMessage events from the editor parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MINSU_LANDING_PREVIEW_UPDATE") {
        if (event.data.sections && Array.isArray(event.data.sections)) {
          setSections(event.data.sections);
        }
        if (event.data.styleSettings) {
          setStyleSettings(event.data.styleSettings);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // 3. Notify parent editor that preview iframe is mounted & ready
    try {
      window.parent?.postMessage({ type: "MINSU_PREVIEW_READY" }, "*");
    } catch {}

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <>
      <ModularLanding
        sections={sections}
        styleSettings={styleSettings}
        showHeader={true}
        showFooter={true}
        isEmbeddedPreview={true}
        onAuthAction={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
        className="min-h-screen"
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}

export default function LandingPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F8F6]" />}>
      <LandingPreviewContent />
    </Suspense>
  );
}

