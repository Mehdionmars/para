import 'dotenv/config'

import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import type { Role } from '../../src/access/roles'

/**
 * One account per role, used by the access-control regression suite.
 *
 * The whole point of the role matrix is that it is checked against a *real*
 * session rather than a stubbed `req.user`: several of the rules under test
 * are field-level (`Products.stock` vs the rest) or return a `Where` clause
 * (`Products.read`), and neither behaves the same way outside a real request.
 *
 * The addresses all end in `.test`, a reserved TLD, so these can never
 * receive mail even if a notification is misrouted to one.
 */
export const AUDIT_PASSWORD = 'AuditPass!2026'

export const AUDIT_USERS: Record<string, { email: string; roles: Role[] }> = {
  admin: { email: 'audit-admin@paradhiver.test', roles: ['admin'] },
  customer: { email: 'audit-customer@paradhiver.test', roles: ['customer'] },
  editor: { email: 'audit-editor@paradhiver.test', roles: ['editor'] },
  manager: { email: 'audit-manager@paradhiver.test', roles: ['manager'] },
  stockManager: { email: 'audit-stock@paradhiver.test', roles: ['stockManager'] },
}

export async function seedAuditUsers(payload?: Payload): Promise<void> {
  const p = payload ?? (await getPayload({ config }))
  for (const { email, roles } of Object.values(AUDIT_USERS)) {
    // Recreated rather than upserted: a leftover row from an earlier run may
    // carry a stale role or a lockout from a brute-force test.
    await p.delete({ collection: 'users', where: { email: { equals: email } } }).catch(() => {})
    await p.create({ collection: 'users', data: { email, password: AUDIT_PASSWORD, roles } })
  }
}

export async function cleanupAuditUsers(payload?: Payload): Promise<void> {
  const p = payload ?? (await getPayload({ config }))
  for (const { email } of Object.values(AUDIT_USERS)) {
    await p.delete({ collection: 'users', where: { email: { equals: email } } }).catch(() => {})
  }
}

/** Logs in over real HTTP and returns the JWT, the way the dashboard does. */
export async function loginAs(baseUrl: string, role: keyof typeof AUDIT_USERS): Promise<string> {
  const res = await fetch(`${baseUrl}/api/users/login`, {
    body: JSON.stringify({ email: AUDIT_USERS[role].email, password: AUDIT_PASSWORD }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Login failed for ${role}: ${res.status}`)
  return (await res.json()).token
}

// Allows `npx tsx tests/helpers/auditUsers.ts` to (re)seed them by hand.
if (process.argv[1]?.includes('auditUsers')) {
  await seedAuditUsers()
  console.log('Seeded audit users:', Object.values(AUDIT_USERS).map((u) => u.email).join(', '))
  process.exit(0)
}
