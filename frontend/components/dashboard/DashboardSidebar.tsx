"use client";

import {
  Bell,
  Boxes,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  Package,
  PlusCircle,
  Receipt,
  Settings,
  ShoppingCart,
  TicketPercent,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardUserMenu } from "@/components/dashboard/DashboardUserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  canEditContent,
  canEditProducts,
  canImport,
  canViewAnalytics,
  canViewCustomers,
  canViewProducts,
  hasRole,
  isStaffUser,
  type Role,
} from "@/lib/dashboard/roles";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  visible: (user: { roles: Role[] }) => boolean;
};

/**
 * The navigation, grouped.
 *
 * These are the same thirteen destinations as before, in the same order
 * within each section — what changed is that they used to be one
 * undifferentiated list. Thirteen equally-weighted links means reading all
 * thirteen to find one, and the list had no answer to "where do I look for
 * an invoice" beyond scanning.
 *
 * The groups are named after the job rather than the data: someone
 * reconciling a refund looks under Ventes, not under "Orders" and "Invoices"
 * as separate peers of "Products". Five labels for thirteen items is the
 * ratio that pays for itself — fewer and the sections stop meaning anything,
 * more and the labels outnumber what they organise.
 */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true, visible: isStaffUser },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, visible: canViewAnalytics },
    ],
  },
  {
    label: "Ventes",
    items: [
      { label: "Commandes", href: "/dashboard/orders", icon: ShoppingCart, visible: isStaffUser },
      {
        label: "Factures",
        href: "/dashboard/invoices",
        icon: Receipt,
        visible: (user) => hasRole(user, "admin", "manager", "sales"),
      },
      { label: "Clients", href: "/dashboard/customers", icon: Users, visible: canViewCustomers },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Produits", href: "/dashboard/products", icon: Package, visible: canViewProducts },
      {
        label: "Ajouter un produit",
        href: "/dashboard/products/new",
        icon: PlusCircle,
        exact: true,
        visible: canEditProducts,
      },
      {
        label: "Inventaire",
        href: "/dashboard/inventory",
        icon: Boxes,
        visible: (user) => hasRole(user, "admin", "manager", "stockManager"),
      },
      { label: "Importer", href: "/dashboard/import", icon: Upload, visible: canImport },
    ],
  },
  {
    label: "Boutique",
    items: [
      { label: "Storefront", href: "/dashboard/storefront", icon: LayoutTemplate, visible: canEditContent },
      { label: "Coupons", href: "/dashboard/coupons", icon: TicketPercent, visible: canEditContent },
    ],
  },
  {
    label: "Système",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, visible: isStaffUser },
      {
        label: "Paramètres",
        href: "/dashboard/settings",
        icon: Settings,
        visible: (user) => hasRole(user, "admin"),
      },
    ],
  },
];

function matches(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The dashboard navigation, on shadcn's Sidebar primitives.
 *
 * SidebarProvider owns the responsive behaviour: a Sheet below `md`,
 * cookie-persisted collapse that survives the server render, ⌘B, and
 * tooltips for the icon rail through the `tooltip` prop.
 *
 * What stays here, because shadcn has no opinion on it: which items a role
 * may see, and which one counts as active.
 */
export function DashboardSidebar({ roles, email }: { roles: Role[]; email: string }) {
  const pathname = usePathname();

  // Filtered per group, then empty groups dropped — a stockManager sees no
  // Boutique destinations at all, and a group label with nothing under it is
  // a promise the sidebar does not keep.
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.visible({ roles })),
  })).filter((group) => group.items.length > 0);

  // Longest-href match wins, so a page never lights up two nav items at once
  // (e.g. /dashboard/products/new is a path-prefix of /dashboard/products).
  // Computed across every group, not within one, because the winner and the
  // loser can now live in different sections.
  const activeHref = groups
    .flatMap((group) => group.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => matches(pathname, item))?.href;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* h-14 overrides size="lg"'s h-12: a 44px mark plus the button's
                own p-2 needs 60px, and at h-12 the logo was being squeezed.
                The rail is unaffected — the primitive forces `size-8!` there,
                and `!` outranks this. */}
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-14 hover:bg-transparent active:bg-transparent"
            >
              <Link href="/dashboard">
                {/* Shrinks back to 32px when collapsed, because the icon rail
                    is 3rem wide and a 44px mark would overflow it. sizes
                    matches the larger of the two so the rail is not served a
                    separate, smaller file. */}
                <span className="relative flex aspect-square size-11 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-8">
                  <Image src="/assets/logo.png" alt="" fill sizes="44px" className="object-contain" priority />
                </span>
                <span className="grid flex-1 leading-tight">
                  {/* Italic: PRODUCT.md records the wordmark as set in italic, as a
                      user decision. It is the one place the admin carries the
                      brand's own voice rather than the interface's. */}
                  <span className="truncate text-lg font-semibold italic tracking-tight text-foreground">
                    Para d&apos;Hiver
                  </span>
                  <span className="truncate text-xs text-muted-foreground">Administration</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* scrollbar-none: the rail scrolls on a short viewport, but its
          scrollbar sat directly beside the page's own, so the admin showed two
          parallel grey gutters. Wheel and keyboard scrolling are unaffected. */}
      <SidebarContent className="scrollbar-none">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {/* The label is hidden by the sidebar's own CSS once collapsed to
                the icon rail, where there is no room for it and the tooltips
                carry the naming instead. */}
            {/* text-muted-foreground, overriding the primitive's
                text-sidebar-foreground/70 which measured 3.63:1 against the
                white sidebar — a fail for 12px text. The token lands at
                4.74:1 and still reads quieter than the nav items below it,
                which is the whole job of a group label. */}
            <SidebarGroupLabel className="text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.href === activeHref}
                        tooltip={item.label}
                        className="transition-colors"
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <DashboardUserMenu email={email} roles={roles} />
      </SidebarFooter>

      {/* The thin drag handle on the sidebar's edge: click to collapse. */}
      <SidebarRail />
    </Sidebar>
  );
}
