import type { Metadata } from "next";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";

const SLUG = "retours" as const;
const TITLE = "Retours et remboursements";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(SLUG, TITLE, "/retours");
}

/**
 * Deliberately carries no default policy text.
 *
 * The product page advertises "retour gratuit sous 7 jours si le produit n'a
 * pas été ouvert", and the code that prints it says so in its own comment:
 * that promise "appears nowhere else and is unconfirmed"
 * (components/product/PurchasePanel.tsx). Restating it here would turn an
 * unverified line into the shop's published returns policy — on a
 * parapharmacie, where what may be returned is a regulatory question, not a
 * copywriting one. The structure is ready in Payload; the pharmacy fills it.
 */
export default async function RetoursPage() {
  const page = await fetchInstitutionalPage(SLUG);
  return <InstitutionalDocument page={page} fallbackTitle={TITLE} />;
}
