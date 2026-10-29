"use client";

import { Clock, MapPin, Pencil, Phone, Plus, Store, Trash2 } from "lucide-react";
import { deleteStore, saveStore } from "@/app/dashboard/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { EMPTY_STORE, type StoreForm, type StoreHours } from "@/lib/dashboard/settings-types";
import { EditorSheet } from "./EditorSheet";
import { NumberInput, TextInput } from "./fields";
import { SettingsPanel } from "./SettingsPanel";
import { useRecordEditor } from "./useRecordEditor";

/** The seed writes this placeholder row; it is a gap, not a schedule. */
const isPlaceholder = (h: StoreHours) => /à compléter/i.test(h.days) || h.hours.trim() === "—";

/** The rows an empty schedule starts from — a suggestion to edit, not data. */
const HOURS_TEMPLATE: StoreHours[] = [
  { days: "Lundi – Samedi", hours: "" },
  { days: "Dimanche", hours: "" },
];

/**
 * The shop's address, phone, email, map link and opening hours, as the
 * Contact and Services pages publish them. One row per physical shop; most
 * shops have exactly one.
 */
export function StoresManager({ initial, canDelete }: { initial: StoreForm[]; canDelete: boolean }) {
  const editor = useRecordEditor({ empty: EMPTY_STORE, feminine: true, initial, noun: "Boutique", remove: deleteStore, save: saveStore });
  const { draft, patch } = editor;
  const sorted = [...editor.items].sort((a, b) => a.order - b.order);

  function setHours(next: StoreHours[]) {
    patch({ hours: next });
  }

  return (
    <>
      <SettingsPanel
        title="Boutique & horaires"
        description="Adresse, téléphone et horaires publiés sur les pages Contact et Services. Les changements sont en ligne dès l'enregistrement."
        action={
          <Button type="button" variant="outline" onClick={() => editor.open(null)}>
            <Plus aria-hidden="true" />
            Ajouter une boutique
          </Button>
        }
        flush
      >
        {sorted.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-4 py-8 sm:px-5">
            <p className="text-sm text-muted-foreground">
              Aucune boutique enregistrée : la page Contact n&apos;affiche pas encore d&apos;adresse.
            </p>
            <Button type="button" onClick={() => editor.open(null)}>
              <Plus aria-hidden="true" />
              Renseigner la boutique
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                <Store className="hidden size-5 flex-none text-muted-foreground sm:mt-0.5 sm:block" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
                    {s.address}
                  </p>
                  {(s.phone || s.email) && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Phone className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
                      <span className="min-w-0 break-words">{[s.phone, s.email].filter(Boolean).join(" · ")}</span>
                    </p>
                  )}
                  <div className="mt-1 flex items-start gap-1.5 text-sm">
                    <Clock className="mt-0.5 size-3.5 flex-none text-muted-foreground" aria-hidden="true" />
                    {s.hours.length === 0 || s.hours.every(isPlaceholder) ? (
                      <span className="text-warning-strong">Horaires non renseignés : le site n&apos;affiche pas encore d&apos;heures d&apos;ouverture.</span>
                    ) : (
                      <span className="text-muted-foreground">{s.hours.map((h) => `${h.days} : ${h.hours}`).join(" · ")}</span>
                    )}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => editor.open(s)}>
                  <Pencil aria-hidden="true" />
                  Modifier
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SettingsPanel>

      <EditorSheet
        open={draft !== null}
        onOpenChange={(o) => !o && editor.close()}
        title={draft?.id ? "Modifier la boutique" : "Nouvelle boutique"}
        description="Ces informations sont publiées telles quelles sur le site."
        submitLabel="Enregistrer la boutique"
        saving={editor.saving}
        deleting={editor.deleting}
        error={editor.error}
        onSubmit={editor.submit}
        onDelete={draft?.id && canDelete ? editor.destroy : undefined}
        deleteLabel="Supprimer la boutique"
      >
        {draft && (
          <>
            <TextInput label="Nom" required value={draft.name} onChange={(name) => patch({ name })} placeholder="Para d'Hiver — Aïn Sebaâ" />
            <TextInput
              label="Adresse"
              required
              value={draft.address}
              onChange={(address) => patch({ address })}
              placeholder="4A Allée des Amandiers, Casablanca 20000"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Téléphone" type="tel" value={draft.phone} onChange={(phone) => patch({ phone })} placeholder="06 19 96 90 07" />
              <TextInput label="Email" type="email" value={draft.email} onChange={(email) => patch({ email })} placeholder="contact@paradhiver.ma" />
            </div>
            <TextInput
              label="Lien Google Maps"
              type="url"
              value={draft.mapUrl}
              onChange={(mapUrl) => patch({ mapUrl })}
              placeholder="https://maps.app.goo.gl/…"
              hint="Pour le bouton « Itinéraire ». Laissé vide, le site construit le lien depuis l'adresse."
            />

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium text-foreground">Horaires d&apos;ouverture</legend>
              <p className="-mt-1 text-xs text-muted-foreground">Une ligne par jour ou plage de jours, ex. « Lundi – Samedi » / « 9h00 – 20h00 ».</p>
              {draft.hours.length > 0 && draft.hours.every(isPlaceholder) && (
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setHours(structuredClone(HOURS_TEMPLATE))}>
                  Remplacer « Horaires à compléter » par de vrais horaires
                </Button>
              )}
              {draft.hours.length === 0 && (
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setHours(structuredClone(HOURS_TEMPLATE))}>
                  <Plus aria-hidden="true" />
                  Ajouter les horaires
                </Button>
              )}
              {draft.hours.map((h, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                  <TextInput
                    label={i === 0 ? "Jours" : `Jours (ligne ${i + 1})`}
                    value={h.days}
                    onChange={(days) => setHours(draft.hours.map((x, j) => (j === i ? { ...x, days } : x)))}
                    placeholder="Lundi – Samedi"
                  />
                  <TextInput
                    label={i === 0 ? "Heures" : `Heures (ligne ${i + 1})`}
                    value={h.hours}
                    onChange={(hours) => setHours(draft.hours.map((x, j) => (j === i ? { ...x, hours } : x)))}
                    placeholder="9h00 – 20h00"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-muted-foreground"
                    aria-label={`Retirer la ligne ${i + 1} des horaires`}
                    onClick={() => setHours(draft.hours.filter((_, j) => j !== i))}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {draft.hours.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setHours([...draft.hours, { days: "", hours: "" }])}>
                  <Plus aria-hidden="true" />
                  Ajouter une ligne
                </Button>
              )}
            </fieldset>

            <NumberInput
              label="Ordre d'affichage"
              value={draft.order}
              onChange={(order) => patch({ order: order ?? 0 })}
              hint="Plus petit en premier, s'il y a plusieurs boutiques."
              className="sm:max-w-[12rem]"
            />
          </>
        )}
      </EditorSheet>
    </>
  );
}
