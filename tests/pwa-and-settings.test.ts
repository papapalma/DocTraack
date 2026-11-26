/**
 * Comprehensive Progressive Web App (PWA), Dual Manifests, Privacy-Safe Service Worker,
 * and Unified Settings Hub Verification Suite
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import manifest from "../src/app/manifest";
import { GET as getKioskManifest } from "../src/app/kiosk/manifest.webmanifest/route";
import nextConfig from "../next.config";
import {
  PWA_SHELL_CACHE_NAME,
  buildKioskManifest,
  formatBytes,
  getStartupTargetHref,
  isValidPwaStartupMode,
  purgePwaCachesOnLogout,
} from "../src/lib/pwa";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPngDimensions(relPath: string): { width: number; height: number } {
  const abs = path.join(process.cwd(), relPath);
  assert.ok(fs.existsSync(abs), `Expected icon file to exist: ${relPath}`);
  const buf = fs.readFileSync(abs);
  assert.ok(buf.length > 24, `PNG file too small: ${relPath}`);
  assert.ok(
    buf.subarray(0, 8).equals(PNG_MAGIC),
    `Invalid PNG magic header in ${relPath}`
  );
  assert.equal(
    buf.subarray(12, 16).toString("ascii"),
    "IHDR",
    `Missing IHDR chunk in ${relPath}`
  );
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

async function runTests() {
  console.log("===============================================================================");
  console.log("Starting MinSU DocTrack PWA, Service Worker Privacy & Settings Hub Test Suite");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Exact Binary PNG Icon Dimensions & Spec Compliance
  // ---------------------------------------------------------------------------
  console.log("▶ [1/6] Verifying PNG binary headers and exact pixel dimensions...");
  assert.deepEqual(readPngDimensions("public/icons/icon-192x192.png"), {
    width: 192,
    height: 192,
  });
  assert.deepEqual(readPngDimensions("public/icons/icon-512x512.png"), {
    width: 512,
    height: 512,
  });
  assert.deepEqual(readPngDimensions("public/icons/maskable-icon-512x512.png"), {
    width: 512,
    height: 512,
  });
  assert.deepEqual(readPngDimensions("public/apple-touch-icon.png"), {
    width: 180,
    height: 180,
  });
  console.log("  ✔ All 4 PWA & iOS icons verified at exact target dimensions (192x192, 512x512, maskable 512x512, 180x180).");

  // ---------------------------------------------------------------------------
  // 2. Root Manifest & Kiosk-Scoped Manifest Validation
  // ---------------------------------------------------------------------------
  console.log("\n▶ [2/6] Verifying Root & Kiosk Web App Manifest contracts...");
  const rootManifest = manifest();
  assert.equal(rootManifest.start_url, "/");
  assert.equal(rootManifest.scope, "/");
  assert.equal(rootManifest.display, "standalone");
  assert.equal(rootManifest.theme_color, "#1B5E20");
  assert.equal(rootManifest.background_color, "#F6F8F6");
  assert.ok(Array.isArray(rootManifest.icons) && rootManifest.icons.length >= 3);
  assert.ok(
    rootManifest.icons.some((i) => i.sizes === "192x192" && i.purpose === "any")
  );
  assert.ok(
    rootManifest.icons.some((i) => i.sizes === "512x512" && i.purpose === "any")
  );
  assert.ok(
    rootManifest.icons.some(
      (i) => i.sizes === "512x512" && i.purpose === "maskable"
    )
  );
  const shortcutUrls = (rootManifest.shortcuts ?? []).map((s) => s.url);
  assert.deepEqual(shortcutUrls, [
    "/dashboard",
    "/portal",
    "/kiosk",
    "/settings",
  ]);

  const kioskManifestObj = buildKioskManifest();
  assert.equal(kioskManifestObj.start_url, "/kiosk");
  assert.equal(kioskManifestObj.scope, "/kiosk");
  assert.equal(kioskManifestObj.display, "standalone");

  const kioskRes = getKioskManifest();
  assert.equal(kioskRes.status, 200);
  assert.ok(
    (kioskRes.headers.get("Content-Type") || "").includes(
      "application/manifest+json"
    )
  );
  const kioskJson = await kioskRes.json();
  assert.equal(kioskJson.short_name, "MinSU Kiosk");
  console.log("  ✔ Root ('/') and Kiosk ('/kiosk') manifests verified with shortcuts and standalone display.");

  // ---------------------------------------------------------------------------
  // 3. Startup Mode Routing & Logout Cache Purge Helper
  // ---------------------------------------------------------------------------
  console.log("\n▶ [3/6] Testing startup mode helpers and logout cache purge...");
  assert.equal(isValidPwaStartupMode("default"), true);
  assert.equal(isValidPwaStartupMode("kiosk"), true);
  assert.equal(isValidPwaStartupMode("kiosk-display"), true);
  assert.equal(isValidPwaStartupMode("evil"), false);

  assert.equal(getStartupTargetHref("default"), null);
  assert.equal(getStartupTargetHref("kiosk"), "/kiosk");
  assert.equal(getStartupTargetHref("kiosk-display"), "/kiosk/display");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2.0 KB");

  // Simulate browser window.caches + serviceWorker.controller for purgePwaCachesOnLogout
  const postedMessages: unknown[] = [];
  const store = new Map<string, boolean>([
    [PWA_SHELL_CACHE_NAME, true],
    ["minsu-doctrack-legacy-v0", true],
    ["unrelated-third-party-cache", true],
  ]);

  const g = globalThis as Record<string, unknown>;
  const prevWindow = g.window;
  try {
    g.window = {
      navigator: {
        serviceWorker: {
          controller: {
            postMessage: (msg: unknown) => postedMessages.push(msg),
          },
        },
      },
      caches: {
        keys: async () => Array.from(store.keys()),
        delete: async (k: string) => store.delete(k),
      },
    };

    const deleted = await purgePwaCachesOnLogout();
    assert.equal(deleted, 2, "Should delete only minsu-doctrack-* caches");
    assert.equal(store.has("unrelated-third-party-cache"), true);
    assert.equal(store.has(PWA_SHELL_CACHE_NAME), false);
    assert.deepEqual(postedMessages, [{ type: "CLEAR_PWA_CACHE" }]);
  } finally {
    if (prevWindow === undefined) delete g.window;
    else g.window = prevWindow;
  }
  console.log("  ✔ Startup target helpers and logout cache purge verified.");

  // ---------------------------------------------------------------------------
  // 4. Behavioral Execution of public/sw.js (RA 10173 Privacy & Update Gate)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [4/6] Executing public/sw.js in isolated VM to verify RA 10173 privacy boundaries...");
  const swSource = fs.readFileSync(
    path.join(process.cwd(), "public/sw.js"),
    "utf-8"
  );

  type Listener = (event: Record<string, unknown>) => void;
  const listeners: Record<string, Listener[]> = {};
  const cacheBuckets = new Map<string, Map<string, Response>>();
  let skipWaitingCount = 0;
  let networkOnline = true;

  const mockCaches = {
    open: async (name: string) => {
      if (!cacheBuckets.has(name)) cacheBuckets.set(name, new Map());
      const bucket = cacheBuckets.get(name)!;
      return {
        put: async (reqOrUrl: Request | string, res: Response) => {
          const key = typeof reqOrUrl === "string" ? reqOrUrl : reqOrUrl.url;
          bucket.set(
            key.startsWith("http") ? new URL(key).pathname : key,
            res
          );
        },
        keys: async () => Array.from(bucket.keys()),
      };
    },
    keys: async () => Array.from(cacheBuckets.keys()),
    delete: async (name: string) => cacheBuckets.delete(name),
    match: async (reqOrUrl: Request | string) => {
      const raw = typeof reqOrUrl === "string" ? reqOrUrl : reqOrUrl.url;
      const pathname = raw.startsWith("http") ? new URL(raw).pathname : raw;
      for (const bucket of cacheBuckets.values()) {
        if (bucket.has(pathname)) return bucket.get(pathname)!;
      }
      return undefined;
    },
  };

  const mockFetch = async (input: Request | string): Promise<Response> => {
    if (!networkOnline) {
      throw new TypeError("Failed to fetch (offline)");
    }
    const urlStr = typeof input === "string" ? input : input.url;
    const pathname = urlStr.startsWith("http")
      ? new URL(urlStr).pathname
      : urlStr;

    if (pathname === "/offline") {
      return new Response("<h1>MinSU Offline</h1>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (pathname.startsWith("/_next/static/private-test.js")) {
      const r = new Response("secret()", {
        status: 200,
        headers: { "Cache-Control": "no-store, private" },
      });
      Object.defineProperty(r, "type", { value: "basic" });
      return r;
    }
    if (pathname.startsWith("/_next/static/")) {
      const r = new Response("console.log('chunk')", {
        status: 200,
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      });
      Object.defineProperty(r, "type", { value: "basic" });
      return r;
    }
    return new Response(`<html><body>Live ${pathname}</body></html>`, {
      status: 200,
      headers: { "Content-Type": "text/html", "Cache-Control": "no-store, private" },
    });
  };

  const swSelf: Record<string, unknown> = {
    location: { origin: "https://doctrack.minsu.edu.ph" },
    registration: { active: null as unknown },
    clients: { claim: async () => {} },
    skipWaiting: async () => {
      skipWaitingCount += 1;
    },
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
  };

  const sandbox = {
    self: swSelf,
    caches: mockCaches,
    fetch: mockFetch,
    URL,
    Response,
    Set,
    Promise,
  };
  vm.runInNewContext(swSource, sandbox);

  // 4a. First install precaches /offline and calls skipWaiting
  const installPromises: Promise<unknown>[] = [];
  listeners.install[0]({
    waitUntil: (p: Promise<unknown>) => installPromises.push(p),
  });
  await Promise.all(installPromises);
  assert.equal(skipWaitingCount, 1, "First install should activate immediately");
  assert.ok(
    cacheBuckets.get(PWA_SHELL_CACHE_NAME)?.has("/offline"),
    "First install must precache /offline"
  );

  // 4b. Subsequent update install (when active worker exists) MUST NOT force skipWaiting
  (swSelf.registration as { active: unknown }).active = { state: "activated" };
  const updatePromises: Promise<unknown>[] = [];
  listeners.install[0]({
    waitUntil: (p: Promise<unknown>) => updatePromises.push(p),
  });
  await Promise.all(updatePromises);
  assert.equal(
    skipWaitingCount,
    1,
    "Update install must NOT force skipWaiting while an active session exists"
  );

  // Explicit SKIP_WAITING message triggers skipWaiting
  listeners.message[0]({ data: { type: "SKIP_WAITING" } });
  assert.equal(skipWaitingCount, 2, "SKIP_WAITING message must trigger skipWaiting");

  // 4c. /api/* requests MUST NOT be intercepted or cached
  let apiIntercepted = false;
  listeners.fetch[0]({
    request: {
      method: "GET",
      mode: "cors",
      url: "https://doctrack.minsu.edu.ph/api/registrations",
    },
    respondWith: () => {
      apiIntercepted = true;
    },
  });
  assert.equal(apiIntercepted, false, "/api/* routes must never be intercepted by SW");

  // 4d. Online HTML navigation to /dashboard MUST NOT be written to CacheStorage
  const navCapture: { promise: Promise<Response> | null } = { promise: null };
  listeners.fetch[0]({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://doctrack.minsu.edu.ph/dashboard",
    },
    respondWith: (p: Promise<Response>) => {
      navCapture.promise = p;
    },
  });
  assert.ok(navCapture.promise, "Navigation requests should be handled for offline resilience");
  const liveNavRes = await navCapture.promise;
  assert.ok((await liveNavRes.text()).includes("Live /dashboard"));
  assert.equal(
    cacheBuckets.get(PWA_SHELL_CACHE_NAME)?.has("/dashboard"),
    false,
    "Authenticated HTML navigations must NEVER be stored in CacheStorage"
  );

  // 4e. Offline HTML navigation serves precached /offline fallback
  networkOnline = false;
  const offlineCapture: { promise: Promise<Response> | null } = { promise: null };
  listeners.fetch[0]({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://doctrack.minsu.edu.ph/documents",
    },
    respondWith: (p: Promise<Response>) => {
      offlineCapture.promise = p;
    },
  });
  assert.ok(offlineCapture.promise);
  const offlineRes = await offlineCapture.promise;
  assert.ok((await offlineRes.text()).includes("MinSU Offline"));
  networkOnline = true;

  // 4f. Static immutable chunk caches cleanly, but private/no-store static response is rejected
  const chunkCapture: { promise: Promise<Response> | null } = { promise: null };
  listeners.fetch[0]({
    request: {
      method: "GET",
      mode: "no-cors",
      url: "https://doctrack.minsu.edu.ph/_next/static/chunks/app.js",
    },
    respondWith: (p: Promise<Response>) => {
      chunkCapture.promise = p;
    },
  });
  assert.ok(chunkCapture.promise);
  await chunkCapture.promise;
  assert.equal(
    cacheBuckets.get(PWA_SHELL_CACHE_NAME)?.has("/_next/static/chunks/app.js"),
    true
  );

  const privateCapture: { promise: Promise<Response> | null } = { promise: null };
  listeners.fetch[0]({
    request: {
      method: "GET",
      mode: "no-cors",
      url: "https://doctrack.minsu.edu.ph/_next/static/private-test.js",
    },
    respondWith: (p: Promise<Response>) => {
      privateCapture.promise = p;
    },
  });
  assert.ok(privateCapture.promise);
  await privateCapture.promise;
  assert.equal(
    cacheBuckets.get(PWA_SHELL_CACHE_NAME)?.has("/_next/static/private-test.js"),
    false,
    "Responses with Cache-Control: no-store/private must never be cached"
  );

  // 4g. CLEAR_PWA_CACHE purges all minsu-doctrack-* caches inside SW
  const clearPromises: Promise<unknown>[] = [];
  listeners.message[0]({
    data: { type: "CLEAR_PWA_CACHE" },
    waitUntil: (p: Promise<unknown>) => clearPromises.push(p),
  });
  await Promise.all(clearPromises);
  assert.equal(cacheBuckets.has(PWA_SHELL_CACHE_NAME), false);
  console.log("  ✔ Service Worker verified: zero PII/API caching, offline fallback works, manual update gate & logout cache clear enforced.");

  // ---------------------------------------------------------------------------
  // 5. Next.js Security Headers & Middleware Route Protection
  // ---------------------------------------------------------------------------
  console.log("\n▶ [5/6] Verifying Next.js /sw.js headers and Edge Middleware /settings RBAC...");
  assert.ok(typeof nextConfig.headers === "function");
  const headerRules = await nextConfig.headers!();
  const swRule = headerRules.find((r) => r.source === "/sw.js");
  assert.ok(swRule, "next.config.ts must define headers for /sw.js");
  const swHeaderMap = new Map(swRule.headers.map((h) => [h.key, h.value]));
  assert.equal(
    swHeaderMap.get("Cache-Control"),
    "no-cache, no-store, must-revalidate"
  );
  assert.ok((swHeaderMap.get("Content-Security-Policy") || "").includes("script-src 'self'"));

  const middlewareSrc = fs.readFileSync(
    path.join(process.cwd(), "src/middleware.ts"),
    "utf-8"
  );
  assert.ok(middlewareSrc.includes('"/settings"'));
  assert.ok(
    middlewareSrc.includes(
      '{ prefix: "/settings", allowed: ["DIRECTOR", "STAFF", "ACCOUNTING", "SYSTEM_ADMIN"] }'
    )
  );
  assert.ok(middlewareSrc.includes("/portal/profile?tab=app"));
  assert.ok(middlewareSrc.includes("manifest-src 'self'"));
  assert.ok(middlewareSrc.includes("sw\\\\.js"));
  console.log("  ✔ /sw.js no-cache + CSP headers and /settings Edge RBAC + student redirect verified.");

  // ---------------------------------------------------------------------------
  // 6. Settings UI Surfaces & Logout Integration Wiring
  // ---------------------------------------------------------------------------
  console.log("\n▶ [6/6] Verifying Settings UI surfaces, navigation links, and SessionProvider wiring...");
  const requiredFiles = [
    "src/app/(dashboard)/settings/page.tsx",
    "src/components/settings/pwa-settings-panel.tsx",
    "src/components/settings/notification-settings-panel.tsx",
    "src/components/settings/security-settings-panel.tsx",
    "src/app/offline/page.tsx",
  ];
  for (const file of requiredFiles) {
    assert.ok(
      fs.existsSync(path.join(process.cwd(), file)),
      `Expected ${file} to exist`
    );
  }

  const sidebarSrc = fs.readFileSync(
    path.join(process.cwd(), "src/components/layout/sidebar.tsx"),
    "utf-8"
  );
  assert.ok(sidebarSrc.includes('href="/settings"'), "Sidebar must link to /settings");

  const topbarSrc = fs.readFileSync(
    path.join(process.cwd(), "src/components/layout/topbar.tsx"),
    "utf-8"
  );
  assert.ok(topbarSrc.includes('href="/settings"'), "Topbar user menu must link to /settings");

  const portalProfileSrc = fs.readFileSync(
    path.join(process.cwd(), "src/app/portal/profile/page.tsx"),
    "utf-8"
  );
  assert.ok(
    portalProfileSrc.includes("PwaSettingsPanel"),
    "Student /portal/profile must render PwaSettingsPanel"
  );

  const kioskModalSrc = fs.readFileSync(
    path.join(process.cwd(), "src/components/kiosk/kiosk-pin-modal.tsx"),
    "utf-8"
  );
  assert.ok(
    kioskModalSrc.includes("usePwa"),
    "KioskPinModal must expose Kiosk PWA & startup controls"
  );

  const sessionProviderSrc = fs.readFileSync(
    path.join(process.cwd(), "src/components/providers/session-provider.tsx"),
    "utf-8"
  );
  assert.ok(
    sessionProviderSrc.includes("purgePwaCachesOnLogout"),
    "SessionProvider.logout must invoke purgePwaCachesOnLogout"
  );
  console.log("  ✔ Dashboard /settings, Sidebar, Topbar, Student Profile, Kiosk Modal, and SessionProvider verified.");

  console.log("\n===============================================================================");
  console.log("ALL PWA, SERVICE WORKER PRIVACY & SETTINGS HUB TESTS PASSED! 🎉");
  console.log("===============================================================================");
}

runTests().catch((err) => {
  console.error("PWA & Settings test suite failed:", err);
  process.exit(1);
});
