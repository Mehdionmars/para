import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * Thin proxy to the CMS booking endpoint, like /api/checkout: the slot rules,
 * the double-booking guard and the staff alert all live in
 * backend/src/app/api/booking-requests. This keeps the CMS origin private and passes
 * its messages ("créneau déjà pris") through unchanged.
 *
 * The visitor's address is forwarded so the backend's rate limit counts
 * visitors rather than this one server.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/booking-requests`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(ip ? { "X-Forwarded-For": ip } : {}) },
      method: "POST",
    });
  } catch {
    return NextResponse.json({ error: "Réservation indisponible. Réessayez dans un instant." }, { status: 503 });
  }

  const data = await res.json().catch(() => ({ error: "Réponse invalide du service de réservation." }));
  return NextResponse.json(data, { status: res.status });
}
