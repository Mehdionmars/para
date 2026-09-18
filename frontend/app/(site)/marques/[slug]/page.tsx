import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { GiftOfferBanner } from "@/components/product/GiftOfferBanner";
import { isGiftBrand } from "@/lib/cart/gift";
import { routes } from "@/lib/routes";
import { fetchBrandBySlug } from "@/lib/storefront/brands";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";
import { fetchGiftOffer } from "@/lib/storefront/paymentSettings";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);
  if (!brand) notFound();
  const title = `${brand.name} — Para d'Hiver`;
  const description = `Découvrez tous les produits ${brand.name} disponibles chez Para d'Hiver, parapharmacie en ligne au Maroc.`;
  return {
    title,
    description,
    alternates: { canonical: routes.brand(brand.slug) },
    openGraph: { title, description },
  };
}

/**
 * One brand and everything it has on sale.
 *
 * The brand is looked up in the brands collection (lib/storefront/brands.ts):
 * an unknown slug is a 404, a known brand with nothing published is an empty
 * page under its own name and logo. The product list, its pagination ("Charger
 * plus", 24 at a time), the loading skeleton and the filtered-empty message
 * are the catalogue's own — this page is the catalogue narrowed to one brand,
 * not a second listing to keep in step with it.
 *
 * Deliberately no loading.tsx beside this file. Once a loading boundary has
 * rendered, the response headers are gone and notFound() can only stream a
 * 404 screen under an HTTP 200 (Next's streaming docs, "Status Codes") —
 * measured: 200 with one, 404 without. The product grid still shows its
 * skeleton while it loads, from CatalogueView.
 *
 * Brands carry no description in the CMS, so none is shown.
 */
export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const [brand, brands, giftOffer] = await Promise.all([fetchBrandBySlug(slug), fetchAllBrandsWithCounts(), fetchGiftOffer()]);
  if (!brand) notFound();

  const mark = (
    <div style={{ display: "inline-flex", marginBottom: 14 }}>
      <BrandLogo logo={brand.logo} name={brand.name} size="lg" slug={brand.slug} />
    </div>
  );

  // Facets list only brands with products on sale. An empty facet list means
  // the facets could not be read at all — then the catalogue view decides
  // from its own fetch rather than this page declaring the brand empty.
  const facetsKnown = brands.length > 0;
  const productCount = brands.find((b) => b.id === brand.id)?.productCount ?? 0;

  if (facetsKnown && productCount === 0) {
    return (
      <div
        className="mobile-page-pad"
        style={{ margin: "0 auto", maxWidth: "min(1280px,100%)", padding: "clamp(18px,2.4vw,30px) clamp(14px,3.4vw,32px) clamp(44px,5vw,76px)" }}
      >
        <Breadcrumbs
          items={[{ label: "Accueil", href: routes.home() }, { label: "Marques", href: routes.brands() }, { label: brand.name }]}
        />
        <div style={{ marginTop: 10, maxWidth: 760 }}>
          {mark}
          <h1 style={{ fontFamily: "var(--font-alta)", fontSize: "clamp(28px,3.8vw,44px)", fontWeight: 200, margin: 0 }}>{brand.name}</h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: "12px 0 0", opacity: 0.62 }}>
            Aucun produit {brand.name} n&apos;est disponible pour le moment. Découvrez les{" "}
            <Link className="link-hover" href={routes.brands()} style={{ color: "var(--pdh-plum)", fontWeight: 600 }}>
              autres marques
            </Link>{" "}
            ou parcourez le{" "}
            <Link className="link-hover" href={routes.catalogue()} style={{ color: "var(--pdh-plum)", fontWeight: 600 }}>
              catalogue complet
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <CatalogueView
      breadcrumbExtra={{ label: "Marques", href: routes.brands() }}
      initialBrand={brand.name}
      initialQuery={q ?? ""}
      pageIntro={`Tous les produits ${brand.name} disponibles chez Para d'Hiver.`}
      pageAside={isGiftBrand(giftOffer, brand.name) ? <GiftOfferBanner linkToBrand={false} offer={giftOffer} /> : undefined}
      pageMark={mark}
      pageTitle={brand.name}
    />
  );
}
