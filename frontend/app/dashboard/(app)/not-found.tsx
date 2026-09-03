import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/dashboard/ui/Button";

/**
 * Answers the `notFound()` calls raised by the record pages — an order,
 * product, customer or inventory movement that does not exist.
 *
 * Without it those calls fell through to app/not-found.tsx, the storefront's
 * 404: a member of staff who mistyped an order number was shown the shop's
 * purple branding and offered "Voir le catalogue", with no link back into
 * the dashboard they were working in. Living inside (app)/layout.tsx, this
 * one keeps the sidebar, so the next record is one click away.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <SearchX className="h-5 w-5" aria-hidden="true" />
        </span>

        <h1 className="mt-4 text-base font-semibold text-gray-900">Cette fiche est introuvable</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          La commande, le produit ou le client demandé n&apos;existe pas — ou a été supprimé depuis. Vérifiez la
          référence, ou repartez d&apos;une liste.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/orders" className={buttonVariants({ variant: "outline" })}>
            Commandes
          </Link>
          <Link href="/dashboard/products" className={buttonVariants({ variant: "outline" })}>
            Produits
          </Link>
          <Link href="/dashboard" className={buttonVariants()}>
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
