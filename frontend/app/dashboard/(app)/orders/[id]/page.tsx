import {
  ArrowLeft,
  CreditCard,
  History,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  StickyNote,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { OrderHeaderActions } from "@/components/dashboard/orders/OrderHeaderActions";
import { OrderTimelineCompact } from "@/components/dashboard/orders/OrderTimelineCompact";
import { PaymentStatusSelect } from "@/components/dashboard/orders/PaymentStatusSelect";
import { CMS_URL } from "@/lib/dashboard/constants";
import { requireRole } from "@/lib/dashboard/guard";
import { getOrder, getOrderHistory, getOrderItemImages } from "@/lib/dashboard/orders";
import { paymentMethodLabel, ORDER_STATUS_BADGE, ORDER_STATUS_LABELS, orderItemVariantLabel } from "@/lib/dashboard/orders-types";
import { Badge } from "@/components/ui/badge";
import { canEditOrders, isStaffUser } from "@/lib/dashboard/roles";

function money(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
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

      {/* ------------------------------------------------------------ body
          Two columns: what the order is (articles, payment, what happened
          to it, notes) on the left; who it is for, where it goes and what
          it costs on the right, pinned while the left scrolls. The
          secondary blocks used to be folded away under "Informations
          supplémentaires"; they are short, so they are simply shown. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section icon={Package} title="Articles" hint={`${itemCount} article${itemCount > 1 ? "s" : ""}`} flush>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const productId = typeof item.product === "object" && item.product ? item.product.id : item.product;
                const image = typeof productId === "number" ? images.get(productId) : undefined;
                const variantLabel = orderItemVariantLabel(item);
                return (
                  <li className="flex items-center gap-3 px-4 py-3" key={item.id}>
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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
                    </div>

                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                      × {item.quantity}
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                      {money(item.price * item.quantity)}
                      {item.quantity > 1 && <span className="block text-[11px] font-normal text-muted-foreground">{money(item.price)} / u.</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Section icon={CreditCard} title="Paiement">
              <PaymentStatusSelect id={order.id} paymentStatus={order.paymentStatus} readOnly={!editable} />
              <div className="flex flex-col gap-1">
                <Line label="Mode" value={paymentMethodLabel(order.paymentMethod)} />
                {order.couponCode && <Line label="Code promo" value={<span className="font-medium">{order.couponCode}</span>} />}
              </div>
            </Section>

            <Section icon={StickyNote} title="Notes internes">
              {order.notes ? (
                <p className="whitespace-pre-line text-sm text-foreground">{order.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune note sur cette commande.</p>
              )}
            </Section>
          </div>

          <Section icon={History} title="Historique" hint={`${history.length} étape${history.length > 1 ? "s" : ""}`}>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p>
            ) : (
              <ol className="relative flex flex-col gap-3 border-l border-border pl-5">
                {history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <li className="relative text-sm" key={h.id}>
                      <span
                        aria-hidden="true"
                        className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-card ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}
                      />
                      <p className="text-foreground">
                        {h.fromStatus ? <span className="text-muted-foreground">{ORDER_STATUS_LABELS[h.fromStatus]} → </span> : ""}
                        <strong className="font-medium">{ORDER_STATUS_LABELS[h.toStatus]}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                        {h.changedByEmail ? ` · ${h.changedByEmail}` : ""}
                      </p>
                      {h.reason && <p className="mt-0.5 text-xs text-muted-foreground">{h.reason}</p>}
                    </li>
                  ))}
              </ol>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
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
              <span className="text-2xl font-semibold tabular-nums text-primary">{money(order.total)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase">
                {(order.customerName || "?").trim().charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{order.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">{order.customerEmail}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {order.customerPhone ? (
                <>
                  <ContactButton href={`tel:${order.customerPhone.replace(/\s/g, "")}`} icon={Phone} label="Appeler" />
                  <ContactButton href={`https://wa.me/${whatsappNumber(order.customerPhone)}`} icon={MessageCircle} label="WhatsApp" external />
                </>
              ) : (
                <span className="col-span-2 self-center text-xs text-muted-foreground">Aucun téléphone</span>
              )}
              <ContactButton href={`mailto:${order.customerEmail}`} icon={Mail} label="Email" />
            </div>
            {order.customerPhone && <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{order.customerPhone}</p>}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" /> Livraison
            </p>
            {order.shippingAddress ? (
              <p className="whitespace-pre-line break-words text-sm text-foreground">{order.shippingAddress}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune adresse renseignée</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="size-3.5" aria-hidden="true" />
              {order.shipping ? money(order.shipping) : "Livraison offerte"}
              {" · "}
              {paymentMethodLabel(order.paymentMethod)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** A Moroccan number as WhatsApp wants it: digits only, country code first. */
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return digits;
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  return digits;
}

function ContactButton({ href, icon: Icon, label, external = false }: { href: string; icon: LucideIcon; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
      className="flex flex-col items-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </a>
  );
}

/** A block of the page: icon, title, an optional count, then the content.
 * `flush` lets a list run edge to edge under the header. */
function Section({
  icon: Icon,
  title,
  hint,
  flush = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-xs">
      <header className={`flex items-center justify-between gap-3 px-4 pt-4 ${flush ? "border-b border-border pb-3" : ""}`}>
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {title}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </header>
      <div className={flush ? "" : "flex flex-col gap-3 px-4 pt-3 pb-4"}>{children}</div>
    </section>
  );
}
