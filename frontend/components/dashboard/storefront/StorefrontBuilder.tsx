"use client";

import { Loader2, Monitor, PanelTop, Redo2, RotateCcw, Smartphone, Tablet, Undo2 } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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
import { SingleRailEditor, newRail } from "@/components/dashboard/storefront/editors";
import {
  SECTION_EDITORS,
  type BrandOption,
} from "@/components/dashboard/storefront/sectionEditors";
import { FooterColumnsEditor, HeaderEditor, ThemeEditor, TopBarEditor } from "@/components/dashboard/storefront/globalEditors";
import { CategoryStripEditor, NavigationItemEditor } from "@/components/dashboard/storefront/NavigationEditors";
import { NavigationList } from "@/components/dashboard/storefront/NavigationList";
import { SectionList } from "@/components/dashboard/storefront/SectionList";
import { Button } from "@/components/dashboard/ui/Button";
import { Modal } from "@/components/dashboard/ui/Modal";
import {
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

/** The draft under edit, plus the undo stack it moves along. */
type DraftState<T> = { draft: T; past: T[]; cursor: number };

type DraftAction<T> =
  | { type: "set"; value: T | ((prev: T) => T); record: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; value: T };

/**
 * Editing and time travel in one transition.
 *
 * The stack used to live beside the draft in two refs, mutated from inside a
 * setState updater. That broke the rule that updaters are pure and may run
 * more than once: under StrictMode React invokes them twice, so a single edit
 * pushed two entries and undo appeared to do nothing. The cursor was then read
 * back during render to grey out the buttons, one render behind the truth.
 *
 * Neither is expressible here. The stack moves with the draft instead of
 * chasing it, and every case derives its result from the state it was handed.
 */
export function draftReducer<T>(state: DraftState<T>, action: DraftAction<T>): DraftState<T> {
  switch (action.type) {
    case "set": {
      const draft = typeof action.value === "function" ? (action.value as (prev: T) => T)(state.draft) : action.value;
      if (draft === state.draft) return state;
      if (!action.record) return { ...state, draft };
      // Editing after an undo drops whatever had been redone past this point.
      return { draft, past: [...state.past.slice(0, state.cursor + 1), draft], cursor: state.cursor + 1 };
    }
    case "undo":
      return state.cursor === 0 ? state : { ...state, cursor: state.cursor - 1, draft: state.past[state.cursor - 1] };
    case "redo":
      return state.cursor >= state.past.length - 1
        ? state
        : { ...state, cursor: state.cursor + 1, draft: state.past[state.cursor + 1] };
    // Discarding restores the published document; there is nothing left to undo.
    case "reset":
      return { draft: action.value, past: [action.value], cursor: 0 };
  }
}

/** Shared autosave/publish/discard lifecycle for a single Payload global's
 * draft. Every panel of the builder runs on this one — Home, Navigation,
 * Theme and Site Chrome — so there is a single place where "dirty", "saving"
 * and "published" mean what they say.
 *
 * Home is the only one that also wants undo/redo, so `history` is opt-in
 * rather than a second copy of the hook. */
function useGlobalDraft<T>({
  initial,
  initialStatus,
  mapDraftToPayload: toPayload,
  mapDocToDraft,
  save,
  publish,
  discard,
  history: withHistory = false,
  onSaved,
}: {
  initial: T;
  initialStatus: string;
  mapDraftToPayload: (draft: T) => Record<string, unknown>;
  mapDocToDraft: (doc: unknown) => T;
  save: (payload: Record<string, unknown>) => Promise<{ error?: string }>;
  publish: (payload: Record<string, unknown>) => Promise<{ error?: string; warning?: string }>;
  discard: () => Promise<{ error?: string; doc?: unknown }>;
  history?: boolean;
  /** Ran after anything that changed what the storefront would render. */
  onSaved?: () => void;
}) {
  const [{ draft, past, cursor }, dispatch] = useReducer(draftReducer<T>, {
    draft: initial,
    past: [initial],
    cursor: 0,
  });
  const [status, setStatus] = useState(initialStatus);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  // State rather than a ref: `dirty` is read while rendering, to label the
  // toolbar "Modifications non enregistrées".
  const [lastSaved, setLastSaved] = useState(() => JSON.stringify(initial));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = JSON.stringify(draft) !== lastSaved;

  // Same signature as a useState setter, so callers pass a value or an
  // updater and never touch the undo stack themselves.
  const setDraft = useCallback(
    (value: T | ((prev: T) => T)) => dispatch({ type: "set", value, record: withHistory }),
    [withHistory],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const canUndo = withHistory && cursor > 0;
  const canRedo = withHistory && cursor < past.length - 1;

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
      setLastSaved(JSON.stringify(current));
      setSaveState("saved");
      onSaved?.();
    },
    [save, toPayload, onSaved],
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
    setLastSaved(JSON.stringify(draft));
    setStatus("published");
    setSaveState("saved");
    onSaved?.();
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
    dispatch({ type: "reset", value: restored });
    setLastSaved(JSON.stringify(restored));
    setStatus("published");
    setSaveState("saved");
    onSaved?.();
  }

  return {
    canRedo,
    canUndo,
    discarding,
    dirty,
    draft,
    handleDiscard,
    handlePublish,
    publishing,
    redo,
    saveError,
    saveState,
    setDraft,
    status,
    undo,
  };
}

/**
 * Renders the editor for whatever is selected in the left-hand list.
 *
 * The per-section wiring lives in SECTION_EDITORS; this only resolves what
 * kind of thing is selected. It used to be a 110-line `switch` whose
 * `default: return null` quietly swallowed any section nobody had wired up.
 */
function SectionEditor({
  selectedKey,
  draft,
  update,
  brands,
}: {
  selectedKey: SectionEntryKey | null;
  draft: HomeDraft;
  update: (patch: Partial<HomeDraft>) => void;
  brands: BrandOption[];
}) {
  if (!selectedKey) {
    return <p className="p-4 text-sm text-gray-400">Sélectionnez une section à gauche pour la modifier.</p>;
  }

  // Rails are dynamic — one entry per configured rail, addressed as
  // "rail:<key>" — so they are resolved by lookup, not by the registry.
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

  const renderEditor = SECTION_EDITORS[selectedKey as SectionKey];
  if (!renderEditor) {
    return (
      <p className="p-4 text-sm text-gray-500">
        Ce bloc n&apos;a pas encore de contenu éditable depuis le builder — seules sa visibilité et sa position
        peuvent être modifiées pour le moment.
      </p>
    );
  }

  return <>{renderEditor({ draft, update, brands })}</>;
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

  const [selectedKey, setSelectedKey] = useState<SectionEntryKey | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [previewNonce, setPreviewNonce] = useState(0);

  // Remounts the preview iframe. Handed to each draft rather than watched from
  // an effect: an effect on four save states cannot tell "this one just
  // saved" from "that one is still saved", and reloaded the preview under the
  // editor's hands whenever any other panel started saving.
  const refreshPreview = useCallback(() => setPreviewNonce((n) => n + 1), []);

  const home = useGlobalDraft<HomeDraft>({
    initial: initialDraft,
    initialStatus,
    mapDraftToPayload,
    mapDocToDraft: mapHomeDocToDraft,
    save: saveHomeDraft,
    publish: publishHome,
    discard: async () => {
      const res = await discardDraft();
      return { error: res.error, doc: res.home };
    },
    history: true,
    onSaved: refreshPreview,
  });

  const { draft, setDraft, undo, redo } = home;

  const update = useCallback(
    (patch: Partial<HomeDraft>) => setDraft((prev) => ({ ...prev, ...patch })),
    [setDraft],
  );

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
  }, [activeTab, undo, redo]);

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
    onSaved: refreshPreview,
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
    onSaved: refreshPreview,
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
    onSaved: refreshPreview,
  });

  function handleAddNavItem() {
    navigation.setDraft({ ...navigation.draft, items: [...navigation.draft.items, emptyNavItem()] });
    setNavSelectedIndex(navigation.draft.items.length);
  }

  // The top toolbar (save state, undo/redo, discard, publish) always acts on
  // whichever draft is currently open — Home, Navigation, Theme (Apparence),
  // or Site Chrome (Top Bar/Header/Footer, under "Global").
  const activeKind = activeTab === "home" ? "home" : activeTab === "navigation" ? "navigation" : activeTab === "theme" ? "theme" : "chrome";
  const active =
    activeKind === "home"
      ? // Home is the one panel that asks before discarding: it is the only
        // draft with an undo stack to lose along with the edits.
        { ...home, handleDiscard: () => setConfirmDiscard(true) }
      : activeKind === "theme"
        ? theme
        : activeKind === "navigation"
          ? navigation
          : chrome;

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
              <button type="button" onClick={home.undo} disabled={!home.canUndo} aria-label="Annuler" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={home.redo}
                disabled={!home.canRedo}
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
            onClick={() => active.handleDiscard()}
            disabled={active.discarding}
          >
            {active.discarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Annuler le brouillon
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.open(previewSrc, "_blank")}>
            Aperçu
          </Button>
          <Button type="button" size="sm" onClick={() => active.handlePublish()} disabled={active.publishing}>
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
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={home.discarding}
              onClick={async () => {
                await home.handleDiscard();
                setConfirmDiscard(false);
              }}
            >
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
              onChange={(items) => navigation.setDraft({ ...navigation.draft, items })}
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
            // The strip is always visible in this panel rather than being a
            // thirteenth entry in the list on the left: it is not one more
            // navigation link, it is a separate surface that happens to be
            // built from the same links, and hiding it behind a selection
            // would leave editors hunting for where categories are set.
            <div className="flex flex-col gap-6">
              {navigation.draft.items[navSelectedIndex] ? (
                <NavigationItemEditor
                  value={navigation.draft.items[navSelectedIndex]}
                  onChange={(item) => {
                    const items = [...navigation.draft.items];
                    items[navSelectedIndex] = item;
                    navigation.setDraft({ ...navigation.draft, items });
                  }}
                  categories={categories}
                  brands={brands}
                />
              ) : (
                <p className="text-sm text-gray-400">Sélectionnez un lien à gauche pour le modifier.</p>
              )}

              <div className="border-t border-gray-200 pt-5">
                <CategoryStripEditor
                  value={navigation.draft.catStrip}
                  onChange={(catStrip) => navigation.setDraft({ ...navigation.draft, catStrip })}
                  categories={categories}
                  brands={brands}
                />
              </div>
            </div>
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
