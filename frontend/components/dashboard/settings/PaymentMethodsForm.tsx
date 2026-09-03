"use client";

import { Check, Info } from "lucide-react";
import { useState, useTransition } from "react";
import { updatePaymentSettings } from "@/app/dashboard/(app)/settings/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { cn } from "@/lib/dashboard/cn";
import {
  BANK_FIELD_LABELS,
  missingBankFields,
  type BankFields,
  type PaymentSettingsForm,
} from "@/lib/dashboard/paymentSettings-types";

const field =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
const area =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
const label = "text-xs font-medium text-gray-600";

/** Order and hints for the bank block, so the required three come first. */
const BANK_ORDER: { key: keyof BankFields; hint?: string; required?: boolean }[] = [
  { key: "beneficiary", hint: "Le titulaire du compte, tel que le client doit le saisir.", required: true },
  { key: "bankName", hint: "Ex. Attijariwafa Bank, BMCE, CIH…", required: true },
  { key: "rib", hint: "24 chiffres. Affiché tel quel au client.", required: true },
  { key: "iban", hint: "Optionnel. Affiché uniquement si renseigné." },
  { key: "bic", hint: "Optionnel. Affiché uniquement si renseigné." },
];

export function PaymentMethodsForm({ initial }: { initial: PaymentSettingsForm }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [codEnabled, setCodEnabled] = useState(initial.codEnabled);
  const [codDescription, setCodDescription] = useState(initial.codDescription);
  const [transferEnabled, setTransferEnabled] = useState(initial.bankTransferEnabled);
  const [transferDescription, setTransferDescription] = useState(initial.bankTransferDescription);
  const [bank, setBank] = useState<BankFields>(initial.bank);

  const missing = missingBankFields(bank);
  const setField = (key: keyof BankFields, value: string) =>
    setBank((prev) => ({ ...prev, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    startTransition(async () => {
      const res = await updatePaymentSettings({
        codEnabled,
        codDescription,
        bankTransferEnabled: transferEnabled,
        bankTransferDescription: transferDescription,
        bank,
      });
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Cash on delivery */}
      <section className="flex flex-col gap-3">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-700 focus:ring-violet-300"
          />
          <span>
            <span className="text-sm font-medium text-gray-900">Paiement à la livraison</span>
            <span className="block text-xs text-gray-500">
              Le mode historique de la boutique. Toutes les commandes passées jusqu&apos;ici sont réglées ainsi.
            </span>
          </span>
        </label>

        {codEnabled && (
          <div className="flex flex-col gap-1.5 pl-6">
            <label className={label} htmlFor="cod-description">
              Description affichée au client
            </label>
            <textarea
              id="cod-description"
              rows={2}
              value={codDescription}
              onChange={(e) => setCodDescription(e.target.value)}
              className={area}
            />
          </div>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* Bank transfer */}
      <section className="flex flex-col gap-3">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={transferEnabled}
            onChange={(e) => setTransferEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-700 focus:ring-violet-300"
          />
          <span>
            <span className="text-sm font-medium text-gray-900">Virement bancaire</span>
            <span className="block text-xs text-gray-500">
              Vos coordonnées sont affichées au client sur l&apos;écran de confirmation, avec la référence de
              sa commande.
            </span>
          </span>
        </label>

        {transferEnabled && missing.length > 0 && (
          <p className="ml-6 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
            Champs requis manquants : {missing.join(", ")}. Tant qu&apos;ils sont vides, le virement ne peut pas
            être proposé au client.
          </p>
        )}

        <div className="flex flex-col gap-3 pl-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {BANK_ORDER.map(({ key, hint, required }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className={label} htmlFor={`bank-${key}`}>
                  {BANK_FIELD_LABELS[key]}
                  {required && <span className="ml-1 text-amber-600">*</span>}
                </label>
                <input
                  id={`bank-${key}`}
                  value={bank[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  inputMode={key === "rib" ? "numeric" : undefined}
                  className={cn(field, (key === "rib" || key === "iban" || key === "bic") && "font-mono")}
                />
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="transfer-description">
              Description affichée au client
            </label>
            <textarea
              id="transfer-description"
              rows={2}
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
              className={area}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={label} htmlFor="bank-instructions">
              {BANK_FIELD_LABELS.instructions}
            </label>
            <textarea
              id="bank-instructions"
              rows={2}
              value={bank.instructions}
              onChange={(e) => setField("instructions", e.target.value)}
              className={area}
            />
            <p className="text-xs text-gray-400">
              Optionnel. Affiché sous les coordonnées, après la référence de commande.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4 flex-none" aria-hidden="true" />
          Enregistré. La boutique est mise à jour.
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les modes de paiement"}
        </Button>
      </div>
    </form>
  );
}
