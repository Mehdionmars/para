"use client";

import { Pencil, Plus, TriangleAlert } from "lucide-react";
import { deleteShippingRule, saveShippingRule } from "@/app/dashboard/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EMPTY_SHIPPING_RULE, type ShippingRuleForm } from "@/lib/dashboard/settings-types";
import { EditorSheet } from "./EditorSheet";
import { CheckRow, NumberInput, TextInput } from "./fields";
import { SettingsPanel } from "./SettingsPanel";
import { useRecordEditor } from "./useRecordEditor";

const mad = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

/** Only one default tariff exists: Payload clears the others when one is set,
 * and the list says so at once instead of after a reload. */
function mergeRule(items: ShippingRuleForm[], saved: ShippingRuleForm): ShippingRuleForm[] {
  const others = items.filter((i) => i.id !== saved.id).map((i) => (saved.isDefault ? { ...i, isDefault: false } : i));
  return [...others, saved];
}

/**
 * Delivery prices per city. The checkout recomputes the fee from these rules
 * on every order — a city's own rule first, the default one otherwise — and
 * ignores whatever amount the browser sends.
 */
export function ShippingRulesManager({ initial, canDelete }: { initial: ShippingRuleForm[]; canDelete: boolean }) {
  const editor = useRecordEditor({
    empty: EMPTY_SHIPPING_RULE,
    initial,
    merge: mergeRule,
    noun: "Tarif",
    remove: deleteShippingRule,
    save: saveShippingRule,
  });
  const { draft, patch } = editor;
  // The default first, then alphabetical: it is the rule most orders meet.
  const rules = [...editor.items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.city.localeCompare(b.city, "fr"));
  const hasDefault = rules.some((r) => r.isDefault && r.enabled);

  return (
    <>
      <SettingsPanel
        title="Livraison"
        description="Frais de livraison par ville et seuil de livraison offerte. Le checkout recalcule toujours les frais depuis ces règles."
        action={
          <Button type="button" variant="outline" onClick={() => editor.open(null)}>
            <Plus aria-hidden="true" />
            Ajouter un tarif
          </Button>
        }
        flush
      >
        {!hasDefault && (
          <p className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-strong sm:mx-5">
            <TriangleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
            Aucun tarif par défaut actif : une commande vers une ville sans règle propre est livrée gratuitement.
          </p>
        )}

        {rules.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground sm:px-5">Aucun tarif de livraison enregistré pour le moment.</p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {rules.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => editor.open(r)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                        {r.city}
                        {r.isDefault && <Badge variant="info">Par défaut</Badge>}
                        {!r.enabled && <Badge variant="outline">Inactif</Badge>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.freeFrom !== null ? `Offerte dès ${mad(r.freeFrom)}` : "Jamais offerte"}
                        {r.region && ` · ${r.region}`}
                      </p>
                    </div>
                    <span className="flex-none text-sm font-semibold tabular-nums text-foreground">{mad(r.price)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-5 py-2.5 font-medium">Ville</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Région</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Frais</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Offerte dès</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">État</th>
                    <th scope="col" className="w-28 px-5 py-2.5">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5 font-medium text-foreground">
                        <span className="flex flex-wrap items-center gap-2">
                          {r.city}
                          {r.isDefault && <Badge variant="info">Par défaut</Badge>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.region || "—"}</td>
                      <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums text-foreground">{mad(r.price)}</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                        {r.freeFrom !== null ? mad(r.freeFrom) : "Jamais"}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.enabled ? <Badge variant="success">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
                      </td>
                      <td className="px-5 py-1.5 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => editor.open(r)} aria-label={`Modifier le tarif ${r.city}`}>
                          <Pencil aria-hidden="true" />
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SettingsPanel>

      <EditorSheet
        open={draft !== null}
        onOpenChange={(o) => !o && editor.close()}
        title={draft?.id ? `Tarif — ${draft.city || "ville"}` : "Nouveau tarif de livraison"}
        description="La ville est comparée sans tenir compte des majuscules ni des accents."
        submitLabel="Enregistrer le tarif"
        saving={editor.saving}
        deleting={editor.deleting}
        error={editor.error}
        onSubmit={editor.submit}
        onDelete={draft?.id && canDelete ? editor.destroy : undefined}
        deleteLabel="Supprimer le tarif"
      >
        {draft && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Ville" required value={draft.city} onChange={(city) => patch({ city })} placeholder="Casablanca" />
              <TextInput label="Région" value={draft.region} onChange={(region) => patch({ region })} placeholder="Casablanca-Settat" hint="Facultatif, informatif." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label="Frais de livraison" required suffix="MAD" value={draft.price} onChange={(price) => patch({ price: price ?? 0 })} />
              <NumberInput
                label="Offerte à partir de"
                suffix="MAD"
                value={draft.freeFrom}
                onChange={(freeFrom) => patch({ freeFrom })}
                placeholder="Jamais"
                hint="Sous-total après remise. Vide = jamais offerte."
              />
            </div>
            <CheckRow
              label="Tarif par défaut"
              hint="Appliqué à toute ville sans règle propre. Un seul tarif peut l'être : le cocher le retire des autres."
              checked={draft.isDefault}
              onChange={(isDefault) => patch({ isDefault, ...(isDefault ? { enabled: true } : {}) })}
            />
            <CheckRow
              label="Actif"
              hint="Un tarif inactif est ignoré au checkout."
              checked={draft.enabled}
              disabled={draft.isDefault}
              onChange={(enabled) => patch({ enabled })}
            />
          </>
        )}
      </EditorSheet>
    </>
  );
}
