import { CouponsTable } from "@/components/dashboard/coupons/CouponsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatsRow, type Kpi } from "@/components/dashboard/stats/StatsRow";
import { couponState, listCoupons } from "@/lib/dashboard/coupons";
import { requireRole } from "@/lib/dashboard/guard";
import { canEditContent } from "@/lib/dashboard/roles";

export default async function CouponsPage() {
  await requireRole(canEditContent);
  const coupons = await listCoupons();

  // Counted through couponState so the page and the table can never disagree
  // about what "actif" means — a code can be `active: true` and still be dead
  // because it expired or hit its limit.
  const states = coupons.map((c) => couponState(c).label);
  const count = (label: string) => states.filter((s) => s === label).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);

  const stats: Kpi[] = [
    {
      label: "Codes actifs",
      value: String(count("Actif")),
      icon: "coupon",
      caption: `sur ${coupons.length} au total`,
    },
    {
      label: "Utilisations",
      value: String(totalUses),
      icon: "usage",
      caption: "toutes campagnes confondues",
    },
    {
      label: "Programmés",
      value: String(count("Programmé")),
      icon: "scheduled",
      caption: "démarrent à une date future",
    },
    {
      label: "Expirés ou épuisés",
      value: String(count("Expiré") + count("Épuisé")),
      icon: "expired",
      caption: `${count("Inactif")} désactivé(s) manuellement`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Coupons"
        description="Codes promotionnels. La validation (dates, limites, éligibilité) est refaite côté serveur à chaque commande."
      />

      <StatsRow stats={stats} />

      <CouponsTable coupons={coupons} />
    </div>
  );
}
