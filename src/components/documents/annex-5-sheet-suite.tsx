"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChedLogo, UniFastLogo } from "./ched-unifast-logos";
import { Annex5FormData, Annex5HeiEntry } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Printer,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Building,
  GraduationCap,
} from "lucide-react";

interface Annex5SheetSuiteProps {
  initialData?: Annex5FormData;
  documentId?: string;
  documentTitle?: string;
  mode: "create" | "view";
  annexTypeId?: string;
  onSaved?: (docId: string) => void;
}

export function Annex5SheetSuite({
  initialData,
  documentId,
  documentTitle,
  mode,
  annexTypeId,
  onSaved,
}: Annex5SheetSuiteProps) {
  const router = useRouter();

  // Mode: "workspace" or "sheet" (Official Canvas)
  const [viewMode, setViewMode] = useState<"workspace" | "sheet">("workspace");
  const [workspaceTab, setWorkspaceTab] = useState<"heis" | "regional">("heis");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Default initial values
  const defaultData: Annex5FormData = useMemo(() => {
    return (
      initialData || {
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        memoOrderNumber: "01",
        memoOrderYear: "2024",
        term: "2nd",
        academicYear: "2023-2024",
        region: "MIMAROPA",
        totalGrantees: 20,

        heis: [
          {
            seq: 1,
            nameOfHei: "MINDORO STATE UNIVERSITY",
            heiType: "SUC",
            numberTdpGrantees: 20,
          },
          {
            seq: 2,
            nameOfHei: "ROMBLON STATE UNIVERSITY",
            heiType: "SUC",
            numberTdpGrantees: 15,
          },
          {
            seq: 3,
            nameOfHei: "MARINDUQUE STATE UNIVERSITY",
            heiType: "SUC",
            numberTdpGrantees: 15,
          },
        ],

        addressee: {
          name: "ATTY. RYAN L. ESTEVEZ",
          position: "Officer-in-Charge, Office of the Executive Director IV",
          office: "UniFAST Secretariat",
          address: "Ground Floor, Technohub Building E, Ayala Land Commonwealth Avenue, Quezon City",
        },

        signatories: {
          regionalCoordinator: {
            name: "MR. MICHAEL B. DELOS SANTOS",
            position: "UniFAST Regional Coordinator",
          },
          chedroDirector: {
            name: "EDNA IMELDA F. LEGAZPI",
            position: "Director IV",
            office: "Office of the Director IV, CHEDRO MIMAROPA",
          },
        },
      }
    );
  }, [initialData]);

  const [formData, setFormData] = useState<Annex5FormData>(defaultData);
  const [docTitle] = useState(
    documentTitle ||
      `Annex 5: Regional TDP Certification to UniFAST - ${defaultData.region} (${defaultData.term} Sem, AY ${defaultData.academicYear})`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update total grantees
  const updateHeisAndTotal = (newHeis: Annex5HeiEntry[]) => {
    const totalGrantees = newHeis.reduce((sum, h) => sum + (Number(h.numberTdpGrantees) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      heis: newHeis,
      totalGrantees,
    }));
  };

  // Re-index SEQ
  const reindexHeis = (list: Annex5HeiEntry[]): Annex5HeiEntry[] => {
    return list.map((item, idx) => ({
      ...item,
      seq: idx + 1,
    }));
  };

  // Add new HEI row
  const addHeiRow = () => {
    const nextSeq = formData.heis.length + 1;
    const newRow: Annex5HeiEntry = {
      seq: nextSeq,
      nameOfHei: "NEW HIGHER EDUCATION INSTITUTION",
      heiType: "SUC",
      numberTdpGrantees: 10,
    };
    updateHeisAndTotal(reindexHeis([...formData.heis, newRow]));
  };

  // Remove HEI row
  const removeHeiRow = (index: number) => {
    const updated = formData.heis.filter((_, idx) => idx !== index);
    updateHeisAndTotal(reindexHeis(updated));
  };

  // Update specific HEI field
  const updateHeiField = (index: number, field: keyof Annex5HeiEntry, value: string | number) => {
    const updated = [...formData.heis];
    updated[index] = { ...updated[index], [field]: value } as Annex5HeiEntry;
    updateHeisAndTotal(updated);
  };

  // Auto-sync counts from MinSU Annex 3 & Annex 4 documents
  const syncFromExistingBillings = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const docs = data.documents || [];

      let minsuTdpCount = 0;
      docs.forEach((doc: any) => {
        if (doc.annexType?.number === 3 && doc.formData?.totalGrantees) {
          minsuTdpCount += Number(doc.formData.totalGrantees) || 0;
        } else if (doc.annexType?.number === 4 && doc.formData?.totalGrantees) {
          minsuTdpCount += Number(doc.formData.totalGrantees) || 0;
        }
      });

      // If documents exist, update MinSU row count
      if (minsuTdpCount > 0) {
        const updated = [...formData.heis];
        const minsuIdx = updated.findIndex((h) =>
          h.nameOfHei.toUpperCase().includes("MINDORO STATE UNIVERSITY")
        );
        if (minsuIdx >= 0) {
          updated[minsuIdx].numberTdpGrantees = minsuTdpCount;
        } else {
          updated.unshift({
            seq: 1,
            nameOfHei: "MINDORO STATE UNIVERSITY",
            heiType: "SUC",
            numberTdpGrantees: minsuTdpCount,
          });
        }
        updateHeisAndTotal(reindexHeis(updated));
        setSyncMessage(`Successfully synchronized ${minsuTdpCount} verified MinSU grantees from Annex 3 & 4 billings.`);
      } else {
        setSyncMessage("No existing Annex 3 or 4 grantee records found in database. Retained current figures.");
      }
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setSyncMessage("Sync error: Could not query database documents.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Save changes
  const handleSave = async (submitDirectly: boolean = false) => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (mode === "create") {
        if (!annexTypeId) {
          setError("Missing annexTypeId configuration");
          setIsSaving(false);
          return;
        }

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: docTitle,
            annexTypeId,
            formData,
            status: submitDirectly ? "SUBMITTED" : "DRAFT",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create Annex 5 document");
        }

        const data = await res.json();
        setSaveSuccess(true);
        if (onSaved) {
          onSaved(data.document.id);
        } else {
          router.push(`/documents/${data.document.id}`);
        }
      } else {
        if (!documentId) return;

        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: docTitle,
            formData,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update Annex 5 document");
        }

        if (submitDirectly) {
          await fetch(`/api/documents/${documentId}/submit`, { method: "POST" });
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onSaved) onSaved(documentId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP DUAL-MODE FROSTED GLASS STICKY TOOLBAR                           */}
      {/* ========================================================================= */}
      <div className="sticky top-4 z-40 backdrop-blur-xl bg-white/95 p-2 rounded-2xl border border-line shadow-md flex flex-col md:flex-row items-center justify-between gap-3 print:hidden transition-all duration-200">
        {/* Left Side: View Mode */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex p-1 rounded-xl bg-minsu-green-50 border border-minsu-green-100">
            <button
              onClick={() => setViewMode("workspace")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold apple-press transition-all ${
                viewMode === "workspace"
                  ? "bg-minsu-green-700 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Interactive Workspace</span>
            </button>
            <button
              onClick={() => setViewMode("sheet")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold apple-press transition-all ${
                viewMode === "sheet"
                  ? "bg-minsu-green-700 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Paper Sheet</span>
            </button>
          </div>
        </div>

        {/* Right Side: Global Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {documentId && (
            <a
              href={`/api/annex-5/export-excel?documentId=${documentId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-minsu-green-50 text-minsu-green-700 text-xs font-semibold apple-press transition-colors shadow-xs"
              title="Download official Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode("sheet");
              setTimeout(() => window.print(), 150);
            }}
            className="text-xs h-8 border-line hover:bg-minsu-green-50 text-ink gap-1.5 apple-press shadow-xs font-semibold"
            title="Export official document to PDF or physical printer"
          >
            <Printer className="w-3.5 h-3.5 text-minsu-green-700" />
            <span>Export PDF / Print</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white font-bold text-xs h-8 apple-press shadow-xs gap-1.5"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {mode === "create" ? "Save Annex 5" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-minsu-green-50 border border-minsu-green-100 flex items-center gap-2.5 text-minsu-green-900 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-minsu-green-600 shrink-0" />
          Annex 5 Regional Certification saved successfully.
        </div>
      )}

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-minsu-gold-100 border border-minsu-gold-400/40 flex items-center gap-2.5 text-minsu-gold-600 text-xs font-semibold apple-shadow animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {syncMessage}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-800 text-xs font-semibold apple-shadow animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODE A: INTERACTIVE DATA WORKSPACE                                    */}
      {/* ========================================================================= */}
      {viewMode === "workspace" && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex border-b border-line gap-4">
            <button
              onClick={() => setWorkspaceTab("heis")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "heis"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Higher Education Institutions List ({formData.heis.length})</span>
            </button>
            <button
              onClick={() => setWorkspaceTab("regional")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                workspaceTab === "regional"
                  ? "border-minsu-green-700 text-minsu-green-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Regional Parameters & Signatories</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total Registered HEIs</span>
                <Building className="w-4 h-4 text-minsu-green-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-minsu-green-900">
                {formData.heis.length}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Institutions in Region {formData.region}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
              <div className="flex items-center justify-between text-xs text-ink-muted font-medium mb-1">
                <span>Total Endorsed Grantees</span>
                <GraduationCap className="w-4 h-4 text-minsu-gold-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-ink">
                {formData.totalGrantees}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Qualified Tulong-Dunong scholars
              </div>
            </div>

            <div className="bg-minsu-green-900 p-4 rounded-xl text-white shadow-xs">
              <div className="flex items-center justify-between text-xs text-minsu-gold-400 font-medium mb-1">
                <span>Authority & Mandate</span>
                <ShieldCheck className="w-4 h-4 text-minsu-gold-500" />
              </div>
              <div className="text-sm font-bold font-mono text-minsu-gold-400">
                UniFAST Memo {formData.memoOrderNumber} s. {formData.memoOrderYear}
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                R.A. 10931 UAQTE Funds Release
              </div>
            </div>
          </div>

          {/* TAB 1: HEI LIST */}
          {workspaceTab === "heis" && (
            <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-ink-muted">
                  List of Higher Education Institutions registered with CHED Regional Office endorsing TDP grantees.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncFromExistingBillings}
                    disabled={isSyncing}
                    className="text-xs h-8 border-minsu-green-700/40 text-minsu-green-700 hover:bg-minsu-green-50 font-semibold gap-1.5"
                    title="Calculate grantee totals from active Annex 3 and Annex 4 documents"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Auto-Sync from MinSU Billings</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={addHeiRow}
                    className="bg-minsu-green-700 hover:bg-minsu-green-600 text-white text-xs h-8 gap-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add HEI Row</span>
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto apple-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-minsu-green-50 text-minsu-green-900 font-bold border-b border-line">
                    <tr>
                      <th className="py-2.5 px-4 w-16 text-center">SEQ</th>
                      <th className="py-2.5 px-4 min-w-[280px]">Name of HEI</th>
                      <th className="py-2.5 px-4 w-40">HEI Type</th>
                      <th className="py-2.5 px-4 w-48 text-right">Number of TDP Grantees</th>
                      <th className="py-2.5 px-4 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {formData.heis.map((hei, idx) => (
                      <tr key={idx} className="hover:bg-minsu-green-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-minsu-green-800">
                          {hei.seq}
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            value={hei.nameOfHei}
                            onChange={(e) => updateHeiField(idx, "nameOfHei", e.target.value.toUpperCase())}
                            className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-bold uppercase"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={hei.heiType}
                            onChange={(e) => updateHeiField(idx, "heiType", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-semibold"
                          >
                            <option value="SUC">State University / College (SUC)</option>
                            <option value="LUC">Local University / College (LUC)</option>
                            <option value="Private HEI">Private Higher Education Institution</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            value={hei.numberTdpGrantees}
                            onChange={(e) => updateHeiField(idx, "numberTdpGrantees", parseInt(e.target.value, 10) || 0)}
                            className="w-24 text-right bg-transparent border-b border-transparent hover:border-line focus:border-minsu-green-700 focus:outline-none font-mono font-bold text-sm text-minsu-green-900"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => removeHeiRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-sm hover:bg-red-50 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-neutral-50 font-bold border-t-2 border-line">
                      <td colSpan={3} className="py-3 px-4 text-left uppercase text-minsu-green-900">
                        Total Number of Qualified Tulong-Dunong Grantees
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-extrabold text-minsu-green-900">
                        {formData.totalGrantees}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: REGIONAL PARAMETERS */}
          {workspaceTab === "regional" && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-minsu-green-900 uppercase tracking-wider">
                Regional Certification Parameters & Signatories
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">CHED Regional Office</label>
                  <input
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Academic Year</label>
                  <input
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-bold font-mono text-ink"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Semester (Term)</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-semibold text-ink"
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">UniFAST Memo Order Number</label>
                  <input
                    value={formData.memoOrderNumber}
                    onChange={(e) => setFormData({ ...formData, memoOrderNumber: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Memo Order Year Series</label>
                  <input
                    value={formData.memoOrderYear}
                    onChange={(e) => setFormData({ ...formData, memoOrderYear: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs font-mono font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Certification Date</label>
                  <input
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full mt-1.5 h-9 rounded-lg border border-line bg-page px-3 text-xs text-ink"
                  />
                </div>
              </div>

              {/* Addressee */}
              <div className="pt-4 border-t border-line space-y-3">
                <div className="text-xs font-bold text-minsu-green-900">UniFAST Addressee</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Addressee Name</label>
                    <input
                      value={formData.addressee?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressee: { ...formData.addressee!, name: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Designation / Title</label>
                    <input
                      value={formData.addressee?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressee: { ...formData.addressee!, position: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-ink-muted font-medium">Office & Physical Address</label>
                    <input
                      value={formData.addressee?.address || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressee: { ...formData.addressee!, address: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-page border border-line rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Signatories */}
              <div className="pt-4 border-t border-line grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">Verified and Validated by:</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Printed Name</label>
                    <input
                      value={formData.signatories?.regionalCoordinator?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            regionalCoordinator: {
                              ...formData.signatories?.regionalCoordinator,
                              name: e.target.value,
                              position: formData.signatories?.regionalCoordinator?.position || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Position</label>
                    <input
                      value={formData.signatories?.regionalCoordinator?.position || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            regionalCoordinator: {
                              ...formData.signatories?.regionalCoordinator,
                              name: formData.signatories?.regionalCoordinator?.name || "",
                              position: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-minsu-green-50/50 border border-minsu-green-100">
                  <div className="text-xs font-bold text-minsu-green-900">Attested by:</div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">CHEDRO Director Name</label>
                    <input
                      value={formData.signatories?.chedroDirector?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            chedroDirector: {
                              ...formData.signatories?.chedroDirector,
                              name: e.target.value,
                              position: formData.signatories?.chedroDirector?.position || "",
                              office: formData.signatories?.chedroDirector?.office || "",
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted font-medium">Position & Office</label>
                    <input
                      value={formData.signatories?.chedroDirector?.office || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signatories: {
                            ...formData.signatories,
                            chedroDirector: {
                              ...formData.signatories?.chedroDirector,
                              name: formData.signatories?.chedroDirector?.name || "",
                              position: formData.signatories?.chedroDirector?.position || "",
                              office: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: REFINED OFFICIAL DOCUMENT CANVAS (annex5_tab1_Certification.png) */}
      {/* ========================================================================= */}
      {viewMode === "sheet" && (
        <div className="bg-white text-ink font-sans p-6 sm:p-12 border border-neutral-800 shadow-xl rounded-sm max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print-container text-[12px] leading-relaxed space-y-6">
          {/* Top Form Tag */}
          <div className="text-right font-bold text-xs text-neutral-800">
            TDP Form - Annex 5
          </div>

          {/* Official Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="w-20 flex justify-center">
              <ChedLogo className="w-16 h-16" />
            </div>

            <div className="text-center flex-1 px-4 space-y-0.5">
              <div className="text-[11px] font-medium text-neutral-600">Republic of the Philippines</div>
              <div className="font-extrabold text-sm uppercase text-neutral-900 tracking-wide">
                Unified Student Financial Assistance System for Tertiary Education
              </div>
              <div className="text-[10px] text-neutral-600">
                Ground Floor, Bldg. E, UP Ayala Land Technohub Complex, Commonwealth Ave., Diliman, Quezon City
              </div>
              <div className="text-[10px] text-neutral-600">
                Email: unifastsecretariat@ched.gov.ph
              </div>
            </div>

            <div className="w-20 flex justify-center">
              <UniFastLogo className="w-16 h-16" />
            </div>
          </div>

          {/* Date Line */}
          <div className="flex justify-end pt-2">
            <div>
              <span className="font-semibold text-neutral-800">Date: </span>
              <span className="border-b border-neutral-800 px-4 font-medium">{formData.date}</span>
            </div>
          </div>

          {/* Big Title */}
          <div className="text-center py-3">
            <h1 className="text-2xl font-extrabold tracking-[0.25em] text-neutral-900">
              CERTIFICATION
            </h1>
          </div>

          {/* Addressee Block */}
          <div className="space-y-1 text-xs">
            <div className="font-bold">
              For: <span className="uppercase">{formData.addressee?.name || "ATTY. RYAN L. ESTEVEZ"}</span>
            </div>
            <div className="text-neutral-800">
              {formData.addressee?.position || "Officer-in-Charge, Office of the Executive Director IV, UniFAST"}
            </div>
            <div className="text-neutral-700 max-w-md">
              {formData.addressee?.address || "Ground Floor, Technohub Building E, Ayala Land Commonwealth Avenue, Quezon City"}
            </div>
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              Pursuant to the Memorandum Order <span className="underline font-bold px-1">{formData.memoOrderNumber}</span> s. <span className="underline font-bold px-1">{formData.memoOrderYear}</span> issued by the UniFAST Secretariat to the UniFAST Regional Coordinators after the conduct of the verification and validation process, this Office hereby endorses and submits to the UniFAST Secretariat the Tulong-Dunong grantees enrolled in the <span className="underline font-bold px-1">{formData.term}</span> Semester, Academic Year <span className="underline font-bold px-1">{formData.academicYear}</span> in Higher Education Institutions (HEIs) registered in CHED Regional Office - <span className="underline font-bold px-1">{formData.region}</span>.
            </p>

            <p>
              Relative thereto, the undersigned certifies and attests to the veracity of the Certificate of Registration/ Registration Form with Assessment submitted by qualified Tulong-Dunong grantees in compliance with the prescribed TES-TDP guidelines approved by the UniFAST Board.
            </p>

            <p>
              For your reference, the table below shows the list of Higher Education Institutions registered at CHED-RO. with the total number of qualified Tulong-Dunong grantees:
            </p>

            {/* Official HEI Table */}
            <div className="py-2">
              <table className="w-full border-collapse border border-neutral-800 text-[11px]">
                <thead>
                  <tr className="bg-neutral-100 font-bold border-b border-neutral-800 text-center">
                    <th className="border border-neutral-800 p-2 w-16">SEQ</th>
                    <th className="border border-neutral-800 p-2 text-left">NAME OF HEI</th>
                    <th className="border border-neutral-800 p-2 w-32">HEI TYPE</th>
                    <th className="border border-neutral-800 p-2 w-44">NUMBER TDP GRANTEES</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.heis.map((h, idx) => (
                    <tr key={idx} className="border-b border-neutral-400">
                      <td className="border border-neutral-800 p-2 text-center font-mono font-bold">
                        {h.seq}
                      </td>
                      <td className="border border-neutral-800 p-2 font-bold uppercase">
                        {h.nameOfHei}
                      </td>
                      <td className="border border-neutral-800 p-2 text-center">
                        {h.heiType}
                      </td>
                      <td className="border border-neutral-800 p-2 text-center font-mono font-bold">
                        {h.numberTdpGrantees}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-neutral-900 bg-neutral-50 font-bold">
                    <td colSpan={3} className="border border-neutral-800 p-2 text-left uppercase">
                      Total
                    </td>
                    <td className="border border-neutral-800 p-2 text-center font-mono font-extrabold text-sm text-minsu-green-900">
                      {formData.totalGrantees}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              This certification is issued in order to facilitate the disbursement and release of funds intended for TDP beneficiaries in compliance with the Implementing Rules and Regulations of Republic Act 10931 &ldquo;The Universal Access to Quality Tertiary Education&rdquo;.
            </p>
          </div>

          {/* Signatories Block */}
          <div className="pt-8 space-y-12 avoid-break">
            <div className="space-y-1">
              <div className="text-xs text-neutral-600">Verified and Validated by:</div>
              <div className="pt-8 max-w-sm">
                <div className="font-bold border-b border-neutral-800 pb-1 uppercase">
                  {formData.signatories?.regionalCoordinator?.name || "[NAME & SIGNATURE]"}
                </div>
                <div className="text-[11px] text-neutral-600 pt-0.5">
                  {formData.signatories?.regionalCoordinator?.position || "Regional Coordinator"}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral-600">Attested by:</div>
              <div className="pt-8 max-w-sm">
                <div className="font-bold border-b border-neutral-800 pb-1 uppercase">
                  {formData.signatories?.chedroDirector?.name || "[CHEDRO DIRECTOR OR OIC]"}
                </div>
                <div className="text-[11px] text-neutral-700 font-semibold pt-0.5">
                  {formData.signatories?.chedroDirector?.position || "[Position]"}
                </div>
                <div className="text-[11px] text-neutral-600">
                  {formData.signatories?.chedroDirector?.office || "Office of the Director IV, [CHEDRO]"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
