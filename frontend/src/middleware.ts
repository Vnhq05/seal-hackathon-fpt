import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/live-score",
  "/hackathons",
  "/",
];

const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["SYSTEM_ADMIN"] },
  { prefix: "/lecturer", roles: ["LECTURER"] },
  { prefix: "/coordinator", roles: ["EVENT_COORDINATOR"] },
  { prefix: "/student", roles: ["FPT_STUDENT", "EXTERNAL_STUDENT"] },
  { prefix: "/ranking", roles: ["FPT_STUDENT", "EXTERNAL_STUDENT"] },
];

const LEGACY_REDIRECTS: { from: string; to: string }[] = [
  { from: "/dashboard", to: "/student" },
  { from: "/judge", to: "/lecturer" },
  { from: "/mentor", to: "/lecturer" },
  { from: "/staff", to: "/coordinator" },
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`),
  );
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractAccessToken(request: NextRequest): string | null {
  const raw = request.cookies.get("auth-storage")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      state?: { accessToken?: string | null };
    };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function extractRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp === "number" && exp * 1000 < Date.now()) {
    return null;
  }

  const role = payload.role;
  return typeof role === "string" ? role : null;
}

function isRoleAllowedForPath(pathname: string, role: string): boolean {
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return roles.includes(role);
    }
  }
  return true;
}

function getLegacyRedirect(pathname: string): string | null {
  for (const { from, to } of LEGACY_REDIRECTS) {
    if (pathname === from || pathname.startsWith(`${from}/`)) {
      return pathname.replace(from, to);
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyTarget = getLegacyRedirect(pathname);
  if (legacyTarget) {
    return NextResponse.redirect(new URL(legacyTarget, request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = extractRole(accessToken);
  if (!role || !isRoleAllowedForPath(pathname, role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|swagger).*)"],
};
