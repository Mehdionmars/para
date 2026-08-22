import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductReviews } from "@/components/product/ProductReviews";
import { SimilarProducts } from "@/components/product/SimilarProducts";
import {
  fetchProductBySlug,
  fetchProductByLegacyId,
  fetchSimilarProducts,
  type LiveProductDetail,
} from "@/lib/storefront/products";
import { routes } from "@/lib/routes";

// Payload is the source of truth for this page — there is deliberately no
// generateStaticParams here. A product created or edited in the CMS is live
// on its next request, with no `npm run sync-cms` and no rebuild:
//
//   force-dynamic  every request re-renders, so price/stock/status are never
//                  served stale, and notFound() returns a real HTTP 404
//                  (an on-demand render of a *cached* dynamic param returns
//                  200 with not-found content instead — the bug this
//                  replaces).
//
// Cached vs fresh, deliberately split:
//   fresh (no-store)  the product itself — price, stock, availability, the
//                     data a shopper acts on.
//   cached (5 min)    the "Vous aimerez aussi" rail — editorial filler.
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// React cache(): generateMetadata and the page body both need the product,
// but this must stay one HTTP call to Payload per render pass.
const getProductBySlug = cache((slug: string) => fetchProductBySlug(slug));
const getProductByLegacyId = cache((slug: string) => fetchProductByLegacyId(slug));

/**
 * Resolves the route, or terminates it (404 / legacy-id redirect).
 *
 * Deliberately called from generateMetadata, which Next awaits *before* it
 * flushes the response head: the (site) group has a loading.tsx, so every
 * page in it renders behind a Suspense boundary, and once that shell starts
 * streaming the status is already committed to 200. Resolving here is what
 * makes notFound() a real HTTP 404 and permanentRedirect() a real 308 —
 * calling them from the page body alone would render the right page with
 * the wrong status.
 */
const resolveProduct = cache(async (slug: string): Promise<LiveProductDetail> => {
  const product = await getProductBySlug(slug);
  if (product) return product;
  const legacy = await getProductByLegacyId(slug);
  if (legacy) permanentRedirect(routes.product(legacy.slug));
  notFound();
});

/** First non-empty line of the description, trimmed to a meta-safe length. */
function metaDescription(product: LiveProductDetail): string {
  const firstLine = product.desc.split("\n").find((line) => line.trim())?.trim();
  return firstLine?.slice(0, 160) || `${product.name} par ${product.brand}, disponible sur Para d'Hiver.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  const productName = product.name.split("\n")[0];
  const title = `${productName} — ${product.brand} | Para d'Hiver`;
  const description = metaDescription(product);
  const canonical = routes.product(product.slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: [{ url: product.image, alt: productName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Already resolved (and cached) by generateMetadata above — which is also
  // where a missing product has already produced a real 404/308. A
  // CmsUnavailableError deliberately propagates rather than being caught:
  // an unreachable CMS is a 500, not "this product was deleted".
  const product = await resolveProduct(slug);
  const similar = await fetchSimilarProducts({ cat: product.cat, id: product.id });
  const productName = product.name.split("\n")[0];
  const canonical = `${siteUrl}${routes.product(product.slug)}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: metaDescription(product),
    image: product.gallery.map((src) => (src.startsWith("http") ? src : `${siteUrl}${src}`)),
    brand: { "@type": "Brand", name: product.brand },
    category: product.cat,
    ...(product.sku ? { sku: product.sku } : {}),
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "MAD",
      price: product.price,
      availability: product.stockState === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${siteUrl}${routes.home()}` },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: `${siteUrl}${routes.catalogue()}` },
      { "@type": "ListItem", position: 3, name: productName, item: canonical },
    ],
  };

  return (
    <div style={{ maxWidth: "min(1280px,100%)", margin: "0 auto", padding: "clamp(28px,3.6vw,48px) clamp(14px,3.4vw,32px)" }}>
      {/* JSON.stringify of objects built server-side from typed CMS fields — no raw user HTML reaches these. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Breadcrumbs
        items={[{ label: "Accueil", href: routes.home() }, { label: "Catalogue", href: routes.catalogue() }, { label: product.name }]}
      />

      {/* One client boundary around the two halves that share a selection:
          picking an option has to move the price, the stock, the SKU and —
          when the option ships one — the photograph. */}
      <ProductDetail product={product} />

      <ProductReviews product={product} />
      <SimilarProducts product={product} products={similar} />
    </div>
  );
}
