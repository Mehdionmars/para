"use client";

import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, GripVertical, ImageOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { publishHome, saveHomeDraft } from "@/app/dashboard/(app)/storefront/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoffretFields, CoffretsCopyEditor, newCoffret } from "@/components/dashboard/storefront/editors";
import { AlertDialog } from "@/components/dashboard/ui/AlertDialog";
import { useToast } from "@/components/dashboard/ui/Toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type Coffret, type HomeDraft, mapDraftToPayload } from "@/lib/dashboard/storefront-mapping";

function priceLabel(c: Coffret): string {
  if (c.product) return "Prix du produit";
  return `${c.priceFrom ? "Dès " : ""}${c.price} MAD`;
}

/**
 * The coffret cards as a board: drag a card to reorder it, click it to edit
 * it in a side panel, add one from the last tile.
 *
 * It writes the whole Home draft, exactly as the Storefront Builder does, so
 * "Publier" here also puts live any other home change still waiting in the
 * draft — said under the buttons, because it is not obvious from this page.
 */
export function CoffretsManager({ initialDraft, initialStatus }: { initialDraft: HomeDraft; initialStatus: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(() => JSON.stringify(initialDraft));
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [showCopy, setShowCopy] = useState(false);

  const coffrets = draft.coffrets;
  const dirty = useMemo(() => JSON.stringify(draft) !== saved, [draft, saved]);
  const section = draft.sections.find((s) => s.key === "coffrets");
  const activeCount = coffrets.filter((c) => c.active).length;

  // Leaving with unsaved cards loses them; the browser asks first.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setCoffrets = (next: Coffret[]) => setDraft((d) => ({ ...d, coffrets: next }));
  const patchCoffret = (index: number, patch: Partial<Coffret>) =>
    setCoffrets(coffrets.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= coffrets.length) return;
    const next = [...coffrets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCoffrets(next);
  }

  function add() {
    setCoffrets([...coffrets, newCoffret()]);
    setEditing(coffrets.length);
  }

  function duplicate(index: number) {
    const next = [...coffrets];
    next.splice(index + 1, 0, { ...coffrets[index], title: `${coffrets[index].title} (copie)` });
    setCoffrets(next);
  }

  function remove(index: number) {
    setCoffrets(coffrets.filter((_, i) => i !== index));
    setToDelete(null);
    if (editing === index) setEditing(null);
  }

  function setSectionVisible(visible: boolean) {
    setDraft((d) => ({ ...d, sections: d.sections.map((s) => (s.key === "coffrets" ? { ...s, visible } : s)) }));
  }

  async function save() {
    setBusy("save");
    const res = await saveHomeDraft(mapDraftToPayload(draft));
    setBusy(null);
    if (res.error) return toast.error("Enregistrement impossible", res.error);
    setSaved(JSON.stringify(draft));
    setStatus("draft");
    toast.success("Brouillon enregistré", "Pas encore visible sur le site : cliquez sur Publier.");
  }

  async function publish() {
    setBusy("publish");
    const res = await publishHome(mapDraftToPayload(draft));
    setBusy(null);
    if (res.error) return toast.error("Publication impossible", res.error);
    setSaved(JSON.stringify(draft));
    setStatus("published");
    if (res.warning) toast.error("Publié, avec un avertissement", res.warning);
    else toast.success("Coffrets publiés", "Ils sont en ligne sur la page d'accueil.");
  }

  const editingCoffret = editing !== null ? coffrets[editing] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Coffrets & cadeaux"
        description="Les cartes de la section « Coffrets & cadeaux » de la page d'accueil. Glissez une carte pour changer l'ordre, cliquez dessus pour la modifier."
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Voir le site
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={save} disabled={!dirty || busy !== null}>
              {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </Button>
            <Button size="sm" onClick={publish} disabled={busy !== null || (!dirty && status === "published")}>
              {busy === "publish" && <Loader2 className="h-4 w-4 animate-spin" />} Publier
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <span className={dirty ? "font-medium text-warning-strong" : status === "published" ? "text-success-strong" : "text-warning-strong"}>
          {dirty ? "Modifications non enregistrées" : status === "published" ? "En ligne" : "Brouillon non publié"}
        </span>
        <span className="text-muted-foreground">
          {activeCount} carte{activeCount > 1 ? "s" : ""} visible{activeCount > 1 ? "s" : ""} sur {coffrets.length}
        </span>
        {section && (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={section.visible} onChange={(e) => setSectionVisible(e.target.checked)} className="h-4 w-4 accent-primary" />
            Section affichée sur la page d&apos;accueil
          </label>
        )}
        <button type="button" onClick={() => setShowCopy((v) => !v)} className="ml-auto text-primary hover:underline">
          {showCopy ? "Masquer" : "Titre et texte de la section"}
        </button>
      </div>

      {showCopy && (
        <div className="max-w-xl rounded-lg border border-border bg-card p-4">
          <CoffretsCopyEditor value={draft.coffretsCopy} onChange={(coffretsCopy) => setDraft((d) => ({ ...d, coffretsCopy }))} />
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {coffrets.map((c, index) => (
          <li
            // Index keys: cards have no stable id in the CMS array, and the
            // list is only ever rebuilt whole.
            key={index}
            draggable
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== index) setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`group flex flex-col overflow-hidden rounded-xl border bg-card transition ${
              overIndex === index && dragIndex !== null && dragIndex !== index ? "border-primary ring-2 ring-primary/30" : "border-border"
            } ${dragIndex === index ? "opacity-40" : ""} ${c.active ? "" : "opacity-70"}`}
          >
            <button type="button" onClick={() => setEditing(index)} className="relative block aspect-[4/3] w-full bg-muted text-left" aria-label={`Modifier ${c.title}`}>
              {c.image.url ? (
                <Image src={c.image.url} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                  <ImageOff className="h-6 w-6" /> Pas d&apos;image
                </span>
              )}
              <span className="absolute left-2 top-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-card/90 text-muted-foreground shadow-sm" title="Glisser pour déplacer">
                <GripVertical className="h-4 w-4" />
              </span>
              {c.tag && <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{c.tag}</span>}
              {!c.active && (
                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] text-background">
                  <EyeOff className="h-3 w-3" /> Masqué
                </span>
              )}
            </button>

            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="truncate text-sm font-semibold text-foreground">{c.title || "Sans titre"}</p>
              <p className="text-xs text-muted-foreground">{priceLabel(c)}</p>
            </div>

            <div className="flex items-center gap-0.5 border-t border-border px-2 py-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(index)} title="Modifier">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => patchCoffret(index, { active: !c.active })} title={c.active ? "Masquer" : "Afficher"}>
                {c.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(index)} title="Dupliquer">
                <Copy className="h-4 w-4" />
              </Button>
              {/* Buttons beside the drag, for a keyboard or a touch screen,
                  where HTML drag and drop does not reach. */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, index - 1)} disabled={index === 0} title="Avancer">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, index + 1)} disabled={index === coffrets.length - 1} title="Reculer">
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(index)} title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={add}
            className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-6 w-6" /> Nouveau coffret
          </button>
        </li>
      </ul>

      <p className="text-xs text-muted-foreground">
        « Publier » met en ligne ces coffrets, ainsi que toute autre modification de la page d&apos;accueil restée en brouillon dans le Storefront.
      </p>

      <Sheet open={editingCoffret !== undefined} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingCoffret?.title || "Coffret"}</SheetTitle>
            <SheetDescription>Les changements s&apos;appliquent à la carte tout de suite ; enregistrez ou publiez ensuite.</SheetDescription>
          </SheetHeader>
          {editingCoffret && editing !== null && (
            <div className="px-4">
              <CoffretFields value={editingCoffret} onChange={(patch) => patchCoffret(editing, patch)} />
            </div>
          )}
          <SheetFooter>
            <Button onClick={() => setEditing(null)}>Terminé</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={toDelete !== null}
        title="Supprimer ce coffret ?"
        description={toDelete !== null ? `« ${coffrets[toDelete]?.title} » sera retiré. Pour le cacher sans le perdre, utilisez plutôt Masquer.` : undefined}
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => toDelete !== null && remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
