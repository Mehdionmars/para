import { notFound } from "next/navigation";

/**
 * Turns a mistyped dashboard URL into the dashboard's own 404.
 *
 * A nested not-found.tsx cannot do this on its own: it only answers
 * `notFound()` raised from inside its subtree, while a URL that matches no
 * route at all resolves against the *root* app/not-found.tsx — which is the
 * storefront's, so /dashboard/comandes handed a member of staff the shop's
 * branding and a link to the catalogue. (Verified in the browser before this
 * route existed.) Matching the URL here is what gives (app)/not-found.tsx
 * something to answer.
 *
 * Static segments win over a catch-all, so every real page — /dashboard,
 * /dashboard/orders, /dashboard/login — is matched before this is consulted.
 * Sitting inside (app) also means the layout's session check runs first: an
 * anonymous visitor is sent to the login page rather than being told which
 * dashboard URLs are real.
 */
export default function UnmatchedDashboardRoute(): never {
  notFound();
}
