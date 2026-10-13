import { useSyncExternalStore } from "react";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCE_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribePageVisible(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * Whether the visitor asked their OS for less motion. External browser state
 * that can flip while the page is open, hence useSyncExternalStore. The server
 * snapshot is `false`: erring the other way would ship a paused carousel to
 * everyone.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_MOTION_QUERY).matches,
    () => false,
  );
}

/** A carousel advancing in a tab nobody is looking at burns a timer and can
 * quietly pull images for slides the visitor never sees. */
export function usePageVisible() {
  return useSyncExternalStore(
    subscribePageVisible,
    () => !document.hidden,
    () => true,
  );
}
