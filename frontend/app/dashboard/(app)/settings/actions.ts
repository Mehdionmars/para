"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dashboard/guard";
import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";
import {
  missingBankFields,
  type PaymentSettingsForm,
} from "@/lib/dashboard/paymentSettings-types";
import { canEditContent, hasRole, type Role } from "@/lib/dashboard/roles";
import {
  cleanService,
  cleanShippingRule,
  cleanStore,
  deleteDoc,
  saveDoc,
  toServiceForm,
  toShippingRuleForm,
  toStaffAccount,
  toStoreForm,
  validateService,
  validateShippingRule,
  validateStaffAccount,
  validateStore,
  type ServiceForm,
  type ShippingRuleForm,
  type StaffAccount,
  type StaffAccountInput,
  type StoreForm,
} from "@/lib/dashboard/settings";

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

// ------------------------------------------------------------------ Boutique,
// livraison, services, équipe.
//
// Each action re-runs the rule the form already ran (lib/dashboard/settings-
// types), then writes through the operator's own session: Payload's access
// rules are still the boundary, these checks only turn a refusal into a
// sentence. Each returns the stored document, so the list on screen shows
// what Payload actually kept — a service's generated slug, a default tariff
// another rule just lost.

type Saved<T> = { item?: T; error?: string };

const canDelete = (user: { roles: Role[] }) => hasRole(user, "admin", "manager");

export async function saveStore(input: StoreForm): Promise<Saved<StoreForm>> {
  await requireRole(canEditContent);
  const problem = validateStore(input);
  if (problem) return { error: problem };
  const res = await saveDoc("stores", input.id, cleanStore(input));
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/settings/boutique");
  return { item: toStoreForm(res.doc) };
}

export async function deleteStore(id: number): Promise<{ error?: string }> {
  const user = await requireRole(canEditContent);
  if (!canDelete(user)) return { error: "Seul un administrateur ou un manager peut supprimer une boutique." };
  const res = await deleteDoc("stores", id);
  if (!res.error) revalidatePath("/dashboard/settings/boutique");
  return res;
}

export async function saveShippingRule(input: ShippingRuleForm): Promise<Saved<ShippingRuleForm>> {
  await requireRole(canEditContent);
  const problem = validateShippingRule(input);
  if (problem) return { error: problem };
  const res = await saveDoc("shipping-rules", input.id, cleanShippingRule(input));
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/settings/livraison");
  return { item: toShippingRuleForm(res.doc) };
}

export async function deleteShippingRule(id: number): Promise<{ error?: string }> {
  const user = await requireRole(canEditContent);
  if (!canDelete(user)) return { error: "Seul un administrateur ou un manager peut supprimer un tarif." };
  const res = await deleteDoc("shipping-rules", id);
  if (!res.error) revalidatePath("/dashboard/settings/livraison");
  return res;
}

export async function saveService(input: ServiceForm): Promise<Saved<ServiceForm>> {
  await requireRole(canEditContent);
  const problem = validateService(input);
  if (problem) return { error: problem };
  const res = await saveDoc("services", input.id, cleanService(input));
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/settings/services");
  // The image URL is not in a depth=0 answer; the form already has it.
  return { item: toServiceForm(res.doc, input.imageId ? input.imageUrl : "") };
}

export async function deleteService(id: number): Promise<{ error?: string }> {
  const user = await requireRole(canEditContent);
  if (!canDelete(user)) return { error: "Seul un administrateur ou un manager peut supprimer un service." };
  const res = await deleteDoc("services", id);
  if (!res.error) revalidatePath("/dashboard/settings/services");
  return res;
}

const isAdmin = (user: { roles: Role[] }) => hasRole(user, "admin");

/** Creates a staff account (email, password, roles) or changes one's roles
 * and, optionally, its password. Admin only, as in Payload. */
export async function saveStaffAccount(input: StaffAccountInput): Promise<Saved<StaffAccount>> {
  const user = await requireRole(isAdmin);
  const problem = validateStaffAccount(input, { isSelf: input.id === user.id });
  if (problem) return { error: problem };

  const data: Record<string, unknown> = { roles: input.roles };
  if (!input.id) data.email = input.email.trim().toLowerCase();
  if (input.password) data.password = input.password;

  const res = await saveDoc("users", input.id, data);
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/settings/equipe");
  return { item: toStaffAccount(res.doc) };
}

export async function deleteStaffAccount(id: number): Promise<{ error?: string }> {
  const user = await requireRole(isAdmin);
  if (id === user.id) return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  const res = await deleteDoc("users", id);
  if (!res.error) revalidatePath("/dashboard/settings/equipe");
  return res;
}