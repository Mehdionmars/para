/**
 * Shared display formatting for the dashboard.
 *
 * `money` in particular is currently redeclared in OrdersTable, CustomersTable
 * and elsewhere; new code uses this one so there is somewhere for those to
 * converge rather than a fourth copy.
 */

export function money(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} MAD`;
}

/** e.g. "3 sept." — compact enough for a table cell. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** e.g. "mardi 3 septembre" — for a heading that has room. */
export function longDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/**
 * Local calendar key for a timestamp.
 *
 * Orders arrive as UTC ISO strings; bucketing them by the raw date substring
 * would file a 01:30 Casablanca order under the previous day. Going through
 * the Date's local getters is what keeps a day in the grid meaning the day
 * the operator actually lived through.
 */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
