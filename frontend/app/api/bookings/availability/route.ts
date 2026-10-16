import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

/** Proxy to the CMS availability endpoint. Never cached: a slot taken a
 * second ago must show as taken. */
export async function GET(request: Request) {
  const serviceId = new URL(request.url).searchParams.get("serviceId") ?? "";
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  try {
    const res = await fetch(`${CMS_URL}/api/booking-requests/availability?serviceId=${encodeURIComponent(serviceId)}`, {
      cache: "no-store",
      headers: ip ? { "X-Forwarded-For": ip } : undefined,
    });
    const data = await res.json().catch(() => ({ error: "Réponse invalide." }));
    return NextResponse.json(data, { status: res.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Disponibilités indisponibles." }, { status: 503 });
  }
}
