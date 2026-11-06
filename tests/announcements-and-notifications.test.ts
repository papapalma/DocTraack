import { PrismaClient, Role } from "@prisma/client";
import { canManageAnnouncements } from "../src/lib/rbac";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING ANNOUNCEMENTS & NOTIFICATIONS TEST SUITE");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. RBAC Unit Tests
    console.log("\n[Test Group 1] RBAC Permissions for Announcements");
    assert(canManageAnnouncements("STAFF" as Role) === true, "Staff can manage announcements");
    assert(canManageAnnouncements("DIRECTOR" as Role) === true, "Director can manage announcements");
    assert(canManageAnnouncements("SYSTEM_ADMIN" as Role) === true, "System Admin can manage announcements");
    assert(canManageAnnouncements("STUDENT" as Role) === false, "Student CANNOT manage announcements");
    assert(canManageAnnouncements("ACCOUNTING" as Role) === false, "Accounting CANNOT manage announcements");

    // 2. Integration Tests with Database
    console.log("\n[Test Group 2] Database Models & Automatic Notification Dispatch");

    const testStaffEmail = `test_staff_${Date.now()}@minsu.edu.ph`;
    const testStudent1Email = `test_stud1_${Date.now()}@minsu.edu.ph`;
    const testStudent2Email = `test_stud2_${Date.now()}@minsu.edu.ph`;

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        name: "Test Staff Coordinator",
        email: testStaffEmail,
        passwordHash: "dummyhash",
        role: Role.STAFF,
      },
    });

    // Create student 1 (opted IN to notifications)
    const student1 = await prisma.user.create({
      data: {
        name: "Test Student Subscribed",
        email: testStudent1Email,
        passwordHash: "dummyhash",
        role: Role.STUDENT,
        notifyAnnouncements: true,
      },
    });

    // Create student 2 (opted OUT of notifications)
    const student2 = await prisma.user.create({
      data: {
        name: "Test Student Muted",
        email: testStudent2Email,
        passwordHash: "dummyhash",
        role: Role.STUDENT,
        notifyAnnouncements: false,
      },
    });

    assert(student1.notifyAnnouncements === true, "Student 1 is opted-in to notifications");
    assert(student2.notifyAnnouncements === false, "Student 2 is opted-out of notifications");

    // Staff creates an announcement
    const announcement = await prisma.announcement.create({
      data: {
        title: "Test Urgent Memo: Annex 2 Deadline",
        content: "Please submit all Annex 2 forms before 5:00 PM today.",
        category: "URGENT",
        isPinned: true,
        targetAudience: "ALL",
        authorId: staffUser.id,
      },
    });

    assert(announcement.id !== undefined, "Announcement created successfully");
    assert(announcement.isPinned === true, "Announcement is marked as pinned");
    assert(announcement.category === "URGENT", "Announcement category is URGENT");

    // Simulate dispatch to subscribed students
    const subscribedStudents = await prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        active: true,
        notifyAnnouncements: true,
        id: { in: [student1.id, student2.id] },
      },
    });

    assert(subscribedStudents.length === 1, "Only opted-in student retrieved for notification");
    assert(subscribedStudents[0].id === student1.id, "Subscribed student matches student 1");

    // Insert notifications for opted-in student
    await prisma.notification.createMany({
      data: subscribedStudents.map((s) => ({
        userId: s.id,
        title: `📢 New TDP Announcement: ${announcement.title}`,
        message: announcement.content,
        link: "/portal/announcements",
      })),
    });

    // Verify student 1 received notification
    const student1Notifs = await prisma.notification.findMany({
      where: { userId: student1.id },
    });
    assert(student1Notifs.length === 1, "Student 1 received exactly 1 in-app notification");
    assert(student1Notifs[0].title.includes("Test Urgent Memo"), "Notification title contains announcement title");

    // Verify student 2 received NO notification
    const student2Notifs = await prisma.notification.findMany({
      where: { userId: student2.id },
    });
    assert(student2Notifs.length === 0, "Student 2 received 0 notifications (properly respected opt-out)");

    // Test Preference Updating
    const updatedStudent2 = await prisma.user.update({
      where: { id: student2.id },
      data: { notifyAnnouncements: true, notifyPush: true },
    });
    assert(updatedStudent2.notifyAnnouncements === true, "Student 2 preference updated to true");
    assert(updatedStudent2.notifyPush === true, "Student 2 push preference updated to true");

    // Cleanup test records
    await prisma.notification.deleteMany({
      where: { userId: { in: [student1.id, student2.id] } },
    });
    await prisma.announcement.delete({
      where: { id: announcement.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [staffUser.id, student1.id, student2.id] } },
    });
    console.log("  🧹 Test database records cleaned up successfully");

  } catch (error) {
    console.error("Test failed with exception:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

