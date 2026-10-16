import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Boxes,
  CalendarDays,
  Gift,
  Image as ImageIcon,
  Gauge,
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

/**
 * Every dashboard destination, grouped, with who may see it. Read by the
 * sidebar and by the overview's quick-access grid, so the two always list
 * the same places for the same role.
 */
export type NavItem = {
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
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true, visible: isStaffUser },
      // The figures, the agenda and the charts: /dashboard itself is the
      // launcher of every destination.
      { label: "Vue d'ensemble", href: "/dashboard/overview", icon: Gauge, visible: isStaffUser },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, visible: canViewAnalytics },
    ],
  },
  {
    label: "Ventes",
    items: [
      { label: "Commandes", href: "/dashboard/orders", icon: ShoppingCart, visible: isStaffUser },
      { label: "Rendez-vous", href: "/dashboard/bookings", icon: CalendarDays, visible: isStaffUser },
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
      // A shortcut into the builder's Global tab: "where do I change my logo"
      // had no answer in this list.
      { label: "Logo", href: "/dashboard/storefront?tab=global&panel=logo", icon: ImageIcon, visible: canEditContent },
      {
        label: "Coffrets & cadeaux",
        href: "/dashboard/coffrets",
        icon: Gift,
        visible: canEditContent,
      },
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

/** The groups a user may see, each filtered to its visible items; a group
 * left empty is dropped rather than shown as a bare label. */
export function visibleNavGroups(user: { roles: Role[] }) {
  return NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => item.visible(user)) })).filter(
    (group) => group.items.length > 0,
  );
}
