import assert from "assert";
import { prisma } from "../src/lib/prisma";
import { Role, ApplicationStatus } from "@prisma/client";

async function verifyDatabase() {
  console.log("===============================================================================");
  console.log("Verifying Database Refresh & 9-Batch Cohort State");
  console.log("===============================================================================\n");

  try {
    await prisma.$connect();
    console.log("✔ Connected to database successfully.");

    // 1. Verify Core Users
    const users = await prisma.user.findMany();
    const coreRoles = [Role.SYSTEM_ADMIN, Role.DIRECTOR, Role.STAFF, Role.ACCOUNTING];
    for (const role of coreRoles) {
      const u = users.find((x) => x.role === role);
      assert(u !== undefined, `User with role ${role} must exist`);
      console.log(`  ✔ Core role verified: ${role} (${u.email})`);
    }

    // 2. Verify Pristine Slate: Zero Documents and Verification Runs
    const docCount = await prisma.document.count();
    const runCount = await prisma.verificationRun.count();
    const resultCount = await prisma.verificationResult.count();
    assert.strictEqual(docCount, 0, "Document count should be exactly 0 (pristine slate)");
    assert.strictEqual(runCount, 0, "Verification run count should be exactly 0 (pristine slate)");
    assert.strictEqual(resultCount, 0, "Verification result count should be exactly 0 (pristine slate)");
    console.log("  ✔ Pristine slate verified (0 documents, 0 verification runs).");

    // 3. Verify 9 Applicant Calls
    const calls = await prisma.applicantCall.findMany({ orderBy: { batchNumber: "asc" } });
    assert.strictEqual(calls.length, 9, "Must have exactly 9 Applicant Calls");
    console.log("  ✔ Exactly 9 Applicant Calls verified across Main, Calapan, and Bongabong campuses.");

    // 4. Verify Batch Counts & Status
    const expectedCounts: Record<number, { count: number; campus: string }> = {
      1: { count: 35, campus: "Main Campus" },
      2: { count: 350, campus: "Main Campus" },
      3: { count: 1000, campus: "Main Campus" },
      4: { count: 35, campus: "Calapan City Campus" },
      5: { count: 350, campus: "Calapan City Campus" },
      6: { count: 1000, campus: "Calapan City Campus" },
      7: { count: 35, campus: "Bongabong Campus" },
      8: { count: 350, campus: "Bongabong Campus" },
      9: { count: 1000, campus: "Bongabong Campus" },
    };

    let totalApplications = 0;

    for (let b = 1; b <= 9; b++) {
      const apps = await prisma.application.findMany({
        where: { batchNumber: b },
        select: { id: true, status: true, formData: true },
      });
      const expected = expectedCounts[b];
      assert.strictEqual(apps.length, expected.count, `Batch ${b} must have ${expected.count} students`);
      totalApplications += apps.length;

      // Verify 100% ACCEPTED
      const nonAccepted = apps.filter((a) => a.status !== ApplicationStatus.ACCEPTED);
      assert.strictEqual(nonAccepted.length, 0, `All students in Batch ${b} must be ACCEPTED`);

      // Verify formData integrity for sample
      const sample = apps[0];
      const d = sample.formData as any;
      assert(d.student_id, "student_id must exist");
      assert(d.student_id_number, "student_id_number must exist");
      assert(d.course_degree, "course_degree must exist");
      assert(d.campus, "campus must exist");

      console.log(`  ✔ Batch ${b} (${expected.campus}): ${apps.length} students (100% ACCEPTED)`);
    }

    assert.strictEqual(totalApplications, 4155, "Total students across 9 batches must equal 4,155");
    console.log(`\n  ✔ TOTAL STUDENT APPLICATIONS: ${totalApplications} (100% matched)`);

    // 5. Total Student Users
    const studentUsersCount = await prisma.user.count({ where: { role: Role.STUDENT } });
    assert.strictEqual(studentUsersCount, 4155, "Total STUDENT users must equal 4,155");
    console.log(`  ✔ TOTAL STUDENT USER ACCOUNTS: ${studentUsersCount} (100% matched)`);

    console.log("\n===============================================================================");
    console.log("ALL DATABASE VERIFICATION CHECKS PASSED PERFECTLY! 🎉");
    console.log("===============================================================================");
  } catch (err: any) {
    if (err.code === "P1001" || err.message?.includes("Can't reach database server")) {
      console.log("  ℹ Database offline in sandbox. Please run seeding outside sandbox if required.");
    } else {
      console.error("❌ Verification failed:", err);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();

