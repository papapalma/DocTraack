"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  CertificateTemplateConfig,
  DEFAULT_CERTIFICATE_TEMPLATE,
  PAPER_SIZES,
  renderCertificateBody,
  StudentCertificateTokens,
} from "@/lib/certificate";
import { CertificateLogoRenderer } from "@/components/certificate/certificate-logo";
import Image from "next/image";

export interface CertificateStudentData {
  name: string;
  studentId?: string;
  course?: string;
  campus?: string;
  batchNumber?: number | string;
  trackingCode?: string;
  dateAwarded?: string;
  universityName?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData?: CertificateStudentData;
  batchStudents?: CertificateStudentData[];
  overrideTemplate?: CertificateTemplateConfig;
}

/**
 * Injects dedicated dynamic print stylesheet for full-bleed certificate printing
 */
function injectCertificatePrintStyles(paper: any) {
  if (typeof document === "undefined") return;
  let styleEl = document.getElementById("minsu-certificate-print-style") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "minsu-certificate-print-style";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @page {
      size: ${paper.widthMm || 297}mm ${paper.heightMm || 210}mm landscape;
      margin: 0mm;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 100% !important;
        height: 100% !important;
      }
      /* Hide all standard body children when printing certificate */
      body.printing-certificate > :not(#printable-certificate-root) {
        display: none !important;
      }
      body:not(.printing-certificate) #printable-certificate-root {
        display: none !important;
      }
      body.printing-certificate #printable-certificate-root {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        z-index: 99999999 !important;
      }
      .certificate-sheet-page {
        width: 100vw !important;
        height: 100vh !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .certificate-sheet-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .certificate-print-canvas-box {
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        background: #ffffff !important;
      }
    }
  `;
}

export function CertificateModal({
  isOpen,
  onClose,
  studentData,
  batchStudents,
  overrideTemplate,
}: CertificateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [template, setTemplate] = useState<CertificateTemplateConfig>(
    overrideTemplate || DEFAULT_CERTIFICATE_TEMPLATE
  );
  const [isLoading, setIsLoading] = useState(!overrideTemplate);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (overrideTemplate) {
      setTemplate(overrideTemplate);
      return;
    }

    async function loadTemplate() {
      try {
        const res = await fetch("/api/certificate/template");
        if (res.ok) {
          const data = await res.json();
          if (data.template) {
            setTemplate(data.template);
          }
        }
      } catch (err) {
        console.error("Failed to load certificate template:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      loadTemplate();
      setActiveBatchIndex(0);
    }
  }, [isOpen, overrideTemplate]);

  const currentPaper = PAPER_SIZES[template.paperSize || "A4"] || PAPER_SIZES.A4;

  // Pre-inject print style and handle browser print events (Ctrl+P / window.print)
  useEffect(() => {
    if (!isOpen) return;

    injectCertificatePrintStyles(currentPaper);

    const handleBeforePrint = () => {
      injectCertificatePrintStyles(currentPaper);
      document.body.classList.add("printing-certificate");
    };

    const handleAfterPrint = () => {
      document.body.classList.remove("printing-certificate");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-certificate");
    };
  }, [isOpen, currentPaper]);

  if (!isOpen) return null;

  const studentList: CertificateStudentData[] =
    batchStudents && batchStudents.length > 0
      ? batchStudents
      : studentData
      ? [studentData]
      : [
          {
            name: "Juan Dela Cruz",
            studentId: "2024-00123-BC",
            course: "Bachelor of Science in Information Technology",
            campus: "Bongabong Campus",
            batchNumber: 1,
            trackingCode: "MINSU-VERIFY-2026-REG01",
          },
        ];

  const currentStudent = studentList[activeBatchIndex] || studentList[0];

  const buildTokens = (data: CertificateStudentData): StudentCertificateTokens => ({
    university_name: data.universityName || template.universityName || "Mindoro State University",
    student_name: data.name || "Student Grantee",
    student_id: data.studentId || "2024-00123-BC",
    course: data.course || "Bachelor of Science in Information Technology",
    campus: data.campus || template.campusName || "Bongabong Campus",
    batch_number: data.batchNumber || 1,
    academic_year: "A.Y. 2026-2027",
    tracking_code: data.trackingCode || "MINSU-VERIFY-2026-REG01",
    date_awarded:
      template.customDateAwarded ||
      data.dateAwarded ||
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
  });

  const previewTokens = buildTokens(currentStudent);

  const handlePrint = () => {
    injectCertificatePrintStyles(currentPaper);
    document.body.classList.add("printing-certificate");

    const cleanup = () => {
      document.body.classList.remove("printing-certificate");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      window.print();
    }, 120);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="2xl"
        className="p-3 sm:p-5 max-h-[96vh] overflow-y-auto sm:max-w-4xl lg:max-w-5xl"
        showCloseButton={false}
      >
        {/* Top Control Header */}
        <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-[#D6DDD8] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center font-bold shrink-0">
              <Award className="w-4 h-4 text-[#B88A00]" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-[#1B5E20]">
                {template.title || "Certificate of No Other Scholar"}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#55645B]">
                <span>
                  Paper: <strong>{currentPaper.label}</strong>
                </span>
                <span>•</span>
                <span className="text-[#1B5E20] font-mono font-semibold">
                  {previewTokens.tracking_code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch pagination if multiple records */}
            {studentList.length > 1 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#F1F8F1] border border-[#DCEFDD]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeBatchIndex <= 0}
                  onClick={() => setActiveBatchIndex((p) => Math.max(0, p - 1))}
                  className="apple-press h-7 w-7 p-0 rounded-lg border-[#D6DDD8]"
                  title="Previous student certificate"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-semibold text-[#1F2A24] px-1 whitespace-nowrap">
                  {activeBatchIndex + 1} of {studentList.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeBatchIndex >= studentList.length - 1}
                  onClick={() => setActiveBatchIndex((p) => Math.min(studentList.length - 1, p + 1))}
                  className="apple-press h-7 w-7 p-0 rounded-lg border-[#D6DDD8]"
                  title="Next student certificate"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="apple-press text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              {studentList.length > 1
                ? `Print All (${studentList.length}) / PDF`
                : "Print / Save as PDF"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="apple-press text-xs border-[#D6DDD8] text-[#55645B] hover:text-[#1F2A24]"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Certificate Preview on Screen */}
        <div className="no-print w-full flex items-center justify-center p-1 sm:p-3 bg-[#E5E9E6] rounded-xl overflow-x-auto shadow-inner">
          <div
            className="w-full max-w-[860px] bg-white shadow-xl transition-all"
            style={{ aspectRatio: currentPaper.aspectRatio }}
          >
            <CertificateCanvasView
              template={template}
              tokens={previewTokens}
              currentPaper={currentPaper}
            />
          </div>
        </div>

        {/* Bottom Helper */}
        <div className="no-print mt-3 text-center text-xs text-[#55645B] flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#B88A00]" />
          <span>
            For best print results, select <strong>Landscape</strong> orientation and enable{" "}
            <strong>Background graphics</strong> in your print settings.
          </span>
        </div>
      </Modal>

      {/* Dedicated Portal-Mounted Printable Certificate Container (Active during window.print()) */}
      {mounted && isOpen && typeof document !== "undefined" && createPortal(
        <div id="printable-certificate-root" className="hidden">
          {studentList.map((stu, sIdx) => {
            const tokens = buildTokens(stu);
            return (
              <div key={sIdx} className="certificate-sheet-page">
                <div
                  className="certificate-print-canvas-box"
                  style={{ aspectRatio: currentPaper.aspectRatio }}
                >
                  <CertificateCanvasView
                    template={template}
                    tokens={tokens}
                    currentPaper={currentPaper}
                  />
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Reusable Certificate Canvas Layout for screen and print
 */
function CertificateCanvasView({
  template,
  tokens,
  currentPaper,
}: {
  template: CertificateTemplateConfig;
  tokens: StudentCertificateTokens;
  currentPaper: any;
}) {
  const formattedBody = renderCertificateBody(template.bodyText, tokens);

  return (
    <div className="w-full h-full relative p-4 sm:p-7 flex flex-col justify-between overflow-hidden bg-white select-none">
      {/* Ornate MinSU Border */}
      <div className="absolute inset-2 sm:inset-3 border-[3px] border-[#1B5E20] pointer-events-none rounded-sm">
        <div className="absolute inset-1 border border-[#F2B705] pointer-events-none" />
      </div>

      {/* Decorative Corner Ornaments */}
      {template.showCornerBorders && (
        <>
          <div className="absolute top-3 left-3 w-8 h-8 pointer-events-none text-[#F2B705]">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-current">
              <path d="M0 0 L40 0 L40 6 L6 6 L6 40 L0 40 Z" />
            </svg>
          </div>
          <div className="absolute top-3 right-3 w-8 h-8 pointer-events-none text-[#F2B705] rotate-90">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-current">
              <path d="M0 0 L40 0 L40 6 L6 6 L6 40 L0 40 Z" />
            </svg>
          </div>
          <div className="absolute bottom-3 left-3 w-8 h-8 pointer-events-none text-[#F2B705] -rotate-90">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-current">
              <path d="M0 0 L40 0 L40 6 L6 6 L6 40 L0 40 Z" />
            </svg>
          </div>
          <div className="absolute bottom-3 right-3 w-8 h-8 pointer-events-none text-[#F2B705] rotate-180">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-current">
              <path d="M0 0 L40 0 L40 6 L6 6 L6 40 L0 40 Z" />
            </svg>
          </div>
        </>
      )}

      {/* Subtle Background Seal Watermark */}
      {template.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.045] pointer-events-none select-none">
          <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            <CertificateLogoRenderer
              config={template.watermarkLogoConfig}
              fallbackUrl="/minsu-seal.png"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 1. INSTITUTIONAL HEADER */}
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="w-full flex items-center justify-between px-3 sm:px-6 mb-1">
          {/* Left Logo */}
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            {template.showLeftLogo && (
              <div className="w-12 h-12 flex items-center justify-center">
                <CertificateLogoRenderer
                  config={template.leftLogoConfig}
                  fallbackUrl="/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Center Institutional Typography */}
          <div className="space-y-0.5 px-2 flex flex-col items-center">
            {template.showRepublicText && (
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#55645B] font-semibold">
                {template.republicText}
              </p>
            )}
            {template.showAgencyText && (
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#B88A00] font-bold">
                {template.agencyText}
              </p>
            )}
            {/* Optional Center Seal */}
            {template.showCenterLogo && (
              <div className="w-10 h-10 my-0.5 flex items-center justify-center">
                <CertificateLogoRenderer
                  config={template.centerLogoConfig}
                  fallbackUrl="/logo.png"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            {template.showUniversityName && (
              <h3 className="font-heading font-extrabold text-base sm:text-xl text-[#1B5E20] tracking-tight">
                {template.universityName}
              </h3>
            )}
            {template.showCampusName && (
              <p className="text-[10px] sm:text-[11px] text-[#55645B] font-medium">
                {template.campusName}
              </p>
            )}
          </div>

          {/* Right Logo */}
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            {template.showRightLogo && (
              <div className="w-12 h-12 flex items-center justify-center">
                <CertificateLogoRenderer
                  config={template.rightLogoConfig}
                  fallbackUrl="/api/media/logo/logo-1793718328666-3e70a8323e95.png"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        <div className="w-3/4 mx-auto h-[1.5px] bg-gradient-to-r from-transparent via-[#F2B705] to-transparent my-1" />
      </div>

      {/* 2. CERTIFICATE TITLE & AWARDEE HEADLINE */}
      <div className="relative z-10 text-center my-auto py-1 sm:py-2 space-y-1.5 sm:space-y-2">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-2xl font-heading font-black tracking-wider text-[#1B5E20] uppercase">
            {template.title}
          </h1>
          {template.subtitle && (
            <p className="text-[10px] sm:text-xs font-semibold text-[#B88A00] tracking-wide">
              {template.subtitle}
            </p>
          )}
        </div>

        <p className="text-xs italic text-[#55645B]">{template.awardPrefix}</p>

        {/* Grantee Name Highlight */}
        <div className="py-0.5">
          <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-[#1F2A24] tracking-tight border-b-2 border-[#1B5E20]/40 inline-block px-4 sm:px-8 pb-1">
            {tokens.student_name}
          </h2>
          {template.showStudentId && tokens.student_id && (
            <p className="text-xs font-mono font-bold text-[#1B5E20] mt-1">
              STUDENT ID NO: {tokens.student_id}
            </p>
          )}
        </div>

        {/* Degree & Campus Meta */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#55645B] font-medium flex-wrap">
          {template.showCourse && (
            <span className="font-semibold text-[#1F2A24]">{tokens.course}</span>
          )}
          {template.showCourse && template.showCampus && <span>•</span>}
          {template.showCampus && <span>{tokens.campus}</span>}
        </div>

        {/* Citation Body */}
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs sm:text-sm text-[#1F2A24] leading-relaxed text-center font-serif">
            {formattedBody}
          </p>
        </div>

        {/* Additional Regulatory / Legal Clause */}
        {template.showAdditionalNote && template.additionalNoteText && (
          <p className="text-[10px] italic text-[#55645B] max-w-xl mx-auto px-4">
            {template.additionalNoteText}
          </p>
        )}
      </div>

      {/* 3. SIGNATORIES & OFFICIAL AUTHENTICATION FOOTER */}
      <div className="relative z-10 pt-2">
        <div className="flex items-end justify-between px-3 sm:px-6">
          {/* Signatory 1 */}
          <div className="w-48 sm:w-56 space-y-1 text-center">
            {template.showSignatory1 ? (
              <>
                <div className="h-8 flex items-end justify-center">
                  <div className="w-36 sm:w-40 border-b border-[#1F2A24]" />
                </div>
                <p className="font-heading font-bold text-[11px] sm:text-xs uppercase text-[#1F2A24]">
                  {template.signatory1Name}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#55645B]">
                  {template.signatory1Title}
                </p>
              </>
            ) : (
              <div className="h-14" />
            )}
          </div>

          {/* Center Official Tracking Seal */}
          <div className="space-y-1 text-center shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#DCEFDD] bg-[#F1F8F1] flex items-center justify-center mx-auto text-[#1B5E20]">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#1B5E20]" />
            </div>
            {template.showDateAwarded && (
              <p className="text-[9px] sm:text-[10px] text-[#55645B]">
                {tokens.date_awarded}
              </p>
            )}
            {template.showTrackingCode && (
              <p className="font-mono text-[8px] sm:text-[9px] text-[#55645B] tracking-wider">
                REF: {tokens.tracking_code}
              </p>
            )}
          </div>

          {/* Signatory 2 */}
          <div className="w-48 sm:w-56 space-y-1 text-center">
            {template.showSignatory2 ? (
              <>
                <div className="h-8 flex items-end justify-center">
                  <div className="w-36 sm:w-40 border-b border-[#1F2A24]" />
                </div>
                <p className="font-heading font-bold text-[11px] sm:text-xs uppercase text-[#1F2A24]">
                  {template.signatory2Name}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#55645B]">
                  {template.signatory2Title}
                </p>
              </>
            ) : (
              <div className="h-14" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
