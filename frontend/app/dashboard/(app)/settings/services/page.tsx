import { ServicesManager } from "@/components/dashboard/settings/ServicesManager";
import { requireRole } from "@/lib/dashboard/guard";
import { canEditContent, hasRole } from "@/lib/dashboard/roles";
import { listServices } from "@/lib/dashboard/settings";

export default async function SettingsServicesPage() {
  const user = await requireRole(canEditContent);
  const services = await listServices();
  return <ServicesManager initial={services} canDelete={hasRole(user, "admin", "manager")} />;
}
