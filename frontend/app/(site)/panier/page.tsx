import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { fetchPaymentSettings } from "@/lib/storefront/paymentSettings";

export const metadata: Metadata = {
  title: "Votre panier — Para d'Hiver",
};

// Fetched here, not in the cart: which methods exist and where a transfer
// goes are server facts, tag-cached, and would otherwise cost every shopper a
// round trip after hydration just to render a radio group.
export default async function PanierPage() {
  const payment = await fetchPaymentSettings();
  return <CartView payment={payment} />;
}
