import { RevenueChart, StatusChart } from "@/components/dashboard/analytics/Charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/Card";
import { getAnalytics } from "@/lib/dashboard/analytics";
import { requireRole } from "@/lib/dashboard/guard";
import { canViewAnalytics } from "@/lib/dashboard/roles";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

export default async function AnalyticsPage() {
  await requireRole(canViewAnalytics);
  const data = await getAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Calculé à partir des commandes réelles — pas de données factices.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Chiffre d&apos;affaires (hors annulées)</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{money(data.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Commandes</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.orderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Panier moyen</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{money(data.avgOrderValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenu — 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.revenueByDay} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={data.statusBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meilleures ventes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topProducts.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
                Aucune vente pour le moment.
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-gray-900">{p.name}</td>
                      <td className="px-5 py-3 text-gray-500">× {p.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{money(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
