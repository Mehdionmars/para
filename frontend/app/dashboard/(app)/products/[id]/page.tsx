import { notFound } from "next/navigation";
import { ProductForm } from "@/components/dashboard/products/ProductForm";
import { requireRole } from "@/lib/dashboard/guard";
import { getProduct, listBrands } from "@/lib/dashboard/products";
import { canOpenProductEdit } from "@/lib/dashboard/roles";

export default async function EditProductPage({ params }: PageProps<"/dashboard/products/[id]">) {
  await requireRole(canOpenProductEdit);
  const { id } = await params;
  const [product, brands] = await Promise.all([getProduct(id), listBrands()]);
  if (!product) notFound();

  return <ProductForm brands={brands} product={product} />;
}
