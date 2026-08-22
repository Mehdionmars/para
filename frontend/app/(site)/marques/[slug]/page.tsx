import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";
import { routes } from "@/lib/routes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brands = await fetchAllBrandsWithCounts();
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) return { title: "Marque — Para d'Hiver" };
  const title = `${brand.name} — Para d'Hiver`;
  const description = `Découvrez tous les produits ${brand.name} disponibles chez Para d'Hiver, parapharmacie en ligne au Maroc.`;
  return {
    title,
    description,
    alternates: { canonical: routes.brand(slug) },
    openGraph: { title, description },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const brands = await fetchAllBrandsWithCounts();
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  return (
    <CatalogueView
      initialQuery={q ?? ""}
      initialBrand={brand.name}
      pageTitle={brand.name}
      pageIntro={`Tous les produits ${brand.name} disponibles chez Para d'Hiver.`}
      breadcrumbExtra={{ label: "Marques", href: routes.brands() }}
    />
  );
}
