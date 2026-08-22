import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * Thin proxy to the CMS checkout endpoint.
 *
 * All pricing, shipping, availability and stock logic lives in
 * backend/src/app/api/checkout — one place, next to the database, inside a
 * transaction. This route used to re-implement price lookup and shipping
 * here, which meant two independent definitions of what an order costs and
 * no way to decrement stock atomically from outside the DB connection.
 *
 * Its remaining job is to keep the CMS origin off the public internet and to
 * pass the backend's own error messages (out of stock, product withdrawn)
 * through to the cart unchanged, so the shopper is told what actually
 * happened.
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
    res = await fetch(`${CMS_URL}/api/checkout`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    return NextResponse.json({ error: "Service de commande indisponible. Réessayez dans un instant." }, { status: 503 });
  }

  const data = await res.json().catch(() => ({ error: "Réponse invalide du service de commande." }));
  // Status is forwarded as-is: a 409 carries a real, actionable reason
  // (rupture de stock, produit retiré) that the cart displays verbatim.
  return NextResponse.json(data, { status: res.status });
}
