import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/** Proxy to the CMS suggestion endpoint, so the CMS origin stays private.
 * The short shared-cache header is passed through from upstream. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ brands: [], categories: [], products: [] });

  try {
    const res = await fetch(`${CMS_URL}/api/search/suggest?q=${encodeURIComponent(q)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return NextResponse.json({ brands: [], categories: [], products: [] });
    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    // A failed suggestion must never break the search box — the visitor can
    // still submit the form and land on the full results page.
    return NextResponse.json({ brands: [], categories: [], products: [] });
  }
}
