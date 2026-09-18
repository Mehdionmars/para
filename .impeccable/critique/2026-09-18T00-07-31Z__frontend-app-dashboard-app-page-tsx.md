---
target: the dashboard ux/ui
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 4
timestamp: 2026-09-18T00-07-31Z
slug: frontend-app-dashboard-app-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence), isolated and parallel.

Surface: Para d'Hiver admin dashboard — overview at `frontend/app/dashboard/(app)/page.tsx`, inspected live across `/dashboard`, `/orders`, `/orders/1`, `/products`, `/coupons`, `/settings` in both themes. Visitor mode: **Operate**.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active nav, breadcrumbs, per-panel failure notices all good. No skeletons anywhere — `/products` fetches 1000 rows showing nothing. |
| 2 | Match System / Real World | 3 | French is fluent and idiomatic. But "Storefront" and "Analytics" sit untranslated in a 13-item French nav; "Vitrine: Éligible" is undecodable jargon. |
| 3 | User Control and Freedom | 2 | No undo anywhere except the Storefront Builder. Order status transitions are a one-way lattice; bulk operations on 226 products are irreversible. |
| 4 | Consistency and Standards | 1 | Two parallel component systems ship side by side (`components/ui/*` shadcn vs `components/dashboard/ui/*` hand-rolled). `KpiCard` uses the shadcn Badge; `OverviewTabs` two sections below uses the hand-rolled one. 15 files use native `<select>`. Three dropdown vocabularies on one screen. |
| 5 | Error Prevention | 3 | Genuinely strong: two-step status confirm naming the order, restock warning only when the transition actually restocks, illegal states unreachable, no bulk delete. |
| 6 | Recognition Rather Than Recall | 3 | Textual nav labels, five group headings, icon-rail tooltips. Two unlabelled icon buttons on `/products`; header search says "Rechercher un produit…" on every page. |
| 7 | Flexibility and Efficiency | 2 | Only shortcuts in the entire admin are ⌘B (inherited from shadcn) and Ctrl+Z (Storefront Builder). Advancing one order to *Livrée* is ~12 mouse-only clicks. |
| 8 | Aesthetic and Minimalist Design | 2 | Header ticker is decoration conveying no state, showing two copies of the same clock simultaneously. 260px status card holding one 16px bar; 460px calendar holding one dot. Three green pills on all 226 product rows. |
| 9 | Error Recovery | 3 | `LoadFailed` distinguished from `Empty` per panel — the most commonly skipped state in admin UI, done right. Logout survives a failed request. Raw server-action errors surface unstyled. |
| 10 | Help and Documentation | 1 | None. No tooltips on metrics, no help link, no teaching empty states. The one metric that needs a caveat (`Nouveaux clients`, bounded by a 1000-order window per its own docblock) carries none. |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Audit dimensions (technical)

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | 3 light-theme contrast failures; 0 `<nav>` landmarks; no skip link; 27 of 65 interactive elements under 44px. Focus indicators present on 68/68. |
| 2 | Performance | 3 | No `will-change`, no layout-property animation, 0 raw `<img>`. But `recharts` is imported by `KpiCard`, pulling a charting library in for sparklines. No skeletons. |
| 3 | Responsive | 2 | **Unverified below 1536px.** `resize_window` reports success while the layout viewport never changes. 59 `sm:` / 19 `md:` / 23 `lg:` gates exist and none were exercised. |
| 4 | Theming | 1 | Excellent token system, applied to ~2 of 15 routes. 1,084 hardcoded palette classes, 2 `dark:` variants total. Inter declared and never applied. |
| 5 | Implementation Integrity | 2 | Detector: 1 true positive of 11 findings, zero in the overview surface. But borrowed shadcn composition and two component systems. |
| **Total** | | **10/20** | **Acceptable — significant work needed** |

## Design Specificity Verdict

**LLM assessment: category-interchangeable admin chrome with three authored moments bolted on.** Strip the wordmark and this is shadcn's `sidebar-08` + `dashboard-01` composition nearly unmodified — icon-rail sidebar, sticky header with breadcrumb/search/theme/bell, 4-up KPI row with trend pills and sparklines, 2/3–1/3 chart pair, tabbed recent-activity triple. The code was rewritten; the composition was not. `StatsRow`'s own docblock admits the predecessor was "a marketing block, vendored in and pressed into service."

Coherence is real but its values are stock. `--primary` is Tailwind violet-600. PRODUCT.md names teal `#008aa5` and plum `#5e4074`; neither appears in the admin. Meanwhile `.receipt-scope` declares `--receipt-accent: #6d28d9` as "the brand hex, verbatim" — a third violet. Three unrelated violets ship in one dashboard.

Nothing in the layout knows it is a parapharmacie. The overview leads with the four numbers every e-commerce starter leads with. PRODUCT.md's operational truth — 83 of 226 products in no aisle, several miscategorised, 143 published — appears nowhere. The North Star is "Le comptoir en plein jour" (light, legible, unhurried); the single shipped expressive element is a scrolling marquee clock, which is the stated anti-reference ("la parapharmacie discount") rendered as a component.

Verdict: **authored infrastructure, borrowed interface.** The engineering judgment in the comments runs well ahead of the design judgment in the layout.

**Deterministic scan:** 11 CLI findings across `app/dashboard`, `components/dashboard`, `lib/dashboard`. On line-by-line verification **10 are false positives** — 9 are cross-branch ternaries where the grey and the coloured background never co-occur (`bg-violet-600 text-white` vs `bg-gray-100 text-gray-600`), and the `ai-color-palette` hit is a flat `text-violet-950` heading with no gradient. The one true positive is `StorefrontBuilder.tsx:618` (`text-gray-600` with `hover:bg-violet-50` and no `hover:text-*`), aesthetic rather than a11y. **Zero findings in the overview surface itself.**

In-page detector (injected across 5 routes) found what the CLI could not: `overused-font` reporting 100% of text in a single fallback family, `low-contrast ×5` on `/products`, `/coupons` and `/settings`, `flat-type-hierarchy` on three routes, and `layout-transition ×7` from shadcn's own `transition-[width,height,padding]` on `SidebarMenuButton`.

**Visual overlays:** none currently viewable. Injection succeeded and the in-page detector ran on all five routes, but the live server was stopped and the tab closed as the protocol requires, so there is no overlay left in the browser.

## Overall Impression

The foundations are better than the interface. `dashboard.css` is a genuine design system and the data-honesty work is unusually rigorous — null trends instead of fabricated percentages, `LoadFailed` distinguished from `Empty`, inverted delta colouring on the cancellation rate. Then that system is applied to roughly two of fifteen routes, wrapped around a composition lifted from a shadcn demo, rendered in the wrong typeface, behind a theme toggle that makes the order page unreadable.

The single biggest opportunity: **stop adding surface and finish the system.** Every P0 here is a completion failure, not a design failure.

## What's Working

1. **The status vocabulary is real systems thinking.** Eight order states declared once as oklch tokens, consumed by calendar dots, filter chips and the status chart, with dark variants lifting lightness while holding hue. The file documents why the previous arrangement failed and fixes the cause.
2. **Honesty about what the numbers cannot say.** `pctChange` returns null below a three-order base and the card renders no badge at all; `Sparkline` returns null on an all-zero series; `invertDelta` sends a rising cancellation rate amber; `ordersByStatus` drops zero-count statuses. At this data volume that is the difference between informing and lying.
3. **Failure is per-panel and distinguished from emptiness.** `Promise.allSettled` with null sentinels, and "Impossible de charger les coupons" rendered differently from "Aucun code promo créé" — so a failed fetch never reads as an empty list.

## Priority Issues

### [P0] Inter is declared, never applied — the entire admin renders in the system fallback
`layout.tsx:6` declares `Inter({ variable: "--font-inter" })` and line 29 applies `font-sans`, but no `@theme` block ever maps `--font-sans` to `var(--font-inter)`. Both `@theme inline` blocks in `dashboard.css` (lines 501, 743) contain colours only, and Tailwind v4 is css-first with no config file. Verified in the browser: `--font-inter` resolves to `"Inter", "Inter Fallback"`, `--font-sans` is still Tailwind's stock stack, every element computes to that stack, and the Inter font face reports status `unloaded`. On Windows the admin is Segoe UI.
**Why it matters:** every typographic judgment on this surface — wordmark, tracking, scale steps, tabular figures — has been tuned against a font nobody is seeing. It also invalidates the `flat-type-hierarchy` and `overused-font` readings until fixed.
**Fix:** add `--font-sans: var(--font-inter);` to a `@theme` block in `dashboard.css`. One line.
**Suggested command:** `/impeccable typeset`

### [P0] Dark mode is a shipped, discoverable control that breaks every operational page
The toggle sits in the header of all 15 admin routes. Only the overview, sidebar and shell honour it. Verified after reload with the preference persisted: `/products` keeps a white table over a dark shell with the `Produits` h1 rendering dark-on-dark and effectively unreadable and the search placeholder invisible; `/coupons` shows a correctly-dark KPI row directly above a pure-white table in one viewport; `/orders/1` — where money and stock move — renders every card white including the hardcoded `bg-white border-gray-200` status dropdown. Measured: **1,084 hardcoded palette classes across the dashboard and 2 `dark:` variants in total.** Heaviest: `ProductForm.tsx` (75), `StorefrontBuilder.tsx` (38), `ImportView.tsx` (38), `orders/[id]/page.tsx` (38), `ProductsTable.tsx` (31).
**Why it matters:** an operator who tries Sombre once reaches an unreadable page title and a white-on-black order screen, and correctly concludes the admin is broken. This is a legibility failure, not degraded styling.
**Fix:** either remove `dark` and `system` from `ThemeToggle`'s options until the sweep lands, or finish the sweep starting with the five files above. The token vocabulary already exists; nothing needs inventing.
**Suggested command:** `/impeccable harden`

### [P1] Three light-theme contrast failures, two of them in tokens authored this session
Computed WCAG ratios (canvas readback, because the tokens are authored in `lab()` which Chrome will not normalise through `getComputedStyle`): KPI trend badge `--success` on `success/10` over card = **2.32:1**; `--warning` on `warning/10` = **2.37:1**; sidebar group label `text-sidebar-foreground/70` = **3.63:1**. All against a 4.5:1 requirement. Dark theme passes every measured pair. The header placeholder sits exactly at 4.50:1 and `--muted-foreground` on `--background` at 4.54:1 — both one token tweak from failing.
**Why it matters:** the trend badges are the only colour-coded judgment on the overview, and at 2.3:1 the text is barely present. They are latent right now only because the seed data produces no deltas.
**Fix:** raise the tint to `/15`–`/20` and darken `--success`/`--warning` for light theme, or set badge text to a darker derived shade rather than the token itself. Lift the group label to full `--sidebar-foreground` or a dedicated token.
**Suggested command:** `/impeccable colorize`

### [P1] Two component systems and 15 native selects make one product read as three
`components/ui/*` (shadcn) and `components/dashboard/ui/*` (hand-rolled Badge, Tabs, Modal, Popover, AlertDialog) both ship. `KpiCard` imports the shadcn Badge; `OverviewTabs` imports the hand-rolled one. `OrderHeaderActions` hand-rolls a dropdown with its own `useDismiss` hook beside `DashboardUserMenu` on Radix doing the identical job. Fifteen files use native `<select>` with browser chevrons — `/products` shows three at a visibly different height from the search input beside them.
**Why it matters:** the Operate bar's test is whether a category-fluent user trusts the interface immediately or pauses at every subtly-off control. Three dropdown vocabularies means every menu is a fresh guess about Escape, keyboard support and clipping. It also blocks the dark-theme fix, since the hand-rolled set carries most of the hardcoded greys.
**Fix:** standardise on shadcn — it already owns the shell, cards, sidebar and tokens. Replace native selects with shadcn `Select` starting with `ProductsToolbar` and `OrdersTable`; delete the duplicate Badge/Tabs/Popover and re-point importers; rebuild `OrderHeaderActions` on `DropdownMenu` + `AlertDialog`.
**Suggested command:** `/impeccable extract`

### [P1] The overview answers "how is the shop trading" when this shop's question is "what isn't shelved"
Seven equal-weight cards lead with Chiffre d'affaires / Commandes / Panier moyen / Nouveaux clients — currently `0 / 0 / 0 MAD / 0` against 385 MAD lifetime. PRODUCT.md's first principle is "the aisle is the product", and its stated reality is 83 of 226 products in no aisle, several miscategorised, 143 published. The word "rayon" appears nowhere on the overview. `Stock faible` — the only card that can become urgent — is a middle card rendering `0` in the same ink as `226`, with nothing ready for when it reads 14.
**Why it matters:** an unshelved product is invisible to the customer who arrived with a concern. The overview shows a revenue scoreboard for a shop that has taken one order and stays silent on the backlog actually costing sales.
**Fix:** replace the second KPI row with catalogue health that links to work — "83 produits sans rayon" → the unshelved filter, "83 non publiés" → drafts, "Stock faible" tinted `--warning` above zero. Make the cards links. Demote revenue to one card plus the chart while volume is this low.
**Suggested command:** `/impeccable shape`

### [P1] The header ticker is decoration that misreports system status, and it collides with the breadcrumb
`HeaderTicker` scrolls a greeting, date and second-resolution clock on a 32s loop with two copies in the track; at 1536px both copies are simultaneously visible (the same date and time captured twice in one bar). Its left mask fade abuts `DashboardBreadcrumb` with no separator, so `/orders` reads "Tableau de bord › Commandes bienvenue sur votre tableau de bord" and `/coupons` reads "Coupons otre tableau de bord".
**Why it matters:** it is the only animated element on the page, so it outcompetes every real figure for attention, against the Operate rule that motion conveys state rather than decoration. The ticking clock implies live data on a server-rendered page whose figures are frozen at load — actively false system status. And a scrolling LED greeting is the product's explicit anti-reference.
**Fix:** the design review's call is to delete it and leave the space empty, since emptiness is what "retenu" looks like. If the space must earn its keep, make it actionable and static: "3 commandes en attente" linking to the filtered list, or "83 produits sans rayon". At minimum add a separator and fix the collision.
**Suggested command:** `/impeccable quieter`

### [P2] The most repeated action has no accelerator, and the global search lies about its scope
Advancing an order *En attente* → *Livrée* is four open-menu/pick/confirm cycles, ~12 clicks, mouse-only, with no skipping permitted. `Topbar` renders `placeholder="Rechercher un produit…"` on every route and always navigates to `/dashboard/products?q=`, so on `/orders`, `/customers` and an order detail the only search on screen silently abandons the page you are working in.
**Fix:** per-row status advance in `OrdersTable` showing the next legal transition; `/` to focus search and ⌘K for a palette over orders + products + customers; make search scope-aware, or at minimum vary the placeholder per route.
**Suggested command:** `/impeccable harden`

### [P2] Structural accessibility gaps
**0 `<nav>` or `[role=navigation]` landmarks** — the 13-item sidebar is not a navigation landmark. No skip link. **27 of 65 interactive elements under 44px**: sidebar trigger 28×28, theme toggle 32×32, bell 40×40, calendar month arrows 32×32, filter chips 46×26, theme menu items 128×30. Heading outline on the overview is **H1 → H2 only** across nine cards and two chart panels, because shadcn's `CardTitle` renders a `div` — the page's structure is largely invisible to a screen-reader outline. DOM order inverts visual order at 21 of 68 positions: header controls are DOM 15–19 but sit visually first, so a keyboard user traverses the entire sidebar before reaching the header.
**Fix:** wrap `SidebarContent` nav in `<nav aria-label="Navigation principale">`, add a skip link, raise icon buttons to a 44px hit area (`size-8` visual mark with padding), and promote `CardTitle` to a real heading level via `asChild` or an `as` prop.
**Suggested command:** `/impeccable audit`

## Persona Red Flags

**Alex (power user):** ⌘K does nothing; `/` does not focus search. Types an order number into the header search on `/orders` and is thrown to `/products?q=PDH-260909` with zero results. Cannot skip a status — 12 clicks to walk one order to delivered. No checkboxes or bulk actions on `/orders` at all, while `/products` has six. The ticker cannot be dismissed. `/products` shows `↑↓` on every column with no indication which is sorted.

**Sam (accessibility-dependent):** dark mode is a trap, not an accommodation — selecting it makes the `/products` h1 dark-on-dark and the placeholder invisible, so a low-vision user who chooses dark gets *less* legible than default. Calendar dots encode status in colour alone (the chart labels its rows; the dots do not — only day and count are in the accessible name). Bulk selection is checkbox-only with no keyboard range, and in dark mode the header checkbox is a solid black square. Two icon-only buttons on `/products` have `aria-label` but no visible label or tooltip. `OrderHeaderActions` hand-rolls `role="dialog"` with no focus trap and no focus return, for an action that notifies a customer and moves stock. Credit: the ticker is correctly `aria-hidden` and reduced-motion has a component-specific override.

**Riley (stress tester):** this shop *is* the edge case and the page half-handles it. One lifetime order, 385 MAD — the 30-day chart renders 29 zeros and one spike across 260px × two-thirds width, because `ChartEmpty` only fires at *exactly* zero. The status card draws one 16px bar against an axis labelled 0–4. The calendar is a 460px six-row grid for one dot. `Nouveaux clients` is bounded by the 1000-order window and the docblock admits it is "not a number the accounts should rely on" — the card says "première commande cette semaine" with no caveat. The clock ticks while every figure is frozen at server render.

**Nadia, comptoir staffer (project persona):** the overview does not contain her work — no "produits sans rayon", no "à préparer aujourd'hui", no delivery-day view. "Storefront" and "Analytics" are untranslated in her French nav. "Vitrine: Éligible" on all 226 rows is never explained, nor is how it differs from "Statut: Publié" — two green pills, two systems, no help. She will try Sombre once and land on an unreadable title, assuming she broke something. Nothing tells her a status change actually notified the customer, so she will phone them to check — every time.

**Youssef, owner-editor (project persona):** `/dashboard/storefront` is among the heaviest files for hardcoded light colours, so the surface he lives in is one of the most broken in dark mode. Ctrl+Z exists only there, teaching him undo exists and then removing it everywhere it matters. Teal and plum — his brand — appear nowhere; the admin is Tailwind violet throughout, and the italic wordmark is the only place he would recognise his own shop.

## Minor Observations

- Three violets ship: `--primary` (violet-600), `--receipt-accent: #6d28d9` labelled "the brand hex, verbatim", and hardcoded `bg-violet-700` in `OrderHeaderActions`. None is PRODUCT.md's plum.
- `Stock faible` shows `0` captioned "valeur stock 3 885 430 MAD" — a low-stock count captioned with total inventory value. Two unconnected facts in one card.
- `Taux d'annulation 0 %` captioned "0 annulées ou remboursées" — the same number twice.
- `Produits au catalogue 226 / 143 publiés` buries the finding that 83 products are invisible to customers.
- `/orders` shows `Statut: En attente` and `Paiement: En attente` as identical-looking pills in adjacent columns — same words, two different state machines.
- `/products` renders three green badges per row across 226 rows, so green carries no information.
- Product names render raw ALL CAPS from the CMS; `SERUM APAISANT CAPPILAIRE` ships with its typo.
- `ChartEmpty` is a centred sentence in a 260px void with nothing to do — no link to the catalogue or storefront.
- `--info` is declared and unused; `--success`/`--warning` appear only in badges that never render at this data volume.
- `OverviewTabs` counts come from `?.length` capped at 6, so "Derniers produits 6" reads as a total against a 226-product catalogue.
- Two `Ticket` affordances on `/orders/1` point at the same `printHref`.
- The dark sidebar active state renders as a solid saturated violet block, noticeably heavier than the light theme's tint — inconsistent weight for the same state across themes.
- No skeletons anywhere, though `orders/[id]/loading.tsx` exists (with 17 hardcoded greys), so the pattern is known and unapplied.
- Hydration errors on all five routes trace to a Chrome extension attribute (`cz-shortcut-listen`), not app code.

## Questions to Consider

1. If the shop has taken one order, why is the first screen a revenue dashboard? What would the overview look like as a *worklist* — "83 produits sans rayon, 83 non publiés, 3 commandes à préparer" — instead of a scoreboard with nothing to score?
2. The accent is Tailwind violet-600, the receipt is violet-700, and the brand is plum with a teal logo. You chose violet over teal deliberately — but did you choose *this* violet, or did shadcn?
3. "Le comptoir en plein jour" and "retenu et précis", and the one expressive element shipped is a scrolling marquee with a ticking clock. If the North Star were a veto, which components survive? Is the honest answer that the token file is the design and the layout is still the demo?
4. The theme toggle offers three options and two make the order page unreadable. Is dark mode a commitment you want, or a shadcn default you inherited? Removing the toggle would be more "retenu" than shipping 1,084 hardcoded greys behind it.
5. Nothing here is undoable except in the Storefront Builder. What changes if you build the other kind of safety — let the action happen, toast it, offer *Annuler* for ten seconds? How many confirmation dialogs disappear, and how much faster is Nadia's day?
