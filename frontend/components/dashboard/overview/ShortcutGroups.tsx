import Link from "next/link";
import { visibleNavGroups } from "@/lib/dashboard/nav";
import type { Role } from "@/lib/dashboard/roles";

/**
 * Every destination the operator's roles may open, grouped as the sidebar
 * groups them — Pilotage, Ventes, Catalogue & stock, Boutique,
 * Administration.
 *
 * It used to be the whole home page: a grid of large icons, with the
 * figures one click away. The figures now lead and this is the secondary
 * block underneath, compact enough to scan in one look. It stays because the
 * sidebar is folded into a drawer below `lg`, and on a phone this is the
 * fastest way to every page without opening the menu.
 */
export function ShortcutGroups({ roles }: { roles: Role[] }) {
  const groups = visibleNavGroups({ roles })
    .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== "/dashboard") }))
    .filter((group) => group.items.length > 0);

  return (
    <nav aria-labelledby="shortcuts-title" className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs sm:px-5">
      <h2 id="shortcuts-title" className="text-base font-semibold text-foreground">
        Accès rapides
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {groups.map((group) => (
          <div key={group.label} className="min-w-0">
            <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</h3>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-10 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <Icon className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 leading-snug">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
