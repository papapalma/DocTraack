import type { Role } from "@/types";

export type QueuePriority = "REGULAR" | "PRIORITY";

export type QueueTicketStatus =
  | "WAITING"
  | "CALLED"
  | "SERVING"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export type KioskDisplayMode = "UNIFIED" | "CHECK_IN_ONLY" | "DISPLAY_ONLY";

export interface QueueConfigPublicDTO {
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
  rateLimitBypassEnabled: boolean;
  hasPinConfigured: boolean;
  updatedAt: string;
}

export type QueueTicketAction =
  | "CALL_SPECIFIC"
  | "RECALL"
  | "START_SERVING"
  | "COMPLETE"
  | "NO_SHOW"
  | "CANCEL"
  | "TRANSFER";

export interface QueueOperatorDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface QueueServiceDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  campus: string | null;
  icon: string;
  colorToken: string;
  estimatedMinutes: number;
  handledByRoles: Role[];
  assignedStaff?: QueueOperatorDTO[];
  sortOrder: number;
  isActive: boolean;
  waitingCount?: number;
  estimatedWaitMinutes?: number;
}

export interface QueueCounterDTO {
  id: string;
  name: string;
  campus: string;
  serviceCodes: string[];
  allowedRoles: Role[];
  assignedStaffId: string | null;
  assignedStaffName?: string | null;
  assignedStaffEmail?: string | null;
  assignedStaffRole?: Role | null;
  currentTicketId: string | null;
  currentTicket?: PublicQueueTicketDTO | null;
  consecutivePriorityCount: number;
  isOpen: boolean;
  isPaused: boolean;
  sortOrder: number;
}

export interface PublicQueueTicketDTO {
  id: string;
  ticketNumber: string;
  sequenceNumber: number;
  queueDate: string;
  campus: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  priority: QueuePriority;
  status: QueueTicketStatus;
  maskedVisitorName: string | null;
  counterId: string | null;
  counterName: string | null;
  recallCount: number;
  calledAt: string | null;
  servingStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StaffQueueTicketDTO extends PublicQueueTicketDTO {
  priorityReason: string | null;
  visitorName: string | null;
  studentIdNo: string | null;
  trackingCodeRef: string | null;
  publicLookupToken: string;
  servedById: string | null;
  servedByName?: string | null;
  servedByEmail?: string | null;
  notes: string | null;
}

export interface IssuedTicketResponseDTO {
  ticket: PublicQueueTicketDTO;
  publicLookupToken: string;
  qrTrackerUrl: string;
  aheadCount: number;
  estimatedWaitMinutes: number;
  maskedVisitorName: string | null;
}

export interface MobileTicketTrackerDTO {
  ticketNumber: string;
  publicLookupToken: string;
  queueDate: string;
  campus: string;
  serviceCode: string;
  serviceName: string;
  priority: QueuePriority;
  status: QueueTicketStatus;
  counterName: string | null;
  aheadCount: number;
  estimatedWaitMinutes: number;
  nowServingTicketNumber: string | null;
  recallCount: number;
  calledAt: string | null;
  servingStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PublicAnnouncementTickerItem {
  id: string;
  title: string;
  category: string;
  isPinned: boolean;
}

export interface PublicKioskStatePayload {
  campus: string;
  queueDate: string;
  version: number;
  config: QueueConfigPublicDTO;
  services: QueueServiceDTO[];
  counters: QueueCounterDTO[];
  waitingTickets: PublicQueueTicketDTO[];
  recentlyCompleted: PublicQueueTicketDTO[];
  announcements: PublicAnnouncementTickerItem[];
  stats: {
    waitingTotal: number;
    priorityWaiting: number;
    regularWaiting: number;
    servedToday: number;
    openCounters: number;
  };
}

export interface QueueDashboardMetrics {
  waitingCount: number;
  activeServingCount: number;
  completedTodayCount: number;
  noShowTodayCount: number;
  cancelledTodayCount: number;
  priorityTodayCount: number;
  regularTodayCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  byService: Array<{
    code: string;
    name: string;
    waiting: number;
    completed: number;
  }>;
}

export interface StaffQueueDashboardPayload {
  campus: string;
  queueDate: string;
  version: number;
  config: QueueConfigPublicDTO;
  services: QueueServiceDTO[];
  counters: Array<
    Omit<QueueCounterDTO, "currentTicket"> & {
      currentTicket: StaffQueueTicketDTO | null;
    }
  >;
  operators: QueueOperatorDTO[];
  waitingTickets: StaffQueueTicketDTO[];
  activeTickets: StaffQueueTicketDTO[];
  recentTickets: StaffQueueTicketDTO[];
  metrics: QueueDashboardMetrics;
}

export type QueueEventType =
  | "ISSUE"
  | "CALL"
  | "RECALL"
  | "SERVE"
  | "COMPLETE"
  | "NO_SHOW"
  | "CANCEL"
  | "TRANSFER"
  | "COUNTER_UPDATE"
  | "SERVICE_UPDATE"
  | "CONFIG_UPDATE"
  | "RESET";

export interface QueueRealtimeEvent {
  type: QueueEventType;
  campus: string;
  queueDate: string;
  ticketNumber?: string;
  counterName?: string;
  recallTick?: number;
  version: number;
  timestamp: string;
}

