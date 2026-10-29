import { PageHeader } from "@/components/dashboard/PageHeader";
import { CustomersTable } from "@/components/dashboard/customers/CustomersTable";
import { listCustomers } from "@/lib/dashboard/customers";
import { requireRole } from "@/lib/dashboard/guard";
import { canViewCustomers } from "@/lib/dashboard/roles";

export default async function CustomersPage() {
  await requireRole(canViewCustomers);
  const customers = await listCustomers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Clients" description="Basé sur l'historique des commandes — il n'y a pas de comptes clients séparés sur le site." />
      <CustomersTable customers={customers} />
    </div>
  );
}
