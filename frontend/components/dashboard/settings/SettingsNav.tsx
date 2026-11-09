"use client";

import { Building2, CreditCard, Scissors, Truck, UserRound, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SettingsSection = "compte" | "paiement" | "boutique" | "livraison" | "services" | "equipe";

const SECTIONS: { id: SettingsSection; label: string; href: string; icon: LucideIcon }[] = [
  { href: "/dashboard/settings", icon: UserRound, id: "compte", label: "Mon compte" },
  { href: "/dashboard/settings/boutique", icon: Building2, id: "boutique", label: "Boutique & horaires" },
  { href: "/dashboard/settings/livraison", icon: Truck, id: "livraison", label: "Livraison" },
  { href: "/dashboard/settings/paiement", icon: CreditCard, id: "paiement", label: "Paiement" },
  { href: "/dashboard/settings/services", icon: Scissors, id: "services", label: "Services & tarifs" },
  { href: "/dashboard/settings/equipe", icon: Users, id: "equipe", label: "Équipe & rôles" },
];

/**
 * The settings sections, filtered to the ones the operator's roles may open.
 *
 * A vertical list beside the form from `lg` up; below it, a row of tabs that
 * scrolls sideways inside its own strip rather than wrapping into a second
 * line or widening the page.
 */
export function SettingsNav({ allowed }: { allowed: SettingsSection[] }) {
  const pathname = usePathname();
  const sections = SECTIONS.filter((s) => allowed.includes(s.id));

  return (
    <nav aria-label="Sections des paramètres" className="-mx-4 min-w-0 sm:-mx-6 lg:mx-0">
      <ul className="relative scrollbar-none flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-0 lg:px-0">
        {sections.map((s) => {
          const active = s.href === "/dashboard/settings" ? pathname === s.href : pathname.startsWith(s.href);
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex-none">
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 border-b-2 px-2.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  "lg:rounded-md lg:border-b-0 lg:px-3",
                  active
                    ? "border-primary font-medium text-foreground lg:bg-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground lg:hover:bg-accent/60",
                )}
              >
                <Icon className={cn("size-4 flex-none", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
