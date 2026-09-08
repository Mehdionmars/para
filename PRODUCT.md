# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary for the homepage: cold traffic arriving from Instagram (@paradhiver).** People who have never bought here, do not know the shop is real, and do not know its brands. They arrive on a phone, from a feed, with no intent formed.

Secondary: returning customers who already know the shop and come back for a specific product or a promotion. They are served by the catalogue, search and the aisles rather than by the homepage.

Third: people looking for an in-cabin service (épilation, conseil maquillage, atelier future maman) in Aïn Sebaâ, Casablanca.

Market is Morocco, French-speaking (`fr-MA`), Casablanca-centred.

## Product Purpose

Para d'Hiver is an online parapharmacie selling dermocosmetic products across Morocco, run by a real parapharmacie in Aïn Sebaâ, Casablanca. It also sells bookable in-cabin services.

Success for the storefront is a visitor entering the right aisle and finding a product that matches their skin or hair concern — not brand browsing, and not an impulse add-to-cart from the homepage.

## Positioning

The catalogue is **not** a reseller shelf of the famous parapharmacie names. In the published snapshot, DCP accounts for 36 of 74 products and D-Biotic for 7 — roughly half the shop is professional own-label lines (DCP, D-Biotic, and per the code's own note HTCeutic, LCP, SEBIOTIC, HAIRLOSS). La Roche-Posay (5), Avène (3), Vichy (2), Bioderma (1) are a thin tail.

Consequence: the shop's real substance is **concerns** — acné, cicatrices, chute de cheveux, rosacée, après-épilation — not brand logos. A visitor who came for La Roche-Posay is not the visitor this catalogue can serve well.

> Measured on `frontend/data/products.ts`, the published fallback snapshot (74 products), not the live database (222 products, 139 shelved into aisles). **Open: confirm the brand distribution against the live catalogue before this becomes a load-bearing claim.**

## Operating Context

- The storefront is content-driven. A non-technical editor arranges the homepage in a custom **Storefront Builder** at `/dashboard/storefront`: 21 orderable, individually hideable section blocks, plus rail configuration, banners, campaigns and Instagram settings. Any structural decision must survive an editor reordering or hiding blocks.
- The same dashboard runs products, inventory, orders, invoices, coupons, imports and notifications.
- Content is authored in Payload CMS and read live per request; `frontend/data/*.ts` are generated snapshots used only when the CMS is unreachable.
- Self-hosted: Docker on a LAN server, published through a Cloudflare Tunnel. `paradhiver.ma` (public) and `preprod.paradhiver.ma`; the dashboard is reachable only on the admin host and 404s elsewhere.

## Capabilities and Constraints

- **Catalogue:** 222 products. Two levels — 9 broad categories (Visage, Corps, Cheveux, Solaire, Baby & Mom, Maquillage, Bucco-Dentaire, Compléments alimentaires, Hygiène) and 19 optional aisles (`solaire`, `purifiants`, `chute-de-cheveux`, `anti-age`, `peaux-seches`, `anti-taches`, `peelings-doux`, `cremes-cicatrisantes`, `nettoyants`, `laits-corps`, `shampoings-traitants`, `soins-mains-pieds`, `peaux-sensibles`, `hygiene-intime`, `apres-epilation`, `apres-shampoings`, `demaquillants`, `masques-capillaires`, `cheveux-ongles`). The aisles were derived from this catalogue's own families, not a borrowed tree.
- **Incomplete:** 139 products are shelved into an aisle; **83 are not**. Several carry a wrong broad category. Some aisles are still empty.
- Cart, favourites, coupons, order tracking, service booking, Instagram feed, newsletter.
- **6 services** with a working online booking flow.
- Products are not versioned in Payload; globals are. Payload validates an entire global on every write, so one invalid field blocks all saves.
- Stack is fixed by the existing codebase: Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (CSS-configured), Payload CMS 3, PostgreSQL 16, Cloudinary. Two separate root layouts — the storefront and the dashboard are separate CSS worlds.

## Brand Commitments

- Name **Para d'Hiver**. Wordmark set in italic (user decision).
- Logo: a circular badge, teal ring, bare winter tree, on a near-white ground.
- Storefront brand colours in use: teal `#008aa5`, plum `#5e4074`, a two-tier red (`#FF514D` / `#D0342F`).
- Interface language is French (`fr-MA`).
- Art direction, as previously agreed with the user: North Star **"Le comptoir en plein jour"**; character **"retenu et précis"**; explicit anti-reference **"la parapharmacie discount"** — no shouting, no sticker-bomb discounting.

## Evidence on Hand

**Real and usable:**
- A physical parapharmacie: **Para d'Hiver — Aïn Sebaâ**, 4A Allée des Amandiers, Casablanca 20000. Phone 06 19 96 90 07, email paradhiver@gmail.com, Google Maps link on file.
- Instagram account @paradhiver.
- Four factual service claims, already published: livraison partout au Maroc (24h à Casablanca); paiement CMI, carte ou à la livraison; produits authentiques via circuit pharmaceutique; pharmaciens joignables 7j/7.
- The real brand catalogue and real product photography (Cloudinary).
- 6 real services with real booking.

**Does not exist — must not be fabricated:**
- No customer reviews or testimonials anywhere in the product.
- No named or photographed pharmacists; "Pharmaciens 7j/7" is the only form this claim may take.
- No team or shop photography in the repository.
- Store opening hours are unset — the record literally reads "Horaires à compléter".
- The user will supply imagery for the 19 aisles; until then any aisle presentation needs a real fallback state.

## Product Principles

1. **The aisle is the product.** The catalogue's value is that someone with a concern finds the right shelf. Navigation into an aisle outranks brand browsing and homepage add-to-cart.
2. **Concerns over logos.** Lead with what the catalogue is deep in, not with the famous names it stocks two of.
3. **Earn belief before selling.** Cold traffic must first believe this is a real parapharmacie with a real counter; a physical address in Aïn Sebaâ is the proof, not a badge row.
4. **Never claim what does not exist.** No invented reviews, no invented pharmacists, no invented hours.
5. **Editors must not be able to break it.** Every structural decision has to hold when a non-technical editor reorders or hides blocks in the Storefront Builder.

## Accessibility & Inclusion

French-language interface. Phone-first: the primary audience arrives from Instagram on a phone. No further product-specific standard has been established.
