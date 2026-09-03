import { payloadFetch } from "./payload";
import type { BankFields, PaymentSettingsForm } from "./paymentSettings-types";

export * from "./paymentSettings-types";

const text = (v: unknown) => (typeof v === "string" ? v : "");

const EMPTY_BANK: BankFields = {
  beneficiary: "",
  bankName: "",
  rib: "",
  iban: "",
  bic: "",
  instructions: "",
};

/**
 * Current payment settings, normalised so every field is a string or boolean.
 *
 * The form is controlled, and a controlled input handed `null` from an unset
 * CMS field flips to uncontrolled and warns. Normalising once here is what
 * keeps that out of the component.
 */
export async function getPaymentSettings(): Promise<PaymentSettingsForm> {
  const res = await payloadFetch("/api/globals/payment-settings?depth=0");
  if (!res.ok) throw new Error("Impossible de charger les modes de paiement.");
  const raw = await res.json();

  return {
    codEnabled: raw?.codEnabled !== false,
    codDescription: text(raw?.codDescription),
    bankTransferEnabled: raw?.bankTransferEnabled === true,
    bankTransferDescription: text(raw?.bankTransferDescription),
    bank: {
      ...EMPTY_BANK,
      beneficiary: text(raw?.bank?.beneficiary),
      bankName: text(raw?.bank?.bankName),
      rib: text(raw?.bank?.rib),
      iban: text(raw?.bank?.iban),
      bic: text(raw?.bank?.bic),
      instructions: text(raw?.bank?.instructions),
    },
  };
}
