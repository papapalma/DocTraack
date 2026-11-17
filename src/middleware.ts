import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_META_COOKIE_NAME,
  verifyEdgeSessionMeta,
} from "@/lib/edge-session";
import { Role } from "@/types";

// Protected routes requiring authentication
// Note: /kiosk, /kiosk/display, and /kiosk/ticket/* remain intentionally public
// for lobby terminals and mobile QR queue tracking (with RA 10173 privacy masking).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/documents",
  "/annex-presets",
  "/queue",
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
  "/portal",
];

// Auth routes where authenticated users should be redirected to dashboard
const AUTH_ROUTES = ["/login", "/register"];

const ROLE_ROUTE_RULES: Array<{ prefix: string; allowed: Role[] }> = [
  { prefix: "/portal", allowed: ["STUDENT"] },
  { prefix: "/users", allowed: ["SYSTEM_ADMIN"] },
  { prefix: "/landing-editor", allowed: ["SYSTEM_ADMIN"] },
  { prefix: "/landing-preview", allowed: ["SYSTEM_ADMIN"] },
  { prefix: "/audit-logs", allowed: ["SYSTEM_ADMIN"] },
  { prefix: "/review", allowed: ["DIRECTOR"] },
  { prefix: "/analytics", allowed: ["DIRECTOR"] },
  { prefix: "/annex-presets", allowed: ["STAFF"] },
  { prefix: "/calls", allowed: ["STAFF"] },
  { prefix: "/outgoing", allowed: ["STAFF"] },
  { prefix: "/documents", allowed: ["DIRECTOR", "STAFF", "ACCOUNTING"] },
  { prefix: "/registrations", allowed: ["DIRECTOR", "STAFF"] },
  { prefix: "/verification", allowed: ["DIRECTOR", "STAFF"] },
  { prefix: "/certificate-editor", allowed: ["DIRECTOR", "STAFF"] },
  { prefix: "/announcements", allowed: ["DIRECTOR", "STAFF", "SYSTEM_ADMIN"] },
  { prefix: "/dashboard", allowed: ["DIRECTOR", "STAFF", "ACCOUNTING", "SYSTEM_ADMIN"] },
  { prefix: "/queue", allowed: ["DIRECTOR", "STAFF", "ACCOUNTING", "SYSTEM_ADMIN"] },
  { prefix: "/notifications", allowed: ["DIRECTOR", "STAFF", "ACCOUNTING", "SYSTEM_ADMIN"] },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function isRoleAllowedOnPath(pathname: string, role: Role): boolean {
  for (const rule of ROLE_ROUTE_RULES) {
    if (matchesPrefix(pathname, rule.prefix)) {
      return rule.allowed.includes(role);
    }
  }
  return true;
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE_NAME);
  res.cookies.delete(SESSION_META_COOKIE_NAME);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const metaCookie = request.cookies.get(SESSION_META_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );

  // Verify signed edge metadata whenever session cookies are evaluated
  const verifiedMeta =
    token && metaCookie ? await verifyEdgeSessionMeta(metaCookie) : null;

  // 1. Edge Route Protection & Role Isolation
  if (isProtected) {
    if (!token || !verifiedMeta) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "login");
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (token || metaCookie) clearAuthCookies(res);
      return res;
    }

    if (!isRoleAllowedOnPath(pathname, verifiedMeta.role)) {
      const fallback = verifiedMeta.role === "STUDENT" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthRoute) {
    if (token && verifiedMeta) {
      const home = verifiedMeta.role === "STUDENT" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
    const mode = pathname === "/register" ? "register" : "login";
    const targetUrl = new URL("/", request.url);
    targetUrl.searchParams.set("auth", mode);
    const from = request.nextUrl.searchParams.get("from");
    if (from) targetUrl.searchParams.set("from", from);
    const res = NextResponse.redirect(targetUrl);
    if (token || metaCookie) clearAuthCookies(res);
    return res;
  }

  // 2. Security Headers Enforcement
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV === "development";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ")
  );

  if (process.env.ENABLE_HSTS === "true") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  if (isProtected) {
    response.headers.set("Cache-Control", "no-store, private");
  }

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
