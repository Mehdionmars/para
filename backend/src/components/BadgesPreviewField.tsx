'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { BADGE_TYPE_PRESETS } from '../collections/Products'

/**
 * Live preview of a product's badge stack, rendered inside the Products edit
 * form right under the `badges` array.
 *
 * Reads the form state rather than the saved document, so an editor sees the
 * effect of a colour or priority change before hitting Save — which is the
 * whole point: priority ordering and the 3-badge cap are invisible in the
 * raw array UI, and the automatic discount pill doesn't exist as a field at
 * all.
 *
 * Mirrors frontend/lib/productBadges.ts's resolveProductBadges(). Kept in
 * sync by hand for the same reason the storefront mirrors the presets: the
 * two projects don't import from each other.
 */

const MAX_BADGES = 3

type PreviewBadge = { text: string; bgColor: string; textColor: string; priority: number; auto?: boolean }

/** Storefront theme fallbacks, so an unset colour previews the way it will
 * actually render rather than as transparent. */
const THEME_BADGE_BG = '#5E4074'
const THEME_BADGE_TEXT = '#FFFFFF'
const THEME_SALE = '#FF514D'

export function BadgesPreviewField() {
  // One subscription over the whole field map: array rows are flat paths
  // (`badges.0.type`), so there's no per-row hook to call and no hook-count
  // change when a row is added or removed.
  //
  // Serialised to a string on purpose: useFormFields compares the selected
  // value by identity, so returning a fresh object would re-render this
  // preview on every keystroke anywhere in the product form. A string only
  // changes when a badge, price or oldPrice actually changes.
  const serialised = useFormFields(([fields]) => {
    const rows: Record<number, Record<string, unknown>> = {}

    for (const [path, field] of Object.entries(fields || {})) {
      const match = /^badges\.(\d+)\.(\w+)$/.exec(path)
      if (!match) continue
      const index = Number(match[1])
      rows[index] = rows[index] || {}
      rows[index][match[2]] = (field as { value?: unknown })?.value
    }

    return JSON.stringify({
      badges: Object.keys(rows)
        .map(Number)
        .sort((a, b) => a - b)
        .map((i) => rows[i]),
      oldPrice: Number((fields?.oldPrice as { value?: unknown })?.value ?? 0),
      price: Number((fields?.price as { value?: unknown })?.value ?? 0),
    })
  })

  const { badges, oldPrice, price } = React.useMemo(
    () => JSON.parse(serialised) as { badges: Record<string, unknown>[]; oldPrice: number; price: number },
    [serialised],
  )

  const configured: PreviewBadge[] = badges
    .filter((b) => b.enabled !== false)
    .map((b) => {
      const preset =
        BADGE_TYPE_PRESETS[(b.type as keyof typeof BADGE_TYPE_PRESETS) || 'custom'] ?? BADGE_TYPE_PRESETS.custom
      const text = String(b.text ?? '').trim() || preset.label
      return {
        bgColor: String(b.bgColor ?? '').trim() || preset.bgColor || THEME_BADGE_BG,
        priority: typeof b.priority === 'number' ? b.priority : preset.priority,
        text,
        textColor: String(b.textColor ?? '').trim() || preset.textColor || THEME_BADGE_TEXT,
      }
    })
    .filter((b) => b.text)

  const all = [...configured]
  if (oldPrice > price && price >= 0) {
    const pct = Math.round(((oldPrice - price) / oldPrice) * 100)
    if (pct > 0) {
      all.push({ auto: true, bgColor: THEME_SALE, priority: 1, text: `−${pct}%`, textColor: '#FFFFFF' })
    }
  }

  const ordered = all
    .map((b, i) => ({ b, i }))
    .sort((x, y) => x.b.priority - y.b.priority || x.i - y.i)
    .map(({ b }) => b)

  const visible = ordered.slice(0, MAX_BADGES)
  const hidden = ordered.length - visible.length

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Aperçu sur la fiche produit</div>
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: 12, margin: '0 0 10px' }}>
        Ordre réel (priorité croissante), couleurs appliquées et réduction calculée automatiquement. 3 badges
        maximum — le 3ᵉ est masqué sur mobile.
      </p>

      <div
        style={{
          alignItems: 'flex-start',
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 64,
          padding: 14,
        }}
      >
        {visible.length === 0 ? (
          <span style={{ color: 'var(--theme-elevation-400)', fontSize: 12 }}>
            Aucun badge affiché pour le moment.
          </span>
        ) : (
          visible.map((badge, i) => (
            <span
              key={`${badge.text}-${i}`}
              title={badge.auto ? 'Badge automatique — calculé depuis le prix barré' : `Priorité ${badge.priority}`}
              style={{
                background: badge.bgColor,
                borderRadius: 9999,
                color: badge.textColor,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                lineHeight: 1.25,
                padding: '5px 11px',
                whiteSpace: 'nowrap',
              }}
            >
              {badge.text}
            </span>
          ))
        )}
      </div>

      {hidden > 0 && (
        <p style={{ color: '#B7791F', fontSize: 12, margin: '8px 0 0' }}>
          {hidden} badge(s) au-delà de la limite de 3 ne seront pas affichés. Ajustez les priorités pour choisir
          lesquels apparaissent.
        </p>
      )}
    </div>
  )
}
