import type { Metadata } from "next";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";

const SLUG = "mentions-legales" as const;
const TITLE = "Mentions légales";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(SLUG, TITLE, "/mentions-legales");
}

export default async function MentionsLegalesPage() {
  const page = await fetchInstitutionalPage(SLUG);
  return <InstitutionalDocument page={page} fallbackTitle={TITLE} />;
}
