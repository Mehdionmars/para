"use client";

import { Check, Info } from "lucide-react";
import { useState, useTransition } from "react";
import { updateRoutineOffer } from "@/app/dashboard/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { ROUTINE_PERCENT_MAX, type RoutineOfferForm as RoutineOfferValues } from "@/lib/dashboard/paymentSettings-types";

const field =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
const label = "text-xs font-medium text-gray-600";

/**
 * The "Complétez votre routine" discount on product pages.
 *
 * The example line is computed from the values being typed, so the editor
 * sees what a shopper will be shown before saving rather than reasoning about
 * a percentage in the abstract.
 */
export function RoutineOfferForm({ initial }: { initial: RoutineOfferValues }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [percent, setPercent] = useState(String(initial.percent));
  const [minItems, setMinItems] = useState(initial.minItems);

  const pct = Number(percent);
  const example = Number.isFinite(pct) && pct > 0 ? Math.round(770 * pct) / 100 : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await updateRoutineOffer({ enabled, minItems, percent: pct });
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-700 focus:ring-violet-300"
        />
        <span>
          <span className="text-sm font-medium text-gray-900">Activer l&apos;offre routine</span>
          <span className="block text-xs text-gray-500">
            Désactivée, le bloc reste un raccourci pour ajouter plusieurs produits, sans remise.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="grid gap-4 pl-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="routine-percent">
              Remise (%)
            </label>
            <input
              id="routine-percent"
              type="number"
              inputMode="decimal"
              min={1}
              max={ROUTINE_PERCENT_MAX}
              step="0.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className={field}
            />
            <p className="text-xs text-gray-400">Entre 1 et {ROUTINE_PERCENT_MAX} %.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="routine-min">
              Produits minimum dans le lot
            </label>
            <select
              id="routine-min"
              value={minItems}
              onChange={(e) => setMinItems(Number(e.target.value))}
              className={field}
            >
              <option value={2}>2 produits</option>
              <option value={3}>3 produits</option>
            </select>
            <p className="text-xs text-gray-400">Le produit consulté compris.</p>
          </div>

          {example > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-900 sm:col-span-2">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
              <span>
                Exemple : un lot de 400 + 370 MAD reçoit −{example.toLocaleString("fr-FR")} MAD. La remise porte sur une
                unité de chaque produit, ne se cumule pas avec un code promo (la plus avantageuse s&apos;applique) et
                exige que le produit de la fiche soit dans le lot. Les produits proposés se choisissent sur chaque fiche
                produit, champ « Produits associés (routine) ».
              </span>
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4 flex-none" aria-hidden="true" />
          Enregistré. Les fiches produit sont mises à jour.
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'offre routine"}
        </Button>
      </div>
    </form>
  );
}
