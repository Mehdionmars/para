import { payloadFetch } from "./payload";
import type { Order } from "./orders-types";
import type { Customer } from "./customers-types";

export * from "./customers-types";

/** There's no separate customer-accounts system on the storefront — every
 * "customer" here is derived from real order history, grouped by email.
 * No fabricated data: a store with no orders yet has no customers, honestly. */
export async function listCustomers(): Promise<Customer[]> {
  const res = await payloadFetch("/api/orders?limit=2000&depth=0&sort=-createdAt");
  if (!res.ok) throw new Error("Impossible de charger les clients.");
  const orders: Order[] = (await res.json()).docs;

  const byEmail = new Map<string, Customer>();
  for (const order of orders) {
    const key = order.customerEmail.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total;
      existing.orders.push(order);
    } else {
      byEmail.set(key, {
        email: order.customerEmail,
        lastOrderAt: order.createdAt,
        name: order.customerName,
        orderCount: 1,
        orders: [order],
        phone: order.customerPhone,
        totalSpent: order.total,
      });
    }
  }

  return [...byEmail.values()].sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());
}

export async function getCustomer(email: string): Promise<Customer | null> {
  const customers = await listCustomers();
  return customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
}
