import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { PREVIEW_PREFIX } from "@/lib/dashboard/constants";
import { getSessionUser } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";

/** Enables Next Draft Mode so the real homepage renders the Home global's
 * unpublished draft — used by the Storefront Builder's inline/Preview button. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/";
  // Rebuilding the redirect target from `request.url` breaks in this
  // container: the standalone server binds HOSTNAME=0.0.0.0 (see
  // backend/frontend Dockerfiles), and Next reflects that bind address as
  // request.url's origin instead of the Host header the browser actually
  // sent — redirecting to http://0.0.0.0:3000/, which the browser can't
  // connect to. The Host header (and x-forwarded-proto behind a proxy) is
  // what's trustworthy here.
  const host = request.headers.get("host") || requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");

  // Under PREVIEW_PREFIX rather than at `next` directly. Staying on this host
  // is what keeps the draft-mode cookie — it is host-only, and the shop's own
  // hostname would never be sent it — but on the admin host "/" is rewritten
  // to /dashboard, so the builder's iframe was previewing the dashboard.
  // proxy.ts strips the prefix and serves the storefront underneath.
  const target = `${PREVIEW_PREFIX}${next === "/" ? "" : next}`;

  return NextResponse.redirect(new URL(target, `${protocol}://${host}`));
}
