"use server";

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";
import { payloadFetch } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";
import { getSessionUser } from "@/lib/dashboard/payload";

const execFileAsync = promisify(execFile);

/** The storefront's non-preview render path reads the static, sync-cms-
 * generated data/home.ts snapshot (same fast-path convention as every other
 * synced collection here) — Publishing to Payload alone doesn't change that
 * file. Re-running the sync here is what actually makes a publish visible on
 * the live site immediately, instead of only after someone manually runs
 * `npm run sync-cms`. This assumes a writable Node runtime (true for this
 * project's local/self-hosted deployment); a serverless host would need a
 * different trigger (e.g. a rebuild webhook) instead of this exact call. */
async function resyncStorefrontContent(): Promise<void> {
  const frontendDir = path.join(process.cwd());
  await execFileAsync(process.execPath, [path.join(frontendDir, "scripts", "sync-cms.mjs")], {
    cwd: frontendDir,
    timeout: 30_000,
  });
}

export type ProductSearchResult = { id: number; slug: string; name: string; brand: string };

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return [];
  if (query.trim().length < 2) return [];

  const params = new URLSearchParams({
    "where[name][like]": query.trim(),
    depth: "1",
    limit: "15",
    sort: "name",
  });
  const res = await payloadFetch(`/api/products?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || []).map((p: { id: number; slug?: string; name: string; brand?: { name?: string } | number }) => ({
    id: p.id,
    slug: p.slug || String(p.id),
    name: p.name,
    brand: typeof p.brand === "object" && p.brand ? p.brand.name || "" : "",
  }));
}

export async function saveHomeDraft(data: Record<string, unknown>): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/home?draft=true", {
    body: JSON.stringify({ ...data, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'enregistrement du brouillon." };
  }
  return {};
}

/** "Discard draft" — overwrites the current draft with the last published
 * version's data (fetched from Payload, not draft=true), so an admin can
 * back out of unwanted changes without hand-undoing each field. Still just
 * Payload's own draft/publish state, no parallel history store. */
export async function discardDraft(): Promise<{ home?: Record<string, unknown>; error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const publishedRes = await payloadFetch("/api/globals/home?depth=2");
  if (!publishedRes.ok) return { error: "Impossible de charger la dernière version publiée." };
  const published = await publishedRes.json();

  const res = await payloadFetch("/api/globals/home?draft=true", {
    body: JSON.stringify({ ...published, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'annulation du brouillon." };
  }
  return { home: published };
}

export async function publishHome(data: Record<string, unknown>): Promise<{ error?: string; warning?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/home", {
    body: JSON.stringify({ ...data, _status: "published" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de la publication." };
  }

  try {
    await resyncStorefrontContent();
  } catch {
    revalidatePath("/");
    return { warning: "Publié dans Payload, mais la synchronisation du storefront a échoué — exécutez `npm run sync-cms` manuellement." };
  }

  revalidatePath("/");
  return {};
}

// ---- Global chrome (Top Bar / Header / Footer) — same draft/publish shape
// as Home, against the separate "site-chrome" global. ----

export async function saveSiteChromeDraft(data: Record<string, unknown>): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/site-chrome?draft=true", {
    body: JSON.stringify({ ...data, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'enregistrement du brouillon." };
  }
  return {};
}

export async function discardSiteChromeDraft(): Promise<{ chrome?: Record<string, unknown>; error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const publishedRes = await payloadFetch("/api/globals/site-chrome?depth=2");
  if (!publishedRes.ok) return { error: "Impossible de charger la dernière version publiée." };
  const published = await publishedRes.json();

  const res = await payloadFetch("/api/globals/site-chrome?draft=true", {
    body: JSON.stringify({ ...published, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'annulation du brouillon." };
  }
  return { chrome: published };
}

export async function publishSiteChrome(data: Record<string, unknown>): Promise<{ error?: string; warning?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/site-chrome", {
    body: JSON.stringify({ ...data, _status: "published" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de la publication." };
  }

  try {
    await resyncStorefrontContent();
  } catch {
    revalidatePath("/");
    return { warning: "Publié dans Payload, mais la synchronisation du storefront a échoué — exécutez `npm run sync-cms` manuellement." };
  }

  revalidatePath("/");
  return {};
}

// ---- Theme (site-wide colors) — same draft/publish shape, against the
// separate "theme" global. ----

export async function saveThemeDraft(data: Record<string, unknown>): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/theme?draft=true", {
    body: JSON.stringify({ ...data, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'enregistrement du brouillon." };
  }
  return {};
}

export async function discardThemeDraft(): Promise<{ theme?: Record<string, unknown>; error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const publishedRes = await payloadFetch("/api/globals/theme?depth=0");
  if (!publishedRes.ok) return { error: "Impossible de charger la dernière version publiée." };
  const published = await publishedRes.json();

  const res = await payloadFetch("/api/globals/theme?draft=true", {
    body: JSON.stringify({ ...published, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'annulation du brouillon." };
  }
  return { theme: published };
}

export async function publishTheme(data: Record<string, unknown>): Promise<{ error?: string; warning?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/theme", {
    body: JSON.stringify({ ...data, _status: "published" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de la publication." };
  }

  try {
    await resyncStorefrontContent();
  } catch {
    revalidatePath("/");
    return { warning: "Publié dans Payload, mais la synchronisation du storefront a échoué — exécutez `npm run sync-cms` manuellement." };
  }

  revalidatePath("/");
  return {};
}

// ---- Navigation (main nav + every mega menu) — same draft/publish shape,
// against the separate "navigation" global. ----

export async function saveNavigationDraft(data: Record<string, unknown>): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/navigation?draft=true&depth=1", {
    body: JSON.stringify({ ...data, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'enregistrement du brouillon." };
  }
  return {};
}

export async function discardNavigationDraft(): Promise<{ navigation?: Record<string, unknown>; error?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const publishedRes = await payloadFetch("/api/globals/navigation?depth=1");
  if (!publishedRes.ok) return { error: "Impossible de charger la dernière version publiée." };
  const published = await publishedRes.json();

  const res = await payloadFetch("/api/globals/navigation?draft=true", {
    body: JSON.stringify({ ...published, _status: "draft" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de l'annulation du brouillon." };
  }
  return { navigation: published };
}

export async function publishNavigation(data: Record<string, unknown>): Promise<{ error?: string; warning?: string }> {
  const user = await getSessionUser();
  if (!user || !canEditContent(user)) return { error: "Non autorisé." };

  const res = await payloadFetch("/api/globals/navigation?depth=1", {
    body: JSON.stringify({ ...data, _status: "published" }),
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.errors?.[0]?.message || "Échec de la publication." };
  }

  try {
    await resyncStorefrontContent();
  } catch {
    revalidatePath("/");
    return { warning: "Publié dans Payload, mais la synchronisation du storefront a échoué — exécutez `npm run sync-cms` manuellement." };
  }

  revalidatePath("/");
  return {};
}
