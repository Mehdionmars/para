import { StoresManager } from "@/components/dashboard/settings/StoresManager";
import { requireRole } from "@/lib/dashboard/guard";
import { canEditContent, hasRole } from "@/lib/dashboard/roles";
import { listStores } from "@/lib/dashboard/settings";

export default async function SettingsStorePage() {
  const user = await requireRole(canEditContent);
  const stores = await listStores();
  return <StoresManager initial={stores} canDelete={hasRole(user, "admin", "manager")} />;
}
