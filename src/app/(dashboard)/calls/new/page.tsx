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
  const [deadline, setDeadline] = useState("");
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

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline,
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" required>
                Call Announcement Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Call for TDP Applicants - 1st Semester A.Y. 2026-2027"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline" required>
                Submission Deadline Date
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
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
                className="w-full rounded-lg border border-[#D6DDD8] bg-white p-3 text-sm focus-visible:outline-none"
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
