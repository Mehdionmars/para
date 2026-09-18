---
target: the dashboard ux/ui (re-run)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-18T03-35-20Z
slug: frontend-app-dashboard-app-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence), isolated and parallel.

**Coverage limitation, verified by the parent:** the admin session expired between runs. `/dashboard` 302s to `/dashboard/login`, confirmed independently by both assessments and by the parent (0 KPI cards in the DOM). Neither agent could inspect the authenticated surfaces live. Both worked from source plus live inspection of `/dashboard/login`; there is no dev auth bypass in the codebase and entering credentials is prohibited. **Assessment A's scores are therefore source-derived, not a live re-inspection.** Prior-run numbers are not reused to fill the gap.

## Design Health Score

| # | Heuristic | Score | Prev | Key Issue |
|---|-----------|-------|------|-----------|
| 1 | Visibility of System Status | 2 | 3 | No `loading.tsx` for the overview — four Payload fetches, two at `limit=1000`, with no skeleton. `hover:shadow-md` on 7 non-clickable KPI cards signals a state that does not exist. |
| 2 | Match System / Real World | 3 | 3 | Idiomatic fr-MA retail French, MAD, Monday-first weeks, Casablanca bucketing — then "Storefront" and "Analytics" untranslated, and one screen carries four different names. |
| 3 | User Control and Freedom | 2 | 2 | No undo anywhere. `AlertDialog` guards destruction; nothing reverses it. No global "effacer les filtres" on Produits despite an `activeCount` badge. |
| 4 | Consistency and Standards | 1 | 1 | Two complete primitive kits render on every screen — 42 files on the hand-rolled kit, 8 on shadcn, split along the chrome/content seam. |
| 5 | Error Prevention | 2 | 3 | Good guards on the numbers; nothing protects the storefront editor from Payload's whole-global validation (one bad field rejects all saves — no autosave, no draft, no per-field pre-validation). |
| 6 | Recognition Rather Than Recall | 3 | 3 | Everything labelled, tooltipped, breadcrumbed, statuses named as well as coloured — but the actionable numbers are inert captions you must remember to chase. |
| 7 | Flexibility and Efficiency | 2 | 2 | ⌘B (inherited from shadcn) is the only shortcut in the product. No accelerator for the two actions repeated fifty times a day. |
| 8 | Aesthetic and Minimalist Design | 2 | 2 | Eleven co-equal blocks, most of them zeros or empty grids at current volume, plus a 32s infinite marquee in an Operate header. |
| 9 | Error Recovery | 2 | 3 | `allSettled` + per-panel `LoadFailed` correctly distinguishes *failed* from *empty* — then offers no fix. No `Réessayer` anywhere; `error.tsx` and `not-found.tsx` are hardcoded light-mode. |
| 10 | Help and Documentation | 1 | 1 | None. No tooltip defines `Panier moyen` or `Taux d'annulation`; a 21-block storefront builder for a non-technical editor has no help layer at all. |
| **Total** | | **20/40** | **23/40** | **Acceptable — significant improvements needed** |

All ten heuristics apply; an authenticated admin surface has no grounds for `n/a`.

**The score moved down 3 points and that is not evidence of regression.** Three heuristics dropped (1, 5, 9), all on judgments the previous reviewer scored differently on the same code: the missing overview skeleton, the storefront save risk, and the absent retry affordance were all present last run and scored 3. Two independent unanchored reviewers landed 23 and 20 on substantially the same surface. Separately, the work done between runs (font mapping, contrast, the token sweep) lands almost entirely in *audit* dimensions — typography, theming, accessibility — which the Nielsen set barely measures. The heuristic score was never the instrument that would show it.

## What genuinely improved, like-for-like

- **Detector: 11 findings → 6, and 1 true positive → 0.** Every one of the six was line-read and called a false positive: five are the hover/ternary non-co-occurrence pattern, one is a flat brand-violet heading with no gradient. The three real storefront hits from last run are gone because that sweep tokenised them.
- **Hardcoded palette utilities: 1,084 → 535** (parent and Assessment B agree on 535; Assessment A counted 508 on a narrower pattern). 76 in `app/dashboard`, 459 in `components/dashboard` — 86% of the remainder is in the component library, not route files.
- **Inter is genuinely active**, independently confirmed: one Inter face at `status === "loaded"` plus a width comparison against an explicit fallback. The P0 font fix holds.
- **Contrast fixes hold** where the parent measured them post-fix on a live session: trend badges 2.32→5.75 and 2.37→6.47, sidebar group label 3.63→5.25, muted text 4.74→5.25 and 4.54→5.03, `/products` h1 dark-on-dark→18.97:1. Not re-verified this run (no session).

## Design Specificity Verdict

**Specific in the substrate, category-interchangeable in the composition.** Swap the French nouns and the shell is a CRM, unchanged. The overview stack — 4 KPI cards, 3 KPI cards, a 2/3 area chart beside a 1/3 bar chart, a month calendar, a tabbed recents panel — is the default e-commerce admin template, and nothing in it knows this is a parapharmacie.

What *is* authored: real fr-MA retail French, MAD formatting, Monday-first weekdays, Africa/Casablanca day-bucketing with the 01:30 edge named in a comment, one semantic colour system across eight order states, and the italic wordmark carrying the only brand voice in the admin.

What the brief asked for and did not get: the domain is absent (no péremption, lot, ordonnance, conseil vocabulary); **83 of 222 products sit in no aisle** and the word never appears on the overview; **six real bookable services have no dashboard surface at all** — `grep -ril "booking|reservation"` across the dashboard returns zero files; and "retenu et précis" is honoured by the palette then contradicted by an infinite marquee whose own code marks it `aria-hidden`.

**Deterministic scan:** 6 findings, 0 true positives. In-page detector reached only `/dashboard/login` (session gap) and found 2 there: the same `ai-color-palette` call on the heading, plus a new `gpt-thin-border-wide-shadow` on the login card — a 1px border against an 80px violet shadow blur, in a product where nothing else exceeds `shadow-sm`.

**Visual overlays:** none viewable. Injection succeeded and the pipeline works end-to-end, but only `/dashboard/login` was reachable, and the live server was stopped and the tab closed as the protocol requires.

## Overall Impression

Unchanged in shape from last run: the foundations outclass the interface. The numerical-honesty layer, the status colour system and the per-panel failure isolation are better than most production admins. They sit inside a composition lifted from a template, wrapped in two competing component kits, behind a theme toggle that one file in ninety-four honours.

The single biggest opportunity is still completion, not invention — but this run sharpens *which* completion: pick one primitive kit. It is the root of the consistency score, it blocks the dark-theme finish, and it is the reason there are three ways to draw a panel on one page.

## What's Working

1. **A numerical-honesty layer most dashboards lack.** `pctChange` returns null below a three-order base; `invertDelta` flips the one metric where up is bad; `isRevenueOrder` excludes cancelled and refunded from revenue *and* the AOV divisor; `dayKey` buckets in local time. These are the four places admin dashboards usually lie.
2. **Order status as one semantic system, never colour-only.** Eight states, one hue each, re-tuned per theme with lightness moved and hue held, consumed by calendar dots, filter chips and the status chart — which previously coloured bars by array index. All three also carry text labels.
3. **Failure isolated per panel and distinguished from emptiness.** `allSettled` with null sentinels, per-panel `LoadFailed` naming the consequence, never rendering a failed fetch as "nothing here yet".

## Priority Issues

**No P0 found.** Nothing prevents task completion outright. Stated plainly rather than inflated.

### [P1] Two design systems render on every screen
42 files use the hand-rolled `components/dashboard/ui`; 8 use shadcn `components/ui`. The split runs along the chrome/content seam, so on every screen the toolbar button is `h-9`/8px-radius/`ring-[3px] ring-ring/50` and the panel button below it is `h-10`/10px-radius/`ring-2 ring-ring`. KPI status chips are rectangles; identical-purpose chips 300px below are pills. `PageHeader` is adopted by 2 of 14 pages; twelve hand-roll `<h1>` at three sizes, two of them at `text-base` for a page title.

**The sharpest edge is accessibility, not aesthetics:** the hand-rolled `buttonVariants` has **no `ring-offset`**, so violet-300 `--ring` sits flush against the violet-600 `--primary` fill. The weakest focus indicator in the product is on the primary action, and a keyboard user gets a different focus vocabulary depending on which half of the screen they are in.

**Fix:** pick shadcn (it has the full state matrix and `asChild`), delete the hand-rolled kit, migrate the 42 files, route every page title through `PageHeader`. Non-negotiable interim: add `ring-offset-2` to the hand-rolled variants now.
**Suggested command:** `/impeccable extract`

### [P1] The dark theme is a promise the product cannot keep
A three-option toggle, `enableSystem`, and a 40-token dark palette with per-theme contrast notes — honoured by **1 of 94** dashboard `.tsx` files, and that file is `ThemeToggle.tsx` itself. 535 light-only hardcoded utilities remain. Worst clusters: `ProductsTableStates`, `bulk/BulkDialogs`, `CouponsTable`, `orders/[id]/loading.tsx`, `CustomersTable`, `InventoryTable`, and the whole `storefront/` group. `error.tsx`, `not-found.tsx` and `products/loading.tsx` all hardcode `text-gray-900`.

It is not unreadable — each panel carries its own `bg-white` and is internally consistent. It is subtler and worse: a checkerboard of bright white islands on a near-black shell, more fatiguing than either theme alone, breaking precisely on the failure surfaces. And because `enableSystem` is on, **an operator whose OS is dark gets the broken variant on first load without ever touching the toggle.**

**Fix:** finish it or withdraw it. Finishing: sweep the remaining 535 starting with the six worst files, fix `error.tsx`/`not-found.tsx`/`loading.tsx` first because they are what break, widen the `[data-slot]` border rule to `*`. Withdrawing: drop `enableSystem`, hide the toggle, and let the admin be a daylight tool — which is what "le comptoir en plein jour" already says.
**Suggested command:** `/impeccable harden`

### [P1] The overview is an analyst's report where a counter worklist belongs
Eleven reporting blocks, zero work queues. The two numbers that demand action are inert: `"${pending} en attente"` renders as a 12px muted `<span>` inside a card that is not a link, and `Stock faible` is the same. Meanwhile `hover:shadow-md` makes all seven cards lift under the cursor and do nothing on click — a false affordance on exactly the elements an operator will try to click. The largest element on the page is a month grid that at a few orders a week is ~35 empty cells.

The operator is counter staff in Aïn Sebaâ opening this between customers. Her 09:00 question is "y a-t-il une commande à préparer ?" The screen answers in a caption she cannot click.

**Fix:** one actionable block above the KPI field — "N commandes à préparer", "N en rupture", "N produits sans rayon" as clickable rows to filtered lists. Make the KPI cards links or remove `hover:shadow-md`. Demote the calendar below the recents, or a week strip until volume justifies a month.
**Suggested command:** `/impeccable shape`

### [P2] The header ticker contradicts the brief in the brief's own words
A 32s infinite marquee — greeting, long date, live clock at 1Hz — in the header of every page, with `aria-hidden="true"` on the whole component: the code admits it carries no information. `operate.md` names decorative motion that conveys no state as a constraint; PRODUCT.md's character is "retenu et précis". Secondary consequence: because the subtree is `aria-hidden`, the date and time are unavailable to a screen reader while sighted users get them forever.
**Fix:** delete the marquee. If date and time earn header space, make them static, right-aligned, `tabular-nums`, not `aria-hidden`. Spend the space on the pending-orders count.
**Suggested command:** `/impeccable quieter`

### [P2] No low-volume state, and no loading state, on the primary screen
`PageHeader` promises "les sept derniers jours, comparés aux sept précédents" — a comparison the data cannot support and that the code correctly declines to compute, so the header makes a promise and the cards answer with silence. There is no `loading.tsx` for the overview route, so the primary screen blanks while four fetches resolve.

A first-week operator cannot tell "the shop is quiet" from "the dashboard is broken" — exactly the distinction the per-panel `LoadFailed` design took such care to preserve elsewhere.
**Fix:** when `previous.length < 3`, swap the header line for "Pas encore assez de commandes pour comparer deux semaines." and lead with lifetime figures. Add a tokenised route-level skeleton mirroring the 4+3 grid.
**Suggested command:** `/impeccable onboard`

## New findings in code written during this engagement

- **`hover:shadow-md` on seven non-clickable KPI cards** — a false affordance introduced with the card redesign.
- **`Taux d'annulation` prints an unguarded raw rate.** `pctChange` guards the delta badge below a three-order base; `percent(currentCancelRate)` does not. One cancellation out of three renders a headline "33,3 %" as the largest text in the card.
- **`pctChange(newCustomersNow, newCustomersBefore, newCustomersBefore)`** passes the previous *count* as the sample size where every sibling call passes `previous.length`. Different guard semantics on one of four headline cards.
- **`SEGMENT_LABELS` maps both `clients` and `customers` to "Clients"** — two routes, one crumb.
- **The breadcrumb passes emails through whole**, so `/customers/<email>` puts a customer's address into the chrome of every screenshot.
- **`OverviewTabs` defaults to "Derniers produits"**, the least operationally urgent of its three tabs.

## Minor Observations

- `HeaderTicker`'s greeting flips at `getHours() < 18` on the *client* clock; "Bonjour" until 17:59 then "Bonsoir" is a coarse model of a Moroccan day.
- `ProductsToolbar` hardcodes `bg-violet-700` on the active-filter count, bypassing `--primary` in the component that most needs the theme.
- Radius agreement is half-there: panels concur (`rounded-xl` both kits), buttons do not (10px vs 8px). Fixing buttons fixes the visible mismatch.
- `.receipt-scope` hardcodes `--receipt-accent: #6d28d9` under a comment calling it "the brand hex, verbatim". PRODUCT.md's hexes are teal `#008aa5` and plum `#5e4074`; this is neither — and the customer-facing invoice is the one artefact where the storefront palette would actually belong.
- The login screen renders an `h1` in `ui-serif, Georgia` weight 400 in plum, a teal "Mot de passe oublié ?" link at **3.67:1**, and a violet submit button — three colour families and a display serif on a UI surface, as the first thing the operator sees.
- The login card wears `shadow-[0_30px_80px_-30px_rgba(76,29,149,0.35)]`, an 80px violet glow, where nothing else exceeds `shadow-sm`.
- Three silent windowing limits, all admitted in comments and none surfaced: `total: docs.length` off `limit=1000`; the calendar's reachable months bounded by the newest 1000 orders; a returning customer counted as new if their first order fell out of that window.
- `LoadFailed` has no `Réessayer` — recovery is a full page reload.
- `OrdersCalendar` and `OverviewTabs` each hand-roll `rounded-xl border bg-card shadow-sm` instead of the shadcn `<Card>` two blocks above. Three ways to draw a panel on one page.
- Empty-state copy is inconsistent in ambition: `ChartEmpty` teaches ("Le graphique s'activera dès la première commande."), `Empty` shrugs ("Aucune commande pour le moment.") on a screen where the operator is one click from creating one.

## Questions to Consider

1. The operator has one job at 09:00 — which orders do I prepare today? Why is that answered by a 12px muted caption that is not a link, on a screen whose largest element is an empty month grid?
2. If you deleted every block on this overview that reports and kept only the blocks that ask for work, what would remain? If the answer is "nothing", that is the brief.
3. You shipped a three-option theme control, `enableSystem`, and a 40-token dark palette with per-theme contrast notes — and 1 of 94 files honours it. Finish the dark theme, or delete the toggle and admit the admin is a daylight tool? "Le comptoir en plein jour" reads like it already chose.
4. Two button kits, 42 files against 8, both rendering on the same screen at different heights, radii and focus rings. Which one is the design system — and what, then, is the other one?
5. Six services take real bookings and the dashboard has no surface for any of them. Is that a gap in the dashboard, or evidence that bookings are not actually run from here?
