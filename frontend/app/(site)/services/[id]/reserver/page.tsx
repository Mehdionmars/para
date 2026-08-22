import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationView } from "@/components/services/ReservationView";
import { SERVICES } from "@/data/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: String(s.id) }));
}

// The date picker starts from "today" — this route must be rendered per-request,
// not statically cached at build time, or the available dates go stale.
export const dynamic = "force-dynamic";

function findService(id: string) {
  return SERVICES.find((s) => s.id === Number(id));
}

export const metadata: Metadata = {
  title: "Réserver un créneau — Para d'Hiver",
};

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = findService(id);
  if (!service) notFound();

  return <ReservationView service={service} />;
}
