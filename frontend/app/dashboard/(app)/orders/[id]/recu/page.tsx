import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderReceipt } from "@/components/dashboard/orders/OrderReceipt";
import { LOGO } from "@/data/siteChrome";
import { requireRole } from "@/lib/dashboard/guard";
import { getOrder } from "@/lib/dashboard/orders";
import { canEditOrders } from "@/lib/dashboard/roles";
import { fetchPublishedSiteChrome } from "@/lib/storefront/siteChromeContent";

export const metadata: Metadata = {
  title: "Reçu de commande — Para d'Hiver",
  robots: { index: false, follow: false },
};

/**
 * The customer-facing receipt for one order.
 *
 * Same role guard as the order detail page and the thermal ticket: a receipt
 * carries the customer's name, phone and address, so it must not be reachable
 * by anyone who cannot already open the order.
 *
 * The logo comes from the same published Site Chrome the storefront header
 * reads, so the document is stamped with whatever mark the shop is currently
 * using rather than a copy that drifts. The bundled asset is the fallback if
 * the CMS is unreachable — a receipt without a logo still has to print.
 */
export default async function OrderReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  await requireRole(canEditOrders);
  const { id } = await params;
  const { autoprint } = await searchParams;

  const [order, chrome] = await Promise.all([getOrder(id), fetchPublishedSiteChrome().catch(() => null)]);
  if (!order) notFound();

  return (
    <div className="p-4 sm:p-6">
      <OrderReceipt order={order} logoSrc={(chrome?.logo ?? LOGO).img} autoPrint={autoprint === "1"} />
    </div>
  );
}
