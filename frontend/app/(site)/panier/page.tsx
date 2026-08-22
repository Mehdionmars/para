import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Votre panier — Para d'Hiver",
};

export default function PanierPage() {
  return <CartView />;
}
