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

  // `?id=12&id=40` — the favourites page asking for the products it holds.
  // Present-but-invalid ids still narrow (to nothing), so a malformed request
  // can never fall through to the entire catalogue.
  const ids = sp.has("id")
    ? sp
        .getAll("id")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 100)
    : undefined;

  const maxPriceParam = sp.get("maxPrice");
  const limitParam = sp.get("limit");

  const result = await fetchCatalogue({
    brand: sp.get("brand") || undefined,
    categories,
    ids,
    inStockOnly: sp.get("avail") === "inStock",
    limit: limitParam ? Number(limitParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    q: sp.get("q") || undefined,
    quick: sp.get("quick") || undefined,
    sort,
    subCategory: sp.get("sub") || undefined,
    tag: sp.get("tag") || undefined,
  });

  return NextResponse.json(result);
}
