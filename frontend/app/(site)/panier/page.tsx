import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { fetchPaymentSettings, fetchRoutineOffer } from "@/lib/storefront/paymentSettings";

export const metadata: Metadata = {
  title: "Votre panier — Para d'Hiver",
};

// Fetched here, not in the cart: which methods exist and where a transfer
// goes are server facts, tag-cached, and would otherwise cost every shopper a
// round trip after hydration just to render a radio group.
export default async function PanierPage() {
  const [payment, routineOffer] = await Promise.all([fetchPaymentSettings(), fetchRoutineOffer()]);
  return <CartView payment={payment} routineOffer={routineOffer} />;
}
