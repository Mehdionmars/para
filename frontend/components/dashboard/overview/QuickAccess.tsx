import Link from "next/link";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import type { Role } from "@/lib/dashboard/roles";

/** One icon colour per group, so the grid still reads by section. Colour
 * only, no tile behind the icon. Token-based, so dark mode follows. */
const GROUP_ICON: Record<string, string> = {
  Boutique: "text-primary",
  Catalogue: "text-success-strong",
  Pilotage: "text-foreground",
  Système: "text-muted-foreground",
  Ventes: "text-warning-strong",
};

/**
 * Every dashboard destination as a card: the landing page of the dashboard.
 *
 * The list is the sidebar's own (lib/dashboard/nav.ts), filtered by the same
 * roles, so a card never leads to a page the user cannot open. "Tableau de
 * bord" is left out — it is this page.
 *
 * Groups stand side by side as columns, a launcher rather than rows: a group
 * of two links laid out as a wide row left most of it empty.
 *
 * Motion lives in dashboard.css (.qa-card): the cards rise in one after the
 * other, column by column, and lift with their icon on hover. The stagger is
 * the card's running index, passed as --qa-i.
 */
export function QuickAccess({ roles }: { roles: Role[] }) {
  const groups = visibleNavGroups({ roles })
    .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== "/dashboard") }))
    .filter((group) => group.items.length > 0);

  // Running index across groups, for the entrance stagger.
  const starts = groups.reduce<number[]>((acc, g, i) => [...acc, i === 0 ? 0 : acc[i - 1] + groups[i - 1].items.length], []);

  return (
    <nav aria-label="Accès rapide" className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
      {groups.map((group, g) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="qa-label text-xs font-medium uppercase tracking-wide text-muted-foreground" style={{ "--qa-i": starts[g] } as React.CSSProperties}>
            {group.label}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {group.items.map((item, j) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{ "--qa-i": starts[g] + j } as React.CSSProperties}
                    className="qa-card group flex h-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-foreground shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className={`qa-icon size-5 flex-none ${GROUP_ICON[group.label] ?? "text-foreground"}`} aria-hidden="true" />
                    <span className="min-w-0 leading-tight">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
