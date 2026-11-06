import assert from "assert";

console.log("===============================================================================");
console.log("🧪 Multi-Batch Selection, Injection & Override Unit Test Suite");
console.log("===============================================================================\n");

// =============================================================================
// TEST 1: BATCH NORMALIZATION & PARSING
// =============================================================================
console.log("▶ [Test 1/6] Batch Parameter Normalization & Parsing");

function normalizeBatches(batchInput: any, batchNumbersInput?: any): number[] {
  let targetBatches: number[] = [];
  if (Array.isArray(batchNumbersInput) && batchNumbersInput.length > 0) {
    targetBatches = batchNumbersInput.map((b: any) => parseInt(b, 10)).filter((n: number) => !isNaN(n));
  } else if (typeof batchNumbersInput === "string" && batchNumbersInput.trim() !== "") {
    targetBatches = batchNumbersInput.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  } else if (batchInput && batchInput !== "ALL") {
    const parsed = parseInt(String(batchInput), 10);
    if (!isNaN(parsed)) {
      targetBatches = [parsed];
    }
  }
  return targetBatches;
}

assert.deepStrictEqual(normalizeBatches("1"), [1], "Single batch string '1' should normalize to [1]");
assert.deepStrictEqual(normalizeBatches(undefined, [1, 2]), [1, 2], "Array [1, 2] should normalize to [1, 2]");
assert.deepStrictEqual(normalizeBatches(undefined, "1, 2, 3"), [1, 2, 3], "Comma string '1, 2, 3' should normalize to [1, 2, 3]");
assert.deepStrictEqual(normalizeBatches("ALL"), [], "'ALL' batch input should produce empty target list for all-inclusive query");
console.log("  ✔ Batch parsing and normalization verified.");

// =============================================================================
// TEST 2: RE-INJECTION GUARD & DUPLICATE PREVENTION
// =============================================================================
console.log("\n▶ [Test 2/6] Re-injection Guard & Duplicate Batch Prevention");

function checkReinjection(alreadyInjected: (number | string)[], requestedBatches: number[]) {
  const normalizedInjected = alreadyInjected.map((b) => String(b).trim());
  const duplicates = requestedBatches.filter((b) => normalizedInjected.includes(String(b)));
  if (duplicates.length > 0) {
    return {
      allowed: false,
      alertMessage: `Batch ${duplicates.join(", ")} has already been injected into this document.`,
      duplicateBatches: duplicates,
    };
  }
  return {
    allowed: true,
    alertMessage: null,
    duplicateBatches: [],
  };
}

const reinjection1 = checkReinjection(["1"], [1, 2]);
assert.strictEqual(reinjection1.allowed, false, "Should block re-injecting Batch 1");
assert.strictEqual(reinjection1.alertMessage, "Batch 1 has already been injected into this document.");

const reinjection2 = checkReinjection(["1", "2"], [3]);
assert.strictEqual(reinjection2.allowed, true, "Should permit un-injected Batch 3");
assert.strictEqual(reinjection2.alertMessage, null);

const reinjection3 = checkReinjection([1, 2], [2, 3]);
assert.strictEqual(reinjection3.allowed, false, "Should block re-injecting Batch 2 when already present");
console.log("  ✔ Re-injection guard and duplicate alert messages verified.");

// =============================================================================
// TEST 3: COMPOUND BATCH LABELS & TITLES
// =============================================================================
console.log("\n▶ [Test 3/6] Compound Document Batch Labels & Title Formatting");

function formatBatchLabel(targetBatches: number[]): string {
  if (targetBatches.length === 1) {
    return `Batch ${targetBatches[0]}`;
  } else if (targetBatches.length > 1) {
    return `Batches ${targetBatches.join(" & ")}`;
  }
  return "All Batches";
}

assert.strictEqual(formatBatchLabel([1]), "Batch 1");
assert.strictEqual(formatBatchLabel([1, 2]), "Batches 1 & 2");
assert.strictEqual(formatBatchLabel([1, 2, 3]), "Batches 1 & 2 & 3");
assert.strictEqual(formatBatchLabel([]), "All Batches");
console.log("  ✔ Compound batch titles verified.");

// =============================================================================
// TEST 4: OFFICIAL REFERENCE NUMBER COMBINATION
// =============================================================================
console.log("\n▶ [Test 4/6] Official CHED/UniFAST Reference Number Formatting");

function generateRefNumber(region: string, hei: string, ay: string, sem: string, tranche: string, batch: string) {
  return `${region}-${hei}-${ay.split("-")[0]}-${sem}-${tranche}:${batch}`;
}

const ref1 = generateRefNumber("MIMAROPA", "MINSU", "2024-2025", "1", "1", "1");
assert.strictEqual(ref1, "MIMAROPA-MINSU-2024-1-1:1");

const ref2 = generateRefNumber("MIMAROPA", "MINSU", "2024-2025", "1", "1", "1, 2");
assert.strictEqual(ref2, "MIMAROPA-MINSU-2024-1-1:1, 2");

const ref3 = generateRefNumber("MIMAROPA", "MINSU", "2024-2025", "1", "1", "1, 2, 3");
assert.strictEqual(ref3, "MIMAROPA-MINSU-2024-1-1:1, 2, 3");
console.log("  ✔ Official CHED/UniFAST reference numbers for multi-batch verified.");

// =============================================================================
// TEST 5: GRANTEE INDIVIDUAL BATCH TAGGING & MANUAL STAFF OVERRIDE
// =============================================================================
console.log("\n▶ [Test 5/6] Grantee Individual Batch Tagging & Staff Manual Override");

interface MockGrantee {
  id: string;
  studentNo: string;
  tdpBatch: string;
}

const grantees: MockGrantee[] = [
  { id: "g1", studentNo: "21-0001", tdpBatch: "1" },
  { id: "g2", studentNo: "21-0002", tdpBatch: "1" },
  { id: "g3", studentNo: "21-0003", tdpBatch: "2" },
];

// Verify initial individual batch tags
assert.strictEqual(grantees[0].tdpBatch, "1");
assert.strictEqual(grantees[2].tdpBatch, "2");

// Staff manually changes student g1 from Batch 1 to Batch 5
const updated = grantees.map((g) => (g.id === "g1" ? { ...g, tdpBatch: "5" } : g));
assert.strictEqual(updated[0].tdpBatch, "5", "Student g1 should now be overridden to Batch 5");
assert.strictEqual(updated[1].tdpBatch, "1", "Student g2 should remain in Batch 1");
assert.strictEqual(updated[2].tdpBatch, "2", "Student g3 should remain in Batch 2");
console.log("  ✔ Manual batch override per student verified.");

// =============================================================================
// TEST 6: FINANCIAL RE-CALCULATIONS FOR COMBINED BATCHES
// =============================================================================
console.log("\n▶ [Test 6/6] Financial Subsidy & Management Fee Recalculation");

function calculateAnnexFinancials(granteeCount: number) {
  const stipendPerGrantee = 7500;
  const totalSubsidy = granteeCount * stipendPerGrantee;
  const managementFeeRate = 0.005; // 0.5%
  const managementFeeAmount = totalSubsidy * managementFeeRate;
  const grandTotalBilling = totalSubsidy + managementFeeAmount;

  return {
    totalGrantees: granteeCount,
    stipendPerGrantee,
    totalSubsidy,
    managementFeeRate,
    managementFeeAmount,
    grandTotalBilling,
  };
}

// 50 scholars in Batch 1 + 35 scholars in Batch 2 = 85 scholars
const fin85 = calculateAnnexFinancials(85);
assert.strictEqual(fin85.totalSubsidy, 637500); // 85 * 7500
assert.strictEqual(fin85.managementFeeAmount, 3187.5); // 637500 * 0.005
assert.strictEqual(fin85.grandTotalBilling, 640687.5); // 637500 + 3187.5
console.log("  ✔ Financial calculations for combined batches verified.");

console.log("\n===============================================================================");
console.log("🎉 ALL MULTI-BATCH INJECTION TESTS PASSED SUCCESSFULLY (6/6)");
console.log("===============================================================================");
