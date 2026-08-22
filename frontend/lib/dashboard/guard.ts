import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./payload";

/**
 * Server-side page guard: redirects to login/overview when the signed-in
 * user doesn't satisfy `check`. Defense in depth — the Sidebar already hides
 * links a role can't use, but this stops someone from reaching the page
 * directly by URL. The real security boundary is still the Payload API's
 * own collection access rules; this only protects the dashboard UI itself.
 */
export async function requireRole(check: (user: SessionUser) => boolean): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/dashboard/login");
  if (!check(user)) redirect("/dashboard?error=acces_refuse");
  return user;
}
