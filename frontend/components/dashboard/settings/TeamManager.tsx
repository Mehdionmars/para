"use client";

import { Pencil, Plus, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { deleteStaffAccount, saveStaffAccount } from "@/app/dashboard/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/dashboard/roles";
import { ROLE_DESCRIPTIONS, type StaffAccount, type StaffAccountInput } from "@/lib/dashboard/settings-types";
import { EditorSheet } from "./EditorSheet";
import { TextInput } from "./fields";
import { SettingsPanel } from "./SettingsPanel";
import { useRecordEditor } from "./useRecordEditor";

type Draft = StaffAccountInput & { createdAt?: string };

const EMPTY: Draft = { email: "", password: "", roles: ["sales"] };

function RoleChoice({ value, onChange, lockAdmin }: { value: Role[]; onChange: (roles: Role[]) => void; lockAdmin: boolean }) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">Rôles</legend>
      <p className="-mt-0.5 text-xs text-muted-foreground">Les accès s&apos;additionnent : un compte peut cumuler plusieurs rôles.</p>
      {STAFF_ROLES.map((role) => {
        const checked = value.includes(role);
        const locked = lockAdmin && role === "admin";
        return (
          <label
            key={role}
            htmlFor={`${id}-${role}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 has-checked:border-primary/40 has-checked:bg-accent/60"
          >
            <input
              id={`${id}-${role}`}
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={(e) => onChange(e.target.checked ? [...value, role] : value.filter((r) => r !== role))}
              className="mt-0.5 size-4 flex-none accent-primary disabled:opacity-60"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{ROLE_LABELS[role]}</span>
              <span className="block text-xs text-muted-foreground">
                {locked ? "Votre propre rôle d'administrateur ne peut pas être retiré ici." : ROLE_DESCRIPTIONS[role]}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * The staff accounts and what each may open. An administrator creates
 * accounts, changes roles and sets a new password; a manager sees the list
 * read-only, as Payload's own access rules have it.
 */
export function TeamManager({ initial, currentUserId, canEdit }: { initial: StaffAccount[]; currentUserId: number; canEdit: boolean }) {
  const editor = useRecordEditor<Draft>({
    empty: EMPTY,
    initial: initial.map((a) => ({ ...a, password: "" })),
    noun: "Compte",
    remove: deleteStaffAccount,
    save: async (d) => {
      const res = await saveStaffAccount({ email: d.email, id: d.id, password: d.password, roles: d.roles });
      return res.item ? { item: { ...res.item, password: "" } } : { error: res.error };
    },
  });
  const { draft, patch } = editor;
  // Staff first, then accounts with no dashboard access at all.
  const accounts = [...editor.items].sort(
    (a, b) => Number(STAFF_ROLES.some((r) => b.roles.includes(r))) - Number(STAFF_ROLES.some((r) => a.roles.includes(r))) || a.email.localeCompare(b.email),
  );
  const isSelf = draft?.id === currentUserId;

  return (
    <>
      <SettingsPanel
        title="Équipe & rôles"
        description={
          canEdit
            ? "Les comptes qui se connectent au dashboard et ce que chacun peut ouvrir."
            : "Les comptes qui se connectent au dashboard. Seul un administrateur peut les modifier."
        }
        action={
          canEdit && (
            <Button type="button" variant="outline" onClick={() => editor.open(null)}>
              <Plus aria-hidden="true" />
              Ajouter un membre
            </Button>
          )
        }
        flush
      >
        <ul className="divide-y divide-border">
          {accounts.map((a) => {
            const staff = a.roles.filter((r) => STAFF_ROLES.includes(r));
            return (
              <li key={a.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium break-all text-foreground">
                    {a.email}
                    {a.id === currentUserId && <Badge variant="outline">Vous</Badge>}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {staff.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Aucun accès au dashboard</span>
                    ) : (
                      staff.map((r) => (
                        <Badge key={r} variant={r === "admin" ? "info" : "outline"}>
                          {r === "admin" && <ShieldCheck aria-hidden="true" />}
                          {ROLE_LABELS[r]}
                        </Badge>
                      ))
                    )}
                  </p>
                </div>
                {canEdit && (
                  <Button type="button" variant="outline" size="sm" className="self-start sm:self-center" onClick={() => editor.open(a as Draft)} aria-label={`Modifier le compte ${a.email}`}>
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </SettingsPanel>

      {canEdit && (
        <EditorSheet
          open={draft !== null}
          onOpenChange={(o) => !o && editor.close()}
          title={draft?.id ? draft.email : "Nouveau membre de l'équipe"}
          description={draft?.id ? "Rôles et mot de passe de ce compte." : "Le compte peut se connecter au dashboard dès sa création."}
          submitLabel={draft?.id ? "Enregistrer" : "Créer le compte"}
          saving={editor.saving}
          deleting={editor.deleting}
          error={editor.error}
          onSubmit={editor.submit}
          onDelete={draft?.id && !isSelf ? editor.destroy : undefined}
          deleteLabel="Supprimer le compte"
        >
          {draft && (
            <>
              {!draft.id && (
                <TextInput
                  label="Email"
                  type="email"
                  required
                  autoComplete="off"
                  value={draft.email}
                  onChange={(email) => patch({ email })}
                  placeholder="prenom@paradhiver.ma"
                  hint="L'identifiant de connexion."
                />
              )}
              <TextInput
                label={draft.id ? "Nouveau mot de passe" : "Mot de passe"}
                type="password"
                required={!draft.id}
                autoComplete="new-password"
                value={draft.password}
                onChange={(password) => patch({ password })}
                hint={draft.id ? "Laissez vide pour garder le mot de passe actuel. Au moins 8 caractères." : "Au moins 8 caractères. Communiquez-le à la personne de vive voix."}
              />
              <RoleChoice value={draft.roles} onChange={(roles) => patch({ roles })} lockAdmin={isSelf} />
            </>
          )}
        </EditorSheet>
      )}
    </>
  );
}
