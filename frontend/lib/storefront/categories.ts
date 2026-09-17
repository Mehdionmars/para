// Server-only: one category's name, resolved live from Payload by its slug.
import { CMS_URL } from "@/lib/dashboard/constants";

/**
 * The name of the category behind /shop/[slug], read from the categories
 * collection.
 *
 * /shop pages used to find their title only in the synced navigation snapshot
 * (data/nav.ts): the menu bar and its mega-menu columns. That tied whether an
 * aisle page existed to whether the menu happened to link to it. Preprod's
 * Navigation global has no items (the header falls back to code defaults), so
 * the first `npm run sync-cms` emptied the snapshot and would have turned about
 * eighty aisle pages — every one of them a real category in the CMS — into 404s.
 *
 * Returns null when the CMS answers and has no such category, and also when it
 * cannot be reached: the caller then falls back to the snapshot and the code
 * lists, which is what the page did before this existed.
 */
export async function fetchCategoryNameBySlug(slug: string): Promise<string | null> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ slug: { equals: slug } }));
  params.set("limit", "1");
  params.set("depth", "0");

  try {
    const res = await fetch(`${CMS_URL}/api/categories?${params.toString()}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { docs?: { name?: string | null }[] };
    return data.docs?.[0]?.name?.trim() || null;
  } catch {
    return null;
  }
}
