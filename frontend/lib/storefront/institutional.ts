import type { LexicalRoot } from "@/lib/storefront/richText";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when an institutional page is saved. */
export const PAGES_TAG = "pages";

/**
 * The slugs that have a route in this app. Kept in sync by hand with
 * PAGE_SLUGS in backend/src/collections/Pages.ts — the CMS restricts the
 * field to this same list, so a page can never be saved under a slug that has
 * nowhere to render.
 */
export const INSTITUTIONAL_SLUGS = [
  "a-propos",
  "cgv",
  "mentions-legales",
  "politique-confidentialite",
  "livraison",
  "retours",
] as const;

export type InstitutionalSlug = (typeof INSTITUTIONAL_SLUGS)[number];

export type PageSection = { title: string; body: LexicalRoot | null };

export type InstitutionalPage = {
  title: string;
  slug: string;
  status: "draft" | "published";
  intro: string;
  sections: PageSection[];
  updatedAt: string | null;
  seo: { metaTitle: string; metaDescription: string };
};

type RawPage = {
  title?: string;
  slug?: string;
  status?: string;
  intro?: string;
  sections?: { title?: string; body?: LexicalRoot }[];
  updatedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
};

function toPage(raw: RawPage): InstitutionalPage {
  return {
    title: raw.title?.trim() || "",
    slug: raw.slug?.trim() || "",
    status: raw.status === "published" ? "published" : "draft",
    intro: raw.intro?.trim() || "",
    sections: (raw.sections ?? [])
      .map((s) => ({ title: s.title?.trim() || "", body: s.body ?? null }))
      .filter((s) => s.title),
    updatedAt: raw.updatedAt ?? null,
    seo: {
      metaTitle: raw.seo?.metaTitle?.trim() || "",
      metaDescription: raw.seo?.metaDescription?.trim() || "",
    },
  };
}

/**
 * One institutional page, live from Payload.
 *
 * Returns `null` for anything the CMS cannot answer — collection not migrated
 * yet, page never created, CMS unreachable. There is deliberately no snapshot
 * fallback the way `fetchServices` has one: the fallback for a legal document
 * is not last-known-good copy, it is saying plainly that the document has not
 * been published. Inventing a paragraph of CGV to fill the gap is the one
 * thing these pages must never do.
 *
 * The caller renders the "en cours de publication" state and sets noindex —
 * see `components/institutional/InstitutionalPage.tsx`.
 */
export async function fetchInstitutionalPage(slug: InstitutionalSlug): Promise<InstitutionalPage | null> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=1`, {
      next: { revalidate: 3600, tags: [PAGES_TAG] },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const doc = (data?.docs?.[0] ?? null) as RawPage | null;
  if (!doc) return null;

  const page = toPage(doc);
  return page.title ? page : null;
}

/** True when a page has nothing an editor has actually written. */
export function isPageEmpty(page: InstitutionalPage | null): boolean {
  return !page || page.status !== "published" || page.sections.length === 0;
}

/**
 * Every published institutional page, for the sitemap.
 *
 * An empty array is the honest answer when the CMS is unreachable: a sitemap
 * listing a URL that answers "en cours de publication" asks Google to index a
 * placeholder.
 */
export async function fetchPublishedPageSlugs(): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/pages?where[status][equals]=published&limit=50&depth=0`, {
      next: { revalidate: 3600, tags: [PAGES_TAG] },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const docs = (data?.docs ?? []) as RawPage[];
  return docs
    .map((d) => d.slug?.trim() || "")
    .filter((s): s is string => (INSTITUTIONAL_SLUGS as readonly string[]).includes(s));
}
