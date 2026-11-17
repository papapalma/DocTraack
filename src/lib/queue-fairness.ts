export interface QueueCandidate {
  id: string;
  priority: "REGULAR" | "PRIORITY";
  sequenceNumber: number;
  createdAt: Date | string;
}

export interface OperatorIdentityRef {
  id: string;
  name?: string | null;
  email?: string | null;
}

export type StaffAssignmentMatch =
  | "ASSIGNED_TO_USER"
  | "UNASSIGNED"
  | "ASSIGNED_TO_OTHER";

export type CounterOwnershipStatus =
  | "OWNED_BY_USER"
  | "UNASSIGNED"
  | "OWNED_BY_OTHER";

/**
 * Matches a designated operator by database ID or normalized email address so
 * staff designations resolve consistently across sessions and UI displays.
 */
export function matchesOperatorIdentity(
  assigned: {
    id?: string | null;
    email?: string | null;
  },
  userId?: string | null,
  userEmail?: string | null
): boolean {
  if (assigned.id && userId && assigned.id === userId) {
    return true;
  }
  const normalizedTarget = assigned.email?.trim().toLowerCase();
  const normalizedUser = userEmail?.trim().toLowerCase();
  return Boolean(normalizedTarget && normalizedUser && normalizedTarget === normalizedUser);
}

/**
 * Checks whether a window/counter has an Admin-designated operator.
 */
export function getCounterOwnership(
  counter: {
    assignedStaffId?: string | null;
    assignedStaffEmail?: string | null;
  },
  userId?: string | null,
  userEmail?: string | null
): CounterOwnershipStatus {
  if (!counter.assignedStaffId && !counter.assignedStaffEmail) {
    return "UNASSIGNED";
  }
  return matchesOperatorIdentity(
    { id: counter.assignedStaffId, email: counter.assignedStaffEmail },
    userId,
    userEmail
  )
    ? "OWNED_BY_USER"
    : "OWNED_BY_OTHER";
}

/**
 * Checks whether a service lane is designated to specific staff members.
 */
export function getServiceAssignmentStatus(
  assignedStaff: Array<{ id?: string | null; email?: string | null }> | undefined,
  userId?: string | null,
  userEmail?: string | null
): StaffAssignmentMatch {
  if (!assignedStaff || assignedStaff.length === 0) {
    return "UNASSIGNED";
  }
  return assignedStaff.some((staff) =>
    matchesOperatorIdentity(staff, userId, userEmail)
  )
    ? "ASSIGNED_TO_USER"
    : "ASSIGNED_TO_OTHER";
}

/**
 * Selects the next waiting ticket while honoring service-lane staff routing:
 * - Without takeover: considers tickets in lanes assigned to this staff OR unassigned lanes.
 * - With allowTakeover: includes tickets in lanes assigned to other staff if no own/unassigned match exists.
 */
export function selectRoutedWaitingTicket<
  T extends QueueCandidate & { serviceCode: string }
>(params: {
  waiting: T[];
  consecutivePriorityCount: number;
  priorityRatio?: number;
  serviceAssignmentsByCode: Map<
    string,
    Array<{ id?: string | null; email?: string | null }>
  >;
  userId?: string | null;
  userEmail?: string | null;
  allowTakeover?: boolean;
}): {
  selected: T | null;
  isTakeover: boolean;
  otherAssignedCount: number;
} {
  const {
    waiting,
    consecutivePriorityCount,
    priorityRatio = 2,
    serviceAssignmentsByCode,
    userId,
    userEmail,
    allowTakeover = false,
  } = params;

  const routablePool: T[] = [];
  const otherAssignedPool: T[] = [];

  for (const ticket of waiting) {
    const status = getServiceAssignmentStatus(
      serviceAssignmentsByCode.get(ticket.serviceCode),
      userId,
      userEmail
    );
    if (status === "ASSIGNED_TO_OTHER") {
      otherAssignedPool.push(ticket);
    } else {
      routablePool.push(ticket);
    }
  }

  const primaryPick = selectNextWaitingTicket(
    routablePool,
    consecutivePriorityCount,
    priorityRatio
  );
  if (primaryPick) {
    return {
      selected: primaryPick,
      isTakeover: false,
      otherAssignedCount: otherAssignedPool.length,
    };
  }

  if (allowTakeover && otherAssignedPool.length > 0) {
    return {
      selected: selectNextWaitingTicket(
        otherAssignedPool,
        consecutivePriorityCount,
        priorityRatio
      ),
      isTakeover: true,
      otherAssignedCount: otherAssignedPool.length,
    };
  }

  return {
    selected: null,
    isTakeover: false,
    otherAssignedCount: otherAssignedPool.length,
  };
}

export interface CounterEligibilityHint {
  isOpen: boolean;
  isPaused: boolean;
  currentTicketId: string | null;
  serviceCodes: string[];
  consecutivePriorityCount: number;
}

/**
 * Selects the next waiting ticket using weighted priority interleaving so
 * regular walk-ins never starve during heavy priority volume.
 * - priorityRatio > 0: max `priorityRatio` consecutive PRIORITY tickets before 1 REGULAR
 * - priorityRatio === 0: strict priority-first
 * - priorityRatio < 0: strict FIFO
 */
export function selectNextWaitingTicket<T extends QueueCandidate>(
  waiting: T[],
  consecutivePriorityCount: number,
  priorityRatio = 2
): T | null {
  if (waiting.length === 0) return null;

  const sortedByArrival = [...waiting].sort((a, b) => {
    const timeDiff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.sequenceNumber - b.sequenceNumber;
  });

  if (priorityRatio < 0) {
    return sortedByArrival[0] ?? null;
  }

  const nextPriority = sortedByArrival.find((t) => t.priority === "PRIORITY");
  const nextRegular = sortedByArrival.find((t) => t.priority === "REGULAR");

  if (priorityRatio === 0) {
    return nextPriority ?? nextRegular ?? null;
  }

  if (consecutivePriorityCount >= priorityRatio && nextRegular) {
    return nextRegular;
  }

  return nextPriority ?? nextRegular ?? null;
}

/**
 * Predicts the next waiting ticket likely to be called across active counters
 * for public lobby "Up Next" callouts using the same fairness rules.
 */
export function getNextUpTicketForCounters<
  T extends QueueCandidate & { serviceCode: string }
>(
  waiting: T[],
  counters: CounterEligibilityHint[],
  priorityRatio = 2
): T | null {
  if (waiting.length === 0) return null;

  const activeCounters = counters.filter((c) => c.isOpen && !c.isPaused);
  if (activeCounters.length === 0) {
    return selectNextWaitingTicket(waiting, 0, priorityRatio);
  }

  const idleCounters = activeCounters.filter((c) => !c.currentTicketId);
  const referenceCounters =
    idleCounters.length > 0 ? idleCounters : activeCounters;

  const acceptsAll = referenceCounters.some((c) => c.serviceCodes.length === 0);
  const acceptedCodes = new Set(
    referenceCounters.flatMap((c) => c.serviceCodes)
  );
  const eligible = acceptsAll
    ? waiting
    : waiting.filter((t) => acceptedCodes.has(t.serviceCode));

  const pool = eligible.length > 0 ? eligible : waiting;
  const minStreak = referenceCounters.reduce(
    (min, c) => Math.min(min, c.consecutivePriorityCount),
    referenceCounters[0]?.consecutivePriorityCount ?? 0
  );

  return selectNextWaitingTicket(pool, minStreak, priorityRatio);
}

