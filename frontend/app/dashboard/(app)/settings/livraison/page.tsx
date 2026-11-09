import { ShippingRulesManager } from "@/components/dashboard/settings/ShippingRulesManager";
import { requireRole } from "@/lib/dashboard/guard";
import { canEditContent, hasRole } from "@/lib/dashboard/roles";
import { listShippingRules } from "@/lib/dashboard/settings";

export default async function SettingsShippingPage() {
  const user = await requireRole(canEditContent);
  const rules = await listShippingRules();
  return <ShippingRulesManager initial={rules} canDelete={hasRole(user, "admin", "manager")} />;
}
