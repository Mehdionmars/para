import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductsView } from "@/components/dashboard/products/ProductsView";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/dashboard/guard";
import { parseProductQuery } from "@/lib/dashboard/product-query";
import { listBrands, listProductsPage } from "@/lib/dashboard/products";
import { canDeleteProducts, canEditProducts, canOpenProductEdit, canViewProducts } from "@/lib/dashboard/roles";

/** The list reflects filters that live in the URL and data other operators
 * are changing; a cached render would show a stale catalogue. */
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(canViewProducts);
  const params = await searchParams;

  // `q` was the previous search param name; honoured so existing bookmarks
  // and links from elsewhere in the dashboard keep working.
  const query = parseProductQuery({ ...params, search: params.search ?? params.q });

  const [page, brands] = await Promise.all([listProductsPage(query), listBrands()]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Produits"
        description="Gérez le catalogue Para d'Hiver."
        actions={
          canEditProducts(user) && (
            // asChild: a <button> inside an <a> is two interactive elements
            // nested, which keyboard and screen-reader users meet twice.
            <Button asChild>
              <Link href="/dashboard/products/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Ajouter un produit</span>
                <span className="sm:hidden">Ajouter</span>
              </Link>
            </Button>
          )
        }
      />

      <ProductsView
        products={page.docs}
        brands={brands}
        query={query}
        totalDocs={page.totalDocs}
        totalPages={page.totalPages}
        canEdit={canEditProducts(user) || canOpenProductEdit(user)}
        canDelete={canDeleteProducts(user)}
        canCreate={canEditProducts(user)}
        hasAnyProduct={page.totalDocs > 0}
      />
    </div>
  );
}
