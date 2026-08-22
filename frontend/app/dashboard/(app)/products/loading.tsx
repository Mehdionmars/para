import { ProductsTableSkeleton } from "@/components/dashboard/products/ProductsTableStates";

/**
 * Shown while the first page of the catalogue is fetched.
 *
 * Scoped to this route, not the dashboard group: a group-wide loading.tsx
 * would flush the shell for every dashboard page and break their own
 * notFound() handling — the same trap that produced soft 404s on the
 * storefront.
 */
export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez le catalogue Para d&apos;Hiver.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
        <div className="h-9 w-full max-w-xs animate-pulse rounded-lg bg-gray-100 sm:w-72" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>

      <ProductsTableSkeleton rows={10} />
      <span className="sr-only" role="status">
        Chargement du catalogue…
      </span>
    </div>
  );
}
