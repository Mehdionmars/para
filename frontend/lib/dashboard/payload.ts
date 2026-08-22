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

/** Resolves the current dashboard session, or null if unauthenticated/expired. Use in Server Components/route handlers. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  if (!store.get(SESSION_COOKIE)?.value) return null;

  const res = await payloadFetch("/api/users/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ? { id: data.user.id, email: data.user.email, roles: data.user.roles ?? [] } : null;
}
