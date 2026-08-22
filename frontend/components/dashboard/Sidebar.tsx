"use client";

import {
  Bell,
  LayoutDashboard,
  LayoutTemplate,
  LineChart,
  Package,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Boxes,
  Upload,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/dashboard/cn";
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

const COLLAPSE_STORAGE_KEY = "dashboard-sidebar-collapsed";

export function Sidebar({ roles }: { roles: Role[] }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.visible({ roles }));
  // Longest-href match wins, so a page never lights up two nav items at once
  // (e.g. /dashboard/products/new is a path-prefix of /dashboard/products).
  const activeHref = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => matches(pathname, item))?.href;

  // Starts expanded on both the server render and the first client render
  // (identical HTML, no hydration mismatch) — the real persisted value is
  // only readable from localStorage after mount, so it's applied a moment
  // later via this effect.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className="relative flex h-screen flex-none flex-col overflow-visible border-r border-gray-100 bg-white transition-[width] duration-200"
      style={{ width: collapsed ? 68 : 220 }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-900"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-0")}>
        <div className="relative h-8 w-8 flex-none">
          <Image src="/assets/logo.png" alt="Para d'Hiver" fill sizes="32px" className="object-contain" priority />
        </div>
        {!collapsed && <span className="whitespace-nowrap text-sm font-semibold text-gray-900">Para d&apos;Hiver</span>}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4 flex-none" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
