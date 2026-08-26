import { NextResponse } from "next/server";
import { canEditContent } from "@/lib/dashboard/roles";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";

/** Mirrors backend/src/collections/Media.ts. Checked here as well as there so
 * the browser gets a French message instead of Payload's 4xx, and so an
 * oversized file is rejected before being streamed to the CMS. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

/** Proxies an image upload to Payload's Media collection (which stores it in
 * Cloudinary via the backend's storage adapter) and returns the created doc. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  // `getSessionUser()` alone used to be the gate, so any signed-in account —
  // including `customer`, which has no other write anywhere — could add media.
  // Uploading is a content edit, and is gated like one.
  if (!user || !canEditContent(user)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Format non pris en charge — utilisez JPEG, PNG, WebP, AVIF ou GIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Image trop volumineuse (${Math.round(file.size / 1024 / 1024)} Mo, limite 10 Mo).` },
      { status: 413 },
    );
  }

  const forward = new FormData();
  forward.append("file", file, (file as File).name || "upload");
  forward.append("_payload", JSON.stringify({ alt: String(incoming.get("alt") || "Produit Para d'Hiver") }));

  const res = await payloadFetch("/api/media", { body: forward, method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data?.errors?.[0]?.message || "Échec de l'upload." }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ id: data.doc.id, url: data.doc.url, alt: data.doc.alt || "" });
}

/** Looks up an existing Media doc's alt text (for the ImagePicker to show
 * when a field already references an uploaded image). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const res = await payloadFetch(`/api/media/${id}`);
  if (!res.ok) return NextResponse.json({ error: "Image introuvable." }, { status: res.status });
  const data = await res.json();
  return NextResponse.json({ alt: data.alt || "" });
}

/** Updates an existing Media doc's alt text — never creates a new upload,
 * so re-editing alt text doesn't duplicate media. */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id, alt } = await request.json().catch(() => ({ id: null, alt: null }));
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const res = await payloadFetch(`/api/media/${id}`, { body: JSON.stringify({ alt: alt || "" }), method: "PATCH" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data?.errors?.[0]?.message || "Échec de la mise à jour." }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
