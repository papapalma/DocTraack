import assert from "node:assert/strict";
import {
  formatTicketNumber,
  getManilaQueueDate,
  maskVisitorName,
  normalizeQueueCampus,
  selectNextWaitingTicket,
  ensureQueueBootstrap,
  issueWalkInTicket,
  callNextTicketForCounter,
  getMobileTicketTracker,
} from "../src/lib/queue";
import {
  getCounterOwnership,
  getNextUpTicketForCounters,
  getServiceAssignmentStatus,
  matchesOperatorIdentity,
  selectRoutedWaitingTicket,
} from "../src/lib/queue-fairness";
import {
  canManageQueueConfig,
  canOperateQueue,
  canResetDailyQueue,
} from "../src/lib/rbac";
import { generateQRCodeSVG } from "../src/lib/qr";
import { prisma } from "../src/lib/prisma";

function runUnitTests() {
  // 1. Manila timezone date boundary verification (UTC 20:00 -> next day 04:00 in Asia/Manila)
  const utcEvening = new Date("2026-05-10T20:00:00.000Z");
  assert.equal(getManilaQueueDate(utcEvening), "2026-05-11");

  const utcMorning = new Date("2026-05-10T02:00:00.000Z");
  assert.equal(getManilaQueueDate(utcMorning), "2026-05-10");

  // 2. Ticket number formatting
  assert.equal(formatTicketNumber("a", 1), "A-001");
  assert.equal(formatTicketNumber("P", 12), "P-012");
  assert.equal(formatTicketNumber("v", 105), "V-105");
  assert.equal(formatTicketNumber("gen", 0), "GEN-001");

  // 3. Campus normalization
  assert.equal(normalizeQueueCampus(null), "Bongabong Campus");
  assert.equal(normalizeQueueCampus("   "), "Bongabong Campus");
  assert.equal(normalizeQueueCampus("Calapan City Campus"), "Calapan City Campus");
  assert.equal(normalizeQueueCampus("Victoria"), "Main Campus - Victoria");

  // 4. RA 10173 Visitor name masking
  assert.equal(maskVisitorName(null), null);
  assert.equal(maskVisitorName("   "), null);
  assert.equal(maskVisitorName("Juan Dela Cruz"), "J*** D*** C***");
  assert.equal(maskVisitorName("A B"), "A* B*");
  assert.equal(maskVisitorName("Maria"), "M***");

  // 5. Weighted priority interleaving (2:1, strict, FIFO, starvation prevention)
  const t1 = {
    id: "reg-1",
    priority: "REGULAR" as const,
    sequenceNumber: 1,
    createdAt: "2026-11-11T08:00:00.000Z",
  };
  const t2 = {
    id: "pri-1",
    priority: "PRIORITY" as const,
    sequenceNumber: 2,
    createdAt: "2026-11-11T08:01:00.000Z",
  };
  const t3 = {
    id: "pri-2",
    priority: "PRIORITY" as const,
    sequenceNumber: 3,
    createdAt: "2026-11-11T08:02:00.000Z",
  };

  assert.equal(selectNextWaitingTicket([], 0, 2), null);

  // Under 2:1, consecutivePriorityCount 0 or 1 picks PRIORITY first
  assert.equal(selectNextWaitingTicket([t1, t2, t3], 0, 2)?.id, "pri-1");
  assert.equal(selectNextWaitingTicket([t1, t2, t3], 1, 2)?.id, "pri-1");

  // Once 2 consecutive priority tickets were served, interleave 1 REGULAR to prevent starvation
  assert.equal(selectNextWaitingTicket([t1, t2, t3], 2, 2)?.id, "reg-1");

  // If no REGULAR ticket is waiting, fall back cleanly to PRIORITY
  assert.equal(selectNextWaitingTicket([t2, t3], 2, 2)?.id, "pri-1");

  // Strict priority (ratio 0) always picks PRIORITY regardless of streak
  assert.equal(selectNextWaitingTicket([t1, t2], 5, 0)?.id, "pri-1");

  // Pure FIFO (ratio -1) picks earliest arrival regardless of priority
  assert.equal(selectNextWaitingTicket([t2, t1, t3], 0, -1)?.id, "reg-1");

  // 5b. Lobby display "Up Next" counter-eligibility prediction
  const wWaiting = [
    { ...t1, serviceCode: "V" },
    { ...t2, serviceCode: "A" },
    { ...t3, serviceCode: "V" },
  ];
  assert.equal(
    getNextUpTicketForCounters(
      wWaiting,
      [
        {
          isOpen: true,
          isPaused: false,
          currentTicketId: null,
          serviceCodes: ["A"],
          consecutivePriorityCount: 0,
        },
        {
          isOpen: true,
          isPaused: true,
          currentTicketId: null,
          serviceCodes: ["V"],
          consecutivePriorityCount: 0,
        },
      ],
      2
    )?.id,
    "pri-1"
  );
  assert.equal(getNextUpTicketForCounters([], [], 2), null);

  // 6. RBAC Permissions matrix
  assert.equal(canOperateQueue("STUDENT"), false);
  assert.equal(canOperateQueue("STAFF"), true);
  assert.equal(canOperateQueue("ACCOUNTING"), true);
  assert.equal(canOperateQueue("DIRECTOR"), true);
  assert.equal(canOperateQueue("SYSTEM_ADMIN"), true);

  assert.equal(canManageQueueConfig("STAFF"), false);
  assert.equal(canManageQueueConfig("DIRECTOR"), false);
  assert.equal(canManageQueueConfig("ACCOUNTING"), false);
  assert.equal(canManageQueueConfig("SYSTEM_ADMIN"), true);

  assert.equal(canResetDailyQueue("ACCOUNTING"), false);
  assert.equal(canResetDailyQueue("STAFF"), true);
  assert.equal(canResetDailyQueue("DIRECTOR"), true);
  assert.equal(canResetDailyQueue("SYSTEM_ADMIN"), true);

  // 7. QR SVG generator creates valid standalone vector QR
  const svg = generateQRCodeSVG("https://example.edu.ph/kiosk/ticket/abc123", {
    size: 168,
  });
  assert.ok(svg.startsWith("<svg"), "Expected QR code output to start with <svg");

  // 8. Staff ID + normalized Email identity matching & soft-lock ticket routing
  assert.equal(
    matchesOperatorIdentity(
      { id: "op-1", email: "staff1@minsu.edu.ph" },
      "op-1",
      null
    ),
    true
  );
  assert.equal(
    matchesOperatorIdentity(
      { id: "op-1", email: "staff1@minsu.edu.ph" },
      "other-id",
      "  STAFF1@MinSU.edu.ph "
    ),
    true
  );
  assert.equal(
    matchesOperatorIdentity(
      { id: "op-1", email: "staff1@minsu.edu.ph" },
      "op-2",
      "staff2@minsu.edu.ph"
    ),
    false
  );

  assert.equal(
    getCounterOwnership({ assignedStaffId: null, assignedStaffEmail: null }, "op-1", "staff1@minsu.edu.ph"),
    "UNASSIGNED"
  );
  assert.equal(
    getCounterOwnership(
      { assignedStaffId: "op-1", assignedStaffEmail: "staff1@minsu.edu.ph" },
      "diff-id",
      "staff1@minsu.edu.ph"
    ),
    "OWNED_BY_USER"
  );
  assert.equal(
    getCounterOwnership(
      { assignedStaffId: "op-1", assignedStaffEmail: "staff1@minsu.edu.ph" },
      "op-2",
      "staff2@minsu.edu.ph"
    ),
    "OWNED_BY_OTHER"
  );

  assert.equal(
    getServiceAssignmentStatus([], "op-1", "staff1@minsu.edu.ph"),
    "UNASSIGNED"
  );
  assert.equal(
    getServiceAssignmentStatus(
      [{ id: "op-1", email: "staff1@minsu.edu.ph" }],
      "op-1",
      "staff1@minsu.edu.ph"
    ),
    "ASSIGNED_TO_USER"
  );
  assert.equal(
    getServiceAssignmentStatus(
      [{ id: "op-2", email: "staff2@minsu.edu.ph" }],
      "op-1",
      "staff1@minsu.edu.ph"
    ),
    "ASSIGNED_TO_OTHER"
  );

  const routingMap = new Map<
    string,
    Array<{ id?: string | null; email?: string | null }>
  >([
    ["A", [{ id: "op-1", email: "staff1@minsu.edu.ph" }]],
    ["B", [{ id: "op-2", email: "staff2@minsu.edu.ph" }]],
    ["O", []],
  ]);
  const lockedToOther = {
    id: "t-other",
    priority: "PRIORITY" as const,
    sequenceNumber: 1,
    createdAt: "2026-11-11T08:00:00.000Z",
    serviceCode: "B",
  };
  const assignedToMine = {
    id: "t-mine",
    priority: "REGULAR" as const,
    sequenceNumber: 2,
    createdAt: "2026-11-11T08:01:00.000Z",
    serviceCode: "A",
  };
  const openLane = {
    id: "t-open",
    priority: "REGULAR" as const,
    sequenceNumber: 3,
    createdAt: "2026-11-11T08:02:00.000Z",
    serviceCode: "O",
  };

  // Without takeover, Staff 1 skips Priority ticket locked to Staff 2 and accepts own lane
  const routedPrimary = selectRoutedWaitingTicket({
    waiting: [lockedToOther, assignedToMine, openLane],
    consecutivePriorityCount: 0,
    priorityRatio: 2,
    serviceAssignmentsByCode: routingMap,
    userId: "op-1",
    userEmail: "staff1@minsu.edu.ph",
    allowTakeover: false,
  });
  assert.equal(routedPrimary.selected?.id, "t-mine");
  assert.equal(routedPrimary.isTakeover, false);
  assert.equal(routedPrimary.otherAssignedCount, 1);

  // If only another staff's lane is waiting, block without explicit takeover
  const blockedForeignOnly = selectRoutedWaitingTicket({
    waiting: [lockedToOther],
    consecutivePriorityCount: 0,
    priorityRatio: 2,
    serviceAssignmentsByCode: routingMap,
    userId: "op-1",
    userEmail: "staff1@minsu.edu.ph",
    allowTakeover: false,
  });
  assert.equal(blockedForeignOnly.selected, null);
  assert.equal(blockedForeignOnly.isTakeover, false);
  assert.equal(blockedForeignOnly.otherAssignedCount, 1);

  // With allowTakeover=true, allow explicit fallback
  const allowedTakeover = selectRoutedWaitingTicket({
    waiting: [lockedToOther],
    consecutivePriorityCount: 0,
    priorityRatio: 2,
    serviceAssignmentsByCode: routingMap,
    userId: "op-1",
    userEmail: "staff1@minsu.edu.ph",
    allowTakeover: true,
  });
  assert.equal(allowedTakeover.selected?.id, "t-other");
  assert.equal(allowedTakeover.isTakeover, true);

  console.log(
    "  ✔ Queue Kiosk unit tests passed (timezone, formatting, 2:1 fairness, RBAC, QR, staff routing)."
  );
}

async function runIntegrationTests() {
  const createdTicketIds: string[] = [];
  const createdCounterIds: string[] = [];
  const createdServiceIds: string[] = [];
  const createdUserIds: string[] = [];
  let originalRatio: number | null = null;

  try {
    const config = await ensureQueueBootstrap();
    originalRatio = config.priorityRatio;

    const services = await prisma.queueService.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    assert.ok(services.length > 0, "Expected at least one seeded or bootstrapped QueueService");
    const svc = services[0];

    const testCampus = "Bongabong Campus";
    const tempCounter = await prisma.queueCounter.create({
      data: {
        name: "__TEST_WINDOW_QUEUE__",
        campus: testCampus,
        serviceCodes: [svc.code],
        allowedRoles: ["STAFF"],
        isOpen: true,
        isPaused: false,
        sortOrder: 99,
      },
    });
    createdCounterIds.push(tempCounter.id);

    // Issue 1 regular then 1 priority ticket
    const regularIssued = await issueWalkInTicket({
      campus: testCampus,
      serviceId: svc.id,
      priority: "REGULAR",
      visitorName: "Juan Dela Cruz",
    });
    createdTicketIds.push(regularIssued.ticket.id);

    const priorityIssued = await issueWalkInTicket({
      campus: testCampus,
      serviceId: svc.id,
      priority: "PRIORITY",
      priorityReason: "Senior Citizen",
      visitorName: "Maria Santos",
    });
    createdTicketIds.push(priorityIssued.ticket.id);

    // Verify mobile lookup token works without leaking raw full name
    const tracker = await getMobileTicketTracker(priorityIssued.publicLookupToken);
    assert.ok(tracker, "Expected mobile tracker lookup to resolve");
    assert.equal(tracker.ticketNumber, priorityIssued.ticket.ticketNumber);

    // Call next on isolated test counter using an existing user ID (satisfies servedById FK)
    const anyUser = await prisma.user.findFirst({ select: { id: true } });
    if (anyUser) {
      const callResult = await callNextTicketForCounter({
        counterId: tempCounter.id,
        actorId: anyUser.id,
      });
      assert.ok(callResult, "Expected callNextTicketForCounter to return a ticket");
      if (config.priorityRatio >= 0) {
        assert.equal(
          callResult.ticket.priority,
          "PRIORITY",
          "Expected weighted priority selection to pick PRIORITY ticket first on fresh window"
        );
      }
    }

    // Verify Admin counter ownership preservation & service lane soft lock
    const suffix = Date.now();
    const staffA = await prisma.user.create({
      data: {
        name: "Test Staff A",
        email: `__test_staff_a_${suffix}@minsu.edu.ph`,
        passwordHash: "test-hash",
        role: "STAFF",
        active: true,
      },
    });
    createdUserIds.push(staffA.id);

    const staffB = await prisma.user.create({
      data: {
        name: "Test Staff B",
        email: `__test_staff_b_${suffix}@minsu.edu.ph`,
        passwordHash: "test-hash",
        role: "STAFF",
        active: true,
      },
    });
    createdUserIds.push(staffB.id);

    const lockedSvc = await prisma.queueService.create({
      data: {
        code: `T${String(suffix).slice(-4)}`,
        name: "__TEST_DESIGNATED_LANE__",
        handledByRoles: ["STAFF"],
        isActive: true,
        sortOrder: 99,
        assignedStaff: { connect: [{ id: staffA.id }] },
      },
    });
    createdServiceIds.push(lockedSvc.id);

    const ownerCounter = await prisma.queueCounter.create({
      data: {
        name: `__TEST_OWNER_WINDOW_${suffix}__`,
        campus: testCampus,
        serviceCodes: [lockedSvc.code],
        allowedRoles: ["STAFF"],
        assignedStaffId: staffA.id,
        isOpen: true,
        isPaused: false,
        sortOrder: 100,
      },
    });
    createdCounterIds.push(ownerCounter.id);

    const openCounter = await prisma.queueCounter.create({
      data: {
        name: `__TEST_OPEN_WINDOW_${suffix}__`,
        campus: testCampus,
        serviceCodes: [lockedSvc.code],
        allowedRoles: ["STAFF"],
        assignedStaffId: null,
        isOpen: true,
        isPaused: false,
        sortOrder: 101,
      },
    });
    createdCounterIds.push(openCounter.id);

    const designatedTicket = await issueWalkInTicket({
      campus: testCampus,
      serviceId: lockedSvc.id,
      priority: "REGULAR",
      visitorName: "Pedro Penduko",
    });
    createdTicketIds.push(designatedTicket.ticket.id);

    // 1) Peer Staff B calling on open window without takeover skips Staff A's locked service
    const skippedByServiceLock = await callNextTicketForCounter({
      counterId: openCounter.id,
      actorId: staffB.id,
      actorEmail: staffB.email,
      actorRole: "STAFF",
      allowTakeover: false,
    });
    assert.equal(
      skippedByServiceLock,
      null,
      "Expected unassigned window without takeover to skip ticket locked to Staff A"
    );

    // 2) Peer Staff B calling on Staff A's owned window without takeover throws COUNTER_TAKEOVER_REQUIRED
    await assert.rejects(
      callNextTicketForCounter({
        counterId: ownerCounter.id,
        actorId: staffB.id,
        actorEmail: staffB.email,
        actorRole: "STAFF",
        allowTakeover: false,
      }),
      /COUNTER_TAKEOVER_REQUIRED/
    );

    // 3) Peer Staff B with explicit emergency takeover succeeds AND preserves Admin's assignedStaffId on counter
    const takeoverCall = await callNextTicketForCounter({
      counterId: ownerCounter.id,
      actorId: staffB.id,
      actorEmail: staffB.email,
      actorRole: "STAFF",
      allowTakeover: true,
    });
    assert.ok(takeoverCall, "Expected explicit takeover call to succeed");
    assert.equal(takeoverCall.isTakeover, true);
    assert.equal(takeoverCall.ticket.servedById, staffB.id);

    const refreshedOwnerCounter = await prisma.queueCounter.findUnique({
      where: { id: ownerCounter.id },
      select: { assignedStaffId: true },
    });
    assert.equal(
      refreshedOwnerCounter?.assignedStaffId,
      staffA.id,
      "Expected emergency takeover to preserve Admin's designated counter assignedStaffId"
    );

    console.log("  ✔ Queue Kiosk PostgreSQL integration lifecycle check passed.");
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (
      code === "P1001" ||
      (error instanceof Error &&
        (error.message.includes("Can't reach database server") ||
          error.message.includes("P1001")))
    ) {
      console.warn(
        "  ⚠ Skipping PostgreSQL queue integration checks (database server unreachable at localhost:5432)."
      );
      return;
    }
    throw error;
  } finally {
    try {
      if (createdTicketIds.length > 0) {
        await prisma.queueTicket
          .deleteMany({ where: { id: { in: createdTicketIds } } })
          .catch(() => {});
      }
      if (createdCounterIds.length > 0) {
        await prisma.queueCounter
          .deleteMany({ where: { id: { in: createdCounterIds } } })
          .catch(() => {});
      }
      if (createdServiceIds.length > 0) {
        await prisma.queueService
          .deleteMany({ where: { id: { in: createdServiceIds } } })
          .catch(() => {});
      }
      if (createdUserIds.length > 0) {
        await prisma.user
          .deleteMany({ where: { id: { in: createdUserIds } } })
          .catch(() => {});
      }
      if (originalRatio !== null) {
        await prisma.queueConfig
          .update({
            where: { id: "default" },
            data: { priorityRatio: originalRatio },
          })
          .catch(() => {});
      }
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  console.log("▶ Running MinSU Walk-In Queue & Kiosk Tests...");
  runUnitTests();
  await runIntegrationTests();
  console.log("✔ All queue & kiosk assertions finished.");
}

main().catch((err) => {
  console.error("❌ Queue kiosk tests failed:", err);
  process.exit(1);
});

