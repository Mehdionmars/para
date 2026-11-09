"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/dashboard/ui/Toast";

type WithId = { id?: number };

/**
 * The list-plus-side-panel behaviour the four settings editors share: which
 * record is open, its draft, saving and deleting, the inline error and the
 * toast that confirms.
 *
 * The list is local state seeded from the server render and updated from what
 * each save returns — the stored document, not the draft — so a generated
 * slug or a default tariff another rule just lost shows up without reloading.
 * `merge` is where an editor says how a saved record lands in the list when
 * it touches the others too.
 */
export function useRecordEditor<T extends WithId>({
  initial,
  empty,
  save,
  remove,
  noun,
  feminine = false,
  merge,
}: {
  initial: T[];
  empty: T;
  save: (draft: T) => Promise<{ item?: T; error?: string }>;
  remove: (id: number) => Promise<{ error?: string }>;
  /** For the toasts: "Tarif enregistré", "Tarif supprimé". */
  noun: string;
  /** French agreement: "Boutique enregistrée", "Tarif enregistré". */
  feminine?: boolean;
  merge?: (items: T[], saved: T) => T[];
}) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  function open(record: T | null) {
    setError("");
    // A copy, so editing the draft never touches the list until it is saved.
    setDraft(structuredClone(record ?? empty));
  }

  function close() {
    setDraft(null);
    setError("");
  }

  function patch(changes: Partial<T>) {
    setDraft((d) => (d ? { ...d, ...changes } : d));
  }

  function submit() {
    if (!draft) return;
    setError("");
    startSaving(async () => {
      const res = await save(draft).catch(() => ({ error: "Le serveur n'a pas répondu. Réessayez dans un instant." }) as { item?: T; error?: string });
      if (res.error || !res.item) {
        setError(res.error ?? "Échec de l'enregistrement.");
        return;
      }
      const saved = res.item;
      setItems((list) =>
        merge
          ? merge(list, saved)
          : list.some((i) => i.id === saved.id)
            ? list.map((i) => (i.id === saved.id ? saved : i))
            : [...list, saved],
      );
      toast.success(`${noun} enregistré${feminine ? "e" : ""}`);
      setDraft(null);
    });
  }

  function destroy() {
    const id = draft?.id;
    if (!id) return;
    setError("");
    startDeleting(async () => {
      const res = await remove(id).catch(() => ({ error: "Le serveur n'a pas répondu. Réessayez dans un instant." }));
      if (res.error) {
        setError(res.error);
        return;
      }
      setItems((list) => list.filter((i) => i.id !== id));
      toast.success(`${noun} supprimé${feminine ? "e" : ""}`);
      setDraft(null);
    });
  }

  return { close, deleting, destroy, draft, error, items, open, patch, saving, submit };
}
