"use client";

import { useEffect } from "react";

/**
 * A refresh starts the page from the top.
 *
 * Browsers restore the scroll position on reload, so refreshing halfway down
 * the home page landed back halfway down. The shop wants a refresh to behave
 * like arriving on the site.
 *
 * Only a reload is affected. In-app navigation keeps Next's own scroll
 * handling, and the browser's back/forward restoration is handed back as soon
 * as the page is at the top — "manual" is only held across the unload, which
 * is the one moment the browser decides where a reloaded page lands.
 */
export function ScrollToTopOnReload() {
  useEffect(() => {
    const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    // A URL with an anchor asked for a place on the page; honour it.
    if (entry?.type === "reload" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";

    const beforeUnload = () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  return null;
}
