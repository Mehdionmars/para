import Link from "next/link";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import type { Role } from "@/lib/dashboard/roles";

/** One tint per group, so the grid still reads by section without a heading
 * over every row. Token-based, so dark mode follows. */
const GROUP_TINT: Record<string, string> = {
  Boutique: "bg-primary/10 text-primary",
  Catalogue: "bg-success/10 text-success-strong",
  Pilotage: "bg-muted text-foreground",
  Système: "bg-muted text-muted-foreground",
  Ventes: "bg-warning/10 text-warning-strong",
};

/**
 * Every dashboard destination as a tile, before the figures: the overview is
 * the landing page, and a new operator looking for "les coffrets" or "le
 * logo" should find it here without reading the sidebar.
 *
 * The list is the sidebar's own (lib/dashboard/nav.ts), filtered by the same
 * roles, so a tile never leads to a page the user cannot open. The overview
 * itself is left out — it is this page.
 *
 * Groups stand side by side as columns, a launcher rather than rows: a group
 * of two links laid out as a six-wide row left most of it empty.
 */
export function QuickAccess({ roles }: { roles: Role[] }) {
  const groups = visibleNavGroups({ roles })
    .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== "/dashboard") }))
    .filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Accès rapide" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex h-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className={`flex size-9 flex-none items-center justify-center rounded-lg ${GROUP_TINT[group.label] ?? "bg-muted text-foreground"}`}>
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
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
