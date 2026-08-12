'use client'

import React, { useEffect, useState } from 'react'

type EndpointStat = {
  avgDurationMs: number | null
  count: number
  endpoint: string
  errorRate: number
}

type RecentRow = {
  createdAt: string
  durationMs?: number | null
  method?: string | null
  operation?: string | null
  path: string
  statusCode?: number | null
}

type Stats = {
  avgDurationMs: number | null
  errorRate: number
  recent: RecentRow[]
  sampleSize: number
  topEndpoints: EndpointStat[]
  totalRequests: number
}

const cell: React.CSSProperties = { borderBottom: '1px solid #e6e6e6', padding: '8px 10px', fontSize: 13, textAlign: 'left' }
const th: React.CSSProperties = { ...cell, fontWeight: 600, background: '#fafafa', position: 'sticky', top: 0 }

function statTile(label: string, value: string) {
  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, flex: 1, minWidth: 160, padding: 16 }}>
      <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

export function ApiMonitoringView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/monitoring/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Échec du chargement des statistiques.')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur inconnue.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ margin: '0 auto', maxWidth: 1100, padding: '40px 32px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Monitoring API</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        Usage des endpoints de l&apos;API — basé sur les {stats?.sampleSize ?? '…'} dernières requêtes enregistrées.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      {!stats && !error && <p>Chargement…</p>}

      {stats && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
            {statTile('Requêtes (échantillon)', String(stats.totalRequests))}
            {statTile('Latence moyenne', stats.avgDurationMs !== null ? `${stats.avgDurationMs} ms` : '—')}
            {statTile('Taux d’erreur', `${(stats.errorRate * 100).toFixed(1)} %`)}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Endpoints les plus utilisés</h2>
          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, marginBottom: 28, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>Endpoint</th>
                  <th style={th}>Requêtes</th>
                  <th style={th}>Latence moy.</th>
                  <th style={th}>Taux d&apos;erreur</th>
                </tr>
              </thead>
              <tbody>
                {stats.topEndpoints.map((e) => (
                  <tr key={e.endpoint}>
                    <td style={cell}>{e.endpoint}</td>
                    <td style={cell}>{e.count}</td>
                    <td style={cell}>{e.avgDurationMs !== null ? `${e.avgDurationMs} ms` : '—'}</td>
                    <td style={{ ...cell, color: e.errorRate > 0 ? '#c0392b' : undefined }}>
                      {(e.errorRate * 100).toFixed(1)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Requêtes récentes</h2>
          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, maxHeight: 420, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Méthode</th>
                  <th style={th}>Chemin</th>
                  <th style={th}>Opération</th>
                  <th style={th}>Statut</th>
                  <th style={th}>Durée</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r, i) => (
                  <tr key={i} style={{ background: (r.statusCode ?? 200) >= 400 ? '#fff5f5' : undefined }}>
                    <td style={cell}>{new Date(r.createdAt).toLocaleString('fr-FR')}</td>
                    <td style={cell}>{r.method || '—'}</td>
                    <td style={cell}>{r.path}</td>
                    <td style={cell}>{r.operation || '—'}</td>
                    <td style={{ ...cell, color: (r.statusCode ?? 200) >= 400 ? '#c0392b' : undefined }}>
                      {r.statusCode ?? '—'}
                    </td>
                    <td style={cell}>{r.durationMs !== null && r.durationMs !== undefined ? `${r.durationMs} ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
