/**
 * The `payment-settings` global, as the dashboard edits it.
 *
 * Split from the fetching module so the client form can import the shape and
 * the readiness rule without dragging payloadFetch — and next/headers with it
 * — into the browser bundle.
 *
 * Note what is deliberately absent: anything secret. A RIB or IBAN is what you
 * hand a payer, and this global is publicly readable by design because the
 * storefront prints it on the confirmation screen. Credentials for a future
 * payment provider must never be added here; they belong in environment
 * variables, which are never serialised to the client.
 */

export type BankFields = {
  beneficiary: string;
  bankName: string;
  rib: string;
  iban: string;
  bic: string;
  instructions: string;
};

export type PaymentSettingsForm = {
  codEnabled: boolean;
  codDescription: string;
  bankTransferEnabled: boolean;
  bankTransferDescription: string;
  bank: BankFields;
};

/** The three fields a payer cannot make a transfer without. */
export const REQUIRED_FOR_TRANSFER = ["beneficiary", "bankName", "rib"] as const;

export const BANK_FIELD_LABELS: Record<keyof BankFields, string> = {
  beneficiary: "Nom du bénéficiaire",
  bankName: "Banque",
  rib: "RIB",
  iban: "IBAN",
  bic: "BIC / SWIFT",
  instructions: "Consigne complémentaire",
};

/**
 * Which required bank fields are still blank.
 *
 * Mirrors the global's own `validate`, and the storefront's separate check in
 * lib/storefront/paymentSettings.ts. Three copies is deliberate: the server
 * decides, but a customer must never be offered a transfer with nowhere to
 * send the money, and the operator should be told which box is empty before
 * they submit rather than after.
 */
export function missingBankFields(bank: BankFields): string[] {
  return REQUIRED_FOR_TRANSFER.filter((k) => !bank[k].trim()).map((k) => BANK_FIELD_LABELS[k]);
}
