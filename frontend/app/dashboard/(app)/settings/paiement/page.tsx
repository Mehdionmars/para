import { PaymentMethodsForm } from "@/components/dashboard/settings/PaymentMethodsForm";
import { SettingsPanel } from "@/components/dashboard/settings/SettingsPanel";
import { requireRole } from "@/lib/dashboard/guard";
import { getPaymentSettings } from "@/lib/dashboard/paymentSettings";
import { canEditContent } from "@/lib/dashboard/roles";

/** The payment methods offered at checkout. It lived on the settings page
 * itself; it is the same form, now one section among the shop settings. */
export default async function SettingsPaymentPage() {
  await requireRole(canEditContent);
  const payment = await getPaymentSettings();

  return (
    <SettingsPanel
      title="Modes de paiement"
      description="Ce que la boutique accepte au checkout, et où envoyer un virement. Modifiable sans redéploiement."
    >
      <PaymentMethodsForm initial={payment} />
    </SettingsPanel>
  );
}
