import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";
import { mediaSrc } from "@/lib/mediaSrc";

type SuggestPayload = {
  brands?: unknown[];
  categories?: unknown[];
  products?: { image?: string | null; [k: string]: unknown }[];
};

const EMPTY = { brands: [], categories: [], products: [] };

/** Proxy to the CMS suggestion endpoint, so the CMS origin stays private.
 * The short shared-cache header is passed through from upstream.
 *
 * Product images are rewritten on the way out. Payload reports its own files
 * as `/api/media/file/<name>`, which is a route on the *backend*; served to a
 * browser against the storefront's origin it is a 404, and the `next/image`
 * optimiser wrapping it answers 400. Every thumbnail in the search panel was
 * broken in production because of it — desktop dropdown and mobile overlay
 * alike — while the rest of the page rendered perfectly, which is exactly the
 * failure `mediaSrc` was written for and why its doc says it never shows up in
 * local development.
 *
 * This is the right seam for it: the one place a CMS-shaped payload becomes a
 * browser-shaped one. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json(EMPTY);

  try {
    const res = await fetch(`${CMS_URL}/api/search/suggest?q=${encodeURIComponent(q)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return NextResponse.json(EMPTY);

    const data = (await res.json()) as SuggestPayload;
    const products = (data.products ?? []).map((p) => ({ ...p, image: mediaSrc(p.image) || null }));

    return NextResponse.json(
      { ...data, products },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch {
    // A failed suggestion must never break the search box — the visitor can
    // still submit the form and land on the full results page.
    return NextResponse.json(EMPTY);
  }
}
