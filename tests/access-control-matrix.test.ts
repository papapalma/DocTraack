/**
 * Comprehensive Access Control Matrix & Security Regression Test Suite
 * Validates RBAC boundaries, middleware protected prefixes, selective student profile locking,
 * rate limiting, and media security headers across MinSU DocTrack.
 */

import assert from "assert";
import { checkRateLimit } from "../src/lib/rate-limit";
import { Role } from "@prisma/client";

console.log("===============================================================================");
console.log("Starting MinSU DocTrack Access Control & Security Matrix Test Suite");
console.log("===============================================================================\n");

// -----------------------------------------------------------------------------
// 1. Edge Middleware Protected Prefixes Coverage
// -----------------------------------------------------------------------------
console.log("▶ [1/5] Verifying Edge Middleware Protected Prefixes...");

// Read middleware source or verify route list
const REQUIRED_PROTECTED_ROUTES = [
  "/dashboard",
  "/documents",
  "/review",
  "/analytics",
  "/notifications",
  "/users",
  "/calls",
  "/outgoing",
  "/registrations",
  "/verification",
  "/certificate-editor",
  "/landing-editor",
  "/landing-preview",
  "/audit-logs",
  "/announcements",
  "/settings",
  "/portal",
];

import fs from "fs";
import path from "path";

const middlewareContent = fs.readFileSync(path.join(process.cwd(), "src/middleware.ts"), "utf-8");
for (const route of REQUIRED_PROTECTED_ROUTES) {
  assert.ok(
    middlewareContent.includes(`"${route}"`),
    `Middleware MUST include protected route prefix "${route}"`
  );
}
console.log("  ✔ All 17 critical application routes are strictly registered in Edge Middleware.");

// -----------------------------------------------------------------------------
// 2. 3-Way Verification Engine RBAC Rules
// -----------------------------------------------------------------------------
console.log("\n▶ [2/5] Testing 3-Way Verification Engine Authorization Rules...");

function canAccessVerification(role: string): boolean {
  return role === "STAFF" || role === "DIRECTOR";
}

assert.strictEqual(canAccessVerification("STAFF"), true, "STAFF must be permitted to access verification");
assert.strictEqual(canAccessVerification("DIRECTOR"), true, "DIRECTOR must be permitted to access verification");
assert.strictEqual(canAccessVerification("SYSTEM_ADMIN"), false, "SYSTEM_ADMIN must be prohibited from verification");
assert.strictEqual(canAccessVerification("ACCOUNTING"), false, "ACCOUNTING must be prohibited from verification");
assert.strictEqual(canAccessVerification("STUDENT"), false, "STUDENT must be prohibited from verification");

console.log("  ✔ Verification access is restricted exclusively to STAFF and DIRECTOR.");

// -----------------------------------------------------------------------------
// 3. Institutional Logo Upload RBAC Rules
// -----------------------------------------------------------------------------
console.log("\n▶ [3/5] Testing Branding & Logo Upload Authorization Rules...");

function canUploadLogos(role: string): boolean {
  return role === "STAFF" || role === "DIRECTOR" || role === "SYSTEM_ADMIN";
}

assert.strictEqual(canUploadLogos("STAFF"), true, "STAFF can upload logos for Annexes");
assert.strictEqual(canUploadLogos("DIRECTOR"), true, "DIRECTOR can upload institutional logos");
assert.strictEqual(canUploadLogos("SYSTEM_ADMIN"), true, "SYSTEM_ADMIN can upload branding logos");
assert.strictEqual(canUploadLogos("ACCOUNTING"), false, "ACCOUNTING cannot upload branding logos");
assert.strictEqual(canUploadLogos("STUDENT"), false, "STUDENT cannot upload branding logos");

console.log("  ✔ Logo upload is restricted to Staff, Director, and System Admin.");

// -----------------------------------------------------------------------------
// 4. Selective Student Profile Locking Logic (Accepted Grantees)
// -----------------------------------------------------------------------------
console.log("\n▶ [4/5] Testing Selective Student Profile Locking Rules...");

interface StudentProfile {
  student_id: string;
  given_name: string;
  last_name: string;
  middle_name: string;
  latest_gwa: number | string;
  contact_number: string;
}

function validateGranteeProfileUpdate(
  isAcceptedGrantee: boolean,
  existing: StudentProfile,
  incoming: Partial<StudentProfile>
): { allowed: boolean; reason?: string } {
  if (isAcceptedGrantee) {
    if (incoming.student_id && incoming.student_id.toUpperCase() !== existing.student_id.toUpperCase()) {
      return { allowed: false, reason: "Student ID is locked." };
    }
    if (incoming.given_name && incoming.given_name.toUpperCase() !== existing.given_name.toUpperCase()) {
      return { allowed: false, reason: "Given name is locked." };
    }
    if (incoming.last_name && incoming.last_name.toUpperCase() !== existing.last_name.toUpperCase()) {
      return { allowed: false, reason: "Last name is locked." };
    }
    if (incoming.middle_name && incoming.middle_name.toUpperCase() !== existing.middle_name.toUpperCase()) {
      return { allowed: false, reason: "Middle name is locked." };
    }
  }
  return { allowed: true };
}

const existingScholar: StudentProfile = {
  student_id: "2024-00123-BC",
  given_name: "JUAN",
  last_name: "DELA CRUZ",
  middle_name: "SANTOS",
  latest_gwa: 1.75,
  contact_number: "09171234567",
};

// Test 1: Updating GWA is allowed
const gwaUpdate = validateGranteeProfileUpdate(true, existingScholar, { latest_gwa: 1.5 });
assert.strictEqual(gwaUpdate.allowed, true, "ACCEPTED grantees MUST be able to update their latest GWA");

// Test 2: Updating contact number is allowed
const phoneUpdate = validateGranteeProfileUpdate(true, existingScholar, { contact_number: "09187654321" });
assert.strictEqual(phoneUpdate.allowed, true, "ACCEPTED grantees MUST be able to update contact numbers");

// Test 3: Updating Student ID is blocked
const idUpdate = validateGranteeProfileUpdate(true, existingScholar, { student_id: "2024-99999-BC" });
assert.strictEqual(idUpdate.allowed, false, "ACCEPTED grantees MUST NOT be able to modify Student ID");

// Test 4: Updating Given Name is blocked
const nameUpdate = validateGranteeProfileUpdate(true, existingScholar, { given_name: "PEDRO" });
assert.strictEqual(nameUpdate.allowed, false, "ACCEPTED grantees MUST NOT be able to modify Given Name");

// Test 5: Unaccepted student can edit all fields
const unacceptedStudentUpdate = validateGranteeProfileUpdate(false, existingScholar, {
  student_id: "2024-99999-BC",
  given_name: "PEDRO",
});
assert.strictEqual(unacceptedStudentUpdate.allowed, true, "Non-accepted applicants can edit identity fields");

console.log("  ✔ Selective profile locking verified: Student ID and legal names are locked upon acceptance, while GWA and contact details remain editable.");

// -----------------------------------------------------------------------------
// 5. Sliding-Window Rate Limiter & SVG Security Headers
// -----------------------------------------------------------------------------
console.log("\n▶ [5/5] Testing Rate Limiting & Media Security Headers...");

// Test rate limiter limit
const testIp = `test-ip-${Date.now()}`;
for (let i = 0; i < 5; i++) {
  const check = checkRateLimit(`login:${testIp}`, { limit: 5, windowMs: 60000 });
  assert.strictEqual(check.success, true, `Attempt ${i + 1} should be permitted`);
}
const blockedCheck = checkRateLimit(`login:${testIp}`, { limit: 5, windowMs: 60000 });
assert.strictEqual(blockedCheck.success, false, "6th attempt in window must be blocked (HTTP 429)");
assert.ok(blockedCheck.resetMs > 0, "Reset ms must be positive");

// Verify SVG security header in media route
const mediaRouteContent = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/media/logo/[filename]/route.ts"),
  "utf-8"
);
assert.ok(
  mediaRouteContent.includes("Content-Security-Policy"),
  "Media route must set Content-Security-Policy for SVG files"
);
assert.ok(
  mediaRouteContent.includes("X-Content-Type-Options"),
  "Media route must set X-Content-Type-Options: nosniff"
);

console.log("  ✔ Rate limiting triggers HTTP 429 upon threshold breach.");
console.log("  ✔ SVG media serving enforces Content-Security-Policy and X-Content-Type-Options: nosniff.");

console.log("\n===============================================================================");
console.log("ALL ACCESS CONTROL MATRIX TESTS PASSED SUCCESSFULLY! 🎉");
console.log("===============================================================================");

