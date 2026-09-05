"use client";

import { ArrayField } from "@/components/dashboard/storefront/ArrayField";
import { CheckboxField, ColorField, DateField, EditorHeading, FieldGroup, NumberField, SelectField, TextAreaField, TextField } from "@/components/dashboard/storefront/FieldKit";
import { ImagePicker } from "@/components/dashboard/storefront/ImagePicker";
import { LinkPicker } from "@/components/dashboard/storefront/LinkPicker";
import { ProductPicker } from "@/components/dashboard/storefront/ProductPicker";
import {
  CARD_CTA_ALIGN_OPTIONS,
  CARD_IMAGE_FRAMING_OPTIONS,
  toCtaAlign,
  toImageFraming,
} from "@/lib/storefront/cardLayout";
import {
  CATEGORY_OPTIONS,
  COFFRETS_LAYOUTS,
  RAIL_BADGE_STYLES,
  RAIL_PRODUCT_SOURCES,
  RAIL_SORT_ORDERS,
  SERVICE_ICONS,
  SUMMER_EDIT_ANIMATION_SPEEDS,
  SUMMER_EDIT_HIGHLIGHT_ICONS,
  SUMMER_EDIT_IMAGE_POSITIONS,
  TRUST_ICONS,
  type BrandFeaturedItem,
  type CampaignCopy,
  type Coffret,
  type CoffretsCopy,
  type CtaTile,
  type CtaBannerCopyDraft,
  type DermoCornerCopy,
  type DermoPick,
  type HeroSlide,
  type ImageCarouselCopy,
  type Instagram,
  type MarketingBanner,
  type MarketingBannerImageMode,
  MARKETING_BANNER_IMAGE_MODES,
  type NewsletterCopy,
  type ProductRef,
  type PromotionsGridCopy,
  type Rail,
  type ServiceCard,
  type SummerEditActDraft,
  type SummerEditCopyDraft,
  type TrustBadge,
} from "@/lib/dashboard/storefront-mapping";

// ---- Hero ---------------------------------------------------------------

export function HeroSlidesEditor({
  value,
  onChange,
  brands,
}: {
  value: HeroSlide[];
  onChange: (v: HeroSlide[]) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  return (
    <>
      <EditorHeading title="Bannière hero" description="Diapositives affichées en haut de la page d'accueil." />
      <ArrayField<HeroSlide>
        items={value}
        onChange={onChange}
        renderLabel={(s) => s.title || "Nouvelle diapositive"}
        itemName="cette diapositive"
        addLabel="Ajouter une diapositive"
        onAdd={() => ({
          active: true,
          tag: "",
          title: "Nouveau titre",
          sub: "",
          cta: "Découvrir",
          ctaUrl: "/catalogue",
          secondaryCta: "",
          secondaryCtaUrl: "",
          align: "right",
          overlay: true,
          bg: "",
          image: { url: "" },
          mobileImage: { url: "" },
        })}
        renderItem={(s, _i, update) => (
          <FieldGroup>
            <CheckboxField label="Diapositive active" checked={s.active} onChange={(active) => update({ active })} />
            <ImagePicker label="Image (desktop)" imageId={s.image.id} imageUrl={s.image.url} onChange={(id, url) => update({ image: { id, url } })} />
            <ImagePicker
              label="Image (mobile, optionnelle)"
              imageId={s.mobileImage.id}
              imageUrl={s.mobileImage.url}
              onChange={(id, url) => update({ mobileImage: { id, url } })}
            />
            <TextField label="Étiquette (eyebrow)" value={s.tag} onChange={(tag) => update({ tag })} />
            <TextField label="Titre" value={s.title} onChange={(title) => update({ title })} />
            <TextAreaField label="Sous-titre" value={s.sub} onChange={(sub) => update({ sub })} />
            <TextField label="Texte du bouton" value={s.cta} onChange={(cta) => update({ cta })} />
            <LinkPicker label="Lien du bouton" value={s.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} brands={brands} />
            <TextField label="Bouton secondaire (texte, optionnel)" value={s.secondaryCta} onChange={(secondaryCta) => update({ secondaryCta })} />
            {s.secondaryCta && (
              <LinkPicker label="Lien du bouton secondaire" value={s.secondaryCtaUrl} onChange={(secondaryCtaUrl) => update({ secondaryCtaUrl })} brands={brands} />
            )}
            <SelectField
              label="Alignement du texte"
              value={s.align}
              onChange={(align) => update({ align: align as HeroSlide["align"] })}
              options={[{ label: "Droite", value: "right" }, { label: "Gauche", value: "left" }]}
            />
            <CheckboxField label="Voile sombre sur l'image (lisibilité du texte)" checked={s.overlay} onChange={(overlay) => update({ overlay })} />
            <TextField label="Fond (dégradé CSS)" value={s.bg} onChange={(bg) => update({ bg })} placeholder="linear-gradient(...)" />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Marketing banners (seasonal campaigns, e.g. "Saison été", "Black Friday") ------------

export function MarketingBannersEditor({ value, onChange }: { value: MarketingBanner[]; onChange: (v: MarketingBanner[]) => void }) {
  return (
    <>
      <EditorHeading
        title="Bannières marketing"
        description="Une fiche par campagne (été, Black Friday, Noël...) — seule la première campagne Active et dans sa période d'affichage apparaît sur la page d'accueil. Les autres restent prêtes, sans avoir à toucher au code pour changer de saison."
      />
      <ArrayField<MarketingBanner>
        items={value}
        onChange={onChange}
        renderLabel={(b) => `${b.active ? "🟢" : "⚪"} ${b.campaign || "Nouvelle campagne"}`}
        itemName="cette bannière"
        addLabel="Ajouter une campagne"
        onAdd={() => ({
          campaign: "",
          image: { url: "" },
          imageMobile: { url: "" },
          imageMode: "overlay",
          eyebrow: "",
          title: "",
          description: "",
          ctaLabel: "",
          ctaUrl: "/catalogue",
          ctaAlign: "left",
          imageFraming: "center",
          badgeLabel: "",
          active: true,
          startDate: "",
          endDate: "",
        })}
        renderItem={(b, _, update) => (
          <FieldGroup>
            <TextField label="Campagne (identifiant interne)" value={b.campaign} onChange={(campaign) => update({ campaign })} placeholder="summer-2026" />
            <CheckboxField label="Active" checked={b.active} onChange={(active) => update({ active })} />
            <SelectField
              label="Mode d'affichage"
              value={b.imageMode}
              onChange={(imageMode) => update({ imageMode: imageMode as MarketingBannerImageMode })}
              options={MARKETING_BANNER_IMAGE_MODES}
            />
            <ImagePicker label="Image desktop" imageId={b.image.id} imageUrl={b.image.url} onChange={(id, url) => update({ image: { id, url } })} />
            <ImagePicker
              label="Image mobile (optionnel — sinon l'image desktop est réutilisée)"
              imageId={b.imageMobile.id}
              imageUrl={b.imageMobile.url}
              onChange={(id, url) => update({ imageMobile: { id, url } })}
            />
            {b.imageMode !== "imageOnly" && (
              <>
                <TextField label="Eyebrow" value={b.eyebrow} onChange={(eyebrow) => update({ eyebrow })} placeholder="SAISON ÉTÉ" />
                <TextField label="Titre" value={b.title} onChange={(title) => update({ title })} />
                <TextAreaField label="Description" value={b.description} onChange={(description) => update({ description })} />
              </>
            )}
            <TextField label="Texte du bouton" value={b.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
            <TextField label="Lien du bouton" value={b.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} placeholder="/catalogue" />
            <div className="grid grid-cols-2 gap-3">
              {b.imageMode !== "imageOnly" && (
                <SelectField
                  label="Position du bouton"
                  value={b.ctaAlign}
                  onChange={(ctaAlign) => update({ ctaAlign: toCtaAlign(ctaAlign) })}
                  options={CARD_CTA_ALIGN_OPTIONS}
                />
              )}
              <SelectField
                label="Cadrage de l'image"
                value={b.imageFraming}
                onChange={(imageFraming) => update({ imageFraming: toImageFraming(imageFraming) })}
                options={CARD_IMAGE_FRAMING_OPTIONS}
              />
            </div>
            <TextField label="Badge promotionnel (optionnel)" value={b.badgeLabel} onChange={(badgeLabel) => update({ badgeLabel })} placeholder="JUSQU'À -30%" />
            <div className="grid grid-cols-2 gap-3">
              <DateField label="Affichage à partir du" value={b.startDate} onChange={(startDate) => update({ startDate })} />
              <DateField label="Affichage jusqu'au" value={b.endDate} onChange={(endDate) => update({ endDate })} />
            </div>
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- CTA pair (reused for ctaPair1 and ctaPair2) ------------------------

export function CtaPairEditor({ title, value, onChange }: { title: string; value: CtaTile[]; onChange: (v: CtaTile[]) => void }) {
  return (
    <>
      <EditorHeading title={title} description="Exactement 2 tuiles côte à côte." />
      <ArrayField<CtaTile>
        items={value}
        onChange={onChange}
        renderLabel={(t) => t.title || "Nouvelle tuile"}
        itemName="cette tuile"
        addLabel="Ajouter une tuile"
        onAdd={() => ({ eyebrow: "", title: "Nouveau titre", bg: "#EFE6F3", image: { url: "" } })}
        renderItem={(t, _i, update) => (
          <FieldGroup>
            <ImagePicker label="Image" imageId={t.image.id} imageUrl={t.image.url} onChange={(id, url) => update({ image: { id, url } })} />
            <TextField label="Eyebrow" value={t.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
            <TextField label="Titre" value={t.title} onChange={(title) => update({ title })} />
            <TextField label="Couleur de fond" value={t.bg} onChange={(bg) => update({ bg })} placeholder="#EFE6F3" />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Rails ----------------------------------------------------------------

/** Field set shared by the single-rail editor below — each of the 4 default
 * rails (essentiels/nouveautés/meilleures ventes/coups de cœur) is now its
 * own independent section in the builder, so there is exactly one rail's
 * fields on screen at a time, not an array-of-rails editor. */
function RailFields({
  rail: r,
  update,
  brands,
}: {
  rail: Rail;
  update: (patch: Partial<Rail>) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  return (
    <FieldGroup>
      <TextField label="Eyebrow" value={r.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
      <TextField label="Titre" value={r.title} onChange={(title) => update({ title })} />
      <TextField label="Sous-titre" value={r.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <SelectField label="Source des produits" value={r.productSource} onChange={(productSource) => update({ productSource })} options={RAIL_PRODUCT_SOURCES} />

      {r.productSource === "manual" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Produits (sélection manuelle)</span>
          <ProductPicker selected={r.products} onChange={(products: ProductRef[]) => update({ products })} />
        </label>
      )}

      {r.productSource === "category" && (
        <SelectField label="Catégorie" value={r.category} onChange={(category) => update({ category })} options={CATEGORY_OPTIONS} />
      )}

      {r.productSource !== "manual" && (
        <SelectField
          label={r.productSource === "brand" ? "Marque" : "Marque (filtre optionnel)"}
          value={r.brandFilter.id ? String(r.brandFilter.id) : ""}
          onChange={(v) => {
            const brand = brands.find((b) => String(b.id) === v);
            update({ brandFilter: brand ? { id: brand.id, name: brand.name } : { name: "" } });
          }}
          options={[{ label: "Aucune", value: "" }, ...brands.map((b) => ({ label: b.name, value: String(b.id) }))]}
        />
      )}

      {!["manual", "bestSelling"].includes(r.productSource) && (
        <SelectField label="Tri" value={r.sortOrder} onChange={(sortOrder) => update({ sortOrder })} options={RAIL_SORT_ORDERS} />
      )}

      <NumberField label="Nombre de produits max" value={r.limit} min={1} max={24} onChange={(limit) => update({ limit })} />
      <TextField label="Texte du CTA" value={r.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
      <TextField label="Lien du CTA" value={r.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} placeholder="/catalogue" />
      <SelectField
        label="Identité éditoriale"
        value={r.badgeStyle}
        onChange={(badgeStyle) => update({ badgeStyle })}
        options={RAIL_BADGE_STYLES}
      />
      <ImagePicker
        label="Image éditoriale (optionnelle — affiche un bloc conseil au-dessus de ce rail)"
        imageId={r.editorialImage.id}
        imageUrl={r.editorialImage.url}
        onChange={(id, url) => update({ editorialImage: { id, url } })}
      />

      {/* Only meaningful once there is a block to write in, and hidden
          otherwise so a rail without one is not five empty boxes longer.
          Each placeholder is the text that renders when the field is left
          blank, so an editor can see what they are replacing. */}
      {!!r.editorialImage.url && (
        <>
          <TextField
            label="Bloc conseil — surtitre"
            value={r.editorialEyebrow}
            onChange={(editorialEyebrow) => update({ editorialEyebrow })}
            placeholder="Expertise pharmaceutique"
          />
          <TextField
            label="Bloc conseil — titre"
            value={r.editorialTitle}
            onChange={(editorialTitle) => update({ editorialTitle })}
            placeholder="Des conseils pensés pour votre peau"
          />
          <TextAreaField
            label="Bloc conseil — description"
            value={r.editorialDescription}
            onChange={(editorialDescription) => update({ editorialDescription })}
            placeholder="Nos pharmaciens vous accompagnent pour choisir les soins adaptés à vos besoins…"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Bloc conseil — bouton"
              value={r.editorialCtaLabel}
              onChange={(editorialCtaLabel) => update({ editorialCtaLabel })}
              placeholder="Découvrir nos conseils"
            />
            <TextField
              label="Bloc conseil — lien"
              value={r.editorialCtaUrl}
              onChange={(editorialCtaUrl) => update({ editorialCtaUrl })}
              placeholder="/catalogue"
            />
          </div>
        </>
      )}
    </FieldGroup>
  );
}

export function SingleRailEditor({
  rail,
  onChange,
  brands,
}: {
  rail: Rail;
  onChange: (v: Rail) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  return (
    <>
      <EditorHeading title={rail.title || "Rail produits"} description="Les produits affichés sont toujours résolus en direct depuis Payload/PostgreSQL — jamais depuis un instantané statique." />
      <RailFields rail={rail} update={(patch) => onChange({ ...rail, ...patch })} brands={brands} />
    </>
  );
}

export function newRail(): Rail {
  return {
    key: `rail-${Date.now()}`,
    eyebrow: "",
    title: "Nouveau rail",
    subtitle: "",
    productSource: "manual",
    products: [],
    category: "",
    brandFilter: { name: "" },
    limit: 8,
    sortOrder: "newest",
    ctaLabel: "Voir tout",
    ctaUrl: "/catalogue",
    badgeStyle: "none",
    editorialImage: { url: "" },
    editorialEyebrow: "",
    editorialTitle: "",
    editorialDescription: "",
    editorialCtaLabel: "",
    editorialCtaUrl: "",
  };
}

// ---- Marques à l'honneur -----------------------------------------------

export function BrandsFeaturedEditor({
  value,
  onChange,
  brands,
}: {
  value: BrandFeaturedItem[];
  onChange: (v: BrandFeaturedItem[]) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  return (
    <>
      <EditorHeading title="Marques à l'honneur" description="Le seul bloc marque consolidé de la page — évite d'avoir deux sections presque identiques." />
      <ArrayField<BrandFeaturedItem>
        items={value}
        onChange={onChange}
        renderLabel={(b) => b.brand.name || "Nouvelle marque"}
        itemName="cette marque"
        addLabel="Ajouter une marque"
        onAdd={() => ({ brand: { name: "" }, phrase: "", image: { url: "" }, ctaLabel: "Découvrir la marque" })}
        renderItem={(b, _i, update) => (
          <FieldGroup>
            <SelectField
              label="Marque"
              value={b.brand.id ? String(b.brand.id) : ""}
              onChange={(v) => {
                const brand = brands.find((br) => String(br.id) === v);
                update({ brand: brand ? { id: brand.id, name: brand.name } : { name: "" } });
              }}
              options={[{ label: "Choisir...", value: "" }, ...brands.map((br) => ({ label: br.name, value: String(br.id) }))]}
            />
            <ImagePicker label="Image" imageId={b.image.id} imageUrl={b.image.url} onChange={(id, url) => update({ image: { id, url } })} />
            <TextField label="Courte phrase" value={b.phrase} onChange={(phrase) => update({ phrase })} />
            <TextField label="Texte du CTA" value={b.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Dermo Corner copy -----------------------------------------------------

// ---- CTA centré ----------------------------------------------------------

export function CtaBannerEditor({ value, onChange }: { value: CtaBannerCopyDraft; onChange: (v: CtaBannerCopyDraft) => void }) {
  const update = (patch: Partial<CtaBannerCopyDraft>) => onChange({ ...value, ...patch });
  return (
    <FieldGroup>
      <EditorHeading
        title="CTA centré"
        description="Un titre, une phrase, un bouton. Le bloc n’a volontairement pas de second bouton : deux choix ralentissent la décision."
      />
      <TextField label="Eyebrow (facultatif)" value={value.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
      <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
      <TextAreaField label="Texte de soutien" value={value.description} onChange={(description) => update({ description })} />
      <TextField label="Texte du bouton" value={value.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
      <TextField label="Lien du bouton" value={value.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} />
      <ColorField label="Fond" value={value.bg} onChange={(bg) => update({ bg })} />
      {/* Both advisories read against the band's own background, which is
          what these two are actually painted on. */}
      <ColorField label="Texte" value={value.textColor} contrastAgainst={value.bg} onChange={(textColor) => update({ textColor })} />
      <ColorField label="Bouton" value={value.ctaColor} contrastAgainst={value.bg} onChange={(ctaColor) => update({ ctaColor })} />
    </FieldGroup>
  );
}

export function DermoCornerCopyEditor({ value, onChange }: { value: DermoCornerCopy; onChange: (v: DermoCornerCopy) => void }) {
  const update = (patch: Partial<DermoCornerCopy>) => onChange({ ...value, ...patch });
  return (
    <FieldGroup>
      <ImagePicker label="Image éditoriale" imageId={value.image.id} imageUrl={value.image.url} onChange={(id, url) => update({ image: { id, url } })} />
      <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
      <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
      <TextAreaField label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField label="Texte du CTA" value={value.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
      <TextField label="Lien du CTA" value={value.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} />
      <TextField label="Titre du carrousel produits (section séparée)" value={value.picksTitle} onChange={(picksTitle) => update({ picksTitle })} />
      <CheckboxField label="Défilement automatique" checked={value.autoplay} onChange={(autoplay) => update({ autoplay })} />
      {value.autoplay && (
        <NumberField label="Vitesse (ms entre chaque avancée)" value={value.autoplaySpeedMs} min={1500} max={10000} onChange={(autoplaySpeedMs) => update({ autoplaySpeedMs })} />
      )}
    </FieldGroup>
  );
}

// ---- Image + carrousel ---------------------------------------------------

export function ImageCarouselEditor({
  copy,
  products,
  onChangeCopy,
  onChangeProducts,
}: {
  copy: ImageCarouselCopy;
  products: ProductRef[];
  onChangeCopy: (v: ImageCarouselCopy) => void;
  onChangeProducts: (v: ProductRef[]) => void;
}) {
  const update = (patch: Partial<ImageCarouselCopy>) => onChangeCopy({ ...copy, ...patch });
  return (
    <>
      <EditorHeading title="Image + carrousel produits" description="Image éditoriale à gauche, carrousel de produits à droite — maximum 8 produits." />
      <FieldGroup>
        <ImagePicker label="Image éditoriale" imageId={copy.image.id} imageUrl={copy.image.url} onChange={(id, url) => update({ image: { id, url } })} />
        <TextField label="Eyebrow" value={copy.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
        <TextField label="Titre" value={copy.title} onChange={(title) => update({ title })} />
        <TextAreaField label="Sous-titre" value={copy.subtitle} onChange={(subtitle) => update({ subtitle })} />
        <TextField label="Texte du CTA" value={copy.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
        <TextField label="Lien du CTA" value={copy.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} placeholder="/catalogue" />
        <TextField label="Titre du carrousel" value={copy.picksTitle} onChange={(picksTitle) => update({ picksTitle })} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Produits affichés (8 maximum)</span>
          <ProductPicker selected={products} onChange={onChangeProducts} max={8} />
        </label>
      </FieldGroup>
    </>
  );
}

// ---- Promotions grid -----------------------------------------------------

export function PromotionsGridEditor({ value, onChange }: { value: PromotionsGridCopy; onChange: (v: PromotionsGridCopy) => void }) {
  const update = (patch: Partial<PromotionsGridCopy>) => onChange({ ...value, ...patch });
  return (
    <>
      <EditorHeading
        title="Grille promotions"
        description="Les produits affichés viennent toujours en direct de Payload, filtrés par onglet catégorie — seuls le titre, le sous-titre et le nombre affiché sont éditables ici."
      />
      <FieldGroup>
        <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
        <TextField label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ subtitle })} />
        <NumberField label="Nombre de produits affichés" value={value.limit} min={2} max={24} onChange={(limit) => update({ limit })} />
      </FieldGroup>
    </>
  );
}

// ---- Coffrets ---------------------------------------------------------------

export function CoffretsCopyEditor({ value, onChange }: { value: CoffretsCopy; onChange: (v: CoffretsCopy) => void }) {
  const update = (patch: Partial<CoffretsCopy>) => onChange({ ...value, ...patch });
  return (
    <FieldGroup>
      <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
      <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
      <TextField label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ subtitle })} />
      <TextField label='Texte du lien "Tous les coffrets"' value={value.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
      <TextField label="Lien" value={value.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} />
      <SelectField
        label="Disposition"
        value={value.layout}
        onChange={(layout) => update({ layout: layout as CoffretsCopy["layout"] })}
        options={COFFRETS_LAYOUTS}
      />
      {value.layout === "carousel" && (
        <>
          <NumberField label="Cartes visibles (desktop)" value={value.visibleDesktop} min={1} max={6} onChange={(visibleDesktop) => update({ visibleDesktop })} />
          <NumberField label="Cartes visibles (mobile)" value={value.visibleMobile} min={1} max={3} onChange={(visibleMobile) => update({ visibleMobile })} />
        </>
      )}
    </FieldGroup>
  );
}

export function CoffretsEditor({ value, onChange }: { value: Coffret[]; onChange: (v: Coffret[]) => void }) {
  return (
    <>
      <EditorHeading title="Coffrets / cartes cadeaux" description="4 à 8 cartes recommandées. Décochez « actif » pour masquer une carte sans la supprimer." />
      <ArrayField<Coffret>
        items={value}
        onChange={onChange}
        renderLabel={(c) => c.title || "Nouveau coffret"}
        itemName="ce coffret"
        addLabel="Ajouter un coffret"
        onAdd={() => ({
          active: true,
          tag: "",
          title: "Nouveau coffret",
          sub: "",
          price: 0,
          priceFrom: false,
          image: { url: "" },
          ctaLabel: "Offrir",
          ctaUrl: "/catalogue",
          toast: "",
        })}
        renderItem={(c, _i, update) => (
          <FieldGroup>
            <CheckboxField label="Actif (visible sur le site)" checked={c.active} onChange={(active) => update({ active })} />
            <ImagePicker label="Image" imageId={c.image.id} imageUrl={c.image.url} onChange={(id, url) => update({ image: { id, url } })} />
            <TextField label="Étiquette" value={c.tag} onChange={(tag) => update({ tag })} />
            <TextField label="Titre" value={c.title} onChange={(title) => update({ title })} />
            <TextAreaField label="Sous-titre" value={c.sub} onChange={(sub) => update({ sub })} />
            <NumberField label="Prix (MAD)" value={c.price} min={0} onChange={(price) => update({ price })} />
            <CheckboxField label='Afficher "à partir de"' checked={c.priceFrom} onChange={(priceFrom) => update({ priceFrom })} />
            <TextField label="Texte du CTA" value={c.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
            <TextField label="Lien du CTA" value={c.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} />
            <TextField label="Message de confirmation" value={c.toast} onChange={(toast) => update({ toast })} />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Campaign -----------------------------------------------------------

export function CampaignEditor({
  copy,
  products,
  onChangeCopy,
  onChangeProducts,
}: {
  copy: CampaignCopy;
  products: ProductRef[];
  onChangeCopy: (v: CampaignCopy) => void;
  onChangeProducts: (v: ProductRef[]) => void;
}) {
  const update = (patch: Partial<CampaignCopy>) => onChangeCopy({ ...copy, ...patch });
  return (
    <>
      <EditorHeading title="Campagne éditoriale" description="Le bloc est masqué automatiquement tant qu'aucun produit n'est sélectionné ci-dessous." />
      <FieldGroup>
        <ImagePicker label="Image" imageId={copy.image.id} imageUrl={copy.image.url} onChange={(id, url) => update({ image: { id, url } })} />
        <TextField label="Eyebrow" value={copy.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
        <TextField label="Titre" value={copy.title} onChange={(title) => update({ title })} />
        <TextAreaField label="Description" value={copy.description} onChange={(description) => update({ description })} />
        <TextField label="Texte du bouton" value={copy.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
        <TextField label="Lien du bouton" value={copy.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} placeholder="/catalogue" />
        <TextField label="Titre du rail produits" value={copy.railTitle} onChange={(railTitle) => update({ railTitle })} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Produits affichés</span>
          <ProductPicker selected={products} onChange={onChangeProducts} />
        </label>
      </FieldGroup>
    </>
  );
}

// ---- Dermo picks -----------------------------------------------------------

const MAX_DERMO_PICKS = 8;

export function DermoPicksEditor({ value, onChange }: { value: DermoPick[]; onChange: (v: DermoPick[]) => void }) {
  return (
    <>
      <EditorHeading title="Conseil dermo" description={`${value.length}/${MAX_DERMO_PICKS} produits — maximum ${MAX_DERMO_PICKS}, affichés dans le carrousel ci-dessous.`} />
      <ArrayField
        items={value}
        onChange={onChange}
        renderLabel={(d) => d.product?.label || "Nouveau produit"}
        itemName="cet élément"
        addLabel="Ajouter un produit"
        onAdd={value.length < MAX_DERMO_PICKS ? () => ({ product: null, actif: "", claim: "" }) : undefined}
        renderItem={(d, _i, update) => (
          <FieldGroup>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Produit</span>
              <ProductPicker
                selected={d.product ? [d.product] : []}
                onChange={(sel: ProductRef[]) => update({ product: sel[sel.length - 1] || null })}
                max={1}
              />
            </label>
            <TextField label="Actif" value={d.actif} onChange={(actif) => update({ actif })} />
            <TextField label="Claim" value={d.claim} onChange={(claim) => update({ claim })} />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Brands marquee -----------------------------------------------------

export function BrandsMarqueeEditor({
  value,
  allBrands,
  onChange,
}: {
  value: { id: number; name: string }[];
  allBrands: { id: number; name: string; slug: string }[];
  onChange: (v: { id: number; name: string }[]) => void;
}) {
  const available = allBrands.filter((b) => !value.some((v) => v.id === b.id));
  return (
    <>
      <EditorHeading title="Marques (défilement)" description="Logos affichés dans l'ordre ci-dessous, tirés des marques Payload." />
      <ArrayField
        items={value}
        onChange={onChange}
        renderLabel={(b) => b.name}
        itemName="cette marque"
        renderItem={() => null}
      />
      {available.length > 0 && (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Ajouter une marque</span>
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400"
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              const brand = available.find((b) => b.id === id);
              if (brand) onChange([...value, brand]);
            }}
          >
            <option value="">Choisir...</option>
            {available.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

// ---- Instagram -----------------------------------------------------------

export function InstagramEditor({ value, onChange }: { value: Instagram; onChange: (v: Instagram) => void }) {
  const update = (patch: Partial<Instagram>) => onChange({ ...value, ...patch });
  return (
    <>
      <EditorHeading title="Instagram" description="Les posts eux-mêmes se synchronisent automatiquement depuis @paradhiver." />
      <FieldGroup>
        <CheckboxField label="Afficher le bloc" checked={value.show} onChange={(show) => update({ show })} />
        <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
        <TextField label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ subtitle })} />
        <TextField label="Nom d'utilisateur" value={value.username} onChange={(username) => update({ username })} />
        <NumberField label="Nombre de posts" value={value.postCount} min={2} max={12} onChange={(postCount) => update({ postCount })} />
        <TextField label="Texte du bouton" value={value.ctaText} onChange={(ctaText) => update({ ctaText })} />
        <TextField label="Lien du bouton" value={value.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} />
      </FieldGroup>
    </>
  );
}

// ---- Trust badges -----------------------------------------------------------

export function TrustBadgesEditor({ value, onChange }: { value: TrustBadge[]; onChange: (v: TrustBadge[]) => void }) {
  return (
    <>
      <EditorHeading title="Barre de confiance" />
      <ArrayField
        items={value}
        onChange={onChange}
        renderLabel={(b) => b.title || "Nouveau badge"}
        itemName="ce badge"
        addLabel="Ajouter un badge"
        onAdd={() => ({ title: "Nouveau badge", sub: "", icon: "Truck" })}
        renderItem={(b, _i, update) => (
          <FieldGroup>
            <TextField label="Titre" value={b.title} onChange={(title) => update({ title })} />
            <TextField label="Sous-titre" value={b.sub} onChange={(sub) => update({ sub })} />
            <SelectField label="Icône" value={b.icon} onChange={(icon) => update({ icon })} options={TRUST_ICONS} />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Services teaser -----------------------------------------------------------

export function ServicesEditor({ value, onChange }: { value: ServiceCard[]; onChange: (v: ServiceCard[]) => void }) {
  return (
    <>
      <EditorHeading title="Nos services" />
      <ArrayField
        items={value}
        onChange={onChange}
        renderLabel={(s) => s.title || "Nouveau service"}
        itemName="ce service"
        addLabel="Ajouter un service"
        onAdd={() => ({ title: "Nouveau service", sub: "", cta: "En savoir plus", href: "/services", icon: "ScanLine" })}
        renderItem={(s, _i, update) => (
          <FieldGroup>
            <TextField label="Titre" value={s.title} onChange={(title) => update({ title })} />
            <TextAreaField label="Sous-titre" value={s.sub} onChange={(sub) => update({ sub })} />
            <TextField label="Texte du bouton" value={s.cta} onChange={(cta) => update({ cta })} />
            <TextField label="Lien" value={s.href} onChange={(href) => update({ href })} />
            <SelectField label="Icône" value={s.icon} onChange={(icon) => update({ icon })} options={SERVICE_ICONS} />
          </FieldGroup>
        )}
      />
    </>
  );
}

// ---- Newsletter -----------------------------------------------------------

export function NewsletterEditor({ value, onChange }: { value: NewsletterCopy; onChange: (v: NewsletterCopy) => void }) {
  const update = (patch: Partial<NewsletterCopy>) => onChange({ ...value, ...patch });
  return (
    <>
      <EditorHeading title="Newsletter" />
      <FieldGroup>
        <TextField label="Titre" value={value.title} onChange={(title) => update({ title })} />
        <TextAreaField label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ subtitle })} />
        <TextField label="Placeholder du champ email" value={value.placeholder} onChange={(placeholder) => update({ placeholder })} />
        <TextField label="Texte du bouton" value={value.buttonLabel} onChange={(buttonLabel) => update({ buttonLabel })} />
        <TextField label="Message de confirmation" value={value.successMessage} onChange={(successMessage) => update({ successMessage })} />
      </FieldGroup>

      <EditorHeading title="Logo" />
      <FieldGroup>
        <CheckboxField label="Afficher le logo" checked={value.logoEnabled} onChange={(logoEnabled) => update({ logoEnabled })} />
        {value.logoEnabled && (
          <>
            <NumberField label="Taille (px)" value={value.logoSize} onChange={(logoSize) => update({ logoSize })} min={40} max={140} />
            <SelectField
              label="Position"
              value={value.logoPosition}
              onChange={(logoPosition) => update({ logoPosition: logoPosition as "left" | "top" })}
              options={[
                { label: "À gauche du texte", value: "left" },
                { label: "Au-dessus du texte", value: "top" },
              ]}
            />
          </>
        )}
      </FieldGroup>

      <EditorHeading title="Couleurs" />
      <FieldGroup>
        <ColorField label="Fond" value={value.backgroundColor} onChange={(backgroundColor) => update({ backgroundColor })} />
        <ColorField label="Texte" value={value.textColor} onChange={(textColor) => update({ textColor })} />
        <ColorField label="Couleur du CTA" value={value.ctaColor} onChange={(ctaColor) => update({ ctaColor })} />
      </FieldGroup>

      <EditorHeading title="Mise en forme & particules" />
      <FieldGroup>
        <NumberField label="Rayon des coins (px)" value={value.borderRadius} onChange={(borderRadius) => update({ borderRadius })} min={0} max={60} />
        <CheckboxField label="Afficher les particules de neige" checked={value.particlesEnabled} onChange={(particlesEnabled) => update({ particlesEnabled })} />
        {value.particlesEnabled && (
          <NumberField label="Opacité des particules" value={value.particlesOpacity} onChange={(particlesOpacity) => update({ particlesOpacity })} min={0} max={1} />
        )}
      </FieldGroup>
    </>
  );
}

// ---- Summer Edit ---------------------------------------------------------

const SUMMER_EDIT_ICON_LABELS: Record<string, string> = {
  Sun: "Soleil",
  Droplet: "Goutte",
  Leaf: "Feuille",
  Sparkles: "Étincelles",
  ShieldCheck: "Bouclier",
};
const SUMMER_EDIT_ICON_OPTIONS = SUMMER_EDIT_HIGHLIGHT_ICONS.map((v) => ({ label: SUMMER_EDIT_ICON_LABELS[v] || v, value: v }));

export function SummerEditCopyEditor({ value, onChange }: { value: SummerEditCopyDraft; onChange: (v: SummerEditCopyDraft) => void }) {
  const update = (patch: Partial<SummerEditCopyDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <EditorHeading
          title="Summer Edit — campagne"
          description="Campagne saisonnière éditoriale, indépendante du Dermo Corner et de « Nos coups de cœur ». Même bloc, réutilisable pour une future campagne Noël, Ramadan, etc."
        />
        <FieldGroup>
          <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => update({ eyebrow })} />
          <TextField label="Année (optionnelle)" value={value.year} onChange={(year) => update({ year })} placeholder="2026" />
          <TextField label="Titre (ligne 1)" value={value.title} onChange={(title) => update({ title })} />
          <TextField label="Titre (ligne 2, couleur accent)" value={value.titleAccent} onChange={(titleAccent) => update({ titleAccent })} />
          <TextAreaField label="Description" value={value.description} onChange={(description) => update({ description })} />
          <TextField label="Texte du CTA" value={value.ctaLabel} onChange={(ctaLabel) => update({ ctaLabel })} />
          <TextField label="Lien du CTA" value={value.ctaUrl} onChange={(ctaUrl) => update({ ctaUrl })} placeholder="/catalogue" />
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Visuel" />
        <FieldGroup>
          <ImagePicker label="Image (desktop)" imageId={value.heroImage.id} imageUrl={value.heroImage.url} onChange={(id, url) => update({ heroImage: { id, url } })} />
          <ImagePicker
            label="Image (mobile, optionnelle)"
            imageId={value.heroImageMobile.id}
            imageUrl={value.heroImageMobile.url}
            onChange={(id, url) => update({ heroImageMobile: { id, url } })}
          />
          <SelectField label="Position de l'image" value={value.imagePosition} onChange={(imagePosition) => update({ imagePosition: imagePosition as SummerEditCopyDraft["imagePosition"] })} options={SUMMER_EDIT_IMAGE_POSITIONS} />
          <NumberField label="Zoom au chargement (1 à 1.15)" value={value.imageScale} min={1} max={1.15} onChange={(imageScale) => update({ imageScale })} />
          <CheckboxField label="Voile dégradé en bas de l'image" checked={value.overlay} onChange={(overlay) => update({ overlay })} />
          <CheckboxField label="Pleine largeur (sans marge de conteneur)" checked={value.fullWidth} onChange={(fullWidth) => update({ fullWidth })} />
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Repères" description="3 maximum, affichés sous le bouton." />
        <ArrayField
          items={value.highlights}
          onChange={(highlights) => update({ highlights })}
          renderLabel={(h) => h.label || "Nouveau repère"}
          itemName="ce repère"
          addLabel="Ajouter un repère"
          onAdd={value.highlights.length < 3 ? () => ({ icon: "Sun", label: "" }) : undefined}
          renderItem={(h, _i, updateItem) => (
            <FieldGroup>
              <SelectField label="Icône" value={h.icon} onChange={(icon) => updateItem({ icon })} options={SUMMER_EDIT_ICON_OPTIONS} />
              <TextField label="Libellé" value={h.label} onChange={(label) => updateItem({ label })} />
            </FieldGroup>
          )}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Carrousel produits" />
        <FieldGroup>
          <CheckboxField label="Défilement automatique" checked={value.carousel.autoplay} onChange={(autoplay) => update({ carousel: { ...value.carousel, autoplay } })} />
          {value.carousel.autoplay && (
            <NumberField
              label="Vitesse (ms entre chaque avancée)"
              value={value.carousel.autoplaySpeedMs}
              min={2000}
              max={10000}
              onChange={(autoplaySpeedMs) => update({ carousel: { ...value.carousel, autoplaySpeedMs } })}
            />
          )}
          <CheckboxField label="Afficher le compteur (01 — 08)" checked={value.carousel.showCounter} onChange={(showCounter) => update({ carousel: { ...value.carousel, showCounter } })} />
          <CheckboxField label="Afficher la ligne de progression" checked={value.carousel.showProgress} onChange={(showProgress) => update({ carousel: { ...value.carousel, showProgress } })} />
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Animation" description="Le mouvement au scroll respecte toujours la préférence « mouvement réduit » du visiteur." />
        <FieldGroup>
          <CheckboxField
            label="Apparition progressive (titre, image, repères)"
            checked={value.animation.enableReveal}
            onChange={(enableReveal) => update({ animation: { ...value.animation, enableReveal } })}
          />
          <CheckboxField
            label="Parallax léger sur l'image"
            checked={value.animation.enableParallax}
            onChange={(enableParallax) => update({ animation: { ...value.animation, enableParallax } })}
          />
          <CheckboxField
            label="Produits en cascade au scroll"
            checked={value.animation.staggerProducts}
            onChange={(staggerProducts) => update({ animation: { ...value.animation, staggerProducts } })}
          />
          <SelectField
            label="Vitesse des animations"
            value={value.animation.speed}
            onChange={(speed) => update({ animation: { ...value.animation, speed: speed as SummerEditCopyDraft["animation"]["speed"] } })}
            options={SUMMER_EDIT_ANIMATION_SPEEDS}
          />
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Couleurs" description="Palette propre à cette campagne — n'affecte pas le thème du reste du site." />
        <FieldGroup>
          <ColorField label="Fond" value={value.colors.background} onChange={(background) => update({ colors: { ...value.colors, background } })} />
          <ColorField label="Texte" value={value.colors.text} onChange={(text) => update({ colors: { ...value.colors, text } })} />
          <ColorField label="Accent (titres, repères)" value={value.colors.accent} onChange={(accent) => update({ colors: { ...value.colors, accent } })} />
          <ColorField label="CTA" value={value.colors.cta} onChange={(cta) => update({ colors: { ...value.colors, cta } })} />
        </FieldGroup>
      </div>
    </div>
  );
}

const MAX_SUMMER_ACTS = 3;
const MAX_SUMMER_ACT_PRODUCTS = 4;

export function SummerEditActsEditor({ value, onChange }: { value: SummerEditActDraft[]; onChange: (v: SummerEditActDraft[]) => void }) {
  return (
    <>
      <EditorHeading
        title="Summer Edit — actes"
        description={`${value.length}/${MAX_SUMMER_ACTS} actes — chacun avec 4 produits maximum et son propre carrousel automatique.`}
      />
      <ArrayField
        items={value}
        onChange={onChange}
        renderLabel={(a) => a.title || "Nouvel acte"}
        itemName="cet acte"
        addLabel="Ajouter un acte"
        onAdd={value.length < MAX_SUMMER_ACTS ? () => ({ eyebrow: `Acte ${value.length + 1}`, title: "", description: "", products: [] }) : undefined}
        renderItem={(act, _i, updateAct) => (
          <FieldGroup>
            <TextField label="Eyebrow" value={act.eyebrow} onChange={(eyebrow) => updateAct({ eyebrow })} />
            <TextField label="Titre" value={act.title} onChange={(title) => updateAct({ title })} />
            <TextAreaField label="Description" value={act.description} onChange={(description) => updateAct({ description })} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Produits ({MAX_SUMMER_ACT_PRODUCTS} maximum)</span>
              <ProductPicker selected={act.products} onChange={(products) => updateAct({ products })} max={MAX_SUMMER_ACT_PRODUCTS} />
            </label>
          </FieldGroup>
        )}
      />
    </>
  );
}
