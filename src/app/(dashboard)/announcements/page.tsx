"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "@/hooks/use-session";
import { canManageAnnouncements } from "@/lib/rbac";
import { AnnouncementCategory, AnnouncementTarget, AnnouncementItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRing,
  Pin,
  PinOff,
  Plus,
  Search,
  Calendar,
  User,
  Trash2,
  Edit3,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Megaphone,
  Radio,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "ALL", label: "All Notices", icon: Megaphone },
  { id: "GENERAL", label: "General", icon: FileText },
  { id: "URGENT", label: "Urgent", icon: AlertTriangle },
  { id: "DEADLINE", label: "Deadlines", icon: Calendar },
  { id: "REQUIREMENTS", label: "Requirements", icon: Sparkles },
  { id: "PAYROLL", label: "Payroll", icon: DollarSign },
];

export default function StaffAnnouncementsPage() {
  const { user } = useSession();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<AnnouncementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form inputs
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("GENERAL");
  const [targetAudience, setTargetAudience] = useState<AnnouncementTarget>("ALL");
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setCategory("GENERAL");
    setTargetAudience("ALL");
    setIsPinned(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setTargetAudience(item.targetAudience);
    setIsPinned(item.isPinned);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Both title and content are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category,
        targetAudience,
        isPinned,
      };

      const url = editingItem
        ? `/api/announcements/${editingItem.id}`
        : "/api/announcements";

      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save announcement.");
      }

      setIsModalOpen(false);
      await fetchAnnouncements();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (item: AnnouncementItem) => {
    try {
      const res = await fetch(`/api/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !item.isPinned }),
      });
      if (res.ok) {
        await fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/announcements/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItemToDelete(null);
        await fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [announcements, activeCategory, searchQuery]);

  const hasPermission = user ? canManageAnnouncements(user.role) : false;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "URGENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "DEADLINE":
        return "bg-[#FFF1C2] text-[#B88A00] border-[#F2B705]/40";
      case "PAYROLL":
        return "bg-[#DCEFDD] text-[#1B5E20] border-[#2E7D32]/30";
      case "REQUIREMENTS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getAudienceLabel = (aud: string) => {
    switch (aud) {
      case "STUDENTS":
        return "Students Only";
      case "PUBLIC":
        return "Public Landing";
      default:
        return "All Stakeholders";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D6DDD8] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
                Announcements & Circulars
              </h1>
              <p className="text-xs sm:text-sm text-[#55645B] mt-0.5">
                Post official notices, deadline warnings, and schedule releases with automatic student notification alerts.
              </p>
            </div>
          </div>
        </div>

        {hasPermission && (
          <Button
            onClick={openCreateModal}
            className="bg-[#1B5E20] hover:bg-[#164D1C] text-white font-semibold text-xs sm:text-sm h-10 px-4 sm:px-5 gap-2 rounded-xl apple-press shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Category Pills with Apple Motion */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full apple-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95",
                  isActive
                    ? "text-[#123F17]"
                    : "text-[#55645B] hover:text-[#1F2A24] hover:bg-neutral-100/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="staff-announcement-tab"
                    className="absolute inset-0 bg-[#DCEFDD] border border-[#1B5E20]/20 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#55645B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D6DDD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="border border-dashed border-[#D6DDD8] bg-white/70">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1F2A24]">
              No Announcements Found
            </h3>
            <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
              {searchQuery || activeCategory !== "ALL"
                ? "No announcements match your search or filter criteria."
                : "No announcements have been published yet. Click 'New Announcement' above to publish the first notice."}
            </p>
            {hasPermission && !searchQuery && activeCategory === "ALL" && (
              <Button
                onClick={openCreateModal}
                size="sm"
                className="mt-4 bg-[#1B5E20] text-white hover:bg-[#164D1C] apple-press"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence>
            {filteredAnnouncements.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <Card
                  className={cn(
                    "p-5 sm:p-6 transition-all duration-200 border bg-white shadow-xs hover:shadow-md",
                    item.isPinned
                      ? "border-[#F2B705] bg-gradient-to-br from-[#FFFDF5] to-white ring-1 ring-[#F2B705]/40"
                      : "border-[#D6DDD8]"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/50 shadow-2xs">
                            <Pin className="w-3 h-3 fill-[#B88A00]" />
                            Pinned Notice
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
                            getCategoryBadge(item.category)
                          )}
                        >
                          {item.category}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-[#55645B] border border-neutral-200">
                          {getAudienceLabel(item.targetAudience)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-heading font-bold text-[#1F2A24] leading-snug break-words">
                        {item.title}
                      </h3>

                      {/* Content */}
                      <p className="text-xs sm:text-sm text-[#1F2A24]/90 whitespace-pre-wrap leading-relaxed break-words font-sans">
                        {item.content}
                      </p>

                      {/* Author & Timestamp Footer */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#55645B] pt-2 border-t border-[#D6DDD8]/60">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-[#1B5E20]" />
                          {item.author?.name || "TDP Staff Coordinator"} ({item.author?.role || "STAFF"})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls for Staff/Admin */}
                    {hasPermission && (
                      <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D6DDD8]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(item)}
                          title={item.isPinned ? "Unpin notice" : "Pin notice to top"}
                          className="h-8 px-2 text-xs gap-1.5 hover:bg-neutral-100 text-[#55645B] active:scale-95"
                        >
                          {item.isPinned ? (
                            <>
                              <PinOff className="w-3.5 h-3.5 text-[#B88A00]" />
                              <span className="sm:hidden">Unpin</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-3.5 h-3.5" />
                              <span className="sm:hidden">Pin</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-8 px-2 text-xs gap-1.5 hover:bg-neutral-100 text-[#1B5E20] active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemToDelete(item)}
                          className="h-8 px-2 text-xs gap-1.5 hover:bg-red-50 text-red-600 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="bg-white rounded-2xl border border-[#D6DDD8] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#1B5E20] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#F2B705]" />
                  <h2 className="text-base sm:text-lg font-heading font-bold">
                    {editingItem ? "Edit Announcement" : "Create Official Announcement"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto apple-scrollbar flex-1">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-[#1F2A24]">
                    Announcement Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule for Annex 2 Document Submission & Verification"
                    required
                    className="text-sm"
                  />
                </div>

                {/* Category & Audience Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-bold text-[#1F2A24]">
                      Category Tag
                    </Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-[#D6DDD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
                    >
                      <option value="GENERAL">General Notice</option>
                      <option value="URGENT">Urgent Alert</option>
                      <option value="DEADLINE">Application Deadline</option>
                      <option value="REQUIREMENTS">Requirements & Guidelines</option>
                      <option value="PAYROLL">Payroll & Grant Release</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <Label htmlFor="targetAudience" className="text-xs font-bold text-[#1F2A24]">
                      Target Audience
                    </Label>
                    <select
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as AnnouncementTarget)}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-[#D6DDD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
                    >
                      <option value="ALL">All (Students, Staff & Public)</option>
                      <option value="STUDENTS">Students Only (Portal)</option>
                      <option value="PUBLIC">Public & Landing Page Only</option>
                    </select>
                  </div>
                </div>

                {/* Pin to Top Checkbox */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6] cursor-pointer hover:bg-neutral-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1B5E20] focus:ring-[#1B5E20]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#1F2A24] block">Pin this notice to top</span>
                    <span className="text-[#55645B]">
                      Pinned announcements are permanently highlighted at the top of feeds with a gold badge.
                    </span>
                  </div>
                </label>

                {/* Content */}
                <div className="space-y-1.5">
                  <Label htmlFor="content" className="text-xs font-bold text-[#1F2A24]">
                    Notice Content / Body <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="content"
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide full details, instructions, room numbers, requirements, or links..."
                    required
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#D6DDD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20] resize-y leading-relaxed"
                  />
                </div>

                {/* Automatic Broadcast Notice */}
                <div className="p-3 rounded-xl bg-[#DCEFDD]/60 border border-[#1B5E20]/20 text-[11px] text-[#123F17] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1B5E20] shrink-0" />
                  <span>
                    <strong>Instant Student Broadcast:</strong> All registered students who opted in to notifications will automatically receive an in-app alert upon publishing.
                  </span>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D6DDD8]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-xs sm:text-sm text-[#55645B] hover:text-[#1F2A24]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#1B5E20] hover:bg-[#164D1C] text-white text-xs sm:text-sm font-semibold h-10 px-5 rounded-xl apple-press"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : editingItem ? (
                      "Update Announcement"
                    ) : (
                      "Publish Announcement"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-red-200 p-6 shadow-2xl max-w-md w-full space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-[#1F2A24]">
                  Delete Announcement?
                </h3>
                <p className="text-xs text-[#55645B]">
                  Are you sure you want to remove &ldquo;{itemToDelete.title}&rdquo;? This notice will immediately disappear from both the staff and student feeds.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

