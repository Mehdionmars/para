"use client";

import { usePathname } from "next/navigation";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import type { Role } from "@/lib/dashboard/roles";

/**
 * The header's search.
 *
 * It used to be a products-only field (`?q=` on the catalogue) while the home
 * page had the real search over pages, products, orders, customers and
 * appointments. Both are now the same DashboardSearch, so the field answers
 * the same question wherever the operator meets it.
 *
 * A plain container, not a <header>: DashboardShell owns the bar itself.
 */
export function Topbar({ roles }: { roles: Role[] }) {
  const pathname = usePathname();

  // The dashboard home heads its page with the large search; a second field
  // in the bar would ask the same question twice.
  if (pathname === "/dashboard") return null;

  return (
    <div className="flex min-w-0 items-center justify-end">
      <DashboardSearch roles={roles} variant="compact" />
    </div>
  );
}
