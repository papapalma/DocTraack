import { Role, DocumentStatus } from "@/types";

export function isDirector(role: Role): boolean {
  return role === "DIRECTOR";
}

export function isStaff(role: Role): boolean {
  return role === "STAFF";
}

export function isAccounting(role: Role): boolean {
  return role === "ACCOUNTING";
}

export function isSystemAdmin(role: Role): boolean {
  return role === "SYSTEM_ADMIN";
}

export function isStudent(role: Role): boolean {
  return role === "STUDENT";
}

/**
 * Check if a role can create a given annex number
 * Annex 1, 2, 3, 4, 5, 10: STAFF
 * Annex 6, 7, 8, 9: STAFF and ACCOUNTING
 */
export function canCreateAnnex(role: Role, annexNumber: number): boolean {
  if (role === "STAFF") {
    return annexNumber >= 1 && annexNumber <= 10;
  }
  if (role === "ACCOUNTING") {
    return annexNumber >= 6 && annexNumber <= 9;
  }
  return false;
}

/**
 * Only the preparer can edit while status is DRAFT or RETURNED
 */
export function canEditDocument(
  userId: string,
  docCreatorId: string,
  status: DocumentStatus
): boolean {
  return userId === docCreatorId && (status === "DRAFT" || status === "RETURNED");
}

/**
 * Only the Director can review, approve, or return documents
 */
export function canReviewDocument(role: Role, status: DocumentStatus): boolean {
  return (
    role === "DIRECTOR" &&
    (status === "SUBMITTED" || status === "RESUBMITTED")
  );
}

/**
 * Staff can upload scan once document is APPROVED
 */
export function canUploadScan(
  role: Role,
  userId: string,
  docCreatorId: string,
  status: DocumentStatus
): boolean {
  return (role === "STAFF" || role === "ACCOUNTING") && status === "APPROVED";
}

/**
 * Staff can record transmittal once uploaded (or approved)
 */
export function canTransmit(role: Role, status: DocumentStatus): boolean {
  return (
    (role === "STAFF" || role === "ACCOUNTING") &&
    (status === "UPLOADED" || status === "APPROVED")
  );
}

/**
 * Staff can manually archive a transmitted document
 */
export function canArchive(role: Role, status: DocumentStatus): boolean {
  return role === "STAFF" && status === "TRANSMITTED";
}
