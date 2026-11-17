import { KioskDisplayMode, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export interface DemoStaffAccountSpec {
  name: string;
  email: string;
  role: Role;
  windowName: string;
  laneSummary: string;
}

export const DEMO_QUEUE_STAFF: DemoStaffAccountSpec[] = [
  {
    name: "Elena Cruz (Staff 1)",
    email: "staff1@minsu.edu.ph",
    role: Role.STAFF,
    windowName: "Window 1",
    laneSummary: "TDP Application & Annex 2 (A)",
  },
  {
    name: "Marco Santos (Staff 2)",
    email: "staff2@minsu.edu.ph",
    role: Role.STAFF,
    windowName: "Window 2",
    laneSummary: "Payroll & Stipend Inquiry (P)",
  },
  {
    name: "Clarisse Reyes (Staff 3)",
    email: "staff3@minsu.edu.ph",
    role: Role.STAFF,
    windowName: "Window 3",
    laneSummary: "Verification (V) & General Assistance (G)",
  },
];

export const DEMO_QUEUE_SERVICES = [
  {
    code: "A",
    name: "TDP Application & Annex 2",
    description:
      "New scholarship inquiries, Annex 2 filing, and document submission",
    icon: "file-text",
    colorToken: "green",
    estimatedMinutes: 5,
    handledByRoles: [Role.STAFF],
    sortOrder: 1,
    assignedStaffEmail: "staff1@minsu.edu.ph",
  },
  {
    code: "P",
    name: "Payroll & Stipend Inquiry",
    description:
      "Grant release schedules, Annex 9 payroll check, and accounting concerns",
    icon: "wallet",
    colorToken: "gold",
    estimatedMinutes: 6,
    handledByRoles: [Role.ACCOUNTING, Role.STAFF],
    sortOrder: 2,
    assignedStaffEmail: "staff2@minsu.edu.ph",
  },
  {
    code: "V",
    name: "Verification & Certificate",
    description:
      "Enrollment validation, 3-way discrepancy resolution, and award certificates",
    icon: "shield-check",
    colorToken: "emerald",
    estimatedMinutes: 7,
    handledByRoles: [Role.STAFF, Role.DIRECTOR],
    sortOrder: 3,
    assignedStaffEmail: "staff3@minsu.edu.ph",
  },
  {
    code: "G",
    name: "General TDP Assistance",
    description:
      "Profile updates, tracking code assistance, and general inquiries",
    icon: "help-circle",
    colorToken: "slate",
    estimatedMinutes: 4,
    handledByRoles: [Role.STAFF, Role.ACCOUNTING, Role.DIRECTOR],
    sortOrder: 4,
    assignedStaffEmail: "staff3@minsu.edu.ph",
  },
] as const;

const CAMPUS_WINDOWS = [
  "Main Campus - Victoria",
  "Calapan City Campus",
  "Bongabong Campus",
] as const;

/**
 * Idempotently ensures QueueConfig, the 3 demo STAFF accounts (`staff1..3@minsu.edu.ph`),
 * service-lane staff routing, and campus windows (Windows 1-3) exist and are linked.
 * Safe to execute standalone without resetting existing student/document records.
 */
export async function seedDemoQueueConfigAndAssignments(
  prisma: PrismaClient,
  passwordHash: string
) {
  await prisma.queueConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      kioskMode: KioskDisplayMode.UNIFIED,
      defaultCampus: "Bongabong Campus",
      allowCampusSwitch: false,
      showHomepageKioskButton: true,
      showPrivacyMaskedNames: false,
      enableThermalPrint: true,
      autoPrintTicket: false,
      enableSoundChime: true,
      enableVoiceTts: true,
      priorityRatio: 2,
      idleResetSeconds: 20,
      attractModeSeconds: 60,
      rateLimitBypassEnabled: false,
    },
  });

  const staffByEmail = new Map<string, string>();
  for (const spec of DEMO_QUEUE_STAFF) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        name: spec.name,
        role: spec.role,
        active: true,
        passwordHash,
      },
      create: {
        name: spec.name,
        email: spec.email,
        role: spec.role,
        active: true,
        passwordHash,
      },
      select: { id: true, email: true },
    });
    staffByEmail.set(user.email, user.id);
  }

  for (const svc of DEMO_QUEUE_SERVICES) {
    const assignedId = staffByEmail.get(svc.assignedStaffEmail);
    await prisma.queueService.upsert({
      where: { code: svc.code },
      update: {
        name: svc.name,
        description: svc.description,
        icon: svc.icon,
        colorToken: svc.colorToken,
        estimatedMinutes: svc.estimatedMinutes,
        handledByRoles: [...svc.handledByRoles],
        sortOrder: svc.sortOrder,
        isActive: true,
        ...(assignedId ? { assignedStaff: { set: [{ id: assignedId }] } } : {}),
      },
      create: {
        code: svc.code,
        name: svc.name,
        description: svc.description,
        icon: svc.icon,
        colorToken: svc.colorToken,
        estimatedMinutes: svc.estimatedMinutes,
        handledByRoles: [...svc.handledByRoles],
        sortOrder: svc.sortOrder,
        isActive: true,
        ...(assignedId
          ? { assignedStaff: { connect: [{ id: assignedId }] } }
          : {}),
      },
    });
  }

  const windowSpecs = [
    {
      name: "Window 1",
      serviceCodes: ["A", "V", "G"],
      allowedRoles: [Role.STAFF, Role.DIRECTOR],
      sortOrder: 1,
      isOpen: true,
      assignedStaffId: staffByEmail.get("staff1@minsu.edu.ph") ?? null,
    },
    {
      name: "Window 2",
      serviceCodes: ["P", "G"],
      allowedRoles: [Role.ACCOUNTING, Role.STAFF],
      sortOrder: 2,
      isOpen: true,
      assignedStaffId: staffByEmail.get("staff2@minsu.edu.ph") ?? null,
    },
    {
      name: "Window 3",
      serviceCodes: ["V", "G", "A"],
      allowedRoles: [Role.DIRECTOR, Role.STAFF],
      sortOrder: 3,
      isOpen: true,
      assignedStaffId: staffByEmail.get("staff3@minsu.edu.ph") ?? null,
    },
  ];

  for (const campus of CAMPUS_WINDOWS) {
    for (const win of windowSpecs) {
      await prisma.queueCounter.upsert({
        where: { campus_name: { campus, name: win.name } },
        update: {
          serviceCodes: win.serviceCodes,
          allowedRoles: win.allowedRoles,
          sortOrder: win.sortOrder,
          isOpen: win.isOpen,
          assignedStaffId: win.assignedStaffId,
        },
        create: {
          name: win.name,
          campus,
          serviceCodes: win.serviceCodes,
          allowedRoles: win.allowedRoles,
          sortOrder: win.sortOrder,
          isOpen: win.isOpen,
          assignedStaffId: win.assignedStaffId,
        },
      });
    }
  }
}

async function runStandaloneDemoSeed() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash("Password@123", 10);
    await seedDemoQueueConfigAndAssignments(prisma, hash);
    console.log(
      "✔ Seeded 3 demo STAFF accounts (staff1@minsu.edu.ph, staff2@minsu.edu.ph, staff3@minsu.edu.ph) + Window/Service assignments (Password@123)."
    );
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("prisma/queue-demo-data.ts");

if (isDirectExecution) {
  runStandaloneDemoSeed().catch((err) => {
    console.error("Failed to seed demo queue staff:", err);
    process.exit(1);
  });
}

