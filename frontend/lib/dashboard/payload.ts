import { cookies } from "next/headers";
import { CMS_URL, SESSION_COOKIE } from "./constants";
import type { Role } from "./roles";

export { CMS_URL, SESSION_COOKIE };

export type SessionUser = {
  id: number;
  email: string;
  roles: Role[];
};

/** Server-only fetch to the Payload API, authenticated with the dashboard's session cookie. */
export async function payloadFetch(path: string, init: RequestInit = {}) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  // Only force JSON content-type for plain string bodies — FormData (file
  // uploads) needs its own auto-computed multipart boundary, which fetch
  // sets automatically as long as we don't override it here.
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  return fetch(`${CMS_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
}

/** Pages fetched at once after the first: enough to hide the round trips,
 * few enough not to queue a burst on the CMS's database pool. */
const PAGE_CONCURRENCY = 4;

/**
 * Every document of a collection, page by page.
 *
 * Paged because one request for "all" is not a contract the API makes, and
 * a list that silently stops at a cap is a confidently wrong total. The page
 * size was 100, on the belief that the API capped there; it does not
 * (limit=1000 answers 1 000 documents), and at 100 a 12 000-row catalogue
 * meant 125 requests made one after the other — the dashboard home spent
 * seconds on it. Now: the first page says how many there are, the rest are
 * fetched in parallel, PAGE_CONCURRENCY at a time.
 *
 * `path` carries the query without a limit; this adds `limit` and `page`.
 * Any failed page fails the list (null): returning what arrived would hand
 * the caller a plausible, incomplete answer.
 */
export async function payloadFetchAll<T>(path: string, perPage = 500): Promise<T[] | null> {
  const join = path.includes("?") ? "&" : "?";
  type PageData = { docs?: T[]; totalPages?: number };

  async function fetchPage(page: number): Promise<PageData | null> {
    const res = await payloadFetch(`${path}${join}limit=${perPage}&page=${page}`);
    return res.ok ? ((await res.json()) as PageData) : null;
  }

  const first = await fetchPage(1);
  if (!first) return null;
  const pages: (T[] | undefined)[] = [first.docs ?? []];
  const totalPages = first.totalPages ?? 1;

  for (let start = 2; start <= totalPages; start += PAGE_CONCURRENCY) {
    const batch = Array.from({ length: Math.min(PAGE_CONCURRENCY, totalPages - start + 1) }, (_, i) => start + i);
    const results = await Promise.all(batch.map(fetchPage));
    if (results.some((r) => r === null)) return null;
    results.forEach((r, i) => (pages[batch[i] - 1] = r!.docs ?? []));
  }

  return pages.flatMap((docs) => docs ?? []);
}

/**
 * How many documents match, without transferring any of them: Payload's
 * `/api/<collection>/count`. `path` is that endpoint with its `where` query.
 * Null when the request fails, so a caller can say "—" instead of 0.
 */
export async function payloadCount(path: string): Promise<number | null> {
  const res = await payloadFetch(path);
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { totalDocs?: unknown } | null;
  return typeof data?.totalDocs === "number" ? data.totalDocs : null;
}

/** Resolves the current dashboard session, or null if unauthenticated/expired. Use in Server Components/route handlers. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  if (!store.get(SESSION_COOKIE)?.value) return null;

  const res = await payloadFetch("/api/users/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ? { id: data.user.id, email: data.user.email, roles: data.user.roles ?? [] } : null;
}
