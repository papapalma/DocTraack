export type SectionType =
  | "HERO"
  | "ANNOUNCEMENT"
  | "WORKFLOW"
  | "STATS"
  | "FAQ"
  | "CONTACT";

export interface HeroSectionConfig {
  badgeText: string;
  headlinePrefix: string;
  headlineHighlight: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaAction: "login" | "register" | "url";
  primaryCtaUrl?: string;
  secondaryCtaText: string;
  secondaryCtaAction: "login" | "register" | "url";
  secondaryCtaUrl?: string;
}

export interface AnnouncementSectionConfig {
  badge: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  variant: "warning" | "info" | "success";
}

export interface WorkflowCardItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

export interface WorkflowSectionConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  cards: WorkflowCardItem[];
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  subtext?: string;
}

export interface StatsSectionConfig {
  sectionTitle?: string;
  sectionSubtitle?: string;
  items: StatItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSectionConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  items: FaqItem[];
}

export interface ContactSectionConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  officeLocation: string;
  officeHours: string;
  email: string;
  hotline: string;
}

export type BaseSection<T extends SectionType, C> = {
  id: string;
  type: T;
  title: string;
  enabled: boolean;
  content: C;
};

export type LandingSection =
  | BaseSection<"HERO", HeroSectionConfig>
  | BaseSection<"ANNOUNCEMENT", AnnouncementSectionConfig>
  | BaseSection<"WORKFLOW", WorkflowSectionConfig>
  | BaseSection<"STATS", StatsSectionConfig>
  | BaseSection<"FAQ", FaqSectionConfig>
  | BaseSection<"CONTACT", ContactSectionConfig>;

export interface LandingPageData {
  publishedSections: LandingSection[];
  draftSections: LandingSection[];
  hasUnpublishedChanges: boolean;
  publishedAt?: string | null;
  updatedAt?: string;
}

export const DEFAULT_LANDING_SECTIONS: LandingSection[] = [
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
