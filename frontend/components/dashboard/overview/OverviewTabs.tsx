"use client";

import { ArrowRight, PackageOpen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/dashboard/ui/Tabs";
import { couponState, COUPON_TYPE_LABELS, type Coupon } from "@/lib/dashboard/coupons-types";
import { money, shortDate } from "@/lib/dashboard/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/dashboard/orders-types";

export type RecentProduct = {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  isPublished: boolean;
  createdAt?: string;
};

export type RecentOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

/**
 * The three short lists under the calendar.
 *
 * `null` for a list means its request failed, and is rendered as such. The
 * page loads four things from three collections, and one of them being
 * unreachable is not a reason to lose the other two — but it is also not a
 * reason to draw an empty list, which would read as "no coupons yet" and
 * quietly mislead whoever is checking whether a campaign went live.
 */
export function OverviewTabs({
  products,
  orders,
  coupons,
}: {
  products: RecentProduct[] | null;
  orders: RecentOrder[] | null;
  coupons: Coupon[] | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <Tabs
        tabs={[
          {
            id: "orders",
            label: "Dernières commandes",
            count: orders?.length,
            content: <OrdersPanel items={orders} />,
          },
          {
            id: "products",
            label: "Derniers produits",
            count: products?.length,
            content: <ProductsPanel items={products} />,
          },
          {
            id: "coupons",
            label: "Derniers coupons",
            count: coupons?.length,
            content: <CouponsPanel items={coupons} />,
          },
        ]}
      />
    </div>
  );
}

function PanelShell({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return (
    <div className="flex flex-col">
      {children}
      <div className="border-t border-border px-5 py-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function LoadFailed({ what }: { what: string }) {
  return (
    <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
      <TriangleAlert className="h-4 w-4 flex-none text-warning" aria-hidden="true" />
      Impossible de charger {what}.
    </p>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
      <PackageOpen className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
      {children}
    </p>
  );
}

function ProductsPanel({ items }: { items: RecentProduct[] | null }) {
  if (!items) return <LoadFailed what="les produits" />;
  if (items.length === 0) return <Empty>Aucun produit au catalogue pour le moment.</Empty>;

  return (
    <PanelShell href="/dashboard/products" label="Voir tout le catalogue">
      <ul className="divide-y divide-border">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
              <div className="relative h-11 w-11 flex-none overflow-hidden rounded-lg bg-muted">
                {/* preset="thumb" keeps this to a ~96px Cloudinary render, the
                    same as the catalogue table — the originals are multi-MB. */}
                <CloudinaryImage
                  src={p.imageUrl}
                  alt=""
                  preset="thumb"
                  fill
                  sizes="88px"
                  className="object-cover"
                  fallbackSrc={PRODUCT_PLACEHOLDER}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {money(p.price)}
                  {p.createdAt && <span className="text-muted-foreground"> · ajouté le {shortDate(p.createdAt)}</span>}
                </p>
              </div>

              <div className="flex flex-none items-center gap-2">
                {p.stock <= 0 ? (
                  <Badge variant="danger">Rupture</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{p.stock} en stock</span>
                )}
                {!p.isPublished && <Badge>Brouillon</Badge>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function OrdersPanel({ items }: { items: RecentOrder[] | null }) {
  if (!items) return <LoadFailed what="les commandes" />;
  if (items.length === 0) return <Empty>Aucune commande pour le moment.</Empty>;

  return (
    <PanelShell href="/dashboard/orders" label="Voir toutes les commandes">
      <ul className="divide-y divide-border">
        {items.map((o) => (
          <li key={o.id}>
            <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  #{o.orderNumber} <span className="font-normal text-muted-foreground">— {o.customerName}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{shortDate(o.createdAt)}</p>
              </div>
              <span className="flex-none text-sm font-medium text-foreground">{money(o.total)}</span>
              <Badge variant={ORDER_STATUS_BADGE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function CouponsPanel({ items }: { items: Coupon[] | null }) {
  if (!items) return <LoadFailed what="les coupons" />;
  if (items.length === 0) return <Empty>Aucun code promo créé pour le moment.</Empty>;

  return (
    <PanelShell href="/dashboard/coupons" label="Gérer les coupons">
      <ul className="divide-y divide-border">
        {items.map((c) => {
          const state = couponState(c);
          const discount = c.type === "percentage" ? `-${c.value} %` : `-${money(c.value)}`;
          return (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold tracking-wide text-foreground">{c.code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {COUPON_TYPE_LABELS[c.type]} · {discount}
                  {c.endDate && <span className="text-muted-foreground"> · jusqu&apos;au {shortDate(c.endDate)}</span>}
                </p>
              </div>
              <span className="flex-none text-xs text-muted-foreground">
                {c.usageCount ?? 0}
                {typeof c.usageLimit === "number" && c.usageLimit > 0 ? `/${c.usageLimit}` : ""} util.
              </span>
              <Badge variant={state.variant}>{state.label}</Badge>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}
