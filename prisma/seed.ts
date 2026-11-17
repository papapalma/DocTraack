import { PrismaClient, Role, ApplicationStatus, AnnexPresetKind } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { buildDefaultPreset1Config, PRESET_SUPPORTED_ANNEX_NUMBERS } from "../src/lib/annex-presets";
import { seedDemoQueueConfigAndAssignments } from "./queue-demo-data";

const prisma = new PrismaClient();

// Deterministic mock datasets for realistic MinSU student generation
const FIRST_NAMES_MALE = [
  "Juan", "Jose", "Mark", "John Paul", "Joshua", "Christian", "Angelo", "Gabriel",
  "Daniel", "Paolo", "Rafael", "Miguel", "Ethan", "Matthew", "Carlo", "Jeric",
  "Arvin", "Kevin", "Kenneth", "Dominic", "Aldrin", "Reynaldo", "Jonathan",
  "Emmanuel", "Anthony", "Vincent", "Francis", "Ronald", "Marvin", "Bryan",
  "Patrick", "Neil", "Lester", "Dexter", "Justin", "Alfonso", "Carl", "Diego",
  "Edgardo", "Fernando", "Gerard", "Harold", "Ian", "Jerome", "Kyle", "Lance",
  "Marco", "Nathan", "Oliver", "Paul", "Quentin", "Renz", "Simon", "Tristan"
];

const FIRST_NAMES_FEMALE = [
  "Maria", "Angelica", "Christine", "Nicole", "Bea", "Camille", "Patricia", "Princess",
  "Jasmine", "Joy", "Grace", "Dianne", "Alyssa", "Kathleen", "Rochelle", "Stephanie",
  "Kimberly", "Clarisse", "Hannah", "Samantha", "Katrina", "Angela", "Michelle",
  "Andrea", "Kristine", "Danica", "Rachelle", "Joanna", "Erika", "Bernadette",
  "Abigail", "Mary Rose", "Charisse", "Lovely", "Vanessa", "Angel", "Bianca",
  "Celine", "Denise", "Elena", "Faith", "Giselle", "Hazel", "Irene", "Judy",
  "Karen", "Lorraine", "Mariel", "Nina", "Paula", "Queenie", "Rhea", "Sheryl", "Trisha"
];

const LAST_NAMES = [
  "Dela Cruz", "Santos", "Garcia", "Reyes", "Ramos", "Mendoza", "Flores", "Morales",
  "Palma", "Aquino", "Castro", "Bautista", "Villanueva", "Fernandez", "Cruz", "Lopez",
  "Perez", "Sanchez", "Ramirez", "Torres", "Navarro", "Diaz", "Castillo", "Tolentino",
  "Mercado", "Gutierrez", "Delos Santos", "Soriano", "Salvador", "Domingo", "Valenzuela",
  "Hernandez", "Pascual", "Santiago", "Manalo", "Agustin", "Alcantara", "Balagtas",
  "Corpuz", "David", "Espiritu", "Fajardo", "Gonzales", "Ignacio", "Jimenez", "Lim",
  "Marquez", "Ocampo", "Padilla", "Quizon", "Rosario", "Tan", "Umali", "Zamora"
];

const MIDDLE_NAMES = [
  "Panganiban", "Alcantara", "Manalo", "Dimatulac", "Macatangay", "Hernandez",
  "Buenviaje", "Katigbak", "Malabanan", "Tolentino", "Recto", "Laurel", "Guico",
  "Carandang", "Atienza", "Berberabe", "Chavez", "Perez", "Mercado", "Silva",
  "Bautista", "Castillo", "Dizon", "Enriquez", "Guanzon", "Ilagan", "Javier", "Laxamana"
];

const CAMPUS_CONFIGS = [
  {
    campusName: "Main Campus (Victoria / Alcate)",
    campusKey: "Main Campus (Alcate)",
    idSuffix: "MC",
    batches: [
      { batchNumber: 1, studentCount: 35 },
      { batchNumber: 2, studentCount: 350 },
      { batchNumber: 3, studentCount: 1000 },
    ],
    programs: [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Agriculture",
      "Bachelor of Science in Agricultural and Biosystems Engineering",
      "Bachelor of Science in Animal Science",
      "Bachelor of Science in Forestry",
      "Bachelor of Science in Environmental Science",
    ],
    towns: [
      { town: "Victoria", zip: "5205" },
      { town: "Naujan", zip: "5204" },
      { town: "Socorro", zip: "5207" },
      { town: "Pola", zip: "5206" },
    ],
  },
  {
    campusName: "Calapan City Campus",
    campusKey: "Calapan City Campus",
    idSuffix: "CC",
    batches: [
      { batchNumber: 4, studentCount: 35 },
      { batchNumber: 5, studentCount: 350 },
      { batchNumber: 6, studentCount: 1000 },
    ],
    programs: [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Criminology",
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education",
      "Bachelor of Science in Hospitality Management",
      "Bachelor of Science in Tourism Management",
    ],
    towns: [
      { town: "Calapan City", zip: "5200" },
      { town: "Baco", zip: "5201" },
      { town: "San Teodoro", zip: "5202" },
      { town: "Puerto Galera", zip: "5203" },
      { town: "Naujan", zip: "5204" },
    ],
  },
  {
    campusName: "Bongabong Campus",
    campusKey: "Bongabong Campus",
    idSuffix: "BC",
    batches: [
      { batchNumber: 7, studentCount: 35 },
      { batchNumber: 8, studentCount: 350 },
      { batchNumber: 9, studentCount: 1000 },
    ],
    programs: [
      "Bachelor of Science in Fisheries",
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Criminology",
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education",
      "Bachelor of Science in Agriculture",
    ],
    towns: [
      { town: "Bongabong", zip: "5211" },
      { town: "Pinamalayan", zip: "5208" },
      { town: "Gloria", zip: "5209" },
      { town: "Bansud", zip: "5210" },
      { town: "Roxas", zip: "5212" },
      { town: "Mansalay", zip: "5213" },
      { town: "Bulalacao", zip: "5214" },
    ],
  },
];

const BARANGAYS = [
  "Poblacion", "Bagong Silang", "San Vicente", "Maligaya", "Mabini",
  "San Isidro", "Santa Maria", "Santo Niño", "San Roque", "Concepcion",
  "Lumangbayan", "Bayanan", "Ilaya", "Ibaba", "Aplaya", "Bukid"
];

const GWA_LIST = ["1.25", "1.40", "1.50", "1.65", "1.75", "1.85", "2.00", "2.15", "2.25"];
const INCOMES = [8500, 10000, 12000, 14500, 16000, 18500, 20000, 22500, 24000];

async function main() {
  console.log("===============================================================================");
  console.log("MinSU DocTrack: Database Refresh & 9-Batch Multi-Campus Seeding Pipeline");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: CLEAN REFRESH - TEARDOWN ALL HISTORICAL APPLICATION DATA
  // ---------------------------------------------------------------------------
  console.log("▶ [Step 1/5] Performing clean database refresh (teardown)...");

  await prisma.queueTicketEvent.deleteMany({});
  await prisma.queueTicket.deleteMany({});
  await prisma.queueCounter.deleteMany({});
  await prisma.queueService.deleteMany({});
  await prisma.queueConfig.deleteMany({});
  await prisma.verificationResult.deleteMany({});
  await prisma.verificationRun.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.statusHistory.deleteMany({});
  await prisma.transmittal.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.annexPreset.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.applicantCall.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("  ✔ All existing application, verification, document, and user records purged.\n");

  // ---------------------------------------------------------------------------
  // STEP 2: SEED CORE ADMINISTRATIVE USERS
  // ---------------------------------------------------------------------------
  console.log("▶ [Step 2/5] Seeding core administrative accounts...");

  // Pre-compute single bcrypt hash for performance
  const defaultPasswordHash = await bcrypt.hash("Password@123", 10);

  const coreUsers = [
    {
      name: "System Administrator",
      email: "admin@minsu.edu.ph",
      passwordHash: defaultPasswordHash,
      role: Role.SYSTEM_ADMIN,
    },
    {
      name: "Campus Director",
      email: "director@minsu.edu.ph",
      passwordHash: defaultPasswordHash,
      role: Role.DIRECTOR,
    },
    {
      name: "TDP Staff Coordinator",
      email: "staff@minsu.edu.ph",
      passwordHash: defaultPasswordHash,
      role: Role.STAFF,
    },
    {
      name: "Accounting Officer",
      email: "accounting@minsu.edu.ph",
      passwordHash: defaultPasswordHash,
      role: Role.ACCOUNTING,
    },
  ];

  for (const u of coreUsers) {
    await prisma.user.create({ data: u });
  }

  const staffUser = await prisma.user.findUnique({ where: { email: "staff@minsu.edu.ph" } });
  if (!staffUser) throw new Error("Staff coordinator user creation failed");

  console.log("  ✔ 4 core administrative users seeded successfully.\n");

  // ---------------------------------------------------------------------------
  // STEP 3: SEED ANNEX TYPES 1-10 DEFINITIONS
  // ---------------------------------------------------------------------------
  console.log("▶ [Step 3/5] Seeding Annex Types 1 to 10 schemas...");

  const annexes = [
    {
      number: 1,
      name: "Submission to Agency",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "target_agency", label: "Concerned Government Agency", type: "text", required: true, placeholder: "e.g., CHED / UniFAST Regional Office" },
          { id: "academic_year", label: "Academic Year & Semester", type: "text", required: true, placeholder: "e.g., A.Y. 2026-2027, 1st Semester" },
          { id: "transmittal_number", label: "Transmittal Reference No.", type: "text", required: true, placeholder: "e.g., MINSU-TDP-2026-001" },
          { id: "submission_date", label: "Date of Submission", type: "date", required: true },
          { id: "total_grant_amount", label: "Total Grant Amount (PHP)", type: "number", required: true, placeholder: "0.00" },
          { id: "remarks", label: "Cover Letter & Remarks", type: "textarea", placeholder: "Details regarding the batch submission..." },
        ],
      },
    },
    {
      number: 2,
      name: "Call for Applicants",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "call_title", label: "Call Title", type: "text", required: true, placeholder: "e.g., Call for TDP Applicants A.Y. 2026-2027" },
          { id: "target_campus", label: "Eligible Campus", type: "select", required: true, options: ["All Campuses", "Main Campus (Alcate)", "Calapan City Campus", "Bongabong Campus"] },
          { id: "deadline_date", label: "Application Deadline", type: "date", required: true },
          { id: "allotted_slots", label: "Allotted Grantee Slots", type: "number", required: true, placeholder: "50" },
          { id: "guidelines", label: "Qualification Guidelines & Requirements", type: "textarea", required: true, placeholder: "Stipulate eligibility and required documents..." },
        ],
      },
    },
    {
      number: 3,
      name: "Continuing Billing",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "academic_period", label: "Academic Period", type: "text", required: true, placeholder: "e.g., 1st Sem, A.Y. 2026-2027" },
          { id: "total_continuing_students", label: "Total Continuing Grantees", type: "number", required: true, placeholder: "100" },
          { id: "amount_per_grantee", label: "Stipend Amount Per Grantee (PHP)", type: "number", required: true, placeholder: "7500" },
          { id: "total_billing_amount", label: "Total Billing Request (PHP)", type: "number", required: true, placeholder: "750000" },
          { id: "notes", label: "Special Endorsement Notes", type: "textarea" },
        ],
      },
    },
    {
      number: 4,
      name: "New Billing",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "academic_period", label: "Academic Period", type: "text", required: true, placeholder: "e.g., 1st Sem, A.Y. 2026-2027" },
          { id: "total_new_students", label: "Total New Qualified Grantees", type: "number", required: true, placeholder: "50" },
          { id: "stipend_amount", label: "Stipend Amount Per Student (PHP)", type: "number", required: true, placeholder: "7500" },
          { id: "total_billing_amount", label: "Total New Billing Request (PHP)", type: "number", required: true, placeholder: "375000" },
          { id: "notes", label: "Verification Certification Notes", type: "textarea" },
        ],
      },
    },
    {
      number: 5,
      name: "Certificate of Qualified",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "certification_title", label: "Certification Title", type: "text", required: true, placeholder: "Masterlist of Qualified TDP Grantees" },
          { id: "school_year", label: "School Year & Term", type: "text", required: true, placeholder: "A.Y. 2026-2027" },
          { id: "certified_count", label: "Number of Verified Grantees", type: "number", required: true, placeholder: "150" },
          { id: "certifying_officer", label: "Certifying Staff / Coordinator", type: "text", required: true, placeholder: "Full Name of TDP Coordinator" },
          { id: "findings_summary", label: "Summary of Eligibility Review", type: "textarea", required: true },
        ],
      },
    },
    {
      number: 6,
      name: "Certificate of Fund Utilization",
      creatorRoles: [Role.STAFF, Role.ACCOUNTING],
      formSchema: {
        fields: [
          { id: "fund_source", label: "Fund Source / Cheque Number", type: "text", required: true, placeholder: "CHED-UniFAST Sub-allotment" },
          { id: "total_fund_received", label: "Total Funds Received (PHP)", type: "number", required: true, placeholder: "1000000" },
          { id: "total_fund_disbursed", label: "Total Funds Disbursed (PHP)", type: "number", required: true, placeholder: "980000" },
          { id: "unutilized_balance", label: "Unutilized Balance (PHP)", type: "number", required: true, placeholder: "20000" },
          { id: "utilization_rate", label: "Utilization Rate (%)", type: "number", required: true, placeholder: "98.0" },
          { id: "accounting_remarks", label: "Accounting Findings & Explanations", type: "textarea" },
        ],
      },
    },
    {
      number: 7,
      name: "Report of Advance to Debit",
      creatorRoles: [Role.STAFF, Role.ACCOUNTING],
      formSchema: {
        fields: [
          { id: "debit_advice_number", label: "Debit Advice Reference No.", type: "text", required: true, placeholder: "ADA-2026-003" },
          { id: "bank_name", label: "Servicing Bank & Branch", type: "text", required: true, placeholder: "Landbank of the Philippines - Calapan" },
          { id: "debit_amount", label: "Total Debit Amount (PHP)", type: "number", required: true, placeholder: "500000" },
          { id: "debit_date", label: "Execution Date", type: "date", required: true },
          { id: "purpose", label: "Purpose / Allocation Description", type: "textarea", required: true },
        ],
      },
    },
    {
      number: 8,
      name: "Report of Check Issued",
      creatorRoles: [Role.STAFF, Role.ACCOUNTING],
      formSchema: {
        fields: [
          { id: "rcik_period", label: "Report Period", type: "text", required: true, placeholder: "For the month of October 2026" },
          { id: "bank_account_no", label: "MDS / Bank Account Number", type: "text", required: true, placeholder: "LBP Acct # 1234-5678-90" },
          { id: "check_series_start", label: "Check Series Start #", type: "text", required: true, placeholder: "0001001" },
          { id: "check_series_end", label: "Check Series End #", type: "text", required: true, placeholder: "0001150" },
          { id: "total_amount_issued", label: "Total Amount of Checks Issued (PHP)", type: "number", required: true, placeholder: "750000" },
          { id: "summary", label: "Disbursement Narrative Summary", type: "textarea" },
        ],
      },
    },
    {
      number: 9,
      name: "Payroll",
      creatorRoles: [Role.STAFF, Role.ACCOUNTING],
      formSchema: {
        fields: [
          { id: "payroll_title", label: "Payroll Title", type: "text", required: true, placeholder: "TDP Stipend Payroll - Calapan Campus" },
          { id: "payroll_period", label: "Coverage Period", type: "text", required: true, placeholder: "1st Semester A.Y. 2026-2027" },
          { id: "total_beneficiaries", label: "Total Student Beneficiaries", type: "number", required: true, placeholder: "120" },
          { id: "net_payroll_amount", label: "Net Payroll Total (PHP)", type: "number", required: true, placeholder: "900000" },
          { id: "disbursing_officer", label: "Designated Special Disbursing Officer", type: "text", required: true },
          { id: "remarks", label: "Payroll Annotations", type: "textarea" },
        ],
      },
    },
    {
      number: 10,
      name: "TDP Notice of Awards",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "award_batch", label: "NOA Batch Number", type: "text", required: true, placeholder: "NOA-BATCH-2026-A" },
          { id: "academic_year", label: "Academic Year", type: "text", required: true, placeholder: "A.Y. 2026-2027" },
          { id: "recipients_count", label: "Number of Awardees", type: "number", required: true, placeholder: "60" },
          { id: "award_date", label: "Notice Date", type: "date", required: true },
          { id: "conditions", label: "Terms, Retention Requirements & Conditions", type: "textarea", required: true },
        ],
      },
    },
  ];

  for (const a of annexes) {
    const upsertedAnnex = await prisma.annexType.upsert({
      where: { number: a.number },
      update: { name: a.name, creatorRoles: a.creatorRoles, formSchema: a.formSchema },
      create: a,
    });

    if ((PRESET_SUPPORTED_ANNEX_NUMBERS as readonly number[]).includes(a.number)) {
      await prisma.annexPreset.create({
        data: {
          annexTypeId: upsertedAnnex.id,
          name: `Preset 1 — Official Annex ${a.number} Standard`,
          description: `Built-in official CHED/UniFAST ${a.name} template and interactive workspace.`,
          kind: AnnexPresetKind.BUILT_IN,
          isDefault: true,
          isActive: true,
          sortOrder: 1,
          config: buildDefaultPreset1Config(a.number) as any,
          createdById: staffUser.id,
          updatedById: staffUser.id,
        },
      });
    }
  }

  // Seed Landing Page Configuration
  const defaultLandingSections = [
    {
      id: "sec-hero-1",
      type: "HERO",
      title: "Keynote Hero Section",
      enabled: true,
      content: {
        badgeText: "Official TDP Annex Management Workflow • A.Y. 2026–2027",
        headlinePrefix: "One tracked workflow for",
        headlineHighlight: "every TDP Annex",
        subheadline:
          "Replacing the manual prepare → review → scan → upload → email routine for TDP Annexes 1–10. Director review queue, verifiable transmittals, and student online portal.",
        primaryCtaText: "Staff & Officer Login",
        primaryCtaAction: "login",
        secondaryCtaText: "Student Application Portal",
        secondaryCtaAction: "register",
      },
    },
  ];

  await prisma.landingPageConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      publishedSections: defaultLandingSections,
      draftSections: defaultLandingSections,
      hasUnpublishedChanges: false,
      publishedAt: new Date(),
    },
  });

  console.log("  ✔ Annex Types 1 to 10 and landing configuration seeded.\n");

  // ---------------------------------------------------------------------------
  // STEP 4: SEED 9 APPLICANT CALLS (ACROSS 3 CAMPUSES)
  // ---------------------------------------------------------------------------
  console.log("▶ [Step 4/5] Seeding 9 Applicant Calls for all campus cohorts...");

  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const deadline = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

  const callsMap = new Map<number, string>();

  for (const campus of CAMPUS_CONFIGS) {
    for (const batch of campus.batches) {
      const callId = `call-batch-${batch.batchNumber}`;
      callsMap.set(batch.batchNumber, callId);

      await prisma.applicantCall.create({
        data: {
          id: callId,
          title: `TDP Call for Applicants (Batch ${batch.batchNumber} - ${campus.campusName}) - A.Y. 2026-2027`,
          description: `Official Tulong Dunong Program intake for qualified regular undergraduate students of ${campus.campusName} (Batch ${batch.batchNumber} Cohort - ${batch.studentCount} Grantees).`,
          batchNumber: batch.batchNumber,
          startDate,
          deadline,
          formSchema: annexes[1].formSchema,
          isActive: true,
          createdById: staffUser.id,
        },
      });
    }
  }

  console.log("  ✔ 9 Applicant Calls created (Batches 1-9 across Main, Calapan, and Bongabong campuses).\n");

  // ---------------------------------------------------------------------------
  // STEP 5: HIGH-PERFORMANCE BULK SEEDING OF 4,155 STUDENTS & APPLICATIONS
  // ---------------------------------------------------------------------------
  console.log("▶ [Step 5/5] Generating and bulk-inserting 4,155 students and applications...");

  const allStudentUsers: any[] = [];
  const allApplications: any[] = [];

  let overallGlobalIndex = 0;

  for (const campus of CAMPUS_CONFIGS) {
    let campusSequence = 1;

    for (const batch of campus.batches) {
      const callId = callsMap.get(batch.batchNumber)!;

      for (let i = 0; i < batch.studentCount; i++) {
        overallGlobalIndex++;
        const isMale = overallGlobalIndex % 2 === 0;
        const firstName = isMale
          ? FIRST_NAMES_MALE[overallGlobalIndex % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[overallGlobalIndex % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(overallGlobalIndex + i) % LAST_NAMES.length];
        const middleName = MIDDLE_NAMES[(overallGlobalIndex * 3 + i) % MIDDLE_NAMES.length];
        const fullName = `${firstName} ${middleName} ${lastName}`;

        const studentIdNum = `2024-${String(campusSequence).padStart(5, "0")}-${campus.idSuffix}`;
        campusSequence++;

        const userCuid = `usr_b${batch.batchNumber}_${String(i + 1).padStart(4, "0")}_${crypto.randomBytes(3).toString("hex")}`;
        const appCuid = `app_b${batch.batchNumber}_${String(i + 1).padStart(4, "0")}_${crypto.randomBytes(3).toString("hex")}`;
        const email = `student.b${batch.batchNumber}.${String(i + 1).padStart(4, "0")}@minsu.edu.ph`;

        const degree = campus.programs[i % campus.programs.length];
        const townObj = campus.towns[i % campus.towns.length];
        const barangay = BARANGAYS[(i * 2 + overallGlobalIndex) % BARANGAYS.length];
        const yearLevel = String((i % 4) + 1);
        const gwa = GWA_LIST[i % GWA_LIST.length];
        const income = INCOMES[i % INCOMES.length];
        const contactNo = `0917${String(1000000 + (overallGlobalIndex % 8999999))}`;
        const birthYear = 2003 + (i % 4);
        const birthMonth = String((i % 12) + 1).padStart(2, "0");
        const birthDay = String((i % 28) + 1).padStart(2, "0");
        const birthdate = `${birthYear}-${birthMonth}-${birthDay}`;

        const fatherFirstName = FIRST_NAMES_MALE[(i + 7) % FIRST_NAMES_MALE.length];
        const motherFirstName = FIRST_NAMES_FEMALE[(i + 11) % FIRST_NAMES_FEMALE.length];
        const motherMaidenName = LAST_NAMES[(i + 13) % LAST_NAMES.length];

        const tdpAwardNo = `2026-TDP-4060-B${batch.batchNumber}-${String(i + 1).padStart(4, "0")}`;
        const trackingCode = `MINSU-TDP-2026-B${batch.batchNumber}-${String(i + 1).padStart(4, "0")}`;

        // Complete dual-key harmonized formData
        const formData = {
          student_id: studentIdNum,
          student_id_number: studentIdNum,
          last_name: lastName,
          given_name: firstName,
          middle_name: middleName,
          ext_name: "",
          gender: isMale ? "M" : "F",
          birthdate,
          course_degree: degree,
          program_course: degree,
          year_level: yearLevel,
          street_barangay: barangay,
          town_city: townObj.town,
          province: "Oriental Mindoro",
          zipcode: townObj.zip,
          contact_number: contactNo,
          email,
          hei_uii: "4060",
          hei_name: "Mindoro State University",
          hei_campus: campus.campusKey,
          campus: campus.campusKey,
          father_last_name: lastName,
          father_given_name: fatherFirstName,
          father_middle_name: middleName,
          father_contact_number: contactNo,
          father_email: "",
          mother_last_name: motherMaidenName,
          mother_given_name: motherFirstName,
          mother_middle_name: "",
          mother_contact_number: contactNo,
          mother_email: "",
          parent_contact_number: contactNo,
          parent_email: "",
          latest_gwa: gwa,
          family_monthly_income: income,
          tdp_award_number: tdpAwardNo,
        };

        allStudentUsers.push({
          id: userCuid,
          name: fullName,
          email,
          passwordHash: defaultPasswordHash,
          role: Role.STUDENT,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        allApplications.push({
          id: appCuid,
          callId,
          studentId: userCuid,
          batchNumber: batch.batchNumber,
          formData,
          trackingCode,
          status: ApplicationStatus.ACCEPTED,
          submittedAt: new Date(),
        });
      }
    }
  }

  console.log(`  ➔ Prepared ${allStudentUsers.length} student users and ${allApplications.length} applications.`);

  // Insert in fast 500-item chunks
  const CHUNK_SIZE = 500;
  console.log("  ➔ Inserting users in bulk chunks...");
  for (let i = 0; i < allStudentUsers.length; i += CHUNK_SIZE) {
    const chunk = allStudentUsers.slice(i, i + CHUNK_SIZE);
    await prisma.user.createMany({ data: chunk });
  }

  console.log("  ➔ Inserting applications in bulk chunks...");
  for (let i = 0; i < allApplications.length; i += CHUNK_SIZE) {
    const chunk = allApplications.slice(i, i + CHUNK_SIZE);
    await prisma.application.createMany({ data: chunk });
  }

  console.log("\n▶ [Step 6/6] Seeding Walk-In Queue, 3 Demo Staff & Kiosk defaults...");
  await seedDemoQueueConfigAndAssignments(prisma, defaultPasswordHash);
  console.log(
    "  ✔ Default Kiosk Config, 3 Demo Staff (staff1..3@minsu.edu.ph), 4 TDP Queue Services, and 9 Campus Windows seeded."
  );

  console.log("\n===============================================================================");
  console.log("DATABASE REFRESH & SEEDING COMPLETED SUCCESSFULLY! 🎉");
  console.log("Summary of Seeded Batches (All status: ACCEPTED):");
  console.log("  • Batch 1 (Main Campus):      35 students");
  console.log("  • Batch 2 (Main Campus):     350 students");
  console.log("  • Batch 3 (Main Campus):    1000 students");
  console.log("  • Batch 4 (Calapan Campus):   35 students");
  console.log("  • Batch 5 (Calapan Campus):  350 students");
  console.log("  • Batch 6 (Calapan Campus): 1000 students");
  console.log("  • Batch 7 (Bongabong Campus): 35 students");
  console.log("  • Batch 8 (Bongabong Campus):350 students");
  console.log("  • Batch 9 (Bongabong Campus):1000 students");
  console.log("  ──────────────────────────────────────────");
  console.log(`  TOTAL:                      ${allApplications.length} students`);
  console.log("===============================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
