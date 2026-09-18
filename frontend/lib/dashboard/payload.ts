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

/**
 * Every document of a collection, page by page.
 *
 * `limit=1000` looked like "all of them" and was not: the API caps a page at
 * 100, answers with the first hundred and a `totalPages` nobody read. The
 * products list showed 100 of 143, the orders list only the 100 most recent,
 * and every figure derived from them was quietly computed on a slice.
 *
 * `path` carries the query without a limit; this adds `limit` and `page`.
 * Pages are fetched in sequence — a few round trips of ~80ms each, where the
 * alternative is a confidently wrong total.
 */
export async function payloadFetchAll<T>(path: string, perPage = 100): Promise<T[] | null> {
  const join = path.includes("?") ? "&" : "?";
  const all: T[] = [];

  for (let page = 1; ; page++) {
    const res = await payloadFetch(`${path}${join}limit=${perPage}&page=${page}`);
    // A failed page is a failed list: returning what arrived so far would
    // hand the caller a plausible, incomplete answer.
    if (!res.ok) return null;

    const data = (await res.json()) as { docs?: T[]; hasNextPage?: boolean };
    all.push(...(data.docs ?? []));
    if (!data.hasNextPage) return all;
  }
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
