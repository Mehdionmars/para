import type { PayloadRequest } from 'payload'

/**
 * Six roles: five staff roles that use Payload's own /admin and the custom
 * /dashboard app, plus "customer" — reserved for a future storefront account
 * system (registration/login aren't built yet, so this role isn't wired to
 * anything customer-facing yet; it exists so the schema doesn't need a
 * breaking change later).
 */
export const ROLES = ['admin', 'manager', 'editor', 'sales', 'stockManager', 'customer'] as const
export type Role = (typeof ROLES)[number]

export const STAFF_ROLES: Role[] = ['admin', 'manager', 'editor', 'sales', 'stockManager']

function rolesOf(req: PayloadRequest): Role[] {
  const user = req.user as { roles?: Role[] } | null | undefined
  return user?.roles ?? []
}

export function hasRole(req: PayloadRequest, ...allowed: Role[]): boolean {
  return rolesOf(req).some((r) => allowed.includes(r))
}

/** Same check, for route handlers that already have `payload.auth()`'s
 * `user` in hand rather than a full PayloadRequest to wrap it in. */
export function userHasRole(user: { roles?: Role[] | null } | null | undefined, ...allowed: Role[]): boolean {
  return (user?.roles ?? []).some((r) => allowed.includes(r))
}

// Plain `boolean` (not Payload's `Access`/`FieldAccess` return type, which
// also allows a `Where` clause) so these helpers stay assignable to both
// collection/global-level `access` hooks and field-level `access` hooks.
type RoleCheck = (args: { req: PayloadRequest }) => boolean

/** Gates a collection out of /admin entirely for non-staff (e.g. "customer"). */
export const staffOnlyInAdmin: RoleCheck = ({ req }) => hasRole(req, ...STAFF_ROLES)

export const isAdmin: RoleCheck = ({ req }) => hasRole(req, 'admin')

export const adminOrManager: RoleCheck = ({ req }) => hasRole(req, 'admin', 'manager')

/** Products/content editors: admin, manager, editor. */
export const canEditContent: RoleCheck = ({ req }) => hasRole(req, 'admin', 'manager', 'editor')

/** Orders/invoices editors: admin, manager, sales. */
export const canEditOrders: RoleCheck = ({ req }) => hasRole(req, 'admin', 'manager', 'sales')

/** Anyone signed in with a staff role — used for read access gated to staff only. */
export const isStaff: RoleCheck = ({ req }) => hasRole(req, ...STAFF_ROLES)

/** Inventory/Suppliers/stock movements: admin, manager, stockManager get full CRUD. */
export const canManageInventory: RoleCheck = ({ req }) => hasRole(req, 'admin', 'manager', 'stockManager')

/** Who may use the bulk product/inventory importer at /dashboard/import. */
export const canImport: RoleCheck = ({ req }) => hasRole(req, 'admin', 'manager', 'stockManager')
