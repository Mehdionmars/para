import { PasswordForm } from "@/components/dashboard/settings/PasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/ui/Card";
import { requireRole } from "@/lib/dashboard/guard";
import { isStaffUser, ROLE_LABELS } from "@/lib/dashboard/roles";

export default async function SettingsPage() {
  const user = await requireRole(isStaffUser);

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
    </div>
  );
}
