import { COLLECTIONS, type CollectionCard } from "@/data/home";
import { resolveMediaUrl, type PayloadMediaRef } from "@/lib/storefront/products";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when the Collections page global is saved. */
export const COLLECTIONS_PAGE_TAG = "collections-page";

type RawCard = {
  title?: string;
  sub?: string;
  slug?: string;
  image?: PayloadMediaRef;
  products?: ({ id?: number } | number)[];
};

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The `/collections` cards, live.
 *
 * Snapshot stays the fallback, and an empty `cards` array falls back too: a
 * global nobody has filled in yet should show the last known good page, not
 * an empty one.
 */
export async function fetchCollectionCards(): Promise<CollectionCard[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/globals/collections-page?depth=1`, {
      next: { revalidate: 3600, tags: [COLLECTIONS_PAGE_TAG] },
    });
  } catch {
    return COLLECTIONS;
  }
  if (!res.ok) return COLLECTIONS;

  const data = await res.json();
  const cards = ((data.cards || []) as RawCard[])
    .filter((c) => c.title?.trim())
    .map(
      (c): CollectionCard => ({
        title: c.title!.trim(),
        sub: c.sub?.trim() || "",
        slug: c.slug?.trim() || slugifyTitle(c.title!),
        img: resolveMediaUrl(c.image) || "",
        productIds: (c.products || [])
          .map((p) => (typeof p === "object" && p ? p.id : p))
          .filter((n): n is number => Number.isInteger(n)),
      }),
    );

  return cards.length > 0 ? cards : COLLECTIONS;
}

export async function fetchCollectionBySlug(slug: string): Promise<CollectionCard | null> {
  const cards = await fetchCollectionCards();
  return cards.find((c) => c.slug === slug) ?? null;
}
