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
 * Check if a role can create, edit, delete, or pin announcements
 */
export function canManageAnnouncements(role: Role): boolean {
  return role === "STAFF" || role === "DIRECTOR" || role === "SYSTEM_ADMIN";
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
 * Checks whether a user is authorized to read or comment on a specific document.
 * Mirrors the exact scope isolation enforced by GET /api/documents.
 */
export function canAccessDocument(
  user: { id: string; role: Role },
  doc: {
    status: DocumentStatus;
    createdById: string;
    annexType: { number: number };
  }
): boolean {
  if (user.role === "STUDENT" || user.role === "SYSTEM_ADMIN") {
    return false;
  }
  if (user.role === "STAFF") {
    return true;
  }
  if (user.role === "DIRECTOR") {
    return doc.status !== "DRAFT" || doc.createdById === user.id;
  }
  if (user.role === "ACCOUNTING") {
    const num = doc.annexType.number;
    if (doc.createdById === user.id) return true;
    if (num >= 6 && num <= 9) return true;
    if (
      (num === 3 || num === 4) &&
      (doc.status === "SUBMITTED" ||
        doc.status === "APPROVED" ||
        doc.status === "UPLOADED" ||
        doc.status === "TRANSMITTED")
    ) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 * Checks whether a role may export Excel/Word reports for a given Annex number.
 * Explicitly blocks STUDENT and SYSTEM_ADMIN, and isolates ACADEMIC vs FINANCIAL annexes.
 */
export function canExportAnnex(role: Role, annexNumber: number): boolean {
  if (role === "STAFF" || role === "DIRECTOR") {
    return annexNumber >= 1 && annexNumber <= 10;
  }
  if (role === "ACCOUNTING") {
    return annexNumber === 3 || annexNumber === 4 || (annexNumber >= 6 && annexNumber <= 9);
  }
  return false;
}

/**
 * Only STAFF can create, edit, upload, rename, or delete Annex Presets.
 */
export function canManageAnnexPresets(role: Role): boolean {
  return role === "STAFF";
}

/**
 * Check if a role can select/use an Annex Preset during document preparation.
 * Covers Annexes 1 and 3-10 (Annex 2 Calls are managed via /calls).
 */
export function canSelectAnnexPreset(role: Role, annexNumber: number): boolean {
  if (annexNumber === 2) {
    return false;
  }
  if (role === "STAFF") {
    return annexNumber === 1 || (annexNumber >= 3 && annexNumber <= 10);
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
 * Staff can record transmittal once uploaded (or approved); Accounting only for financial Annexes 6-9.
 */
export function canTransmit(
  role: Role,
  status: DocumentStatus,
  annexNumber?: number
): boolean {
  if (status !== "UPLOADED" && status !== "APPROVED") {
    return false;
  }
  if (role === "STAFF") {
    return true;
  }
  if (role === "ACCOUNTING") {
    return typeof annexNumber === "number" && annexNumber >= 6 && annexNumber <= 9;
  }
  return false;
}

/**
 * Staff can manually archive a transmitted document
 */
export function canArchive(role: Role, status: DocumentStatus): boolean {
  return role === "STAFF" && status === "TRANSMITTED";
}

/**
 * Staff, Accounting, Director, and System Admin can access the Walk-In Queue Console
 */
export function canOperateQueue(role: Role): boolean {
  return (
    role === "STAFF" ||
    role === "ACCOUNTING" ||
    role === "DIRECTOR" ||
    role === "SYSTEM_ADMIN"
  );
}

/**
 * Only System Admin can modify global Kiosk Mode, PIN, Service Categories, and Window structure
 */
export function canManageQueueConfig(role: Role): boolean {
  return role === "SYSTEM_ADMIN";
}

/**
 * Staff, Director, or System Admin can perform End-of-Day queue cut-off/reset
 */
export function canResetDailyQueue(role: Role): boolean {
  return role === "STAFF" || role === "DIRECTOR" || role === "SYSTEM_ADMIN";
}
