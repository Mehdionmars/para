import { Camera } from "lucide-react";
import { CloudinaryImage } from "@/components/CloudinaryImage";
import Link from "next/link";
import type { InstagramPost } from "@/lib/storefront/instagram";

type InstagramSectionConfig = {
  show: boolean;
  title: string;
  subtitle: string;
  username: string;
  postCount: number;
  ctaText: string;
  ctaUrl: string;
};

export function InstagramGrid({ posts, config }: { posts: InstagramPost[]; config: InstagramSectionConfig }) {
  // Nothing to show: either the section is turned off in Payload, or the
  // sync has never successfully run yet (no cached posts to fall back to
  // either) — hide the section rather than render an empty-looking grid.
  if (!config.show || posts.length === 0) return null;

  return (
    <section style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "var(--sec-pt,var(--sec-y)) var(--sec-pad-x) var(--sec-pb,var(--sec-y))" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-poppins)", fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--pdh-teal-text)" }}>
            @{config.username}
          </div>
          <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 200, fontSize: "clamp(25px,3.2vw,38px)", margin: "8px 0 0" }}>{config.title}</h2>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>{config.subtitle}</div>
        </div>
        <a
          href={config.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-plum"
          style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}
        >
          {config.ctaText}
        </a>
      </div>

      <div role="list" className="instagram-grid">
        {posts.slice(0, config.postCount).map((post) => (
          <Link
            key={post.instagramId}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            role="listitem"
            className="insta-tile"
            aria-label={post.caption ? post.caption.slice(0, 120) : "Voir la publication sur Instagram"}
            style={{ position: "relative", aspectRatio: "1/1", borderRadius: 16, overflow: "hidden", display: "block" }}
          >
            <CloudinaryImage preset="thumb"
              src={post.imageUrl || post.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
              style={{ objectFit: "cover" }}
              loading="lazy"
            />
            <div
              className="insta-overlay"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(47,31,61,.55)",
                opacity: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--pdh-cream)",
                transition: "opacity .3s",
              }}
            >
              <Camera aria-hidden="true" size={22} strokeWidth={1.5} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
