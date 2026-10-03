import type { Metadata } from "next";
import { CatalogueView } from "@/components/catalogue/CatalogueView";
import { AisleIndex } from "@/components/home/AisleIndex";
import { fetchAisleCounts, fetchAllBrandsWithCounts } from "@/lib/storefront/catalogue";

export const metadata: Metadata = {
  title: "Catalogue — Para d'Hiver",
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; tag?: string }>;
}) {
  const { cat, q, tag } = await searchParams;
  const [allBrands, aisleCounts] = await Promise.all([
    fetchAllBrandsWithCounts(),
    // An empty map reads as "unknown": every aisle is shown.
    fetchAisleCounts().catch(() => new Map<string, number>()),
  ]);
  const brands = allBrands.filter((b) => b.productCount > 0);

  return (
    <>
      <CatalogueView brands={brands} editorial initialCategory={cat ?? ""} initialQuery={q ?? ""} initialTag={tag ?? ""} />
      <AisleIndex counts={aisleCounts} showAll={false} />
    </>
  );
}
