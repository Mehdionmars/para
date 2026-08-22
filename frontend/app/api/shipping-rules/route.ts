import { NextResponse } from "next/server";
import { CMS_URL } from "@/lib/dashboard/constants";

export const revalidate = 300;

export type ShippingOption = {
  city: string;
  price: number;
  freeFrom: number | null;
  isDefault: boolean;
};

/**
 * Public delivery tariffs, for the cart's city picker.
 *
 * Display only. The shipping actually charged is resolved again in
 * backend/src/lib/pricing.ts during checkout, from the same rows — so an
 * edited tariff can never be undercut by a stale cart.
 */
export async function GET() {
  try {
    const res = await fetch(
      `${CMS_URL}/api/shipping-rules?limit=100&depth=0&where[enabled][equals]=true&sort=price`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return NextResponse.json({ rules: [] });

    const data = (await res.json()) as {
      docs?: { city?: string; price?: number; freeFrom?: number | null; isDefault?: boolean }[];
    };

    const rules: ShippingOption[] = (data.docs || []).map((d) => ({
      city: d.city || "",
      freeFrom: d.freeFrom ?? null,
      isDefault: !!d.isDefault,
      price: Number(d.price) || 0,
    }));

    return NextResponse.json({ rules });
  } catch {
    // An empty list degrades to the context's own estimate rather than
    // blocking the cart on a CMS hiccup.
    return NextResponse.json({ rules: [] });
  }
}
