import { NextResponse } from "next/server";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";
import { canImport } from "@/lib/dashboard/roles";

export const maxDuration = 60;

/** Proxies one batch of the bulk product import to the backend. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!canImport(user)) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await request.text();
  const res = await payloadFetch("/api/import/products/run", { body, method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data?.error || "Échec de l'import." }, { status: res.status });
  }
  return NextResponse.json(data);
}
