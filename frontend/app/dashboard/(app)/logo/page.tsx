import { LogoManager } from "@/components/dashboard/logo/LogoManager";
import { requireRole } from "@/lib/dashboard/guard";
import { payloadFetch } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";
import { mapSiteChromeDocToDraft } from "@/lib/dashboard/storefront-mapping";

/** The header and footer logos, on a page of their own. Edits the same Site
 * Chrome draft as the Storefront Builder's Global tab. */
export default async function LogoPage() {
  await requireRole(canEditContent);

  const res = await payloadFetch("/api/globals/site-chrome?draft=true&depth=2");
  if (!res.ok) throw new Error("Impossible de charger le logo.");
  const doc = await res.json();

  return <LogoManager initialDraft={mapSiteChromeDocToDraft(doc)} initialStatus={doc._status || "draft"} />;
}
