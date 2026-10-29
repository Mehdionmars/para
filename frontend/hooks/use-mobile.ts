import * as React from "react"

// The sidebar's drawer threshold. 1024 rather than shadcn's 768: at a
// portrait tablet's 768-1023px a 16rem rail left the page ~500px, so below
// `lg` the navigation is a drawer with full labels instead. Must match the
// `lg:` classes in components/ui/sidebar.tsx.
const MOBILE_BREAKPOINT = 1024
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
