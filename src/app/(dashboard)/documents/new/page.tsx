"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { canCreateAnnex } from "@/lib/rbac";
import { AnnexTypeInfo, AnnexFormField } from "@/types";
import { ArrowLeft, Send, Save, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Annex3Creator } from "@/components/documents/annex-3-creator";
import { Annex4Creator } from "@/components/documents/annex-4-creator";
import { Annex5Creator } from "@/components/documents/annex-5-creator";
import { Annex6Creator } from "@/components/documents/annex-6-creator";
import { Annex7Creator } from "@/components/documents/annex-7-creator";
import { Annex8Creator } from "@/components/documents/annex-8-creator";
import { Annex9Creator } from "@/components/documents/annex-9-creator";
import { Annex10Creator } from "@/components/documents/annex-10-creator";
import { useSearchParams } from "next/navigation";

export default function NewDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const [annexTypes, setAnnexTypes] = useState<AnnexTypeInfo[]>([]);
  const [selectedAnnexId, setSelectedAnnexId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch annex types
  useEffect(() => {
    async function fetchAnnexTypes() {
      try {
        const res = await fetch("/api/annex-types");
        if (res.ok) {
          const data = await res.json();
          const types: AnnexTypeInfo[] = data.annexTypes || [];
          setAnnexTypes(types);

          const paramAnnex = searchParams.get("annex");
          if (paramAnnex) {
            const num = parseInt(paramAnnex, 10);
            const found = types.find((a) => a.number === num);
            if (found) {
              handleSelectAnnexWithTypes(found.id, types);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch annex types:", err);
      }
    }
    fetchAnnexTypes();
  }, [searchParams]);

  if (!user) return null;

  // Filter annexes available for this user's role
  const availableAnnexes = annexTypes.filter((a) =>
    canCreateAnnex(user.role, a.number)
  );

  const selectedAnnex = annexTypes.find((a) => a.id === selectedAnnexId);

  const handleSelectAnnexWithTypes = (id: string, typesList: AnnexTypeInfo[]) => {
    setSelectedAnnexId(id);
    const annex = typesList.find((a) => a.id === id);
    if (annex) {
      setTitle(`Annex ${annex.number}: ${annex.name} - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
      const initialFields: Record<string, any> = {};
      const fields = (annex.formSchema as any)?.fields as AnnexFormField[] || [];
      fields.forEach((f) => {
        initialFields[f.id] = f.defaultValue || "";
      });
      setFormData(initialFields);
    }
  };

  // When annex is selected, set default title and form data
  const handleSelectAnnex = (id: string) => {
    handleSelectAnnexWithTypes(id, annexTypes);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async (submitDirectly: boolean) => {
    if (!selectedAnnexId) {
      setError("Please select an Annex type first.");
      return;
    }

    if (!title.trim()) {
      setError("Document title is required.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annexTypeId: selectedAnnexId,
          title: title.trim(),
          formData,
          submitDirectly,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create document.");
        setIsLoading(false);
        return;
      }

      router.push(`/documents/${data.document.id}`);
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Intercept Ctrl+P / Cmd+P to open the Apple Print Preview Modal if an Annex is selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (selectedAnnexId) {
          window.dispatchEvent(new CustomEvent("minsu:open-print-modal"));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAnnexId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0 print:w-full print:space-y-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between new-document-wizard-chrome print:hidden">
        <Link href="/documents">
          <Button variant="ghost" size="sm" className="text-xs text-[#55645B]">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Documents
          </Button>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#DCEFDD] text-[#123F17]">
          Authoring as: {user.role}
        </span>
      </div>

      <div className="new-document-wizard-chrome page-creation-header print:hidden">
        <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
          Prepare TDP Annex Document
        </h1>
        <p className="text-sm text-[#55645B] mt-1">
          Select an annex template and complete the required institutional fields.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FDE8E7] border border-[#B3261E]/40 text-sm text-[#B3261E] font-medium new-document-wizard-chrome print:hidden">
          {error}
        </div>
      )}

      {/* Step 1: Select Annex Type */}
      <Card className="new-document-wizard-chrome print:hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Select Annex Template
          </CardTitle>
          <CardDescription>
            {user.role === "ACCOUNTING"
              ? "Your role is authorized to prepare financial Annexes 6, 7, 8, and 9."
              : "Choose an Annex from the official MinSU TDP schedule."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableAnnexes.map((annex) => {
              const isSelected = annex.id === selectedAnnexId;
              return (
                <button
                  key={annex.id}
                  type="button"
                  onClick={() => handleSelectAnnex(annex.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "bg-[#F1F8F1] border-[#1B5E20] ring-2 ring-[#1B5E20]/20 shadow-xs"
                      : "bg-white border-[#D6DDD8] hover:border-[#1B5E20]/40 hover:bg-[#F6F8F6]"
                  }`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? "bg-[#1B5E20] text-white"
                        : "bg-[#DCEFDD] text-[#123F17]"
                    }`}
                  >
                    A{annex.number}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#1F2A24] truncate">
                      {annex.name}
                    </p>
                    <p className="text-xs text-[#55645B] mt-0.5">
                      Annex {annex.number} Form
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Specialized Annex 3 Creator */}
      {selectedAnnex && selectedAnnex.number === 3 && (
        <Annex3Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 4 Creator */}
      {selectedAnnex && selectedAnnex.number === 4 && (
        <Annex4Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 5 Creator */}
      {selectedAnnex && selectedAnnex.number === 5 && (
        <Annex5Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 6 Creator */}
      {selectedAnnex && selectedAnnex.number === 6 && (
        <Annex6Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 7 Creator */}
      {selectedAnnex && selectedAnnex.number === 7 && (
        <Annex7Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 8 Creator */}
      {selectedAnnex && selectedAnnex.number === 8 && (
        <Annex8Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 9 Creator */}
      {selectedAnnex && selectedAnnex.number === 9 && (
        <Annex9Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Specialized Annex 10 Creator */}
      {selectedAnnex && selectedAnnex.number === 10 && (
        <Annex10Creator annexTypeId={selectedAnnexId} />
      )}

      {/* Step 2: Complete Annex Form Fields for generic annexes */}
      {selectedAnnex && selectedAnnex.number !== 3 && selectedAnnex.number !== 4 && selectedAnnex.number !== 5 && selectedAnnex.number !== 6 && selectedAnnex.number !== 7 && selectedAnnex.number !== 8 && selectedAnnex.number !== 9 && selectedAnnex.number !== 10 && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Complete Annex {selectedAnnex.number} Details
            </CardTitle>
            <CardDescription>
              {selectedAnnex.name} • Official Template Fields
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Document Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" required>
                Document Reference Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annex 3: Continuing Billing - 1st Sem 2026"
                required
              />
            </div>

            <div className="border-t border-[#D6DDD8] pt-4 space-y-4">
              <h4 className="text-xs font-semibold text-[#55645B] uppercase tracking-wider">
                Annex Form Fields
              </h4>

              {((selectedAnnex.formSchema as any)?.fields as AnnexFormField[] || []).map(
                (field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id} required={field.required}>
                      {field.label}
                    </Label>

                    {field.type === "textarea" ? (
                      <textarea
                        id={field.id}
                        rows={3}
                        value={formData[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-[#D6DDD8] bg-white p-3 text-sm focus-visible:outline-none focus-visible:border-[#1B5E20] focus-visible:ring-2 focus-visible:ring-[#1B5E20]/20"
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none focus-visible:border-[#1B5E20]"
                      >
                        <option value="">-- Select option --</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type}
                        value={formData[field.id] || ""}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                )
              )}
            </div>

            {/* Submission Actions */}
            <div className="pt-6 border-t border-[#D6DDD8] flex flex-col sm:flex-row items-center justify-end gap-3 print:hidden">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleSave(false)}
                isLoading={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>

              <Button
                type="button"
                variant="accent"
                size="md"
                onClick={() => handleSave(true)}
                isLoading={isLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Directly for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
