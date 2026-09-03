import { CouponsTable } from "@/components/dashboard/coupons/CouponsTable";
import { StatsRow, type Stat } from "@/components/dashboard/stats/StatsRow";
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

  const stats: Stat[] = [
    {
      title: "Codes actifs",
      subtitle: String(count("Actif")),
      icon: "coupon",
      caption: `sur ${coupons.length} au total`,
    },
    {
      title: "Utilisations",
      subtitle: String(totalUses),
      icon: "usage",
      caption: "toutes campagnes confondues",
    },
    {
      title: "Programmés",
      subtitle: String(count("Programmé")),
      icon: "scheduled",
      caption: "démarrent à une date future",
    },
    {
      title: "Expirés ou épuisés",
      subtitle: String(count("Expiré") + count("Épuisé")),
      icon: "expired",
      caption: `${count("Inactif")} désactivé(s) manuellement`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
        <p className="mt-1 text-sm text-gray-500">
          Codes promotionnels. La validation (dates, limites, éligibilité) est refaite côté serveur à chaque
          commande.
        </p>
      </div>

      <StatsRow stats={stats} />

      <CouponsTable coupons={coupons} />
    </div>
  );
}
