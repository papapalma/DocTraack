import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "minsu_session_token";

// Protected routes requiring authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/documents",
  "/review",
  "/analytics",
  "/notifications",
  "/users",
  "/calls",
  "/outgoing",
];

// Auth routes where authenticated users should be redirected to dashboard
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Edge Route Protection
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthRoute) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const mode = pathname === "/register" ? "register" : "login";
    const targetUrl = new URL("/", request.url);
    targetUrl.searchParams.set("auth", mode);
    const from = request.nextUrl.searchParams.get("from");
    if (from) targetUrl.searchParams.set("from", from);
    return NextResponse.redirect(targetUrl);
  }

  // 2. Security Headers Enforcement
  const response = NextResponse.next();

  // Prevent Clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information sent in requests
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict access to sensitive browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Cross-Origin Opener Policy
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // Cross-Origin Resource Policy
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth & return JSON)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
