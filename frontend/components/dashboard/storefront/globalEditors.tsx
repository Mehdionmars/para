"use client";

import { ChromePreview, CHROME_PREVIEW_DEFAULTS } from "@/components/dashboard/appearance/ChromePreview";
import { ColorSection, type InheritedColors } from "@/components/dashboard/appearance/ColorSection";
import { ArrayField } from "@/components/dashboard/storefront/ArrayField";
import { CheckboxField, ColorField, EditorHeading, FieldGroup, NumberField, SelectField, TextField } from "@/components/dashboard/storefront/FieldKit";
import { ImagePicker } from "@/components/dashboard/storefront/ImagePicker";
import {
  CHROME_SURFACE_FIELDS,
  type ChromeColorsDraft,
  HEADER_ACTION_ICONS,
  THEME_PRESET_VALUES,
  THEME_PRESETS,
  type FooterColumnDraft,
  type HeaderActionDraft,
  type HeaderSearchDraft,
  type LogoDraft,
  type ThemeDraft,
  type TopBarDraft,
} from "@/lib/dashboard/storefront-mapping";

const ICON_LABELS: Record<string, string> = {
  MapPin: "Localisation",
  MessageCircle: "Bulle de discussion",
  Phone: "Téléphone",
  Mail: "Enveloppe",
  HelpCircle: "Aide",
  Heart: "Cœur",
  ShoppingBag: "Sac",
};
const ICON_OPTIONS = HEADER_ACTION_ICONS.map((v) => ({ label: ICON_LABELS[v] || v, value: v }));

/**
 * What the storefront paints when a field is left blank. Shown greyed in each
 * control so an operator sees the colour they are about to override instead
 * of an empty box — and so "réinitialiser" has a visible meaning.
 *
 * These mirror the `var(--chrome-…, fallback)` half of the components; the
 * preview reads the same table.
 */
const INHERITED: Record<"topBar" | "header" | "footer", InheritedColors> = {
  topBar: {
    backgroundColor: CHROME_PREVIEW_DEFAULTS.topBar.bg,
    textColor: CHROME_PREVIEW_DEFAULTS.topBar.text,
    linkColor: CHROME_PREVIEW_DEFAULTS.topBar.text,
    hoverColor: CHROME_PREVIEW_DEFAULTS.topBar.text,
  },
  header: {
    backgroundColor: CHROME_PREVIEW_DEFAULTS.header.bg,
    textColor: CHROME_PREVIEW_DEFAULTS.header.text,
    linkColor: CHROME_PREVIEW_DEFAULTS.header.link,
    hoverColor: "var(--pdh-plum)",
    iconColor: CHROME_PREVIEW_DEFAULTS.header.icon,
    borderColor: CHROME_PREVIEW_DEFAULTS.header.border,
  },
  footer: {
    backgroundColor: CHROME_PREVIEW_DEFAULTS.footer.bg,
    textColor: CHROME_PREVIEW_DEFAULTS.footer.text,
    headingColor: CHROME_PREVIEW_DEFAULTS.footer.heading,
    linkColor: CHROME_PREVIEW_DEFAULTS.footer.link,
    hoverColor: CHROME_PREVIEW_DEFAULTS.footer.link,
    borderColor: CHROME_PREVIEW_DEFAULTS.footer.border,
    iconColor: CHROME_PREVIEW_DEFAULTS.footer.text,
  },
};

/** Every chrome editor receives the whole appearance draft: the preview shows
 * all three surfaces at once, because a footer is judged against the header
 * above it, not on its own. */
export type ChromeAppearanceProps = {
  appearance: { topBar: ChromeColorsDraft; header: ChromeColorsDraft; footer: ChromeColorsDraft };
  onChangeAppearance: (surface: "topBar" | "header" | "footer", value: ChromeColorsDraft) => void;
};

/** The appearance block, identical in structure for the three surfaces. */
function AppearanceBlock({
  surface,
  title,
  description,
  appearance,
  onChangeAppearance,
}: ChromeAppearanceProps & { surface: "topBar" | "header" | "footer"; title: string; description: string }) {
  return (
    <div className="mt-6 border-t border-gray-100 pt-5 @container">
      {/* Preview under the fields when there is no room, beside them when
          there is — measured against this block, not the window.
          `lg:` was a window breakpoint, and this editor only ever renders
          inside the builder's 320px aside: on any laptop it fired, handed the
          preview its full 260px and left the six colour inputs a sliver of
          what remained. A container query asks the question that actually
          matters, so the two columns appear only if the panel can hold them. */}
      <div className="grid grid-cols-1 gap-5 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
        <ColorSection
          description={description}
          fields={CHROME_SURFACE_FIELDS[surface]}
          inherited={INHERITED[surface]}
          onChange={(v) => onChangeAppearance(surface, v)}
          showOpacity={surface === "topBar"}
          title={title}
          value={appearance[surface]}
        />
        <div className="@2xl:sticky @2xl:top-4 @2xl:self-start">
          <ChromePreview focus={surface} footer={appearance.footer} header={appearance.header} topBar={appearance.topBar} />
        </div>
      </div>
    </div>
  );
}

// ---- Top Bar --------------------------------------------------------------

export function TopBarEditor({
  value,
  onChange,
  appearance,
  onChangeAppearance,
}: { value: TopBarDraft; onChange: (v: TopBarDraft) => void } & ChromeAppearanceProps) {
  const update = (patch: Partial<TopBarDraft>) => onChange({ ...value, ...patch });
  return (
    <>
      <EditorHeading title="Top Bar" description="Bandeau défilant au-dessus de l'en-tête, visible sur toutes les pages." />
      <FieldGroup>
        <CheckboxField label="Afficher la top bar" checked={value.enabled} onChange={(enabled) => update({ enabled })} />
        {value.enabled && (
          <>
            <NumberField
              label="Vitesse du défilement (secondes par boucle)"
              value={value.marqueeSpeedSec}
              min={10}
              max={90}
              onChange={(marqueeSpeedSec) => update({ marqueeSpeedSec })}
            />
            <TextField label="Message mobile (fixe, sans défilement)" value={value.mobileMessage} onChange={(mobileMessage) => update({ mobileMessage })} />
          </>
        )}
      </FieldGroup>

      {value.enabled && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <EditorHeading title="Messages" description="Défilent en boucle sur ordinateur/tablette." />
          <ArrayField<TopBarDraft["messages"][number]>
            items={value.messages}
            onChange={(messages) => update({ messages })}
            renderLabel={(m) => m.text || "Nouveau message"}
            itemName="ce message"
            addLabel="Ajouter un message"
            onAdd={() => ({ text: "", active: true })}
            renderItem={(m, _i, updateItem) => (
              <FieldGroup>
                <TextField label="Texte" value={m.text} onChange={(text) => updateItem({ text })} />
                <CheckboxField label="Actif" checked={m.active} onChange={(active) => updateItem({ active })} />
              </FieldGroup>
            )}
          />
        </div>
      )}

      <AppearanceBlock
        appearance={appearance}
        description="Chaque champ laissé vide garde exactement la couleur actuelle du storefront."
        onChangeAppearance={onChangeAppearance}
        surface="topBar"
        title="Apparence"
      />
    </>
  );
}

// ---- Header (logo + search + actions) -------------------------------------

export function HeaderEditor({
  logo,
  headerSearch,
  headerActions,
  onChangeLogo,
  onChangeHeaderSearch,
  onChangeHeaderActions,
  appearance,
  onChangeAppearance,
}: {
  logo: LogoDraft;
  headerSearch: HeaderSearchDraft;
  headerActions: HeaderActionDraft[];
  appearance: ChromeAppearanceProps["appearance"];
  onChangeAppearance: ChromeAppearanceProps["onChangeAppearance"];
  onChangeLogo: (v: LogoDraft) => void;
  onChangeHeaderSearch: (v: HeaderSearchDraft) => void;
  onChangeHeaderActions: (v: HeaderActionDraft[]) => void;
} & ChromeAppearanceProps) {
  const updateLogo = (patch: Partial<LogoDraft>) => onChangeLogo({ ...logo, ...patch });
  const updateSearch = (patch: Partial<HeaderSearchDraft>) => onChangeHeaderSearch({ ...headerSearch, ...patch });
  const updateAction = (key: string, patch: Partial<HeaderActionDraft>) =>
    onChangeHeaderActions(headerActions.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <EditorHeading title="Logo" />
        <FieldGroup>
          <ImagePicker label="Image du logo" imageId={logo.image.id} imageUrl={logo.image.url} onChange={(id, url) => updateLogo({ image: { id, url } })} />
          <TextField label="Texte du logo" value={logo.wordmark} onChange={(wordmark) => updateLogo({ wordmark })} />
          <TextField label="Lien" value={logo.href} onChange={(href) => updateLogo({ href })} />
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading title="Recherche" />
        <FieldGroup>
          <CheckboxField label="Afficher la recherche" checked={headerSearch.enabled} onChange={(enabled) => updateSearch({ enabled })} />
          {headerSearch.enabled && (
            <TextField label="Texte indicatif" value={headerSearch.placeholder} onChange={(placeholder) => updateSearch({ placeholder })} />
          )}
        </FieldGroup>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <EditorHeading
          title="Actions"
          description={'"Favoris" et "Panier" gardent leur comportement réel (compteur, panier) — seuls le libellé, l\'icône et la visibilité sont modifiables pour ces deux-là.'}
        />
        <div className="flex flex-col gap-3">
          {headerActions.map((action) => (
            <div key={action.key} className="rounded-lg border border-gray-200 p-3">
              <FieldGroup>
                <TextField label="Libellé" value={action.label} onChange={(label) => updateAction(action.key, { label })} />
                <SelectField label="Icône" value={action.icon} onChange={(icon) => updateAction(action.key, { icon })} options={ICON_OPTIONS} />
                {(action.key === "services" || action.key === "contact") && (
                  <TextField label="Lien" value={action.href} onChange={(href) => updateAction(action.key, { href })} />
                )}
                <CheckboxField label="Visible" checked={action.visible} onChange={(visible) => updateAction(action.key, { visible })} />
              </FieldGroup>
            </div>
          ))}
        </div>
      </div>

      <AppearanceBlock
        appearance={appearance}
        description="Chaque champ laissé vide garde exactement la couleur actuelle du storefront."
        onChangeAppearance={onChangeAppearance}
        surface="header"
        title="Couleurs de l'en-tête"
      />
    </div>
  );
}

// ---- Footer -----------------------------------------------------------

export function FooterColumnsEditor({
  value,
  onChange,
  appearance,
  onChangeAppearance,
}: { value: FooterColumnDraft[]; onChange: (v: FooterColumnDraft[]) => void } & ChromeAppearanceProps) {
  return (
    <>
      <EditorHeading title="Footer" description="Colonnes de liens, visibles sur toutes les pages." />
      <ArrayField<FooterColumnDraft>
        items={value}
        onChange={onChange}
        renderLabel={(c) => c.title || "Nouvelle colonne"}
        itemName="cette colonne"
        addLabel="Ajouter une colonne"
        onAdd={() => ({ title: "Nouvelle colonne", visible: true, links: [] })}
        renderItem={(col, index, updateCol) => (
          <FieldGroup>
            <TextField label="Titre" value={col.title} onChange={(title) => updateCol({ title })} />
            <CheckboxField label="Visible" checked={col.visible} onChange={(visible) => updateCol({ visible })} />
            <div className="mt-2 border-t border-gray-100 pt-3">
              <span className="mb-2 block text-xs font-medium text-gray-600">Liens</span>
              <ArrayField<FooterColumnDraft["links"][number]>
                items={col.links}
                onChange={(links) => updateCol({ links })}
                renderLabel={(l) => l.label || "Nouveau lien"}
                itemName="ce lien"
                addLabel="Ajouter un lien"
                onAdd={() => ({ label: "", href: "/", visible: true })}
                renderItem={(l, _i, updateLink) => (
                  <FieldGroup>
                    <TextField label="Libellé" value={l.label} onChange={(label) => updateLink({ label })} />
                    <TextField label="Lien" value={l.href} onChange={(href) => updateLink({ href })} />
                    <CheckboxField label="Visible" checked={l.visible} onChange={(visible) => updateLink({ visible })} />
                  </FieldGroup>
                )}
              />
            </div>
          </FieldGroup>
        )}
      />

      <AppearanceBlock
        appearance={appearance}
        description="Chaque champ laissé vide garde exactement la couleur actuelle du storefront."
        onChangeAppearance={onChangeAppearance}
        surface="footer"
        title="Apparence du pied de page"
      />
    </>
  );
}

// ---- Theme (Apparence) -----------------------------------------------------

type ThemeColorKey = "colorPrimary" | "colorSecondary" | "colorAccent" | "colorSale" | "colorTextPrimary" | "colorTextMuted" | "colorBackgroundSecondary";

const COLOR_FIELDS: { key: ThemeColorKey; label: string }[] = [
  { key: "colorPrimary", label: "Couleur principale" },
  { key: "colorSecondary", label: "Couleur secondaire" },
  { key: "colorAccent", label: "Couleur accent" },
  { key: "colorSale", label: "Prix promotionnel" },
  { key: "colorTextPrimary", label: "Texte principal" },
  { key: "colorTextMuted", label: "Texte secondaire" },
  { key: "colorBackgroundSecondary", label: "Fond secondaire" },
];

const BUTTON_COLOR_FIELDS: { key: "buttonBg" | "buttonText" | "buttonHoverBg" | "buttonHoverText"; label: string }[] = [
  { key: "buttonBg", label: "Fond" },
  { key: "buttonText", label: "Texte" },
  { key: "buttonHoverBg", label: "Fond (survol)" },
  { key: "buttonHoverText", label: "Texte (survol)" },
];

const BADGE_COLOR_FIELDS: { key: "badgeBg" | "badgeText"; label: string }[] = [
  { key: "badgeBg", label: "Fond" },
  { key: "badgeText", label: "Texte" },
];

export function ThemeEditor({ value, onChange }: { value: ThemeDraft; onChange: (v: ThemeDraft) => void }) {
  function applyPreset(preset: string) {
    const swatch = THEME_PRESET_VALUES[preset];
    onChange(swatch ? { ...value, ...swatch, preset } : { ...value, preset });
  }

  function updateColor(key: keyof Omit<ThemeDraft, "preset">, next: string) {
    onChange({ ...value, [key]: next, preset: "custom" });
  }

  function updateButtonNumber(key: "buttonRadius" | "buttonFontWeight" | "buttonLetterSpacing", next: number) {
    onChange({ ...value, [key]: next });
  }

  function updateBadgeNumber(
    key: "badgeFontSize" | "badgeFontWeight" | "badgeLetterSpacing" | "badgeRadius" | "badgePaddingX" | "badgePaddingY" | "badgeGap",
    next: number,
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <>
      <EditorHeading title="Apparence" description="Change les couleurs de tout le site — boutons, liens, badges, en-tête, pied de page." />

      <div className="mb-5 grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((p) => {
          const swatch = THEME_PRESET_VALUES[p.value];
          const active = value.preset === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium ${
                active ? "border-violet-400 bg-violet-50 text-violet-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex flex-none -space-x-1">
                <span className="h-4 w-4 rounded-full border border-white" style={{ background: swatch.colorPrimary }} />
                <span className="h-4 w-4 rounded-full border border-white" style={{ background: swatch.colorSecondary }} />
                <span className="h-4 w-4 rounded-full border border-white" style={{ background: swatch.colorBackgroundSecondary }} />
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <FieldGroup>
        {COLOR_FIELDS.map((f) => (
          <ColorField key={f.key} label={f.label} value={value[f.key]} onChange={(v) => updateColor(f.key, v)} />
        ))}
      </FieldGroup>

      <EditorHeading title="Boutons (CTA principal)" description="Style des boutons pleins — Découvrir, Ajouter au panier, etc. — appliqué partout sur le site." />
      <FieldGroup>
        {BUTTON_COLOR_FIELDS.map((f) => (
          <ColorField key={f.key} label={f.label} value={value[f.key]} onChange={(v) => updateColor(f.key, v)} />
        ))}
        <NumberField label="Rayon (px)" value={value.buttonRadius} onChange={(v) => updateButtonNumber("buttonRadius", v)} min={0} max={999} />
        <NumberField label="Graisse du texte" value={value.buttonFontWeight} onChange={(v) => updateButtonNumber("buttonFontWeight", v)} min={100} max={900} />
        <NumberField label="Espacement des lettres (em)" value={value.buttonLetterSpacing} onChange={(v) => updateButtonNumber("buttonLetterSpacing", v)} min={0} max={1} />
      </FieldGroup>

      <EditorHeading title="Badges produit" description="Style par défaut des pastilles Top / Nouveau / Promo… — chaque badge peut surcharger sa propre couleur depuis la fiche produit." />
      <FieldGroup>
        {BADGE_COLOR_FIELDS.map((f) => (
          <ColorField key={f.key} label={f.label} value={value[f.key]} onChange={(v) => updateColor(f.key, v)} />
        ))}
        <NumberField label="Taille du texte (px)" value={value.badgeFontSize} onChange={(v) => updateBadgeNumber("badgeFontSize", v)} min={8} max={16} />
        <NumberField label="Graisse du texte" value={value.badgeFontWeight} onChange={(v) => updateBadgeNumber("badgeFontWeight", v)} min={100} max={900} />
        <NumberField label="Espacement des lettres (em)" value={value.badgeLetterSpacing} onChange={(v) => updateBadgeNumber("badgeLetterSpacing", v)} min={0} max={1} />
        <NumberField label="Rayon (px)" value={value.badgeRadius} onChange={(v) => updateBadgeNumber("badgeRadius", v)} min={0} max={999} />
        <NumberField label="Padding horizontal (px)" value={value.badgePaddingX} onChange={(v) => updateBadgeNumber("badgePaddingX", v)} min={0} max={30} />
        <NumberField label="Padding vertical (px)" value={value.badgePaddingY} onChange={(v) => updateBadgeNumber("badgePaddingY", v)} min={0} max={20} />
        <NumberField label="Espacement entre badges (px)" value={value.badgeGap} onChange={(v) => updateBadgeNumber("badgeGap", v)} min={0} max={20} />
      </FieldGroup>
    </>
  );
}
