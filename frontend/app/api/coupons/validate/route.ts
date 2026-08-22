import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * Proxy to the CMS coupon preview.
 *
 * Same shape as the checkout proxy: it exists to keep the CMS origin off the
 * public internet, and carries no pricing logic of its own — the discount is
 * computed once, in backend/src/lib/pricing.ts, and re-checked at checkout.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide.", ok: false }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/coupons/validate`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    return NextResponse.json({ error: "Service indisponible. Réessayez.", ok: false }, { status: 503 });
  }

  const data = await res.json().catch(() => ({ error: "Réponse invalide.", ok: false }));
  return NextResponse.json(data, { status: res.status });
}
