"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCoupon, updateCoupon, type CouponInput } from "@/app/dashboard/(app)/coupons/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { Modal } from "@/components/dashboard/ui/Modal";
import type { Coupon, CouponType } from "@/lib/dashboard/coupons-types";

/** Payload stores ISO; the date input needs "YYYY-MM-DD". */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** "" must stay "" so the action can clear the field, not write a 0. */
function toNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const field =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
const label = "text-xs font-medium text-gray-600";

export function CouponFormModal({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<CouponType>(coupon?.type ?? "percentage");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minimumAmount, setMinimumAmount] = useState(
    coupon?.minimumAmount != null ? String(coupon.minimumAmount) : "",
  );
  const [maximumDiscount, setMaximumDiscount] = useState(
    coupon?.maximumDiscount != null ? String(coupon.maximumDiscount) : "",
  );
  const [startDate, setStartDate] = useState(toDateInput(coupon?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(coupon?.endDate));
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit != null ? String(coupon.usageLimit) : "");
  const [perCustomerLimit, setPerCustomerLimit] = useState(
    coupon?.perCustomerLimit != null ? String(coupon.perCustomerLimit) : "",
  );
  const [active, setActive] = useState(coupon?.active ?? true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedValue = toNumber(value);
    if (!code.trim()) return setError("Le code est obligatoire.");
    if (parsedValue === null || parsedValue <= 0) return setError("La valeur doit être un nombre supérieur à 0.");
    if (type === "percentage" && parsedValue > 100) return setError("Un pourcentage ne peut pas dépasser 100.");
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return setError("La date de fin précède la date de début.");
    }

    const input: CouponInput = {
      code: code.trim().toUpperCase().replace(/\s+/g, ""),
      type,
      value: parsedValue,
      minimumAmount: toNumber(minimumAmount),
      maximumDiscount: toNumber(maximumDiscount),
      startDate: startDate || null,
      endDate: endDate || null,
      usageLimit: toNumber(usageLimit),
      perCustomerLimit: toNumber(perCustomerLimit),
      active,
    };

    startTransition(async () => {
      try {
        if (coupon) await updateCoupon(coupon.id, input);
        else await createCoupon(input);
        // The server action revalidates; refresh pulls the new list into the
        // already-mounted page so the row appears without a manual reload.
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Modal title={coupon ? `Modifier ${coupon.code}` : "Nouveau coupon"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="coupon-code">
            Code
          </label>
          <input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BIENVENUE10"
            className={`${field} font-mono uppercase`}
            autoFocus
          />
          <p className="text-xs text-gray-400">Normalisé en majuscules, sans espaces.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-type">
              Type de remise
            </label>
            <select
              id="coupon-type"
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={field}
            >
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (MAD)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-value">
              Valeur {type === "percentage" ? "(%)" : "(MAD)"}
            </label>
            <input
              id="coupon-value"
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-min">
              Montant minimum (MAD)
            </label>
            <input
              id="coupon-min"
              type="number"
              min="0"
              step="any"
              value={minimumAmount}
              onChange={(e) => setMinimumAmount(e.target.value)}
              placeholder="Aucun"
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-max">
              Remise maximale (MAD)
            </label>
            <input
              id="coupon-max"
              type="number"
              min="0"
              step="any"
              value={maximumDiscount}
              onChange={(e) => setMaximumDiscount(e.target.value)}
              placeholder="Aucune"
              disabled={type !== "percentage"}
              className={`${field} disabled:bg-gray-50 disabled:text-gray-400`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-start">
              Début
            </label>
            <input
              id="coupon-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-end">
              Fin
            </label>
            <input
              id="coupon-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={field}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-gray-400">Vides : actif immédiatement et sans expiration.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-limit">
              Limite globale
            </label>
            <input
              id="coupon-limit"
              type="number"
              min="0"
              step="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Illimitée"
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="coupon-per-customer">
              Limite par client
            </label>
            <input
              id="coupon-per-customer"
              type="number"
              min="0"
              step="1"
              value={perCustomerLimit}
              onChange={(e) => setPerCustomerLimit(e.target.value)}
              placeholder="Illimitée"
              className={field}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-violet-700 focus:ring-violet-300"
          />
          Actif
        </label>

        {coupon && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {coupon.usageCount ?? 0} utilisation(s) enregistrée(s). Ce compteur est tenu par le checkout et ne
            se modifie pas ici. Les règles d&apos;éligibilité (produits, catégories, marques) restent gérées
            dans le CMS et ne sont pas touchées par ce formulaire.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : coupon ? "Enregistrer" : "Créer le coupon"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
