import type { Metadata } from "next";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";

export const metadata: Metadata = {
  title: "Catalogue — Para d'Hiver",
  description:
    "Parcourez tout le catalogue Para d'Hiver : soins visage, corps, cheveux et plus, livrés partout au Maroc.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "Catalogue — Para d'Hiver" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const brands = (await fetchAllBrandsWithCounts()).filter((b) => b.productCount > 0);

  return <CatalogueView brands={brands} editorial initialQuery={q ?? ""} />;
}
