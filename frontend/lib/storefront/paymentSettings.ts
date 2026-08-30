const CMS_URL = process.env.CMS_URL || "http://localhost:3001";

/** Cache tag the CMS purges when the payment settings are saved. */
export const PAYMENT_SETTINGS_TAG = "payment-settings";

export type PaymentMethodCode = "cash_on_delivery" | "bank_transfer";

export type BankDetails = {
  beneficiary: string;
  bankName: string;
  rib: string;
  /** Empty when the merchant has not supplied one; the row is then hidden. */
  iban: string;
  bic: string;
  instructions: string;
};

export type PaymentOption = {
  code: PaymentMethodCode;
  label: string;
  description: string;
};

export type PaymentSettings = {
  options: PaymentOption[];
  /** Non-null only when bank transfer is actually offered. */
  bank: BankDetails | null;
};

type RawSettings = {
  codEnabled?: boolean | null;
  codDescription?: string | null;
  bankTransferEnabled?: boolean | null;
  bankTransferDescription?: string | null;
  bank?: {
    beneficiary?: string | null;
    bankName?: string | null;
    rib?: string | null;
    iban?: string | null;
    bic?: string | null;
    instructions?: string | null;
  } | null;
};

const text = (v: string | null | undefined) => (typeof v === "string" ? v.trim() : "");

/**
 * Cash on delivery is the floor.
 *
 * Every one of the shop's existing orders was collected on delivery, and a
 * checkout with no payment method at all is a checkout nobody can complete —
 * so an unreachable CMS degrades to this rather than to an empty list.
 */
const COD_FALLBACK: PaymentSettings = {
  options: [
    {
      code: "cash_on_delivery",
      label: "Paiement à la livraison",
      description: "Payez en espèces lors de la réception de votre commande.",
    },
  ],
  bank: null,
};

/**
 * What the shop accepts, and where a transfer should go.
 *
 * The bank coordinates live in the CMS (the `payment-settings` global), never
 * in this repository: the merchant changes bank or account from the dashboard
 * without a redeploy, and no placeholder RIB can ever ship to production by
 * accident. Nothing here is secret — a RIB is what you hand a payer — but it
 * must still come from one trusted, editable source.
 *
 * Transfer is only offered once the three fields a payer actually needs are
 * present. That check is duplicated from the global's own validate on
 * purpose: the API can be written to directly, and a half-filled record must
 * not reach a customer as a payment option.
 */
export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/globals/payment-settings?depth=0`, {
      next: { revalidate: 300, tags: [PAYMENT_SETTINGS_TAG] },
    });
  } catch {
    return COD_FALLBACK;
  }
  if (!res.ok) return COD_FALLBACK;

  let raw: RawSettings;
  try {
    raw = (await res.json()) as RawSettings;
  } catch {
    return COD_FALLBACK;
  }

  const options: PaymentOption[] = [];
  if (raw.codEnabled !== false) {
    options.push({
      code: "cash_on_delivery",
      label: "Paiement à la livraison",
      description: text(raw.codDescription) || COD_FALLBACK.options[0].description,
    });
  }

  const beneficiary = text(raw.bank?.beneficiary);
  const bankName = text(raw.bank?.bankName);
  const rib = text(raw.bank?.rib);
  const transferReady = raw.bankTransferEnabled === true && !!beneficiary && !!bankName && !!rib;

  if (transferReady) {
    options.push({
      code: "bank_transfer",
      label: "Virement bancaire",
      description:
        text(raw.bankTransferDescription) ||
        "Effectuez un virement bancaire avant l'expédition de votre commande.",
    });
  }

  if (options.length === 0) return COD_FALLBACK;

  return {
    options,
    bank: transferReady
      ? {
          beneficiary,
          bankName,
          rib,
          iban: text(raw.bank?.iban),
          bic: text(raw.bank?.bic),
          instructions: text(raw.bank?.instructions),
        }
      : null,
  };
}
