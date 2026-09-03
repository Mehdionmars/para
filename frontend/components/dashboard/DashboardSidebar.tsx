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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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

const NAV = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true, visible: isStaffUser },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, visible: canViewAnalytics },
  { label: "Produits", href: "/dashboard/products", icon: Package, visible: canViewProducts },
  { label: "Ajouter un produit", href: "/dashboard/products/new", icon: PlusCircle, exact: true, visible: canEditProducts },
  { label: "Importer", href: "/dashboard/import", icon: Upload, visible: canImport },
  { label: "Storefront", href: "/dashboard/storefront", icon: LayoutTemplate, visible: canEditContent },
  { label: "Coupons", href: "/dashboard/coupons", icon: TicketPercent, visible: canEditContent },
  { label: "Commandes", href: "/dashboard/orders", icon: ShoppingCart, visible: isStaffUser },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, visible: isStaffUser },
  {
    label: "Factures",
    href: "/dashboard/invoices",
    icon: Receipt,
    visible: (roles: { roles: Role[] }) => hasRole(roles, "admin", "manager", "sales"),
  },
  {
    label: "Inventaire",
    href: "/dashboard/inventory",
    icon: Boxes,
    visible: (roles: { roles: Role[] }) => hasRole(roles, "admin", "manager", "stockManager"),
  },
  { label: "Clients", href: "/dashboard/customers", icon: Users, visible: canViewCustomers },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    visible: (roles: { roles: Role[] }) => hasRole(roles, "admin"),
  },
];

function matches(pathname: string, item: (typeof NAV)[number]) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The dashboard navigation, on shadcn's Sidebar primitives.
 *
 * What moved out of this file when it was rewritten: the off-canvas drawer,
 * the collapse toggle, the localStorage persistence and the hand-built
 * tooltips for the icon rail. SidebarProvider does all four — a Sheet below
 * `md`, a cookie for the collapsed state (so it survives the server render
 * instead of flashing expanded then snapping shut), ⌘B, and tooltips through
 * the `tooltip` prop.
 *
 * What stayed, because shadcn has no opinion on it: which items a role may
 * see, and which one counts as active.
 */
export function DashboardSidebar({ roles }: { roles: Role[] }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.visible({ roles }));

  // Longest-href match wins, so a page never lights up two nav items at once
  // (e.g. /dashboard/products/new is a path-prefix of /dashboard/products).
  const activeHref = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => matches(pathname, item))?.href;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-transparent active:bg-transparent">
              <Link href="/dashboard">
                <span className="relative flex aspect-square size-8 shrink-0 items-center justify-center">
                  <Image src="/assets/logo.png" alt="" fill sizes="32px" className="object-contain" priority />
                </span>
                <span className="truncate text-sm font-semibold text-gray-900">Para d&apos;Hiver</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    {/* `tooltip` is what labels the item once the rail is
                        collapsed to icons — including on keyboard focus, which
                        the previous hover-only tooltip never did. */}
                    <SidebarMenuButton asChild isActive={item.href === activeHref} tooltip={item.label}>
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
      </SidebarContent>

      {/* The thin drag handle on the sidebar's edge: click to collapse. */}
      <SidebarRail />
    </Sidebar>
  );
}
