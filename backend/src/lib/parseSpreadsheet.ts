import * as XLSX from 'xlsx'

import { normalizeText } from './textNormalize'

export type ParsedSheet = {
  name: string
  rows: Record<string, unknown>[]
}

// .xlsx/.xls are ZIP containers (magic bytes "PK\x03\x04"); anything else
// handed to this function is treated as CSV text.
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const isZip = (buffer: Buffer): boolean => buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_MAGIC)

const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === ''

const SCIENTIFIC_NOTATION = /^-?\d+(\.\d+)?e\+?\d+$/i

/** Converts a raw cell value to display text without ever going through
 * Excel's own number format (which some supplier files apply inconsistently
 * per-cell — e.g. a barcode column where most rows are Text-formatted but a
 * few are General-formatted, so those few would otherwise render as
 * scientific notation like "3.32304E+12" instead of the real digits). */
function formatCell(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return Number.isInteger(value) ? value.toFixed(0) : String(value)
  const text = normalizeText(value)
  if (SCIENTIFIC_NOTATION.test(text)) {
    const n = Number(text)
    if (Number.isFinite(n)) return n.toFixed(0)
  }
  return text
}

/**
 * Some supplier sheets (e.g. PentaGroup's per-brand tabs) open with a single
 * title cell — the brand name — before the real header row. Detects that
 * shape: row 0 has exactly one non-blank cell while row 1 has several.
 */
function findHeaderRowIndex(aoa: unknown[][]): number {
  if (aoa.length < 2) return 0
  const row0NonBlank = (aoa[0] || []).filter((c) => !isBlank(c)).length
  const row1NonBlank = (aoa[1] || []).filter((c) => !isBlank(c)).length
  return row0NonBlank === 1 && row1NonBlank >= 2 ? 1 : 0
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  // raw:true + our own formatCell, rather than raw:false (Excel's own
  // formatted text) — see formatCell for why.
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { blankrows: false, defval: '', header: 1, raw: true })
  if (aoa.length === 0) return []

  const headerIndex = findHeaderRowIndex(aoa)
  const headers = (aoa[headerIndex] || []).map((h, i) => (isBlank(h) ? `column_${i + 1}` : String(h).trim()))
  const dataRows = aoa.slice(headerIndex + 1)

  return dataRows
    .filter((row) => row.some((cell) => !isBlank(cell)))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, formatCell(row[i])])))
}

/** Parses every sheet of an uploaded .xlsx/.csv/.xls buffer into rows keyed
 * by their real column headers, working around the title-row and
 * scientific-notation-barcode quirks real supplier spreadsheets have.
 *
 * CSV files are decoded as UTF-8 text ourselves before handing them to
 * SheetJS, rather than letting `XLSX.read` guess the encoding from the raw
 * buffer: SheetJS's CSV codepage auto-detection falls back to Windows-1252
 * whenever the file has no BOM (common — most CSV exports don't add one),
 * which silently mangles every accented character ("Crème" -> "CrÃ¨me").
 * .xlsx/.xls are real binary ZIP containers and must stay as a Buffer —
 * decoding those as UTF-8 text would corrupt the archive outright, so only
 * non-ZIP input gets this treatment. */
export function parseSpreadsheet(buffer: Buffer): ParsedSheet[] {
  const workbook = isZip(buffer)
    ? XLSX.read(buffer, { type: 'buffer' })
    : XLSX.read(buffer.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string' })
  return workbook.SheetNames.map((name) => ({
    name,
    rows: sheetToRows(workbook.Sheets[name]),
  }))
}
