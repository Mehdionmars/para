"use client";

import { ArrowRight, PackageOpen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { CloudinaryImage, PRODUCT_PLACEHOLDER } from "@/components/CloudinaryImage";
import { Badge } from "@/components/dashboard/ui/Badge";
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
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Tabs
        tabs={[
          {
            id: "products",
            label: "Derniers produits",
            count: products?.length,
            content: <ProductsPanel items={products} />,
          },
          {
            id: "orders",
            label: "Dernières commandes",
            count: orders?.length,
            content: <OrdersPanel items={orders} />,
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
      <div className="border-t border-gray-100 px-5 py-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline"
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
    <p className="flex items-center gap-2 px-5 py-8 text-sm text-gray-500">
      <TriangleAlert className="h-4 w-4 flex-none text-amber-500" aria-hidden="true" />
      Impossible de charger {what}.
    </p>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 px-5 py-8 text-sm text-gray-500">
      <PackageOpen className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
      {children}
    </p>
  );
}

function ProductsPanel({ items }: { items: RecentProduct[] | null }) {
  if (!items) return <LoadFailed what="les produits" />;
  if (items.length === 0) return <Empty>Aucun produit au catalogue pour le moment.</Empty>;

  return (
    <PanelShell href="/dashboard/products" label="Voir tout le catalogue">
      <ul className="divide-y divide-gray-50">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
              <div className="relative h-11 w-11 flex-none overflow-hidden rounded-lg bg-gray-100">
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
                <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {money(p.price)}
                  {p.createdAt && <span className="text-gray-400"> · ajouté le {shortDate(p.createdAt)}</span>}
                </p>
              </div>

              <div className="flex flex-none items-center gap-2">
                {p.stock <= 0 ? (
                  <Badge variant="danger">Rupture</Badge>
                ) : (
                  <span className="text-xs text-gray-500">{p.stock} en stock</span>
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
      <ul className="divide-y divide-gray-50">
        {items.map((o) => (
          <li key={o.id}>
            <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  #{o.orderNumber} <span className="font-normal text-gray-500">— {o.customerName}</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{shortDate(o.createdAt)}</p>
              </div>
              <span className="flex-none text-sm font-medium text-gray-900">{money(o.total)}</span>
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
      <ul className="divide-y divide-gray-50">
        {items.map((c) => {
          const state = couponState(c);
          const discount = c.type === "percentage" ? `-${c.value} %` : `-${money(c.value)}`;
          return (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold tracking-wide text-gray-900">{c.code}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {COUPON_TYPE_LABELS[c.type]} · {discount}
                  {c.endDate && <span className="text-gray-400"> · jusqu&apos;au {shortDate(c.endDate)}</span>}
                </p>
              </div>
              <span className="flex-none text-xs text-gray-500">
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
