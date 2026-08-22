// Pure types + client-safe helpers only — no server-only imports, mirrors
// the backend's src/access/roles.ts matrix so the dashboard UI (nav, page
// guards, action buttons) reflects the same rules the API actually enforces.

export const ROLES = ["admin", "manager", "editor", "sales", "stockManager", "customer"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["admin", "manager", "editor", "sales", "stockManager"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  customer: "Client",
  editor: "Éditeur",
  manager: "Manager",
  sales: "Ventes",
  stockManager: "Gestion de stock",
};

export type RoleUser = { roles?: Role[] | null } | null | undefined;

export function hasRole(user: RoleUser, ...allowed: Role[]): boolean {
  return (user?.roles ?? []).some((r) => allowed.includes(r));
}

export function isStaffUser(user: RoleUser): boolean {
  return hasRole(user, ...STAFF_ROLES);
}

export const canViewAnalytics = (user: RoleUser) => hasRole(user, "admin", "manager");
export const canEditProducts = (user: RoleUser) => hasRole(user, "admin", "manager", "editor");
export const canEditProductStockOnly = (user: RoleUser) => hasRole(user, "stockManager") && !canEditProducts(user);
// Anyone who can open the edit form at all: full editors plus stockManager
// (who can only actually change the stock fields — enforced server-side by
// Payload's field-level access, since there's no separate stock-only UI yet).
export const canOpenProductEdit = (user: RoleUser) => canEditProducts(user) || hasRole(user, "stockManager");
export const canDeleteProducts = (user: RoleUser) => hasRole(user, "admin", "manager");
export const canViewProducts = (user: RoleUser) =>
  hasRole(user, "admin", "manager", "editor", "stockManager", "sales");
export const canEditOrders = (user: RoleUser) => hasRole(user, "admin", "manager", "sales");
export const canViewCustomers = (user: RoleUser) => hasRole(user, "admin", "manager", "sales");
export const canImport = (user: RoleUser) => hasRole(user, "admin", "manager", "stockManager");
// Mirrors backend/src/access/roles.ts's canEditContent — same roles allowed to update the Home global.
export const canEditContent = (user: RoleUser) => hasRole(user, "admin", "manager", "editor");
