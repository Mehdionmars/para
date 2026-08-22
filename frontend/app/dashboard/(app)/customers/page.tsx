import { CustomersTable } from "@/components/dashboard/customers/CustomersTable";
import { listCustomers } from "@/lib/dashboard/customers";
import { requireRole } from "@/lib/dashboard/guard";
import { canViewCustomers } from "@/lib/dashboard/roles";

export default async function CustomersPage() {
  await requireRole(canViewCustomers);
  const customers = await listCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-500">
          Basé sur l&apos;historique des commandes — il n&apos;y a pas de comptes clients séparés sur le site.
        </p>
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
