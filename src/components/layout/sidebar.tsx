"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useNav } from "@/components/layout/nav-context";
import {
  LayoutDashboard,
  CheckSquare,
  Ticket,
  Users,
  FileCheck,
  Award,
  BellRing,
  FileText,
  BarChart3,
  Bell,
  Layers,
  PlusCircle,
  Megaphone,
  Send,
  LayoutTemplate,
  ShieldCheck,
  FolderOpen,
  FolderKanban,
  GraduationCap,
  MessageSquare,
  Wallet,
  Settings,
  User,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  SidebarEntry,
  SidebarGroupEntry,
  SidebarIconName,
  SidebarLinkItem,
  getActiveGroupId,
  getActiveHref,
  getSidebarEntries,
  getSidebarStorageKey,
  getValidGroupIds,
  mergeActiveGroup,
  parseStoredGroups,
} from "@/lib/sidebar-nav";
import type { Role } from "@/types";

const ICON_MAP: Record<SidebarIconName, React.ElementType> = {
  LayoutDashboard,
  CheckSquare,
  Ticket,
  Users,
  FileCheck,
  Award,
  BellRing,
  FileText,
  BarChart3,
  Bell,
  Layers,
  PlusCircle,
  Megaphone,
  Send,
  LayoutTemplate,
  ShieldCheck,
  FolderOpen,
  FolderKanban,
  GraduationCap,
  MessageSquare,
  Wallet,
  Settings,
  User,
};

interface FlyoutState {
  groupId: string;
  top: number;
  left: number;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const emptySubscribe = () => () => {};

function readInitialGroups(
  role: Role | undefined,
  validGroupIds: string[],
  activeGroupId?: string
): string[] {
  if (!role || typeof window === "undefined") {
    return mergeActiveGroup([], activeGroupId);
  }
  try {
    const stored = parseStoredGroups(
      window.localStorage.getItem(getSidebarStorageKey(role)),
      validGroupIds
    );
    return mergeActiveGroup(stored, activeGroupId);
  } catch {
    return mergeActiveGroup([], activeGroupId);
  }
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname() ?? "";
  const { user } = useSession();
  const { mobileOpen, desktopCollapsed, closeMobile } = useNav();
  const prefersReduced = useReducedMotion() ?? false;
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const role = user?.role;
  const entries = useMemo<SidebarEntry[]>(
    () => (role ? getSidebarEntries(role) : []),
    [role]
  );
  const activeHref = useMemo(
    () => getActiveHref(entries, pathname),
    [entries, pathname]
  );
  const activeGroupId = useMemo(
    () => getActiveGroupId(entries, activeHref),
    [entries, activeHref]
  );
  const validGroupIds = useMemo(() => getValidGroupIds(entries), [entries]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    readInitialGroups(role, validGroupIds, activeGroupId)
  );
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const [prevSync, setPrevSync] = useState<{
    role: Role | undefined;
    pathname: string;
    desktopCollapsed: boolean;
  }>({ role, pathname, desktopCollapsed });

  const prevMobilePathRef = useRef(pathname);
  const flyoutPanelRef = useRef<HTMLDivElement | null>(null);
  const flyoutTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Adjust expanded groups & dismiss flyout cleanly during render when role, route, or collapse changes
  if (
    prevSync.role !== role ||
    prevSync.pathname !== pathname ||
    prevSync.desktopCollapsed !== desktopCollapsed
  ) {
    const roleChanged = prevSync.role !== role;
    const pathChanged = prevSync.pathname !== pathname;
    const expandedFromRail =
      prevSync.desktopCollapsed && !desktopCollapsed;

    setPrevSync({ role, pathname, desktopCollapsed });

    if (roleChanged) {
      setExpandedGroups(readInitialGroups(role, validGroupIds, activeGroupId));
      setFlyout(null);
    } else if (pathChanged) {
      setFlyout(null);
      if (role && activeGroupId) {
        setExpandedGroups((prev) => mergeActiveGroup(prev, activeGroupId));
      }
    } else if (expandedFromRail) {
      setFlyout(null);
    }
  }

  // Persist open group IDs to localStorage whenever they change for the active role
  useEffect(() => {
    if (!isClient || !role) return;
    try {
      window.localStorage.setItem(
        getSidebarStorageKey(role),
        JSON.stringify(expandedGroups)
      );
    } catch {
      // Ignore storage quota or private-browsing errors
    }
  }, [isClient, role, expandedGroups]);

  // ONLY close mobile drawer when the route actually changes (prevents instant re-close bug)
  useEffect(() => {
    if (prevMobilePathRef.current !== pathname) {
      prevMobilePathRef.current = pathname;
      closeMobile();
    }
  }, [pathname, closeMobile]);

  // Lock body scroll only when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Dismiss collapsed-rail flyout on outside click, Escape, or window resize
  useEffect(() => {
    if (!flyout) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const triggerEl = flyoutTriggerRefs.current[flyout.groupId];
      if (
        flyoutPanelRef.current?.contains(target) ||
        triggerEl?.contains(target)
      ) {
        return;
      }
      setFlyout(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const triggerEl = flyoutTriggerRefs.current[flyout.groupId];
        setFlyout(null);
        triggerEl?.focus();
      }
    };

    const handleResize = () => setFlyout(null);

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [flyout]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleToggleFlyout = useCallback(
    (group: SidebarGroupEntry, triggerEl: HTMLButtonElement) => {
      setFlyout((prev) => {
        if (prev?.groupId === group.id) return null;
        const rect = triggerEl.getBoundingClientRect();
        const estimatedHeight = 56 + group.items.length * 42;
        const maxTop = Math.max(16, window.innerHeight - estimatedHeight - 16);
        return {
          groupId: group.id,
          top: Math.min(Math.max(16, rect.top), maxTop),
          left: rect.right + 10,
        };
      });
    },
    []
  );

  if (!user) return null;

  const activeFlyoutGroup = flyout
    ? entries.find(
        (entry): entry is SidebarGroupEntry =>
          entry.type === "group" && entry.id === flyout.groupId
      )
    : undefined;

  const renderLinkItem = (
    item: SidebarLinkItem,
    isCollapsed: boolean,
    instanceId: "desktop" | "mobile",
    isChild = false
  ) => {
    const Icon = ICON_MAP[item.icon];
    const isActive = item.href === activeHref;

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={closeMobile}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center rounded-xl font-medium transition-colors duration-150 active:scale-[0.97] motion-reduce:active:scale-100 group",
          isCollapsed
            ? "justify-center p-3"
            : isChild
            ? "justify-between px-3 py-2 text-[13px]"
            : "justify-between px-3.5 py-2.5 text-sm",
          isActive
            ? "text-[#123F17] font-semibold"
            : "text-[#1F2A24] hover:bg-[#F1F8F1] hover:text-[#1B5E20]"
        )}
      >
        {isActive && (
          <motion.div
            layoutId={`sidebar-active-indicator-${instanceId}`}
            className="absolute inset-0 bg-[#DCEFDD] rounded-xl border border-[#1B5E20]/20 shadow-2xs -z-0"
            transition={
              prefersReduced
                ? { duration: 0.01 }
                : { type: "spring", stiffness: 380, damping: 30 }
            }
          />
        )}
        <div
          className={cn(
            "relative z-10 flex items-center gap-3 min-w-0",
            isCollapsed && "justify-center"
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4 transition-transform duration-150 group-hover:scale-110 motion-reduce:group-hover:scale-100 shrink-0",
              isActive
                ? "text-[#1B5E20]"
                : "text-[#55645B] group-hover:text-[#1B5E20]"
            )}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!isCollapsed && isActive && (
          <span className="relative z-10 w-1.5 h-4 rounded-full bg-[#F2B705] shadow-xs shrink-0" />
        )}
      </Link>
    );
  };

  const renderGroupEntry = (
    group: SidebarGroupEntry,
    isCollapsed: boolean,
    instanceId: "desktop" | "mobile"
  ) => {
    const GroupIcon = ICON_MAP[group.icon];
    const hasActiveChild = group.id === activeGroupId;
    const isExpanded = expandedGroups.includes(group.id);
    const isFlyoutOpen = isCollapsed && flyout?.groupId === group.id;
    const panelId = `sidebar-group-${instanceId}-${group.id}`;

    if (isCollapsed) {
      return (
        <button
          key={group.id}
          ref={(el) => {
            if (instanceId === "desktop") {
              flyoutTriggerRefs.current[group.id] = el;
            }
          }}
          type="button"
          onClick={(e) => handleToggleFlyout(group, e.currentTarget)}
          title={group.label}
          aria-label={group.label}
          aria-haspopup="menu"
          aria-expanded={isFlyoutOpen}
          className={cn(
            "relative w-full flex items-center justify-center p-3 rounded-xl font-medium transition-colors duration-150 active:scale-[0.97] motion-reduce:active:scale-100 group",
            hasActiveChild || isFlyoutOpen
              ? "bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/20 shadow-2xs"
              : "text-[#1F2A24] hover:bg-[#F1F8F1] hover:text-[#1B5E20]"
          )}
        >
          <GroupIcon
            className={cn(
              "w-4 h-4 transition-transform duration-150 group-hover:scale-110 motion-reduce:group-hover:scale-100 shrink-0",
              hasActiveChild || isFlyoutOpen
                ? "text-[#1B5E20]"
                : "text-[#55645B] group-hover:text-[#1B5E20]"
            )}
          />
          {hasActiveChild && (
            <span
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F2B705] ring-2 ring-[#DCEFDD]"
              aria-hidden="true"
            />
          )}
        </button>
      );
    }

    return (
      <div key={group.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleToggleGroup(group.id)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className={cn(
            "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 active:scale-[0.97] motion-reduce:active:scale-100 group border",
            hasActiveChild && !isExpanded
              ? "bg-[#F1F8F1] text-[#123F17] font-semibold border-[#1B5E20]/15"
              : hasActiveChild
              ? "text-[#123F17] font-semibold border-transparent hover:bg-[#F1F8F1]"
              : "text-[#1F2A24] border-transparent hover:bg-[#F1F8F1] hover:text-[#1B5E20]"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <GroupIcon
              className={cn(
                "w-4 h-4 transition-transform duration-150 group-hover:scale-110 motion-reduce:group-hover:scale-100 shrink-0",
                hasActiveChild
                  ? "text-[#1B5E20]"
                  : "text-[#55645B] group-hover:text-[#1B5E20]"
              )}
            />
            <span className="truncate">{group.label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasActiveChild && !isExpanded && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#F2B705]"
                aria-hidden="true"
              />
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                isExpanded && "rotate-180",
                hasActiveChild ? "text-[#1B5E20]" : "text-[#55645B]"
              )}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={panelId}
              initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={prefersReduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.22,
                ease: EASE_OUT,
              }}
              className="overflow-hidden"
            >
              <div className="mt-1 ml-3.5 pl-2.5 border-l border-[#D6DDD8]/80 space-y-1 pb-0.5">
                {group.items.map((item) =>
                  renderLinkItem(item, false, instanceId, true)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderNavContent = (
    isCollapsed: boolean,
    instanceId: "desktop" | "mobile"
  ) => (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      {/* Scrollable Navigation Area with Apple Sleek Scrollbar */}
      <div
        onScroll={() => {
          if (isCollapsed && flyout) {
            setFlyout(null);
          }
        }}
        className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 apple-scrollbar"
      >
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold text-[#55645B]/80 tracking-widest uppercase mb-2.5">
              Platform Menu
            </p>
          )}
          <nav className="space-y-1" aria-label="Sidebar navigation">
            {entries.map((entry) =>
              entry.type === "link"
                ? renderLinkItem(entry, isCollapsed, instanceId, false)
                : renderGroupEntry(entry, isCollapsed, instanceId)
            )}
          </nav>
        </div>
      </div>

      {/* Pinned Bottom Footer (Office Pill + Role Indicator) */}
      <div className="shrink-0 pt-3 space-y-3">
        {!isCollapsed && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F1F8F1] to-[#DCEFDD]/50 border border-[#DCEFDD] text-xs text-[#1F2A24] shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1B5E20] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
              <span>MinSU TDP Office</span>
            </div>
            <p className="text-[#55645B] leading-relaxed text-[11px]">
              Official TDP Annexes 1–10 automated tracking and transmittal system.
            </p>
          </div>
        )}

        {!isCollapsed && (
          <div className="pt-3 border-t border-[#D6DDD8]/80 text-xs text-[#55645B] flex items-center justify-between px-2">
            <span className="font-medium">Active Role</span>
            <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#DCEFDD] text-[#123F17] text-[11px]">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Collapsible Sidebar with Apple Glassmorphic Styling */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 bg-white/90 backdrop-blur-xl border-r border-[#D6DDD8]/80 h-full flex-col justify-between p-4 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          desktopCollapsed ? "w-20" : "w-64"
        )}
      >
        {renderNavContent(desktopCollapsed, "desktop")}
      </aside>

      {/* Portal Flyout Menu for Collapsed Desktop Icon-Rail */}
      {isClient &&
        createPortal(
          <AnimatePresence>
            {desktopCollapsed && flyout && activeFlyoutGroup && (
              <motion.div
                ref={flyoutPanelRef}
                role="menu"
                aria-label={activeFlyoutGroup.label}
                style={{
                  top: flyout.top,
                  left: flyout.left,
                  transformOrigin: "left center",
                }}
                initial={
                  prefersReduced
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, x: -4 }
                }
                animate={
                  prefersReduced
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, x: 0 }
                }
                exit={
                  prefersReduced
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, x: -4 }
                }
                transition={{
                  duration: prefersReduced ? 0.12 : 0.16,
                  ease: EASE_OUT,
                }}
                className="fixed hidden md:block w-60 rounded-2xl bg-white/95 backdrop-blur-2xl text-[#1F2A24] border border-[#D6DDD8]/90 shadow-[0_14px_40px_-6px_rgba(18,63,23,0.2),0_0_0_1px_rgba(0,0,0,0.04)] p-2 z-[80]"
              >
                <p className="px-2.5 pt-1 pb-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-[#55645B] border-b border-[#D6DDD8]/60">
                  {activeFlyoutGroup.label}
                </p>
                <div className="space-y-0.5">
                  {activeFlyoutGroup.items.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    const isActive = item.href === activeHref;

                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setFlyout(null)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150 active:scale-[0.97] motion-reduce:active:scale-100",
                          isActive
                            ? "bg-[#DCEFDD] text-[#123F17] font-semibold border border-[#1B5E20]/20"
                            : "text-[#1F2A24] hover:bg-[#F1F8F1] hover:text-[#1B5E20]"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive ? "text-[#1B5E20]" : "text-[#55645B]"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-3.5 rounded-full bg-[#F2B705] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Mobile Drawer with Apple Blur Backdrop and Symmetric Slide In / Out */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none delay-150"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop with click-to-close */}
        <div
          onClick={closeMobile}
          className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Slide-over panel with Apple spring physics curve */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] z-[70] flex flex-col p-4 transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D6DDD8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F9C733] to-[#F2B705] flex items-center justify-center text-[#123F17] font-bold text-sm border-2 border-white shadow-xs">
                <span>M</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[#1B5E20] leading-tight">
                  MinSU DocTrack
                </h3>
                <p className="text-[10px] text-[#55645B]">
                  TDP Annex Management
                </p>
              </div>
            </div>
            <button
              onClick={closeMobile}
              type="button"
              className="p-1.5 rounded-xl text-[#55645B] hover:bg-[#F1F8F1] active:scale-95 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderNavContent(false, "mobile")}
          </div>
        </div>
      </div>
    </>
  );
};
