"use client";

import { LinkBrandsProvider } from "@/components/dashboard/storefront/LinkPicker";
import { ExternalLink, Eye, EyeOff, Loader2, Monitor, MoreHorizontal, PanelTop, Pencil, Redo2, RotateCcw, Smartphone, Tablet, Undo2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
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
import { FooterColumnsEditor, HeaderEditor, LogoEditor, ThemeEditor, TopBarEditor } from "@/components/dashboard/storefront/globalEditors";
import { CategoryStripEditor, NavigationItemEditor } from "@/components/dashboard/storefront/NavigationEditors";
import { NavigationList } from "@/components/dashboard/storefront/NavigationList";
import { SectionList } from "@/components/dashboard/storefront/SectionList";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/dashboard/cn";
import { SaveToast, useSavedFlash } from "@/components/ui/toast-save";
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
    // Cleared on the way in, like doSave does. Without this a failure from
    // an earlier attempt stayed on screen through every later success —
    // which is how a validation error that had already been fixed kept
    // being read as the current state of the document.
    setSaveError("");
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
    setSaveError("");
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
    return <p className="text-sm text-muted-foreground">Choisissez une section dans la liste pour la modifier.</p>;
  }

  // Rails are dynamic — one entry per configured rail, addressed as
  // "rail:<key>" — so they are resolved by lookup, not by the registry.
  if (selectedKey.startsWith("rail:")) {
    const railKey = selectedKey.slice("rail:".length);
    const railIndex = draft.rails.findIndex((r) => r.key === railKey);
    if (railIndex === -1) return <p className="p-4 text-sm text-muted-foreground">Ce rail n&apos;existe plus.</p>;
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
      <p className="p-4 text-sm text-muted-foreground">
        Ce bloc n&apos;a pas encore de contenu éditable depuis le builder — seules sa visibilité et sa position
        peuvent être modifiées pour le moment.
      </p>
    );
  }

  return <LinkBrandsProvider brands={brands}>{renderEditor({ draft, update, brands })}</LinkBrandsProvider>;
}

const GLOBAL_ITEMS = [
  { key: "logo", label: "Logo" },
  { key: "topBar", label: "Bandeau d'annonce" },
  { key: "header", label: "En-tête" },
  { key: "footer", label: "Pied de page" },
] as const;
type GlobalItemKey = (typeof GLOBAL_ITEMS)[number]["key"];
type BuilderTab = "home" | "navigation" | "theme" | "global";

/** Where the builder opens. `?tab=global&panel=logo` and
 * `?tab=home&section=coffrets` are what the sidebar's "Logo" and "Coffrets &
 * cadeaux" links point at; anything unrecognised opens the default view.
 * The builder also writes its own position back here (see the URL sync in
 * StorefrontBuilder), so a reload reopens what was being edited. */
export type BuilderEntry = { tab?: string; panel?: string; section?: string; item?: string };

/** The home section an entry asks to open, if it names one the draft has. */
function entrySection(entry: BuilderEntry | undefined, draft: HomeDraft): SectionEntryKey | null {
  if (!entry?.section) return null;
  return draft.sections.find((s) => s.key === entry.section)?.key ?? null;
}

function resolveEntry(entry: BuilderEntry | undefined): { tab: BuilderTab; panel: GlobalItemKey } {
  const tabs: BuilderTab[] = ["home", "navigation", "theme", "global"];
  const tab = tabs.find((t) => t === entry?.tab) ?? "home";
  const panel = GLOBAL_ITEMS.find((item) => item.key === entry?.panel)?.key ?? "logo";
  return { tab, panel };
}

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
  instagramPostCount,
  entry,
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
  /** Published Instagram posts, for the "hidden on the site" hint. */
  instagramPostCount?: number;
  /** Tab and panel to open on, from the URL. */
  entry?: BuilderEntry;
}) {
  const [activeTab, setActiveTab] = useState<BuilderTab>(() => resolveEntry(entry).tab);
  const [globalSelectedKey, setGlobalSelectedKey] = useState<GlobalItemKey>(() => resolveEntry(entry).panel);
  const [navSelectedIndex, setNavSelectedIndex] = useState<number>(() => {
    const n = Number(entry?.item);
    return Number.isInteger(n) && n >= 0 && n < initialNavigationDraft.items.length ? n : 0;
  });

  const [selectedKey, setSelectedKey] = useState<SectionEntryKey | null>(() => entrySection(entry, initialDraft));
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  // Below 1400px (the app sidebar takes 256 of it) only one pane fits: the list, the editor or the
  // preview. Opening on the editor when the URL already names something to
  // edit is what makes a reload land back where the editor was.
  const [pane, setPane] = useState<Pane>(() => (entry?.section || entry?.panel || entry?.item ? "edit" : "list"));
  const [showPreview, setShowPreview] = useStoredFlag("sfb:preview", true);
  const [previewNonce, setPreviewNonce] = useState(0);

  // Remounts the preview iframe. Handed to each draft rather than watched from
  // an effect: an effect on four save states cannot tell "this one just
  // saved" from "that one is still saved", and reloaded the preview under the
  // editor's hands whenever any other panel started saving.
  const refreshPreview = useCallback(() => setPreviewNonce((n) => n + 1), []);
  // The floating save pill: this page saves by itself, so the pill only
  // reports — "Enregistrement…", then a moment of "Modifications
  // enregistrées" after each autosave lands.
  const [savedFlash, flashSaved] = useSavedFlash();
  const onDraftSaved = useCallback(() => {
    refreshPreview();
    flashSaved();
  }, [refreshPreview, flashSaved]);

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
    onSaved: onDraftSaved,
  });

  const { draft, setDraft, undo, redo } = home;

  // A new entry from the URL (a sidebar shortcut clicked while the
  // builder is already open) moves to it. Adjusted during render rather than
  // by remounting, so unsaved edits in the drafts survive the jump.
  const entryKey = `${entry?.tab ?? ""}|${entry?.panel ?? ""}|${entry?.section ?? ""}`;
  const [seenEntryKey, setSeenEntryKey] = useState(entryKey);
  if (entryKey !== seenEntryKey) {
    setSeenEntryKey(entryKey);
    if (entry?.tab) {
      const next = resolveEntry(entry);
      setActiveTab(next.tab);
      setGlobalSelectedKey(next.panel);
      const section = entrySection(entry, draft);
      if (section) setSelectedKey(section);
    }
  }

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
    onSaved: onDraftSaved,
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
    onSaved: onDraftSaved,
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
    onSaved: onDraftSaved,
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

  // Theme has nothing to pick from: its editor is the whole page.
  const hasList = activeTab !== "theme";
  const listRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionKey =
    activeTab === "home" ? selectedKey ?? "" : activeTab === "navigation" ? String(navSelectedIndex) : activeTab === "global" ? globalSelectedKey : "";

  // Where the builder is, written to the URL. replaceState rather than a
  // router navigation: nothing on the server needs to know, and a navigation
  // would re-run the page's seven Payload fetches on every click.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (activeTab === "home" && selectedKey) params.set("section", selectedKey);
    if (activeTab === "navigation") params.set("item", String(navSelectedIndex));
    if (activeTab === "global") params.set("panel", globalSelectedKey);
    const next = `${window.location.pathname}?${params.toString()}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [activeTab, selectedKey, navSelectedIndex, globalSelectedKey]);

  // Scroll positions survive a reload: the list per tab, the editor per
  // thing being edited. Restored before paint so the panes don't visibly jump.
  // `pane` is passed so a pane that was hidden (display: none, scrollTop
  // ignored) gets its position back when it is shown again.
  useScrollMemory(listRef, `sfb:list:${activeTab}`, pane);
  useScrollMemory(editorRef, `sfb:editor:${activeTab}:${selectionKey}`, pane);

  function openTab(tab: BuilderTab) {
    setActiveTab(tab);
    setPane(tab === "theme" ? "edit" : "list");
  }

  function select<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPane("edit");
    };
  }

  const saveLabel =
    active.saveState === "saving" ? (
      <span className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Enregistrement…
      </span>
    ) : active.saveState === "error" ? (
      <span className="text-destructive">{active.saveError}</span>
    ) : active.dirty ? (
      "Modifications en attente"
    ) : active.saveState === "saved" ? (
      "Brouillon enregistré"
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/50">
      {/* Toolbar: what is being edited, its state, and the one action that
          matters (Publier). Everything rarer sits behind the "…" menu. */}
      <div className="flex-none border-b border-border bg-card">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold text-foreground">Storefront</h1>
            <span
              className={cn(
                "flex-none rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                active.status === "published" ? "bg-success/10 text-success-strong" : "bg-warning/10 text-warning-strong",
              )}
            >
              {active.status === "published" ? "Publié" : "Non publié"}
            </span>
            <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:block" aria-live="polite">
              {saveLabel}
            </span>
          </div>

          <div className="flex flex-none items-center gap-1.5">
            {activeKind === "home" && (
              <div className="hidden items-center sm:flex">
                <Button type="button" variant="ghost" size="icon-sm" onClick={home.undo} disabled={!home.canUndo} aria-label="Annuler la dernière modification">
                  <Undo2 />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={home.redo} disabled={!home.canRedo} aria-label="Rétablir">
                  <Redo2 />
                </Button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon-sm" aria-label="Plus d'actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={() => window.open(previewSrc, "_blank")}>
                  <ExternalLink /> Aperçu dans un nouvel onglet
                </DropdownMenuItem>
                {activeKind === "home" && (
                  <>
                    <DropdownMenuItem className="sm:hidden" disabled={!home.canUndo} onSelect={home.undo}>
                      <Undo2 /> Annuler la dernière modification
                    </DropdownMenuItem>
                    <DropdownMenuItem className="sm:hidden" disabled={!home.canRedo} onSelect={home.redo}>
                      <Redo2 /> Rétablir
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={active.discarding} onSelect={() => active.handleDiscard()}>
                  <RotateCcw /> Revenir à la version publiée
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" onClick={() => active.handlePublish()} disabled={active.publishing}>
              {active.publishing ? <Loader2 className="animate-spin" /> : null}
              Publier
            </Button>
          </div>
        </div>

        <nav aria-label="Parties de la boutique" className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => openTab(key)}
              aria-current={activeTab === key ? "page" : undefined}
              className={cn(
                "-mb-px flex-none border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "global" ? (
                <>
                  En-tête &amp; pied<span className="hidden sm:inline"> de page</span>
                </>
              ) : (
                label
              )}
            </button>
          ))}
        </nav>
      </div>

      {confirmDiscard && (
        <Modal title="Revenir à la version publiée ?" onClose={() => setConfirmDiscard(false)}>
          <p className="text-sm text-muted-foreground">
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

      {/* Pane switcher, below the wide layout. Phones get all three panes;
          from `lg` the list always shows, so only editor/preview remain. */}
      <div className="flex flex-none gap-1 border-b border-border bg-card px-3 py-2 min-[1400px]:hidden" role="group" aria-label="Affichage">
        {(
          [
            ["list", "Sections", PanelTop],
            ["edit", "Modifier", Pencil],
            ["preview", "Aperçu", Eye],
          ] as const
        )
          .filter(([key]) => key !== "list" || hasList)
          .map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPane(key)}
              aria-pressed={pane === key || (key === "edit" && pane === "list" && !hasList)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground aria-pressed:bg-primary/10 aria-pressed:text-primary",
                key === "list" && "lg:hidden",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {hasList && (
          <aside
            ref={listRef}
            className={cn(
              "min-h-0 w-full flex-none flex-col overflow-y-auto border-r border-border bg-card p-3 lg:flex lg:w-72",
              pane === "list" ? "flex" : "hidden",
            )}
          >
            {activeTab === "home" ? (
              <SectionList
                sections={draft.sections}
                onChange={(sections) => update({ sections })}
                selectedKey={selectedKey}
                onSelect={select(setSelectedKey)}
                rails={draft.rails}
                onAddRail={() => {
                  handleAddRail();
                  setPane("edit");
                }}
                onDeleteRail={handleDeleteRail}
                draft={draft}
                instagramPostCount={instagramPostCount}
                onOpenCategories={() => openTab("navigation")}
                onOpenLogo={() => {
                  openTab("global");
                  setGlobalSelectedKey("logo");
                  setPane("edit");
                }}
              />
            ) : activeTab === "navigation" ? (
              <NavigationList
                items={navigation.draft.items}
                onChange={(items) => navigation.setDraft({ ...navigation.draft, items })}
                selectedIndex={navSelectedIndex}
                onSelect={select(setNavSelectedIndex)}
                onAdd={() => {
                  handleAddNavItem();
                  setPane("edit");
                }}
              />
            ) : (
              <div className="flex flex-col gap-1">
                {GLOBAL_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => select(setGlobalSelectedKey)(item.key)}
                    aria-current={globalSelectedKey === item.key ? "true" : undefined}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm font-medium",
                      globalSelectedKey === item.key ? "border-primary/40 bg-primary/10 text-primary" : "border-transparent text-foreground hover:bg-muted/50",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        <div
          ref={editorRef}
          className={cn(
            "min-h-0 min-w-0 flex-col overflow-y-auto bg-card",
            pane === "edit" || (pane === "list" && !hasList) ? "flex" : "hidden",
            pane === "preview" ? "lg:hidden" : "lg:flex",
            "min-[1400px]:flex",
            showPreview ? "flex-1 min-[1400px]:w-[440px] min-[1400px]:flex-none min-[1400px]:border-r min-[1400px]:border-border 2xl:w-[520px]" : "flex-1",
          )}
        >
          <div className={cn("w-full p-4 sm:p-5", !showPreview && "mx-auto max-w-3xl")}>
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
                  <p className="text-sm text-muted-foreground">Choisissez un lien dans la liste pour le modifier.</p>
                )}

                <div className="border-t border-border pt-5">
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
            ) : globalSelectedKey === "logo" ? (
              <LogoEditor logo={chrome.draft.logo} onChange={(logo) => chrome.setDraft({ ...chrome.draft, logo })} />
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
                onChangeAppearance={setChromeAppearance}
                onChangeHeaderActions={(headerActions) => chrome.setDraft({ ...chrome.draft, headerActions })}
                onChangeHeaderSearch={(headerSearch) => chrome.setDraft({ ...chrome.draft, headerSearch })}
              />
            ) : (
              <FooterColumnsEditor
                appearance={chromeAppearance}
                onChange={(footerColumns) => chrome.setDraft({ ...chrome.draft, footerColumns })}
                onChangeAppearance={setChromeAppearance}
                value={chrome.draft.footerColumns}
              />
            )}
          </div>
        </div>

        <section
          aria-label="Aperçu de la boutique"
          className={cn("min-h-0 min-w-0 flex-1 flex-col bg-muted", pane === "preview" ? "flex" : "hidden", showPreview ? "min-[1400px]:flex" : "min-[1400px]:hidden")}
        >
          <div className="flex flex-none items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-1.5">
            <div className="flex items-center gap-0.5" role="group" aria-label="Taille de l'aperçu">
              {(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((v) => {
                const Icon = v === "desktop" ? Monitor : v === "tablet" ? Tablet : Smartphone;
                return (
                  <Button
                    key={v}
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewport(v)}
                    aria-label={VIEWPORT_LABELS[v]}
                    aria-pressed={viewport === v}
                    className="aria-pressed:bg-primary/10 aria-pressed:text-primary"
                  >
                    <Icon />
                  </Button>
                );
              })}
            </div>
            <Button type="button" variant="ghost" size="sm" className="hidden min-[1400px]:inline-flex" onClick={() => setShowPreview(false)}>
              <EyeOff /> Masquer l&apos;aperçu
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-3 sm:p-4">
            <iframe
              key={previewNonce}
              src={previewSrc}
              title="Aperçu du storefront"
              className="h-full rounded-lg border border-border bg-card shadow-sm transition-all"
              style={{ width: VIEWPORTS[viewport], maxWidth: "100%" }}
            />
          </div>
        </section>

        {!showPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="fixed right-6 bottom-6 z-20 hidden shadow-md min-[1400px]:inline-flex"
            onClick={() => setShowPreview(true)}
          >
            <Eye /> Afficher l&apos;aperçu
          </Button>
        )}
      </div>
      <SaveToast
        state={active.saveState === "saving" ? "saving" : active.saveState === "error" ? "error" : savedFlash ? "saved" : "idle"}
        errorMessage={active.saveError}
      />
    </div>
  );
}

type Pane = "list" | "edit" | "preview";

const TABS = [
  ["home", "Accueil"],
  ["navigation", "Menu"],
  ["theme", "Couleurs"],
  ["global", "En-tête & pied de page"],
] as const satisfies readonly (readonly [BuilderTab, string])[];

const VIEWPORT_LABELS: Record<keyof typeof VIEWPORTS, string> = {
  desktop: "Aperçu ordinateur",
  tablet: "Aperçu tablette",
  mobile: "Aperçu téléphone",
};

/** A boolean kept in localStorage — a per-person preference, like whether
 * the preview pane is open. Falls back to the default where storage is
 * unavailable. */
function useStoredFlag(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(stored === "1");
    } catch {}
  }, [key]);
  const set = useCallback(
    (v: boolean) => {
      setValue(v);
      try {
        window.localStorage.setItem(key, v ? "1" : "0");
      } catch {}
    },
    [key],
  );
  return [value, set];
}

/** Remembers an element's scroll position in sessionStorage under `key` and
 * puts it back when the key comes round again — including after a reload,
 * which is what used to send the editor back to the top of every list. */
function useScrollMemory(ref: React.RefObject<HTMLElement | null>, key: string, visibility: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const saved = Number(window.sessionStorage.getItem(key));
      el.scrollTop = Number.isFinite(saved) ? saved : 0;
    } catch {}
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          window.sessionStorage.setItem(key, String(el.scrollTop));
        } catch {}
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [ref, key, visibility]);
}
