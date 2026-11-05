"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  School,
  BookOpen,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EligibilitySectionConfig } from "@/types/landing";
import {
  ScrollReveal,
  motion,
  AnimatePresence,
} from "@/components/landing/motion/motion-wrapper";

interface EligibilityCheckerSectionProps {
  content: EligibilitySectionConfig;
  onAuthAction?: (mode: "login" | "register") => void;
}

const CAMPUSES = [
  { id: "calapan", name: "Calapan City Campus", subtitle: "Main Academic Center" },
  { id: "victoria", name: "Victoria Campus", subtitle: "Agricultural & Environmental" },
  { id: "bongabong", name: "Bongabong Campus", subtitle: "Fisheries & Technology" },
];

const YEAR_LEVELS = [
  { id: "1", label: "1st Year (Freshman)" },
  { id: "2", label: "2nd Year (Sophomore)" },
  { id: "3", label: "3rd Year (Junior)" },
  { id: "4", label: "4th / 5th Year (Senior)" },
];

const GWA_RANGES = [
  { id: "high", label: "1.00 – 1.75 (Dean's List / Excellent)", qualified: true },
  { id: "mid", label: "1.76 – 2.25 (Very Good)", qualified: true },
  { id: "pass", label: "2.26 – 2.75 (Good Standing)", qualified: true },
  { id: "marginal", label: "2.76 – 3.00 (Passing)", qualified: true },
  { id: "failing", label: "Below 3.00 or Incomplete", qualified: false },
];

export function EligibilityCheckerSection({
  content,
  onAuthAction,
}: EligibilityCheckerSectionProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedGwa, setSelectedGwa] = useState<string>("");

  const handleReset = () => {
    setStep(1);
    setSelectedCampus("");
    setSelectedYear("");
    setSelectedGwa("");
  };

  const isEligible =
    selectedCampus !== "" &&
    selectedYear !== "" &&
    GWA_RANGES.find((g) => g.id === selectedGwa)?.qualified === true;

  const currentGwaObj = GWA_RANGES.find((g) => g.id === selectedGwa);

  return (
    <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Section Header */}
      <ScrollReveal className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B5E20]/10 border border-[#1B5E20]/20 text-[#1B5E20] text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
          <span>{content.badgeText || "CHED-UniFAST Self-Assessment"}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1F2A24] tracking-tight">
          {content.sectionTitle || "Check Your TDP Grant Eligibility"}
        </h3>
        <p className="text-xs sm:text-sm text-[#55645B] mt-2 leading-relaxed">
          {content.sectionSubtitle ||
            "Take 30 seconds to verify whether you meet the preliminary qualification requirements for the Tulong Dunong Program."}
        </p>
      </ScrollReveal>

      {/* Main Interactive Card */}
      <ScrollReveal delay={0.08}>
        <div className="bg-white rounded-2xl border border-[#D6DDD8]/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Step Progress Bar */}
          <div className="bg-[#F1F8F1] px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#D6DDD8]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step === num
                        ? "bg-[#1B5E20] text-white shadow-xs scale-105"
                        : step > num
                        ? "bg-[#DCEFDD] text-[#1B5E20]"
                        : "bg-white text-[#55645B] border border-[#D6DDD8]"
                    }`}
                  >
                    {step > num ? <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" /> : num}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline transition-colors ${
                      step === num ? "text-[#1F2A24] font-semibold" : "text-[#55645B]"
                    }`}
                  >
                    {num === 1 ? "MinSU Campus" : num === 2 ? "Year Level" : "Academic Standing"}
                  </span>
                  {num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-[#D6DDD8] mx-1" />}
                </div>
              ))}
            </div>

            {step > 1 && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-[#55645B] hover:text-[#1B5E20] font-medium transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Card Body with Smooth Animated Step Transitions */}
          <div className="p-4 sm:p-8 min-h-[280px]">
            <AnimatePresence mode="wait">
              {/* STEP 1: Campus Selection */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="space-y-6"
                >
                  <div>
                    <h4 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] flex items-center gap-2">
                      <School className="w-5 h-5 text-[#1B5E20]" />
                      Step 1: Select your enrolled Mindoro State University campus
                    </h4>
                    <p className="text-xs text-[#55645B] mt-1">
                      The Tulong Dunong Program is unified across all three official MinSU campuses.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {CAMPUSES.map((c) => {
                      const isSelected = selectedCampus === c.id;
                      return (
                        <motion.button
                          key={c.id}
                          type="button"
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          onClick={() => {
                            setSelectedCampus(c.id);
                            setStep(2);
                          }}
                          className={`p-4 rounded-xl text-left border transition-all ${
                            isSelected
                              ? "border-[#1B5E20] bg-[#F1F8F1] ring-2 ring-[#1B5E20]/20"
                              : "border-[#D6DDD8] bg-white hover:border-[#1B5E20]/40 hover:bg-[#F6F8F6]"
                          }`}
                        >
                          <span className="block text-sm font-bold text-[#1F2A24]">{c.name}</span>
                          <span className="block text-xs text-[#55645B] mt-1">{c.subtitle}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Year Level */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="space-y-6"
                >
                  <div>
                    <h4 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#1B5E20]" />
                      Step 2: What is your current undergraduate year level?
                    </h4>
                    <p className="text-xs text-[#55645B] mt-1">
                      Enrolled students in recognized undergraduate programs are eligible for Annex 2.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {YEAR_LEVELS.map((y) => (
                      <motion.button
                        key={y.id}
                        type="button"
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => {
                          setSelectedYear(y.id);
                          setStep(3);
                        }}
                        className="p-4 rounded-xl text-left border border-[#D6DDD8] bg-white hover:border-[#1B5E20]/40 hover:bg-[#F1F8F1] transition-all flex items-center justify-between"
                      >
                        <span className="text-sm font-semibold text-[#1F2A24]">{y.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#1B5E20]" />
                      </motion.button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-[#55645B] hover:text-[#1B5E20]"
                    >
                      ← Back to Campus
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: GWA */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="space-y-6"
                >
                  <div>
                    <h4 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#B88A00]" />
                      Step 3: What was your General Weighted Average (GWA) last semester?
                    </h4>
                    <p className="text-xs text-[#55645B] mt-1">
                      CHED TDP-TES guidelines prioritize regular students in good academic standing.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {GWA_RANGES.map((g) => (
                      <motion.button
                        key={g.id}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => {
                          setSelectedGwa(g.id);
                          setStep(4);
                        }}
                        className="w-full p-3.5 rounded-xl text-left border border-[#D6DDD8] bg-white hover:border-[#1B5E20]/40 hover:bg-[#F1F8F1] transition-all flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-[#1F2A24]">{g.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#1B5E20]" />
                      </motion.button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-[#55645B] hover:text-[#1B5E20]"
                    >
                      ← Back to Year Level
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Results Display */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="space-y-6"
                >
                  {isEligible ? (
                    <div className="rounded-xl bg-gradient-to-br from-[#F1F8F1] to-[#E3F2E5] border border-[#1B5E20]/20 p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                          className="w-12 h-12 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0 shadow-md"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </motion.div>
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B5E20] text-white mb-2">
                            <span>Preliminary Status: Highly Eligible</span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-heading font-extrabold text-[#123F17]">
                            You meet the qualifications for the Tulong Dunong Program!
                          </h4>
                          <p className="text-xs sm:text-sm text-[#164D1C] mt-2 leading-relaxed">
                            Based on your enrolled status at MinSU ({CAMPUSES.find((c) => c.id === selectedCampus)?.name}) and academic standing ({currentGwaObj?.label}), you are primed to receive TDP financial assistance ({content.grantAmount || "₱7,500.00 / Sem"}).
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-5 border-t border-[#1B5E20]/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#1F2A24]">
                        <div className="bg-white/80 p-3 rounded-lg border border-[#1B5E20]/10">
                          <span className="text-[#55645B] block text-[11px]">Requirement 1</span>
                          <span className="font-semibold mt-0.5 block">Certificate of Registration (COR)</span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-[#1B5E20]/10">
                          <span className="text-[#55645B] block text-[11px]">Requirement 2</span>
                          <span className="font-semibold mt-0.5 block">Certified Grade Slip / Transcript</span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-[#1B5E20]/10">
                          <span className="text-[#55645B] block text-[11px]">Requirement 3</span>
                          <span className="font-semibold mt-0.5 block">Barangay Indigency / Proof of Income</span>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Button
                          variant="primary"
                          size="lg"
                          className="px-6 py-3 font-semibold shadow-md active:scale-97"
                          onClick={() => onAuthAction?.("register")}
                        >
                          <GraduationCap className="w-5 h-5 mr-2" />
                          Register & Submit Application
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="px-6 py-3 border-[#1B5E20]/40 text-[#1B5E20] active:scale-97"
                          onClick={handleReset}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Check Another Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gradient-to-br from-[#FFF8F8] to-[#FFF1F1] border border-red-200 p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg sm:text-xl font-heading font-bold text-red-900">
                            Academic Standing Requires Review
                          </h4>
                          <p className="text-xs sm:text-sm text-red-700 mt-2 leading-relaxed">
                            CHED TDP-TES guidelines require regular academic standing without failing or incomplete grades. If you have special mitigating circumstances, please consult the Campus Scholarship Coordinator.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleReset}
                          className="text-xs font-semibold active:scale-97"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
