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

  // Forwarded, not generated here. A key minted in this proxy would be a new
  // one on every attempt — including the retry it is supposed to recognise —
  // so it has to come from the browser, which is the only place that knows
  // "this is the same checkout I already tried". Dropping it (which this
  // route did until now) left the backend's whole idempotency layer inert:
  // the mechanism was there, correct, and nothing ever exercised it.
  //
  // Validated rather than passed through: the header reaches a database
  // column and a log line, and this is the boundary where an arbitrary
  // client string stops being arbitrary. Same rule as the backend's
  // isValidKey, applied early so a malformed one is simply not forwarded
  // instead of turning a real order into a 400.
  const clientKey = request.headers.get("idempotency-key");
  const idempotencyKey =
    clientKey && /^[A-Za-z0-9_.:-]{8,200}$/.test(clientKey) ? clientKey : null;

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/checkout`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
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
