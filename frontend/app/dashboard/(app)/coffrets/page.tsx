import { CoffretsManager } from "@/components/dashboard/coffrets/CoffretsManager";
import { requireRole } from "@/lib/dashboard/guard";
import { payloadFetch } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";
import { mapHomeDocToDraft } from "@/lib/dashboard/storefront-mapping";

/**
 * Coffrets & cadeaux, on a page of their own.
 *
 * The cards live in the Home global, next to every other home section, and
 * were only reachable as one section among twenty-one in the Storefront
 * Builder. This page edits the same draft — the builder and this page can
 * never disagree — but shows nothing else.
 */
export default async function CoffretsPage() {
  await requireRole(canEditContent);

  const res = await payloadFetch("/api/globals/home?draft=true&depth=2");
  if (!res.ok) throw new Error("Impossible de charger les coffrets.");
  const doc = await res.json();

  return <CoffretsManager initialDraft={mapHomeDocToDraft(doc)} initialStatus={doc._status || "draft"} />;
}
