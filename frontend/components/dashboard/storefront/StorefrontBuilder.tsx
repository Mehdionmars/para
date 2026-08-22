"use client";

import { Loader2, Monitor, PanelTop, Redo2, RotateCcw, Smartphone, Tablet, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  discardDraft,
  discardNavigationDraft,
  discardSiteChromeDraft,
  discardThemeDraft,
  publishHome,
  publishNavigation,
  publishSiteChrome,
  publishTheme,
  saveHomeDraft,
  saveNavigationDraft,
  saveSiteChromeDraft,
  saveThemeDraft,
} from "@/app/dashboard/(app)/storefront/actions";
import {
  CampaignEditor,
  BrandsFeaturedEditor,
  BrandsMarqueeEditor,
  CoffretsCopyEditor,
  CoffretsEditor,
  CtaPairEditor,
  DermoCornerCopyEditor,
  DermoPicksEditor,
  HeroSlidesEditor,
  ImageCarouselEditor,
  InstagramEditor,
  MarketingBannersEditor,
  NewsletterEditor,
  PromotionsGridEditor,
  ServicesEditor,
  SingleRailEditor,
  SummerEditActsEditor,
  SummerEditCopyEditor,
  TrustBadgesEditor,
  newRail,
} from "@/components/dashboard/storefront/editors";
import { FooterColumnsEditor, HeaderEditor, ThemeEditor, TopBarEditor } from "@/components/dashboard/storefront/globalEditors";
import { NavigationItemEditor } from "@/components/dashboard/storefront/NavigationEditors";
import { NavigationList } from "@/components/dashboard/storefront/NavigationList";
import { SectionList } from "@/components/dashboard/storefront/SectionList";
import { Button } from "@/components/dashboard/ui/Button";
import { Modal } from "@/components/dashboard/ui/Modal";
import {
  CONTENT_LESS_SECTIONS,
  mapDraftToPayload,
  mapHomeDocToDraft,
  mapNavigationDocToDraft,
  mapNavigationDraftToPayload,
  mapSiteChromeDocToDraft,
  type ChromeColorsDraft,
  mapSiteChromeDraftToPayload,
  mapThemeDocToDraft,
  mapThemeDraftToPayload,
  type HomeDraft,
  type NavigationDraft,
  type NavItemDraft,
  type SectionEntryKey,
  type SectionKey,
  type SiteChromeDraft,
  type ThemeDraft,
} from "@/lib/dashboard/storefront-mapping";

const AUTOSAVE_DEBOUNCE_MS = 2000;
const VIEWPORTS = { desktop: 1440, tablet: 834, mobile: 390 } as const;

type SaveState = "idle" | "saving" | "saved" | "error";

/** Shared autosave/publish/discard lifecycle for a single Payload global's
 * draft, used identically for Site Chrome and Theme — Home keeps its own
 * richer version below (undo/redo history), since it's a much larger,
 * longer-lived editing session than either of these two smaller globals. */
function useGlobalDraft<T>({
  initial,
  initialStatus,
  mapDraftToPayload: toPayload,
  mapDocToDraft,
  save,
  publish,
  discard,
}: {
  initial: T;
  initialStatus: string;
  mapDraftToPayload: (draft: T) => Record<string, unknown>;
  mapDocToDraft: (doc: unknown) => T;
  save: (payload: Record<string, unknown>) => Promise<{ error?: string }>;
  publish: (payload: Record<string, unknown>) => Promise<{ error?: string; warning?: string }>;
  discard: () => Promise<{ error?: string; doc?: unknown }>;
}) {
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const lastSavedRef = useRef(JSON.stringify(initial));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = JSON.stringify(draft) !== lastSavedRef.current;

  const doSave = useCallback(
    async (current: T) => {
      setSaveState("saving");
      setSaveError("");
      const res = await save(toPayload(current));
      if (res.error) {
        setSaveState("error");
        setSaveError(res.error);
        return;
      }
      lastSavedRef.current = JSON.stringify(current);
      setSaveState("saved");
    },
    [save, toPayload],
  );

  useEffect(() => {
    if (!dirty) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(draft), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function handlePublish() {
    setPublishing(true);
    clearTimeout(debounceRef.current);
    const res = await publish(toPayload(draft));
    setPublishing(false);
    if (res.error) {
      setSaveState("error");
      setSaveError(res.error);
      return;
    }
    if (res.warning) {
      setSaveState("error");
      setSaveError(res.warning);
    }
    lastSavedRef.current = JSON.stringify(draft);
    setStatus("published");
    setSaveState("saved");
  }

  async function handleDiscard() {
    setDiscarding(true);
    clearTimeout(debounceRef.current);
    const res = await discard();
    setDiscarding(false);
    if (res.error || !res.doc) {
      setSaveState("error");
      setSaveError(res.error || "Échec de l'annulation du brouillon.");
      return;
    }
    const restored = mapDocToDraft(res.doc);
    setDraft(restored);
    lastSavedRef.current = JSON.stringify(restored);
    setStatus("published");
    setSaveState("saved");
  }

  return { draft, setDraft, status, saveState, saveError, publishing, discarding, dirty, handlePublish, handleDiscard };
}

function SectionEditor({
  selectedKey,
  draft,
  update,
  brands,
}: {
  selectedKey: SectionEntryKey | null;
  draft: HomeDraft;
  update: (patch: Partial<HomeDraft>) => void;
  brands: { id: number; name: string; slug: string }[];
}) {
  if (!selectedKey) {
    return <p className="p-4 text-sm text-gray-400">Sélectionnez une section à gauche pour la modifier.</p>;
  }

  if (selectedKey.startsWith("rail:")) {
    const railKey = selectedKey.slice("rail:".length);
    const railIndex = draft.rails.findIndex((r) => r.key === railKey);
    if (railIndex === -1) return <p className="p-4 text-sm text-gray-400">Ce rail n&apos;existe plus.</p>;
    return (
      <SingleRailEditor
        rail={draft.rails[railIndex]}
        brands={brands}
        onChange={(rail) => {
          const rails = [...draft.rails];
          rails[railIndex] = rail;
          update({ rails });
        }}
      />
    );
  }

  if (CONTENT_LESS_SECTIONS.includes(selectedKey as SectionKey)) {
    return (
      <p className="p-4 text-sm text-gray-500">
        Ce bloc n&apos;a pas encore de contenu éditable depuis le builder — seules sa visibilité et sa position peuvent être modifiées pour le moment.
      </p>
    );
  }

  switch (selectedKey as SectionKey) {
    case "hero":
      return <HeroSlidesEditor value={draft.heroSlides} onChange={(heroSlides) => update({ heroSlides })} brands={brands} />;
    case "marketingBanner":
      return <MarketingBannersEditor value={draft.marketingBanners} onChange={(marketingBanners) => update({ marketingBanners })} />;
    case "ctaPair1":
      return <CtaPairEditor title="CTA — paire d'images (haut)" value={draft.ctaPair1} onChange={(ctaPair1) => update({ ctaPair1 })} />;
    case "ctaPair2":
      return <CtaPairEditor title="CTA — paire d'images (bas)" value={draft.ctaPair2} onChange={(ctaPair2) => update({ ctaPair2 })} />;
    case "promotionsGrid":
      return <PromotionsGridEditor value={draft.promotionsGrid} onChange={(promotionsGrid) => update({ promotionsGrid })} />;
    case "coffrets":
      return (
        <div className="flex flex-col gap-6">
          <CoffretsCopyEditor value={draft.coffretsCopy} onChange={(coffretsCopy) => update({ coffretsCopy })} />
          <div className="border-t border-gray-100 pt-4">
            <CoffretsEditor value={draft.coffrets} onChange={(coffrets) => update({ coffrets })} />
          </div>
        </div>
      );
    case "campaign":
      return (
        <CampaignEditor
          copy={draft.campaignCopy}
          products={draft.campaignProducts}
          onChangeCopy={(campaignCopy) => update({ campaignCopy })}
          onChangeProducts={(campaignProducts) => update({ campaignProducts })}
        />
      );
    case "dermoCorner":
      return (
        <div className="flex flex-col gap-6">
          <DermoCornerCopyEditor value={draft.dermoCornerCopy} onChange={(dermoCornerCopy) => update({ dermoCornerCopy })} />
          <div className="border-t border-gray-100 pt-4">
            <DermoPicksEditor value={draft.dermoPicks} onChange={(dermoPicks) => update({ dermoPicks })} />
          </div>
        </div>
      );
    case "imageCarousel":
      return (
        <ImageCarouselEditor
          copy={draft.imageCarouselCopy}
          products={draft.imageCarouselProducts}
          onChangeCopy={(imageCarouselCopy) => update({ imageCarouselCopy })}
          onChangeProducts={(imageCarouselProducts) => update({ imageCarouselProducts })}
        />
      );
    case "summerEdit":
      return (
        <div className="flex flex-col gap-6">
          <SummerEditCopyEditor value={draft.summerEditCopy} onChange={(summerEditCopy) => update({ summerEditCopy })} />
          <div className="border-t border-gray-100 pt-4">
            <SummerEditActsEditor value={draft.summerEditActs} onChange={(summerEditActs) => update({ summerEditActs })} />
          </div>
        </div>
      );
    case "brandsFeatured":
      return <BrandsFeaturedEditor value={draft.brandsFeatured} onChange={(brandsFeatured) => update({ brandsFeatured })} brands={brands} />;
    case "brandsMarquee":
      return <BrandsMarqueeEditor value={draft.brandsMarquee} allBrands={brands} onChange={(brandsMarquee) => update({ brandsMarquee })} />;
    case "instagram":
      return <InstagramEditor value={draft.instagram} onChange={(instagram) => update({ instagram })} />;
    case "trustBar":
      return <TrustBadgesEditor value={draft.trustBadges} onChange={(trustBadges) => update({ trustBadges })} />;
    case "services":
      return <ServicesEditor value={draft.servicesTeaser} onChange={(servicesTeaser) => update({ servicesTeaser })} />;
    case "newsletter":
      return <NewsletterEditor value={draft.newsletterSection} onChange={(newsletterSection) => update({ newsletterSection })} />;
    default:
      return null;
  }
}

const GLOBAL_ITEMS = [
  { key: "topBar", label: "Top Bar" },
  { key: "header", label: "Header" },
  { key: "footer", label: "Footer" },
] as const;
type GlobalItemKey = (typeof GLOBAL_ITEMS)[number]["key"];

const emptyNavItem = (): NavItemDraft => ({
  label: "",
  visible: true,
  type: "custom",
  category: { name: "" },
  brand: { name: "" },
  collectionRoute: "",
  pageRoute: "",
  customUrl: "/",
  badgeLabel: "",
  badgeColor: "none",
  megaMenuEnabled: false,
  megaMenuSubtitle: "",
  megaMenuColumns: [],
  megaMenuPromo: { image: { url: "" }, title: "", description: "", ctaLabel: "", ctaUrl: "" },
});

export function StorefrontBuilder({
  initialDraft,
  initialStatus,
  brands,
  categories,
  initialChromeDraft,
  initialChromeStatus,
  initialThemeDraft,
  initialThemeStatus,
  initialNavigationDraft,
  initialNavigationStatus,
}: {
  initialDraft: HomeDraft;
  initialStatus: string;
  brands: { id: number; name: string; slug: string }[];
  categories: { id: number; name: string }[];
  initialChromeDraft: SiteChromeDraft;
  initialChromeStatus: string;
  initialThemeDraft: ThemeDraft;
  initialThemeStatus: string;
  initialNavigationDraft: NavigationDraft;
  initialNavigationStatus: string;
}) {
  const [activeTab, setActiveTab] = useState<"home" | "navigation" | "theme" | "global">("home");
  const [globalSelectedKey, setGlobalSelectedKey] = useState<GlobalItemKey>("topBar");
  const [navSelectedIndex, setNavSelectedIndex] = useState<number>(0);

  const [draft, setDraft] = useState(initialDraft);
  const [selectedKey, setSelectedKey] = useState<SectionEntryKey | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [previewNonce, setPreviewNonce] = useState(0);

  const history = useRef<HomeDraft[]>([initialDraft]);
  const historyIndex = useRef(0);
  const [, setHistoryTick] = useState(0);
  const lastSavedRef = useRef(JSON.stringify(initialDraft));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = JSON.stringify(draft) !== lastSavedRef.current;

  const update = useCallback((patch: Partial<HomeDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      history.current = [...history.current.slice(0, historyIndex.current + 1), next];
      historyIndex.current = history.current.length - 1;
      setHistoryTick((t) => t + 1);
      return next;
    });
  }, []);

  function undo() {
    if (historyIndex.current === 0) return;
    historyIndex.current -= 1;
    setDraft(history.current[historyIndex.current]);
    setHistoryTick((t) => t + 1);
  }

  function redo() {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    setDraft(history.current[historyIndex.current]);
    setHistoryTick((t) => t + 1);
  }

  const doSave = useCallback(async (current: HomeDraft) => {
    setSaveState("saving");
    setSaveError("");
    const res = await saveHomeDraft(mapDraftToPayload(current));
    if (res.error) {
      setSaveState("error");
      setSaveError(res.error);
      return;
    }
    lastSavedRef.current = JSON.stringify(current);
    setSaveState("saved");
    setPreviewNonce((n) => n + 1);
  }, []);

  // Debounced autosave — waits for edits to pause rather than firing per keystroke.
  useEffect(() => {
    if (!dirty) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(draft), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (activeTab !== "home") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab]);

  async function handlePublish() {
    setPublishing(true);
    clearTimeout(debounceRef.current);
    const res = await publishHome(mapDraftToPayload(draft));
    setPublishing(false);
    if (res.error) {
      setSaveState("error");
      setSaveError(res.error);
      return;
    }
    if (res.warning) {
      setSaveState("error");
      setSaveError(res.warning);
    }
    lastSavedRef.current = JSON.stringify(draft);
    setStatus("published");
    setSaveState("saved");
    setPreviewNonce((n) => n + 1);
  }

  async function handleDiscard() {
    setDiscarding(true);
    clearTimeout(debounceRef.current);
    const res = await discardDraft();
    setDiscarding(false);
    setConfirmDiscard(false);
    if (res.error || !res.home) {
      setSaveState("error");
      setSaveError(res.error || "Échec de l'annulation du brouillon.");
      return;
    }
    const restored = mapHomeDocToDraft(res.home);
    setDraft(restored);
    history.current = [restored];
    historyIndex.current = 0;
    setHistoryTick((t) => t + 1);
    lastSavedRef.current = JSON.stringify(restored);
    setStatus("published");
    setSaveState("saved");
    setPreviewNonce((n) => n + 1);
  }

  function handleAddRail() {
    const rail = newRail();
    update({ rails: [...draft.rails, rail], sections: [...draft.sections, { key: `rail:${rail.key}`, visible: true }] });
    setSelectedKey(`rail:${rail.key}`);
  }

  function handleDeleteRail(railKey: string) {
    update({
      rails: draft.rails.filter((r) => r.key !== railKey),
      sections: draft.sections.filter((s) => s.key !== `rail:${railKey}`),
    });
    if (selectedKey === `rail:${railKey}`) setSelectedKey(null);
  }

  const chrome = useGlobalDraft<SiteChromeDraft>({
    initial: initialChromeDraft,
    initialStatus: initialChromeStatus,
    mapDraftToPayload: mapSiteChromeDraftToPayload,
    mapDocToDraft: mapSiteChromeDocToDraft,
    save: saveSiteChromeDraft,
    publish: publishSiteChrome,
    discard: async () => {
      const res = await discardSiteChromeDraft();
      return { error: res.error, doc: res.chrome };
    },
  });

  const theme = useGlobalDraft<ThemeDraft>({
    initial: initialThemeDraft,
    initialStatus: initialThemeStatus,
    mapDraftToPayload: mapThemeDraftToPayload,
    mapDocToDraft: mapThemeDocToDraft,
    save: saveThemeDraft,
    publish: publishTheme,
    discard: async () => {
      const res = await discardThemeDraft();
      return { error: res.error, doc: res.theme };
    },
  });

  // The three surfaces are edited on three different panels but previewed
  // together: a footer palette is judged against the header above it, not on
  // its own. Grouping them here means each editor receives the whole picture
  // instead of rebuilding it from the draft three times.
  const chromeAppearance = {
    footer: chrome.draft.footerAppearance,
    header: chrome.draft.headerAppearance,
    topBar: chrome.draft.topBarAppearance,
  };
  const setChromeAppearance = (surface: "topBar" | "header" | "footer", value: ChromeColorsDraft) => {
    const key = surface === "topBar" ? "topBarAppearance" : surface === "header" ? "headerAppearance" : "footerAppearance";
    chrome.setDraft({ ...chrome.draft, [key]: value });
  };

  const navigation = useGlobalDraft<NavigationDraft>({
    initial: initialNavigationDraft,
    initialStatus: initialNavigationStatus,
    mapDraftToPayload: mapNavigationDraftToPayload,
    mapDocToDraft: mapNavigationDocToDraft,
    save: saveNavigationDraft,
    publish: publishNavigation,
    discard: async () => {
      const res = await discardNavigationDraft();
      return { error: res.error, doc: res.navigation };
    },
  });

  function handleAddNavItem() {
    navigation.setDraft({ items: [...navigation.draft.items, emptyNavItem()] });
    setNavSelectedIndex(navigation.draft.items.length);
  }

  // The top toolbar (save state, undo/redo, discard, publish) always acts on
  // whichever draft is currently open — Home, Navigation, Theme (Apparence),
  // or Site Chrome (Top Bar/Header/Footer, under "Global").
  const activeKind = activeTab === "home" ? "home" : activeTab === "navigation" ? "navigation" : activeTab === "theme" ? "theme" : "chrome";
  const active =
    activeKind === "home"
      ? { dirty, saveState, saveError, publishing, discarding, status, handlePublish, handleDiscard: () => setConfirmDiscard(true) }
      : activeKind === "theme"
        ? { ...theme, handleDiscard: theme.handleDiscard }
        : activeKind === "navigation"
          ? { ...navigation, handleDiscard: navigation.handleDiscard }
          : { ...chrome, handleDiscard: chrome.handleDiscard };

  useEffect(() => {
    // Any autosave in any Global/Navigation draft should also refresh the
    // live preview iframe, same as Home's autosave already does.
    if (chrome.saveState === "saved" || theme.saveState === "saved" || navigation.saveState === "saved") setPreviewNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chrome.saveState, theme.saveState, navigation.saveState]);

  const previewSrc = `/api/dashboard-preview?next=${encodeURIComponent("/")}&v=${previewNonce}`;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex flex-none items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-900">Storefront Builder</h1>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            {(
              [
                ["home", "Contenu"],
                ["navigation", "Navigation"],
                ["theme", "Apparence"],
                ["global", "Global"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              active.status === "published" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {active.status === "published" ? "Publié" : "Brouillon non publié"}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((v) => {
            const Icon = v === "desktop" ? Monitor : v === "tablet" ? Tablet : Smartphone;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                aria-label={v}
                className={`rounded p-1.5 ${viewport === v ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {active.saveState === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement...
              </span>
            )}
            {active.saveState === "saved" && !active.dirty && "Brouillon enregistré"}
            {active.saveState === "error" && <span className="text-red-600">{active.saveError}</span>}
            {active.saveState === "idle" && active.dirty && "Modifications non enregistrées"}
          </span>
          {activeKind === "home" && (
            <>
              <button type="button" onClick={undo} disabled={historyIndex.current === 0} aria-label="Annuler" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={historyIndex.current >= history.current.length - 1}
                aria-label="Rétablir"
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (activeKind === "home" ? setConfirmDiscard(true) : active.handleDiscard())}
            disabled={active.discarding}
          >
            {active.discarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Annuler le brouillon
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.open(previewSrc, "_blank")}>
            Aperçu
          </Button>
          <Button type="button" size="sm" onClick={activeKind === "home" ? handlePublish : active.handlePublish} disabled={active.publishing}>
            {active.publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publier"}
          </Button>
        </div>
      </div>

      {confirmDiscard && (
        <Modal title="Annuler le brouillon ?" onClose={() => setConfirmDiscard(false)}>
          <p className="text-sm text-gray-600">
            Toutes les modifications non publiées seront perdues et la page reviendra à la dernière version publiée.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDiscard(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleDiscard}>
              Revenir à la version publiée
            </Button>
          </div>
        </Modal>
      )}

      {/* 3-column body */}
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 flex-none overflow-y-auto border-r border-gray-200 bg-white p-3">
          {activeTab === "home" ? (
            <SectionList
              sections={draft.sections}
              onChange={(sections) => update({ sections })}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              rails={draft.rails}
              onAddRail={handleAddRail}
              onDeleteRail={handleDeleteRail}
            />
          ) : activeTab === "navigation" ? (
            <NavigationList
              items={navigation.draft.items}
              onChange={(items) => navigation.setDraft({ items })}
              selectedIndex={navSelectedIndex}
              onSelect={setNavSelectedIndex}
              onAdd={handleAddNavItem}
            />
          ) : activeTab === "theme" ? (
            <p className="p-2 text-xs text-gray-400">Couleurs et thèmes du storefront.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {GLOBAL_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setGlobalSelectedKey(item.key)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium ${
                    globalSelectedKey === item.key ? "border-violet-300 bg-violet-50 text-violet-800" : "border-transparent text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <PanelTop className="h-3.5 w-3.5 flex-none" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-100 p-4">
          <iframe
            key={previewNonce}
            src={previewSrc}
            title="Aperçu du storefront"
            className="h-full rounded-lg border border-gray-200 bg-white shadow-sm transition-all"
            style={{ width: VIEWPORTS[viewport], maxWidth: "100%" }}
          />
        </div>

        <aside className="w-80 flex-none overflow-y-auto border-l border-gray-200 bg-white p-4">
          {activeTab === "home" ? (
            <SectionEditor selectedKey={selectedKey} draft={draft} update={update} brands={brands} />
          ) : activeTab === "navigation" ? (
            navigation.draft.items[navSelectedIndex] ? (
              <NavigationItemEditor
                value={navigation.draft.items[navSelectedIndex]}
                onChange={(item) => {
                  const items = [...navigation.draft.items];
                  items[navSelectedIndex] = item;
                  navigation.setDraft({ items });
                }}
                categories={categories}
                brands={brands}
              />
            ) : (
              <p className="p-4 text-sm text-gray-400">Sélectionnez un lien à gauche pour le modifier.</p>
            )
          ) : activeTab === "theme" ? (
            <ThemeEditor value={theme.draft} onChange={theme.setDraft} />
          ) : globalSelectedKey === "topBar" ? (
            <TopBarEditor
              appearance={chromeAppearance}
              onChange={(topBar) => chrome.setDraft({ ...chrome.draft, topBar })}
              onChangeAppearance={setChromeAppearance}
              value={chrome.draft.topBar}
            />
          ) : globalSelectedKey === "header" ? (
            <HeaderEditor
              appearance={chromeAppearance}
              headerActions={chrome.draft.headerActions}
              headerSearch={chrome.draft.headerSearch}
              logo={chrome.draft.logo}
              onChangeAppearance={setChromeAppearance}
              onChangeHeaderActions={(headerActions) => chrome.setDraft({ ...chrome.draft, headerActions })}
              onChangeHeaderSearch={(headerSearch) => chrome.setDraft({ ...chrome.draft, headerSearch })}
              onChangeLogo={(logo) => chrome.setDraft({ ...chrome.draft, logo })}
            />
          ) : (
            <FooterColumnsEditor
              appearance={chromeAppearance}
              onChange={(footerColumns) => chrome.setDraft({ ...chrome.draft, footerColumns })}
              onChangeAppearance={setChromeAppearance}
              value={chrome.draft.footerColumns}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
