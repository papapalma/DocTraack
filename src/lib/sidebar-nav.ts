import { Role } from "@/types";

export type SidebarIconName =
  | "LayoutDashboard"
  | "CheckSquare"
  | "Ticket"
  | "Users"
  | "FileCheck"
  | "Award"
  | "BellRing"
  | "FileText"
  | "BarChart3"
  | "Bell"
  | "Layers"
  | "PlusCircle"
  | "Megaphone"
  | "Send"
  | "LayoutTemplate"
  | "ShieldCheck"
  | "FolderOpen"
  | "FolderKanban"
  | "GraduationCap"
  | "MessageSquare"
  | "Wallet"
  | "Settings"
  | "User";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: SidebarIconName;
}

export interface SidebarLinkEntry extends SidebarLinkItem {
  type: "link";
}

export interface SidebarGroupEntry {
  type: "group";
  id: string;
  label: string;
  icon: SidebarIconName;
  items: SidebarLinkItem[];
}

export type SidebarEntry = SidebarLinkEntry | SidebarGroupEntry;

/**
 * Build role-specific navigation entries with related routes grouped into
 * collapsible sections so every role presents 4-6 top-level rows at rest.
 */
export function getSidebarEntries(role: Role): SidebarEntry[] {
  switch (role) {
    case "DIRECTOR":
      return [
        { type: "link", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { type: "link", label: "Review Queue", href: "/review", icon: "CheckSquare" },
        { type: "link", label: "Walk-In Queue", href: "/queue", icon: "Ticket" },
        {
          type: "group",
          id: "director-documents",
          label: "Documents & Oversight",
          icon: "FolderOpen",
          items: [
            { label: "All Documents", href: "/documents", icon: "FileText" },
            { label: "Executive Analytics", href: "/analytics", icon: "BarChart3" },
          ],
        },
        {
          type: "group",
          id: "director-scholars",
          label: "Scholars & Verification",
          icon: "GraduationCap",
          items: [
            { label: "Student Masterlist (A-1)", href: "/registrations", icon: "Users" },
            { label: "3-Way Verification", href: "/verification", icon: "FileCheck" },
            { label: "Certificate Designer", href: "/certificate-editor", icon: "Award" },
          ],
        },
        {
          type: "group",
          id: "director-comms",
          label: "Communications",
          icon: "MessageSquare",
          items: [
            { label: "Announcements", href: "/announcements", icon: "BellRing" },
            { label: "Notifications", href: "/notifications", icon: "Bell" },
          ],
        },
      ];

    case "STAFF":
      return [
        { type: "link", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { type: "link", label: "Walk-In Queue", href: "/queue", icon: "Ticket" },
        {
          type: "group",
          id: "staff-documents",
          label: "Documents & Annexes",
          icon: "FolderKanban",
          items: [
            { label: "Annex Documents", href: "/documents", icon: "FileText" },
            { label: "Prepare Annex", href: "/documents/new", icon: "PlusCircle" },
            { label: "Annex Preset Studio", href: "/annex-presets", icon: "Layers" },
            { label: "Outgoing Documents", href: "/outgoing", icon: "Send" },
          ],
        },
        {
          type: "group",
          id: "staff-scholars",
          label: "Scholars & Calls",
          icon: "GraduationCap",
          items: [
            { label: "Applicant Calls (A-2)", href: "/calls", icon: "Megaphone" },
            { label: "Student Registrations (A-1)", href: "/registrations", icon: "Users" },
            { label: "3-Way Verification", href: "/verification", icon: "FileCheck" },
            { label: "Certificate Designer", href: "/certificate-editor", icon: "Award" },
          ],
        },
        {
          type: "group",
          id: "staff-comms",
          label: "Communications",
          icon: "MessageSquare",
          items: [
            { label: "Announcements", href: "/announcements", icon: "BellRing" },
            { label: "Notifications", href: "/notifications", icon: "Bell" },
          ],
        },
      ];

    case "ACCOUNTING":
      return [
        { type: "link", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { type: "link", label: "Walk-In Queue", href: "/queue", icon: "Ticket" },
        {
          type: "group",
          id: "accounting-annexes",
          label: "Financial Annexes",
          icon: "Wallet",
          items: [
            { label: "Financial Annexes (6–9)", href: "/documents", icon: "FileText" },
            { label: "Prepare Annex (6–9)", href: "/documents/new", icon: "PlusCircle" },
          ],
        },
        { type: "link", label: "Notifications", href: "/notifications", icon: "Bell" },
      ];

    case "SYSTEM_ADMIN":
      return [
        { type: "link", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { type: "link", label: "Queue & Kiosk", href: "/queue", icon: "Ticket" },
        {
          type: "group",
          id: "admin-system",
          label: "Administration",
          icon: "Settings",
          items: [
            { label: "User Management", href: "/users", icon: "Users" },
            { label: "Landing Page Editor", href: "/landing-editor", icon: "LayoutTemplate" },
            { label: "Logs", href: "/audit-logs", icon: "ShieldCheck" },
          ],
        },
        {
          type: "group",
          id: "admin-comms",
          label: "Communications",
          icon: "MessageSquare",
          items: [
            { label: "Announcements", href: "/announcements", icon: "BellRing" },
            { label: "Notifications", href: "/notifications", icon: "Bell" },
          ],
        },
      ];

    case "STUDENT":
      return [
        { type: "link", label: "Active Calls", href: "/portal", icon: "Megaphone" },
        { type: "link", label: "Announcements", href: "/portal/announcements", icon: "BellRing" },
        { type: "link", label: "My Applications", href: "/portal/applications", icon: "FileText" },
        { type: "link", label: "Profile", href: "/portal/profile", icon: "User" },
      ];

    default:
      return [{ type: "link", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }];
  }
}

export function flattenSidebarLinks(entries: SidebarEntry[]): SidebarLinkItem[] {
  const links: SidebarLinkItem[] = [];
  for (const entry of entries) {
    if (entry.type === "link") {
      links.push(entry);
    } else {
      links.push(...entry.items);
    }
  }
  return links;
}

/**
 * Determine active route href: exact match takes precedence, followed by
 * longest segment-boundary prefix match (excluding /dashboard).
 */
export function getActiveHref(entries: SidebarEntry[], pathname: string): string | undefined {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const links = flattenSidebarLinks(entries);

  const exact = links.find((item) => item.href === normalizedPath);
  if (exact) return exact.href;

  const matching = links
    .filter(
      (item) =>
        item.href !== "/dashboard" && normalizedPath.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length);

  return matching[0]?.href;
}

export function getActiveGroupId(
  entries: SidebarEntry[],
  activeHref?: string
): string | undefined {
  if (!activeHref) return undefined;
  for (const entry of entries) {
    if (
      entry.type === "group" &&
      entry.items.some((item) => item.href === activeHref)
    ) {
      return entry.id;
    }
  }
  return undefined;
}

export function getValidGroupIds(entries: SidebarEntry[]): string[] {
  return entries
    .filter((entry): entry is SidebarGroupEntry => entry.type === "group")
    .map((entry) => entry.id);
}

export function getSidebarStorageKey(role: Role): string {
  return `minsu-sidebar-groups:${role}`;
}

export function parseStoredGroups(
  raw: string | null,
  validGroupIds: string[]
): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validSet = new Set(validGroupIds);
    const unique: string[] = [];
    for (const value of parsed) {
      if (typeof value === "string" && validSet.has(value) && !unique.includes(value)) {
        unique.push(value);
      }
    }
    return unique;
  } catch {
    return [];
  }
}

export function mergeActiveGroup(
  openGroupIds: string[],
  activeGroupId?: string
): string[] {
  if (!activeGroupId || openGroupIds.includes(activeGroupId)) {
    return openGroupIds;
  }
  return [...openGroupIds, activeGroupId];
}

