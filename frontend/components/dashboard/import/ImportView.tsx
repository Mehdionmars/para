"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/dashboard/cn";
import { downloadCsvTemplate, downloadErrorReportCsv, downloadErrorReportXlsx, downloadXlsxTemplate } from "@/lib/dashboard/import-report";
import {
  IMPORT_FIELDS,
  IMPORT_FIELD_LABELS,
  type ColumnMapping,
  type RowOutcome,
  type ValidateResponse,
} from "@/lib/dashboard/import-types";

const BATCH_SIZE = 50;
const PREVIEW_ROW_LIMIT = 200;
const AUTO = "__auto__";
const CUSTOM = "__custom__";

type RunSummary = { created: number; failed: number; skipped: number; updated: number };

export function ImportView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<string[]>([]);
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMapping>({});
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Set<string>>(new Set());

  const [validateData, setValidateData] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState<"validate" | "importing" | null>(null);
  const [error, setError] = useState("");

  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResults, setImportResults] = useState<RowOutcome[]>([]);
  const [importSummary, setImportSummary] = useState<RunSummary | null>(null);

  function activeMapping(): ColumnMapping {
    return Object.fromEntries(Object.entries(mapping).filter(([, v]) => v.trim() !== ""));
  }

  async function runValidate(selectedFile: File, sheets?: string[], mappingOverride?: ColumnMapping) {
    setLoading("validate");
    setError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      if (sheets) form.append("sheets", JSON.stringify(sheets));
      const mappingToSend = mappingOverride ?? activeMapping();
      if (Object.keys(mappingToSend).length > 0) form.append("mapping", JSON.stringify(mappingToSend));

      const res = await fetch("/api/dashboard-import/validate", { body: form, method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la lecture du fichier.");

      setValidateData(data);
      setColumns(data.columns);
      setSuggestedMapping(data.suggestedMapping);
      if (!sheets) {
        setSheetNames(data.sheetNames);
        setSelectedSheets(new Set(data.sheetNames));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(null);
    }
  }

  function handleFile(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setValidateData(null);
    setImportResults([]);
    setImportSummary(null);
    setImportProgress(null);
    setMapping({});
    setCustomFields(new Set());
    void runValidate(selected);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  }

  function toggleSheet(name: string) {
    setSelectedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleReapplySheets() {
    if (file) await runValidate(file, [...selectedSheets]);
  }

  function handleMappingSelect(field: string, value: string) {
    if (value === CUSTOM) {
      setCustomFields((prev) => new Set(prev).add(field));
      setMapping((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    setCustomFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    setMapping((prev) => {
      const next = { ...prev };
      if (value === AUTO) delete next[field];
      else next[field] = value;
      return next;
    });
  }

  function handleMappingText(field: string, value: string) {
    setMapping((prev) => ({ ...prev, [field]: value }));
  }

  async function handleApplyMapping() {
    if (file) await runValidate(file, [...selectedSheets]);
  }

  async function handleImport() {
    if (!file || !validateData) return;
    setLoading("importing");
    setError("");
    setImportResults([]);
    const rows = validateData.rawRows.filter((r) => selectedSheets.has(r.sheet));
    const batches: typeof rows[] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) batches.push(rows.slice(i, i + BATCH_SIZE));

    setImportProgress({ done: 0, total: batches.length });
    const allResults: RowOutcome[] = [];
    const totals: RunSummary = { created: 0, failed: 0, skipped: 0, updated: 0 };

    for (let i = 0; i < batches.length; i++) {
      try {
        const res = await fetch("/api/dashboard-import/run", {
          body: JSON.stringify({ mapping: activeMapping(), rows: batches[i] }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec de l'import.");
        allResults.push(...data.results);
        totals.created += data.summary.created;
        totals.updated += data.summary.updated;
        totals.skipped += data.summary.skipped;
        totals.failed += data.summary.failed;
      } catch (err) {
        // A batch-level failure (network error, server crash) shouldn't lose
        // the rows already imported — mark this batch's rows failed and continue.
        for (const r of batches[i]) {
          allResults.push({
            message: err instanceof Error ? err.message : "Erreur inconnue.",
            row: r.rowIndex,
            sheet: r.sheet,
            sku: String(r.raw.sku ?? ""),
            status: "failed",
          });
          totals.failed++;
        }
      }
      setImportProgress({ done: i + 1, total: batches.length });
      setImportResults([...allResults]);
      setImportSummary({ ...totals });
    }
    setLoading(null);
  }

  function handleReset() {
    setFile(null);
    setValidateData(null);
    setImportResults([]);
    setImportSummary(null);
    setImportProgress(null);
    setSheetNames([]);
    setColumns([]);
    setMapping({});
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewRows = validateData?.rows.filter((r) => selectedSheets.has(r.sheet)) ?? [];
  const isDone = importSummary !== null && loading === null;

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {!validateData && (
        <Card>
          <CardHeader>
            <CardTitle>Importer un fichier</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                <Download className="h-3.5 w-3.5" />
                Modèle CSV
              </Button>
              <Button variant="outline" size="sm" onClick={downloadXlsxTemplate}>
                <Download className="h-3.5 w-3.5" />
                Modèle Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* role="button" is warranted here rather than decorative: the
                dropzone really is the control that opens the file picker, and
                without the role, tabIndex and key handler it was reachable by
                pointer only. */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Choisir un fichier a importer"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                dragActive ? "border-primary/40 bg-primary/10" : "border-border hover:border-input",
              )}
            >
              {loading === "validate" ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-sm font-medium text-foreground">
                Glissez-déposez un fichier ici, ou cliquez pour choisir
              </div>
              <div className="text-xs text-muted-foreground">Formats acceptés : .csv, .xlsx, .xls — 15 Mo max</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {file && validateData && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="h-4 w-4" />
          {file.name}
          <Button variant="ghost" size="sm" onClick={handleReset} className="ml-auto">
            <RotateCcw className="h-3.5 w-3.5" />
            Nouvel import
          </Button>
        </div>
      )}

      {sheetNames.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Feuilles à importer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {sheetNames.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={selectedSheets.has(name)} onChange={() => toggleSheet(name)} />
                  {name}
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-fit" onClick={handleReapplySheets} disabled={loading === "validate"}>
              Actualiser l&apos;aperçu
            </Button>
          </CardContent>
        </Card>
      )}

      {columns.length > 0 && !isDone && (
        <Card>
          <CardHeader>
            <CardTitle>Correspondance des colonnes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              Les colonnes détectées automatiquement sont pré-sélectionnées. Choisissez-en une autre, ou{" "}
              <strong>« Saisir manuellement »</strong> pour taper le nom exact d&apos;une colonne non détectée.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {IMPORT_FIELDS.map((field) => {
                const isCustom = customFields.has(field);
                const detected = suggestedMapping[field];
                return (
                  <div key={field}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor={`map-${field}`}>
                      {IMPORT_FIELD_LABELS[field]}
                    </label>
                    {field === "price" && (
                      <p className="mb-1 text-[11px] text-primary">
                        Source : PPH (Prix Public de Vente) — utilisé tel quel, sans calcul de marge.
                      </p>
                    )}
                    {isCustom ? (
                      <input
                        id={`map-${field}`}
                        value={mapping[field] ?? ""}
                        onChange={(e) => handleMappingText(field, e.target.value)}
                        placeholder="Nom exact de la colonne"
                        className="h-9 w-full rounded-lg border border-border px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />
                    ) : (
                      <select
                        id={`map-${field}`}
                        value={mapping[field] ?? AUTO}
                        onChange={(e) => handleMappingSelect(field, e.target.value)}
                        className="h-9 w-full rounded-lg border border-border px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      >
                        <option value={AUTO}>{detected ? `Auto : ${detected}` : "Auto (non détecté)"}</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value={CUSTOM}>Saisir manuellement…</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
            <Button size="sm" className="mt-4" onClick={handleApplyMapping} disabled={loading === "validate"}>
              Appliquer la correspondance
            </Button>
          </CardContent>
        </Card>
      )}

      {validateData && !isDone && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Total" value={validateData.summary.total} />
            <SummaryCard label="À créer" value={validateData.summary.toCreate} tone="info" />
            <SummaryCard label="À mettre à jour" value={validateData.summary.toUpdate} tone="info" />
            <SummaryCard label="Invalides" value={validateData.summary.invalid} tone={validateData.summary.invalid > 0 ? "danger" : "default"} />
          </div>
          {validateData.summary.toCreate > 0 && (
            <p className="text-xs text-muted-foreground">
              Les {validateData.summary.toCreate} nouveau(x) produit(s) seront créés en <strong>brouillon</strong> avec un
              stock à <strong>0</strong>, sauf si le fichier précise déjà un statut publié et/ou une quantité en
              stock (colonnes reconnues : Statut, Stock) — sinon un administrateur doit les valider et les publier
              avant qu&apos;ils apparaissent sur le site.
            </p>
          )}
        </>
      )}

      {previewRows.length > 0 && !isDone && (
        <Card>
          <CardHeader>
            <CardTitle>
              Aperçu {previewRows.length > PREVIEW_ROW_LIMIT && `(${PREVIEW_ROW_LIMIT} premières lignes sur ${previewRows.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-auto p-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Ligne</th>
                  <th className="px-4 py-2.5">Titre</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Marque</th>
                  <th className="px-4 py-2.5">Prix</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Problèmes</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, PREVIEW_ROW_LIMIT).map((r) => (
                  <tr key={`${r.sheet}-${r.rowIndex}`} className={cn("border-t border-border", r.errors.length > 0 && "bg-destructive/10")}>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.rowIndex}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.title || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground">{r.sku || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.brandName || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.price ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.stock ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.errors.length > 0 ? "danger" : r.isUpdate ? "info" : "success"}>
                        {r.errors.length > 0 ? "Erreur" : r.isUpdate ? "Mise à jour" : "Création"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-destructive">
                      {[...r.errors, ...r.warnings].join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {validateData && !isDone && (
        <Button
          onClick={handleImport}
          disabled={loading !== null || validateData.summary.valid === 0}
          className="w-fit"
        >
          {loading === "importing" && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading === "importing" ? "Import en cours…" : `Importer ${validateData.summary.valid} ligne(s) valide(s)`}
        </Button>
      )}

      {importProgress && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Lot {importProgress.done} / {importProgress.total}
              </span>
              {importSummary && (
                <span className="text-muted-foreground">
                  {importSummary.created} créé(s) · {importSummary.updated} mis à jour · {importSummary.skipped} ignoré(s) ·{" "}
                  {importSummary.failed} échoué(s)
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isDone && importSummary && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Créés" value={importSummary.created} tone="success" icon={CheckCircle2} />
            <SummaryCard label="Mis à jour" value={importSummary.updated} tone="info" />
            <SummaryCard label="Ignorés" value={importSummary.skipped} tone="default" />
            <SummaryCard label="Échoués" value={importSummary.failed} tone={importSummary.failed > 0 ? "danger" : "default"} icon={importSummary.failed > 0 ? AlertTriangle : undefined} />
          </div>

          <div className="flex flex-wrap gap-2">
            {importSummary.failed > 0 && (
              <>
                <Button variant="outline" onClick={() => downloadErrorReportCsv(importResults)}>
                  <Download className="h-3.5 w-3.5" />
                  Rapport d&apos;erreurs (CSV)
                </Button>
                <Button variant="outline" onClick={() => downloadErrorReportXlsx(importResults)}>
                  <Download className="h-3.5 w-3.5" />
                  Rapport d&apos;erreurs (Excel)
                </Button>
              </>
            )}
            <Button onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Nouvel import
            </Button>
          </div>

          {importResults.some((r) => r.status === "failed") && (
            <Card>
              <CardHeader>
                <CardTitle>Lignes échouées</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[320px] overflow-auto p-0">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Ligne</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults
                      .filter((r) => r.status === "failed")
                      .map((r) => (
                        <tr key={`${r.sheet}-${r.row}`} className="border-t border-border">
                          <td className="px-4 py-2.5 text-muted-foreground">{r.row}</td>
                          <td className="px-4 py-2.5 text-foreground">{r.sku || "—"}</td>
                          <td className="px-4 py-2.5 text-destructive">{r.message}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "info" | "danger";
  icon?: typeof CheckCircle2;
}) {
  const toneClass = {
    danger: "text-destructive",
    default: "text-foreground",
    info: "text-info-strong",
    success: "text-success-strong",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={cn("mt-1 text-xl font-semibold", toneClass)}>{value}</div>
        </div>
        {Icon && <Icon className={cn("h-5 w-5", toneClass)} />}
      </CardContent>
    </Card>
  );
}
