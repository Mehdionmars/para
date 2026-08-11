import React from 'react'

export function AdminLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static admin asset, next/image not worth the config here
    <img alt="Para d'Hiver" src="/logo.png" style={{ height: 80, width: 80 }} />
  )
}

export function AdminIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="Para d'Hiver" src="/logo.png" style={{ height: 32, width: 32 }} />
  )
}
