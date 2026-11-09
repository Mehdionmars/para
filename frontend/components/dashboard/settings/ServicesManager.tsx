"use client";

import { Baby, Droplet, Feather, Palette, Pencil, Plus, ScanFace, Scissors, Trash2, type LucideIcon } from "lucide-react";
import { deleteService, saveService } from "@/app/dashboard/(app)/settings/actions";
import { ImagePicker } from "@/components/dashboard/storefront/ImagePicker";
import { Button } from "@/components/ui/button";
import {
  EMPTY_SERVICE,
  SERVICE_ICON_LABELS,
  SERVICE_ICONS,
  servicePriceSummary,
  type PriceLine,
  type ServiceForm,
  type ServiceIcon,
} from "@/lib/dashboard/settings-types";
import { EditorSheet } from "./EditorSheet";
import { CheckRow, NumberInput, SelectInput, TextArea, TextInput, controlCls } from "./fields";
import { SettingsPanel } from "./SettingsPanel";
import { useRecordEditor } from "./useRecordEditor";

const ICON: Record<ServiceIcon, LucideIcon> = { Baby, Droplet, Feather, Palette, ScanFace, Scissors };

const ICON_OPTIONS = SERVICE_ICONS.map((value) => ({ label: SERVICE_ICON_LABELS[value], value }));

/** A repeatable list of rows inside the sheet, with add and remove. */
function Repeater<T>({
  legend,
  hint,
  rows,
  onChange,
  blank,
  addLabel,
  render,
}: {
  legend: string;
  hint?: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  addLabel: string;
  render: (row: T, update: (row: T) => void, index: number) => React.ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="min-w-0 flex-1">{render(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))), i)}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 flex-none text-muted-foreground"
            aria-label={`Retirer la ligne ${i + 1}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => onChange([...rows, structuredClone(blank)])}>
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </fieldset>
  );
}

/**
 * The in-cabin services and their tariff, as /services and each service page
 * publish them, and as the booking form offers them.
 */
export function ServicesManager({ initial, canDelete }: { initial: ServiceForm[]; canDelete: boolean }) {
  const editor = useRecordEditor({ empty: EMPTY_SERVICE, initial, noun: "Service", remove: deleteService, save: saveService });
  const { draft, patch } = editor;
  // The site's own order: lowest sortOrder first, unnumbered ones last.
  const services = [...editor.items].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) || a.title.localeCompare(b.title, "fr"));

  return (
    <>
      <SettingsPanel
        title="Services & tarifs"
        description="Les prestations en cabine, leur grille de prix et l'ordre d'affichage sur la page Services. Les rendez-vous sont pris sur ces services."
        action={
          <Button type="button" variant="outline" onClick={() => editor.open(null)}>
            <Plus aria-hidden="true" />
            Ajouter un service
          </Button>
        }
        flush
      >
        {services.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground sm:px-5">Aucun service publié pour le moment.</p>
        ) : (
          <ul className="divide-y divide-border">
            {services.map((s) => {
              const Icon = ICON[s.icon];
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    className="flex size-10 flex-none items-center justify-center rounded-lg text-foreground/80"
                    style={{ backgroundColor: s.bg }}
                    aria-hidden="true"
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {servicePriceSummary(s)}
                      {s.priceList.length > 0 && ` · ${s.priceList.length} tarif${s.priceList.length === 1 ? "" : "s"}`}
                      {s.duration && ` · ${s.duration}`}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => editor.open(s)} aria-label={`Modifier le service ${s.title}`}>
                    <Pencil aria-hidden="true" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsPanel>

      <EditorSheet
        open={draft !== null}
        onOpenChange={(o) => !o && editor.close()}
        title={draft?.id ? `Modifier — ${draft.title || "service"}` : "Nouveau service"}
        description="Publié sur la page Services dès l'enregistrement."
        submitLabel="Enregistrer le service"
        saving={editor.saving}
        deleting={editor.deleting}
        error={editor.error}
        onSubmit={editor.submit}
        onDelete={draft?.id && canDelete ? editor.destroy : undefined}
        deleteLabel="Supprimer le service"
      >
        {draft && (
          <>
            <TextInput label="Titre" required value={draft.title} onChange={(title) => patch({ title })} placeholder="Épilation" />
            <TextInput label="Sous-titre" value={draft.subtitle} onChange={(subtitle) => patch({ subtitle })} placeholder="Cire tiède, zones visage et corps" />
            <TextArea label="Description" required value={draft.description} onChange={(description) => patch({ description })} rows={4} />

            <div className="grid gap-4 sm:grid-cols-3">
              <NumberInput
                label="Prix de base"
                suffix="MAD"
                value={draft.price}
                onChange={(price) => patch({ price: price ?? 0 })}
                hint="0 affiche « Offert »."
              />
              <TextInput label="Durée" value={draft.duration} onChange={(duration) => patch({ duration })} placeholder="30 min" />
              <TextInput label="Intervenant" value={draft.expert} onChange={(expert) => patch({ expert })} placeholder="Esthéticienne" />
            </div>

            <Repeater<PriceLine>
              legend="Grille de tarifs"
              hint="Une ligne par prestation, comme sur la carte imprimée. La page Services affiche « Dès » le plus petit prix."
              rows={draft.priceList}
              onChange={(priceList) => patch({ priceList })}
              blank={{ fromPrice: false, label: "", price: null }}
              addLabel="Ajouter un tarif"
              render={(row, update, i) => (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
                  <TextInput label={`Prestation ${i + 1}`} value={row.label} onChange={(label) => update({ ...row, label })} placeholder="Sourcils" />
                  <NumberInput
                    label="Prix"
                    suffix="MAD"
                    value={row.price}
                    onChange={(price) => update({ ...row, price })}
                    placeholder="Sur demande"
                  />
                  <div className="sm:col-span-2">
                    <CheckRow label="Prix « à partir de »" checked={row.fromPrice} onChange={(fromPrice) => update({ ...row, fromPrice })} />
                  </div>
                </div>
              )}
            />

            <Repeater<string>
              legend="Bénéfices"
              hint="Les points listés sur la page du service."
              rows={draft.benefits}
              onChange={(benefits) => patch({ benefits })}
              blank=""
              addLabel="Ajouter un bénéfice"
              render={(row, update, i) => <TextInput label={`Bénéfice ${i + 1}`} value={row} onChange={update} />}
            />

            <Repeater
              legend="Déroulé"
              hint="Les étapes de la séance, dans l'ordre."
              rows={draft.steps}
              onChange={(steps) => patch({ steps })}
              blank={{ sub: "", title: "" }}
              addLabel="Ajouter une étape"
              render={(row, update, i) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput label={`Étape ${i + 1}`} value={row.title} onChange={(title) => update({ ...row, title })} />
                  <TextInput label="Précision" value={row.sub} onChange={(sub) => update({ ...row, sub })} />
                </div>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectInput label="Icône" value={draft.icon} onChange={(icon) => patch({ icon })} options={ICON_OPTIONS} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="service-bg" className="text-sm font-medium text-foreground">
                  Couleur des cartes
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Choisir la couleur"
                    value={/^#[0-9a-f]{6}$/i.test(draft.bg) ? draft.bg : "#efe6f3"}
                    onChange={(e) => patch({ bg: e.target.value })}
                    className="h-10 w-11 flex-none cursor-pointer rounded-lg border border-input bg-card p-1"
                  />
                  <input id="service-bg" value={draft.bg} onChange={(e) => patch({ bg: e.target.value })} className={`${controlCls} h-10 font-mono uppercase`} />
                </div>
              </div>
              <NumberInput
                label="Ordre"
                value={draft.sortOrder}
                onChange={(sortOrder) => patch({ sortOrder })}
                placeholder="Dernier"
                hint="Plus petit en premier."
              />
            </div>

            <ImagePicker
              label="Image"
              imageId={draft.imageId ?? undefined}
              imageUrl={draft.imageUrl || undefined}
              onChange={(id, url) => patch({ imageId: id ?? null, imageUrl: url })}
            />
          </>
        )}
      </EditorSheet>
    </>
  );
}
