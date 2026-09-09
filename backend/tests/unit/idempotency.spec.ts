import { describe, expect, it } from 'vitest'

import { hashRequest, hashScope, isValidKey } from '@/lib/idempotency'

/**
 * The pure half of the idempotency layer.
 *
 * The integration suite proves the guarantee end-to-end against a real
 * Postgres; these prove the three pure functions the guarantee is built on,
 * and they run in milliseconds with no database — which is what makes them
 * usable as a pre-commit gate, the same reasoning as the pricing suite beside
 * them.
 *
 * Each of these has a failure mode that would be invisible in production
 * until it mattered: a hash that is not stable rejects legitimate retries, a
 * key validator that is too permissive turns a varchar column into client
 * storage, and a scope that is not hashed puts customer emails in a table
 * nobody decided to make a PII store.
 */

describe('hashRequest', () => {
  it('is stable across key order', () => {
    // The real case: two clients serialising the same cart, or one client
    // whose JSON library changed order between the original request and the
    // retry. If the hash moved, the retry would be answered 409 and the
    // shopper would be told their own cart conflicts with itself.
    const a = { email: 'a@b.test', lines: [{ id: 1, qty: 2 }], name: 'X' }
    const b = { name: 'X', lines: [{ id: 1, qty: 2 }], email: 'a@b.test' }
    expect(hashRequest(a)).toBe(hashRequest(b))
  })

  it('is stable for nested objects, not just the top level', () => {
    const a = { lines: [{ id: 1, qty: 2, variantId: null }] }
    const b = { lines: [{ variantId: null, qty: 2, id: 1 }] }
    expect(hashRequest(a)).toBe(hashRequest(b))
  })

  it('keeps array order significant', () => {
    // Order of *keys* is noise; order of *elements* is not. Two lines swapped
    // is the same cart, but proving that would need cart-aware normalisation,
    // and quietly treating them as identical is the more dangerous default:
    // it would let a genuinely different request replay a stored response.
    expect(hashRequest({ lines: [1, 2] })).not.toBe(hashRequest({ lines: [2, 1] }))
  })

  it('changes when a quantity changes', () => {
    const cart = (qty: number) => ({ lines: [{ id: 1, qty }] })
    expect(hashRequest(cart(1))).not.toBe(hashRequest(cart(3)))
  })

  it('does not collapse undefined and null', () => {
    // `JSON.stringify` drops undefined keys, so a body carrying an explicit
    // null must not hash like one that omitted the field — those mean
    // different things to the checkout.
    expect(hashRequest({ a: 1, b: undefined })).not.toBe(hashRequest({ a: 1, b: null }))
  })

  it('is a full-length sha256', () => {
    expect(hashRequest({ a: 1 })).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('hashScope', () => {
  it('never returns the identity it was given', () => {
    const email = 'client@paradhiver.test'
    const hashed = hashScope(email)
    expect(hashed).not.toContain('client')
    expect(hashed).not.toContain('@')
    expect(hashed).toMatch(/^[a-f0-9]{64}$/)
  })

  it('treats case and whitespace as the same customer', () => {
    // An email typed with a capital or a trailing space on the retry is the
    // same person, and must not read as a cross-customer conflict.
    expect(hashScope('  Client@Paradhiver.test ')).toBe(hashScope('client@paradhiver.test'))
  })

  it('separates two different customers', () => {
    expect(hashScope('a@test.ma')).not.toBe(hashScope('b@test.ma'))
  })

  it('maps absent identity to the empty scope, not to a hash of nothing', () => {
    // Rows written before the scope column exists carry ''. An anonymous
    // caller has to compare equal to those, or every pre-existing key would
    // read as a scope mismatch after the deploy.
    expect(hashScope(null)).toBe('')
    expect(hashScope(undefined)).toBe('')
    expect(hashScope('   ')).toBe('')
  })
})

describe('isValidKey', () => {
  it('accepts the shapes clients actually generate', () => {
    expect(isValidKey('01JXYZABCDEFGHJKMNPQRSTVWX')).toBe(true) // ULID
    expect(isValidKey('550e8400-e29b-41d4-a716-446655440000')).toBe(true) // UUID
    expect(isValidKey('checkout:2026-09-09:abc123')).toBe(true)
  })

  it('rejects a key short enough to be guessed', () => {
    expect(isValidKey('abc')).toBe(false)
    expect(isValidKey('1234567')).toBe(false)
    expect(isValidKey('12345678')).toBe(true)
  })

  it('rejects a key long enough to be storage', () => {
    // The column is varchar(200). Without a ceiling the header is a free
    // write-anything-you-like endpoint into the database.
    expect(isValidKey('a'.repeat(200))).toBe(true)
    expect(isValidKey('a'.repeat(201))).toBe(false)
  })

  it('rejects anything that is not an opaque token', () => {
    // The key reaches a query as a parameter, so this is not the injection
    // boundary — but it also reaches logs and a JSON error body, and a header
    // that can carry newlines or angle brackets is a reflection sink for free.
    expect(isValidKey('key with spaces')).toBe(false)
    expect(isValidKey('key\nwith-newline')).toBe(false)
    expect(isValidKey('<script>alert(1)</script>')).toBe(false)
    expect(isValidKey("key'; DROP TABLE orders;--")).toBe(false)
    expect(isValidKey('clé-accentuée-12345')).toBe(false)
  })
})
