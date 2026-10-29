import { mediaSrc } from "@/lib/mediaSrc";
import { payloadFetch, payloadFetchAll } from "./payload";
import {
  toServiceForm,
  toShippingRuleForm,
  toStaffAccount,
  toStoreForm,
  type ServiceForm,
  type ShippingRuleForm,
  type StaffAccount,
  type StoreForm,
} from "./settings-types";

export * from "./settings-types";

/**
 * Reads and writes for the settings pages, over the Payload REST API with
 * the operator's own session — so each collection's access rules decide what
 * comes back and what may be written, exactly as in Payload's admin.
 *
 * Loaders throw on failure: the page's error boundary says so, rather than an
 * empty list that would read as "no delivery prices set".
 */

async function all<T>(path: string, what: string): Promise<T[]> {
  const docs = await payloadFetchAll<T>(path);
  if (!docs) throw new Error(`Impossible de charger ${what}.`);
  return docs;
}

export async function listStores(): Promise<StoreForm[]> {
  const docs = await all<Record<string, unknown>>("/api/stores?depth=0&sort=order", "les boutiques");
  return docs.map(toStoreForm);
}

export async function listShippingRules(): Promise<ShippingRuleForm[]> {
  const docs = await all<Record<string, unknown>>("/api/shipping-rules?depth=0&sort=city", "les tarifs de livraison");
  return docs.map(toShippingRuleForm);
}

export async function listServices(): Promise<ServiceForm[]> {
  // depth=1 so the image resolves to a URL for the thumbnail.
  const docs = await all<Record<string, unknown>>("/api/services?depth=1&sort=sortOrder", "les services");
  return docs.map((raw) => {
    const image = raw.image as { url?: string } | null | undefined;
    return toServiceForm(raw, image && typeof image === "object" && image.url ? mediaSrc(image.url) || "" : "");
  });
}

export async function listStaffAccounts(): Promise<StaffAccount[]> {
  const docs = await all<Record<string, unknown>>("/api/users?depth=0&sort=email", "l'équipe");
  return docs.map(toStaffAccount);
}

/** Payload's error body, as one sentence: the field-level message when there
 * is one ("Ce champ est obligatoire"), the top-level one otherwise. */
export async function payloadError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}));
  const first = data?.errors?.[0];
  return first?.data?.errors?.[0]?.message || first?.message || fallback;
}

/**
 * Creates (no id) or updates (id) one document, returning it as Payload
 * stored it — hooks included, e.g. the slug a service was given.
 */
export async function saveDoc(
  collection: string,
  id: number | undefined,
  data: Record<string, unknown>,
): Promise<{ doc: Record<string, unknown> } | { error: string }> {
  const res = await payloadFetch(id ? `/api/${collection}/${id}?depth=0` : `/api/${collection}?depth=0`, {
    body: JSON.stringify(data),
    method: id ? "PATCH" : "POST",
  });
  if (!res.ok) {
    if (res.status === 403) return { error: "Votre rôle ne permet pas cette modification." };
    return { error: await payloadError(res, "Échec de l'enregistrement.") };
  }
  const body = await res.json();
  return { doc: (body.doc ?? body) as Record<string, unknown> };
}

export async function deleteDoc(collection: string, id: number): Promise<{ error?: string }> {
  const res = await payloadFetch(`/api/${collection}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    if (res.status === 403) return { error: "Votre rôle ne permet pas cette suppression." };
    return { error: await payloadError(res, "Échec de la suppression.") };
  }
  return {};
}
