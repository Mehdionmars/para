"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Boxes,
  Circle,
  CircleCheck,
  FileText,
  ImagePlus,
  Layers,
  Loader2,
  type LucideIcon,
  Plus,
  Sparkles,
  Tag,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createProduct, updateProduct, type ProductInput } from "@/app/dashboard/(app)/products/actions";
import { ProductPreview } from "@/components/dashboard/products/ProductPreview";
import { RoutinePicker } from "@/components/dashboard/products/RoutinePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveToast } from "@/components/ui/toast-save";
import {
  BADGE_TYPE_DEFAULT_LABEL,
  BADGE_TYPES,
  CATEGORY_OPTIONS,
  VARIANT_OPTION_TYPES,
  type BadgeType,
  type Brand,
  type Product,
  type RoutinePick,
  type VariantOptionType,
} from "@/lib/dashboard/products-types";
import { mediaSrc } from "@/lib/mediaSrc";

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

/**
 * The stored image, as something a browser can actually load.
 *
 * Through mediaSrc for the same reason ProductsTable does it: Payload serves
 * its own uploads from /api/media/file/<name>, a path on the CMS origin, so
 * the raw value 404s against the dashboard. This feeds both the main preview
 * and the gallery thumbnails, which is why an existing product opened for
 * editing showed empty frames where its photos should be.
 */
function imageUrl(image: Product["image"]) {
  return typeof image === "object" && image ? mediaSrc(image.url) : "";
}

export function ProductForm({
  brands,
  product,
  duplicateOf,
  routinePicks = [],
}: {
  brands: Brand[];
  /** Saved "Complétez votre routine" picks, already hydrated, in order. */
  routinePicks?: RoutinePick[];
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
  const [picks, setPicks] = useState<RoutinePick[]>(routinePicks);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [variantImages, setVariantImages] = useState<Record<string, { preview?: string; uploading?: boolean }>>({});
  // The photos and routine are kept outside react-hook-form; their opening
  // values, so the save pill knows when they changed and can put them back.
  const [initialMedia] = useState(() => ({ gallery, imageId, imagePreview, picks }));

  const {
    register,
    control,
    watch,
    trigger,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isSubmitted, isValid, touchedFields },
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
      const input: ProductInput = { ...values, gallery: gallery.map((g) => g.id),
        image: imageId,
        relatedProducts: picks.map((p) => p.id),
      };
      if (product) await updateProduct(product.id, input);
      else await createProduct(input);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  const saveDisabled = isSubmitting || uploading || !isValid;
  const mediaDirty =
    imageId !== initialMedia.imageId ||
    JSON.stringify(gallery) !== JSON.stringify(initialMedia.gallery) ||
    JSON.stringify(picks.map((p) => p.id)) !== JSON.stringify(initialMedia.picks.map((p) => p.id));
  const formDirty = isDirty || mediaDirty;

  function resetAll() {
    reset();
    setImageId(initialMedia.imageId);
    setImagePreview(initialMedia.imagePreview);
    setGallery(initialMedia.gallery);
    setPicks(initialMedia.picks);
    setVariantImages({});
    setSubmitError("");
  }
  const saveLabel = product ? "Enregistrer" : "Créer le produit";

  // What is still missing before the product can be created, in the order
  // the form asks for it. The save button is disabled until the list is
  // empty; it used to stay grey with no word on why.
  const watchedName = watch("name") || "";
  const watchedDescription = watch("description") || "";
  const checklist = [
    { done: watchedName.trim().length >= 2, label: "Nom du produit" },
    { done: Number(watch("brand")) > 0, label: "Marque" },
    { done: !!watch("category"), label: "Catégorie" },
    { done: watchedDescription.trim().length >= 10, label: "Description (10 caractères min.)" },
    { done: Number(watch("price")) > 0, label: "Prix" },
    { done: !!imagePreview, label: "Photo principale (conseillé)", optional: true },
  ];
  const missing = checklist.filter((c) => !c.done && !c.optional).length;
  const price = Number(watch("price")) || 0;
  const oldPrice = Number(watch("oldPrice")) || 0;
  const discount = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
  const published = watch("isPublished");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Parks under the shell's 56px bar (top-14, z below its z-20) and
          bleeds to the page edges by exactly the shell's gutter: 16px on a
          phone, 24px from `sm`, 32px from `xl`. The window scrolls, so this
          now actually sticks — the old shell's overflow-y-auto wrapper had
          made it a scroll container that never scrolled. */}
      <div className="sticky top-14 z-10 -mx-4 -mt-5 flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6 xl:-mx-8 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            aria-label="Retour aux produits"
            className="flex size-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">
              {product ? "Modifier le produit" : duplicateOf ? "Dupliquer un produit" : "Nouveau produit"}
            </h1>
            {submitError ? (
              <p className="mt-0.5 truncate text-xs text-destructive">{submitError}</p>
            ) : product ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.name}</p>
            ) : duplicateOf ? (
              // Names the source so the operator can tell at a glance that this
              // is a copy and not the original they clicked from.
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Copie de « {duplicateOf.name} » — SKU, code-barres et stock à renseigner.
              </p>
            ) : (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {missing > 0 ? `${missing} champ${missing > 1 ? "s" : ""} à remplir avant de créer` : "Prêt à être créé"}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/products")}>
            Annuler
          </Button>
          <Button type="submit" disabled={saveDisabled}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section step={1} icon={FileText} title="Informations" description="Ce que le client lit en premier sur la fiche.">
            <Field label="Nom du produit" error={showError("name") ? errors.name?.message : undefined}>
              <Input {...register("name")} placeholder="Ex. Effaclar Gel Moussant Purifiant" className="h-11 text-base" />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Marque" error={showError("brand") ? errors.brand?.message : undefined}>
                <select {...register("brand")} className={SELECT}>
                  <option value="">Choisir…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Catégorie" error={showError("category") ? errors.category?.message : undefined}>
                <select {...register("category")} className={SELECT}>
                  <option value="">Choisir…</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Contenance" hint="Ex. 400 ml, 50 g">
                <Input {...register("size")} placeholder="400 ml" />
              </Field>
            </div>

            <Field
              label="Description"
              hint={`${watchedDescription.trim().length} caractères`}
              error={showError("description") ? errors.description?.message : undefined}
            >
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Bienfaits, type de peau, mode d'utilisation…"
                className="w-full resize-y rounded-lg border border-input bg-card p-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </Field>
          </Section>

          <Section step={2} icon={ImagePlus} title="Photos" description="La première est l'image principale ; les suivantes forment la galerie de la fiche.">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative aspect-square w-full flex-none overflow-hidden rounded-xl border border-border bg-muted sm:w-36">
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="" fill className="object-contain p-2" />
                    <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Principale
                    </span>
                  </>
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                    <ImagePlus className="size-7" aria-hidden="true" />
                    Aucune photo
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <label
                  className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-center text-sm transition-colors ${
                    uploading ? "border-primary/40 bg-primary/5 text-primary" : "border-input text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                  <span className="font-medium">{uploading ? "Envoi en cours…" : imageId ? "Ajouter des photos" : "Choisir des photos"}</span>
                  <span className="text-xs">PNG ou JPG, plusieurs à la fois</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={uploading} />
                </label>
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

                {gallery.length > 0 && (
                  <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {gallery.map((g, i) => (
                      <li key={g.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                        <Image src={g.url} alt="" fill sizes="120px" className="object-contain p-1" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/60 py-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} aria-label="Déplacer avant" className="px-1 text-xs text-white disabled:opacity-30">
                            ←
                          </button>
                          <button type="button" onClick={() => promoteToMain(g.id)} aria-label="Définir comme image principale" title="Définir comme principale" className="px-1 text-xs text-white">
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
                          <button type="button" onClick={() => removeGalleryImage(g.id)} aria-label="Retirer cette image" className="px-1 text-xs text-white">
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Section step={3} icon={Wallet} title="Prix">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix de vente" error={showError("price") ? errors.price?.message : undefined}>
                  <Suffix unit="MAD">
                    <Input type="number" step="0.01" min="0" {...register("price")} placeholder="0" className="pr-12" />
                  </Suffix>
                </Field>
                <Field label="Ancien prix" hint="Pour afficher une promotion">
                  <Suffix unit="MAD">
                    <Input type="number" step="0.01" min="0" {...register("oldPrice")} placeholder="—" className="pr-12" />
                  </Suffix>
                </Field>
              </div>
              {discount > 0 && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive-strong">
                  Promotion affichée : −{discount} % (au lieu de {oldPrice} MAD)
                </p>
              )}
            </Section>

            <Section step={4} icon={Boxes} title="Stock">
              <div className="grid grid-cols-3 gap-3">
                <Field label="En stock">
                  <Input type="number" min="0" {...register("stock")} />
                </Field>
                <Field label="Réservé">
                  <Input type="number" min="0" {...register("reservedStock")} />
                </Field>
                <Field label="Alerte sous">
                  <Input type="number" min="0" {...register("lowStockThreshold")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU">
                  <Input {...register("sku")} placeholder="Réf. interne" />
                </Field>
                <Field label="Code-barres">
                  <Input {...register("barcode")} placeholder="EAN" />
                </Field>
              </div>
            </Section>
          </div>

          <Section
            step={5}
            icon={Layers}
            title="Variantes"
            description="Facultatif. Sans variante, le produit utilise son propre prix, stock et SKU ci-dessus."
            action={
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <span>Plusieurs variantes</span>
                <span className="relative inline-flex h-5 w-9 flex-none items-center">
                  <input type="checkbox" {...register("hasVariants")} className="peer sr-only" />
                  <span className="absolute inset-0 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                  <span className="relative ml-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
            }
          >
            {hasVariants && (
              <>
                <Field label="Type de variante">
                  <select {...register("variantOptionType")} className={`${SELECT} sm:w-56`}>
                    {VARIANT_OPTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {errors.variants?.message && <p className="text-xs text-destructive">{errors.variants.message}</p>}

                <div className="flex flex-col gap-3">
                  {variantsArray.fields.map((field, index) => {
                    const preview = variantImagePreview(field.id, index);
                    const rowUploading = variantImages[field.id]?.uploading;
                    const rowErrors = errors.variants?.[index];
                    return (
                      <div key={field.id} className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex flex-none flex-col items-center gap-1">
                          <div className="relative size-16 overflow-hidden rounded-lg border border-border bg-card">
                            {preview && <Image src={preview} alt="" fill className="object-contain p-1" />}
                          </div>
                          <label className="cursor-pointer text-center text-[11px] font-medium text-primary hover:underline">
                            {rowUploading ? "…" : "Photo"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleVariantImageChange(e, index, field.id)}
                              disabled={rowUploading}
                            />
                          </label>
                        </div>

                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                          <Field label="Valeur" error={rowErrors?.optionValue?.message}>
                            <Input {...register(`variants.${index}.optionValue`)} placeholder="50 ml" />
                          </Field>
                          <Field label="Prix" error={rowErrors?.price?.message}>
                            <Suffix unit="MAD">
                              <Input type="number" step="0.01" {...register(`variants.${index}.price`)} className="pr-12" />
                            </Suffix>
                          </Field>
                          <Field label="Ancien prix">
                            <Input type="number" step="0.01" {...register(`variants.${index}.oldPrice`)} />
                          </Field>
                          <Field label="Stock">
                            <Input type="number" {...register(`variants.${index}.stock`)} />
                          </Field>
                          <Field label="SKU">
                            <Input {...register(`variants.${index}.sku`)} />
                          </Field>
                          <Field label="Code-barres">
                            <Input {...register(`variants.${index}.barcode`)} />
                          </Field>
                          <Field label="Réservé">
                            <Input type="number" {...register(`variants.${index}.reservedStock`)} />
                          </Field>
                          <Field label="Alerte sous">
                            <Input type="number" {...register(`variants.${index}.lowStockThreshold`)} />
                          </Field>
                          <label className="col-span-full flex items-center gap-2 text-xs text-foreground">
                            <input type="checkbox" {...register(`variants.${index}.active`)} className="size-4 rounded border-input" />
                            Variante active (vendue sur le site)
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => variantsArray.remove(index)}
                          aria-label="Supprimer cette variante"
                          className="flex size-8 flex-none items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
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
                >
                  <Plus className="size-3.5" /> Ajouter une variante
                </Button>
              </>
            )}
          </Section>

          <Section
            step={6}
            icon={Tag}
            title="Badges"
            description={`Pastilles en haut à gauche de la carte produit — ${MAX_BADGES} maximum, dans cet ordre.`}
            action={
              badgesArray.fields.length < MAX_BADGES && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => badgesArray.append({ enabled: true, type: "top", text: "", bgColor: "", textColor: "" })}
                >
                  <Plus className="size-3.5" /> Ajouter
                </Button>
              )
            }
          >
            {errors.badges?.message && <p className="text-xs text-destructive">{errors.badges.message}</p>}
            {badgesArray.fields.length === 0 && <p className="text-sm text-muted-foreground">Aucun badge. « Nouveauté », « Promo » ou un texte libre.</p>}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {badgesArray.fields.map((field, index) => {
                const type = watch(`badges.${index}.type`) || "top";
                return (
                  <div key={field.id} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <input type="checkbox" {...register(`badges.${index}.enabled`)} className="size-4 rounded border-input" />
                        Badge {index + 1} actif
                      </label>
                      <button
                        type="button"
                        onClick={() => badgesArray.remove(index)}
                        aria-label="Supprimer ce badge"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Type">
                        <select {...register(`badges.${index}.type`)} className={SELECT}>
                          {BADGE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Texte">
                        <Input {...register(`badges.${index}.text`)} placeholder={type === "custom" ? "Texte requis" : BADGE_TYPE_DEFAULT_LABEL[type] || ""} />
                      </Field>
                      <Field label="Fond">
                        <div className="flex items-center gap-2">
                          <input type="color" {...register(`badges.${index}.bgColor`)} className="h-10 w-10 flex-none cursor-pointer rounded-lg border border-border bg-card p-0.5" />
                          <Input {...register(`badges.${index}.bgColor`)} placeholder="Thème" />
                        </div>
                      </Field>
                      <Field label="Texte (couleur)">
                        <div className="flex items-center gap-2">
                          <input type="color" {...register(`badges.${index}.textColor`)} className="h-10 w-10 flex-none cursor-pointer rounded-lg border border-border bg-card p-0.5" />
                          <Input {...register(`badges.${index}.textColor`)} placeholder="Thème" />
                        </div>
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            step={7}
            icon={Sparkles}
            title="Complétez votre routine"
            description="Jusqu'à 2 produits proposés avec celui-ci sur sa fiche. Glissez pour l'ordre ; s'il en manque, la même sous-catégorie complète."
          >
            <RoutinePicker
              hideHeading
              picks={picks}
              onChange={setPicks}
              brands={brands}
              selfId={product?.id}
              currentBrand={Number(watch("brand")) || undefined}
              currentCategory={watch("category") || undefined}
            />
          </Section>
        </div>

        {/* The decisions and the result, kept in view while the long left
            column scrolls: publication, what is missing, the card itself. */}
        {/* top-14, measured from the scroller's padding edge: it lands just
            under the sticky bar and level with the first card. top-20
            pushed the column 20px below the left one. */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-foreground">{published ? "Publié sur le site" : "Brouillon"}</span>
                <span className="block text-xs text-muted-foreground">
                  {published ? "Visible par les clients dès l'enregistrement." : "Invisible sur le site tant qu'il n'est pas publié."}
                </span>
              </span>
              <span className="relative inline-flex h-6 w-11 flex-none items-center">
                <input type="checkbox" {...register("isPublished")} className="peer sr-only" />
                <span className="absolute inset-0 rounded-full bg-input transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                <span className="relative ml-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          {!product && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <p className="mb-2 text-sm font-semibold text-foreground">
                {missing > 0 ? `Encore ${missing} étape${missing > 1 ? "s" : ""}` : "Tout est prêt"}
              </p>
              <ul className="flex flex-col gap-1.5">
                {checklist.map((c) => (
                  <li key={c.label} className={`flex items-center gap-2 text-sm ${c.done ? "text-muted-foreground" : "text-foreground"}`}>
                    {c.done ? (
                      <CircleCheck className="size-4 flex-none text-success" aria-hidden="true" />
                    ) : (
                      <Circle className={`size-4 flex-none ${c.optional ? "text-muted-foreground/50" : "text-warning"}`} aria-hidden="true" />
                    )}
                    <span className={c.done ? "line-through decoration-muted-foreground/40" : ""}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <ProductPreview
              badges={previewBadges}
              brand={previewBrandName}
              imageUrl={imagePreview || undefined}
              name={watchedName}
              oldPrice={oldPrice || undefined}
              price={price}
              size={watch("size") || ""}
            />
          </div>
        </aside>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/products")}>
          Annuler
        </Button>
        <Button type="submit" disabled={saveDisabled}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>

      <SaveToast
        state={isSubmitting ? "saving" : submitError ? "error" : formDirty ? "dirty" : "idle"}
        errorMessage={submitError}
        message={!product && missing > 0 ? `Nouveau produit · encore ${missing} champ${missing > 1 ? "s" : ""}` : undefined}
        onReset={resetAll}
        onSave={() => void handleSubmit(onSubmit)()}
        saveLabel={saveLabel}
      />
    </form>
  );
}

const SELECT =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/** A numbered block of the form: icon, title, a line of help, an optional
 * control on the right, then the fields. */
function Section({
  step,
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-xs">
      <header className="flex items-center justify-between gap-4 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              <span className="mr-1.5 text-muted-foreground tabular-nums">{step}.</span>
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="flex-none">{action}</div>}
      </header>
      {children && <div className="flex flex-col gap-3 px-4 pt-3 pb-4">{children}</div>}
    </section>
  );
}

/** A label over its control, with a hint or an error under it. A real
 * <label>, so the control inside is named by it. */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/** A unit drawn inside the right edge of an input ("MAD"). */
function Suffix({ unit, children }: { unit: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">{unit}</span>
    </div>
  );
}
