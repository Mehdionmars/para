import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/Card";
import { getCustomer } from "@/lib/dashboard/customers";
import { ORDER_STATUS_LABELS } from "@/lib/dashboard/orders-types";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

export default async function CustomerDetailPage({ params }: PageProps<"/dashboard/customers/[email]">) {
  const { email } = await params;
  const customer = await getCustomer(decodeURIComponent(email));
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{customer.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Commandes</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{customer.orderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Total dépensé</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{money(customer.totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs font-medium text-gray-500">Téléphone</div>
            <div className="mt-1 text-lg font-medium text-gray-900">{customer.phone || "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des commandes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-violet-700 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3">
                    <Badge>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
