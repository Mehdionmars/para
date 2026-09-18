import { PasswordForm } from "@/components/dashboard/settings/PasswordForm";
import { PaymentMethodsForm } from "@/components/dashboard/settings/PaymentMethodsForm";
import { RoutineOfferForm } from "@/components/dashboard/settings/RoutineOfferForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dashboard/guard";
import { getPaymentSettings, getRoutineOffer } from "@/lib/dashboard/paymentSettings";
import { canEditContent, isStaffUser, ROLE_LABELS } from "@/lib/dashboard/roles";

export default async function SettingsPage() {
  const user = await requireRole(isStaffUser);

  // Gated on the same permission the global itself requires, so a role that
  // could never save is not shown a form that would fail on submit. Loaded
  // only when it will be rendered.
  const canEditPayment = canEditContent(user);
  const [payment, routineOffer] = canEditPayment
    ? await Promise.all([getPaymentSettings(), getRoutineOffer()])
    : [null, null];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Votre compte et vos accès.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rôle(s)</span>
            <span className="font-medium text-foreground">
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
            <p className="text-xs text-muted-foreground">
              Ce que la boutique accepte au checkout, et où envoyer un virement. Modifiable sans redéploiement.
            </p>
          </CardHeader>
          <CardContent>
            <PaymentMethodsForm initial={payment} />
          </CardContent>
        </Card>
      )}

      {routineOffer && (
        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Offre routine</CardTitle>
            <p className="text-xs text-muted-foreground">
              Remise sur les lots composés depuis « Complétez votre routine » d&apos;une fiche produit. Vérifiée et
              appliquée au moment de la commande.
            </p>
          </CardHeader>
          <CardContent>
            <RoutineOfferForm initial={routineOffer} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
