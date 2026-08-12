import Link from 'next/link'
import React from 'react'

export function ApiMonitoringNavLink() {
  return (
    <Link
      className="nav__link"
      href="/admin/api-monitoring"
      style={{ alignItems: 'center', display: 'flex', gap: 8 }}
    >
      Monitoring API
    </Link>
  )
}
