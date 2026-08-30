import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationView } from "@/components/services/ReservationView";
import { SERVICES } from "@/data/services";
import { SERVICE_ICONS, fetchServiceById } from "@/lib/storefront/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: String(s.id) }));
}

// The date picker starts from "today" — this route must be rendered per-request,
// not statically cached at build time, or the available dates go stale.
export const dynamic = "force-dynamic";

/** Live. SERVICES above is still used by generateStaticParams: which paths
 * are pre-rendered is a build-time question, and a service added in the CMS
 * afterwards still renders on demand. */
async function findService(id: string) {
  return fetchServiceById(Number(id));
}

export const metadata: Metadata = {
  title: "Réserver un créneau — Para d'Hiver",
};

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await findService(id);
  if (!service) notFound();

  // `icon` is a React component and cannot cross into a client component.
  // Its name can, so the icon is looked up by name and the rest of the
  // service goes over as plain data.
  const { icon, ...serializable } = service;
  const iconName = Object.entries(SERVICE_ICONS).find(([, c]) => c === icon)?.[0];

  return <ReservationView service={serializable} iconName={iconName} />;
}
