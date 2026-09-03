import { PasswordForm } from "@/components/dashboard/settings/PasswordForm";
import { PaymentMethodsForm } from "@/components/dashboard/settings/PaymentMethodsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/Card";
import { requireRole } from "@/lib/dashboard/guard";
import { getPaymentSettings } from "@/lib/dashboard/paymentSettings";
import { canEditContent, isStaffUser, ROLE_LABELS } from "@/lib/dashboard/roles";

export default async function SettingsPage() {
  const user = await requireRole(isStaffUser);

  // Gated on the same permission the global itself requires, so a role that
  // could never save is not shown a form that would fail on submit. Loaded
  // only when it will be rendered.
  const canEditPayment = canEditContent(user);
  const payment = canEditPayment ? await getPaymentSettings() : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">Votre compte et vos accès.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-3">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rôle(s)</span>
            <span className="font-medium text-gray-900">
              {user.roles.length ? user.roles.map((r) => ROLE_LABELS[r]).join(", ") : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {payment && (
        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Modes de paiement</CardTitle>
            <p className="text-xs text-gray-500">
              Ce que la boutique accepte au checkout, et où envoyer un virement. Modifiable sans redéploiement.
            </p>
          </CardHeader>
          <CardContent>
            <PaymentMethodsForm initial={payment} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
