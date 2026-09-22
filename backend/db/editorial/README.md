# Editorial collections — rollout

`Pages`, `Posts` and `Faqs` were added to `payload.config.ts` in the same
change as the `/a-propos`, `/cgv`, `/faq`, `/livraison`, `/retours`,
`/mentions-legales` and `/blog` routes. They need three new tables before an
editor can write anything into them.

## Why there is no migration file in this commit

Two reasons, both deliberate.

**`scripts/deploy.sh` refuses a commit that adds one.** That is the project's
own rule, and it is right: a migration is the one step a rollback cannot
undo — rolling the code back leaves the schema forward. Migrations here are
applied by a human who has looked at the data first.

**The schema this generator diffs against has drifted.** Running
`payload migrate:create` against the local database stops on an interactive
question about `products.sub_category` ("created, or renamed from another
column?"), which is a difference that has nothing to do with these three
collections. Answering it blind would fold an unrelated — and possibly
destructive — column rename into a migration whose subject is a blog. The
drift wants settling on its own terms, not as a side effect.

## The storefront does not wait for this

Every page reads its collection over REST and handles the failure:

- `/cgv`, `/mentions-legales`, `/politique-confidentialite`, `/a-propos` and
  `/retours` render "document en cours de publication" and set `noindex`.
- `/faq` and `/blog` render their empty state and set `noindex`.
- `/livraison` still shows the real tariffs — it reads `shipping-rules`,
  which already exists.
- `sitemap.xml` lists only what is actually published.

So the routes are live and correct before this runs, and fill in afterwards.
A 404 in the footer was the thing worth avoiding, and it is already gone.

## Running it

On a machine with a database whose schema matches `src/migrations/`:

```bash
cd backend
npx payload migrate:create editorial_pages_posts_faqs
```

Resolve the drift question first if it still appears — check whether
`products.sub_category` is a new column or a rename of `badge`, and make the
schema and the migration history agree — then generate again, so the file
contains only `pages`, `posts`, `faqs` and their array/relation tables.

Review the generated SQL, then:

```bash
npx payload migrate          # applies pending migrations
```

`src/payload-types.ts` is already up to date: the dev server regenerated it
when the collections were added, so `Page`, `Post` and `Faq` are committed
alongside them. Re-run `npm run generate:types` only if the collections change
again. Nothing imports those types yet — the storefront talks REST and types
its own shapes — but a stale generated file hides the next drift.

## After it is applied

1. **Create the institutional pages.** Admin → Pages → one row per slug. The
   slug is a select restricted to the routes that exist, so it cannot be
   saved somewhere with nothing to render. Leave `status` on *Brouillon*
   until the text is final; the page stays `noindex` until it is published.
2. **Fix the live footer links.** The defaults in `globals/SiteChrome.ts`
   now point at the real routes, but Payload does not re-apply a
   `defaultValue` to a global that has already been saved. The links in the
   database still read `/services`. Update them in Storefront Builder →
   Global → Footer.
3. **Write the FAQ.** Admin → Faqs. Do not restate delivery fees or times as
   prose: `/livraison` reads them from `shipping-rules`, and a second copy
   diverges the first time a tariff changes. Link to the page instead.
