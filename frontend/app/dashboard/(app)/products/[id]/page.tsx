import { notFound } from "next/navigation";
import { ProductForm } from "@/components/dashboard/products/ProductForm";
import { requireRole } from "@/lib/dashboard/guard";
import { getProduct, getRoutinePicks, listBrands } from "@/lib/dashboard/products";
import { canOpenProductEdit } from "@/lib/dashboard/roles";

const relatedIds = (p: { relatedProducts?: (number | { id: number })[] | null }) =>
  (p.relatedProducts ?? []).map((r) => (typeof r === "object" ? r.id : r));

export default async function EditProductPage({ params }: PageProps<"/dashboard/products/[id]">) {
  await requireRole(canOpenProductEdit);
  const { id } = await params;
  const [product, brands] = await Promise.all([getProduct(id), listBrands()]);
  if (!product) notFound();

  const routinePicks = await getRoutinePicks(relatedIds(product));

  return <ProductForm brands={brands} product={product} routinePicks={routinePicks} />;
}
