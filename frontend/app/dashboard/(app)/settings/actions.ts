"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dashboard/guard";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";
import {
  missingBankFields,
  type PaymentSettingsForm,
  ROUTINE_PERCENT_MAX,
  type RoutineOfferForm,
} from "@/lib/dashboard/paymentSettings-types";
import { canEditContent } from "@/lib/dashboard/roles";

export async function updatePassword(newPassword: string): Promise<{ error?: string }> {
  if (newPassword.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const user = await getSessionUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const res = await payloadFetch(`/api/users/${user.id}`, {
    body: JSON.stringify({ password: newPassword }),
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data?.errors?.[0]?.message || "Échec de la mise à jour du mot de passe." };
  }
  return {};
}

/**
 * Writes the `payment-settings` global.
 *
 * The transfer/coordinates rule is re-checked here rather than trusted from
 * the form: a server action is a public endpoint, and switching bank transfer
 * on with an empty RIB would put a payment option in front of customers with
 * nowhere to send the money. Payload's own validate would also refuse it —
 * this just returns the failure as a readable sentence instead of a 400.
 */
export async function updatePaymentSettings(
  input: PaymentSettingsForm,
): Promise<{ error?: string }> {
  await requireRole(canEditContent);

  const bank = {
    beneficiary: input.bank.beneficiary.trim(),
    bankName: input.bank.bankName.trim(),
    rib: input.bank.rib.trim(),
    iban: input.bank.iban.trim(),
    bic: input.bank.bic.trim(),
    instructions: input.bank.instructions.trim(),
  };

  if (input.bankTransferEnabled) {
    const missing = missingBankFields(bank);
    if (missing.length > 0) {
      return { error: `Renseignez d'abord : ${missing.join(", ")}.` };
    }
  }

  if (!input.codEnabled && !input.bankTransferEnabled) {
    return { error: "Gardez au moins un mode de paiement actif, sinon aucune commande ne peut aboutir." };
  }

  const res = await payloadFetch("/api/globals/payment-settings", {
    body: JSON.stringify({
      codEnabled: input.codEnabled,
      codDescription: input.codDescription.trim(),
      bankTransferEnabled: input.bankTransferEnabled,
      bankTransferDescription: input.bankTransferDescription.trim(),
      bank,
    }),
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const first = data?.errors?.[0];
    return { error: first?.data?.errors?.[0]?.message || first?.message || "Échec de l'enregistrement." };
  }

  // The global's afterChange hook purges the storefront cache tag; this is for
  // the dashboard's own copy of the page.
  revalidatePath("/dashboard/settings");
  return {};
}

/**
 * Writes payment-settings → routineOffer, and only that group: Payload keeps
 * every field a partial write leaves out, so saving this card cannot touch the
 * payment methods above it (checked against the live global before shipping).
 */
export async function updateRoutineOffer(input: RoutineOfferForm): Promise<{ error?: string }> {
  await requireRole(canEditContent);

  const percent = Number(input.percent);
  if (!Number.isFinite(percent) || percent < 1 || percent > ROUTINE_PERCENT_MAX) {
    return { error: `La remise doit être comprise entre 1 et ${ROUTINE_PERCENT_MAX} %.` };
  }
  if (input.minItems !== 2 && input.minItems !== 3) {
    return { error: "Le lot doit compter 2 ou 3 produits minimum." };
  }

  const res = await payloadFetch("/api/globals/payment-settings", {
    body: JSON.stringify({ routineOffer: { enabled: input.enabled === true, minItems: input.minItems, percent } }),
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const first = data?.errors?.[0];
    return { error: first?.data?.errors?.[0]?.message || first?.message || "Échec de l'enregistrement." };
  }

  revalidatePath("/dashboard/settings");
  return {};
}
