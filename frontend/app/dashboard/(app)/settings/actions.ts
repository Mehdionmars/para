"use server";

import { getSessionUser, payloadFetch } from "@/lib/dashboard/payload";

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
