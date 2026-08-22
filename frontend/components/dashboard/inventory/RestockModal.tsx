"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { restockProduct } from "@/app/dashboard/(app)/inventory/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { Input } from "@/components/dashboard/ui/Input";
import { Modal } from "@/components/dashboard/ui/Modal";
import type { Supplier } from "@/lib/dashboard/inventory";

const NEW_SUPPLIER = "__new__";

export function RestockModal({
  product,
  suppliers,
  onClose,
  onSuccess,
}: {
  product: { id: number; name: string; stock: number };
  suppliers: Supplier[];
  onClose: () => void;
  onSuccess: (result: { productId: number; newStock: number }) => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [supplierChoice, setSupplierChoice] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const quantityNum = Number(quantity);
  const quantityValid = Number.isInteger(quantityNum) && quantityNum > 0;
  const newStock = quantityValid ? product.stock + quantityNum : product.stock;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantityValid) {
      setError("Entrez une quantité entière positive.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await restockProduct({
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate || undefined,
        note: note.trim() || undefined,
        productId: product.id,
        quantity: quantityNum,
        reference: reference.trim() || undefined,
        supplierId: supplierChoice && supplierChoice !== NEW_SUPPLIER ? Number(supplierChoice) : undefined,
        supplierName: supplierChoice === NEW_SUPPLIER ? newSupplierName.trim() || undefined : undefined,
      });
      onSuccess({ newStock: result.newStock, productId: product.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du réapprovisionnement.");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Réapprovisionner" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="text-xs font-medium text-gray-500">Produit</div>
          <div className="mt-0.5 text-sm font-medium text-gray-900">{product.name}</div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Stock actuel</span>
          <span className="font-semibold text-gray-900">{product.stock}</span>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
          Quantité à ajouter
          <Input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="50"
            required
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
          Fournisseur
          <select
            value={supplierChoice}
            onChange={(e) => setSupplierChoice(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">— Aucun —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={NEW_SUPPLIER}>+ Nouveau fournisseur…</option>
          </select>
        </label>

        {supplierChoice === NEW_SUPPLIER && (
          <Input
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            placeholder="Nom du nouveau fournisseur"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
            Numéro de lot
            <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="LOT-2026-001" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
            Date d&apos;expiration
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
          Référence (bon de commande, facture…)
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optionnel" />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optionnel"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2.5 text-sm">
          <span className="text-violet-700">Nouveau stock</span>
          <span className="font-semibold text-violet-900">{newStock}</span>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting || !quantityValid}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Réapprovisionner
          </Button>
        </div>
      </form>
    </Modal>
  );
}
