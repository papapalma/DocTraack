/**
 * Unit Tests for 3-Way CSV Verification Engine
 * Run with: npx tsx tests/verification-matcher.test.ts
 */

import assert from "assert";
import {
  stripDiacritics,
  extractSuffix,
  normalizeStudentName,
  normalizeMiddleName,
  isMiddleNameCompatible,
  canonicalizeCampus,
  buildMatchKey,
} from "../src/lib/verification/normalizer";
import {
  jaroWinklerSimilarity,
  levenshteinDistance,
  computeStudentSimilarity,
} from "../src/lib/verification/fuzzy";
import {
  parsePipeDelimitedCsv,
  sanitizeCsvField,
} from "../src/lib/verification/csv-parser";
import {
  runThreeWayCrossCheck,
  StudentInputRecord,
} from "../src/lib/verification/matcher";

console.log("Starting Verification Matcher Unit Tests...\n");

// 1. Normalizer Tests
console.log("1. Testing Normalizer...");
assert.strictEqual(stripDiacritics("Peña"), "Pena");
assert.strictEqual(stripDiacritics("Níño"), "Nino");
assert.strictEqual(stripDiacritics("CAÑETE"), "CANETE");

const s1 = extractSuffix("Juan Dela Cruz Jr.");
assert.strictEqual(s1.base, "Juan Dela Cruz");
assert.strictEqual(s1.suffix, "JR");

const s2 = extractSuffix("Pedro Santos III");
assert.strictEqual(s2.base, "Pedro Santos");
assert.strictEqual(s2.suffix, "III");

const n1 = normalizeStudentName("  maria   delos  reyes  jr. ");
assert.strictEqual(n1.normalized, "MARIA DELOS REYES JR");

// Middle name compatibility
assert.strictEqual(isMiddleNameCompatible("Pedro", "P."), true);
assert.strictEqual(isMiddleNameCompatible("P.", "Pedro"), true);
assert.strictEqual(isMiddleNameCompatible("", "Pedro"), true);
assert.strictEqual(isMiddleNameCompatible(null, "Santos"), true);
assert.strictEqual(isMiddleNameCompatible("Santos", "Aquino"), false);

// Campus canonicalization
assert.strictEqual(
  canonicalizeCampus("Mindoro State University - Bongabong Campus").canonical,
  "MINSU_BONGABONG"
);
assert.strictEqual(
  canonicalizeCampus("MinSU Bongabong").canonical,
  "MINSU_BONGABONG"
);
assert.strictEqual(
  canonicalizeCampus("MinSU Calapan Campus").canonical,
  "MINSU_CALAPAN"
);
assert.strictEqual(
  canonicalizeCampus("Mindoro State University Main Campus (Victoria)").canonical,
  "MINSU_MAIN"
);

// Match key equivalence
const key1 = buildMatchKey("Peña", "Juan Jr.", "MinSU Bongabong");
const key2 = buildMatchKey("PENA", "Juan Jr.", "Mindoro State University - Bongabong Campus");
assert.strictEqual(key1, key2);
console.log("✔ Normalizer tests passed!");

// 2. Fuzzy Matching Tests
console.log("\n2. Testing Fuzzy Matching Algorithms...");
const jwIdentical = jaroWinklerSimilarity("DELA CRUZ", "DELA CRUZ");
assert.strictEqual(jwIdentical, 1.0);

// Typo: Jhon vs John
const jwTypo = jaroWinklerSimilarity("JHON", "JOHN");
assert(jwTypo >= 0.85, `Expected >= 0.85 but got ${jwTypo}`);

const sim = computeStudentSimilarity(
  { lastName: "DELA CRUZ", firstName: "JHON", middleName: "SANTOS" },
  { lastName: "DELA CRUZ", firstName: "JOHN", middleName: "SANTOS" }
);
assert(sim.totalScore >= 0.85, `Expected totalScore >= 0.85, got ${sim.totalScore}`);
console.log(`✔ Fuzzy matching tests passed! (Typo similarity score: ${sim.totalScore})`);

// 3. CSV Parser & Sanitizer Tests
console.log("\n3. Testing Pipe-Delimited CSV Parser & Sanitizer...");

// CSV formula injection protection
assert.strictEqual(sanitizeCsvField("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0");
assert.strictEqual(sanitizeCsvField("+123456"), "'+123456");
assert.strictEqual(sanitizeCsvField("@SUM(1,2)"), "'@SUM(1,2)");
assert.strictEqual(sanitizeCsvField("Juan"), "Juan");

// Valid CHED CSV parsing
const validChedCsv = `lastName|firstName|middleName|School
Dela Cruz|Juan|Santos|Mindoro State University - Bongabong Campus
Santos|Maria|Lopez|Mindoro State University - Calapan Campus
`;
const chedParsed = parsePipeDelimitedCsv(validChedCsv, "CHED");
assert.strictEqual(chedParsed.headerValid, true);
assert.strictEqual(chedParsed.validRows.length, 2);
assert.strictEqual(chedParsed.invalidRows.length, 0);

// Valid Registrar CSV parsing
const validRegCsv = `lastName|firstName|middleName|School|IDnumber
Dela Cruz|Juan|Santos|Mindoro State University - Bongabong Campus|2024-00123-BC
Reyes|Pedro|Aquino|Mindoro State University - Bongabong Campus|2024-00456-BC
`;
const regParsed = parsePipeDelimitedCsv(validRegCsv, "REGISTRAR");
assert.strictEqual(regParsed.headerValid, true);
assert.strictEqual(regParsed.validRows.length, 2);
assert.strictEqual(regParsed.validRows[0].idNumber, "2024-00123-BC");

// Malformed CSV with wrong columns & duplicate
const malformedCsv = `lastName|firstName|middleName|School
Dela Cruz|Juan|Santos|Mindoro State University - Bongabong Campus
MissingColumnsLine
Dela Cruz|Juan|Santos|Mindoro State University - Bongabong Campus
`;
const malformedParsed = parsePipeDelimitedCsv(malformedCsv, "CHED");
assert.strictEqual(malformedParsed.validRows.length, 2);
assert.strictEqual(malformedParsed.invalidRows.length, 1);
assert.strictEqual(malformedParsed.invalidRows[0].lineNumber, 3);
assert.strictEqual(malformedParsed.duplicates.length, 1);
assert.strictEqual(malformedParsed.duplicates[0].duplicateOfLine, 2);
console.log("✔ CSV Parser & Sanitizer tests passed!");

// 4. 3-Way Matching Engine Tests
console.log("\n4. Testing 3-Way Matching Logic...");

const chedList: StudentInputRecord[] = [
  // 1. Fully Verified: In CHED, In Reg, In System
  {
    lastName: "Dela Cruz",
    firstName: "Juan",
    middleName: "Santos",
    school: "Mindoro State University - Bongabong Campus",
  },
  // 2. Needs Encoding: In CHED, In Reg, NOT in System
  {
    lastName: "Santos",
    firstName: "Maria",
    middleName: "Lopez",
    school: "Mindoro State University - Bongabong Campus",
  },
  // 3. Not Enrolled: In CHED, NOT in Reg
  {
    lastName: "Alvarez",
    firstName: "Carlos",
    middleName: "Gomez",
    school: "Mindoro State University - Bongabong Campus",
  },
  // 4. Possible Match: In CHED, typo in Reg
  {
    lastName: "Mendoza",
    firstName: "Jhon", // Typo for John
    middleName: "Perez",
    school: "Mindoro State University - Bongabong Campus",
  },
];

const regList: StudentInputRecord[] = [
  {
    lastName: "Dela Cruz",
    firstName: "Juan",
    middleName: "Santos",
    school: "MinSU Bongabong",
    idNumber: "2024-00101-BC",
  },
  {
    lastName: "Santos",
    firstName: "Maria",
    middleName: "Lopez",
    school: "Mindoro State University - Bongabong Campus",
    idNumber: "2024-00102-BC",
  },
  {
    lastName: "Mendoza",
    firstName: "John", // Registrar spelling
    middleName: "Perez",
    school: "Mindoro State University - Bongabong Campus",
    idNumber: "2024-00103-BC",
  },
  // 5. Enrolled Non-Scholar: In Reg only
  {
    lastName: "Cruz",
    firstName: "Eduardo",
    middleName: "Tan",
    school: "Mindoro State University - Bongabong Campus",
    idNumber: "2024-00104-BC",
  },
];

const sysList: StudentInputRecord[] = [
  {
    lastName: "Dela Cruz",
    firstName: "Juan",
    middleName: "Santos",
    school: "Mindoro State University - Bongabong Campus",
    idNumber: "2024-00101-BC",
  },
  // 6. System Discrepancy: In System only
  {
    lastName: "Villanueva",
    firstName: "Ana",
    middleName: "Rios",
    school: "Mindoro State University - Bongabong Campus",
    idNumber: "2024-00999-BC",
  },
];

const crossCheck = runThreeWayCrossCheck({
  chedRecords: chedList,
  registrarRecords: regList,
  systemRecords: sysList,
  fuzzyThreshold: 0.85,
});

console.log("Cross-check Summary Results:", crossCheck.summary);

assert.strictEqual(crossCheck.summary.fullyVerified, 1, "Expected 1 fully verified");
assert.strictEqual(crossCheck.summary.needsEncoding, 1, "Expected 1 needs encoding");
assert.strictEqual(crossCheck.summary.notEnrolled, 1, "Expected 1 not enrolled");
assert.strictEqual(crossCheck.summary.possibleMatch, 1, "Expected 1 possible match");
assert.strictEqual(crossCheck.summary.systemDiscrepancy, 1, "Expected 1 system discrepancy");
assert.strictEqual(crossCheck.summary.enrolledNonScholar, 1, "Expected 1 enrolled non-scholar");

// Verify specific student statuses
const juan = crossCheck.results.find((r) => r.lastName === "Dela Cruz");
assert.strictEqual(juan?.status, "FULLY_VERIFIED");
assert.strictEqual(juan?.studentIdNo, "2024-00101-BC");

const maria = crossCheck.results.find((r) => r.lastName === "Santos");
assert.strictEqual(maria?.status, "NEEDS_ENCODING");
assert.strictEqual(maria?.studentIdNo, "2024-00102-BC");

const carlos = crossCheck.results.find((r) => r.lastName === "Alvarez");
assert.strictEqual(carlos?.status, "NOT_ENROLLED");

const jhon = crossCheck.results.find((r) => r.lastName === "Mendoza");
assert.strictEqual(jhon?.status, "POSSIBLE_MATCH");
assert(jhon?.confidenceScore! >= 0.85);

const ana = crossCheck.results.find((r) => r.lastName === "Villanueva");
assert.strictEqual(ana?.status, "SYSTEM_DISCREPANCY");

const eduardo = crossCheck.results.find((r) => r.lastName === "Cruz");
assert.strictEqual(eduardo?.status, "ENROLLED_NON_SCHOLAR");

console.log("✔ 3-Way Matching Engine unit tests passed completely!");
console.log("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");

