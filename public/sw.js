/**
 * MinSU DocTrack — Privacy-Safe Service Worker (RA 10173 Compliant)
 *
 * Security & Caching Contract:
 * 1. NEVER intercepts or caches /api/* routes (sessions, student PII, exports, SSE streams).
 * 2. NEVER caches authenticated HTML document navigations in CacheStorage.
 * 3. Precaches only public static app-shell assets and the branded /offline fallback page.
 * 4. Never force-skips waiting over an active session mid-form; waits for explicit SKIP_WAITING.
 * 5. Purges all minsu-doctrack-* caches upon CLEAR_PWA_CACHE (triggered on Sign Out or Settings).
 */

const CACHE_PREFIX = "minsu-doctrack-";
const SHELL_CACHE = "minsu-doctrack-shell-v1";

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-512x512.png",
  "/apple-touch-icon.png",
  "/logo.png",
  "/minsu-seal.png",
];

const STATIC_ASSET_PATHS = new Set([
  "/apple-touch-icon.png",
  "/logo.png",
  "/minsu-seal.png",
  "/ched-unifast.png",
]);

function isStaticShellAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    STATIC_ASSET_PATHS.has(pathname)
  );
}

function isCacheableResponse(response) {
  if (!response || response.status !== 200 || response.type !== "basic") {
    return false;
  }
  const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
  if (cacheControl.includes("no-store") || cacheControl.includes("private")) {
    return false;
  }
  return true;
}

self.addEventListener("install", (event) => {
  const isFirstInstall = !self.registration.active;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: "reload" }).then((res) => {
            if (res.ok) {
              return cache.put(url, res);
            }
            return undefined;
          })
        )
      );

      if (isFirstInstall) {
        await self.skipWaiting();
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CLEAR_PWA_CACHE") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .map((key) => caches.delete(key))
        );
      })()
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Strictly bypass all API routes, auth endpoints, exports, and SSE streams
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Do not cache the Service Worker or dynamic Web App Manifests
  if (
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/kiosk/manifest.webmanifest"
  ) {
    return;
  }

  // 1. Immutable Next.js bundles & verified public brand icons: Cache-First
  if (isStaticShellAsset(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const networkResponse = await fetch(request);
        if (isCacheableResponse(networkResponse)) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      })()
    );
    return;
  }

  // 2. HTML Document Navigations: Network-First (NEVER store HTML in CacheStorage for PII safety)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const offlineFallback = await caches.match("/offline");
          if (offlineFallback) return offlineFallback;

          return new Response(
            "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Offline | MinSU DocTrack</title></head><body style='font-family:system-ui,sans-serif;background:#F6F8F6;color:#1F2A24;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center'><div><h1 style='color:#1B5E20;margin-bottom:8px'>MinSU DocTrack is Offline</h1><p style='color:#55645B;font-size:14px'>Reconnect to the network and refresh to access live TDP Annex records.</p></div></body></html>",
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }
      })()
    );
  }
});
