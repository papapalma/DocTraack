"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Trash2, Megaphone } from "lucide-react";

interface CustomQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export default function NewCallPage() {
  const router = useRouter();
  const { user } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchNumber, setBatchNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [customFields, setCustomFields] = useState<CustomQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCustomField = () => {
    const newField: CustomQuestion = {
      id: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, key: string, val: any) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) {
      setError("Please specify the call title and application deadline.");
      return;
    }

    if (new Date(startDate) >= new Date(deadline)) {
      setError("Start date and time must be earlier than the submission deadline.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          batchNumber: Number(batchNumber) || 1,
          startDate: new Date(startDate).toISOString(),
          deadline: new Date(deadline).toISOString(),
          formSchema: { fields: customFields },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create applicant call.");
        setIsSubmitting(false);
        return;
      }

      router.push("/calls");
    } catch {
      setError("A network error occurred.");
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (user.role !== "STAFF") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          Only TDP Staff Coordinators are permitted to publish new applicant calls.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/calls">
        <Button variant="ghost" size="sm" className="text-xs text-[#55645B]">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Calls
        </Button>
      </Link>

      <Card>
        <CardHeader className="border-b border-[#D6DDD8] pb-4">
          <CardTitle className="text-xl font-heading text-[#1B5E20]">
            Publish New Annex 2 Call for Applicants
          </CardTitle>
          <CardDescription>
            Configure the application guidelines, deadline, and custom eligibility questions.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="p-4 mb-5 rounded-xl bg-[#FDE8E7] text-xs text-[#B3261E] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" required>
                Call Announcement Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Call for TDP Applicants (Batch 1) - 1st Semester A.Y. 2026-2027"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Batch Designation */}
            <div className="space-y-1.5">
              <Label required>
                TDP Grant Intake Batch
              </Label>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatchNumber(b)}
                    className={`apple-press px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      batchNumber === b
                        ? "bg-[#1B5E20] text-white border-[#1B5E20] shadow-sm"
                        : "bg-white text-[#55645B] border-[#D6DDD8] hover:bg-[#F6F8F6]"
                    }`}
                  >
                    Batch {b}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 text-xs text-[#55645B]">
                  <span>Custom Batch:</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 h-8 text-center rounded-lg border border-[#D6DDD8] bg-white text-xs font-bold text-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#55645B]">
                All scholars applying during this call will automatically be stamped as <strong>Batch {batchNumber}</strong> with tracking codes formatted as <code>MINSU-TDP-YYYY-B{batchNumber}-XXXX</code>.
              </p>
            </div>

            {/* Time Window (Start and Deadline) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F6F8F6] border border-[#D6DDD8]">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" required>
                  Application Window Opens
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[#55645B] block">
                  Students cannot submit before this time.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deadline" required>
                  Application Window Closes (Deadline)
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
                <span className="text-[10px] text-[#55645B] block">
                  Submissions lock automatically upon expiration.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Announcement Narrative & Qualification Guidelines
              </Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Stipulate eligibility requirements, priority student groups, accredited courses, and submission rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[#D6DDD8] bg-white p-3 text-sm focus-visible:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              />
            </div>

            {/* Custom Questions Builder */}
            <div className="pt-4 border-t border-[#D6DDD8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#1F2A24]">
                    Custom Application Questions (Form Builder)
                  </h4>
                  <p className="text-xs text-[#55645B]">
                    Add additional questions specific to this grant cycle.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomField}
                  className="text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Question
                </Button>
              </div>

              {customFields.length === 0 ? (
                <p className="text-xs text-[#55645B] italic py-3 bg-[#F6F8F6] p-3 rounded-lg border border-[#D6DDD8] text-center">
                  Standard fields (Student ID, Campus, Course, Year Level, Family Income, GWA) are included automatically. Click "Add Question" to attach extra requirements.
                </p>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg bg-[#F6F8F6] border border-[#D6DDD8] flex items-center gap-3"
                    >
                      <span className="text-xs font-bold text-[#55645B] w-5">
                        #{idx + 1}
                      </span>
                      <Input
                        placeholder="Question label..."
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, "label", e.target.value)
                        }
                        className="flex-1 h-9 text-xs"
                      />
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, "type", e.target.value)
                        }
                        className="h-9 rounded-lg border border-[#D6DDD8] bg-white px-2 text-xs"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Paragraph</option>
                        <option value="number">Number</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="text-[#B3261E] hover:opacity-80 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#D6DDD8] flex justify-end gap-3">
              <Link href="/calls">
                <Button type="button" variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Publish Call (Annex 2)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
