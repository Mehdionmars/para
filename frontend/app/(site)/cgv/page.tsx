import type { Metadata } from "next";
import { InstitutionalDocument } from "@/components/institutional/InstitutionalDocument";
import { fetchInstitutionalPage } from "@/lib/storefront/institutional";
import { institutionalMetadata } from "@/lib/storefront/seo";

const SLUG = "cgv" as const;
const TITLE = "Conditions générales de vente";

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata(SLUG, TITLE, "/cgv");
}

export default async function CgvPage() {
  const page = await fetchInstitutionalPage(SLUG);
  return <InstitutionalDocument page={page} fallbackTitle={TITLE} breadcrumb={[{ label: "CGV" }]} />;
}
