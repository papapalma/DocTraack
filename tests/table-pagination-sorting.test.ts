import assert from "node:assert/strict";
import { resolveSortValue, compareValues } from "../src/hooks/use-table";

console.log("===============================================================================");
console.log("Running Table Pagination & Real-Data Sorting Test Suite");
console.log("===============================================================================\n");

// 1. Test resolveSortValue
console.log("▶ [Test 1/3] Testing resolveSortValue (nested dot paths, getters)...");
const sampleItem = {
  id: "doc-1",
  title: "Annex 1 Masterlist",
  annexType: {
    number: 1,
    name: "Masterlist",
  },
  createdBy: {
    name: "Juan Dela Cruz",
    role: "STAFF_COORDINATOR",
  },
  batch: 3,
};

assert.equal(resolveSortValue(sampleItem, "title"), "Annex 1 Masterlist");
assert.equal(resolveSortValue(sampleItem, "annexType.number"), 1);
assert.equal(resolveSortValue(sampleItem, "createdBy.name"), "Juan Dela Cruz");
assert.equal(resolveSortValue(sampleItem, "batch"), 3);
// Custom getter override
assert.equal(
  resolveSortValue(sampleItem, "custom_key", (item, key) => (key === "custom_key" ? "overridden" : undefined)),
  "overridden"
);
// Missing property returns empty string
assert.equal(resolveSortValue(sampleItem, "non_existent.nested"), "");
console.log("  ✔ resolveSortValue passed all direct, nested, and custom getter assertions.\n");

// 2. Test compareValues
console.log("▶ [Test 2/3] Testing compareValues (numbers, dates, strings, nulls)...");

// Numeric comparison
assert.ok(compareValues(10, 20, "asc") < 0, "10 < 20 in asc");
assert.ok(compareValues(10, 20, "desc") > 0, "10 > 20 in desc");
assert.equal(compareValues(5, 5, "asc"), 0, "5 == 5 in asc");

// String comparison with natural numeric collation ("Annex 2" vs "Annex 10")
const annexes = ["Annex 10", "Annex 2", "Annex 1", "Annex 3"];
annexes.sort((a, b) => compareValues(a, b, "asc"));
assert.deepEqual(annexes, ["Annex 1", "Annex 2", "Annex 3", "Annex 10"]);
console.log("  ✔ Natural numeric string ordering verified ('Annex 2' before 'Annex 10').");

// Chronological dates
const dateEarly = "2026-01-05T08:00:00Z";
const dateLate = "2026-06-12T12:00:00Z";
assert.ok(compareValues(dateEarly, dateLate, "asc") < 0);
assert.ok(compareValues(dateEarly, dateLate, "desc") > 0);
console.log("  ✔ Chronological date ordering verified.");

// Nulls and blanks pushed to end
assert.ok(compareValues(null, "active", "asc") > 0);
assert.ok(compareValues("active", null, "asc") < 0);
assert.ok(compareValues(undefined, 10, "asc") > 0);
console.log("  ✔ Null and undefined values consistently ordered to end.\n");

// 3. Pagination calculation math
console.log("▶ [Test 3/3] Testing Pagination Math & Bounds...");
function calculatePagination(totalItems: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalItems);
  return { totalPages, validPage, startIndex, endIndex };
}

// Case 1: 45 items, pageSize 10, page 1
const p1 = calculatePagination(45, 1, 10);
assert.equal(p1.totalPages, 5);
assert.equal(p1.validPage, 1);
assert.equal(p1.startIndex, 1);
assert.equal(p1.endIndex, 10);

// Case 2: 45 items, pageSize 10, last page (5)
const p5 = calculatePagination(45, 5, 10);
assert.equal(p5.validPage, 5);
assert.equal(p5.startIndex, 41);
assert.equal(p5.endIndex, 45);

// Case 3: 0 items
const p0 = calculatePagination(0, 1, 10);
assert.equal(p0.totalPages, 1);
assert.equal(p0.startIndex, 0);
assert.equal(p0.endIndex, 0);

// Case 4: Clamping out-of-bounds page requests (e.g. user was on page 10 and changed page size to 50)
const pClamped = calculatePagination(45, 10, 50);
assert.equal(pClamped.totalPages, 1);
assert.equal(pClamped.validPage, 1);
assert.equal(pClamped.startIndex, 1);
assert.equal(pClamped.endIndex, 45);

console.log("  ✔ Pagination index slicing and boundary clamping verified.\n");

console.log("===============================================================================");
console.log("ALL TABLE PAGINATION & REAL-DATA SORTING TESTS PASSED! 🎉");
console.log("===============================================================================");

