import { Package, PackageSearch, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/dashboard/ui/Button";

/**
 * Skeleton mirroring the real row layout — same heights, same column widths,
 * same thumbnail size. A skeleton that doesn't match causes a visible jump
 * when the data lands, which reads as slower than showing nothing.
 */
export function ProductsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white" aria-hidden="true">
      <div className="hidden h-11 items-center gap-4 border-b border-gray-100 px-4 md:flex">
        <div className="h-4 w-4 rounded bg-gray-100" />
        <div className="h-3 w-32 rounded bg-gray-100" />
        <div className="ml-auto flex gap-8">
          {[64, 48, 56, 56, 40].map((w, i) => (
            <div key={i} className="h-3 rounded bg-gray-100" style={{ width: w }} />
          ))}
        </div>
      </div>

      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0">
          <div className="h-4 w-4 shrink-0 rounded bg-gray-100" />
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-100" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 animate-pulse rounded bg-gray-100" style={{ width: `${45 + ((i * 13) % 35)}%` }} />
            <div className="mt-1.5 h-2.5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="hidden gap-8 md:flex">
            {[56, 44, 60, 52].map((w, j) => (
              <div key={j} className="h-3 animate-pulse rounded bg-gray-100" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Two genuinely different situations, two different offers: a catalogue with
 * nothing in it needs a way to add a product; a filtered view with no matches
 * needs a way to widen the filters. Showing "Ajouter un produit" to someone
 * whose search simply missed would be unhelpful.
 */
export function ProductEmptyState({
  filtered,
  canCreate,
  onReset,
}: {
  filtered: boolean;
  canCreate: boolean;
  onReset: () => void;
}) {
  const Icon = filtered ? PackageSearch : Package;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
        <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>

      <h2 className="text-sm font-semibold text-gray-900">
        {filtered ? "Aucun produit trouvé" : "Votre catalogue est vide"}
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500">
        {filtered
          ? "Essayez de modifier vos filtres ou votre recherche."
          : "Ajoutez votre premier produit pour commencer à vendre."}
      </p>

      <div className="mt-5">
        {filtered ? (
          <Button variant="outline" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        ) : (
          canCreate && (
            <Link href="/dashboard/products/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter un produit
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
