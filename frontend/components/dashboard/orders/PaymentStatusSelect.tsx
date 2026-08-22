"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { updatePaymentStatus } from "@/app/dashboard/(app)/orders/actions";
import { Badge } from "@/components/dashboard/ui/Badge";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_OPTIONS, type PaymentStatus } from "@/lib/dashboard/orders-types";

/**
 * Payment status, inside the "Paiement" accordion.
 *
 * Not in the header with the order status: it is a bookkeeping correction
 * rather than a step in fulfilling the order, it sends nothing to the
 * customer, and it belongs beside the payment method and coupon it explains.
 * No confirmation step for the same reason — nothing irreversible happens.
 */
export function PaymentStatusSelect({
  id,
  paymentStatus,
  readOnly = false,
}: {
  id: number;
  paymentStatus: PaymentStatus;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const selectId = useId();

  if (readOnly) return <Badge variant="info">{PAYMENT_STATUS_LABELS[paymentStatus]}</Badge>;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor={selectId}>
        Statut du paiement
      </label>
      <div className="flex items-center gap-2">
        <select
          className="h-9 w-full max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
          defaultValue={paymentStatus}
          disabled={isPending}
          id={selectId}
          onChange={(e) =>
            startTransition(async () => {
              setError("");
              const result = await updatePaymentStatus(id, e.target.value as PaymentStatus);
              if (!result.ok) setError(result.error);
            })
          }
        >
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin text-gray-400" />}
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600" role="alert">
          <AlertTriangle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
