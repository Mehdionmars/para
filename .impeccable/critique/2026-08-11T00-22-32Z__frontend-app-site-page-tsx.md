---
target: homepage
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 1
timestamp: 2026-08-11T00-22-32Z
slug: frontend-app-site-page-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Cart badge, toasts, animated shipping bar, `aria-current` carousel dots all give feedback; no loading/skeleton states evident. |
| 2 | Match System / Real World | 3 | MAD pricing, real Casablanca delivery language — undercut by the product-photo/brand mismatch (see P0 below). |
| 3 | User Control and Freedom | 3 | Escape/click-outside close every overlay; undercut by the broken mobile nav drawer (P0). |
| 4 | Consistency and Standards | 4 | Eyebrow + Jost h2 + one-liner + "Voir tout" template repeats identically across ~10 sections; disciplined plum/teal color coding throughout. |
| 5 | Error Prevention | 2 | Native email validation on the newsletter form; no defensive empty-state pattern visible in the rail components. |
| 6 | Recognition Rather Than Recall | 3 | Mega-menu labels categories directly; shipping threshold restated in-context; footer mirrors header categories. |
| 7 | Flexibility and Efficiency | 2 | Category tab filter and rail prev/next are real accelerators; nothing beyond that for repeat/expert users. |
| 8 | Aesthetic and Minimalist Design | 3 | Generous whitespace and a restrained palette, but the 11-item desktop nav overflows a 1440px viewport ("Services" clipped). |
| 9 | Error Recovery | 2 | The one tested recovery moment (empty cart state) is well done; little else is instrumented on a static marketing page. |
| 10 | Help and Documentation | 3 | A dedicated "Besoin d'aide ?" card plus a footer FAQ link is the right pattern for a landing page — undercut because the FAQ link is currently dead. |
| **Total** | | **28/40** | **Good (low end)** |

### Design Specificity Verdict

**LLM assessment**: The brand system is genuinely authored — a five-color palette (plum/teal/ink/cream/sand), a three-font hierarchy (Jost display, Poppins body, Raleway eyebrows), a custom canvas snow-particle ambience, a bespoke winter-tree logomark, and merchandising copy (actif-driven `DermoCorner` picks, pharmacist-voiced claims) that reads like a real pharmacist's assortment, not generic e-commerce filler. That verdict is seriously undercut by one thing: **every product photo across every section is a recycled flat-lay of anonymous "Para d'Hiver"-branded bottles, while the card underneath claims La Roche-Posay, CeraVe, Vichy, Bioderma, Avène, or Uriage.** None of these instantly-recognizable trademarked packagings actually appear. For a pharmacy whose own TopBar and TrustBar promise "Produits authentiques garantis," this is the fastest way to erode the exact trust the category depends on — the identity is specific and considered; the product imagery is not, and that gap is the single biggest risk on the page.

**Deterministic scan**: 21 files scanned (the full homepage entry, hero/particles, all 11 `components/home/` section files, all 7 `components/layout/` chrome files). Exit code 2 (findings present, not a crash). **2 findings total, both the same rule** (`layout-transition`, severity warning): `CartDrawer.tsx:99` and `Header.tsx:266` both animate `width` directly (the free-shipping progress-bar fill and the nav-item underline indicator) instead of a GPU-friendlier `transform: scaleX(...)`. Both are real, not false positives — confirmed by reading the surrounding code. No other rule category (spacing, contrast, type, a11y) fired anywhere across the 21 files.

**Visual overlay**: Not available this run — the isolated Assessment-B session's browser tool (Claude-in-Chrome) was not connected, so the live `detect.js` overlay and its own screenshots could not be captured (confirmed unavailable on two attempts, not silently skipped). Assessment A separately used Playwright successfully and captured real desktop/mobile evidence directly, including measuring the broken mobile-menu bug below — so browser inspection did happen this run, just through the other assessment's path rather than Assessment B's overlay injection.

### Overall Impression

The identity work here is well above the category average for a small-business storefront — a real point of view, not a template. But two things pull the score down hard: the product photography actively contradicts the "authentic products" promise the site itself makes, and the mobile hamburger menu is measurably broken (only ~21% of its own height renders, leaving 9 of 11 nav categories unreachable on the exact device profile — one-handed, distracted — this store's shoppers are likeliest to use). Fix those two and this jumps from "good bones, real problems" to genuinely strong.

### What's Working

1. **Coherent, bespoke identity** — palette, three-font system, custom snow-particle canvas, and winter-tree logomark reinforce one concept end-to-end from hero to newsletter.
2. **Real merchandising logic** — actif-driven `DermoCorner` picks, a functional gift-card range, alternating editorial/brand-spotlight rail inserts read like an actual pharmacist's assortment.
3. **Careful accessibility/micro-interaction details** — `aria-current` on carousel dots, `aria-pressed` on favorites, Escape-to-close on every overlay, `prefers-reduced-motion` honored both globally and in the particle system, a live-recalculating free-shipping progress bar.

### Priority Issues

**[P0] Product photography contradicts the claimed brand on every card**
- **Why it matters**: Every rail/grid shows a recycled "Para d'Hiver"-branded flat-lay under a named third-party brand (La Roche-Posay, CeraVe, Vichy...), directly beside a badge promising "Produits authentiques garantis." A shopper who notices — and dermocosmetics shoppers know their packaging — loses trust in the one thing a pharmacy sells on.
- **Fix**: Source real (or properly licensed) per-brand photography for at least the best-sellers; stop overlaying a competing house wordmark on a photo attributed to a named third-party brand.
- **Suggested command**: `/impeccable harden` (production-readiness / trust-claim correctness), or a content-ops fix outside Impeccable's scope if it's a sourcing problem rather than a design one.

**[P0] Mobile hamburger menu renders broken**
- **Why it matters**: Assessment A measured this directly (Playwright, 390×844 viewport): the drawer's dialog computes `position:fixed; inset:0` but its actual rendered box is only 390×179px at y=36 — 9 of 11 nav categories are unreachable, and the still-open hero is visible underneath. `CartDrawer` on the identical viewport correctly renders full-height, so this is specific to `MobileNavDrawer.tsx`, not a general viewport issue. This is the primary nav control for the store's most likely device profile.
- **Fix**: Trace why the dialog's own `inset:0` doesn't resolve to full viewport height; verify on a real device; add a small screenshot regression check at mobile widths.
- **Suggested command**: `/impeccable adapt` (device/screen-size adaptation), then `/impeccable audit` to confirm the fix.

**[P1] Cognitive load is at the critical band (4 of 8 checklist items fail)**
- **Why it matters**: 13 full-width sections stack into an ~11,000px desktop page with no differentiation of "the one thing to do here"; every section after the hero repeats the identical eyebrow/h2/CTA template at the same visual weight; a new decision (which rail, which coffret, which filter tab, newsletter) surfaces every 400–800px of scroll without resolving the last one; the 11-item nav plus search plus 4 icon actions are all visible before a single product loads.
- **Fix**: Fold long-tail nav categories under a "Plus" menu; vary section visual weight so 2–3 sections read as clearly primary and the rest recede.
- **Suggested command**: `/impeccable layout` (spacing, rhythm, hierarchy), possibly `/impeccable distill` if the goal is to cut section count outright.

**[P2] Two width-based CSS transitions animate a layout property instead of `transform`** *(caught by the deterministic scanner, not the manual review)*
- **Why it matters**: `CartDrawer.tsx:99` (free-shipping progress-bar fill) and `Header.tsx:266` (nav-item underline indicator) both animate `width` directly, which triggers layout/paint on every frame instead of a GPU-composited transform — a real but minor performance cost, most noticeable on lower-end mobile hardware, which is exactly the device profile most likely to visit this page.
- **Fix**: Switch both to `transform: scaleX(...)` with an appropriate `transform-origin`, keeping the same visual easing.
- **Suggested command**: `/impeccable optimize`

**[P2] Footer links are decorative, not functional**
- **Why it matters**: `Footer.tsx` hardcodes 10 of its 16 column links (FAQ, Nos pharmaciens, Routines, Conseils pharmaceutiques, etc.) to `href="/catalogue"` regardless of label. A visitor clicking "FAQ" lands on the shop instead — reads as either a bug or a bait-and-switch, and directly caused the Help-and-Documentation heuristic score above to drop from a 4.
- **Fix**: Wire real destinations as those pages ship, or visually de-emphasize/hide links to pages that don't exist yet rather than aliasing them all to the catalogue.
- **Suggested command**: `/impeccable clarify`

**[P3] TopBar ticker is fully `aria-hidden`, hiding trust claims from assistive tech**
- **Why it matters**: The 6 rotating messages (delivery, payment security, authenticity, free-shipping threshold) are marked `aria-hidden="true"`; only 4 of 6 are ever restated accessibly later in TrustBar — a screen-reader user never gets 2 of the 6 trust claims at all.
- **Fix**: Keep the marquee decorative if desired, but ensure every unique claim also exists as static accessible text reachable early in the page.
- **Suggested command**: `/impeccable harden`

### Persona Red Flags

**Jordan (Confused First-Timer)**: Lands on 11 nav categories + hero CTA + 2 CTA tiles simultaneously with no emphasized "first click." Hovering "Visage" in the mega-menu instantly reveals 16 subcategory choices across 4 columns with no softer "not sure? browse all" entry point. `DermoCorner` badges use unexplained jargon ("Zinc PCA," "UVMune 400," "Céramides") with no tooltip — Jordan gets an ingredient name, not what it does for them.

**Riley (Deliberate Stress Tester)**: Directly confirmed the broken mobile nav drawer (P0 above) — exactly the "does the UI hold up" edge case Riley probes, and it fails. Also found the footer's 10-of-16 dead-alias links (P2). `ProductCard.tsx`'s `rail` variant has no visible line-clamp/overflow guard on the name field (only the `promo`/`catalogue` variants reserve `minHeight`), so an unusually long CMS-authored product name risks breaking uniform card height across a rail.

**Casey (Distracted Mobile User)**: The primary one-handed nav control is the broken partial-height drawer from P0 — the worst possible failure mode for a distracted thumb-tap. The TopBar ticker text is clipped at the very left edge on a 390px viewport with no padding buffer before the marquee scrolls in. Tap targets are undersized: the rail prev/next `.circle-btn` is 34–36px and the `ProductCard` favorite button is 30×30px, both under the 44×44pt minimum.

### Minor Observations

- The winter-tree icon mark only shows below a 640px breakpoint — desktop visitors only ever see the plain text wordmark, losing the nicest piece of the identity.
- "Se connecter" in the header is a static `<span>`, not a link/button — inert next to every other clickable header icon.
- The "Carte cadeau" gift-card tile in `CoffretsSection` reuses a solaire product photo rather than gift-card-specific art — a smaller instance of the P0 photo-mismatch pattern.
- `BrandsMarquee` scrolls partner brand *names* at low contrast rather than real logos — a missed, cheap trust signal in a category where recognizable brand marks matter.
- `PromotionsGrid` always slices to 10 items regardless of the active tab; worth checking whether every category actually has 10 items or renders visibly sparse.

### Questions to Consider

1. If a shopper zoomed into any product photo, would they see the real brand's packaging — or a Para d'Hiver house mockup? What does the brand lose the day someone makes that comparison?
2. Forced to cut from 13 sections to the 3 that most move a first-time Casablanca shopper from browsing to cart, which 3 survive — and what gets deferred?
3. Is the winter-snow concept the store's permanent identity or a seasonal campaign skin? Right now snow particles, the tree logo, and "hiver" copy are so central it's unclear what this page becomes outside winter.
