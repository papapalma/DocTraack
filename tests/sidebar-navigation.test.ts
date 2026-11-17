/**
 * Role-Based Sidebar Consolidation & Active-Route Matching Verification
 */

import assert from "assert";
import {
  flattenSidebarLinks,
  getActiveGroupId,
  getActiveHref,
  getSidebarEntries,
  getSidebarStorageKey,
  getValidGroupIds,
  mergeActiveGroup,
  parseStoredGroups,
} from "../src/lib/sidebar-nav";
import type { Role } from "../src/types";

console.log("===============================================================================");
console.log("Starting Sidebar Navigation Consolidation Test Suite");
console.log("===============================================================================\n");

const EXPECTED_HREFS: Record<Role, string[]> = {
  DIRECTOR: [
    "/dashboard",
    "/review",
    "/queue",
    "/documents",
    "/analytics",
    "/registrations",
    "/verification",
    "/certificate-editor",
    "/announcements",
    "/notifications",
  ],
  STAFF: [
    "/dashboard",
    "/queue",
    "/documents",
    "/documents/new",
    "/annex-presets",
    "/outgoing",
    "/calls",
    "/registrations",
    "/verification",
    "/certificate-editor",
    "/announcements",
    "/notifications",
  ],
  ACCOUNTING: [
    "/dashboard",
    "/queue",
    "/documents",
    "/documents/new",
    "/notifications",
  ],
  SYSTEM_ADMIN: [
    "/dashboard",
    "/queue",
    "/users",
    "/landing-editor",
    "/audit-logs",
    "/announcements",
    "/notifications",
  ],
  STUDENT: [
    "/portal",
    "/portal/announcements",
    "/portal/applications",
    "/portal/profile",
  ],
};

const EXPECTED_TOP_LEVEL_COUNTS: Record<Role, number> = {
  DIRECTOR: 6,
  STAFF: 5,
  ACCOUNTING: 4,
  SYSTEM_ADMIN: 4,
  STUDENT: 4,
};

console.log("▶ [1/4] Verifying role entry counts, standalone anchors, and zero lost routes...");
for (const role of Object.keys(EXPECTED_HREFS) as Role[]) {
  const entries = getSidebarEntries(role);
  assert.strictEqual(
    entries.length,
    EXPECTED_TOP_LEVEL_COUNTS[role],
    `${role} should have ${EXPECTED_TOP_LEVEL_COUNTS[role]} top-level entries`
  );
  assert.ok(
    entries.length <= 6,
    `${role} must keep top-level entries <= 6 to prevent clutter`
  );

  const links = flattenSidebarLinks(entries);
  const actualHrefs = links.map((l) => l.href);
  const uniqueHrefs = new Set(actualHrefs);
  assert.strictEqual(
    uniqueHrefs.size,
    actualHrefs.length,
    `${role} sidebar must not contain duplicate hrefs`
  );

  for (const expectedHref of EXPECTED_HREFS[role]) {
    assert.ok(
      uniqueHrefs.has(expectedHref),
      `${role} sidebar must preserve route ${expectedHref}`
    );
  }
  assert.strictEqual(
    actualHrefs.length,
    EXPECTED_HREFS[role].length,
    `${role} sidebar link count must match expected role route count`
  );
}

// Verify standalone anchors requested for STAFF and DIRECTOR
const staffEntries = getSidebarEntries("STAFF");
assert.strictEqual(staffEntries[0].type, "link");
assert.strictEqual(staffEntries[1].type, "link");
assert.strictEqual((staffEntries[1] as { href: string }).href, "/queue");

const directorEntries = getSidebarEntries("DIRECTOR");
assert.strictEqual(directorEntries[0].type, "link");
assert.strictEqual(directorEntries[1].type, "link");
assert.strictEqual((directorEntries[1] as { href: string }).href, "/review");
assert.strictEqual(directorEntries[2].type, "link");
assert.strictEqual((directorEntries[2] as { href: string }).href, "/queue");

console.log("  ✔ All 5 roles consolidated cleanly with zero missing or duplicate links.");

console.log("\n▶ [2/4] Testing active route & enclosing group resolution...");
assert.strictEqual(getActiveHref(staffEntries, "/dashboard"), "/dashboard");
assert.strictEqual(getActiveHref(staffEntries, "/documents"), "/documents");
assert.strictEqual(getActiveHref(staffEntries, "/documents/new"), "/documents/new");
assert.strictEqual(getActiveHref(staffEntries, "/documents/doc-123"), "/documents");
assert.strictEqual(getActiveHref(staffEntries, "/calls/new"), "/calls");
assert.strictEqual(getActiveHref(staffEntries, "/annex-presets"), "/annex-presets");

assert.strictEqual(getActiveGroupId(staffEntries, "/dashboard"), undefined);
assert.strictEqual(getActiveGroupId(staffEntries, "/queue"), undefined);
assert.strictEqual(getActiveGroupId(staffEntries, "/documents/new"), "staff-documents");
assert.strictEqual(getActiveGroupId(staffEntries, "/verification"), "staff-scholars");
assert.strictEqual(getActiveGroupId(staffEntries, "/notifications"), "staff-comms");

const directorDocHref = getActiveHref(directorEntries, "/analytics");
assert.strictEqual(directorDocHref, "/analytics");
assert.strictEqual(getActiveGroupId(directorEntries, directorDocHref), "director-documents");

const studentEntries = getSidebarEntries("STUDENT");
assert.strictEqual(getActiveHref(studentEntries, "/portal"), "/portal");
assert.strictEqual(getActiveHref(studentEntries, "/portal/applications"), "/portal/applications");
assert.strictEqual(getActiveHref(studentEntries, "/portal/calls/call-1"), "/portal");

console.log("  ✔ Exact routes, nested sub-routes, and enclosing group IDs resolve accurately.");

console.log("\n▶ [3/4] Testing localStorage parsing & active-group merging...");
const staffValidIds = getValidGroupIds(staffEntries);
assert.deepStrictEqual(
  parseStoredGroups(JSON.stringify(["staff-documents", "stale-id", "staff-documents"]), staffValidIds),
  ["staff-documents"]
);
assert.deepStrictEqual(parseStoredGroups("not-json{", staffValidIds), []);
assert.deepStrictEqual(parseStoredGroups(null, staffValidIds), []);
assert.deepStrictEqual(mergeActiveGroup(["staff-comms"], "staff-documents"), [
  "staff-comms",
  "staff-documents",
]);
assert.deepStrictEqual(mergeActiveGroup(["staff-documents"], "staff-documents"), [
  "staff-documents",
]);
assert.strictEqual(getSidebarStorageKey("STAFF"), "minsu-sidebar-groups:STAFF");
console.log("  ✔ Stored group sanitization and merge behavior verified.");

console.log("\n▶ [4/4] Verifying ACCOUNTING & SYSTEM_ADMIN group behavior...");
const accountingEntries = getSidebarEntries("ACCOUNTING");
assert.strictEqual(
  getActiveGroupId(accountingEntries, getActiveHref(accountingEntries, "/documents/new")),
  "accounting-annexes"
);
assert.strictEqual(
  getActiveGroupId(accountingEntries, getActiveHref(accountingEntries, "/notifications")),
  undefined
);

const adminEntries = getSidebarEntries("SYSTEM_ADMIN");
assert.strictEqual(
  getActiveGroupId(adminEntries, getActiveHref(adminEntries, "/audit-logs")),
  "admin-system"
);
assert.strictEqual(
  getActiveGroupId(adminEntries, getActiveHref(adminEntries, "/announcements")),
  "admin-comms"
);
console.log("  ✔ ACCOUNTING and SYSTEM_ADMIN grouping verified.");

console.log("\n===============================================================================");
console.log("ALL SIDEBAR NAVIGATION CONSOLIDATION TESTS PASSED");
console.log("===============================================================================");

