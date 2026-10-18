"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { publishSiteChrome, saveSiteChromeDraft } from "@/app/dashboard/(app)/storefront/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LogoEditor } from "@/components/dashboard/storefront/globalEditors";
import { useToast } from "@/components/dashboard/ui/Toast";
import { Button } from "@/components/ui/button";
import { SaveToast, useSavedFlash } from "@/components/ui/toast-save";
import { mapSiteChromeDraftToPayload, type SiteChromeDraft } from "@/lib/dashboard/storefront-mapping";

/** The storefront footer's own ground (--pdh-plum-dark), unless the footer
 * appearance overrides it. */
const FOOTER_BG = "#3b2650";
const FOOTER_TEXT = "#f7eee5";

function Mark({ src, size }: { src: string; size: number }) {
  return (
    // Not cropped: the preview shows the file as the storefront will, white
    // square included, which is the very thing the footer logo is for.
    <span className="relative flex-none" style={{ height: size, width: size }}>
      <Image src={src || "/assets/logo.png"} alt="" fill sizes={`${size}px`} className="object-contain" />
    </span>
  );
}

/**
 * The logo, on a page of its own: the header mark, the footer mark (the
 * footer is dark, and a logo on a white square reads as a sticker there),
 * the lettering beside them and where a click leads — with both places
 * previewed as the storefront draws them.
 *
 * It edits the same Site Chrome draft as the Storefront Builder's Global tab
 * and saves the whole of it, so "Publier" also puts live any other pending
 * header/footer change.
 */
export function LogoManager({ initialDraft, initialStatus }: { initialDraft: SiteChromeDraft; initialStatus: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(() => JSON.stringify(initialDraft));
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [savedFlash, flashSaved] = useSavedFlash();
  const dirty = useMemo(() => JSON.stringify(draft) !== saved, [draft, saved]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const { logo } = draft;
  const footerBg = draft.footerAppearance.backgroundColor || FOOTER_BG;
  const footerText = draft.footerAppearance.textColor || FOOTER_TEXT;

  async function run(kind: "save" | "publish") {
    setBusy(kind);
    const payload = mapSiteChromeDraftToPayload(draft);
    const res = kind === "save" ? await saveSiteChromeDraft(payload) : await publishSiteChrome(payload);
    setBusy(null);
    if (res.error) return toast.error(kind === "save" ? "Enregistrement impossible" : "Publication impossible", res.error);
    setSaved(JSON.stringify(draft));
    setStatus(kind === "save" ? "draft" : "published");
    const warning = (res as { warning?: string }).warning;
    if (warning) toast.error("Publié, avec un avertissement", warning);
    else flashSaved();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Logo"
        description="Le logo de l'en-tête, celui du pied de page et le texte affiché à côté."
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Voir le site
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => run("save")} disabled={!dirty || busy !== null}>
              {busy === "save" && <Loader2 className="size-4 animate-spin" />} Enregistrer
            </Button>
            <Button size="sm" onClick={() => run("publish")} disabled={busy !== null || (!dirty && status === "published")}>
              {busy === "publish" && <Loader2 className="size-4 animate-spin" />} Publier
            </Button>
          </>
        }
      />

      <p className={`text-sm ${dirty ? "font-medium text-warning-strong" : status === "published" ? "text-success-strong" : "text-warning-strong"}`}>
        {dirty ? "Modifications non enregistrées" : status === "published" ? "En ligne" : "Brouillon non publié"}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card p-5">
          <LogoEditor logo={logo} onChange={(next) => setDraft((d) => ({ ...d, logo: next }))} />
        </div>

        <div className="flex flex-col gap-4">
          <section aria-label="Aperçu de l'en-tête" className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">En-tête</p>
            <div className="flex items-center gap-3 bg-white px-6 py-5">
              <Mark src={logo.image.url} size={42} />
              <span className="text-2xl tracking-wide text-[#373020] lowercase">{logo.wordmark}</span>
            </div>
          </section>

          <section aria-label="Aperçu du pied de page" className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              Pied de page {logo.footerImage.url ? "" : "· reprend le logo de l'en-tête"}
            </p>
            <div className="flex items-center gap-3.5 px-6 py-6" style={{ background: footerBg, color: footerText }}>
              <Mark src={logo.footerImage.url || logo.image.url} size={64} />
              <span className="text-lg tracking-wide lowercase">{logo.wordmark}</span>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            « Publier » met en ligne le logo, ainsi que toute autre modification de l&apos;en-tête ou du pied de page restée en brouillon dans le Storefront.
          </p>
        </div>
      </div>

      <SaveToast
        state={busy ? "saving" : savedFlash ? "saved" : dirty ? "dirty" : "idle"}
        onReset={() => setDraft(JSON.parse(saved))}
        secondary={{ label: "Brouillon", onClick: () => run("save") }}
        onSave={() => run("publish")}
        saveLabel="Publier"
      />
    </div>
  );
}
