import type { LexicalRoot } from "@/lib/storefront/richText";
import { resolveMediaUrl, type PayloadMediaRef } from "@/lib/storefront/products";

const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when an article is saved. */
export const POSTS_TAG = "posts";

export const POST_CATEGORY_LABELS: Record<string, string> = {
  conseils: "Conseils",
  routines: "Routines",
  ingredients: "Ingrédients",
  actualites: "Actualités",
};

export type Post = {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  content: LexicalRoot | null;
  category: string;
  author: string;
  publishedAt: string | null;
  seo: { metaTitle: string; metaDescription: string };
};

type RawPost = {
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: PayloadMediaRef;
  content?: LexicalRoot;
  category?: string;
  author?: string;
  publishedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
};

function toPost(raw: RawPost): Post {
  return {
    title: raw.title?.trim() || "",
    slug: raw.slug?.trim() || "",
    excerpt: raw.excerpt?.trim() || "",
    image: resolveMediaUrl(raw.featuredImage) || "",
    content: raw.content ?? null,
    category: raw.category?.trim() || "",
    author: raw.author?.trim() || "",
    publishedAt: raw.publishedAt ?? null,
    seo: {
      metaTitle: raw.seo?.metaTitle?.trim() || "",
      metaDescription: raw.seo?.metaDescription?.trim() || "",
    },
  };
}

/**
 * Published articles, newest first.
 *
 * No snapshot fallback and no seeded articles: an empty blog is a true
 * statement about a shop that has not written anything yet, and /blog renders
 * that state deliberately. A hardcoded array of sample posts would be the
 * "faux articles" this work exists to avoid — and would keep showing after
 * the real ones arrived.
 */
export async function fetchPosts(limit = 24): Promise<Post[]> {
  let res: Response;
  try {
    res = await fetch(
      `${CMS_URL}/api/posts?where[status][equals]=published&limit=${limit}&depth=1&sort=-publishedAt`,
      { next: { revalidate: 3600, tags: [POSTS_TAG] } },
    );
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const docs = (data?.docs ?? []) as RawPost[];
  return docs.map(toPost).filter((p) => p.title && p.slug);
}

/** One article by slug. `null` covers both "no such article" and "CMS down". */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  let res: Response;
  try {
    res = await fetch(
      `${CMS_URL}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&limit=1&depth=1`,
      { next: { revalidate: 3600, tags: [POSTS_TAG] } },
    );
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const doc = (data?.docs?.[0] ?? null) as RawPost | null;
  if (!doc) return null;

  const post = toPost(doc);
  return post.title && post.slug ? post : null;
}

/** dd/mm/yyyy in fr-MA, or "" when the date is absent or unparseable. */
export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-MA", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
