import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/dashboard/constants";

const ADMIN_HOST = "admin.paradhiver.ma";

/**
 * The host the visitor actually asked for.
 *
 * `request.nextUrl.hostname` was used here and does not reliably carry it:
 * in `next dev` it reports the server's own binding, so every request looked
 * like `localhost` no matter which name was used to reach it. The practical
 * consequence was that the storefront could not be opened locally at all —
 * every URL was rewritten into /dashboard — which is very likely why the
 * `/api/*` rewrite bug on the admin domain went unnoticed for so long.
 *
 * `x-forwarded-host` first, because behind Cloudflare and Vercel that is the
 * header carrying the original name; `host` is the direct-connection case.
 * The port is stripped: "paradhiver.test:3002" is the same host as
 * "paradhiver.test".
 */
function requestHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname;

  return raw.toLowerCase().split(":")[0].trim();
}

/**
 * The back office is served from the host whose first label is the admin one.
 *
 * Two spellings, and the second exists for a specific reason. `admin.<rest>`
 * is the production form. `admin-<env>.<zone>` is what environments have to
 * use: Cloudflare's free Universal SSL certificate covers `zone` and
 * `*.zone` and stops there, so `admin.preprod.paradhiver.ma` — two labels
 * deep — is served a certificate that does not match it and fails in the
 * browser before any of this code runs. Flattening the name to
 * `admin-preprod.paradhiver.ma` brings it back under the wildcard.
 *
 * Matching on the first label rather than a bare `startsWith` is what keeps
 * `administration.paradhiver.ma`, were it ever created, a public page.
 */
function isAdminHost(request: NextRequest) {
  const hostname = requestHost(request);
  const [label] = hostname.split(".");

  return hostname === ADMIN_HOST || label === "admin" || label.startsWith("admin-");
}

/**
 * A developer's own machine, where the whole app is served from one origin.
 *
 * In production the split is by domain: paradhiver.ma is the shop and
 * admin.paradhiver.ma is the back office, and `/dashboard` is deliberately
 * not reachable through the public name. Locally there is only one origin,
 * so the same split has to be by path — `/` is the shop and `/dashboard` is
 * the back office, which is the arrangement every other Next app uses.
 *
 * `localhost` used to be listed in `isAdminHost` above instead, which is why
 * opening http://localhost:3000/ landed on /dashboard/login: every public
 * path on that host was being rewritten into the dashboard.
 */
function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".localhost");
}

/**
 * Admin domain routing
 *
 * Production:
 *   admin.paradhiver.ma/
 *      -> /dashboard
 *
 *   admin.paradhiver.ma/products
 *      -> /dashboard/products
 *
 * Public domain:
 *   paradhiver.ma/*
 *      -> unchanged
 */
/**
 * Route handlers, on every host.
 *
 * These must never be rewritten. `/api/dashboard-auth/login` is fetched by
 * the login form, which renders on the admin domain — and the admin rewrite
 * below turned it into `/dashboard/api/dashboard-auth/login`, a path that
 * does not exist. The same went for logout, the media upload proxy and the
 * whole import flow: every route handler the dashboard calls was a 404 on the
 * one host the dashboard is served from.
 *
 * It is not a dashboard-only problem either. On any host matched by
 * `isAdminHost` — which includes bare `localhost` — the storefront's own
 * `/api/catalogue`, `/api/checkout` and `/api/search/suggest` were rewritten
 * the same way, so the shop could not be run locally at all.
 */
function isRouteHandler(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminHost = isAdminHost(request);

  // Checked before anything else: an API route is addressed the same way on
  // every domain, and rewriting one only ever produces a 404.
  if (isRouteHandler(pathname)) return NextResponse.next();

  // ------------------------------------------------------------
  // ADMIN DOMAIN
  // ------------------------------------------------------------
  if (adminHost) {
    // Already inside /dashboard → leave it alone.
    if (pathname.startsWith("/dashboard")) {
      if (
        pathname === "/dashboard/login" ||
        pathname.startsWith("/dashboard/login/")
      ) {
        return NextResponse.next();
      }

      const hasSession = request.cookies.has(SESSION_COOKIE);

      if (!hasSession) {
        const loginUrl = new URL("/dashboard/login", request.url);

        loginUrl.searchParams.set(
          "next",
          pathname + request.nextUrl.search
        );

        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    // Public-looking path on the admin domain:
    // /           → /dashboard
    // /products   → /dashboard/products
    // /orders     → /dashboard/orders
    const dashboardPath =
      pathname === "/"
        ? "/dashboard"
        : `/dashboard${pathname}`;

    const url = request.nextUrl.clone();
    url.pathname = dashboardPath;

    return NextResponse.rewrite(url);
  }

  // ------------------------------------------------------------
  // PUBLIC DOMAIN
  // ------------------------------------------------------------
  // Never expose the dashboard through the public domain.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    // Already on the login page: serve it. The previous form computed
    // `loginPath` as `pathname` in this case and then redirected to it — a
    // redirect from /dashboard/login to /dashboard/login, which browsers stop
    // with ERR_TOO_MANY_REDIRECTS. The ternary looked like it was handling
    // this case and was in fact the cause of it.
    if (pathname === "/dashboard/login") return NextResponse.next();

    // On a developer's single origin, /dashboard IS the back office and must
    // behave like one: serve it, and let the real guard decide.
    //
    // The unconditional bounce below sent /dashboard to the login page even
    // for a signed-in administrator, because it never looked at the session.
    // Authentication is not re-implemented here — app/dashboard/(app)/layout
    // already calls requireStaffUser() and redirects anyone without a valid
    // staff session. Passing through keeps that one guard the only authority.
    if (isLocalHost(requestHost(request))) return NextResponse.next();

    // Public production domain: the dashboard is not exposed here at all.
    // It lives on admin.paradhiver.ma, and that stays true.
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/login";

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run proxy for all application routes.
     *
     * Excludes Next internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};