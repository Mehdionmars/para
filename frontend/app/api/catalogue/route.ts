import { NextRequest, NextResponse } from "next/server";
import { CATALOGUE_CATEGORIES, fetchCatalogue, type CatalogueQuery } from "@/lib/storefront/catalogue";
import type { Category } from "@/data/products";

const SORTS: CatalogueQuery["sort"][] = ["pertinence", "price-asc", "price-desc", "newest"];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const categories = sp
    .getAll("cat")
    .filter((c): c is Category => (CATALOGUE_CATEGORIES as string[]).includes(c));

  const sortParam = sp.get("sort");
  const sort = SORTS.includes(sortParam as CatalogueQuery["sort"]) ? (sortParam as CatalogueQuery["sort"]) : "pertinence";

  const maxPriceParam = sp.get("maxPrice");
  const limitParam = sp.get("limit");

  const result = await fetchCatalogue({
    brand: sp.get("brand") || undefined,
    categories,
    inStockOnly: sp.get("avail") === "inStock",
    limit: limitParam ? Number(limitParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    q: sp.get("q") || undefined,
    quick: sp.get("quick") || undefined,
    sort,
    tag: sp.get("tag") || undefined,
  });

  return NextResponse.json(result);
}
