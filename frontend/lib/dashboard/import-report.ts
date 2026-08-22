"use client";

import * as XLSX from "xlsx";
import { CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_SAMPLE_ROW, type RowOutcome } from "./import-types";

function csvEscape(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))];
  // Leading BOM so Excel opens UTF-8 accented characters correctly.
  return `﻿${lines.join("\r\n")}`;
}

function downloadBlob(content: BlobPart, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsvTemplate() {
  const sample = CSV_TEMPLATE_HEADERS.map((h) => CSV_TEMPLATE_SAMPLE_ROW[h]);
  const csv = toCsv(CSV_TEMPLATE_HEADERS, [sample]);
  downloadBlob(csv, "text/csv;charset=utf-8", "modele-import-produits.csv");
}

export function downloadXlsxTemplate() {
  const sample = CSV_TEMPLATE_HEADERS.map((h) => CSV_TEMPLATE_SAMPLE_ROW[h]);
  const sheet = XLSX.utils.aoa_to_sheet([CSV_TEMPLATE_HEADERS, sample]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Produits");
  XLSX.writeFile(book, "modele-import-produits.xlsx");
}

const ERROR_REPORT_HEADERS = ["Feuille", "Ligne", "SKU", "Statut", "Message"];

const STATUS_LABELS: Record<RowOutcome["status"], string> = {
  created: "Créé",
  failed: "Échoué",
  skipped: "Ignoré",
  updated: "Mis à jour",
};

function errorReportRows(results: RowOutcome[]): (string | number)[][] {
  return results.map((r) => [r.sheet, r.row, r.sku, STATUS_LABELS[r.status], r.message || r.warnings?.join(" · ") || ""]);
}

export function downloadErrorReportCsv(results: RowOutcome[]) {
  const csv = toCsv(ERROR_REPORT_HEADERS, errorReportRows(results));
  downloadBlob(csv, "text/csv;charset=utf-8", "rapport-erreurs-import.csv");
}

export function downloadErrorReportXlsx(results: RowOutcome[]) {
  const sheet = XLSX.utils.aoa_to_sheet([ERROR_REPORT_HEADERS, ...errorReportRows(results)]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Erreurs");
  XLSX.writeFile(book, "rapport-erreurs-import.xlsx");
}
