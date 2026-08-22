import type { Metadata } from "next";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";

export const metadata: Metadata = {
  title: "Catalogue — Para d'Hiver",
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; tag?: string }>;
}) {
  const { cat, q, tag } = await searchParams;
  const brands = (await fetchAllBrandsWithCounts()).filter((b) => b.productCount > 0);

  return <CatalogueView brands={brands} editorial initialCategory={cat ?? ""} initialQuery={q ?? ""} initialTag={tag ?? ""} />;
}
