import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/FavoritesView";

export const metadata: Metadata = {
  title: "Mes favoris — Para d'Hiver",
};

export default function FavorisPage() {
  return <FavoritesView />;
}
