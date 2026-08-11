/**
 * Strips a stray leading BOM (U+FEFF) and trims -- nothing more. Deliberately
 * does NOT call `.normalize('NFD')` here: NFD decomposes accented characters
 * into base letter + combining mark, which is exactly right for fuzzy header
 * matching (see importFields.ts's normalizeKey) but wrong for actual content
 * -- a product title run through NFD and re-joined carelessly can drop
 * accents entirely ("Creme" from "Crème"). Titles/descriptions must keep
 * their accents exactly as authored.
 */
export function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return ''
  const text = typeof value === 'string' ? value : String(value)
  return text.replace(/^\uFEFF/, '').trim()
}
