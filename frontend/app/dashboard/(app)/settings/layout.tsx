import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsNav, type SettingsSection } from "@/components/dashboard/settings/SettingsNav";
import { requireRole } from "@/lib/dashboard/guard";
import { canEditContent, hasRole, isStaffUser } from "@/lib/dashboard/roles";

/**
 * Paramètres: the operator's own account, then the shop-wide settings that
 * used to need Payload's admin — address and hours, delivery prices, payment
 * methods, services and their tariff, the team.
 *
 * Each section is its own page (so a link can point at "Livraison") and each
 * page guards itself; this list only hides what a role could not open.
 */
export default async function SettingsLayout({ children }: LayoutProps<"/dashboard/settings">) {
  const user = await requireRole(isStaffUser);

  const allowed: SettingsSection[] = ["compte"];
  if (canEditContent(user)) allowed.push("boutique", "livraison", "paiement", "services");
  // Managers may read the team; only an administrator changes it.
  if (hasRole(user, "admin", "manager")) allowed.push("equipe");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Paramètres" description="Votre compte, et les réglages de la boutique publiés sur le site." />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <SettingsNav allowed={allowed} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
