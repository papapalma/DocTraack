import crypto from "crypto";
import {
  KioskDisplayMode,
  Prisma,
  QueueCounter,
  QueuePriority,
  QueueService,
  QueueTicket,
  QueueTicketStatus,
  Role,
} from "@prisma/client";
import { prisma } from "./prisma";
import { getMinsuCampusConfig, MINSU_CAMPUSES } from "./campus-constants";
import { sanitizeText } from "./validation";
import { emitQueueEvent, getQueueVersion } from "./queue-events";
import {
  getCounterOwnership,
  getServiceAssignmentStatus,
  selectNextWaitingTicket,
  selectRoutedWaitingTicket,
  type QueueCandidate,
} from "./queue-fairness";

export {
  getCounterOwnership,
  getServiceAssignmentStatus,
  selectNextWaitingTicket,
  selectRoutedWaitingTicket,
  type QueueCandidate,
};
import type {
  MobileTicketTrackerDTO,
  PublicKioskStatePayload,
  PublicQueueTicketDTO,
  QueueConfigPublicDTO,
  QueueCounterDTO,
  QueueDashboardMetrics,
  QueueOperatorDTO,
  QueueServiceDTO,
  StaffQueueDashboardPayload,
  StaffQueueTicketDTO,
} from "@/types/queue";
import type { Role as AppRole } from "@/types";

const DEFAULT_SERVICES: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  colorToken: string;
  estimatedMinutes: number;
  handledByRoles: Role[];
  sortOrder: number;
}> = [
  {
    code: "A",
    name: "TDP Application & Annex 2",
    description: "New scholarship inquiries, Annex 2 filing, and document submission",
    icon: "file-text",
    colorToken: "green",
    estimatedMinutes: 5,
    handledByRoles: [Role.STAFF],
    sortOrder: 1,
  },
  {
    code: "P",
    name: "Payroll & Stipend Inquiry",
    description: "Grant release schedules, Annex 9 payroll check, and accounting concerns",
    icon: "wallet",
    colorToken: "gold",
    estimatedMinutes: 6,
    handledByRoles: [Role.ACCOUNTING, Role.STAFF],
    sortOrder: 2,
  },
  {
    code: "V",
    name: "Verification & Certificate",
    description: "Enrollment validation, 3-way discrepancy resolution, and award certificates",
    icon: "shield-check",
    colorToken: "emerald",
    estimatedMinutes: 7,
    handledByRoles: [Role.STAFF, Role.DIRECTOR],
    sortOrder: 3,
  },
  {
    code: "G",
    name: "General TDP Assistance",
    description: "Profile updates, tracking code assistance, and general inquiries",
    icon: "help-circle",
    colorToken: "slate",
    estimatedMinutes: 4,
    handledByRoles: [Role.STAFF, Role.ACCOUNTING, Role.DIRECTOR],
    sortOrder: 4,
  },
];

export function getManilaQueueDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function normalizeQueueCampus(campus?: string | null): string {
  if (!campus || !campus.trim()) {
    return "Bongabong Campus";
  }
  return getMinsuCampusConfig(campus).key;
}

export function formatTicketNumber(code: string, seq: number): string {
  const cleanCode = (code || "Q").trim().toUpperCase().slice(0, 3);
  return `${cleanCode}-${String(Math.max(1, seq)).padStart(3, "0")}`;
}

export function maskVisitorName(name?: string | null): string | null {
  if (!name) return null;
  const cleaned = sanitizeText(name, 80);
  if (!cleaned) return null;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 1) return `${part}*`;
      return `${part[0]}${"*".repeat(Math.min(3, part.length - 1))}`;
    })
    .join(" ");
}

export function toPublicConfigDTO(config: {
  id: string;
  kioskMode: KioskDisplayMode;
  defaultCampus: string;
  allowCampusSwitch: boolean;
  showHomepageKioskButton: boolean;
  showPrivacyMaskedNames: boolean;
  enableThermalPrint: boolean;
  autoPrintTicket: boolean;
  enableSoundChime: boolean;
  enableVoiceTts: boolean;
  priorityRatio: number;
  idleResetSeconds: number;
  attractModeSeconds: number;
  kioskPinHash: string | null;
  rateLimitBypassEnabled: boolean;
  updatedAt: Date;
}): QueueConfigPublicDTO {
  return {
    id: config.id,
    kioskMode: config.kioskMode,
    defaultCampus: normalizeQueueCampus(config.defaultCampus),
    allowCampusSwitch: config.allowCampusSwitch,
    showHomepageKioskButton: config.showHomepageKioskButton,
    showPrivacyMaskedNames: config.showPrivacyMaskedNames,
    enableThermalPrint: config.enableThermalPrint,
    autoPrintTicket: config.autoPrintTicket,
    enableSoundChime: config.enableSoundChime,
    enableVoiceTts: config.enableVoiceTts,
    priorityRatio: config.priorityRatio,
    idleResetSeconds: config.idleResetSeconds,
    attractModeSeconds: config.attractModeSeconds,
    rateLimitBypassEnabled: config.rateLimitBypassEnabled,
    hasPinConfigured: Boolean(config.kioskPinHash),
    updatedAt: config.updatedAt.toISOString(),
  };
}

let bootstrapPromise: Promise<void> | null = null;

export async function ensureQueueBootstrap(): Promise<QueueConfigPublicDTO> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const existingConfig = await prisma.queueConfig.findUnique({
        where: { id: "default" },
      });

      if (!existingConfig) {
        await prisma.queueConfig
          .create({
            data: {
              id: "default",
              kioskMode: KioskDisplayMode.UNIFIED,
              defaultCampus: "Bongabong Campus",
            },
          })
          .catch(() => {});
      }

      const serviceCount = await prisma.queueService.count();
      if (serviceCount === 0) {
        for (const svc of DEFAULT_SERVICES) {
          await prisma.queueService
            .upsert({
              where: { code: svc.code },
              update: {},
              create: svc,
            })
            .catch(() => {});
        }
      }

      const counterCount = await prisma.queueCounter.count();
      if (counterCount === 0) {
        for (const campusCfg of MINSU_CAMPUSES) {
          const windows = [
            {
              name: "Window 1",
              campus: campusCfg.key,
              serviceCodes: ["A", "V", "G"],
              allowedRoles: [Role.STAFF, Role.DIRECTOR],
              sortOrder: 1,
              isOpen: true,
            },
            {
              name: "Window 2",
              campus: campusCfg.key,
              serviceCodes: ["P", "G"],
              allowedRoles: [Role.ACCOUNTING, Role.STAFF],
              sortOrder: 2,
              isOpen: true,
            },
            {
              name: "Window 3",
              campus: campusCfg.key,
              serviceCodes: ["V", "A", "G"],
              allowedRoles: [Role.DIRECTOR, Role.STAFF],
              sortOrder: 3,
              isOpen: false,
            },
          ];
          for (const win of windows) {
            await prisma.queueCounter
              .upsert({
                where: {
                  campus_name: {
                    campus: win.campus,
                    name: win.name,
                  },
                },
                update: {},
                create: win,
              })
              .catch(() => {});
          }
        }
      }
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;

  const cfg = await prisma.queueConfig.findUniqueOrThrow({
    where: { id: "default" },
  });
  return toPublicConfigDTO(cfg);
}

export async function resolveAssignableOperators(params: {
  ids?: unknown[];
  emails?: unknown[];
}): Promise<QueueOperatorDTO[]> {
  const cleanIds = Array.isArray(params.ids)
    ? Array.from(
        new Set(
          params.ids.map((v) => sanitizeText(String(v || ""), 64)).filter(Boolean)
        )
      )
    : [];
  const cleanEmails = Array.isArray(params.emails)
    ? Array.from(
        new Set(
          params.emails
            .map((v) => sanitizeText(String(v || ""), 120).toLowerCase())
            .filter(Boolean)
        )
      )
    : [];

  if (cleanIds.length === 0 && cleanEmails.length === 0) {
    return [];
  }

  const orClauses: Prisma.UserWhereInput[] = [];
  if (cleanIds.length > 0) {
    orClauses.push({ id: { in: cleanIds } });
  }
  for (const email of cleanEmails) {
    orClauses.push({ email: { equals: email, mode: "insensitive" } });
  }

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: [Role.STAFF, Role.ACCOUNTING, Role.DIRECTOR] },
      OR: orClauses,
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const matchedIds = new Set(users.map((u) => u.id));
  const matchedEmails = new Set(users.map((u) => u.email.toLowerCase()));

  for (const id of cleanIds) {
    if (!matchedIds.has(id)) {
      throw new Error(`INVALID_OPERATOR:${id}`);
    }
  }
  for (const email of cleanEmails) {
    if (!matchedEmails.has(email)) {
      throw new Error(`INVALID_OPERATOR:${email}`);
    }
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as AppRole,
  }));
}

function toPublicTicketDTO(
  t: QueueTicket,
  showMaskedNames: boolean
): PublicQueueTicketDTO {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    sequenceNumber: t.sequenceNumber,
    queueDate: t.queueDate,
    campus: t.campus,
    serviceId: t.serviceId,
    serviceCode: t.serviceCode,
    serviceName: t.serviceName,
    priority: t.priority,
    status: t.status,
    maskedVisitorName: showMaskedNames ? maskVisitorName(t.visitorName) : null,
    counterId: t.counterId,
    counterName: t.counterName,
    recallCount: t.recallCount,
    calledAt: t.calledAt ? t.calledAt.toISOString() : null,
    servingStartedAt: t.servingStartedAt
      ? t.servingStartedAt.toISOString()
      : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  };
}

function toStaffTicketDTO(
  t: QueueTicket & {
    servedBy?: { id: string; name: string; email: string } | null;
  },
  showMaskedNames: boolean
): StaffQueueTicketDTO {
  return {
    ...toPublicTicketDTO(t, showMaskedNames),
    priorityReason: t.priorityReason,
    visitorName: t.visitorName,
    studentIdNo: t.studentIdNo,
    trackingCodeRef: t.trackingCodeRef,
    publicLookupToken: t.publicLookupToken,
    servedById: t.servedById,
    servedByName: t.servedBy?.name ?? null,
    servedByEmail: t.servedBy?.email ?? null,
    notes: t.notes,
  };
}

function toServiceDTO(
  s: QueueService & {
    assignedStaff?: Array<{
      id: string;
      name: string;
      email: string;
      role: Role;
    }>;
  },
  waitingCount = 0,
  openCounterCount = 1
): QueueServiceDTO {
  const effectiveCounters = Math.max(1, openCounterCount);
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    description: s.description,
    campus: s.campus,
    icon: s.icon,
    colorToken: s.colorToken,
    estimatedMinutes: s.estimatedMinutes,
    handledByRoles: s.handledByRoles as AppRole[],
    ...(s.assignedStaff
      ? {
          assignedStaff: s.assignedStaff.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as AppRole,
          })),
        }
      : {}),
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    waitingCount,
    estimatedWaitMinutes: Math.ceil(
      (waitingCount * s.estimatedMinutes) / effectiveCounters
    ),
  };
}

function mapCountersWithTickets<T extends PublicQueueTicketDTO>(
  counters: Array<
    QueueCounter & {
      assignedStaff?: {
        id: string;
        name: string;
        email?: string | null;
        role?: Role | null;
      } | null;
    }
  >,
  activeTickets: T[],
  includeStaffEmail = false
): Array<Omit<QueueCounterDTO, "currentTicket"> & { currentTicket: T | null }> {
  const ticketById = new Map(activeTickets.map((t) => [t.id, t]));
  return counters.map((c) => ({
    id: c.id,
    name: c.name,
    campus: c.campus,
    serviceCodes: c.serviceCodes,
    allowedRoles: c.allowedRoles as AppRole[],
    assignedStaffId: c.assignedStaffId,
    assignedStaffName: c.assignedStaff?.name ?? null,
    ...(includeStaffEmail
      ? {
          assignedStaffEmail: c.assignedStaff?.email ?? null,
          assignedStaffRole: (c.assignedStaff?.role as AppRole) ?? null,
        }
      : {}),
    currentTicketId: c.currentTicketId,
    currentTicket: c.currentTicketId
      ? ticketById.get(c.currentTicketId) ?? null
      : null,
    consecutivePriorityCount: c.consecutivePriorityCount,
    isOpen: c.isOpen,
    isPaused: c.isPaused,
    sortOrder: c.sortOrder,
  }));
}

export async function getPublicKioskState(
  requestedCampus?: string | null
): Promise<PublicKioskStatePayload> {
  const config = await ensureQueueBootstrap();
  const campus = normalizeQueueCampus(
    requestedCampus || config.defaultCampus
  );
  const queueDate = getManilaQueueDate();

  const [services, counters, todayTickets, announcements] = await Promise.all([
    prisma.queueService.findMany({
      where: {
        isActive: true,
        OR: [{ campus: null }, { campus }],
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.queueCounter.findMany({
      where: { campus },
      include: { assignedStaff: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.queueTicket.findMany({
      where: { queueDate, campus },
      orderBy: [{ createdAt: "asc" }, { sequenceNumber: "asc" }],
    }),
    prisma.announcement.findMany({
      where: { targetAudience: { in: ["ALL", "PUBLIC"] } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: { id: true, title: true, category: true, isPinned: true },
    }),
  ]);

  const waitingRaw = todayTickets.filter(
    (t) => t.status === QueueTicketStatus.WAITING
  );
  const activeRaw = todayTickets.filter(
    (t) =>
      t.status === QueueTicketStatus.CALLED ||
      t.status === QueueTicketStatus.SERVING
  );
  const completedRaw = todayTickets
    .filter((t) => t.status === QueueTicketStatus.COMPLETED)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
    )
    .slice(0, 6);

  const openCounters = counters.filter((c) => c.isOpen && !c.isPaused);

  const serviceDTOs = services.map((s) => {
    const waitingForSvc = waitingRaw.filter((t) => t.serviceId === s.id).length;
    const capableCounters = openCounters.filter(
      (c) => c.serviceCodes.length === 0 || c.serviceCodes.includes(s.code)
    ).length;
    return toServiceDTO(s, waitingForSvc, capableCounters);
  });

  const activeDTOs = activeRaw.map((t) =>
    toPublicTicketDTO(t, config.showPrivacyMaskedNames)
  );
  const waitingDTOs = waitingRaw.map((t) =>
    toPublicTicketDTO(t, config.showPrivacyMaskedNames)
  );
  const completedDTOs = completedRaw.map((t) =>
    toPublicTicketDTO(t, config.showPrivacyMaskedNames)
  );

  return {
    campus,
    queueDate,
    version: getQueueVersion(),
    config,
    services: serviceDTOs,
    counters: mapCountersWithTickets(counters, activeDTOs),
    waitingTickets: waitingDTOs,
    recentlyCompleted: completedDTOs,
    announcements,
    stats: {
      waitingTotal: waitingRaw.length,
      priorityWaiting: waitingRaw.filter(
        (t) => t.priority === QueuePriority.PRIORITY
      ).length,
      regularWaiting: waitingRaw.filter(
        (t) => t.priority === QueuePriority.REGULAR
      ).length,
      servedToday: todayTickets.filter(
        (t) => t.status === QueueTicketStatus.COMPLETED
      ).length,
      openCounters: openCounters.length,
    },
  };
}

export async function getStaffQueueDashboard(
  requestedCampus?: string | null
): Promise<StaffQueueDashboardPayload> {
  const config = await ensureQueueBootstrap();
  const campus = normalizeQueueCampus(
    requestedCampus || config.defaultCampus
  );
  const queueDate = getManilaQueueDate();

  const [services, counters, todayTickets, operators] = await Promise.all([
    prisma.queueService.findMany({
      where: {
        OR: [{ campus: null }, { campus }],
      },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true, role: true },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.queueCounter.findMany({
      where: { campus },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.queueTicket.findMany({
      where: { queueDate, campus },
      include: { servedBy: { select: { id: true, name: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { sequenceNumber: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        active: true,
        role: { in: [Role.STAFF, Role.ACCOUNTING, Role.DIRECTOR] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  const waitingRaw = todayTickets.filter(
    (t) => t.status === QueueTicketStatus.WAITING
  );
  const activeRaw = todayTickets.filter(
    (t) =>
      t.status === QueueTicketStatus.CALLED ||
      t.status === QueueTicketStatus.SERVING
  );
  const completedRaw = todayTickets.filter(
    (t) => t.status === QueueTicketStatus.COMPLETED
  );
  const noShowRaw = todayTickets.filter(
    (t) => t.status === QueueTicketStatus.NO_SHOW
  );
  const cancelledRaw = todayTickets.filter(
    (t) => t.status === QueueTicketStatus.CANCELLED
  );

  // Calculate average wait & service durations
  const waitDurations = todayTickets
    .filter((t) => t.calledAt)
    .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 60000);
  const serviceDurations = completedRaw
    .filter((t) => t.completedAt && (t.servingStartedAt || t.calledAt))
    .map((t) => {
      const start = (t.servingStartedAt ?? t.calledAt)!.getTime();
      return Math.max(0, (t.completedAt!.getTime() - start) / 60000);
    });

  const avgWaitMinutes =
    waitDurations.length > 0
      ? Number(
          (
            waitDurations.reduce((sum, v) => sum + v, 0) / waitDurations.length
          ).toFixed(1)
        )
      : 0;
  const avgServiceMinutes =
    serviceDurations.length > 0
      ? Number(
          (
            serviceDurations.reduce((sum, v) => sum + v, 0) /
            serviceDurations.length
          ).toFixed(1)
        )
      : 0;

  const openCounters = counters.filter((c) => c.isOpen && !c.isPaused);
  const serviceDTOs = services.map((s) => {
    const waitingForSvc = waitingRaw.filter((t) => t.serviceId === s.id).length;
    const capableCounters = openCounters.filter(
      (c) => c.serviceCodes.length === 0 || c.serviceCodes.includes(s.code)
    ).length;
    return toServiceDTO(s, waitingForSvc, capableCounters);
  });

  const activeDTOs = activeRaw.map((t) =>
    toStaffTicketDTO(t, config.showPrivacyMaskedNames)
  );
  const waitingDTOs = waitingRaw.map((t) =>
    toStaffTicketDTO(t, config.showPrivacyMaskedNames)
  );
  const recentDTOs = [...todayTickets]
    .filter(
      (t) =>
        t.status === QueueTicketStatus.COMPLETED ||
        t.status === QueueTicketStatus.NO_SHOW ||
        t.status === QueueTicketStatus.CANCELLED
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 30)
    .map((t) => toStaffTicketDTO(t, config.showPrivacyMaskedNames));

  const metrics: QueueDashboardMetrics = {
    waitingCount: waitingRaw.length,
    activeServingCount: activeRaw.length,
    completedTodayCount: completedRaw.length,
    noShowTodayCount: noShowRaw.length,
    cancelledTodayCount: cancelledRaw.length,
    priorityTodayCount: todayTickets.filter(
      (t) => t.priority === QueuePriority.PRIORITY
    ).length,
    regularTodayCount: todayTickets.filter(
      (t) => t.priority === QueuePriority.REGULAR
    ).length,
    avgWaitMinutes,
    avgServiceMinutes,
    byService: services.map((s) => ({
      code: s.code,
      name: s.name,
      waiting: waitingRaw.filter((t) => t.serviceId === s.id).length,
      completed: completedRaw.filter((t) => t.serviceId === s.id).length,
    })),
  };

  return {
    campus,
    queueDate,
    version: getQueueVersion(),
    config,
    services: serviceDTOs,
    counters: mapCountersWithTickets(counters, activeDTOs, true),
    operators: operators.map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      role: o.role as AppRole,
    })),
    waitingTickets: waitingDTOs,
    activeTickets: activeDTOs,
    recentTickets: recentDTOs,
    metrics,
  };
}

export async function issueWalkInTicket(params: {
  campus?: string | null;
  serviceId: string;
  priority?: "REGULAR" | "PRIORITY";
  priorityReason?: string | null;
  visitorName?: string | null;
  studentIdNo?: string | null;
  trackingCodeRef?: string | null;
}) {
  const config = await ensureQueueBootstrap();
  const campus = normalizeQueueCampus(params.campus || config.defaultCampus);
  const queueDate = getManilaQueueDate();

  const service = await prisma.queueService.findUnique({
    where: { id: params.serviceId },
  });

  if (!service || !service.isActive) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  if (service.campus && normalizeQueueCampus(service.campus) !== campus) {
    throw new Error("SERVICE_CAMPUS_MISMATCH");
  }

  const priority =
    params.priority === "PRIORITY"
      ? QueuePriority.PRIORITY
      : QueuePriority.REGULAR;

  const cleanVisitorName = params.visitorName
    ? sanitizeText(params.visitorName, 80) || null
    : null;
  const cleanStudentId = params.studentIdNo
    ? sanitizeText(params.studentIdNo, 25).toUpperCase() || null
    : null;
  const cleanTrackingRef = params.trackingCodeRef
    ? sanitizeText(params.trackingCodeRef, 40).toUpperCase() || null
    : null;
  const cleanPriorityReason =
    priority === QueuePriority.PRIORITY && params.priorityReason
      ? sanitizeText(params.priorityReason, 60) || "Priority Lane"
      : priority === QueuePriority.PRIORITY
      ? "PWD / Senior / Pregnant"
      : null;

  let createdTicket: QueueTicket | null = null;
  let lastError: unknown;

  // Retry loop protects against concurrent P2002 sequence collisions on busy kiosks
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      createdTicket = await prisma.$transaction(async (tx) => {
        const latest = await tx.queueTicket.findFirst({
          where: { queueDate, campus, serviceCode: service.code },
          orderBy: { sequenceNumber: "desc" },
          select: { sequenceNumber: true },
        });

        const nextSeq = (latest?.sequenceNumber ?? 0) + 1;
        const ticketNumber = formatTicketNumber(service.code, nextSeq);
        const publicLookupToken = crypto.randomBytes(10).toString("hex");

        const ticket = await tx.queueTicket.create({
          data: {
            ticketNumber,
            sequenceNumber: nextSeq,
            queueDate,
            campus,
            serviceId: service.id,
            serviceCode: service.code,
            serviceName: service.name,
            priority,
            priorityReason: cleanPriorityReason,
            status: QueueTicketStatus.WAITING,
            visitorName: cleanVisitorName,
            studentIdNo: cleanStudentId,
            trackingCodeRef: cleanTrackingRef,
            publicLookupToken,
          },
        });

        await tx.queueTicketEvent.create({
          data: {
            ticketId: ticket.id,
            fromStatus: null,
            toStatus: QueueTicketStatus.WAITING,
            note: "Walk-in check-in issued at kiosk",
          },
        });

        return ticket;
      });
      break;
    } catch (err) {
      lastError = err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }

  if (!createdTicket) {
    throw lastError ?? new Error("TICKET_ISSUANCE_FAILED");
  }

  const waitingAhead = await prisma.queueTicket.count({
    where: {
      queueDate,
      campus,
      serviceId: service.id,
      status: QueueTicketStatus.WAITING,
      id: { not: createdTicket.id },
      createdAt: { lt: createdTicket.createdAt },
    },
  });

  const openCapableCounters = await prisma.queueCounter.count({
    where: {
      campus,
      isOpen: true,
      isPaused: false,
      OR: [
        { serviceCodes: { isEmpty: true } },
        { serviceCodes: { has: service.code } },
      ],
    },
  });

  const estimatedWaitMinutes = Math.ceil(
    ((waitingAhead + 1) * service.estimatedMinutes) /
      Math.max(1, openCapableCounters)
  );

  emitQueueEvent({
    type: "ISSUE",
    campus,
    queueDate,
    ticketNumber: createdTicket.ticketNumber,
  });

  return {
    ticket: toPublicTicketDTO(createdTicket, config.showPrivacyMaskedNames),
    publicLookupToken: createdTicket.publicLookupToken,
    aheadCount: waitingAhead,
    estimatedWaitMinutes,
    maskedVisitorName: config.showPrivacyMaskedNames
      ? maskVisitorName(createdTicket.visitorName)
      : null,
  };
}

export async function callNextTicketForCounter(params: {
  counterId: string;
  actorId: string;
  actorEmail?: string | null;
  actorRole?: AppRole;
  serviceIdFilter?: string;
  allowTakeover?: boolean;
}) {
  const config = await ensureQueueBootstrap();
  const queueDate = getManilaQueueDate();

  const result = await prisma.$transaction(async (tx) => {
    const [counter, actor, activeServices] = await Promise.all([
      tx.queueCounter.findUnique({
        where: { id: params.counterId },
        include: {
          assignedStaff: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      tx.user.findUnique({
        where: { id: params.actorId },
        select: { id: true, name: true, email: true, role: true },
      }),
      tx.queueService.findMany({
        where: { isActive: true },
        include: {
          assignedStaff: { select: { id: true, email: true } },
        },
      }),
    ]);

    if (!counter) {
      throw new Error("COUNTER_NOT_FOUND");
    }

    const effectiveEmail = params.actorEmail ?? actor?.email ?? null;
    const effectiveRole = (params.actorRole ?? actor?.role) as AppRole | undefined;
    const isAdmin = effectiveRole === "SYSTEM_ADMIN";
    const allowTakeover = Boolean(params.allowTakeover) || isAdmin;

    const counterOwnership = getCounterOwnership(
      {
        assignedStaffId: counter.assignedStaffId,
        assignedStaffEmail: counter.assignedStaff?.email ?? null,
      },
      params.actorId,
      effectiveEmail
    );

    if (counterOwnership === "OWNED_BY_OTHER" && !allowTakeover) {
      throw new Error(
        `COUNTER_TAKEOVER_REQUIRED:${counter.assignedStaff?.name || "Staff"} (${
          counter.assignedStaff?.email || "assigned"
        })`
      );
    }

    if (counter.currentTicketId) {
      const existingActive = await tx.queueTicket.findUnique({
        where: { id: counter.currentTicketId },
      });
      if (
        existingActive &&
        (existingActive.status === QueueTicketStatus.CALLED ||
          existingActive.status === QueueTicketStatus.SERVING)
      ) {
        throw new Error("COUNTER_BUSY");
      }
    }

    const whereWaiting: Prisma.QueueTicketWhereInput = {
      queueDate,
      campus: counter.campus,
      status: QueueTicketStatus.WAITING,
    };

    if (params.serviceIdFilter) {
      whereWaiting.serviceId = params.serviceIdFilter;
    } else if (counter.serviceCodes.length > 0) {
      whereWaiting.serviceCode = { in: counter.serviceCodes };
    }

    const candidates = await tx.queueTicket.findMany({
      where: whereWaiting,
      orderBy: [{ createdAt: "asc" }, { sequenceNumber: "asc" }],
    });

    const serviceAssignmentsByCode = new Map(
      activeServices.map((svc) => [svc.code, svc.assignedStaff])
    );

    const routed = selectRoutedWaitingTicket({
      waiting: candidates,
      consecutivePriorityCount: counter.consecutivePriorityCount,
      priorityRatio: config.priorityRatio,
      serviceAssignmentsByCode,
      userId: params.actorId,
      userEmail: effectiveEmail,
      allowTakeover,
    });

    const chosen = routed.selected;

    if (!chosen) {
      return null;
    }

    const now = new Date();
    const updatedTicket = await tx.queueTicket.update({
      where: { id: chosen.id },
      data: {
        status: QueueTicketStatus.CALLED,
        counterId: counter.id,
        counterName: counter.name,
        servedById: params.actorId,
        calledAt: now,
        recallCount: 1,
      },
    });

    const nextStreak =
      chosen.priority === QueuePriority.PRIORITY
        ? counter.consecutivePriorityCount + 1
        : 0;

    // Preserve Admin's designated counter owner (`assignedStaffId`)
    await tx.queueCounter.update({
      where: { id: counter.id },
      data: {
        currentTicketId: updatedTicket.id,
        isOpen: true,
        isPaused: false,
        consecutivePriorityCount: nextStreak,
      },
    });

    const isEmergencyTakeover =
      (routed.isTakeover || counterOwnership === "OWNED_BY_OTHER") && !isAdmin;
    const actorLabel = actor
      ? `${actor.name} (${actor.email})`
      : params.actorId;

    await tx.queueTicketEvent.create({
      data: {
        ticketId: updatedTicket.id,
        fromStatus: QueueTicketStatus.WAITING,
        toStatus: QueueTicketStatus.CALLED,
        counterId: counter.id,
        actorId: params.actorId,
        note: isEmergencyTakeover
          ? `Emergency takeover & called at ${counter.name} by ${actorLabel}`
          : `Accepted & called at ${counter.name} by ${actorLabel}`,
      },
    });

    return {
      counter,
      ticket: updatedTicket,
      isTakeover: isEmergencyTakeover,
    };
  });

  if (!result) return null;

  emitQueueEvent({
    type: "CALL",
    campus: result.counter.campus,
    queueDate,
    ticketNumber: result.ticket.ticketNumber,
    counterName: result.counter.name,
    recallTick: result.ticket.recallCount,
  });

  return result;
}

export async function getMobileTicketTracker(
  token: string
): Promise<MobileTicketTrackerDTO | null> {
  const config = await ensureQueueBootstrap();
  const cleanToken = sanitizeText(token, 64);
  if (!cleanToken) return null;

  const ticket = await prisma.queueTicket.findUnique({
    where: { publicLookupToken: cleanToken },
    include: { service: true },
  });

  if (!ticket) return null;

  let aheadCount = 0;
  if (ticket.status === QueueTicketStatus.WAITING) {
    const waitingSameService = await prisma.queueTicket.findMany({
      where: {
        queueDate: ticket.queueDate,
        campus: ticket.campus,
        serviceId: ticket.serviceId,
        status: QueueTicketStatus.WAITING,
      },
      orderBy: [{ createdAt: "asc" }, { sequenceNumber: "asc" }],
    });

    aheadCount = waitingSameService.filter((other) => {
      if (other.id === ticket.id) return false;
      if (config.priorityRatio >= 0 && other.priority !== ticket.priority) {
        return other.priority === QueuePriority.PRIORITY;
      }
      return (
        other.createdAt.getTime() < ticket.createdAt.getTime() ||
        (other.createdAt.getTime() === ticket.createdAt.getTime() &&
          other.sequenceNumber < ticket.sequenceNumber)
      );
    }).length;
  }

  const [openCapableCounters, nowServing] = await Promise.all([
    prisma.queueCounter.count({
      where: {
        campus: ticket.campus,
        isOpen: true,
        isPaused: false,
        OR: [
          { serviceCodes: { isEmpty: true } },
          { serviceCodes: { has: ticket.serviceCode } },
        ],
      },
    }),
    prisma.queueTicket.findFirst({
      where: {
        queueDate: ticket.queueDate,
        campus: ticket.campus,
        serviceId: ticket.serviceId,
        status: { in: [QueueTicketStatus.CALLED, QueueTicketStatus.SERVING] },
      },
      orderBy: { calledAt: "desc" },
      select: { ticketNumber: true },
    }),
  ]);

  const estimatedWaitMinutes =
    ticket.status === QueueTicketStatus.WAITING
      ? Math.ceil(
          ((aheadCount + 1) * ticket.service.estimatedMinutes) /
            Math.max(1, openCapableCounters)
        )
      : 0;

  return {
    ticketNumber: ticket.ticketNumber,
    publicLookupToken: ticket.publicLookupToken,
    queueDate: ticket.queueDate,
    campus: ticket.campus,
    serviceCode: ticket.serviceCode,
    serviceName: ticket.serviceName,
    priority: ticket.priority,
    status: ticket.status,
    counterName: ticket.counterName,
    aheadCount,
    estimatedWaitMinutes,
    nowServingTicketNumber: nowServing?.ticketNumber ?? null,
    recallCount: ticket.recallCount,
    calledAt: ticket.calledAt ? ticket.calledAt.toISOString() : null,
    servingStartedAt: ticket.servingStartedAt
      ? ticket.servingStartedAt.toISOString()
      : null,
    completedAt: ticket.completedAt ? ticket.completedAt.toISOString() : null,
    createdAt: ticket.createdAt.toISOString(),
  };
}

