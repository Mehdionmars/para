import { PasswordForm } from "@/components/dashboard/settings/PasswordForm";
import { SettingsPanel } from "@/components/dashboard/settings/SettingsPanel";
import { requireRole } from "@/lib/dashboard/guard";
import { isStaffUser, ROLE_LABELS } from "@/lib/dashboard/roles";

/** Mon compte: who is signed in, and their password. Open to every staff
 * role; the shop-wide sections are their own pages. */
export default async function SettingsAccountPage() {
  const user = await requireRole(isStaffUser);

  return (
    <div className="flex flex-col gap-5">
      <SettingsPanel title="Profil">
        <dl className="divide-y divide-border text-sm">
          <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium break-all text-foreground">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-0.5 py-2.5 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Rôle(s)</dt>
            <dd className="font-medium text-foreground">{user.roles.length ? user.roles.map((r) => ROLE_LABELS[r]).join(", ") : "—"}</dd>
          </div>
        </dl>
      </SettingsPanel>

      <SettingsPanel title="Mot de passe" description="Au moins 8 caractères.">
        <PasswordForm />
      </SettingsPanel>
    </div>
  );
}
