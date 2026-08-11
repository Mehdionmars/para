'use client'

import React, { useState } from 'react'

import { IMPORT_FIELDS, IMPORT_FIELD_LABELS, type ColumnMapping } from '../lib/importFields'

type PreviewRow = {
  barcode: string
  brandName: string
  category?: string
  issues: string[]
  name: string
  price?: number
  rowIndex: number
  sheet: string
}

type PreviewResponse = {
  columns: string[]
  preview: PreviewRow[]
  sheetNames: string[]
  suggestedMapping: ColumnMapping
  total: number
  withIssues: number
}

/** Sentinel select value meaning "no manual override — use auto-detection". */
const AUTO = '__auto__'
/** Sentinel select value meaning "let me type the column name in by hand". */
const CUSTOM = '__custom__'

type CommitResponse = {
  created: number
  errors: { message: string; row: number; sheet: string }[]
  skipped: number
  total: number
  updated: number
}

const cell: React.CSSProperties = { borderBottom: '1px solid #e6e6e6', padding: '8px 10px', fontSize: 13, textAlign: 'left' }
const th: React.CSSProperties = { ...cell, fontWeight: 600, background: '#fafafa', position: 'sticky', top: 0 }

export function ImportProductsView() {
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState<string[]>([])
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMapping>({})
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [customFields, setCustomFields] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [result, setResult] = useState<CommitResponse | null>(null)
  const [loading, setLoading] = useState<'preview' | 'commit' | null>(null)
  const [error, setError] = useState('')

  /** Drops fields whose manual mapping is blank (e.g. "saisir" picked but
   * nothing typed yet) — those should fall back to auto-detection, not send
   * an empty column name to the server. */
  function activeMapping(): ColumnMapping {
    return Object.fromEntries(Object.entries(mapping).filter(([, v]) => v.trim() !== ''))
  }

  async function runPreview(selectedFile: File, sheets?: string[], mappingOverride?: ColumnMapping) {
    setLoading('preview')
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('mode', 'preview')
      if (sheets) form.append('sheets', JSON.stringify(sheets))
      const mappingToSend = mappingOverride ?? activeMapping()
      if (Object.keys(mappingToSend).length > 0) form.append('mapping', JSON.stringify(mappingToSend))
      const res = await fetch('/api/import-products', { body: form, method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Échec de la lecture du fichier.')
      const data: PreviewResponse = await res.json()
      setPreview(data)
      setColumns(data.columns)
      setSuggestedMapping(data.suggestedMapping)
      if (!sheets) {
        setSheetNames(data.sheetNames)
        setSelectedSheets(new Set(data.sheetNames))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setLoading(null)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPreview(null)
    setResult(null)
    setMapping({})
    setCustomFields(new Set())
    if (f) void runPreview(f)
  }

  function toggleSheet(name: string) {
    setSelectedSheets((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleReapplySheets() {
    if (file) await runPreview(file, [...selectedSheets])
  }

  function handleMappingSelect(field: string, value: string) {
    if (value === CUSTOM) {
      setCustomFields((prev) => new Set(prev).add(field))
      setMapping((prev) => ({ ...prev, [field]: '' }))
      return
    }
    setCustomFields((prev) => {
      if (!prev.has(field)) return prev
      const next = new Set(prev)
      next.delete(field)
      return next
    })
    setMapping((prev) => {
      const next = { ...prev }
      if (value === AUTO) delete next[field]
      else next[field] = value
      return next
    })
  }

  function handleMappingText(field: string, value: string) {
    setMapping((prev) => ({ ...prev, [field]: value }))
  }

  async function handleApplyMapping() {
    if (file) await runPreview(file, [...selectedSheets])
  }

  async function handleImport() {
    if (!file) return
    setLoading('commit')
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', 'commit')
      form.append('sheets', JSON.stringify([...selectedSheets]))
      const mappingToSend = activeMapping()
      if (Object.keys(mappingToSend).length > 0) form.append('mapping', JSON.stringify(mappingToSend))
      const res = await fetch('/api/import-products', { body: form, method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || "Échec de l'import.")
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setLoading(null)
    }
  }

  const rowsToShow = preview?.preview.filter((r) => selectedSheets.has(r.sheet)) ?? []

  return (
    <div style={{ margin: '0 auto', maxWidth: 1100, padding: '40px 32px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Import produits</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        Déposez un fichier Excel (.xlsx) ou CSV — catalogue fournisseur, export ISDIN, etc. Les colonnes sont
        reconnues automatiquement (codes-barres, désignation, prix, marque…). Une ligne dont le code-barres
        correspond à un produit existant le <strong>met à jour</strong> ; sinon elle en crée un nouveau.
      </p>

      <input
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        style={{ marginBottom: 20 }}
        type="file"
      />

      {loading === 'preview' && <p>Lecture du fichier…</p>}
      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {sheetNames.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Feuilles à importer</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {sheetNames.map((name) => (
              <label key={name} style={{ alignItems: 'center', display: 'flex', fontSize: 13, gap: 6 }}>
                <input
                  checked={selectedSheets.has(name)}
                  onChange={() => toggleSheet(name)}
                  type="checkbox"
                />
                {name}
              </label>
            ))}
          </div>
          <button onClick={handleReapplySheets} style={{ fontSize: 12, marginTop: 8 }} type="button">
            Actualiser l&apos;aperçu
          </button>
        </div>
      )}

      {columns.length > 0 && (
        <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, marginBottom: 20, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Correspondance des colonnes</div>
          <p style={{ color: '#777', fontSize: 12, marginBottom: 12, marginTop: 0 }}>
            Les colonnes détectées automatiquement sont pré-sélectionnées. Choisissez-en une autre, ou{' '}
            <strong>« Saisir manuellement »</strong> pour taper le nom exact d&apos;une colonne non détectée.
          </p>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {IMPORT_FIELDS.map((field) => {
              const isCustom = customFields.has(field)
              const detected = suggestedMapping[field]
              return (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }} htmlFor={`map-${field}`}>
                    {IMPORT_FIELD_LABELS[field]}
                  </label>
                  {field === 'price' && (
                    <p style={{ color: '#5e4074', fontSize: 11, margin: '0 0 4px' }}>
                      Source : PPH (Prix Public de Vente) — utilisé tel quel, sans calcul de marge.
                    </p>
                  )}
                  {isCustom ? (
                    <input
                      id={`map-${field}`}
                      onChange={(e) => handleMappingText(field, e.target.value)}
                      placeholder="Nom exact de la colonne dans le fichier"
                      style={{ border: '1px solid #d0d0d0', borderRadius: 6, fontSize: 13, padding: '6px 8px', width: '100%' }}
                      value={mapping[field] ?? ''}
                    />
                  ) : (
                    <select
                      id={`map-${field}`}
                      onChange={(e) => handleMappingSelect(field, e.target.value)}
                      style={{ border: '1px solid #d0d0d0', borderRadius: 6, fontSize: 13, padding: '6px 8px', width: '100%' }}
                      value={mapping[field] ?? AUTO}
                    >
                      <option value={AUTO}>{detected ? `Auto détecté : ${detected}` : 'Auto (non détecté)'}</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value={CUSTOM}>Saisir manuellement…</option>
                    </select>
                  )}
                  {isCustom && (
                    <button
                      onClick={() => handleMappingSelect(field, AUTO)}
                      style={{ background: 'none', border: 'none', color: '#5e4074', cursor: 'pointer', fontSize: 11, marginTop: 3, padding: 0 }}
                      type="button"
                    >
                      Revenir à la détection automatique
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button
            disabled={loading === 'preview'}
            onClick={handleApplyMapping}
            style={{ fontSize: 12, marginTop: 14 }}
            type="button"
          >
            Appliquer la correspondance
          </button>
        </div>
      )}

      {preview && (
        <>
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            <strong>{rowsToShow.length}</strong> ligne(s) prête(s) à importer
            {rowsToShow.filter((r) => r.issues.length > 0).length > 0 && (
              <span style={{ color: '#b7791f' }}>
                {' '}
                — {rowsToShow.filter((r) => r.issues.length > 0).length} avec un point à vérifier
              </span>
            )}
          </div>
          <p style={{ color: '#777', fontSize: 12, marginBottom: 12, marginTop: 0 }}>
            Les nouveaux produits sont créés en <strong>brouillon</strong> avec un stock à <strong>0</strong> — un
            administrateur doit les valider et les publier avant qu&apos;ils apparaissent sur le site.
          </p>

          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, maxHeight: 420, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>Feuille</th>
                  <th style={th}>Nom</th>
                  <th style={th}>Marque</th>
                  <th style={th}>Catégorie</th>
                  <th style={th}>Code-barres</th>
                  <th style={th}>Prix (PPH)</th>
                  <th style={th}>À vérifier</th>
                </tr>
              </thead>
              <tbody>
                {rowsToShow.map((r) => (
                  <tr key={`${r.sheet}-${r.rowIndex}`} style={{ background: r.issues.length > 0 ? '#fff8e6' : undefined }}>
                    <td style={cell}>{r.sheet}</td>
                    <td style={cell}>{r.name || '—'}</td>
                    <td style={cell}>{r.brandName || '—'}</td>
                    <td style={cell}>{r.category || '—'}</td>
                    <td style={cell}>{r.barcode || '—'}</td>
                    <td style={cell}>{r.price ?? '—'}</td>
                    <td style={{ ...cell, color: '#b7791f' }}>{r.issues.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            disabled={loading === 'commit' || rowsToShow.length === 0}
            onClick={handleImport}
            style={{
              background: '#5e4074',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: loading === 'commit' ? 'default' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              marginTop: 16,
              opacity: loading === 'commit' ? 0.6 : 1,
              padding: '12px 22px',
            }}
            type="button"
          >
            {loading === 'commit' ? 'Import en cours…' : `Importer ${rowsToShow.length} ligne(s)`}
          </button>
        </>
      )}

      {result && (
        <div style={{ background: '#f6f6f6', borderRadius: 8, marginTop: 24, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Import terminé</div>
          <div style={{ display: 'flex', fontSize: 14, gap: 24, marginBottom: 12 }}>
            <span>✓ {result.created} créé(s)</span>
            <span>✓ {result.updated} mis à jour</span>
            {result.skipped > 0 && <span style={{ color: '#c0392b' }}>✗ {result.skipped} ignoré(s)</span>}
          </div>
          {result.errors.length > 0 && (
            <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
              {result.errors.map((e, i) => (
                <li key={i}>
                  {e.sheet} — ligne {e.row} : {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
