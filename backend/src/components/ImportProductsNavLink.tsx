import Link from 'next/link'
import React from 'react'

export function ImportProductsNavLink() {
  return (
    <Link
      className="nav__link"
      href="/admin/import-products"
      style={{ alignItems: 'center', display: 'flex', gap: 8 }}
    >
      Import produits
    </Link>
  )
}
