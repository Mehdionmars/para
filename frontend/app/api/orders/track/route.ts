import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * Proxy to the CMS guest-tracking endpoint, so the CMS origin stays private.
 * All verification (order number + email must match) happens server-side in
 * backend/src/app/api/orders/track/route.ts.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/orders/track`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    return NextResponse.json({ error: "Service indisponible. Réessayez." }, { status: 503 });
  }

  const data = await res.json().catch(() => ({ error: "Réponse invalide." }));
  return NextResponse.json(data, { status: res.status });
}
