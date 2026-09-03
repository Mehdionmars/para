"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dashboard/guard";
import { payloadFetch } from "@/lib/dashboard/payload";
import { canEditContent } from "@/lib/dashboard/roles";
import type { CouponType } from "@/lib/dashboard/coupons-types";

export type CouponInput = {
  code: string;
  type: CouponType;
  value: number;
  minimumAmount?: number | null;
  maximumDiscount?: number | null;
  /** "YYYY-MM-DD" from the date inputs, or "" to clear. */
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  active: boolean;
};

/** "" and NaN both mean "no value" and must clear the field, not write 0. */
function num(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Payload stores dates as ISO. An empty input clears the field. */
function date(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Note what is *not* here: `usageCount`, which the checkout owns, and the
 * `eligibility` group of product/category/brand relations. Both are omitted
 * rather than sent as null — a PATCH only touches the keys it carries, so
 * leaving them out is what preserves an eligibility rule set in the CMS
 * instead of silently wiping it every time someone edits a date here.
 */
function body(input: CouponInput) {
  return JSON.stringify({
    code: input.code,
    type: input.type,
    value: input.value,
    minimumAmount: num(input.minimumAmount),
    maximumDiscount: num(input.maximumDiscount),
    startDate: date(input.startDate),
    endDate: date(input.endDate),
    usageLimit: num(input.usageLimit),
    perCustomerLimit: num(input.perCustomerLimit),
    active: input.active,
  });
}

/** Payload returns field-level errors; surface the first one verbatim. */
async function fail(res: Response, fallback: string): Promise<never> {
  const data = await res.json().catch(() => ({}));
  const first = data?.errors?.[0];
  const detail = first?.data?.errors?.[0];
  throw new Error(detail?.message || first?.message || fallback);
}

export async function createCoupon(input: CouponInput) {
  await requireRole(canEditContent);

  const res = await payloadFetch("/api/coupons", { body: body(input), method: "POST" });
  if (!res.ok) await fail(res, "Échec de la création du coupon.");

  revalidatePath("/dashboard/coupons");
  revalidatePath("/dashboard");
}

export async function updateCoupon(id: number, input: CouponInput) {
  await requireRole(canEditContent);

  const res = await payloadFetch(`/api/coupons/${id}`, { body: body(input), method: "PATCH" });
  if (!res.ok) await fail(res, "Échec de la mise à jour du coupon.");

  revalidatePath("/dashboard/coupons");
  revalidatePath("/dashboard");
}
