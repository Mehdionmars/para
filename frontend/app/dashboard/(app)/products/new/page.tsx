import { ProductForm } from "@/components/dashboard/products/ProductForm";
import { requireRole } from "@/lib/dashboard/guard";
import { getProduct, listBrands } from "@/lib/dashboard/products";
import { canEditProducts } from "@/lib/dashboard/roles";
import type { Product } from "@/lib/dashboard/products-types";

/**
 * Fields that must never be carried into a copy.
 *
 * SKU and barcode identify a physical article — two products sharing them
 * would corrupt stock movements and the barcode lookup used at checkout.
 * Stock starts at zero because the copy has no units on the shelf yet, and
 * the copy must not inherit sales, reviews, movements or its source's slug:
 * those either belong to the original or are regenerated server-side from
 * the new name.
 */
function asDuplicate(source: Product): Product {
  return {
    ...source,
    barcode: "",
    // Cloudinary media ids are reused as-is — the same asset is referenced,
    // not re-uploaded, so a duplicate costs no storage and no transfer.
    name: `${source.name} (copie)`,
    reservedStock: 0,
    sku: "",
    slug: "",
    stock: 0,
    variants: (source.variants ?? []).map((v) => ({
      ...v,
      // Same reasoning per variant: identity and quantity are not copied.
      barcode: "",
      reservedStock: 0,
      sku: "",
      stock: 0,
    })),
  };
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireRole(canEditProducts);
  const { from } = await searchParams;

  const [brands, source] = await Promise.all([listBrands(), from ? getProduct(from) : Promise.resolve(null)]);

  return <ProductForm brands={brands} duplicateOf={source ? asDuplicate(source) : undefined} />;
}
