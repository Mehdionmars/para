import { describe, expect, it } from "vitest";

import { summarizeActivity, type ActivityOrder, type StoreActivity } from "@/lib/dashboard/activity";
import type { Booking } from "@/lib/dashboard/bookings-types";

const NOW = new Date("2026-10-29T12:00:00Z").getTime();
const DAY = 86_400_000;

let nextId = 1;
function order(daysAgo: number, total: number, status: ActivityOrder["status"] = "delivered", email = `c${nextId}@x.ma`): ActivityOrder {
  const id = nextId++;
  return {
    createdAt: new Date(NOW - daysAgo * DAY).toISOString(),
    customerEmail: email,
    customerName: `Client ${id}`,
    id,
    orderNumber: `PDH-${id}`,
    status,
    total,
  };
}

const booking = (status: Booking["status"]): Booking => ({
  createdAt: "",
  customerEmail: "",
  customerName: "Sara",
  customerPhone: "",
  date: "2026-10-30",
  id: nextId++,
  note: "",
  serviceTitle: "Épilation",
  staffNote: "",
  status,
  time: "10:00",
});

const base: StoreActivity = {
  bookings: [],
  catalogue: { lowStock: 2, published: 10, stockValue: 5000, total: 12 },
  orders: [],
  today: "2026-10-29",
};

const kpi = (s: ReturnType<typeof summarizeActivity>, label: string) => s.headline.find((k) => k.label === label)!;

describe("summarizeActivity", () => {
  it("counts this week's revenue without cancelled or refunded orders", () => {
    const s = summarizeActivity(
      { ...base, orders: [order(1, 300), order(2, 200, "cancelled"), order(3, 100, "refunded"), order(10, 999)] },
      NOW,
    );
    expect(kpi(s, "Chiffre d'affaires").value).toBe(`${(300).toLocaleString("fr-FR")} MAD`);
    // Three orders this week, cancelled ones included: they were placed.
    expect(kpi(s, "Commandes").value).toBe("3");
    expect(kpi(s, "Panier moyen").value).toBe(`${(300).toLocaleString("fr-FR")} MAD`);
  });

  it("shows no trend against a base of fewer than three orders", () => {
    const thin = summarizeActivity({ ...base, orders: [order(1, 100), order(8, 50)] }, NOW);
    expect(kpi(thin, "Chiffre d'affaires").deltaPct).toBeNull();

    const solid = summarizeActivity(
      { ...base, orders: [order(1, 200), order(2, 200), order(8, 100), order(9, 100), order(10, 100)] },
      NOW,
    );
    // 400 this week against 300 the week before.
    expect(Math.round(kpi(solid, "Chiffre d'affaires").deltaPct!)).toBe(33);
  });

  it("puts every pending order on the to-do list, not only this week's", () => {
    const s = summarizeActivity({ ...base, orders: [order(1, 100, "pending"), order(12, 100, "pending"), order(2, 100)] }, NOW);
    expect(s.todos.find((t) => t.icon === "order")?.count).toBe(2);
    expect(s.todos.find((t) => t.icon === "order")?.href).toBe("/dashboard/orders?status=pending");
  });

  it("counts bookings to confirm and products to restock", () => {
    const s = summarizeActivity({ ...base, bookings: [booking("pending"), booking("confirmed"), booking("pending")] }, NOW);
    expect(s.todos.find((t) => t.icon === "booking")?.count).toBe(2);
    expect(s.todos.find((t) => t.icon === "stock")?.count).toBe(2);
  });

  it("never prints 0 MAD for orders that failed to load", () => {
    const s = summarizeActivity({ ...base, orders: null }, NOW);
    for (const k of s.headline) {
      expect(k.value).toBe("—");
      expect(k.deltaPct ?? null).toBeNull();
    }
    expect(s.recentOrders).toBeNull();
    // A count that could not be taken is left off the list, not shown as zero.
    expect(s.todos.some((t) => t.icon === "order")).toBe(false);
  });

  it("leaves the catalogue rows blank when the catalogue failed to load", () => {
    const s = summarizeActivity({ ...base, catalogue: null, bookings: null }, NOW);
    expect(s.snapshot.find((r) => r.label === "Produits au catalogue")?.value).toBe("—");
    expect(s.todos).toEqual([{ count: 0, href: "/dashboard/orders?status=pending", icon: "order", label: "Commandes à confirmer" }]);
  });

  it("charts thirty days of revenue and the statuses that actually occur", () => {
    const s = summarizeActivity({ ...base, orders: [order(0, 120), order(29, 80), order(31, 500), order(1, 40, "cancelled")] }, NOW);
    expect(s.revenueSeries).toHaveLength(30);
    expect(s.revenueSeries.reduce((sum, p) => sum + p.revenue, 0)).toBe(200);
    expect(s.statusSeries.map((x) => x.status)).toEqual(["delivered", "cancelled"]);
  });

  it("ignores future-dated orders in the weekly figures", () => {
    const s = summarizeActivity({ ...base, orders: [order(-2, 1000), order(1, 100)] }, NOW);
    expect(kpi(s, "Commandes").value).toBe("1");
  });

  it("counts a customer as new only on their first order", () => {
    const s = summarizeActivity(
      { ...base, orders: [order(1, 100, "delivered", "sara@x.ma"), order(20, 100, "delivered", "sara@x.ma"), order(2, 100, "delivered", "ali@x.ma")] },
      NOW,
    );
    expect(kpi(s, "Nouveaux clients").value).toBe("1");
  });
});
