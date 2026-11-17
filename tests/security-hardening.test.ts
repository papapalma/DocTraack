import assert from "node:assert/strict";
import path from "node:path";
import {
  signEdgeSessionMeta,
  verifyEdgeSessionMeta,
  signScopedToken,
  verifyScopedToken,
} from "../src/lib/edge-session";
import {
  checkRateLimit,
  clearFailures,
  getClientIp,
  isLockedOut,
  recordFailure,
} from "../src/lib/rate-limit";
import { decryptSecret, encryptSecret } from "../src/lib/secret-box";
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTPWithStep,
} from "../src/lib/totp";
import {
  canAccessDocument,
  canCreateAnnex,
  canExportAnnex,
  canTransmit,
} from "../src/lib/rbac";
import {
  detectImageKindFromBytes,
  resolveContainedFilePath,
  validateSafeSvg,
} from "../src/lib/upload-security";
import {
  escapeCsvCell,
  escapeHtml,
  neutralizeSpreadsheetCell,
  parseSafeAssetUrl,
  parseSafeHttpUrl,
  sanitizeDownloadFilename,
  sanitizePipeCsvCell,
} from "../src/lib/validation";

async function runTests() {
  console.log("Running MinSU DocTrack Security Hardening checks...");

  // 1. HMAC Edge Session & Scoped Tokens
  {
    const token = await signEdgeSessionMeta({
      sub: "user_123",
      role: "DIRECTOR",
      exp: Date.now() + 60_000,
    });
    const parsed = await verifyEdgeSessionMeta(token);
    assert.ok(parsed, "Valid edge session meta must verify");
    assert.equal(parsed?.sub, "user_123");
    assert.equal(parsed?.role, "DIRECTOR");

    // Tamper signature
    const [p, s] = token.split(".");
    const tamperedSig = `${p}.${s.slice(0, -2)}AA`;
    assert.equal(await verifyEdgeSessionMeta(tamperedSig), null, "Tampered signature must fail");

    // Wrong purpose must fail
    const scoped = await signScopedToken({ userId: "u1" }, "initial_2fa_lock", 30_000);
    assert.equal(await verifyScopedToken(scoped, "other_purpose"), null, "Wrong token purpose must fail");
    const okScoped = await verifyScopedToken<{ userId: string }>(scoped, "initial_2fa_lock");
    assert.equal(okScoped?.userId, "u1");
  }

  // 2. Client IP Spoofing Protection (TRUST_PROXY) & Rate Limit / Lockout
  {
    const origTrust = process.env.TRUST_PROXY;
    const origHops = process.env.TRUST_PROXY_HOPS;
    try {
      delete process.env.TRUST_PROXY;
      const forgedReq = new Request("http://localhost/api/auth/login", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", "x-real-ip": "9.9.9.9" },
      });
      assert.equal(getClientIp(forgedReq), "direct-peer", "Must ignore proxy headers when TRUST_PROXY is off");

      process.env.TRUST_PROXY = "true";
      process.env.TRUST_PROXY_HOPS = "1";
      assert.equal(getClientIp(forgedReq), "5.6.7.8", "Must read rightmost trusted hop, not leftmost spoofed header");

      process.env.TRUST_PROXY_HOPS = "2";
      assert.equal(getClientIp(forgedReq), "1.2.3.4");
    } finally {
      if (origTrust === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = origTrust;
      if (origHops === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = origHops;
    }

    const rlKey = `test-rl-${Date.now()}`;
    assert.equal(checkRateLimit(rlKey, { limit: 2, windowMs: 60_000 }).success, true);
    assert.equal(checkRateLimit(rlKey, { limit: 2, windowMs: 60_000 }).success, true);
    assert.equal(checkRateLimit(rlKey, { limit: 2, windowMs: 60_000 }).success, false);

    const lockKey = `test-lock-${Date.now()}`;
    assert.equal(isLockedOut(lockKey).locked, false);
    recordFailure(lockKey, 2, 10_000);
    const locked = recordFailure(lockKey, 2, 10_000);
    assert.equal(locked.locked, true);
    assert.equal(isLockedOut(lockKey).locked, true);
    clearFailures(lockKey);
    assert.equal(isLockedOut(lockKey).locked, false);
  }

  // 3. AES-256-GCM Secret Box & TOTP Step Verification
  {
    const rawSecret = generateBase32Secret(20);
    const sealed = encryptSecret(rawSecret);
    assert.ok(sealed.startsWith("enc:v1:"), "Encrypted TOTP secret must carry enc:v1: prefix");
    assert.equal(decryptSecret(sealed), rawSecret);
    assert.equal(decryptSecret(rawSecret), rawSecret, "Legacy plaintext fallback must continue reading cleanly");
    assert.throws(() => decryptSecret("enc:v1:broken"));

    const code = generateTOTP(rawSecret, Date.now(), 30, 6);
    const resEncrypted = verifyTOTPWithStep(code, sealed, 1, 30);
    assert.equal(resEncrypted.valid, true);
    assert.equal(typeof resEncrypted.matchedStep, "number");

    const resLegacy = verifyTOTPWithStep(code, rawSecret, 1, 30);
    assert.equal(resLegacy.valid, true);
    assert.equal(resLegacy.matchedStep, resEncrypted.matchedStep);
  }

  // 4. RBAC Annex & Document Isolation Matrix
  {
    assert.equal(canCreateAnnex("SYSTEM_ADMIN", 1), false);
    assert.equal(canCreateAnnex("DIRECTOR", 6), false);
    assert.equal(canCreateAnnex("ACCOUNTING", 6), true);
    assert.equal(canCreateAnnex("ACCOUNTING", 1), false);
    assert.equal(canCreateAnnex("STAFF", 1), true);

    assert.equal(canExportAnnex("STUDENT", 1), false);
    assert.equal(canExportAnnex("SYSTEM_ADMIN", 6), false);
    assert.equal(canExportAnnex("ACCOUNTING", 9), true);
    assert.equal(canExportAnnex("ACCOUNTING", 1), false);
    assert.equal(canExportAnnex("DIRECTOR", 1), true);

    assert.equal(
      canAccessDocument(
        { id: "acc1", role: "ACCOUNTING" },
        { status: "DRAFT", createdById: "staff1", annexType: { number: 3 } }
      ),
      false
    );
    assert.equal(
      canAccessDocument(
        { id: "acc1", role: "ACCOUNTING" },
        { status: "APPROVED", createdById: "staff1", annexType: { number: 3 } }
      ),
      true
    );
    assert.equal(
      canAccessDocument(
        { id: "dir1", role: "DIRECTOR" },
        { status: "DRAFT", createdById: "staff1", annexType: { number: 1 } }
      ),
      false
    );
    assert.equal(canTransmit("ACCOUNTING", "APPROVED", 1), false);
    assert.equal(canTransmit("ACCOUNTING", "APPROVED", 8), true);
  }

  // 5. Upload Magic Bytes, SVG Active Content & Path Traversal Containment
  {
    const pngHdr = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const jpgHdr = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    const webpHdr = Buffer.from("RIFF\x00\x00\x00\x00WEBP", "latin1");
    assert.equal(detectImageKindFromBytes(pngHdr), "png");
    assert.equal(detectImageKindFromBytes(jpgHdr), "jpeg");
    assert.equal(detectImageKindFromBytes(webpHdr), "webp");

    const fakePngHtml = Buffer.from("<script>alert(1)</script>");
    assert.equal(detectImageKindFromBytes(fakePngHtml), null);

    const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="10"/></svg>');
    assert.equal(detectImageKindFromBytes(maliciousSvg), "svg");
    assert.equal(validateSafeSvg(maliciousSvg).valid, false);

    const cleanSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    assert.equal(validateSafeSvg(cleanSvg).valid, true);

    const baseDir = path.resolve(process.cwd(), "storage", "uploads", "logos");
    assert.ok(resolveContainedFilePath(baseDir, "logo-safe.png"));
    assert.equal(resolveContainedFilePath(baseDir, "../secret.txt"), null);
    assert.equal(resolveContainedFilePath(baseDir, "sub/file.png"), null);
  }

  // 6. Export Injection & URL / HTML Sanitization
  {
    assert.equal(escapeHtml(`<script>"a"&'b'</script>`), "&lt;script&gt;&quot;a&quot;&amp;&#39;b&#39;&lt;&#x2F;script&gt;");
    assert.equal(neutralizeSpreadsheetCell("=CMD|'/C calc'!A0"), "'=CMD|'/C calc'!A0");
    assert.equal(neutralizeSpreadsheetCell("+1+1"), "'+1+1");
    assert.equal(escapeCsvCell(`=1+1,"hi"`), `"'=1+1,""hi"""`);
    assert.equal(sanitizePipeCsvCell("=cmd|pipe\nbreak"), "'=cmd pipe break");
    assert.equal(sanitizeDownloadFilename("../../etc/passwd\r\n.xlsx"), "etc_passwd_.xlsx");

    assert.equal(parseSafeHttpUrl("javascript:alert(1)"), null);
    assert.equal(parseSafeHttpUrl("https://drive.google.com/file/d/123"), "https://drive.google.com/file/d/123");
    assert.equal(parseSafeAssetUrl("//evil.com/x.png"), null);
    assert.equal(parseSafeAssetUrl("/api/media/logo/a.png"), "/api/media/logo/a.png");
  }

  console.log("PASS: All security hardening verification assertions succeeded.");
}

runTests().catch((err) => {
  console.error("Security hardening test failure:", err);
  process.exit(1);
});

