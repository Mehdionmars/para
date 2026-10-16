/**
 * Recently visited dashboard pages, per browser.
 *
 * A convenience for the launcher's search ("Récemment visités"), kept in
 * localStorage: per viewer, never shared, and nothing breaks when storage is
 * blocked or cleared — the list is simply empty.
 */

export type RecentVisit = { href: string; label: string; at: number };

const KEY = "pdh-recent-pages";
const CHANGED = "pdh-recent-pages-changed";
const MAX = 8;

export function readRecent(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function parseRecent(raw: string): RecentVisit[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list)
      ? list.filter((v): v is RecentVisit => typeof v?.href === "string" && typeof v?.label === "string")
      : [];
  } catch {
    return [];
  }
}

/** Moves `href` to the front, keeping the list short and free of repeats. */
export function recordVisit(href: string, label: string) {
  const next = [{ at: Date.now(), href, label }, ...parseRecent(readRecent()).filter((v) => v.href !== href)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function subscribeRecent(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}
