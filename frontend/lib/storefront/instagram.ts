// Server-only: real @paradhiver Instagram posts, synced periodically from
// the Instagram Graph API into Payload (see backend/src/lib/instagramSync.ts)
// and read here on a short revalidate window rather than "no-store" — this
// content changes at most a few times a day, so there's no reason to make
// every homepage request wait on a live Payload round-trip for it. If the
// fetch fails, Next.js keeps serving the last successfully cached response
// instead of breaking the page.
import { CMS_URL } from "@/lib/dashboard/constants";

export type InstagramPost = {
  id: number;
  instagramId: string;
  permalink: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
};

const REVALIDATE_SECONDS = 900;

export async function fetchInstagramPosts(limit: number): Promise<InstagramPost[]> {
  const params = new URLSearchParams();
  params.set("where", JSON.stringify({ isPublished: { equals: true } }));
  params.set("sort", "sortOrder,-timestamp");
  params.set("limit", String(limit));
  params.set("depth", "0");

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/instagram-posts?${params.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  try {
    const data = await res.json();
    return (data.docs || []) as InstagramPost[];
  } catch {
    return [];
  }
}
