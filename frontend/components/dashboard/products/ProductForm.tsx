"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createProduct, updateProduct, type ProductInput } from "@/app/dashboard/(app)/products/actions";
import { ProductPreview } from "@/components/dashboard/products/ProductPreview";
import { Button } from "@/components/dashboard/ui/Button";
import { Card, CardContent } from "@/components/dashboard/ui/Card";
import { Input } from "@/components/dashboard/ui/Input";
import {
  BADGE_TYPE_DEFAULT_LABEL,
  BADGE_TYPES,
  CATEGORY_OPTIONS,
  VARIANT_OPTION_TYPES,
  type BadgeType,
  type Brand,
  type Product,
  type VariantOptionType,
} from "@/lib/dashboard/products-types";

const MAX_BADGES = 3;

const badgeSchema = z.object({
  enabled: z.boolean().default(true),
  type: z.enum(BADGE_TYPES.map((t) => t.value) as [BadgeType, ...BadgeType[]]).default("top"),
  text: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
});

const variantSchema = z.object({
  optionValue: z.string().min(1, "Valeur requise"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, "Prix invalide"),
  oldPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0).default(0),
  reservedStock: z.coerce.number().min(0).default(0),
  lowStockThreshold: z.coerce.number().min(0).default(5),
  image: z.coerce.number().optional(),
  active: z.boolean().default(true),
});

const schema = z
  .object({
    name: z.string().min(2, "Nom requis"),
    brand: z.coerce.number({ error: "Marque requise" }).min(1, "Marque requise"),
    category: z.enum(CATEGORY_OPTIONS, { error: "Catégorie requise" }),
    size: z.string().optional(),
    price: z.coerce.number().min(0, "Prix invalide"),
    oldPrice: z.coerce.number().min(0).optional(),
    badges: z.array(badgeSchema).max(MAX_BADGES, `${MAX_BADGES} badges maximum`).default([]),
    description: z.string().min(10, "Description trop courte"),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    stock: z.coerce.number().min(0).default(0),
    reservedStock: z.coerce.number().min(0).default(0),
    lowStockThreshold: z.coerce.number().min(0).default(5),
    hasVariants: z.boolean().default(false),
    variantOptionType: z.enum(VARIANT_OPTION_TYPES.map((t) => t.value) as [VariantOptionType, ...VariantOptionType[]]).default("contenance"),
    variants: z.array(variantSchema).default([]),
    isPublished: z.boolean().default(true),
  })
  .refine((data) => !data.hasVariants || data.variants.length > 0, {
    message: "Ajoutez au moins une variante, ou désactivez « Plusieurs variantes ».",
    path: ["variants"],
  });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function imageUrl(image: Product["image"]) {
  return typeof image === "object" && image ? image.url : "";
}

export function ProductForm({
  brands,
  product,
  duplicateOf,
}: {
  brands: Brand[];
  product?: Product;
  /**
   * Seeds a *new* product from an existing one (dashboard "Dupliquer").
   *
   * Kept separate from `product` on purpose: `product` is what decides
   * update-vs-create, so passing the source there would overwrite the
   * original instead of creating a copy. Identity fields (SKU, barcode,
   * stock) are stripped by the caller — see the page — and the slug is
   * regenerated server-side from the new name.
   */
  duplicateOf?: Product;
}) {
  const router = useRouter();
  // Field values come from whichever product we are seeding from; every
  // behavioural decision below still keys off `product` alone.
  const seed = product ?? duplicateOf;
  const [imageId, setImageId] = useState<number | undefined>(
    typeof seed?.image === "object" && seed.image ? seed.image.id : undefined,
  );
  const [imagePreview, setImagePreview] = useState<string>(imageUrl(seed?.image));
  // Secondary shots. Seeded from the product's existing Payload gallery so
  // opening and re-saving a product never silently drops the images it
  // already had.
  const [gallery, setGallery] = useState<{ id: number; url: string }[]>(
    (seed?.gallery ?? [])
      .map((row) => (typeof row?.image === "object" && row.image ? { id: row.image.id, url: imageUrl(row.image) } : null))
      .filter((g): g is { id: number; url: string } => Boolean(g)),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [variantImages, setVariantImages] = useState<Record<string, { preview?: string; uploading?: boolean }>>({});

  const {
    register,
    control,
    watch,
    trigger,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted, isValid, touchedFields },
  } = useForm<FormInput, unknown, FormOutput>({
    mode: "onTouched",
    defaultValues: seed
      ? {
          badges: (seed.badges || []).map((b) => ({
            enabled: b.enabled,
            type: b.type,
            text: b.text || "",
            bgColor: b.bgColor || "",
            textColor: b.textColor || "",
          })),
          barcode: seed.barcode || "",
          brand: typeof seed.brand === "object" ? seed.brand.id : seed.brand,
          category: seed.category,
          description: seed.description,
          hasVariants: seed.hasVariants || false,
          isPublished: seed.isPublished,
          lowStockThreshold: seed.lowStockThreshold,
          name: seed.name,
          oldPrice: seed.oldPrice || undefined,
          price: seed.price,
          reservedStock: seed.reservedStock,
          size: seed.size || "",
          sku: seed.sku || "",
          stock: seed.stock,
          variantOptionType: seed.variantOptionType || "contenance",
          variants: (seed.variants || []).map((v) => ({
            active: v.active,
            barcode: v.barcode || "",
            image: typeof v.image === "object" && v.image ? v.image.id : v.image || undefined,
            lowStockThreshold: v.lowStockThreshold,
            oldPrice: v.oldPrice || undefined,
            optionValue: v.optionValue,
            price: v.price,
            reservedStock: v.reservedStock,
            sku: v.sku || "",
            stock: v.stock,
          })),
        }
      : { badges: [], hasVariants: false, isPublished: true, lowStockThreshold: 5, reservedStock: 0, stock: 0, variantOptionType: "contenance", variants: [] },
    resolver: zodResolver(schema),
  });

  const badgesArray = useFieldArray({ control, name: "badges" });
  const variantsArray = useFieldArray({ control, name: "variants" });
  const hasVariants = watch("hasVariants");

  /**
   * Whether a field's error may be shown yet.
   *
   * Validation runs on change so the submit button can reflect validity, but
   * showing "Marque requise" on a field the operator has not reached yet
   * greets them with a wall of red before they have typed anything. An error
   * appears once the field has been visited, or once the form has been
   * submitted.
   */
  const showError = (field: keyof typeof touchedFields) => isSubmitted || !!touchedFields[field];

  // Derived from form state on every render — no effect, no extra fetch. The
  // brand select stores an id, so the label is resolved from the list the
  // page already received as a prop.
  // Raw rows straight from the form: ProductBadges applies the presets, the
  // priority order, the 3-badge cap and the automatic discount pill — the
  // same code path the storefront uses.
  const previewBadges = watch("badges") || [];
  const previewBrandName = brands.find((b) => String(b.id) === String(watch("brand")))?.name || "";

  function variantImagePreview(fieldId: string, index: number): string | undefined {
    const local = variantImages[fieldId];
    if (local) return local.preview;
    const fallback = seed?.variants?.[index]?.image;
    return typeof fallback === "object" && fallback ? fallback.url : undefined;
  }

  async function handleVariantImageChange(e: React.ChangeEvent<HTMLInputElement>, index: number, fieldId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVariantImages((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], uploading: true } }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/dashboard-media", { body: form, method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Échec de l'upload.");
      const data = await res.json();
      setValue(`variants.${index}.image`, data.id);
      setVariantImages((prev) => ({ ...prev, [fieldId]: { preview: data.url, uploading: false } }));
    } catch {
      setVariantImages((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], uploading: false } }));
    }
  }

  // react-hook-form only computes `formState.isValid` after a validation
  // pass runs, so without this the sticky/bottom save buttons would render
  // as enabled on first paint even with required fields empty.
  useEffect(() => {
    trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Uploads one file and returns the created Media doc. */
  async function uploadOne(file: File): Promise<{ id: number; url: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/dashboard-media", { body: form, method: "POST" });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Échec de l'upload de ${file.name}.`);
    return res.json();
  }

  /**
   * Accepts any number of files. The first upload fills the main image when
   * the product doesn't have one yet; the rest go to the gallery — so
   * selecting five files on a new product does the obvious thing instead of
   * keeping only the last one, which is what the previous single-file
   * handler did.
   *
   * Uploads run sequentially: Payload's media endpoint writes to Cloudinary
   * per request, and firing ten in parallel reliably tripped its rate limit.
   */
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError("");

    let nextImageId = imageId;
    const uploaded: { id: number; url: string }[] = [];
    const failures: string[] = [];

    for (const file of files) {
      try {
        const media = await uploadOne(file);
        if (!nextImageId) {
          nextImageId = media.id;
          setImageId(media.id);
          setImagePreview(media.url);
        } else {
          uploaded.push(media);
        }
      } catch (err) {
        failures.push(err instanceof Error ? err.message : file.name);
      }
    }

    if (uploaded.length) setGallery((prev) => [...prev, ...uploaded]);
    // Partial success is reported rather than swallowed: the images that did
    // upload are kept, and the editor is told exactly which ones failed.
    if (failures.length) setUploadError(failures.join(" · "));
    setUploading(false);
    // Lets the same file be re-picked after a failure.
    e.target.value = "";
  }

  function removeGalleryImage(id: number) {
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /** Swaps a gallery shot with the main image, keeping both. */
  function promoteToMain(id: number) {
    const picked = gallery.find((g) => g.id === id);
    if (!picked) return;
    const previousMain = imageId && imagePreview ? { id: imageId, url: imagePreview } : null;
    setImageId(picked.id);
    setImagePreview(picked.url);
    setGallery((prev) => {
      const without = prev.filter((g) => g.id !== id);
      return previousMain ? [previousMain, ...without] : without;
    });
  }

  async function onSubmit(values: FormOutput) {
    setSubmitError("");
    try {
      const input: ProductInput = { ...values, gallery: gallery.map((g) => g.id), image: imageId };
      if (product) await updateProduct(product.id, input);
      else await createProduct(input);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  const saveDisabled = isSubmitting || uploading || !isValid;
  const saveLabel = product ? "Enregistrer" : "Créer le produit";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="sticky top-0 z-30 -mx-6 -mt-6 flex items-center justify-between gap-4 border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900">
            {product ? "Modifier le produit" : duplicateOf ? "Dupliquer un produit" : "Ajouter un produit"}
          </h1>
          {submitError ? (
            <p className="mt-0.5 truncate text-xs text-red-600">{submitError}</p>
          ) : product ? (
            <p className="mt-0.5 truncate text-xs text-gray-500">{product.name}</p>
          ) : duplicateOf ? (
            // Names the source so the operator can tell at a glance that this
            // is a copy and not the original they clicked from.
            <p className="mt-0.5 truncate text-xs text-gray-500">
              Copie de « {duplicateOf.name} » — SKU, code-barres et stock à renseigner.
            </p>
          ) : null}
        </div>
        <div className="flex flex-none items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
            Annuler
          </Button>
          <Button type="submit" disabled={saveDisabled}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — what the operator authors: identity, variants,
            media. These are the tall, free-form blocks. */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Nom du produit</label>
                <Input {...register("name")} placeholder="Ex. Effaclar Gel Moussant Purifiant" />
                {showError("name") && errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Marque</label>
                  <select
                    {...register("brand")}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">—</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {showError("brand") && errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Catégorie</label>
                  <select
                    {...register("category")}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">—</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {showError("category") && errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  {...register("description")}
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                {showError("description") && errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Variantes</div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Facultatif — sans variante, le produit utilise son propre prix/stock/SKU ci-dessus comme variante unique.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register("hasVariants")} className="h-4 w-4 rounded border-gray-300" />
                Ce produit possède plusieurs variantes
              </label>

              {hasVariants && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Type de variante</label>
                    <select
                      {...register("variantOptionType")}
                      className="h-9 w-56 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    >
                      {VARIANT_OPTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors.variants?.message && <p className="text-xs text-red-600">{errors.variants.message}</p>}

                  <div className="flex flex-col gap-3">
                    {variantsArray.fields.map((field, index) => {
                      const preview = variantImagePreview(field.id, index);
                      const rowUploading = variantImages[field.id]?.uploading;
                      const rowErrors = errors.variants?.[index];
                      return (
                        <div key={field.id} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                          <div className="flex flex-none flex-col items-center gap-1">
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                              {preview && <Image src={preview} alt="" fill className="object-cover" />}
                            </div>
                            <label className="cursor-pointer text-center text-[10px] font-medium text-violet-700 hover:underline">
                              {rowUploading ? "…" : "Image"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleVariantImageChange(e, index, field.id)}
                                disabled={rowUploading}
                              />
                            </label>
                          </div>

                          <div className="flex-1">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Valeur</label>
                                <Input {...register(`variants.${index}.optionValue`)} placeholder="50 ml" />
                                {rowErrors?.optionValue && <p className="mt-1 text-xs text-red-600">{rowErrors.optionValue.message}</p>}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">SKU</label>
                                <Input {...register(`variants.${index}.sku`)} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Code-barres</label>
                                <Input {...register(`variants.${index}.barcode`)} />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Prix (MAD)</label>
                                <Input type="number" step="0.01" {...register(`variants.${index}.price`)} />
                                {rowErrors?.price && <p className="mt-1 text-xs text-red-600">{rowErrors.price.message}</p>}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Ancien prix</label>
                                <Input type="number" step="0.01" {...register(`variants.${index}.oldPrice`)} />
                              </div>
                              <label className="flex items-end gap-2 pb-2 text-xs text-gray-700">
                                <input type="checkbox" {...register(`variants.${index}.active`)} className="h-4 w-4 rounded border-gray-300" />
                                Actif
                              </label>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Stock</label>
                                <Input type="number" {...register(`variants.${index}.stock`)} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Réservé</label>
                                <Input type="number" {...register(`variants.${index}.reservedStock`)} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Seuil stock faible</label>
                                <Input type="number" {...register(`variants.${index}.lowStockThreshold`)} />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => variantsArray.remove(index)}
                            aria-label="Supprimer cette variante"
                            className="flex-none text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      variantsArray.append({
                        active: true,
                        barcode: "",
                        lowStockThreshold: 5,
                        optionValue: "",
                        price: 0,
                        reservedStock: 0,
                        sku: "",
                        stock: 0,
                      })
                    }
                    className="flex items-center justify-center gap-1 self-start rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une variante
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-900">Images</div>

              {/* Capped width: a full-column aspect-square grew with the
                  viewport — 891px tall at 1440px — and single-handedly made
                  this the longest card on the page. The main image only needs
                  to be recognisable, not life-size. */}
              <div className="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-xl bg-gray-100">
                {imagePreview && <Image src={imagePreview} alt="" fill className="object-cover" />}
                {imagePreview && (
                  <span className="absolute left-2 top-2 rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Principale
                  </span>
                )}
              </div>

              {gallery.length > 0 && (
                <ul className="grid grid-cols-3 gap-2">
                  {gallery.map((g, i) => (
                    <li key={g.id} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image src={g.url} alt="" fill sizes="120px" className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/55 py-0.5">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(i, -1)}
                          disabled={i === 0}
                          aria-label="Déplacer avant"
                          className="px-1 text-xs text-white disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => promoteToMain(g.id)}
                          aria-label="Définir comme image principale"
                          title="Définir comme principale"
                          className="px-1 text-xs text-white"
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(i, 1)}
                          disabled={i === gallery.length - 1}
                          aria-label="Déplacer après"
                          className="px-1 text-xs text-white disabled:opacity-30"
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(g.id)}
                          aria-label="Retirer cette image"
                          className="px-1 text-xs text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-600 hover:border-violet-300 hover:text-violet-700">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Envoi en cours…" : imageId ? "Ajouter des images" : "Choisir des images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500">
                Sélection multiple possible. La première image devient l&apos;image principale ; les suivantes
                alimentent la galerie de la fiche produit.
              </p>
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — the decisions: publish, price, stock, badges, and a
            live preview. Sticky, so the operator keeps the commercial
            summary in view while scrolling a long variant table. */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Prix (MAD)</label>
                  <Input type="number" step="0.01" {...register("price")} />
                  {showError("price") && errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Ancien prix</label>
                  <Input type="number" step="0.01" {...register("oldPrice")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Contenance</label>
                  <Input {...register("size")} placeholder="400 ml" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...register("isPublished")} className="h-4 w-4 rounded border-gray-300" />
                  Publié sur le site
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="text-sm font-medium text-gray-900">Stock</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">SKU</label>
                  <Input {...register("sku")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Code-barres</label>
                  <Input {...register("barcode")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Seuil stock faible</label>
                  <Input type="number" {...register("lowStockThreshold")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Stock</label>
                  <Input type="number" {...register("stock")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Réservé</label>
                  <Input type="number" {...register("reservedStock")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Badges</div>
                  <p className="mt-0.5 text-xs text-gray-500">Pastilles affichées en haut à gauche de la carte produit — {MAX_BADGES} maximum, empilées dans cet ordre.</p>
                </div>
                {badgesArray.fields.length < MAX_BADGES && (
                  <button
                    type="button"
                    onClick={() => badgesArray.append({ enabled: true, type: "top", text: "", bgColor: "", textColor: "" })}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un badge
                  </button>
                )}
              </div>

              {errors.badges?.message && <p className="text-xs text-red-600">{errors.badges.message}</p>}

              {badgesArray.fields.map((field, index) => {
                const type = watch(`badges.${index}.type`) || "top";
                return (
                  <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input type="checkbox" {...register(`badges.${index}.enabled`)} className="h-4 w-4 rounded border-gray-300" />
                        Actif
                      </label>
                      <button type="button" onClick={() => badgesArray.remove(index)} aria-label="Supprimer ce badge" className="text-gray-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Type</label>
                        <select
                          {...register(`badges.${index}.type`)}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        >
                          {BADGE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Texte</label>
                        <Input
                          {...register(`badges.${index}.text`)}
                          placeholder={type === "custom" ? "Texte requis" : BADGE_TYPE_DEFAULT_LABEL[type] || ""}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Couleur du fond</label>
                        <div className="flex items-center gap-2">
                          <input type="color" {...register(`badges.${index}.bgColor`)} className="h-9 w-10 flex-none cursor-pointer rounded border border-gray-200 bg-white p-0.5" />
                          <Input {...register(`badges.${index}.bgColor`)} placeholder="Défaut du thème" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Couleur du texte</label>
                        <div className="flex items-center gap-2">
                          <input type="color" {...register(`badges.${index}.textColor`)} className="h-9 w-10 flex-none cursor-pointer rounded border border-gray-200 bg-white p-0.5" />
                          <Input {...register(`badges.${index}.textColor`)} placeholder="Défaut du thème" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <ProductPreview
                badges={previewBadges}
                brand={previewBrandName}
                imageUrl={imagePreview || undefined}
                name={watch("name") || ""}
                oldPrice={Number(watch("oldPrice")) || undefined}
                price={Number(watch("price")) || 0}
                size={watch("size") || ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
          Annuler
        </Button>
        <Button type="submit" disabled={saveDisabled}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>
    </form>
  );
}
