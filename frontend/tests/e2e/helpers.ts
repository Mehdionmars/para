import type { Page } from "@playwright/test";

export const STOREFRONT_ROUTES = [
  "/",
  "/catalogue",
  "/panier",
  "/contact",
  "/services",
  "/suivi-commande",
  "/favoris",
  "/marques",
  "/collections",
  "/produit/la-roche-posay-lipikar-huile-lavante-400ml",
];

export const VIEWPORTS = [390, 414, 768, 1024, 1280, 1366, 1440, 1920];

export const INTERACTIVE_SELECTOR =
  'a,button,input,select,textarea,summary,[role="button"],[role="link"],[role="menuitem"]';

/**
 * The rule under test, measured rather than eyeballed: how much wider an
 * interactive box is than the content a visitor can actually see inside it.
 * A Range over the element's own contents gives the ink's width, so a link
 * that reads "paradhiver@gmail.com" but stretches the width of its card
 * reports the empty remainder as slack.
 */
export async function measureContactLinks(page: Page) {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"],a[href^="mailto:"]')];
    return links
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => {
        const box = el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el);
        const ink = range.getBoundingClientRect();

        // Where a link draws itself a container — a background, a border —
        // it is presenting itself as a card, and the whole card is honestly
        // the target. The rule under test is about the other kind: a bare
        // line of text that silently became as wide as its column. The
        // distinction is what the visitor can see, so it is read off the
        // painted styles rather than off a class name.
        const cs = getComputedStyle(el);
        const hasFill = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
        const hasEdge = ["Top", "Right", "Bottom", "Left"].some((side) => {
          const w = parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) || 0;
          const style = cs.getPropertyValue(`border-${side.toLowerCase()}-style`);
          return w > 0 && style !== "none" && style !== "hidden";
        });

        return {
          href: el.getAttribute("href") || "",
          text: (el.textContent || "").trim().slice(0, 40),
          boxWidth: Math.round(box.width),
          inkWidth: Math.round(ink.width),
          slack: Math.round(box.width - ink.width),
          isCard: hasFill || hasEdge,
        };
      });
  });
}

/** Interactive elements nested inside other interactive elements. */
export async function findNestedInteractives(page: Page, selector = INTERACTIVE_SELECTOR) {
  return page.evaluate((sel) => {
    const out: { outer: string; inner: string }[] = [];
    for (const el of document.querySelectorAll(sel)) {
      // A <label> legitimately contains its own control, and the modal
      // backdrops are aria-hidden click-catchers rather than controls.
      const inner = el.querySelector(sel);
      if (!inner) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      out.push({
        outer: `${el.tagName}${el.className ? "." + String(el.className).split(" ")[0] : ""}`,
        inner: `${inner.tagName}${inner.className ? "." + String(inner.className).split(" ")[0] : ""}`,
      });
    }
    return out;
  }, selector);
}

/**
 * Effective touch target, accounting for the invisible ::before boxes this
 * codebase uses to grow a hit area without growing what is drawn.
 */
export async function findSmallTargets(page: Page, min = 40) {
  return page.evaluate((minSize) => {
    const px = (v: string) => (v && v.endsWith("px") ? parseFloat(v) : 0);
    const out: { tag: string; label: string; w: number; h: number }[] = [];
    const sel = 'a,button,[role="button"],[role="link"],[role="menuitem"],summary';

    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.querySelector("input,select,textarea")) continue;

      // Icon-only controls are what the 44px floor is for; a control with a
      // text label is read and tapped as a word, and shrinking to its glyph
      // height is not the same hazard.
      const text = (el.textContent || "").trim();
      if (text.length > 2) continue;

      let w = r.width;
      let h = r.height;
      const before = getComputedStyle(el, "::before");
      if (before.content && before.content !== "none" && before.position === "absolute") {
        w = r.width - px(before.left) - px(before.right);
        h = r.height - px(before.top) - px(before.bottom);
      }
      if (w < minSize || h < minSize) {
        out.push({
          tag: el.tagName,
          label: el.getAttribute("aria-label") || text || "(unlabelled)",
          w: Math.round(w),
          h: Math.round(h),
        });
      }
    }
    return out;
  }, min);
}

export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    // 1px of tolerance for sub-pixel rounding at fractional zoom.
    return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, overflows: de.scrollWidth > de.clientWidth + 1 };
  });
}
