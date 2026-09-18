import { OrdersTable } from "@/components/dashboard/orders/OrdersTable";
import { requireRole } from "@/lib/dashboard/guard";
import { listOrders } from "@/lib/dashboard/orders";
import { isStaffUser } from "@/lib/dashboard/roles";

export default async function OrdersPage() {
  await requireRole(isStaffUser);
  const orders = await listOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Commandes passées depuis le site public.</p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
