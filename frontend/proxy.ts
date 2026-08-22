import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/dashboard/constants";

/** Presence-only check — fast and edge-safe. Actual token validity is
 * verified server-side per request via getSessionUser() against Payload,
 * which redirects to /dashboard/login itself if the token has expired. */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/((?!login).*)"],
};
