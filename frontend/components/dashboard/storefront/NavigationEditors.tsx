"use client";

import { ArrayField } from "@/components/dashboard/storefront/ArrayField";
import { CheckboxField, EditorHeading, FieldGroup, SelectField, TextField } from "@/components/dashboard/storefront/FieldKit";
import { NavLinkStyleFields } from "@/components/dashboard/storefront/NavLinkStyleFields";
import { ImagePicker } from "@/components/dashboard/storefront/ImagePicker";
import {
  MEGA_LINK_TYPES,
  NAV_BADGE_COLORS,
  NAV_COLLECTION_ROUTES,
  NAV_LINK_TYPES,
  NAV_PAGE_ROUTES,
  type NavItemDraft,
  type NavLinkDraft,
  type NavMegaColumnDraft,
} from "@/lib/dashboard/storefront-mapping";

type CategoryOption = { id: number; name: string };
type BrandOption = { id: number; name: string; slug: string };

const MAX_MEGA_COLUMNS = 5;

/** Destination fields shared by a top-level nav item and a mega-menu link —
 * only the fields matching the current `type` are shown, so picking "Page"
 * never leaves a stale category/brand relationship half-filled. */
function LinkFieldsEditor({
  value,
  onChange,
  linkTypes,
  categories,
  brands,
}: {
  value: NavLinkDraft;
  onChange: (v: NavLinkDraft) => void;
  linkTypes: readonly { label: string; value: string }[];
  categories: CategoryOption[];
  brands: BrandOption[];
}) {
  const update = (patch: Partial<NavLinkDraft>) => onChange({ ...value, ...patch });
  return (
    <>
      <TextField label="Nom affiché" value={value.label} onChange={(label) => update({ label })} />
      <SelectField label="Type de lien" value={value.type} onChange={(type) => update({ type })} options={linkTypes} />
      {value.type === "category" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Catégorie</span>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400"
            value={value.category.id || ""}
            onChange={(e) => {
              const id = Number(e.target.value) || undefined;
              const cat = categories.find((c) => c.id === id);
              update({ category: { id, name: cat?.name || "" } });
            }}
          >
            <option value="">Choisir une catégorie...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {value.type === "brand" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Marque</span>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400"
            value={value.brand.id || ""}
            onChange={(e) => {
              const id = Number(e.target.value) || undefined;
              const brand = brands.find((b) => b.id === id);
              update({ brand: { id, name: brand?.name || "" } });
            }}
          >
            <option value="">Choisir une marque...</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {value.type === "collection" && (
        <SelectField label="Destination" value={value.collectionRoute} onChange={(collectionRoute) => update({ collectionRoute })} options={NAV_COLLECTION_ROUTES} />
      )}
      {value.type === "page" && (
        <SelectField label="Page" value={value.pageRoute} onChange={(pageRoute) => update({ pageRoute })} options={NAV_PAGE_ROUTES} />
      )}
      {value.type === "custom" && <TextField label="URL" value={value.customUrl} onChange={(customUrl) => update({ customUrl })} placeholder="/marques" />}
      <CheckboxField label="Afficher" checked={value.visible} onChange={(visible) => update({ visible })} />
      <NavLinkStyleFields value={value.style} onChange={(style) => update({ style })} compact />
    </>
  );
}

function MegaMenuColumnsEditor({
  columns,
  onChange,
  categories,
  brands,
}: {
  columns: NavMegaColumnDraft[];
  onChange: (v: NavMegaColumnDraft[]) => void;
  categories: CategoryOption[];
  brands: BrandOption[];
}) {
  return (
    <ArrayField<NavMegaColumnDraft>
      items={columns}
      onChange={onChange}
      renderLabel={(c) => c.title || "Nouvelle colonne"}
      itemName="cette colonne"
      addLabel="Ajouter une colonne"
      onAdd={columns.length < MAX_MEGA_COLUMNS ? () => ({ title: "", links: [] }) : undefined}
      renderItem={(col, _i, updateCol) => (
        <FieldGroup>
          <TextField label="Titre de la colonne" value={col.title} onChange={(title) => updateCol({ title })} />
          <div className="mt-1 border-t border-gray-100 pt-3">
            <span className="mb-2 block text-xs font-medium text-gray-600">Liens</span>
            <ArrayField<NavLinkDraft>
              items={col.links}
              onChange={(links) => updateCol({ links })}
              renderLabel={(l) => l.label || "Nouveau lien"}
              itemName="ce lien"
              addLabel="Ajouter un lien"
              onAdd={() => ({ label: "", visible: true, type: "custom", category: { name: "" }, brand: { name: "" }, collectionRoute: "", pageRoute: "", customUrl: "" })}
              renderItem={(link, _j, updateLink) => (
                <FieldGroup>
                  <LinkFieldsEditor value={link} onChange={updateLink} linkTypes={MEGA_LINK_TYPES} categories={categories} brands={brands} />
                </FieldGroup>
              )}
            />
          </div>
        </FieldGroup>
      )}
    />
  );
}

export function NavigationItemEditor({
  value,
  onChange,
  categories,
  brands,
}: {
  value: NavItemDraft;
  onChange: (v: NavItemDraft) => void;
  categories: CategoryOption[];
  brands: BrandOption[];
}) {
  const update = (patch: Partial<NavItemDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <EditorHeading title="Lien de navigation" />
        <FieldGroup>
          <LinkFieldsEditor value={value} onChange={(v) => update(v)} linkTypes={NAV_LINK_TYPES} categories={categories} brands={brands} />
          <TextField label="Badge (optionnel)" value={value.badgeLabel} onChange={(badgeLabel) => update({ badgeLabel })} placeholder="Nouveau" />
          {value.badgeLabel && (
            <SelectField label="Couleur du badge" value={value.badgeColor} onChange={(badgeColor) => update({ badgeColor })} options={NAV_BADGE_COLORS} />
          )}
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <CheckboxField label="Activer le mega menu" checked={value.megaMenuEnabled} onChange={(megaMenuEnabled) => update({ megaMenuEnabled })} />
      </div>

      {value.megaMenuEnabled && (
        <>
          <div>
            <EditorHeading title="Mega menu" description="Colonnes de liens affichées au survol de ce lien." />
            <FieldGroup>
              <TextField label="Sous-titre (optionnel)" value={value.megaMenuSubtitle} onChange={(megaMenuSubtitle) => update({ megaMenuSubtitle })} />
            </FieldGroup>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <EditorHeading title="Colonnes" description={`${MAX_MEGA_COLUMNS} maximum.`} />
            <MegaMenuColumnsEditor columns={value.megaMenuColumns} onChange={(megaMenuColumns) => update({ megaMenuColumns })} categories={categories} brands={brands} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <EditorHeading title="Tuile promotionnelle" description="Optionnelle — laissez le titre vide pour la masquer." />
            <FieldGroup>
              <ImagePicker
                label="Image"
                imageId={value.megaMenuPromo.image.id}
                imageUrl={value.megaMenuPromo.image.url}
                onChange={(id, url) => update({ megaMenuPromo: { ...value.megaMenuPromo, image: { id, url } } })}
              />
              <TextField label="Titre" value={value.megaMenuPromo.title} onChange={(title) => update({ megaMenuPromo: { ...value.megaMenuPromo, title } })} />
              <TextField
                label="Description"
                value={value.megaMenuPromo.description}
                onChange={(description) => update({ megaMenuPromo: { ...value.megaMenuPromo, description } })}
              />
              <TextField label="Texte du CTA" value={value.megaMenuPromo.ctaLabel} onChange={(ctaLabel) => update({ megaMenuPromo: { ...value.megaMenuPromo, ctaLabel } })} />
              <TextField label="Lien du CTA" value={value.megaMenuPromo.ctaUrl} onChange={(ctaUrl) => update({ megaMenuPromo: { ...value.megaMenuPromo, ctaUrl } })} />
            </FieldGroup>
          </div>
        </>
      )}
    </div>
  );
}
