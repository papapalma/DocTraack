/**
 * 3-Way Cross-Check Matching Service
 * Cross-checks CHED Scholar List, Registrar Enrollment List, and DocTrack System Data.
 */

import {
  buildMatchKey,
  canonicalizeCampus,
  isMiddleNameCompatible,
  normalizeStudentName,
  normalizeMiddleName,
} from "./normalizer";
import { computeStudentSimilarity } from "./fuzzy";

export interface StudentInputRecord {
  lastName: string;
  firstName: string;
  middleName?: string | null;
  school: string;
  idNumber?: string | null;
  sourceLineNumber?: number;
}

export type VerificationStatus =
  | "FULLY_VERIFIED"
  | "NEEDS_ENCODING"
  | "NOT_ENROLLED"
  | "SYSTEM_DISCREPANCY"
  | "POSSIBLE_MATCH"
  | "ENROLLED_NON_SCHOLAR";

export interface MatchedResultItem {
  status: VerificationStatus;
  studentIdNo?: string | null;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  school: string;
  inChed: boolean;
  inRegistrar: boolean;
  inSystem: boolean;
  confidenceScore?: number | null;
  matchDetails?: {
    candidateName?: string;
    candidateId?: string | null;
    candidateSchool?: string;
    score?: number;
    notes?: string;
  } | null;
}

export interface VerificationSummary {
  totalChed: number;
  totalRegistrar: number;
  totalSystem: number;
  fullyVerified: number;
  needsEncoding: number;
  notEnrolled: number;
  systemDiscrepancy: number;
  possibleMatch: number;
  enrolledNonScholar: number;
}

export interface VerificationOutput {
  results: MatchedResultItem[];
  summary: VerificationSummary;
}

/**
 * Executes the 3-Way Cross-Check Matching Pipeline
 */
export function runThreeWayCrossCheck(params: {
  chedRecords: StudentInputRecord[];
  registrarRecords: StudentInputRecord[];
  systemRecords: StudentInputRecord[];
  fuzzyThreshold?: number; // Defaults to 0.85 (85%)
}): VerificationOutput {
  const {
    chedRecords,
    registrarRecords,
    systemRecords,
    fuzzyThreshold = 0.85,
  } = params;

  const results: MatchedResultItem[] = [];

  // 1. Build Index for Registrar Records
  // Map key -> list of registrar records with that key
  const registrarExactMap = new Map<string, StudentInputRecord[]>();
  for (const reg of registrarRecords) {
    const key = buildMatchKey(reg.lastName, reg.firstName, reg.school);
    const existing = registrarExactMap.get(key) || [];
    existing.push(reg);
    registrarExactMap.set(key, existing);
  }

  // 2. Build Index for System Records
  const systemExactMap = new Map<string, StudentInputRecord[]>();
  for (const sys of systemRecords) {
    const key = buildMatchKey(sys.lastName, sys.firstName, sys.school);
    const existing = systemExactMap.get(key) || [];
    existing.push(sys);
    systemExactMap.set(key, existing);
  }

  // Track matched records to identify leftovers
  const matchedRegistrarIndices = new Set<number>();
  const matchedSystemIndices = new Set<number>();

  // -------------------------------------------------------------
  // STEP 1: CHED vs Registrar Cross-Check
  // -------------------------------------------------------------
  interface Step1Result {
    ched: StudentInputRecord;
    matchedRegistrar?: StudentInputRecord;
    isExactMatch: boolean;
    isFuzzyMatch: boolean;
    confidenceScore?: number;
  }

  const step1Results: Step1Result[] = [];

  for (const ched of chedRecords) {
    const exactKey = buildMatchKey(ched.lastName, ched.firstName, ched.school);
    const exactCandidates = registrarExactMap.get(exactKey);

    let foundExact = false;
    if (exactCandidates && exactCandidates.length > 0) {
      // Find candidate with compatible middle name
      for (const cand of exactCandidates) {
        if (isMiddleNameCompatible(ched.middleName, cand.middleName)) {
          const regIdx = registrarRecords.indexOf(cand);
          if (regIdx !== -1) matchedRegistrarIndices.add(regIdx);

          step1Results.push({
            ched,
            matchedRegistrar: cand,
            isExactMatch: true,
            isFuzzyMatch: false,
            confidenceScore: 1.0,
          });
          foundExact = true;
          break;
        }
      }
    }

    if (foundExact) continue;

    // If no exact match: perform Fuzzy Matching across registrar records
    // Optimization: candidate blocking by school and last name prefix
    const chedCampus = canonicalizeCampus(ched.school).canonical;
    const chedLastNorm = normalizeStudentName(ched.lastName).base;

    let bestCandidate: StudentInputRecord | null = null;
    let bestCandidateIdx = -1;
    let bestScore = 0;

    for (let rIdx = 0; rIdx < registrarRecords.length; rIdx++) {
      const reg = registrarRecords[rIdx];
      const regCampus = canonicalizeCampus(reg.school).canonical;

      // Allow fuzzy matching within the same campus or general MinSU
      if (
        chedCampus !== regCampus &&
        chedCampus !== "MINSU_GENERAL" &&
        regCampus !== "MINSU_GENERAL"
      ) {
        continue;
      }

      // Check first letter of last name or similarity
      const regLastNorm = normalizeStudentName(reg.lastName).base;
      if (
        chedLastNorm.charAt(0) !== regLastNorm.charAt(0) &&
        Math.abs(chedLastNorm.length - regLastNorm.length) > 2
      ) {
        continue;
      }

      const sim = computeStudentSimilarity(
        {
          lastName: ched.lastName,
          firstName: ched.firstName,
          middleName: ched.middleName,
        },
        {
          lastName: reg.lastName,
          firstName: reg.firstName,
          middleName: reg.middleName,
        }
      );

      if (sim.totalScore > bestScore) {
        bestScore = sim.totalScore;
        bestCandidate = reg;
        bestCandidateIdx = rIdx;
      }
    }

    if (bestCandidate && bestScore >= fuzzyThreshold) {
      if (bestCandidateIdx !== -1) {
        matchedRegistrarIndices.add(bestCandidateIdx);
      }
      step1Results.push({
        ched,
        matchedRegistrar: bestCandidate,
        isExactMatch: false,
        isFuzzyMatch: true,
        confidenceScore: bestScore,
      });
    } else {
      // Not enrolled in Registrar
      step1Results.push({
        ched,
        matchedRegistrar: undefined,
        isExactMatch: false,
        isFuzzyMatch: false,
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 2: Step 1 Output vs System Data
  // -------------------------------------------------------------
  for (const step1 of step1Results) {
    const { ched, matchedRegistrar, isExactMatch, isFuzzyMatch, confidenceScore } = step1;
    const sysKey = buildMatchKey(ched.lastName, ched.firstName, ched.school);
    const systemCandidates = systemExactMap.get(sysKey);

    let matchedSystem: StudentInputRecord | null = null;
    if (systemCandidates && systemCandidates.length > 0) {
      for (const sys of systemCandidates) {
        if (isMiddleNameCompatible(ched.middleName, sys.middleName)) {
          const sIdx = systemRecords.indexOf(sys);
          if (sIdx !== -1) matchedSystemIndices.add(sIdx);
          matchedSystem = sys;
          break;
        }
      }
    }

    const inSystem = !!matchedSystem;
    const idNumber = matchedRegistrar?.idNumber || matchedSystem?.idNumber || null;

    if (isFuzzyMatch && matchedRegistrar) {
      // Flagged as Possible Match for manual staff verification
      results.push({
        status: "POSSIBLE_MATCH",
        studentIdNo: matchedRegistrar.idNumber || null,
        lastName: ched.lastName,
        firstName: ched.firstName,
        middleName: ched.middleName || null,
        school: ched.school,
        inChed: true,
        inRegistrar: false, // Pending staff manual confirmation
        inSystem,
        confidenceScore,
        matchDetails: {
          candidateName: `${matchedRegistrar.lastName}, ${matchedRegistrar.firstName} ${matchedRegistrar.middleName || ""}`.trim(),
          candidateId: matchedRegistrar.idNumber,
          candidateSchool: matchedRegistrar.school,
          score: confidenceScore,
          notes: `Fuzzy candidate found in Registrar with ${Math.round((confidenceScore || 0) * 100)}% confidence score. Requires staff review.`,
        },
      });
    } else if (isExactMatch && matchedRegistrar) {
      if (inSystem) {
        // Enrolled + CHED scholar + Found in system -> FULLY_VERIFIED
        results.push({
          status: "FULLY_VERIFIED",
          studentIdNo: idNumber,
          lastName: ched.lastName,
          firstName: ched.firstName,
          middleName: ched.middleName || null,
          school: ched.school,
          inChed: true,
          inRegistrar: true,
          inSystem: true,
          confidenceScore: 1.0,
        });
      } else {
        // Enrolled + CHED scholar + Not in system -> NEEDS_ENCODING
        results.push({
          status: "NEEDS_ENCODING",
          studentIdNo: idNumber,
          lastName: ched.lastName,
          firstName: ched.firstName,
          middleName: ched.middleName || null,
          school: ched.school,
          inChed: true,
          inRegistrar: true,
          inSystem: false,
          confidenceScore: 1.0,
          matchDetails: {
            notes: "Student is officially enrolled and a CHED scholar, but not yet encoded in DocTrack.",
          },
        });
      }
    } else {
      // Not enrolled in Registrar + CHED scholar -> NOT_ENROLLED
      results.push({
        status: "NOT_ENROLLED",
        studentIdNo: inSystem ? matchedSystem?.idNumber : null,
        lastName: ched.lastName,
        firstName: ched.firstName,
        middleName: ched.middleName || null,
        school: ched.school,
        inChed: true,
        inRegistrar: false,
        inSystem,
        confidenceScore: 0.0,
        matchDetails: {
          notes: inSystem
            ? "Flag for review: Listed in CHED and DocTrack, but NOT found in official Registrar enrollment."
            : "Flag for review: Listed in CHED grantee list, but NOT officially enrolled in the Registrar.",
        },
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 3: Check System Records not matched in CHED or Registrar
  // -------------------------------------------------------------
  for (let sIdx = 0; sIdx < systemRecords.length; sIdx++) {
    if (!matchedSystemIndices.has(sIdx)) {
      const sys = systemRecords[sIdx];
      results.push({
        status: "SYSTEM_DISCREPANCY",
        studentIdNo: sys.idNumber || null,
        lastName: sys.lastName,
        firstName: sys.firstName,
        middleName: sys.middleName || null,
        school: sys.school,
        inChed: false,
        inRegistrar: false,
        inSystem: true,
        confidenceScore: 0.0,
        matchDetails: {
          notes: "Possible discrepancy: Recorded in DocTrack, but missing from both CHED and Registrar lists.",
        },
      });
    }
  }

  // -------------------------------------------------------------
  // STEP 4: Registrar Records not matched in CHED (Enrolled Non-Scholars)
  // -------------------------------------------------------------
  for (let rIdx = 0; rIdx < registrarRecords.length; rIdx++) {
    if (!matchedRegistrarIndices.has(rIdx)) {
      const reg = registrarRecords[rIdx];
      results.push({
        status: "ENROLLED_NON_SCHOLAR",
        studentIdNo: reg.idNumber || null,
        lastName: reg.lastName,
        firstName: reg.firstName,
        middleName: reg.middleName || null,
        school: reg.school,
        inChed: false,
        inRegistrar: true,
        inSystem: false,
        confidenceScore: 0.0,
        matchDetails: {
          notes: "Officially enrolled student, but not recorded on current CHED scholarship list.",
        },
      });
    }
  }

  // Summary counts
  const summary: VerificationSummary = {
    totalChed: chedRecords.length,
    totalRegistrar: registrarRecords.length,
    totalSystem: systemRecords.length,
    fullyVerified: results.filter((r) => r.status === "FULLY_VERIFIED").length,
    needsEncoding: results.filter((r) => r.status === "NEEDS_ENCODING").length,
    notEnrolled: results.filter((r) => r.status === "NOT_ENROLLED").length,
    systemDiscrepancy: results.filter((r) => r.status === "SYSTEM_DISCREPANCY").length,
    possibleMatch: results.filter((r) => r.status === "POSSIBLE_MATCH").length,
    enrolledNonScholar: results.filter((r) => r.status === "ENROLLED_NON_SCHOLAR").length,
  };

  return { results, summary };
}
