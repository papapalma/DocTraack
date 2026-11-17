import { LogoConfig, PaperSize, Role } from "./index";

export type AnnexPresetKind = "BUILT_IN" | "CUSTOM_UPLOAD";

export type PresetPageSourceType = "pdf" | "image" | "builtin-tab";

export interface PresetPage {
  id: string;
  pageNumber: number;
  label: string;
  sourceType: PresetPageSourceType;
  fileUrl?: string;
  pdfPageIndex?: number; // 0-based index inside the uploaded PDF
  widthPt: number; // PDF points (72pt = 1in)
  heightPt: number;
  orientation: "portrait" | "landscape";
  tabKey?: string; // Built-in tab identifier (e.g., "tab1", "tab2")
}

export type PresetElementType =
  | "textbox"
  | "textarea"
  | "static_text"
  | "bound_field"
  | "data_table"
  | "date"
  | "checkbox"
  | "logo";

export type PresetTableDataSource =
  | "grantees"
  | "otherGrantees"
  | "annex1Students"
  | "heis"
  | "adaEntries"
  | "checkEntries";

export interface PresetTableColumn {
  key: string;
  label: string;
  widthPct: number;
  align?: "left" | "center" | "right";
  format?: "text" | "currency" | "number" | "date";
}

export interface PresetElementStyle {
  fontFamily?: "Helvetica" | "Times" | "Courier";
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  paddingPx?: number;
}

export interface PresetElement {
  id: string;
  pageId: string;
  type: PresetElementType;
  label: string;
  fieldKey?: string; // key inside formData.customFields or bound workspace path
  bindingKey?: string; // e.g., "heiName", "grandTotalBilling", "signatory.president.name"
  staticText?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  checkedDefault?: boolean;
  logoSlot?: "left" | "right" | "custom";
  logoUrl?: string;
  xPct: number; // 0..100 relative to page width
  yPct: number; // 0..100 relative to page height
  wPct: number; // 0..100
  hPct: number; // 0..100
  zIndex?: number;
  style?: PresetElementStyle;
  tableConfig?: {
    dataSource: PresetTableDataSource;
    columns: PresetTableColumn[];
    rowHeightPt: number;
    headerBgColor?: string;
    headerTextColor?: string;
    showHeader?: boolean;
    autoPaginate?: boolean;
    fontSizePt?: number;
  };
}

export interface PresetModulesConfig {
  batchInjection: boolean;
  stipendCalculator: boolean;
  campusParameters: boolean;
  signatories: boolean;
  granteeTable: boolean;
  coverFields: boolean;
}

export interface PresetSignatoryDefault {
  name: string;
  position: string;
  office?: string;
}

export interface PresetRetainedSettings {
  paperSize: PaperSize;
  orientation: "portrait" | "landscape";
  campus?: string;
  regionCode?: string;
  heiCode?: string;
  heiName?: string;
  heiAddress?: string;
  academicYear?: string;
  termCode?: string;
  trancheNumber?: string;
  batchNumber?: string;
  stipendTier?: "7500" | "10000" | "custom";
  stipendPerGrantee?: number;
  managementFeeRate?: number;
  headerLogos?: {
    leftLogo?: LogoConfig;
    rightLogo?: LogoConfig;
  };
  signatories?: Record<string, PresetSignatoryDefault>;
  notary?: {
    docNo?: string;
    pageNo?: string;
    bookNo?: string;
    series?: string;
    issuedAt?: string;
  };
  extraDefaults?: Record<string, unknown>;
}

export interface AnnexPresetConfig {
  kind: AnnexPresetKind;
  annexNumber: number;
  version: number;
  pages: PresetPage[];
  elements: PresetElement[];
  modules: PresetModulesConfig;
  settings: PresetRetainedSettings;
}

export interface AnnexPresetRecord {
  id: string;
  annexTypeId: string;
  annexType?: {
    id: string;
    number: number;
    name: string;
    creatorRoles: Role[];
  };
  name: string;
  description?: string | null;
  kind: AnnexPresetKind;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  config: AnnexPresetConfig;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
    role?: Role;
  };
  updatedById?: string | null;
  updatedBy?: {
    id: string;
    name: string;
    email?: string;
    role?: Role;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
  };
}

