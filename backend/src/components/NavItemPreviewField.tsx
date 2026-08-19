'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * Live preview of one navigation link, rendered inside the Navigation global
 * right under each item's style fields.
 *
 * Reads form state rather than the saved document so an editor sees the
 * colour, weight, opacity, badge and blink together before saving. That
 * matters more here than on most fields: the effect of "opacity 0.6 + gras +
 * clignotement lent" is impossible to picture from five separate inputs, and
 * the alternative is save-reload-look on the live storefront.
 *
 * The CSS below intentionally mirrors the .nav-link / .nav-anim rules in
 * frontend/app/(site)/globals.css. The two projects don't import from each
 * other, so this is kept in sync by hand — same arrangement as the product
 * badges preview.
 */

const THEME_INK = '#373020'
const THEME_PLUM = '#5E4074'

const BADGE_PALETTE: Record<string, string> = {
  plum: '#5E4074',
  sale: '#FF514D',
  teal: '#008AA5',
}

type Row = {
  label: string
  color: string
  hoverColor: string
  bg: string
  border: string
  weight: string
  opacity: string
  badgeLabel: string
  badgeBg: string
  badgeText: string
  animEnabled: boolean
  animType: string
  animDuration: string
}

/** Turns a flat form-field map into one row per `items.<n>` entry. */
function collect(get: (path: string) => unknown): Row[] {
  const rows: Row[] = []

  for (let i = 0; ; i++) {
    const label = get(`items.${i}.label`)
    // Payload keeps a field entry for every row; the first missing label
    // means we've walked past the end of the array.
    if (label === undefined) break

    rows.push({
      animDuration: String(get(`items.${i}.animation.duration`) ?? '2'),
      animEnabled: get(`items.${i}.animation.enabled`) === true,
      animType: String(get(`items.${i}.animation.type`) ?? 'none'),
      badgeBg:
        String(get(`items.${i}.badgeBackgroundColor`) ?? '') ||
        BADGE_PALETTE[String(get(`items.${i}.badgeColor`) ?? 'none')] ||
        '',
      badgeLabel: String(get(`items.${i}.badgeLabel`) ?? ''),
      badgeText: String(get(`items.${i}.badgeTextColor`) ?? '') || '#FFFFFF',
      bg: String(get(`items.${i}.appearance.backgroundColor`) ?? ''),
      border: String(get(`items.${i}.appearance.borderColor`) ?? ''),
      color: String(get(`items.${i}.appearance.color`) ?? '') || THEME_INK,
      hoverColor: String(get(`items.${i}.appearance.hoverColor`) ?? ''),
      label: String(label ?? ''),
      opacity: String(get(`items.${i}.appearance.opacity`) ?? ''),
      weight: String(get(`items.${i}.appearance.fontWeight`) ?? '') || '400',
    })
  }

  return rows
}

export function NavItemPreviewField() {
  // One subscription over the whole field map, serialised to a string:
  // useFormFields compares by identity, so returning a fresh array would
  // re-render this preview on every keystroke anywhere in the form.
  const serialised = useFormFields(([fields]) => {
    const get = (path: string) => fields?.[path]?.value
    return JSON.stringify(collect(get))
  })

  const rows: Row[] = React.useMemo(() => {
    try {
      return JSON.parse(serialised) as Row[]
    } catch {
      return []
    }
  }, [serialised])

  const visible = rows.filter((r) => r.label.trim())

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Aperçu de la navigation</div>
      <p style={{ fontSize: 12, opacity: 0.65, margin: '0 0 10px' }}>
        Rendu approximatif de la barre de navigation. Le survol est simulé au passage de la souris ; les
        animations sont désactivées si votre système demande de réduire les animations.
      </p>

      {visible.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.6, padding: '12px 0' }}>Aucun lien à prévisualiser.</div>
      ) : (
        <div
          style={{
            alignItems: 'center',
            background: '#fff',
            border: '1px solid rgba(0,0,0,.12)',
            borderRadius: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            padding: '14px 16px',
          }}
        >
          {visible.map((r, i) => {
            const opacity = r.opacity !== '' && !Number.isNaN(Number(r.opacity)) ? Number(r.opacity) : 1
            const animating = r.animEnabled && r.animType !== 'none'

            return (
              <span
                key={i}
                className={animating ? `nav-preview-anim nav-preview-anim--${r.animType}` : undefined}
                style={{
                  alignItems: 'center',
                  animationDuration: animating ? `${Number(r.animDuration) || 2}s` : undefined,
                  background: r.bg || 'transparent',
                  border: r.border ? `1px solid ${r.border}` : undefined,
                  borderRadius: r.bg || r.border ? 999 : undefined,
                  color: r.color,
                  display: 'inline-flex',
                  fontSize: 13,
                  fontWeight: Number(r.weight) || 400,
                  gap: 6,
                  opacity,
                  padding: r.bg || r.border ? '4px 12px' : undefined,
                  transition: 'color 180ms ease',
                }}
                onMouseEnter={(e) => {
                  if (r.hoverColor) e.currentTarget.style.color = r.hoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = r.color
                }}
                title={r.hoverColor ? `Survol : ${r.hoverColor}` : undefined}
              >
                {r.label}
                {r.badgeLabel && (
                  <span
                    style={{
                      background: r.badgeBg || THEME_PLUM,
                      borderRadius: 999,
                      color: r.badgeText,
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: '.04em',
                      padding: '2px 7px',
                    }}
                  >
                    {r.badgeLabel}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Scoped to the preview so it can never leak into the admin chrome. */}
      <style>{`
        .nav-preview-anim {
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .nav-preview-anim--blink { animation-name: navPreviewBlink; }
        .nav-preview-anim--pulse { animation-name: navPreviewPulse; }
        .nav-preview-anim--glow  { animation-name: navPreviewGlow; }
        .nav-preview-anim--shimmer { animation-name: navPreviewBlink; }
        @keyframes navPreviewBlink { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        @keyframes navPreviewPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.045) } }
        @keyframes navPreviewGlow  { 0%,100% { text-shadow: none } 50% { text-shadow: 0 0 10px currentColor } }
        @media (prefers-reduced-motion: reduce) {
          .nav-preview-anim { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
