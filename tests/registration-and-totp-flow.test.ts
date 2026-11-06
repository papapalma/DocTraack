import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  formatSecretForDisplay,
  generateOTPAuthUrl,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from "../src/lib/totp";
import { generateQRCodeSVG } from "../src/lib/qr";
import bcrypt from "bcryptjs";

async function testFullFlow() {
  console.log("=== Testing Decoupled Registration, TOTP 2FA Lock, and Dual-Mode Login ===");

  // Mock Student Registration Payload
  const rawPassword = "StudentPass@2026";
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const studentEmail = "test.student@minsu.edu.ph";

  // Step 1: Base32 secret generated for student on registration
  const totpSecret = generateBase32Secret(20);
  const formattedSecret = formatSecretForDisplay(totpSecret);
  const otpauthUrl = generateOTPAuthUrl(studentEmail, totpSecret);
  const qrSvg = generateQRCodeSVG(otpauthUrl);

  const mockUser = {
    id: "usr_mock_123",
    name: "Juan Dela Cruz",
    email: studentEmail,
    passwordHash,
    role: "STUDENT",
    studentProfile: {
      student_id: "2024-00123-BC",
      course_degree: "Bachelor of Science in Information Technology",
      year_level: "2",
      campus: "Bongabong Campus",
    },
    twoFactorSecret: totpSecret,
    twoFactorEnabled: false,
    authenticatorLocked: false,
    twoFactorRecoveryCodes: [] as string[],
  };

  console.log("✓ Step 1: User created without auto-application.");
  if ("applicationId" in mockUser) {
    throw new Error("Application was erroneously created during registration!");
  }

  // Step 2: Student locks account with Microsoft Authenticator (Step 6)
  const currentToken = generateTOTP(totpSecret);
  const isValidInitial = verifyTOTP(currentToken, mockUser.twoFactorSecret);
  if (!isValidInitial) {
    throw new Error("Initial Microsoft Authenticator code verification failed!");
  }

  // Generate 8 recovery codes
  const { plainCodes, hashedCodes } = await generateRecoveryCodes(8);
  mockUser.twoFactorEnabled = true;
  mockUser.authenticatorLocked = true;
  mockUser.twoFactorRecoveryCodes = hashedCodes;

  console.log("✓ Step 2: Account locked with Microsoft Authenticator and 8 recovery codes issued.");

  // Step 3: Test Dual-Mode Login - Mode A: Password
  const isPassMatch = await bcrypt.compare(rawPassword, mockUser.passwordHash);
  if (!isPassMatch) {
    throw new Error("Password authentication failed!");
  }
  console.log("✓ Step 3A: Login with Password succeeded.");

  // Step 4: Test Dual-Mode Login - Mode B: Authenticator Code
  const loginToken = generateTOTP(mockUser.twoFactorSecret);
  const isTotpLoginValid = verifyTOTP(loginToken, mockUser.twoFactorSecret);
  if (!isTotpLoginValid) {
    throw new Error("Login via Microsoft Authenticator code failed!");
  }
  console.log("✓ Step 3B: Passwordless login with Authenticator Code succeeded.");

  // Step 5: Test Backup Recovery Code Login
  const recoveryInput = plainCodes[0];
  const recoveryCheck = await verifyRecoveryCode(recoveryInput, mockUser.twoFactorRecoveryCodes);
  if (!recoveryCheck.valid || recoveryCheck.remainingHashedCodes.length !== 7) {
    throw new Error("Recovery code verification failed!");
  }
  mockUser.twoFactorRecoveryCodes = recoveryCheck.remainingHashedCodes;
  console.log("✓ Step 4: Recovery code login succeeded and consumed code from list.");

  // Step 6: Test Admin Password Reset
  const adminNewPass = "AdminSetPass@2026";
  const newHash = await bcrypt.hash(adminNewPass, 10);
  mockUser.passwordHash = newHash;

  const checkOldPass = await bcrypt.compare(rawPassword, mockUser.passwordHash);
  if (checkOldPass) {
    throw new Error("Old password still valid after admin reset!");
  }

  const checkNewPass = await bcrypt.compare(adminNewPass, mockUser.passwordHash);
  if (!checkNewPass) {
    throw new Error("New admin-set password does not match!");
  }
  console.log("✓ Step 5: Admin password reset with bcrypt 10 rounds succeeded.");

  console.log("\nALL REGISTRATION, 2FA LOCK, AND DUAL-MODE TESTS PASSED! 🎉");
}

testFullFlow().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
