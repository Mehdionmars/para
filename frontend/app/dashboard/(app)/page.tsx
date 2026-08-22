import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/dashboard/ui/Card";
import { payloadFetch } from "@/lib/dashboard/payload";

async function getProductStats() {
  const res = await payloadFetch("/api/products?limit=1000&depth=0");
  if (!res.ok) return { total: 0, lowStock: 0, published: 0, catalogValue: 0 };

  const { docs } = (await res.json()) as {
    docs: { price: number; stock: number; lowStockThreshold: number; isPublished: boolean }[];
  };

  return {
    catalogValue: docs.reduce((sum, p) => sum + p.price * (p.stock || 0), 0),
    lowStock: docs.filter((p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length,
    published: docs.filter((p) => p.isPublished).length,
    total: docs.length,
  };
}

async function getOrderStats() {
  const res = await payloadFetch("/api/orders?limit=1000&depth=0");
  if (!res.ok) return { count: 0, revenue: 0, pending: 0 };

  const { docs } = (await res.json()) as { docs: { total: number; status: string }[] };
  return {
    count: docs.length,
    pending: docs.filter((o) => o.status === "pending").length,
    revenue: docs.filter((o) => o.status !== "cancelled" && o.status !== "refunded").reduce((s, o) => s + o.total, 0),
  };
}

export default async function DashboardOverviewPage() {
  const [products, orders] = await Promise.all([getProductStats(), getOrderStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-gray-500">Para d&apos;Hiver — catalogue et commandes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500">Chiffre d&apos;affaires</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{orders.revenue.toLocaleString("fr-FR")} MAD</div>
            </div>
            <ShoppingCart className="h-8 w-8 text-violet-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Commandes</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{orders.count}</div>
            {orders.pending > 0 && <div className="mt-0.5 text-xs text-amber-600">{orders.pending} en attente</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Produits au catalogue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{products.total}</div>
            <div className="mt-0.5 text-xs text-gray-400">{products.published} publiés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Stock faible</div>
            <div className="mt-1 text-2xl font-semibold text-amber-600">{products.lowStock}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Produits</div>
              <p className="mt-1 text-sm text-gray-500">Gérer le catalogue, les prix et les images.</p>
            </div>
            <Link href="/dashboard/products" className="flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline">
              <Package className="h-4 w-4" />
              Voir →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Commandes</div>
              <p className="mt-1 text-sm text-gray-500">Suivre le statut et les paiements.</p>
            </div>
            <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline">
              <ShoppingCart className="h-4 w-4" />
              Voir →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
