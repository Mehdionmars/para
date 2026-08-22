import { NextResponse } from "next/server";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";
import { canImport } from "@/lib/dashboard/roles";

export const maxDuration = 60;

/** Proxies a CSV/Excel upload to the backend's bulk product importer. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!canImport(user)) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const incoming = await request.formData();
  const res = await payloadFetch("/api/import/products/validate", { body: incoming, method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data?.error || "Échec de la lecture du fichier." }, { status: res.status });
  }
  return NextResponse.json(data);
}
