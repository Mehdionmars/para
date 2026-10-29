import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrdersTable } from "@/components/dashboard/orders/OrdersTable";
import { requireRole } from "@/lib/dashboard/guard";
import { listOrders } from "@/lib/dashboard/orders";
import { ORDER_STATUS_OPTIONS, type OrderStatus } from "@/lib/dashboard/orders-types";
import { isStaffUser } from "@/lib/dashboard/roles";

export default async function OrdersPage({ searchParams }: PageProps<"/dashboard/orders">) {
  await requireRole(isStaffUser);
  const [orders, params] = await Promise.all([listOrders(), searchParams]);

  // ?status=pending opens the list already filtered — the home page's
  // "Commandes à confirmer" lands here. Anything else is ignored.
  const raw = typeof params.status === "string" ? params.status : undefined;
  const initialStatus = (ORDER_STATUS_OPTIONS as readonly string[]).includes(raw ?? "") ? (raw as OrderStatus) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Commandes" description="Commandes passées depuis le site public." />
      <OrdersTable orders={orders} initialStatus={initialStatus} />
    </div>
  );
}
