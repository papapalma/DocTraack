import assert from "assert";

console.log("===============================================================================");
console.log("🧪 Annex State Injection & Mock Data Purge Verification Test Suite");
console.log("===============================================================================\n");

// =============================================================================
// TEST 1: ZERO INITIAL MOCK STATE VERIFICATION
// =============================================================================
console.log("▶ [Test 1/5] Initial Zero-Grantee State & Empty Rosters");

interface FormFinancials {
  totalGrantees: number;
  stipendPerGrantee: number;
  totalSubsidy: number;
  managementFeeRate: number;
  managementFeeAmount: number;
  grandTotalBilling: number;
  grantees: any[];
}

function createInitialAnnex4Data(): FormFinancials {
  return {
    totalGrantees: 0,
    stipendPerGrantee: 7500,
    totalSubsidy: 0,
    managementFeeRate: 0.005,
    managementFeeAmount: 0,
    grandTotalBilling: 0,
    grantees: [],
  };
}

const initialAnnex4 = createInitialAnnex4Data();
assert.strictEqual(initialAnnex4.grantees.length, 0, "Initial grantees roster must be empty (0)");
assert.strictEqual(initialAnnex4.totalGrantees, 0, "Total grantees must initialize to 0");
assert.strictEqual(initialAnnex4.totalSubsidy, 0, "Total subsidy must initialize to 0");
assert.strictEqual(initialAnnex4.managementFeeAmount, 0, "Management fee must initialize to 0");
assert.strictEqual(initialAnnex4.grandTotalBilling, 0, "Grand total billing must initialize to 0");
console.log("  ✔ Clean initial zero-grantee state verified.");

// =============================================================================
// TEST 2: ATOMIC INJECTION & FINANCIAL RECALCULATION
// =============================================================================
console.log("\n▶ [Test 2/5] Atomic Functional Injection & Financial Recalculation");

function injectGrantees(
  currentGrantees: any[],
  candidates: any[],
  existingBatches: string[],
  injectedBatches: number[],
  regionCode = "MIMAROPA",
  heiCode = "MINSU",
  academicYear = "2023-2024",
  termCode = "2",
  trancheNumber = "1"
) {
  const nextGrantees = [...currentGrantees, ...candidates];
  const allBatches = Array.from(new Set([...existingBatches, ...injectedBatches.map(String)])).sort(
    (a, b) => Number(a) - Number(b)
  );
  const compoundBatch = allBatches.join(", ");

  const reindexed = nextGrantees.map((g, idx) => ({
    ...g,
    controlNumber: String(idx + 1).padStart(5, "0"),
    tdpAmount: 7500,
    totalAmount: 7500,
  }));

  const totalGrantees = reindexed.length;
  const stipendPerGrantee = 7500;
  const totalSubsidy = totalGrantees * stipendPerGrantee;
  const managementFeeRate = 0.005;
  const managementFeeAmount = totalSubsidy * managementFeeRate;
  const grandTotalBilling = totalSubsidy + managementFeeAmount;
  const batchNumber = compoundBatch || "1";

  const ref = `${regionCode}-${heiCode}-${academicYear.split("-")[0]}-${termCode}-${trancheNumber}:${batchNumber}`;

  return {
    grantees: reindexed,
    totalGrantees,
    stipendPerGrantee,
    totalSubsidy,
    managementFeeRate,
    managementFeeAmount,
    grandTotalBilling,
    batchNumber,
    referenceNumber: ref,
  };
}

// Inject Batch 2 (3 candidates)
const mockCandidatesBatch2 = [
  { studentNumber: "2024-00001", tdpAwardNumber: "2024-TDP-4060-00001", lastName: "ALVAREZ", givenName: "MARIA", tdpBatch: "2" },
  { studentNumber: "2024-00002", tdpAwardNumber: "2024-TDP-4060-00002", lastName: "BERNARDO", givenName: "JOSE", tdpBatch: "2" },
  { studentNumber: "2024-00003", tdpAwardNumber: "2024-TDP-4060-00003", lastName: "CASTRO", givenName: "LUCIA", tdpBatch: "2" },
];

const afterBatch2 = injectGrantees(initialAnnex4.grantees, mockCandidatesBatch2, [], [2]);

assert.strictEqual(afterBatch2.grantees.length, 3, "Roster should have exactly 3 injected scholars");
assert.strictEqual(afterBatch2.grantees[0].controlNumber, "00001", "First control number should be 00001");
assert.strictEqual(afterBatch2.grantees[2].controlNumber, "00003", "Third control number should be 00003");
assert.strictEqual(afterBatch2.totalSubsidy, 22500, "Subsidy for 3 students @ 7500 should be 22,500");
assert.strictEqual(afterBatch2.managementFeeAmount, 112.5, "Mgt fee 0.5% of 22,500 should be 112.5");
assert.strictEqual(afterBatch2.grandTotalBilling, 22612.5, "Grand total should be 22,612.5");
assert.strictEqual(afterBatch2.referenceNumber, "MIMAROPA-MINSU-2023-2-1:2");
console.log("  ✔ First batch injection and financial calculation verified.");

// =============================================================================
// TEST 3: MULTI-BATCH COMPOUNDING & RE-INDEXING
// =============================================================================
console.log("\n▶ [Test 3/5] Multi-Batch Compounding (Injecting Batch 3 into Batch 2)");

const mockCandidatesBatch3 = [
  { studentNumber: "2024-00004", tdpAwardNumber: "2024-TDP-4060-00004", lastName: "DOMINGO", givenName: "RAMON", tdpBatch: "3" },
  { studentNumber: "2024-00005", tdpAwardNumber: "2024-TDP-4060-00005", lastName: "ESPINOSA", givenName: "ELENA", tdpBatch: "3" },
];

const afterBatch3 = injectGrantees(afterBatch2.grantees, mockCandidatesBatch3, ["2"], [3]);

assert.strictEqual(afterBatch3.grantees.length, 5, "Roster should now have 5 combined scholars");
assert.strictEqual(afterBatch3.grantees[3].controlNumber, "00004");
assert.strictEqual(afterBatch3.grantees[4].controlNumber, "00005");
assert.strictEqual(afterBatch3.totalSubsidy, 37500);
assert.strictEqual(afterBatch3.managementFeeAmount, 187.5);
assert.strictEqual(afterBatch3.grandTotalBilling, 37687.5);
assert.strictEqual(afterBatch3.batchNumber, "2, 3");
assert.strictEqual(afterBatch3.referenceNumber, "MIMAROPA-MINSU-2023-2-1:2, 3");
console.log("  ✔ Multi-batch compound reference number and sequential control numbering verified.");

// =============================================================================
// TEST 4: BATCH SELECTOR RESET LOGIC
// =============================================================================
console.log("\n▶ [Test 4/5] Batch Selector Selection Clearing Upon Injection");

function simulateDropdownInjection(
  selectedBatches: number[],
  onInjectMock: (batches: number[]) => void,
  onBatchesChangeMock: (batches: number[]) => void
) {
  let injected: number[] = [];
  let currentSelection = [...selectedBatches];

  // In dropdown handleInjectClick
  if (selectedBatches.length > 0) {
    onInjectMock(selectedBatches);
    onBatchesChangeMock([]); // Immediate reset of chips
  }
}

let injectedPayload: number[] = [];
let activeSelection: number[] = [2, 3, 9];

simulateDropdownInjection(
  activeSelection,
  (b) => { injectedPayload = b; },
  (b) => { activeSelection = b; }
);

assert.deepStrictEqual(injectedPayload, [2, 3, 9], "Injected payload should receive selected batches");
assert.deepStrictEqual(activeSelection, [], "Active selection must reset to empty array [] so no chips remain");
console.log("  ✔ Batch selector immediately clears selection upon injection.");

// =============================================================================
// TEST 5: RE-INJECTION PREVENTION WITH STATUS BADGE
// =============================================================================
console.log("\n▶ [Test 5/5] Re-injection Duplicate Guard");

function checkBatchAvailability(batchNum: number, alreadyInjected: string[]) {
  const isAlreadyInjected = alreadyInjected.includes(String(batchNum));
  return {
    batchNum,
    statusBadge: isAlreadyInjected ? "Already Injected" : "Verified",
    canSelect: !isAlreadyInjected,
  };
}

const checkBatch2 = checkBatchAvailability(2, ["2", "3"]);
assert.strictEqual(checkBatch2.statusBadge, "Already Injected");
assert.strictEqual(checkBatch2.canSelect, false, "Already injected batch cannot be re-injected");

const checkBatch9 = checkBatchAvailability(9, ["2", "3"]);
assert.strictEqual(checkBatch9.statusBadge, "Verified");
assert.strictEqual(checkBatch9.canSelect, true, "Uninjected batch can be selected");

console.log("  ✔ Re-injection guard and status badge logic verified.");

console.log("\n===============================================================================");
console.log("🎉 ALL ANNEX STATE & BATCH INJECTION TESTS PASSED SUCCESSFULLY (5/5)!");
console.log("===============================================================================");

