import { TeamManager } from "@/components/dashboard/settings/TeamManager";
import { requireRole } from "@/lib/dashboard/guard";
import { hasRole } from "@/lib/dashboard/roles";
import { listStaffAccounts } from "@/lib/dashboard/settings";

export default async function SettingsTeamPage() {
  const user = await requireRole((u) => hasRole(u, "admin", "manager"));
  const accounts = await listStaffAccounts();
  return <TeamManager initial={accounts} currentUserId={user.id} canEdit={hasRole(user, "admin")} />;
}
