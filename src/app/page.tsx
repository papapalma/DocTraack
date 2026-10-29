"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import { ModularLanding } from "@/components/landing/modular-landing";
import { DEFAULT_LANDING_SECTIONS, LandingSection } from "@/types/landing";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<LandingSection[]>(DEFAULT_LANDING_SECTIONS);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Check if session already exists
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.role === "STUDENT") {
            router.push("/portal");
          } else {
            router.push("/dashboard");
          }
        }
      })
      .catch(() => {});
  }, [router]);

  // Fetch published landing page sections
  useEffect(() => {
    fetch("/api/landing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sections && Array.isArray(data.sections)) {
          setSections(data.sections);
        }
      })
      .catch(() => {});
  }, []);

  // Open modal automatically if ?auth=login or ?auth=register is passed
  useEffect(() => {
    const authParam = searchParams?.get("auth");
    if (authParam === "login") {
      setAuthMode("login");
      setAuthOpen(true);
    } else if (authParam === "register") {
      setAuthMode("register");
      setAuthOpen(true);
    }
  }, [searchParams]);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthOpen(false);
    // Remove ?auth parameter from URL without full reload
    if (typeof window !== "undefined" && window.location.search.includes("auth=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  return (
    <>
      <ModularLanding sections={sections} onAuthAction={handleOpenAuth} />
      <AuthModal
        isOpen={authOpen}
        onClose={handleCloseAuth}
        initialMode={authMode}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F8F6]" />}>
      <HomeContent />
    </Suspense>
  );
}
