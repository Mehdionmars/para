import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/dashboard/guard";
import { listOrders } from "@/lib/dashboard/orders";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/dashboard/orders-types";
import { hasRole } from "@/lib/dashboard/roles";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

const PAYMENT_BADGE: Record<PaymentStatus, "success" | "warning" | "danger" | "default"> = {
  failed: "danger",
  paid: "success",
  pending: "warning",
  refunded: "default",
};

// A confirmed sale, not a cart that never became one — pending/cancelled
// orders have nothing to invoice yet.
const INVOICEABLE_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);

export default async function InvoicesPage() {
  await requireRole((user) => hasRole(user, "admin", "manager", "sales"));
  const orders = await listOrders();
  const invoices = orders
    .filter((o) => INVOICEABLE_STATUSES.has(o.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalInvoiced = invoices.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Factures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Générées à partir des commandes confirmées — pas de système de facturation séparé, une facture correspond
          exactement à une commande payée ou en cours de traitement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-xs p-4">
          <div className="text-xs text-muted-foreground">Factures</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{invoices.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-xs p-4">
          <div className="text-xs text-muted-foreground">Montant total facturé</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{money(totalInvoiced)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-xs p-4">
          <div className="text-xs text-muted-foreground">Commandes non facturables</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{orders.length - invoices.length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-3">N° facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">{order.orderNumber}</td>
                <td className="px-4 py-3 text-foreground">{order.customerName}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 font-medium text-foreground">{money(order.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={PAYMENT_BADGE[order.paymentStatus]}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-medium text-primary hover:underline">
                    Voir la commande
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucune facture pour le moment — les commandes payées apparaîtront ici.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
