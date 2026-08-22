import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { OrderHeaderActions } from "@/components/dashboard/orders/OrderHeaderActions";
import { OrderTimelineCompact } from "@/components/dashboard/orders/OrderTimelineCompact";
import { PaymentStatusSelect } from "@/components/dashboard/orders/PaymentStatusSelect";
import { Collapsible } from "@/components/dashboard/ui/Collapsible";
import { CMS_URL } from "@/lib/dashboard/constants";
import { requireRole } from "@/lib/dashboard/guard";
import { getOrder, getOrderHistory, getOrderItemImages } from "@/lib/dashboard/orders";
import { ORDER_STATUS_LABELS, orderItemVariantLabel } from "@/lib/dashboard/orders-types";
import { canEditOrders, isStaffUser } from "@/lib/dashboard/roles";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}

/** Section wrapper. Cards group *domains* of information, never single
 * fields — that was what made the previous layout so tall. */
function Panel({
  title,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      {title && (
        <h2 className="border-b border-gray-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </h2>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-right text-gray-900">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: PageProps<"/dashboard/orders/[id]">) {
  const user = await requireRole(isStaffUser);
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  // One round trip each, fired together — neither depends on the other.
  const productIds = order.items
    .map((i) => (typeof i.product === "object" && i.product ? i.product.id : i.product))
    .filter((pid): pid is number => typeof pid === "number");

  const [history, images] = await Promise.all([getOrderHistory(order.id), getOrderItemImages(productIds)]);

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const discount = order.discount ?? 0;
  const editable = canEditOrders(user);

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------- header */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Link
          aria-label="Retour aux commandes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          href="/dashboard/orders"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>

        {/* basis-0 with grow lets the title column shrink below its content
            width, which is what keeps the actions on the same row down to
            320px instead of wrapping them under a half-empty line. */}
        <div className="min-w-0 grow basis-0">
          <h1 className="truncate text-lg font-semibold text-gray-900">{order.orderNumber}</h1>
          {/* One metadata line instead of three separate blocks. */}
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            {order.customerName}
            {" · "}
            {itemCount} article{itemCount > 1 ? "s" : ""}
          </p>
        </div>

        <OrderHeaderActions
          adminHref={`${CMS_URL}/admin/collections/orders/${order.id}`}
          id={order.id}
          orderNumber={order.orderNumber}
          printHref={`/dashboard/orders/${order.id}/print?autoprint=1`}
          readOnly={!editable}
          status={order.status}
        />
      </header>

      {/* --------------------------------------------- articles + résumé */}
      {/* items-start: without it the grid stretches both columns to the
          taller one, leaving a block of empty space under a short article
          list. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={`Articles (${order.items.length})`} bodyClassName="p-0">
          <ul className="divide-y divide-gray-50">
            {order.items.map((item) => {
              const productId = typeof item.product === "object" && item.product ? item.product.id : item.product;
              const image = typeof productId === "number" ? images.get(productId) : undefined;
              const variantLabel = orderItemVariantLabel(item);
              return (
                <li className="flex items-center gap-3 px-4 py-3" key={item.id}>
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {/* An order line snapshots the name and price, never the
                        image, so this comes from the product itself. A product
                        deleted since the sale has no entry and keeps the
                        placeholder rather than a broken image. */}
                    <CloudinaryImage
                      alt=""
                      className="object-contain p-1"
                      fallbackSrc={PRODUCT_PLACEHOLDER}
                      fill
                      preset="productThumbnail"
                      sizes="56px"
                      src={image ?? null}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900" title={item.name}>
                      {item.name}
                    </p>
                    {/* Two lines of one product must never be mistaken for
                        each other: the option and its SKU are what tell the
                        operator which box to pick. */}
                    {(variantLabel || item.sku) && (
                      <p className="mt-0.5 truncate text-xs text-gray-700">
                        {variantLabel && <span className="font-medium">{variantLabel}</span>}
                        {variantLabel && item.sku && <span className="text-gray-400"> · </span>}
                        {item.sku && <span className="text-gray-500">SKU {item.sku}</span>}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.quantity} × {money(item.price)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                    {money(item.price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Money only. The status controls that used to sit here moved to the
            header — a summary that also drives the order is doing two jobs,
            and on a phone it put the primary action below every article.
            Sticky so the total stays in view while the operator reads the
            detail below; `self-start` stops the grid stretching it. */}
        <Panel className="lg:sticky lg:top-4 lg:self-start" title="Résumé">
          <div className="flex flex-col gap-1">
            <Line label="Sous-total" value={money(order.subtotal)} />
            {discount > 0 && (
              <Line
                label={`Réduction${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={<span className="text-emerald-600">−{money(discount)}</span>}
              />
            )}
            <Line label="Livraison" value={order.shipping ? money(order.shipping) : "Offerte"} />
          </div>

          <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-semibold tabular-nums text-violet-700">{money(order.total)}</span>
          </div>
        </Panel>
      </div>

      {/* ------------------------------------------- client + livraison */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Client">
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <a className="truncate text-violet-700 hover:underline" href={`mailto:${order.customerEmail}`}>
              {order.customerEmail}
            </a>
            {order.customerPhone && (
              <a className="text-gray-600 hover:underline" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            )}
          </div>
        </Panel>

        <Panel title="Livraison">
          <div className="flex flex-col gap-1 text-sm">
            {order.shippingAddress ? (
              <p className="whitespace-pre-line break-words text-gray-700">{order.shippingAddress}</p>
            ) : (
              <p className="text-gray-400">Aucune adresse renseignée</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {order.paymentMethod || "Mode de paiement non précisé"}
              {" · "}
              {order.shipping ? money(order.shipping) : "Livraison offerte"}
            </p>
          </div>
        </Panel>
      </div>

      {/* ------------------------------------------------------ timeline */}
      <Panel title="Suivi de la commande">
        <OrderTimelineCompact
          entries={history.map((h) => ({ at: h.createdAt, status: h.toStatus }))}
          status={order.status}
        />
      </Panel>

      {/* --------------------------------------- informations secondaires */}
      <Panel bodyClassName="p-0" title="Informations supplémentaires">
        <Collapsible hint={`${history.length} entrée${history.length > 1 ? "s" : ""}`} title="Historique des statuts">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun changement enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {history
                .slice()
                .reverse()
                .map((h) => (
                  <li className="text-sm" key={h.id}>
                    <p className="text-gray-900">
                      {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus]} → ` : ""}
                      <strong>{ORDER_STATUS_LABELS[h.toStatus]}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(h.createdAt).toLocaleString("fr-FR")}
                      {h.changedByEmail ? ` · ${h.changedByEmail}` : ""}
                    </p>
                    {h.reason && <p className="mt-0.5 text-xs text-gray-600">{h.reason}</p>}
                  </li>
                ))}
            </ul>
          )}
        </Collapsible>

        <Collapsible title="Paiement">
          <div className="flex flex-col gap-3">
            <PaymentStatusSelect id={order.id} paymentStatus={order.paymentStatus} readOnly={!editable} />
            <div className="flex flex-col gap-1">
              <Line label="Mode" value={order.paymentMethod || "—"} />
              {order.couponCode && <Line label="Code promo" value={order.couponCode} />}
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Notes internes">
          {order.notes ? (
            <p className="whitespace-pre-line text-sm text-gray-700">{order.notes}</p>
          ) : (
            <p className="text-sm text-gray-500">Aucune note.</p>
          )}
        </Collapsible>
      </Panel>
    </div>
  );
}
