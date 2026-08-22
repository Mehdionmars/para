import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/dashboard/ui/Badge";
import { requireRole } from "@/lib/dashboard/guard";
import { listProductMovements } from "@/lib/dashboard/inventory";
import { getProduct } from "@/lib/dashboard/products";
import { hasRole } from "@/lib/dashboard/roles";

const SOURCE_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  adjustment: { label: "Ajustement", variant: "warning" },
  import: { label: "Import", variant: "default" },
  manual: { label: "Manuel", variant: "default" },
  order: { label: "Commande", variant: "danger" },
  restock: { label: "Réapprovisionnement", variant: "success" },
};

export default async function ProductMovementsPage({ params }: { params: Promise<{ product: string }> }) {
  await requireRole((user) => hasRole(user, "admin", "manager", "stockManager"));
  const { product: productId } = await params;

  const [product, movements] = await Promise.all([
    getProduct(productId),
    listProductMovements(Number(productId)),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/inventory" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l&apos;inventaire
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Historique complet des mouvements de stock — SKU {product.sku || "—"} · stock actuel {product.stock}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Variation</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Expiration</th>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const badge = SOURCE_BADGE[m.source] || { label: m.source, variant: "default" as const };
              return (
                <tr key={m.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR")}{" "}
                    {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className={`px-4 py-3 font-medium ${m.delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.previousStock} → {m.newStock}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{typeof m.supplier === "object" && m.supplier ? m.supplier.name : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{m.batchNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{m.reference || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{m.reason || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {typeof m.createdBy === "object" && m.createdBy ? m.createdBy.email : "—"}
                  </td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aucun mouvement de stock pour ce produit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
