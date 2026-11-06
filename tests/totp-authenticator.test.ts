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

async function runTests() {
  console.log("=== Testing TOTP & Microsoft Authenticator Engine ===");

  // 1. Secret generation
  const secret = generateBase32Secret(20);
  if (!secret || secret.length < 32) {
    throw new Error(`Invalid secret generated: ${secret}`);
  }
  console.log("✓ Base32 Secret generation passed:", secret.length, "chars");

  // 2. Secret formatting
  const formatted = formatSecretForDisplay(secret);
  if (!formatted.includes(" ")) {
    throw new Error(`Secret formatting failed: ${formatted}`);
  }
  console.log("✓ Secret formatting passed:", formatted);

  // 3. TOTP generation & verification
  const code = generateTOTP(secret);
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`Invalid 6-digit TOTP code: ${code}`);
  }
  console.log("✓ TOTP generation passed:", code);

  const isValidCurrent = verifyTOTP(code, secret);
  if (!isValidCurrent) {
    throw new Error("Current TOTP token verification failed!");
  }
  console.log("✓ Immediate TOTP verification passed");

  // 4. Drift tolerance (-30s, +30s)
  const pastCode = generateTOTP(secret, Date.now() - 28000);
  if (!verifyTOTP(pastCode, secret)) {
    throw new Error("TOTP -30s drift verification failed!");
  }
  console.log("✓ Past -30s drift tolerance passed");

  const futureCode = generateTOTP(secret, Date.now() + 28000);
  if (!verifyTOTP(futureCode, secret)) {
    throw new Error("TOTP +30s drift verification failed!");
  }
  console.log("✓ Future +30s drift tolerance passed");

  const invalidCode = "000000";
  // Small chance random code is 000000, but test with wrong code
  const isInvalidRejected = !verifyTOTP(code === invalidCode ? "999999" : invalidCode, secret);
  if (!isInvalidRejected) {
    throw new Error("Invalid TOTP was erroneously accepted!");
  }
  console.log("✓ Invalid code rejection passed");

  // 5. URL generation
  const otpUrl = generateOTPAuthUrl("student@minsu.edu.ph", secret);
  if (!otpUrl.startsWith("otpauth://totp/") || !otpUrl.includes("Mindoro%20State%20University")) {
    throw new Error(`Invalid otpauth URL: ${otpUrl}`);
  }
  console.log("✓ Microsoft Authenticator otpauth URL passed:", otpUrl);

  // 6. Vector QR Code generation
  const qrSvg = generateQRCodeSVG(otpUrl);
  if (!qrSvg.includes("<svg") || !qrSvg.includes("</svg>") || !qrSvg.includes("<path")) {
    throw new Error("QR Code SVG generation failed");
  }
  console.log("✓ Vector QR Code SVG generated successfully:", qrSvg.length, "bytes");

  // 7. Emergency Backup Recovery Codes
  const { plainCodes, hashedCodes } = await generateRecoveryCodes(8);
  if (plainCodes.length !== 8 || hashedCodes.length !== 8) {
    throw new Error("Recovery codes count mismatch");
  }
  console.log("✓ 8 Emergency recovery codes generated");

  const check1 = await verifyRecoveryCode(plainCodes[0], hashedCodes);
  if (!check1.valid || check1.remainingHashedCodes.length !== 7) {
    throw new Error("Recovery code verification or invalidation failed");
  }
  console.log("✓ Recovery code verification & single-use invalidation passed");

  const checkReuse = await verifyRecoveryCode(plainCodes[0], check1.remainingHashedCodes);
  if (checkReuse.valid) {
    throw new Error("Used recovery code was erroneously accepted twice!");
  }
  console.log("✓ Recovery code cannot be reused (one-time guarantee passed)");

  console.log("\nALL TOTP & AUTHENTICATOR TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

