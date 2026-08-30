import { COLLECTIONS, type CollectionCard } from "@/data/home";
import { resolveMediaUrl, type PayloadMediaRef } from "@/lib/storefront/products";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when the Collections page global is saved. */
export const COLLECTIONS_PAGE_TAG = "collections-page";

type RawCard = { title?: string; sub?: string; count?: string; image?: PayloadMediaRef };

/**
 * The `/collections` cards, live.
 *
 * The page read `COLLECTIONS` out of the generated `data/home.ts`, so the
 * whole landing page was frozen until the next `sync-cms` and redeploy —
 * even though Payload has carried a `collections-page` global for it all
 * along. The global was simply never fetched.
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
        count: c.count?.trim() || "",
        img: resolveMediaUrl(c.image) || "",
      }),
    );

  return cards.length > 0 ? cards : COLLECTIONS;
}
