import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MinSU DocTrack database...");

  // 1. Seed Initial Users
  const defaultPasswordHash = await bcrypt.hash("Password@123", 10);

  const users = [
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
    {
      name: "Juan Dela Cruz (Student)",
      email: "student@minsu.edu.ph",
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log("Users seeded successfully.");

  // 2. Seed Annex Types 1-10 with placeholder form schemas
  const annexes = [
    {
      number: 1,
      name: "Submission to Agency",
      creatorRoles: [Role.STAFF],
      formSchema: {
        fields: [
          { id: "target_agency", label: "Concerned Government Agency", type: "text", required: true, placeholder: "e.g., CHED / UniFAST Regional Office" },
          { id: "academic_year", label: "Academic Year & Semester", type: "text", required: true, placeholder: "e.g., A.Y. 2025-2026, 1st Semester" },
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
          { id: "academic_period", label: "Academic Period", type: "text", required: true, placeholder: "e.g., 2nd Sem, A.Y. 2025-2026" },
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
          { id: "school_year", label: "School Year & Term", type: "text", required: true, placeholder: "A.Y. 2025-2026" },
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
          { id: "payroll_period", label: "Coverage Period", type: "text", required: true, placeholder: "1st Semester A.Y. 2025-2026" },
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

  for (const annex of annexes) {
    await prisma.annexType.upsert({
      where: { number: annex.number },
      update: {
        name: annex.name,
        creatorRoles: annex.creatorRoles,
        formSchema: annex.formSchema,
      },
      create: {
        number: annex.number,
        name: annex.name,
        creatorRoles: annex.creatorRoles,
        formSchema: annex.formSchema,
      },
    });
  }

  // 3. Seed Sample Applicant Call (Annex 2)
  const staffUser = await prisma.user.findUnique({ where: { email: "staff@minsu.edu.ph" } });
  if (staffUser) {
    await prisma.applicantCall.upsert({
      where: { id: "call-2026-sem1" },
      update: {},
      create: {
        id: "call-2026-sem1",
        title: "TDP Call for Applicants - 1st Semester A.Y. 2026-2027",
        description: "Official call for regular undergraduate applicants across all Mindoro State University campuses.",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        formSchema: annexes[1].formSchema,
        isActive: true,
        createdById: staffUser.id,
      },
    });

    // 4. Seed Demo Documents
    const annex3 = await prisma.annexType.findUnique({ where: { number: 3 } });
    if (annex3) {
      await prisma.document.upsert({
        where: { id: "doc-demo-annex3" },
        update: {},
        create: {
          id: "doc-demo-annex3",
          annexTypeId: annex3.id,
          title: "Annex 3: Continuing Billing Statement - 2nd Sem 2025-2026",
          status: "SUBMITTED",
          createdById: staffUser.id,
          formData: {
            academic_period: "2nd Semester, A.Y. 2025-2026",
            total_continuing_students: 120,
            amount_per_grantee: 7500,
            total_billing_amount: 900000,
            notes: "Endorsed for Director review and immediate submission to UniFAST.",
          },
          statusHistory: {
            create: [
              {
                fromStatus: "DRAFT",
                toStatus: "SUBMITTED",
                actorId: staffUser.id,
                comment: "Submitted to Campus Director for formal review.",
              },
            ],
          },
        },
      });
    }

    const annex6 = await prisma.annexType.findUnique({ where: { number: 6 } });
    const acctUser = await prisma.user.findUnique({ where: { email: "accounting@minsu.edu.ph" } });
    if (annex6 && acctUser) {
      await prisma.document.upsert({
        where: { id: "doc-demo-annex6" },
        update: {},
        create: {
          id: "doc-demo-annex6",
          annexTypeId: annex6.id,
          title: "Annex 6: Certificate of Fund Utilization (Q3 2026)",
          status: "DRAFT",
          createdById: acctUser.id,
          formData: {
            fund_source: "CHED-UniFAST Sub-allotment Advice 2026-04",
            total_fund_received: 2500000,
            total_fund_disbursed: 2450000,
            unutilized_balance: 50000,
            utilization_rate: 98.0,
            accounting_remarks: "98% disbursement rate across Main and Satellite campuses.",
          },
          statusHistory: {
            create: [
              {
                fromStatus: "DRAFT",
                toStatus: "DRAFT",
                actorId: acctUser.id,
                comment: "Initial quarterly utilization statement created.",
              },
            ],
          },
        },
      });
    }
  }

  // 6. Seed Landing Page Configuration
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
    {
      id: "sec-announcement-1",
      type: "ANNOUNCEMENT",
      title: "Urgent Announcement Banner",
      enabled: true,
      content: {
        badge: "ANNOUNCEMENT",
        message:
          "TDP Grant Annex 2 applicant call for 1st Semester A.Y. 2026–2027 is now actively accepting applications.",
        linkText: "Submit Online",
        linkUrl: "/?auth=register",
        variant: "warning",
      },
    },
    {
      id: "sec-workflow-1",
      type: "WORKFLOW",
      title: "Annex Lifecycle & Process Flow",
      enabled: true,
      content: {
        sectionTitle: "Official Annex Lifecycle",
        sectionSubtitle:
          "Comprehensive paperless tracking from initial electronic drafting to formal agency transmittal.",
        cards: [
          {
            id: "card-1",
            icon: "file-check",
            title: "Annexes 1 to 10 Lifecycle",
            description:
              "Standardized electronic preparation, automated PDF generation, verification, and agency transmittal records.",
            badge: "Phase 1–2",
          },
          {
            id: "card-2",
            icon: "clock",
            title: "Executive Director Review",
            description:
              "Real-time review queue with one-click approval and revision feedback loop recorded in an immutable audit trail.",
            badge: "Approval Engine",
          },
          {
            id: "card-3",
            icon: "graduation-cap",
            title: "Student Portal (Annex 2)",
            description:
              "Online applicant submission with tracking code generation and self-service application status monitoring.",
            badge: "Applicant Onboarding",
          },
        ],
      },
    },
    {
      id: "sec-stats-1",
      type: "STATS",
      title: "Program Milestones & Statistics",
      enabled: true,
      content: {
        sectionTitle: "MinSU TDP Impact at a Glance",
        sectionSubtitle:
          "Transparency, speed, and accountability across all participating campuses.",
        items: [
          {
            id: "stat-1",
            value: "10",
            label: "TDP Annex Types",
            subtext: "100% Paperless electronic workflows",
          },
          {
            id: "stat-2",
            value: "< 24h",
            label: "Approval Turnaround",
            subtext: "Fast electronic endorsement velocity",
          },
          {
            id: "stat-3",
            value: "100%",
            label: "Audit Traceability",
            subtext: "Every action immutably logged",
          },
          {
            id: "stat-4",
            value: "7",
            label: "MinSU Campuses",
            subtext: "Unified across Oriental Mindoro",
          },
        ],
      },
    },
    {
      id: "sec-faq-1",
      type: "FAQ",
      title: "Applicant Guidelines & FAQ",
      enabled: true,
      content: {
        sectionTitle: "Frequently Asked Questions",
        sectionSubtitle:
          "Everything you need to know about the Tulong Dunong Program application and review process.",
        items: [
          {
            id: "faq-1",
            question: "Who is eligible to apply through the Student Portal for Annex 2?",
            answer:
              "Enrolled undergraduate students of Mindoro State University who meet the scholarship guidelines of the Tulong Dunong Program (TDP) are eligible to register and submit an Annex 2 application.",
          },
          {
            id: "faq-2",
            question: "How do I check the status of my grant application?",
            answer:
              "Once submitted, you receive a unique tracking code. You can log into your student account to view the real-time status in 'My Applications' anytime.",
          },
          {
            id: "faq-3",
            question: "How are Annexes 1–10 processed by staff and directors?",
            answer:
              "Staff and Accounting prepare the annex forms electronically. The Campus Director reviews and approves them in a digital queue, after which transmittal links are archived for external oversight.",
          },
        ],
      },
    },
    {
      id: "sec-contact-1",
      type: "CONTACT",
      title: "Campus Directory & Office Info",
      enabled: true,
      content: {
        sectionTitle: "TDP Assistance & Campus Directory",
        sectionSubtitle:
          "Have inquiries regarding your application or institutional requirements? Reach our coordinators.",
        officeLocation:
          "Mindoro State University - Bongabong Campus, Labasan, Bongabong, Oriental Mindoro",
        officeHours: "Monday – Friday: 8:00 AM – 5:00 PM PHT",
        email: "tdp.office@minsu.edu.ph",
        hotline: "(043) 288-2026 / Local 104",
      },
    },
  ];

  await (prisma as any).landingPageConfig.upsert({
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
  console.log("Landing page configuration seeded successfully.");

  console.log("All 10 Annex types, sample documents, and active call seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
