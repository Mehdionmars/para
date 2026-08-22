import type { Order } from "./orders-types";

export type Customer = {
  email: string;
  name: string;
  phone?: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  orders: Order[];
};
