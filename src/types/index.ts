export type Role = "STAFF" | "STUDENT" | "DIRECTOR" | "ACCOUNTING" | "SYSTEM_ADMIN";

export type DocumentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "RESUBMITTED"
  | "APPROVED"
  | "UPLOADED"
  | "TRANSMITTED"
  | "ARCHIVED";

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  departmentId?: string | null;
}

export interface AnnexFormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
  defaultValue?: string | number;
}

export interface AnnexFormSchema {
  fields: AnnexFormField[];
  instructions?: string;
}

export interface AnnexTypeInfo {
  id: string;
  number: number;
  name: string;
  creatorRoles: Role[];
  formSchema: AnnexFormSchema;
  pdfTemplate?: string | null;
}

export interface Annex1StudentData {
  seq?: number;
  student_id: string;
  // Student's Name
  last_name: string;
  given_name: string;
  ext_name?: string;
  middle_name?: string;
  // Student's Profile
  gender: string;
  birthdate: string; // DD/MM/YYYY
  course_degree: string;
  year_level: string; // 1, 2, 3, 4, 5
  // Permanent Address
  street_barangay: string;
  town_city: string;
  province: string;
  zipcode: string;
  // Contact
  contact_number: string;
  email: string;
  // Higher Education Institution
  hei_uii?: string;
  hei_name: string;
  hei_campus: string;
  // Father's Information
  father_last_name: string;
  father_given_name: string;
  father_middle_name?: string;
  father_contact_number?: string;
  father_email?: string;
  // Mother's Maiden Information
  mother_last_name: string;
  mother_given_name: string;
  mother_middle_name?: string;
  mother_contact_number?: string;
  mother_email?: string;
  // General Parental Contact (optional fallback)
  parent_contact_number?: string;
  parent_email?: string;
}

export interface ApplicationRecord {
  id: string;
  callId?: string | null;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  call?: {
    id: string;
    title: string;
    deadline: string;
  } | null;
  formData: Annex1StudentData | Record<string, any>;
  trackingCode: string;
  status: ApplicationStatus;
  reviewComment?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  annex1DocumentId?: string | null;
  submittedAt: string;
}

export type OtherGranteeStatus =
  | "not enrolled"
  | "dropped"
  | "waived"
  | "on LOA"
  | "transferee"
  | "graduated";

export interface Annex3Grantee {
  controlNumber: string; // 5-digit zero-padded, e.g. "00001"
  studentNumber: string;
  tdpAwardNumber: string;
  lastName: string;
  givenName: string;
  middleInitial: string;
  sex: "M" | "F" | string;
  birthdate: string; // mm/dd/yyyy
  degreeProgram: string;
  yearLevel: string;
  email: string;
  phone: string;
  tdpBatch: string | number;
  semesterAmount: number; // 7500.00
  totalAmount: number; // 7500.00
  campus: string;
}

export interface Annex3OtherGrantee {
  controlNumber: string;
  studentNumber: string;
  tdpAwardNumber: string;
  lastName: string;
  givenName: string;
  middleInitial: string;
  sex: "M" | "F" | string;
  birthdate: string;
  degreeProgram: string;
  yearLevel: string;
  status: OtherGranteeStatus;
  remarks: string;
  campus: string;
}

export interface Annex3FormData {
  regionCode: string; // "MIMAROPA"
  heiCode: string; // "MINSU"
  heiName: string; // "Mindoro State University"
  heiAddress: string; // "Alcate, Victoria, Oriental Mindoro"
  academicYear: string; // "2024-2025"
  termCode: "1" | "2"; // 1 = 1st sem, 2 = 2nd sem
  trancheNumber: "1" | "2";
  batchNumber: string | number; // e.g. "3"
  referenceNumber: string; // "MIMAROPA-MINSU-2024-1-1:3"
  billingDate: string; // "March 4, 2025"
  isLastBatch: boolean;

  totalGrantees: number;
  stipendPerGrantee: number; // 7500.00
  totalSubsidy: number; // totalGrantees * 7500
  managementFeeRate: number; // 0.005 (0.5%)
  managementFeeAmount: number; // totalSubsidy * 0.005
  grandTotalBilling: number; // totalSubsidy + managementFeeAmount

  billedGrantees: Annex3Grantee[];
  otherGrantees: Annex3OtherGrantee[];

  signatories?: {
    accountingHead?: { name: string; position: string };
    president?: { name: string; position: string };
    tesFocalPerson?: { name: string; position: string };
    registrar?: { name: string; position: string };
  };
  notary?: {
    docNo?: string;
    pageNo?: string;
    bookNo?: string;
    series?: string;
    issuedAt?: string;
    issuedOn?: string;
  };
}

export interface Annex4Grantee {
  controlNumber: string; // 5-digit zero-padded, e.g. "00001"
  studentNumber: string;
  tdpAwardNumber: string;
  lastName: string;
  givenName: string;
  middleInitial: string;
  sex: "M" | "F" | string;
  birthdate: string; // mm/dd/yyyy
  degreeProgram: string;
  yearLevel: string;
  email: string;
  phone: string;
  tdpBatch: string; // e.g. "20.1"
  tdpAmount: number; // 7500.00
  totalAmount: number; // 7500.00
  campus: string;
}

export interface Annex4FormData {
  regionCode: string; // "MIMAROPA"
  heiCode: string; // "MINSU"
  heiName: string; // "Mindoro State University"
  heiAddress: string; // "Alcate, Victoria, Oriental Mindoro"
  academicYear: string; // e.g. "2023-2024"
  termCode: "1" | "2"; // 1 = 1st sem, 2 = 2nd sem
  trancheNumber: "1" | "2";
  batchNumber: string; // e.g. "20.1"
  referenceNumber: string; // "MIMAROPA-MINSU-2023-2-1:20.1"
  billingDate: string;
  isLastBatch: boolean;
  campus: string; // e.g. "Main Campus - Victoria"

  totalGrantees: number;
  stipendPerGrantee: number; // 7500.00
  totalSubsidy: number; // totalGrantees * 7500
  managementFeeRate: number; // 0.005 (0.5%)
  managementFeeAmount: number; // totalSubsidy * 0.005
  grandTotalBilling: number; // totalSubsidy + managementFeeAmount

  grantees: Annex4Grantee[];

  jmcNumber?: string; // e.g. "04"
  jmcSeries?: string; // e.g. "2022"

  signatories?: {
    accountingHead?: { name: string; position: string };
    president?: { name: string; position: string };
    tesFocalPerson?: { name: string; position: string };
    registrar?: { name: string; position: string };
  };
  notary?: {
    docNo?: string;
    pageNo?: string;
    bookNo?: string;
    series?: string;
    issuedAt?: string;
    issuedOn?: string;
  };
}

export interface Annex5HeiEntry {
  seq: number;
  nameOfHei: string; // e.g. "Mindoro State University"
  heiType: "SUC" | "LUC" | "Private HEI" | string;
  numberTdpGrantees: number;
}

export interface Annex5FormData {
  date: string;
  memoOrderNumber: string; // e.g. "01"
  memoOrderYear: string; // "2024"
  term: string; // "2nd"
  academicYear: string; // "2023-2024"
  region: string; // "MIMAROPA" or "IV-B"
  heis: Annex5HeiEntry[];
  totalGrantees: number;

  addressee?: {
    name: string;
    position: string;
    office: string;
    address: string;
  };

  signatories?: {
    regionalCoordinator?: { name: string; position: string };
    chedroDirector?: { name: string; position: string; office: string };
  };
}

export interface Annex6ManagementFeeExpenses {
  officeSupplies: number;
  communication: number;
  travelingLocal: number;
  representation: number;
  otherProfessionalServices: number; // staff salary
  legalServices: number; // notarization
  otherExpenses: number; // cash cards / remittance fees
}

export interface Annex6FormData {
  heiName: string;
  heiAddress: string;
  coveredPeriod: string; // e.g. "January 1, 2024 to June 30, 2024"

  // Funds Received
  checkNumber: string;
  checkDate: string;
  totalStipendReceived: number;
  totalAscReceived: number;
  totalFundsReceived: number;

  // Less: Fund Utilized
  totalStipendUtilized: number;
  managementFeeExpenses: Annex6ManagementFeeExpenses;
  totalManagementFeeUtilized: number;
  totalFundsUtilized: number;

  // Balance
  balance: number;
  utilizationRate: number; // percentage, e.g. 98.5

  signatories?: {
    chiefAccountant?: { name: string; position: string };
    president?: { name: string; position: string };
    auditor?: { name: string; position: string; agency: string };
  };
}

export interface Annex7Entry {
  id: string;
  adaDate: string;
  adaSerialNo: string;
  dvPayrollNo: string;
  orsBursNo: string;
  responsibilityCenterCode: string;
  payee: string;
  uacsObjectCode: string;
  natureOfPayment: string;
  amount: number;
}

export interface Annex7FormData {
  periodCovered: string;
  entityName: string;
  fundCluster: string;
  bankNameAccountNo: string;
  reportNo: string;
  sheetNo: string;
  entries: Annex7Entry[];
  totalAmount: number;
  adaNoFrom: string;
  adaNoTo: string;
  disbursingOfficerName: string;
  disbursingOfficerDesignation: string;
  certificationDate: string;
}

export interface Annex8CheckEntry {
  id: string;
  checkDate: string;
  checkNo: string;
  dvPayrollNo: string;
  responsibilityCenterCode?: string;
  payee: string;
  purposeOfPayment: "TES" | "ASC" | string;
  amount: number;
}

export interface Annex8FormData {
  reportDate: string;
  heiName: string;
  heiAddress: string;
  reportNo: string;
  sheetNo: string;
  entries: Annex8CheckEntry[];
  totalAmount: number;
  checkNoFrom: string;
  checkNoTo: string;
  dateSigned: string;
  cashierName: string;
  accountantName: string;
  presidentName: string;
  auditorName: string;
  auditorTitle: string;
}

export interface Annex9GranteePayroll {
  id: string;
  seqNo: number;
  tdpAwardNo: string;
  studentIdNo: string;
  lastName: string;
  givenName: string;
  middleInitial: string;
  degreeProgram: string;
  yearLevel: string;

  // First Semester Payout
  firstSemAmount: number;
  firstSemDateReceived: string;
  firstSemSignature: string;

  // Second Semester Payout
  secondSemAmount: number;
  secondSemDateReceived: string;
  secondSemSignature: string;
}

export interface Annex9FormData {
  academicYear: string;
  activeSemester: "1" | "2";
  campus: string;
  payrollDate: string;
  heiName: string;
  heiAddress: string;

  grantees: Annex9GranteePayroll[];

  firstSemTotalAmount: number;
  secondSemTotalAmount: number;
  grandTotalAmount: number;

  signatories?: {
    tesFocalPerson?: { name: string; position: string };
    registrar?: { name: string; position: string };
    accountant?: { name: string; position: string };
    president?: { name: string; position: string };
  };
}

export interface Annex10Grantee {
  id: string;
  seqNo: number;
  awardNo: string;
  studentIdNo?: string;
  granteeName: string;
  salutation: string;
  address: string;
  cityMunicipality: string;
  startingSemester: string;
  academicYear: string;
  stipendAmount: number;
  heiName?: string;
  program?: string;
}

export interface Annex10FormData {
  topRightLabelType: "annex10" | "annex3_original" | "both";
  letterDate: string;
  defaultStartingSemester: string;
  defaultAcademicYear: string;
  stipendAmountPerSem: number;
  memorandumOrderRef: string;
  grantees: Annex10Grantee[];
  selectedGranteeId?: string;
  signatory: {
    name: string;
    position: string;
    office: string;
  };
  conditions: string[];
}
