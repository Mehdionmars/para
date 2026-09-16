// Server-only: one brand, resolved live from Payload by its slug.
import { CMS_URL } from "@/lib/dashboard/constants";
import { CmsUnavailableError, type PayloadMediaRef, resolveMediaUrl } from "@/lib/storefront/products";

export type BrandPageData = {
  id: number;
  name: string;
  slug: string;
  /** Resolved media URL, or null when no logo has been uploaded. */
  logo: string | null;
};

/**
 * The brand behind /marques/[slug], read from the brands collection itself.
 *
 * Not from the catalogue facets, which is what the brand page used to do:
 * facets only list brands that currently have a product on sale, so every
 * brand with nothing published — Vichy, La Roche-Posay, Avène on this shop,
 * all of them on the home page's brand wall with a logo — answered 404.
 * "This brand does not exist" and "this brand has nothing on sale yet" are
 * different pages, and only the first is a 404.
 *
 * Returns null when Payload answers and has no such brand. An unreachable CMS
 * throws instead, so an outage is a 500 and never a false "not found".
 */
export async function fetchBrandBySlug(slug: string): Promise<BrandPageData | null> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ slug: { equals: slug } }));
  params.set("limit", "1");
  params.set("depth", "1");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/brands?${params.toString()}`, { next: { revalidate: 300 } });
  } catch (err) {
    throw new CmsUnavailableError(err);
  }
  if (!res.ok) throw new CmsUnavailableError(`HTTP ${res.status}`);

  const data = (await res.json()) as {
    docs?: { id: number; name: string; slug?: string | null; logo?: PayloadMediaRef }[];
  };
  const doc = data.docs?.[0];
  if (!doc) return null;

  return {
    id: doc.id,
    logo: resolveMediaUrl(doc.logo) || null,
    name: doc.name,
    slug: doc.slug || slug,
  };
}
