/**
 * Keeps a number inside a field's bounds. Shared by the builder's NumberField
 * (a client component) and the doc mappers (run on the server), which apply
 * the same bounds to values already saved in a draft — hence a plain module
 * rather than an export of the "use client" FieldKit.
 */
export function clampNumber(value: number, min?: number, max?: number): number {
  let n = Number.isFinite(value) ? value : (min ?? 0);
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}
