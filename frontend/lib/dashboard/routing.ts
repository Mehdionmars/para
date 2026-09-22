/**
 * Routing constants the proxy needs — and nothing here can throw.
 *
 * These lived in ./constants, beside CMS_URL. That module guards its own
 * configuration with a module-level `throw`, and proxy.ts imported two names
 * from it, which put the guard in the middleware's import graph.
 *
 * On a deployment with no CMS_URL the result was not the loud, local failure
 * the guard was written for. The middleware module failed to initialise, so
 * every request the matcher covers answered a bare 500 — no body, no
 * content-type, no message: the home page, every locale, /api/health, and the
 * 404 path alike. The only URLs still serving were the ones the matcher
 * excludes (anything containing a dot, and favicon.ico), which made the site
 * look uniformly dead while the build was green and the containers healthy.
 * The public domain sat like that, monitored, for days — /api/health is
 * matched too, so the probe that existed to explain an outage was taken out
 * by the same import.
 *
 * Nothing in this file reads the environment, so importing it cannot fail.
 * Keep it that way. The middleware runs ahead of every request that reaches
 * the app, which makes its import graph the worst place in the codebase to
 * put a check — a failure there has no route left to report itself on.
 */

/**
 * Cookie that carries the dashboard session token.
 *
 * Read by the proxy to decide whether a /dashboard/* request is bounced to the
 * login form; set and cleared by the dashboard-auth routes.
 */
export const SESSION_COOKIE = "dashboard_token";

/**
 * Path prefix that serves the storefront verbatim, on whatever host asked.
 *
 * The Storefront Builder previews the shop in an iframe from inside the
 * dashboard, and that iframe has to load from the dashboard's own host: draft
 * mode is carried by a host-only cookie, so a shop hostname would never
 * receive it and would render the published page instead of the draft being
 * edited.
 *
 * Asking the admin host for "/" does not work either — proxy.ts rewrites it
 * to /dashboard, which is how the builder ended up previewing itself. This
 * prefix is the exemption, stripped in proxy.ts before routing.
 */
export const PREVIEW_PREFIX = "/preview";
