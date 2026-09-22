import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb, PageHeader, PageShell } from "@/components/institutional/PageShell";
import { fetchPosts, formatPostDate, POST_CATEGORY_LABELS } from "@/lib/storefront/posts";
import { absoluteUrl } from "@/lib/storefront/seo";

const TITLE = "Le journal";

export async function generateMetadata(): Promise<Metadata> {
  const posts = await fetchPosts();

  return {
    title: `${TITLE} — Para d'Hiver`,
    description: "Conseils de pharmaciens, routines et dossiers soin par l'équipe Para d'Hiver.",
    alternates: { canonical: absoluteUrl("/blog") },
    openGraph: {
      title: `${TITLE} — Para d'Hiver`,
      url: absoluteUrl("/blog"),
      siteName: "Para d'Hiver",
      locale: "fr_MA",
      type: "website",
    },
    // An empty blog is a real page, but not one worth indexing until it has
    // an article. Lifts by itself on the first publish.
    robots: posts.length === 0 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function BlogPage() {
  const posts = await fetchPosts();

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Le journal" }]} />
      <PageHeader title={TITLE} lede="Conseils de nos pharmaciens, routines et dossiers soin." />

      {posts.length === 0 ? (
        <div
          style={{
            border: "1px solid rgba(94,64,116,.14)",
            borderRadius: 20,
            padding: "clamp(24px,3vw,36px)",
            background: "var(--pdh-sand)",
            maxWidth: "min(100%,72ch)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-alta)",
              fontWeight: 300,
              fontSize: "clamp(20px,2.4vw,26px)",
              color: "var(--pdh-plum)",
              margin: "0 0 12px",
            }}
          >
            Les premiers articles arrivent
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, opacity: 0.78, margin: "0 0 20px", maxWidth: "62ch" }}>
            Nos pharmaciens préparent leurs premiers conseils. En attendant, nos soins en institut et nos rituels
            sont déjà détaillés sur le site.
          </p>
          <Link
            href="/rituels"
            className="btn-plum"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Découvrir les rituels
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))",
            gap: "clamp(14px,1.8vw,22px)",
          }}
        >
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="card-hover"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 20,
                border: "1px solid rgba(94,64,116,.12)",
                background: "#fff",
                overflow: "hidden",
                color: "inherit",
              }}
            >
              <div
                style={{
                  position: "relative",
                  // A fixed aspect ratio, not a fixed height: the cards stay
                  // aligned in the grid at every width without a media query.
                  aspectRatio: "16 / 10",
                  background: "var(--pdh-cream)",
                }}
              >
                {post.image && (
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>

              <div style={{ padding: "clamp(18px,2.2vw,24px)", display: "flex", flexDirection: "column", gap: 10 }}>
                {post.category && (
                  <span
                    style={{
                      fontFamily: "var(--font-poppins)",
                      fontSize: 10.5,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "var(--pdh-teal-text)",
                    }}
                  >
                    {POST_CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                )}

                <h2 style={{ fontFamily: "var(--font-alta)", fontWeight: 400, fontSize: 19, color: "var(--pdh-ink)", margin: 0, lineHeight: 1.3 }}>
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p style={{ fontSize: 13.5, lineHeight: 1.7, opacity: 0.75, margin: 0 }}>{post.excerpt}</p>
                )}

                {post.publishedAt && (
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{formatPostDate(post.publishedAt)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
