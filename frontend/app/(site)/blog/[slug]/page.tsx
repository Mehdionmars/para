import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb, PageShell, ProseColumn } from "@/components/institutional/PageShell";
import { fetchPostBySlug, formatPostDate, POST_CATEGORY_LABELS } from "@/lib/storefront/posts";
import { RichText, plainText } from "@/lib/storefront/richText";
import { absoluteUrl } from "@/lib/storefront/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  // No post: metadata for the 404 the page itself will render. Marked
  // noindex so a dead link that was shared cannot enter the index.
  if (!post) {
    return { title: "Article introuvable — Para d'Hiver", robots: { index: false, follow: true } };
  }

  const title = post.seo.metaTitle || `${post.title} — Para d'Hiver`;
  const description = post.seo.metaDescription || post.excerpt || plainText(post.content).slice(0, 160);
  const url = absoluteUrl(`/blog/${post.slug}`);

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: "Para d'Hiver",
      locale: "fr_MA",
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.image ? { images: [{ url: post.image }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  // notFound() rather than an empty article: an unknown slug is a 404, and
  // app/(site)/not-found.tsx already renders one in the shop's own chrome.
  if (!post) notFound();

  const date = formatPostDate(post.publishedAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.image ? { image: post.image } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
    publisher: { "@type": "Organization", name: "Para d'Hiver" },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Le journal", href: "/blog" }, { label: post.title }]} />

      <article>
        <header style={{ maxWidth: "min(100%,72ch)", margin: "0 0 28px" }}>
          {post.category && (
            <div
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: 10.5,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--pdh-teal-text)",
                marginBottom: 12,
              }}
            >
              {POST_CATEGORY_LABELS[post.category] ?? post.category}
            </div>
          )}

          <h1
            style={{
              fontFamily: "var(--font-alta)",
              fontWeight: 200,
              fontSize: "clamp(28px,4.2vw,46px)",
              lineHeight: 1.08,
              color: "var(--pdh-ink)",
              margin: "0 0 14px",
            }}
          >
            {post.title}
          </h1>

          {(date || post.author) && (
            <div style={{ fontSize: 12.5, opacity: 0.6 }}>
              {[post.author, date].filter(Boolean).join(" · ")}
            </div>
          )}
        </header>

        {post.image && (
          <div
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              borderRadius: "clamp(16px,2vw,24px)",
              overflow: "hidden",
              background: "var(--pdh-cream)",
              margin: "0 0 32px",
            }}
          >
            <Image
              src={post.image}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        <ProseColumn>
          <RichText value={post.content} />
        </ProseColumn>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  );
}
