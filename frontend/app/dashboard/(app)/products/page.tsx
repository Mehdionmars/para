import { Plus } from "lucide-react";
import Link from "next/link";
import { ProductsView } from "@/components/dashboard/products/ProductsView";
import { Button } from "@/components/dashboard/ui/Button";
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez le catalogue Para d&apos;Hiver.</p>
        </div>
        {canEditProducts(user) && (
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ajouter un produit</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </Link>
        )}
      </div>

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
