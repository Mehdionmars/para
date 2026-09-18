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
import { paymentMethodLabel, ORDER_STATUS_BADGE, ORDER_STATUS_LABELS, orderItemVariantLabel } from "@/lib/dashboard/orders-types";
import { Badge } from "@/components/ui/badge";
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
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      {title && (
        <h2 className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right text-foreground">{value}</span>
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
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------- masthead
          Identity, state and progress in one bordered object.

          These were three things at three weights: the number on the page
          ground, the status readable only as the first dot of a timeline five
          panels down, and that timeline in a card of its own carrying one row
          of dots. An operator opening an order asks "what state is this in"
          before anything else, and the page answered it last.

          It is also the only panel on this page with two zones, which is what
          makes it read as the masthead rather than as the first of six equal
          cards. */}
      <header className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4">
        <Link
          aria-label="Retour aux commandes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/dashboard/orders"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>

        {/* basis-0 with grow lets the title column shrink below its content
            width, which is what keeps the actions on the same row down to
            320px instead of wrapping them under a half-empty line. */}
        <div className="min-w-0 grow basis-0">
          {/* The state, where the eye already is. It existed on this page only
              as the colour of the first dot in the tracker below — legible if
              you knew to decode it, invisible if you did not. The badge
              vocabulary is the one the orders table already uses, so the state
              a operator saw in the list is the state they see here. */}
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground">{order.orderNumber}</h1>
            <Badge className="shrink-0" variant={ORDER_STATUS_BADGE[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          {/* One metadata line instead of three separate blocks. */}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
          receiptHref={`/dashboard/orders/${order.id}/recu`}
          readOnly={!editable}
          status={order.status}
        />
        </div>

        {/* The tracker, as the masthead's second zone rather than a panel of
            its own. It is the same information as the badge above, one level
            finer — where the order is, not just what it is — so it belongs
            attached to the number, not five sections down between the
            addresses and the internal notes. */}
        <div className="border-t border-border px-4 py-3.5">
          <OrderTimelineCompact
            entries={history.map((h) => ({ at: h.createdAt, status: h.toStatus }))}
            status={order.status}
          />
        </div>
      </header>

      {/* --------------------------------------------- articles + résumé */}
      {/* items-start: without it the grid stretches both columns to the
          taller one, leaving a block of empty space under a short article
          list. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={`Articles (${order.items.length})`} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {order.items.map((item) => {
              const productId = typeof item.product === "object" && item.product ? item.product.id : item.product;
              const image = typeof productId === "number" ? images.get(productId) : undefined;
              const variantLabel = orderItemVariantLabel(item);
              return (
                <li className="flex items-center gap-3 px-4 py-3" key={item.id}>
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                    <p className="truncate text-sm font-medium text-foreground" title={item.name}>
                      {item.name}
                    </p>
                    {/* Two lines of one product must never be mistaken for
                        each other: the option and its SKU are what tell the
                        operator which box to pick. */}
                    {(variantLabel || item.sku) && (
                      <p className="mt-0.5 truncate text-xs text-foreground">
                        {variantLabel && <span className="font-medium">{variantLabel}</span>}
                        {variantLabel && item.sku && <span className="text-muted-foreground"> · </span>}
                        {item.sku && <span className="text-muted-foreground">SKU {item.sku}</span>}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.quantity} × {money(item.price)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
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
                value={<span className="text-success-strong">−{money(discount)}</span>}
              />
            )}
            {order.giftLabel && (
              <Line label="Cadeau à joindre" value={<span className="font-medium text-success-strong">{order.giftLabel}</span>} />
            )}
            <Line label="Livraison" value={order.shipping ? money(order.shipping) : "Offerte"} />
          </div>

          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-lg font-semibold tabular-nums text-primary">{money(order.total)}</span>
          </div>
        </Panel>
      </div>

      {/* --------------------------------------- destinataire + livraison
          One panel, two columns, one border.

          These were two cards side by side holding four short lines each. Who
          the order is for and where it goes is one question an operator asks
          once, while packing — splitting it across two bordered boxes spent
          twice the chrome to say that these two things are unrelated, which
          they are not. The divider does the same job for a tenth of the ink,
          and it becomes a stacked pair on a phone where columns cannot hold. */}
      <Panel title="Destinataire et livraison" bodyClassName="p-0">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-4">
          {/* The two words the merge took away. The panel title names the
              domain; these name the columns inside it, so an operator still
              scans to "the address" rather than to "the right-hand side". */}
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Client</p>
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-foreground">{order.customerName}</p>
            <a className="truncate text-primary hover:underline" href={`mailto:${order.customerEmail}`}>
              {order.customerEmail}
            </a>
            {order.customerPhone && (
              <a className="text-muted-foreground hover:underline" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Livraison</p>
          <div className="flex flex-col gap-1 text-sm">
            {order.shippingAddress ? (
              <p className="whitespace-pre-line break-words text-foreground">{order.shippingAddress}</p>
            ) : (
              <p className="text-muted-foreground">Aucune adresse renseignée</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {paymentMethodLabel(order.paymentMethod)}
              {" · "}
              {order.shipping ? money(order.shipping) : "Livraison offerte"}
            </p>
          </div>
        </div>
        </div>
      </Panel>

      {/* --------------------------------------- informations secondaires
          No border, deliberately.

          This block is collapsed by definition — it is what an operator opens
          when something is unusual, not what they read to ship the order.
          Giving it the same panel treatment as the articles said the opposite,
          and it was the sixth identical card in a column of six, which is what
          made the page read as a list of boxes rather than as a document with
          a top and a tail. A rule and a label are enough to say "there is more
          here"; the Collapsible rows bring their own dividers. */}
      <section>
        <h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Informations supplémentaires
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card/60">
        <Collapsible hint={`${history.length} entrée${history.length > 1 ? "s" : ""}`} title="Historique des statuts">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {history
                .slice()
                .reverse()
                .map((h) => (
                  <li className="text-sm" key={h.id}>
                    <p className="text-foreground">
                      {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus]} → ` : ""}
                      <strong>{ORDER_STATUS_LABELS[h.toStatus]}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString("fr-FR")}
                      {h.changedByEmail ? ` · ${h.changedByEmail}` : ""}
                    </p>
                    {h.reason && <p className="mt-0.5 text-xs text-muted-foreground">{h.reason}</p>}
                  </li>
                ))}
            </ul>
          )}
        </Collapsible>

        <Collapsible title="Paiement">
          <div className="flex flex-col gap-3">
            <PaymentStatusSelect id={order.id} paymentStatus={order.paymentStatus} readOnly={!editable} />
            <div className="flex flex-col gap-1">
              <Line label="Mode" value={paymentMethodLabel(order.paymentMethod)} />
              {order.couponCode && <Line label="Code promo" value={order.couponCode} />}
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Notes internes">
          {order.notes ? (
            <p className="whitespace-pre-line text-sm text-foreground">{order.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune note.</p>
          )}
        </Collapsible>
        </div>
      </section>
    </div>
  );
}
