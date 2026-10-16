"use server";

import { money } from "@/lib/dashboard/format";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";

export type SearchHit = { href: string; title: string; detail: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

/** Payload's REST `where`, as bracketed query params. */
function query(path: string, or: Record<string, string>[], extra: Record<string, string>) {
  const params = new URLSearchParams({ depth: "0", ...extra });
  or.forEach((clause, i) => {
    for (const [field, value] of Object.entries(clause)) params.set(`where[or][${i}][${field}][like]`, value);
  });
  return `${path}?${params.toString()}`;
}

/** One collection's matches, or none when it fails or the role may not read
 * it — a search never errors because one corner of it is off limits. */
async function docs<T>(url: string): Promise<T[]> {
  try {
    const res = await payloadFetch(url);
    if (!res.ok) return [];
    return ((await res.json()).docs ?? []) as T[];
  } catch {
    return [];
  }
}

/**
 * Everything the launcher's search can find besides the pages themselves:
 * products, orders, customers and appointments.
 *
 * Run with the operator's own session, so each collection's access control
 * decides what comes back — a role that cannot read orders simply gets no
 * order group. Customers are not a collection: they are the distinct
 * addresses on matching orders.
 */
export async function globalSearch(raw: string): Promise<SearchGroup[]> {
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return [];
  if (!(await getSessionUser())) return [];

  type Product = { id: number; name: string; price?: number; stock?: number };
  type Order = { id: number; orderNumber?: string; customerName?: string; customerEmail?: string; total?: number };
  type Booking = { id: number; customerName?: string; serviceTitle?: string; date?: string; time?: string };

  const [products, orders, bookings] = await Promise.all([
    docs<Product>(query("/api/products", [{ name: q }], { limit: "6", sort: "name" })),
    docs<Order>(
      query("/api/orders", [{ orderNumber: q }, { customerName: q }, { customerEmail: q }, { customerPhone: q }], {
        limit: "12",
        sort: "-createdAt",
      }),
    ),
    docs<Booking>(query("/api/bookings", [{ customerName: q }, { customerPhone: q }, { serviceTitle: q }], { limit: "5", sort: "-date" })),
  ]);

  const needle = q.toLowerCase();
  const customers = new Map<string, SearchHit>();
  for (const o of orders) {
    const email = o.customerEmail?.trim();
    if (!email || customers.has(email)) continue;
    if (!`${o.customerName ?? ""} ${email}`.toLowerCase().includes(needle)) continue;
    customers.set(email, { detail: email, href: `/dashboard/customers/${encodeURIComponent(email)}`, title: o.customerName || email });
  }

  const groups: SearchGroup[] = [
    {
      hits: products.map((p) => ({
        detail: [p.price != null ? money(p.price) : null, p.stock != null ? `${p.stock} en stock` : null].filter(Boolean).join(" · "),
        href: `/dashboard/products/${p.id}`,
        title: p.name,
      })),
      label: "Produits",
    },
    {
      hits: orders.slice(0, 6).map((o) => ({
        detail: [o.customerName, o.total != null ? money(o.total) : null].filter(Boolean).join(" · "),
        href: `/dashboard/orders/${o.id}`,
        title: o.orderNumber ? `#${o.orderNumber}` : `Commande ${o.id}`,
      })),
      label: "Commandes",
    },
    { hits: [...customers.values()].slice(0, 4), label: "Clients" },
    {
      hits: bookings.map((b) => ({
        detail: [b.serviceTitle, b.date && b.time ? `${b.date} à ${b.time}` : null].filter(Boolean).join(" · "),
        href: "/dashboard/bookings",
        title: b.customerName || "Rendez-vous",
      })),
      label: "Rendez-vous",
    },
  ];
  return groups.filter((g) => g.hits.length > 0);
}
