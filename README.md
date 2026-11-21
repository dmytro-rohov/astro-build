# Astro Starter v3.1

A website engine for small business sites: one `site.json` (content, business data,
theme, layout) in, a fast, accessible, secure static site out. Built for an
orchestrator (Mytko Website Factory) that turns a client brief into two clearly
different designs from the same content — but just as usable by hand.

- **18 section types, 104 variants**, 8 navbars and 8 footers, all validated by Zod schemas
- **149 Lucide icons** for small businesses (per-site sprite), embeds (maps, Calendly, video) loaded on click
- **8 archetypes** (style presets) × brand accent with automatic WCAG AA correction,
  12 local font pairs (Latin, Latin Extended, Cyrillic), light / dark / auto schemes
- SEO and JSON-LD from business data (opening hours, address, FAQ), GDPR cookie banner,
  CSP without `unsafe-inline`, contact form — own Node API or any form service
- CLI for the orchestrator: validate, build (also into its own workspace), screenshots,
  `report.json` with axe and Lighthouse gates, `site:compare` for two designs of one brief,
  AI catalog and JSON Schema, schema migrations
- Tests on every change: Vitest unit tests, Playwright e2e + axe, Lighthouse, a generated
  min/max catalog in all archetypes, six realistic fixture sites, Docker smoke test

## Quick start

```bash
nvm use && npm ci
npm run dev                                                 # demo site (sites/_demo)
npm run site:preview -- --site sites/_fixtures/cafe-warm   # any other site
npm run site:report -- --site sites/_fixtures/cafe-warm    # build + quality report
```

A new site = a new directory with `site.json` and `assets/` (copy a fixture from
`sites/_fixtures/`). Run `npm run catalog` once to get `dist-catalog/site.schema.json`
for autocompletion in your editor (`"$schema"` in site.json points to it).

---

## Tech Stack

- Astro 7 (static output; Node adapter only for the local contact API)
- TypeScript, Zod 4 (schemas → types, validation, JSON Schema)
- SCSS / Sass with design tokens (OKLCH palettes generated per site)
- SVG sprite icons, local variable fonts (@fontsource, subset per language)
- Vitest, Playwright, axe-core, Lighthouse CI
- Docker + `server.mjs` (security and caching headers) for VPS deployment

---

## Project Structure

```txt
sites/
├─ _demo/             demo site (default SITE_DIR)
└─ _fixtures/         six realistic Polish sites: 3 businesses × 2 designs

src/
├─ site/              the engine: loader, schemas, registry, migrations, CSP, Vite plugin
│  ├─ schema/         site.json schema (fields, site, assets)
│  ├─ migrations/     schemaVersion migrations
│  └─ routes/         contact API (injected in local contact mode)
├─ sections/<type>/   schema.ts + one .astro per variant (+ _shared)
├─ layout/            navbar and footer schemas
├─ design-system/
│  ├─ archetypes/     8 style presets
│  ├─ theme/          palette generation, contrast, shape tokens
│  ├─ fonts/          font families and pairs
│  ├─ tokens/         core tokens
│  └─ utils/          tokens → SCSS (per site)
├─ components/        layout, UI, form and media primitives (Accordion, ContactForm…)
├─ layouts/           BaseLayout, Header, Navbar, Footer
├─ i18n/dictionaries/ one file per language (cs, de, en, es, fr, it, nl, pl, pt, ru, tr, uk)
├─ lib/contact/       contact form validation and delivery
├─ pages/             [...slug].astro (all site pages), privacy, contact results, 404/500
└─ styles/           main.scss (what every page needs), sections/<type>/ (one sheet per variant)

scripts/
├─ site/              CLI: validate, build, preview, screenshot, report, migrate,
│                     catalog, gallery, make-catalog, make-fixtures, test scripts
└─ build-*.ts|js      per-site system assets: tokens, fonts, icons, app icons, OG image

tests/unit/           Vitest (schemas, theme, fonts, CSP, migrations, catalog…)
tests/e2e/            Playwright (pages, a11y, cookies, contact, keyboard, security, editor bridge, site.spec)
```

---

## The site comes from `site.json`

The engine builds a website from **one data file**. All content and
configuration live in `SITE_DIR/site.json` (default `sites/_demo`); there is no
client content in `.astro` files.

```
sites/<site>/
  site.json            ← pages, sections, business data, theme, layout
  assets/assets.json   ← images: { "hero": { "file": "hero.jpg", "alt": "…" } }
  assets/hero.jpg
```

```bash
npm run site:validate -- --site <dir>               # schema, contrast, fonts, assets — no build
npm run site:build -- --site <dir> [--out <dir>]    # full build (default ./dist)
npm run site:preview -- --site <dir> [--port 4321]  # dev server with live reload
npm run site:screenshot -- --site <dir> [--out <dir>] [--no-build]  # desktop + mobile PNG of every page
npm run site:report -- --site <dir> [--out <dir>] [--no-lighthouse] [--no-screenshots]  # build + axe + Lighthouse + screenshots → report.json
npm run site:compare -- --site <dirA> --site <dirB> [--same-brand-accent] [--json]  # two designs of one brief differ enough?
```

`--out` may point anywhere, also outside the project (the orchestrator's workspace): the
build runs in `.generated/staging` and is moved there; a contact-`local` build gets a
`node_modules` link so `OUT_DIR=<out> node server.mjs` runs from that folder.

`site:screenshot`, `site:report` and `gallery` serve the build on a free port, so several runs
can work in parallel (`--port <n>` or `SITE_PORT` for a fixed one). The URL comes from the
server's own "listening" line, and a server that exits (e.g. a taken port) fails the run — it
never measures another site.

`site:report` writes `<out>/report.json` for the orchestrator (default out:
`.generated/sites/<siteId>`): engine and schema version, validation issues and warnings
(legal review of the privacy template, missing data, accent adjustments), resolved theme,
per page axe violations, Lighthouse scores and screenshot paths, and the quality gates
(`build`, `a11y`, `lighthouse` ≥ 90/95/95/95, or `"skipped"` with `--no-lighthouse`). Exit code 1 when a gate fails; an invalid
site still gets a report with the readable issues.

- Schemas (Zod) in `src/site/schema/` and `src/sections/<type>/schema.ts` are the single
  source of truth for TS types, validation and the JSON Schema for AI (`npm run catalog`).
- **Content belongs to the section type**, a variant only adds props and lists the optional
  fields it shows — switching variants never loses content.
- `site.json` is untrusted input: links only `https:`, `mailto:`, `tel:`, site paths and
  anchors; rich text is a small Markdown-like subset (`**bold**`, `*italic*`, `[text](/link)`)
  rendered by the engine, never HTML. Secrets stay in environment variables.
- Every page comes from `pages[]` (`src/pages/[...slug].astro`); the first section renders
  the page's only `<h1>`. Engine pages (privacy, contact results, 404/500, API)
  use reserved slugs that site.json cannot take.
- **Strict:** unknown keys are errors (a typo such as `"titel"` never disappears silently);
  text must not contain control or bidi-override characters; asset file names are lowercase.
- Section ids are also DOM ids and cannot take the engine's own (`main-content`,
  `navbar-menu`, `contact-name`…). At most one `contact` and one `faq` section per page.
  Every `href` to `/#id` or `/page#id` (menu, buttons, footer) must hit a section id.
- `business.type` is one of the schema.org types listed in `BUSINESS_TYPES`
  (`src/site/schema/site.ts`, also in `catalog.json`); `meta.url` is an origin without a path.
- Errors are listed per field, e.g.
  `pages[0].sections[0].content.title: Too big: expected string to have <=80 characters`.

`src/config/site.ts` is now a compatibility layer computed from site.json — do not put content there.

### Schema versions and migrations

Every site.json declares `schemaVersion` (the format) and `engine` (a semver range of the
starter it needs). The engine reads exactly one `schemaVersion` (`SCHEMA_VERSION` in
`src/site/schema/site.ts`, currently `1`):

- an **older** site stops with `schemaVersion: 1 is older than 2. Run npm run site:migrate…`,
- a **newer** site stops with `…is newer than this engine supports` — update the starter.

```bash
npm run site:migrate -- --site sites/<client>            # keeps site.v<N>.backup.json
npm run site:migrate -- --site sites/<client> --dry-run  # prints the result only
```

A breaking schema change bumps `SCHEMA_VERSION` and adds a pure migration function
(`src/site/migrations/v<N>-to-v<N+1>.ts`, registered in `src/site/migrations/index.ts`);
the migrated site is validated like any build.

### Section catalog

| Type | Variants |
|---|---|
| `hero` | `split-image`, `centered`, `cover-image` (photo behind text, always the dark palette), `panel` (edge-to-edge split), `minimal` (oversized type + facts), `title-below` (photo first with a floating facts-and-buttons card, headline and text under it), `band` (centered text over an edge-to-edge photo band), `offset-card` (headline, wide photo, text card cut into its corner), `rounded-card` (inset rounded photo card, frosted arch behind the centered text), `bold-type` (huge uppercase headline with a pill button in its last line, photo card, facts bar), `giant-word` (one oversized word threaded through the photo, optional `word`) |
| `about` | `image-side` (a second photo overlaps the first), `centered` (values in small columns), `textured` (photo over the edge of an engraved plaster pattern), `experience` (offset outline frame, years badge from the first highlight, vision/mission columns over faint stripes), `editorial` (magazine columns: highlighted title words, drop cap, pull quote, side stories), `bio` (one person: big name, lead, portrait with a contact card, a client's quote), `milestones` (history on a timeline of years, alternating above and below the line) — optional `titleHighlight`, `secondImage`, `points`, `quote` + `quoteAuthor`, `milestones` |
| `services` | `cards`, `price-list` |
| `features` | `cards-grid`, `icon-list`, `icon-badge` (round icon on the card edge, link per card), `staggered` (zigzag cards over a colored band), `orbit` (items around a central circle; a list on phones), `spotlight` (one raised card), `bento` (tiles of different sizes, one accent tile) |
| `testimonials` | `cards` (a slider over 3 reviews), `spotlight` (first three, stacked), `carousel` (one quote at a time on a brand panel, arrows + dots), `portraits` (photo tile + brand quote card, checkerboard), `quote-cards` (quote mark in a curved corner, one card on the brand color), `rating` (overall score + review rows); without a photo the initials are shown, stars only for a real `rating`; optional `ratingAverage`, `ratingCount`, `ratingSource`, `ratingLink` from a review profile (Google…) |
| `gallery` | `grid` (even 4:3 tiles, captions below), `mosaic` (first photo large, square tiles closing a rectangle), `slider` (pages of up to five tall, wide and small tiles, arrows beside the title, dashes), `masonry` (columns of different heights ending level, captions on the photos), `polaroid` (tilted prints over a brand band), `checkerboard` (photos alternate with text tiles: optional `items[].title`, `text`, `link`), `explore` (vertical word on a framed panel beside staggered portraits) — every photo opens a full-screen viewer (prop `lightbox`, default on; without JavaScript it links to the image), optional `link` to more photos |
| `pricing` | `cards`, `compact`, `featured-center` (recommended plan in the middle, on the brand color), `table` (comparison: features × plans), `split` (intro left, plan rows right), `minimal` (typographic columns, thin rules) |
| `faq` | `accordion`, `two-column`, `split-contact` (title and a contact card with phone and e-mail from `business`, optional photo and button), `categories` (a category menu switching the questions; without categories the questions are the menu), `with-image` (numbered questions beside a photo or a brand question-mark panel), `search` (brand panel with a search field, category pills and a live result count) — all publish FAQPage JSON-LD and list everything without JavaScript; optional `items[].category`, `image`, `action` |
| `cta` | `boxed` (glow over a dot grid), `banner` (edge-to-edge band, brand bar, stacked actions), `rings` (brand card, concentric circles), `gradient-cards` (gradient band with wave lines, facts on floating cards), `faces` (light card, round photos around it — tinted dots without them), `band-card` (light card on a brand band, spaced uppercase title); optional `highlights` (gradient-cards) and `images` (faces); `description` optional |
| `contact` | `form-split` (details as icon rows beside the form card), `form-centered` (one card: details on a brand panel + form), `info-columns` (open form, then large icon columns over a brand strip), `big-card` (one large card on a soft brand gradient), `methods` (call / write / visit action cards, form panel over a deep brand block), `map` (form + tall map with a place card) — details and hours from `business`, the same form in every layout; optional `mapUrl` (map embed) |
| `hours-location` | `card`, `compact` (one-row contact bar), `today` (door sign: the week day by day, today marked, live "open now" status), `map` (side panel + a map loaded after a click from the optional `mapEmbed`, a drawn map without it), `image-side` (photo of the place with an overlapping card, optional `image`), `week-strip` (seven day tiles with a 24-hour track) — hours, address, phone from `business`; days with the same hours are grouped ("Pn–Pt"); the status is computed in the browser in the business time zone (from `address.country`, default Europe/Warsaw) |
| `stats` | `row`, `cards`, `rings` (progress rings), `bars` (progress bars, two columns), `chart-cards` (decorative mini charts), `highlight` (one big number + text), `bento` (tiles, first on the brand color); key numbers, accent tone allowed, optional `items[].progress` 0–100 |
| `process` | `steps` (one connecting line), `timeline` (alternating around a central line), `cards` (outlined numbers), `wave` (wavy path), `snake` (line looping over and under round nodes), `chevrons` (rings with numbered arrows) — 2–8 steps, optional icons and time labels; all collapse to one vertical sequence on phones |
| `team` | `cards` (portraits 4:5), `compact` (round photos, balanced rows), `social-cards` (big round photo, icon links on its edge), `spotlight` (featured person in the middle, on the brand color), `color-tiles` (arch portraits on tiles of rotating soft colors), `directory` (dense small cards) — initials wherever a photo is missing, optional `members[].socials` icon links |
| `schedule` | `week` (calendar board: a framed column per day), `table` (grouped by day), `day-columns` (bold colored day headers), `matrix` (instructors or classes × days), `tabs` (one day at a time, today first), `agenda` (timeline list) — weekly classes, sorted by day and time; `matrix` rows by `instructor` or `class` (prop `rows`) |
| `logo-cloud` | `row` (muted, balanced rows), `grid` (light tiles), `coverflow` (3D carousel, big card in the middle; 2–3 logos as a still fan), `split-image` (photo beside the title and tiles, pages of six with dots), `marquee` (endless band between rules: pauses on hover, focus and a button, still for reduced motion), `color-tiles` (logos knocked out white on strong tiles from the accent, `palette` brand / spectrum) — partner / client logos, SVG or PNG, sized by their proportions; a white plate behind a logo melts into the background; optional `image` for `split-image` |
| `embed` | `full`, `split` (OpenStreetMap, Google Maps, YouTube, Vimeo, Calendly — see below) |
| `suggestion` | `box` (preview only, never published: a recommended section the generator cannot build yet — why it helps, what is missing, links to add or dismiss it) |
| layout `navbar` | `simple`, `centered`, `topbar` (phone/email bar), `brand-bar` (whole bar in the brand colour, outlined button), `dark-bar` (dark on every site, name in a brand block, links as cells), `split` (logo in the middle, links on both sides), `floating` (rounded bar with a gap and a shadow, compact while scrolling), `minimal` (large name, full-screen menu on every screen) — shared props `sticky`, `hideOnScroll`, `menuButton`; each variant's styles load only on its site |
| layout `footer` | `columns`, `simple`, `centered`, `cta-band` (brand-gradient or photo band with one call to action on top of the columns), `cards` (brand row, link groups and contact on separate rounded cards), `contact-first` (large phone, e-mail, address and hours with the open-now status, round social icons, links in one quiet row), `big-name` (giant business name across the bottom), `rounded-card` (the footer as one rounded card inset from the edges, dark by default) — prop `tone` (`auto`, `light`, `dark`, `brand`) on every variant; optional `ctaTitle`, `ctaText`, `ctaAction`, `ctaImage`, `wordmark`; the v3.5 variants keep the privacy link in the bottom row |

**Rules:** at most one `contact` and one `faq` section per page; the first section of a page
renders its only `<h1>`, so `stats`, `logo-cloud` and `embed` need a title there.

**Embeds** (`src/site/embeds.ts`): embed sections and the contact `map` variant's `mapUrl` (map
providers only) accept only links from the listed providers
(YouTube becomes `youtube-nocookie.com`, Vimeo gets `dnt=1`). Nothing is requested from the
provider before the visitor clicks "Show content from …"; without JavaScript a link opens it
in a new tab. The CSP `frame-src` lists exactly the providers the site uses (embed sections and
the `map` variant of `hours-location`), and the privacy page names them. Script widgets
(e.g. Booksy) are not embeddable — link to them with a button.

Common section props: `tone` (`default`, `muted`, `inverse`; `accent` for hero, about, cta, stats),
`spacing`, `align`. Without `tone` the archetype default for the type is used.

**Adding a variant:** add it to `variants` in `src/sections/<type>/schema.ts` (description,
used optional fields, own props), create `src/sections/<type>/<Variant>.astro` with
`SectionShell` + `SectionHeader`, register it in `src/site/components.ts` and add its styles in
`src/styles/sections/<type>/_<variant>.scss`, imported by the component. Content stays the type's
content — never add variant-only content fields.

**CSS per site:** a build imports only the components of the variants its pages use
(`virtual:section-components`, `src/site/vite-plugin.ts`), and each component imports its own
stylesheets (widgets like `Slider` and `Lightbox` too), so a site ships the CSS of its variants
only; `main.scss` keeps what every page needs (tokens, base, layout primitives, header, footer,
the hero's first-screen rules). The footer works the same way: its variants are components in
`src/layouts/footer/` (`virtual:layout-components`) with styles in `src/styles/layouts/footer/`. Every split stylesheet starts with the cascade layer order (`abstracts/_layers.scss`).

**Boundary tests:** `scripts/site/make-catalog.ts` generates a site from the schemas with every
variant twice — minimum and maximum content (every field at its limit, long Polish words).
`npm run test:catalog` builds it in all 8 archetypes (rotating navbar/footer variants and
pl/en/uk) and checks that nothing overflows at 320/768/1440 px and that axe passes.

**AI catalog:** `npm run catalog` writes `dist-catalog/` — `site.schema.json` (full JSON Schema
with editor metadata: labels, field types, image slots), `site.schema.llm.json` (the same for
LLM structured output: limits moved into descriptions, no regex patterns — the result is always
re-validated with Zod) and `catalog.json` (types, variants with their `uses` and props, content
fields with limits, archetypes, font pairs, icons, reserved slugs). The orchestrator reads it
to pick two clearly different designs for one brief.

**Visual gallery:** `npm run gallery [-- --archetypes default,bold]` builds the catalog site in
each archetype and saves element screenshots of every variant (min/max content, light/dark) to
`dist-gallery/index.html`, filterable by type, variant, archetype, scheme and content. It is a
local QA tool (replaces the v2 `/playground` page) and is never deployed.

### Theme: archetypes, colors, fonts

```json
"theme": { "archetype": "energetic", "accent": "#e4572e", "colorScheme": "light", "fontPair": "space-grotesk+inter" }
```

- **Archetypes** (`src/design-system/archetypes/`): `default` (v2 look), `minimal`, `elegant`,
  `bold`, `warm`, `premium-dark`, `corporate`, `energetic`. An archetype sets the neutral
  scale, default accent, background tint, font pair, radius, button shape (square / rounded /
  pill), image style (sharp / rounded / shadow / border), card style, spacing density,
  heading style (weight, case, tracking) and default section tones.
- **Two designs, two color families**: accents belong to families by OKLCH hue (`red`,
  `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `neutral`). Every archetype
  recommends 4 accents from 4 families (`recommendedAccents`, also in `catalog.json`).
  `npm run site:compare` fails when two designs of one brief share the archetype, the accent
  family or the hero variant (`--same-brand-accent` when the brief fixes the brand color:
  then the font pair must differ) and suggests accents from another family.
- **Accent**: the whole palette (light and dark) is generated in OKLCH from one color.
  When the client's color fails WCAG AA it is darkened or lightened (same hue) and the change
  is reported in the build output and `src/design-system/theme.generated.json`.
- **Manual overrides** (`theme.overrides.light|dark`, e.g. `"action.primary"`) are an exception
  and must pass contrast as they are — otherwise the build stops.
- **Fonts**: 12 pairs of OFL variable fonts (`src/design-system/fonts/library.ts`) from
  `@fontsource-variable/*`. Only the chosen pair is shipped (latin, latin-ext, plus cyrillic for
  Cyrillic languages) with metric-matched fallbacks and `public/fonts/LICENSES.txt`.
  A pair without the language's script (e.g. no Cyrillic for `uk`) stops the build with
  a list of suitable pairs.
- **Inverse sections** use the opposite scheme's palette, so everything inside keeps its contrast.
- `npm run build:system` generates tokens and fonts for `SITE_DIR`; the output is not committed.

### Assets and images

Images are referenced as `"asset:<id>"` and described in `assets/assets.json`:

```json
{ "hero": { "file": "hero.jpg", "alt": "Dancers in the studio", "focal": { "x": 50, "y": 30 } } }
```

- Each image slot declares proportions and a minimum width (e.g. hero 4:3, ≥ 960 px).
  The image is **cropped at build time** around the focal point; the build stops with a
  clear error when the image is too small for the slot, or an SVG is used where a photo is needed.
- `meta.logo` (SVG/PNG) is shown in the header and footer; without it the business name is a
  text logo in the heading font.
- `meta.icon` (square, ≥ 512 px) becomes the favicon and app icons; without it a **monogram**
  (first letter of the name on the accent color) is generated.
- Open Graph image: `pages[].seo.image` or `meta.seo.image` (cropped to 1200×630); otherwise
  `og-cover.jpg` is generated from the name, description and colors.
- Fonts, icons, favicon and `og-cover.jpg` are generated per site by `npm run build:system`
  (part of `npm run build`) and are not committed.

---

## Project Configuration

Everything a site needs is in `SITE_DIR/site.json` (see "The site comes from
`site.json`"): `lang`, `meta` (name, description, url, logo, icon, Open Graph image),
`business`, `theme`, `analytics`, `contact`, `layout` (navbar, footer) and `pages`.
`src/config/site.ts` is a compatibility layer computed from it — do not edit it.

The public site URL is `meta.url` (origin only, e.g. `https://example.com`); the
`SITE_URL` environment variable (also a Docker build arg) overrides it. It is used for
`Astro.site`, canonical links, sitemap, Open Graph URLs and `security.allowedDomains`
(`www.` is added automatically).

Without `meta.seo.image` the build generates `og-cover.jpg` (1200×630) from the site
name, description and colors.

---

## Language

All UI texts (navigation, footer, cookie banner, contact form, validation
messages, emails, 404/500, contact result pages, privacy page) come from
dictionaries in `src/i18n/dictionaries/`. The language is chosen in **one place** —
`"lang"` in site.json:

```json
{ "lang": "pl" }
```

Any language works. The file name is the language code:

1. Copy `en.ts` to `<code>.ts` (e.g. `de.ts`, `pt-BR.ts`).
2. Translate the texts and set `meta.ogLocale` (e.g. `de_DE`) and `meta.dir`
   (`"rtl"` for Arabic, Hebrew…).
3. Set `"lang"` in site.json.

Ready: Czech (`cs`), German (`de`), English (`en`), Spanish (`es`), French (`fr`),
Italian (`it`), Dutch (`nl`), Polish (`pl`), Portuguese (`pt`, Portugal), Russian
(`ru`), Turkish (`tr`) and Ukrainian (`uk`). Languages in other scripts (Chinese,
Arabic, Hindi…) also need fonts with that script and, for right-to-left ones, a
check of the layout.

No registration is needed — dictionaries are picked up automatically, and
`npm run catalog` lists them in `catalog.json` (`languages`: code, own name,
English name, Open Graph locale, direction, scripts) for the generator. The site
**content** in site.json must be written in that language. TypeScript checks that
every dictionary has the same keys as `en.ts`; an unknown `lang` stops validation
with a clear error, and a font pair without the language's script (e.g. Cyrillic
for `uk`) is rejected with a list of suitable pairs.

In components use:

```astro
---
import { t, format } from "@/i18n";
---
<p>{t.footer.cookieSettings}</p>
<p>{format(t.footer.copyright, { year: 2026, siteName: "Acme" })}</p>
```

---

## SEO and Indexing

- `robots.txt` is generated with the sitemap URL; `/api/` is disallowed.
- `humans.txt` names the site owner and the Factory ([Factory Signature](#factory-signature)).
- URLs have no trailing slash (`trailingSlash: "never"`) — canonical links and the
  sitemap use the same form; `/contact/` redirects to `/contact`.
- `src/config/indexing.ts`:
  - `noindexPaths` — `noindex` meta and left out of the sitemap (e.g. `/contact/sent`)
  - `sitemapExcludedPaths` — indexable, but not in the sitemap (e.g. `/privacy`)
- Custom `404` (prerendered) and `500` pages, both `noindex`.
- Every page has exactly one `<h1>`.

---

## Structured Data (JSON-LD)

Every page gets one `@graph` built from `siteConfig` (`src/lib/seo/schema.ts`);
the FAQ widget adds a separate `FAQPage` block:

- `Organization` / `LocalBusiness` — set `siteConfig.organization` (type, address,
  phone, email, opening hours, price range, `sameAs` profiles). Empty fields are skipped.
- `WebSite` and `WebPage` (with language)
- `BreadcrumbList` — automatic Home › page on subpages; override with
  `<BaseLayout breadcrumbs={[...]}>` or turn off with `breadcrumbs={false}`
- `FAQPage` — added by the `FAQ` widget (`structuredData={false}` to turn off)

Extra nodes (Service, Product, Event…) can be passed with `<BaseLayout jsonLd={...}>`.

---

## Security

- Content Security Policy (`security.csp` in `astro.config.mjs`) with hashes for
  Astro's scripts and styles — no `unsafe-inline`. Google Analytics hosts are allowed.
  Not active in `astro dev`; test with `build` + `preview`.
- `server.mjs` (the production server, also used by Docker and the tests) adds
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` (for a preview build for the
  editor: `frame-ancestors` of the editor, see [Editor Preview Bridge](#editor-preview-bridge)),
  `Cross-Origin-Opener-Policy`, `Permissions-Policy` and HSTS (for an `https://`
  `SITE_URL` with `NODE_ENV=production`) to **every** response: pages, the 404 page,
  static files and the API.
- Caching: `/_astro/*`, fonts and the icon sprite have content hashes in their names
  and are served as `immutable` (1 year); favicon, manifest and app icons for 1 day.
- Pages are prerendered (`output: "static"`), so images are generated at build time
  and the on-demand `/_image` endpoint is disabled.
- The reverse proxy should handle HTTPS and compression (gzip/brotli) and must
  **overwrite** `X-Forwarded-For` — the contact rate limit trusts its first entry.

---

## Cookies and Analytics

Google Analytics 4 is enabled only when `PUBLIC_GA_MEASUREMENT_ID` is set
(build time, also as a Docker build arg). Without it the site sets no optional
cookies and **no banner is shown**.

With analytics enabled:

- GA loads only after consent; Consent Mode v2 defaults are all `denied`.
- "Reject" and "Accept" have the same visual weight.
- The banner does not steal focus on page load.
- "Cookie settings" in the footer (and on the privacy page) reopens the banner,
  so consent can be withdrawn at any time. Any element with
  `data-cookie-settings` does the same.

---

## Main Features

### Design System

The project uses design tokens as the source of truth for:

- colors
- spacing
- typography
- radius
- shadows
- motion
- z-index

Tokens are generated into SCSS custom properties and used across the whole project.

Semantic colors exist in two schemes with the same token names:

- `semanticColors` — light
- `semanticColorsDark` — dark

Both live in `src/design-system/tokens/semantic/color-semantic.ts`.
`npm run tokens` generates `:root` (light), `:root[data-theme="dark"]` and an automatic
`prefers-color-scheme: dark` block. Components only use semantic tokens, so they work in both schemes.

---

### Layout Primitives

Available layout primitives:

- `Container`
- `Section`
- `Stack`
- `Cluster`
- `Grid`
- `Split`
- `Sidebar`

These components are used to compose page layouts without rewriting the same CSS repeatedly.

Spacing props (`space`, `gap`) accept **only spacing token names**
(`"0"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"` … `"5xl"`) and render a
modifier class such as `stack--space-md`. Arbitrary values (`"13px"`) are not
supported on purpose: layouts stay predictable and no inline `style` is needed,
which keeps the Content Security Policy strict. `Sidebar` width is `"sm" | "md" | "lg"`.

---

### UI Components

Available UI primitives:

- `Button`
- `Link`
- `Card`
- `Tag`
- `Divider`
- `Progress` (v3.3) — a ring or a horizontal bar filled to `value` 0–100

`Progress` draws the fill with SVG attributes (no inline styles, CSP-safe), so without
JavaScript and in screenshots it shows the final state; just before it scrolls into view it
empties and fills with a CSS transition at the pace of the count-up numbers (no animation with
reduced motion). Its accessible name is the percentage (`role="img"`, `aria-label="75%"`) or
`label`; `decorative` hides it from screen readers. Content in the slot sits inside the ring;
`--progress-fill`, `--progress-track` and `--progress-thickness` (bar) restyle it.

```astro
<Progress value={75} />
<Progress value={98} variant="bar" label="Zadowoleni klienci: 98%" />
<Progress value={100} decorative><span>4,9</span></Progress>
```

---

### Form Components

Available form primitives:

- `FormGroup`
- `FormField`
- `Label`
- `FieldHint`
- `FieldError`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Radio`
- `Switch`

---

### Media Components

Available media primitives:

- `Img`
- `Picture`
- `Figure`
- `Icon`

`Icon` uses the per-site SVG sprite built from the Lucide set (see Icons).

---

### Section components

Every section variant lives in `src/sections/<type>/` and renders through `SectionShell`
(anchor id, tone, spacing, `data-section-type` for the tests). Shared building blocks:
`Accordion` (`components/ui`), `ContactForm` (`components/form`: the form alone, laid out by
its own width), `Slider` and `Lightbox` (full-screen photo viewer on a native `<dialog>`:
arrows, swipe, Escape, captions, counter; `components/widgets`), `SectionHeader`, `Actions`,
`RichText`, `EmbedFrame` (`sections/_shared`). There is no separate "widgets" layer any more.

Site layouts (`src/layouts/`): `BaseLayout`, `Header`, `Navbar`, `Footer`.

`Button` renders a `<button>` by default and a link styled as a button when `href` is set:

```astro
<Button href="/contact" size="lg">Contact</Button>
```

---

## Contact Form Backend

The `ContactForm` widget posts data to:

```txt
/api/contact
```

The backend flow:

```txt
ContactForm.astro
  ↓
src/site/routes/contact-api.ts (injected as /api/contact in contact.mode "local")
  ↓
validateContactForm.ts
  ↓
sendContactMessage.ts
  ↓
console delivery / Resend
```

Server-side checks follow the form's fields (`contact.form.fields`, or the default form):
required fields, the type of each (email, phone, a select's options, date, number), length
limits (also `maxlength` in the form), privacy consent, honeypot, line breaks removed from
single-line values (email header safety) and a rate limit of 5 valid messages per 10 minutes
per IP (invalid attempts do not count). The pure check is `src/lib/contact/checkSubmission.ts`
(no Astro: a form service can use it with the site's field list and a dictionary).
A filled honeypot gets a normal "sent" answer and nothing is sent.

Without JavaScript the form still works: the browser posts it natively and the
visitor is redirected to `/contact/sent` or `/contact/failed`.

In development the form logs submissions to the terminal by default.
In production `CONTACT_DELIVERY_MODE` **must** be set — otherwise the form
returns an error instead of silently dropping messages.

Example `.env`:

```env
CONTACT_DELIVERY_MODE=console
```

When the form is submitted correctly, the data appears in the terminal running:

```bash
npm run dev
```

not in the browser console.

---

### Contact modes

```json
"contact": { "mode": "local" }
"contact": { "mode": "remote", "endpoint": "https://forms.example.com/v1/submit" }
```

- **local** — the site runs `server.mjs` with `/api/contact` (Docker); mail via Resend.
- **remote** — a **purely static** build (no Node, no adapter, no `/api/contact`). The form posts
  to `contact.endpoint`; the CSP allows only that origin (`form-action`, `connect-src`).
  Serve the output with any static server — `deploy/Caddyfile.example` has the same headers
  and caching as `server.mjs` (which also serves static builds: `OUT_DIR=<dir> node server.mjs`).

### The form's fields (`contact.form`, since 3.8)

```json
"contact": {
  "mode": "local",
  "form": {
    "submitLabel": "Poproś o wycenę",
    "fields": [
      { "id": "name", "type": "text", "label": "Imię", "required": true, "width": "half", "icon": "user" },
      { "id": "phone", "type": "tel", "label": "Telefon", "required": true, "width": "half", "icon": "phone" },
      { "id": "service", "type": "select", "label": "Czego potrzebujesz?", "required": true, "options": ["Bukiet", "Dekoracje ślubne"] },
      { "id": "date", "type": "date", "label": "Termin", "width": "half", "icon": "calendar" },
      { "id": "guests", "type": "number", "label": "Liczba gości", "width": "half" },
      { "id": "details", "type": "textarea", "label": "Szczegóły", "placeholder": "Kolory, kwiaty, budżet…", "maxLength": 1000 },
      { "id": "callback", "type": "checkbox", "label": "Proszę o telefon zwrotny" }
    ]
  }
}
```

- Without `form` (or without `fields`) the form is the one before 3.8: name, e-mail, subject,
  message, with labels and messages from the dictionary (`src/lib/contact/fields.ts` `DEFAULT_FIELDS`).
- Field types: `text`, `email`, `tel`, `textarea`, `select` (with 2–20 different `options`), `checkbox`
  (its `label` is its text), `date`, `number`. Each field: `label`, optional `placeholder` (an example in
  the empty field; for a select the text of its empty first choice, "Choose…" by default; not for
  checkbox and date), `hint` (a line under it), `required`, `width` (`full`, or `half`: side by side when
  the form is wide enough; pair half fields), `icon` (an engine icon at the start of text, email, tel,
  date and number fields), `minLength` / `maxLength` (text, textarea, tel; within the type's own limit;
  the minimum is checked by the server, in the site's language).
- Autofill: `autocomplete` (an HTML token: `given-name`, `family-name`, `organization`, `street-address`,
  `postal-code`, `address-level2`, `country-name`, `bday`, `off`…); without it the engine picks one by type
  (email, tel) and by id in English and Polish (`company`/`firma`, `city`/`miasto`, `postal-code`/`kod-pocztowy`,
  `last-name`/`nazwisko`…; `src/lib/contact/fields.ts` `AUTOCOMPLETE_BY_ID`). Not on checkbox and select.
- Rules: at most 12 fields; `id`s unique, of lowercase letters, digits and `-`, starting with a letter,
  at most 32 characters; none of the form's own names (`website`, `privacy`, `siteid`, `lang`, `form`,
  `fields`) or the form element's properties a control would shadow (`action`, `method`, `submit`,
  `reset`, `elements`, `length`, `target`, `enctype`, `encoding`, `dataset`); no field id may produce
  another's DOM id (`email` and `email-error`); at least one **required** `email` or `tel` field so the
  reply can reach the visitor. Section ids cannot take the fields' DOM ids (`contact-<id>`,
  `contact-<id>-error`, `contact-<id>-hint` when the field has a hint).
- `"enabled": false`: no form on the site. Every contact variant shows the heading and the contact
  details only (a business-card site reached by phone or e-mail): `business.phone` or `business.email` is
  then required, `showDetails` must stay on, and a local site's `/api/contact` answers 404.
- The e-mail lists every filled answer under its label in the form's order; the reply goes to the
  first e-mail field (none: no reply-to); the subject line uses a single-line `subject` field, else
  `name`, else the site's name.

#### The form's contract in the catalog

`npm run catalog` also writes, next to `catalog.json` in `dist-catalog/`, `form-contract.json` (field types, limits, patterns,
rules, autofill, the default form, and the messages and e-mail texts of every language) and `form-check.mjs`
(`lib/contact/fields.ts` + `checkSubmission.ts` as one plain ES module, no imports). A form service imports
`form-check.mjs` and runs `checkSubmission(body, site's fields or defaultFields, messages[lang])` with any
body that has `get(name)` (a `FormData`, a `URLSearchParams`): it judges a submission exactly as this engine's
own `/api/contact` does. Both files are regenerated with the catalog; never edit them.

#### Contact API contract (for the shared form service)

`POST <endpoint>` with `multipart/form-data` or `application/x-www-form-urlencoded`:

| Field | Required | Notes |
|---|---|---|
| `siteId` | yes | `site.json` siteId — the service maps it to the site's domain and recipient |
| `lang` | yes | site language, for messages and emails |
| the form's fields | as set | one value per field `id` of `contact.form.fields` (checked by their rules: the service keeps the site's field list, given with the site, and runs `checkSubmission`); without a list the default form: `name` (2–100 chars, single line), `email` (valid, ≤ 254), `subject` (optional, ≤ 150, single line), `message` (10–5000) |
| `privacy` | yes | non-empty (checkbox `on`) |
| `website` | — | honeypot: when filled, answer like a success and send nothing |

The request comes from the site's origin (`Origin` header): allow it with CORS and reject other origins.

Responses when the request has `Accept: application/json` (the form's JavaScript):

```json
{ "success": true, "message": "…" }
{ "success": false, "message": "…", "errors": [{ "field": "email", "message": "…" }] }
```

Status codes: `200` sent, `400` validation (field errors as above), `429` rate limited,
`500` delivery failed. Without `Accept: application/json` (no JavaScript) answer
`303 See Other` to `https://<site domain>/contact/sent` or `/contact/failed` — the domain comes
from the `siteId` mapping, never from the request (no open redirects).

`npm run test:remote` builds the demo in remote mode and checks all of the above on the site side.

## Environment Variables

Create `.env` from `.env.example`.

```env
SITE_URL=http://localhost:4321
PUBLIC_GA_MEASUREMENT_ID=
CONTACT_DELIVERY_MODE=console
```

Email delivery through Resend:

```env
CONTACT_DELIVERY_MODE=resend
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

Preview builds for the factory editor only ([Editor Preview Bridge](#editor-preview-bridge)):

```env
PREVIEW_EDITOR_ORIGIN=https://factory.mytko.dev
```

---

## Installation

```bash
npm install
```

---

## Development

```bash
npm run dev
```

Then open:

```txt
http://localhost:4321
```

Useful pages:

```txt
/           - demo home page
/contact    - contact form demo
/privacy    - privacy placeholder
```

---

## Build

```bash
npm run build
```

Run lint, type check and build together:

```bash
npm run validate
```

Run the production build locally (same server as in Docker):

```bash
npm run build
npm start
```

---

## System Build

Before production build, the project can generate system assets:

```bash
npm run tokens
npm run build-icons
npm run build:fonts
npm run build:app-icons
```

Recommended combined script:

```bash
npm run build:system
npm run build
```

---

## Icons

One consistent family: **Lucide** (`lucide-static`, ISC license) — 149 icons curated
for small-business sites in `src/design-system/icons/library.ts`, grouped into 12
categories (contact, time & booking, business, food, beauty & health, sport, auto,
home & construction, education, media & events, nature & pets, general) with Polish
and English keywords. `catalog.json` lists them for the orchestrator; site.json uses
them by name (`services` and `features` items, footer social links).

`npm run build-icons` (part of `build:system`) puts only the icons the site needs into
its sprite — the engine's own (`arrow-right`, `check`, `mail`, `map-pin`, `phone`) plus every `icon`
in site.json — so a page downloads a few KB. `ICONS=all npm run build-icons` builds the
whole set. The Lucide license is copied to `public/icons/LICENSE-lucide.txt`.

**Adding an icon:** add an entry to `icons` in `library.ts` (category, keywords and the
Lucide name in `lucide` when it differs), then `npm run build:system`.

```astro
---
import Icon from "@/components/media/Icon.astro";
---

<Icon name="mail" />
```

Icons follow the text color (`currentColor`) in light and dark schemes. Brand logos
(Facebook, Instagram…) are not included — they are trademarks; social links use
`external-link`.

---

## App Icons and Manifest

Source: `meta.icon` in site.json (square SVG or PNG, at least 512×512). Without it the
build draws a monogram — the first letter of `meta.name` on the accent color.
`npm run build:app-icons` (part of `build:system`) generates `favicon.ico`,
`favicon.svg` (SVG sources and monograms), `icons/icon-192.png`, `icons/icon-512.png`
and `icons/apple-touch-icon.png` (opaque), plus the Open Graph image when
`meta.seo.image` is not set. The 512 px icon is also the logo in structured data;
`site.webmanifest` is generated from site.json.

---

## Fonts

Fonts come from `@fontsource-variable` packages (SIL Open Font License) — no font
files are committed. `src/design-system/fonts/library.ts` lists the families and the
12 pairs; the site picks one with `theme.fontPair` (default: the archetype's pair).

`npm run build:fonts` (part of `build:system`, `scripts/build-fonts.ts`) copies only
the families of that pair and only the subsets the language needs — `latin` and
`latin-ext`, plus `cyrillic` for Cyrillic languages — to `public/fonts/` with a
content hash in each file name, and generates:

- `src/styles/abstracts/_fonts.scss` — `@font-face` rules (variable weight range,
  `unicode-range`) and a metric-matched `"<Family> Fallback"` face per family
  (local Arial / Times New Roman with `size-adjust` and ascent/descent overrides);
- `src/design-system/fonts.generated.ts` — the regular face of the main script is preloaded;
- `public/fonts/LICENSES.txt` — the licenses of the shipped fonts.

**Adding a family:** `npm install @fontsource-variable/<family>`, add it to
`fontFamilies` (and a pair to `fontPairs`) in `library.ts`, then
`npm run build:system`. `tests/unit/fonts.test.ts` checks that every pair resolves.

---

## Creating a New Site

1. Copy a fixture: `cp -r sites/_fixtures/cafe-warm sites/<client>`.
2. Edit `site.json` (`siteId`, `meta`, `business`, `theme`, pages and sections) and put the
   images in `assets/` with their `alt` text in `assets/assets.json`.
3. `npm run site:validate -- --site sites/<client>` — every problem is one readable line.
4. `npm run site:preview -- --site sites/<client>`, then `npm run site:report` before launch.

Pages are never written as `.astro` files: add a page to `pages[]`, a section to its
`sections[]`. New layouts of a section are new **variants** (see "Section catalog");
components in `src/components/` are the building blocks variants are made of.

---

## Testing

```bash
npm run validate         # system build, lint, unit tests (Vitest), type check, build
npm run test:unit        # Vitest only
npm run test:e2e         # Playwright: builds the demo with test values, browser tests
npm run test:lighthouse  # Lighthouse CI on the test build (run after test:e2e)
npm run test:broken-site # an invalid site.json stops validation and the build
npm run test:remote      # contact "remote" mode produces a purely static site
npm run test:outside     # builds into a folder outside the project, both contact modes
npm run test:catalog     # generated min/max catalog in all 8 archetypes
npm run test:fixtures    # the six fixture sites (+ report gates for three of them)
npm run test:bridge      # editor preview bridge: the demo built for an editor, in its iframe
npm run ci               # validate + broken-site + remote + e2e + Lighthouse + bridge
npm run test:docker      # production Docker image smoke test (needs Docker)
```

End-to-end tests (`tests/e2e/`, desktop and mobile Chrome, demo site):

- **pages** — status, one `<h1>`, `lang`, title, description, canonical, valid JSON-LD,
  404 page, trailing-slash redirect, `robots.txt`, sitemap, manifest, icons
- **a11y** — axe-core WCAG 2.2 AA on every page, light and dark scheme
- **cookies** — banner without focus stealing, reject, accept (GA loads only after
  consent), reopening from the footer, equal button weight
- **contact** — successful send, field errors (focus on the first invalid field),
  consent and length validation, rate limit, honeypot, header injection, no-JS
  redirect, `405` with `Allow`
- **keyboard** — skip link, mobile menu (Enter, Tab into links, Escape returns focus,
  outside click closes), navigation without JavaScript, visible focus
- **security** — headers on pages, 404, API and static files, CSP without
  `unsafe-inline`, immutable assets/fonts/sprite, `/_image` disabled, no inline `style`
- **editor-bridge** (`npm run test:bridge`, `PREVIEW_EDITOR_ORIGIN`) — the demo in an iframe of a
  tiny editor page on another port: ready, layout, focus, select, links do not navigate, messages
  of another origin ignored, `frame-ancestors`; without the variable: no bridge in the build
- **site** (`SITE_SMOKE=1`, any `SITE_DIR`) — one `<h1>` and valid JSON-LD per page,
  nothing overflows and no section container collapses at 320/768/1440 px, axe clean;
  used by the catalog and fixture tests

Every test fails on console errors or CSP violations. Google Analytics requests are
blocked in tests.

### Fixture sites

`sites/_fixtures/` holds six realistic Polish sites — a dance school (4 pages), a car
repair shop (one page) and a café (2 pages), each in two designs built from **the same
content**, like the two proposals the orchestrator makes for a brief:

| Site | Archetype · accent | Notes |
|---|---|---|
| `dance-elegant` / `dance-energetic` | elegant · pink / energetic · purple | 4 pages: schedule, team, map; hero split-image / minimal |
| `auto-corporate` / `auto-bold` | corporate · orange / bold · yellow | stats, process; hero panel / cover; corporate uses contact `remote` |
| `cafe-warm` / `cafe-premium-dark` | warm · orange / premium-dark · yellow | partner logos, map; premium-dark is a dark site |

`npm run test:fixtures` also runs `site:compare` on every pair. Images are generated abstract
placeholders (no stock photos or licences) — real photos come from the client or the
generator, not from the engine. The content lives in `scripts/site/make-fixtures.ts`; after
changing it run `npx tsx scripts/site/make-fixtures.ts` and commit the result.

Lighthouse thresholds (`lighthouserc.cjs` and `site:report`): performance ≥ 90,
accessibility, best practices and SEO ≥ 95.

GitHub Actions (`.github/workflows/ci.yml`) on every pull request and push to `main`:
quality (validate, broken site, remote mode, e2e, Lighthouse), Docker smoke test,
catalog in 8 archetypes and the fixture sites; reports are uploaded as artifacts.

The first run needs Playwright's Chromium: `npx playwright install chromium`.

---

## Breakpoints

`@include mq(md)` is **mobile-first** — styles apply from the breakpoint up
(`min-width`). Use `@include mq-down(sm)` for styles below a breakpoint.
Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

---

## Deployment Notes

Pages are static; the contact form API runs on demand. The site is served by
`server.mjs` (Astro's Node handler plus security and caching headers) inside Docker:

```bash
cp .env.example .env   # set SITE_URL, PUBLIC_GA_MEASUREMENT_ID, CONTACT_* values
docker compose up -d --build
```

`SITE_URL` and `PUBLIC_GA_MEASUREMENT_ID` are build-time values (passed as build args by
`compose.yaml`). The container listens on `127.0.0.1:4322` and is meant to sit behind a
reverse proxy (e.g. Caddy) that handles HTTPS and compression.

`npm run test:docker` builds the image and checks that it really runs in production
mode (HSTS, contact form refuses to "send" without `CONTACT_DELIVERY_MODE`, no GA
debug mode, immutable font caching). CI runs it on every pull request.

---

## Editor Preview Bridge

v3.6: the factory editor shows a preview build of the site in an iframe next to its sections panel
and drives it with `window.postMessage`. The build gets the editor's origin:

```bash
PREVIEW_EDITOR_ORIGIN=https://factory.mytko.dev SITE_URL=https://<preview host> \
  npm run site:build -- --site <site dir> --out <dir>
```

Without `PREVIEW_EDITOR_ORIGIN` (every production build) the bridge is not even imported — no
script, no CSS (`virtual:editor-bridge`; the e2e suite checks it). Anything but an http(s) origin
stops the build. `server.mjs` with the same variable sends `Content-Security-Policy: frame-ancestors
<origin>` instead of `X-Frame-Options: DENY`; a Caddy preview host needs the same header (a
`<meta>` policy cannot allow framing).

The bridge (`src/components/EditorBridge.astro`) runs only when the page is in a frame. It posts to
the editor's origin only, never `"*"`, and ignores every message that does not come from the parent
window with the editor's origin. The editor sends its messages after `factory:ready`.

| Direction | Message | What happens |
|---|---|---|
| preview → editor | `{ type: "factory:ready", page, sections: [{ id, type, variant, title }] }` | on load: the page path (`/`, `/contact`) and its sections in DOM order; `title` is the section's heading text or `null` |
| editor → preview | `{ type: "factory:layout", order: [ids], hidden: [ids] }` | sections in `<main>` reordered without a reload: the listed ids first, the others after them in their order, unknown ids ignored; the first section stays first (it has the page's only `<h1>`); `hidden` ones get the `hidden` attribute, the others lose it |
| preview → editor | `{ type: "factory:layout-applied" }` | after every layout message |
| editor → preview | `{ type: "factory:focus", id }` | smooth scroll to the section (instant with reduced motion) and an outline (`.is-editor-focus`) until the next focus; `id: null` clears it |
| preview → editor | `{ type: "factory:select", id }` | the visitor clicked inside a section |

In the editor, links do not leave the page: a click on a link to another page, `tel:`, `mailto:` or
a new tab only selects its section (the panel is the place to edit; header and footer links do
nothing). Links within the page, buttons, forms and widgets (menu, sliders, lightbox, FAQ) work as
usual. Opened on its own, outside a frame, a preview build behaves like a normal site.

---

## Factory Signature

v3.7: every site carries a few quiet easter eggs that lead to one another (`src/site/signature.ts`).
Their texts are in the site's language (`signature` in every dictionary); the "Powered by mytko
factory" lockup is a brand name and stays the same everywhere.

| Where | What |
|---|---|
| page source | a comment under the viewport meta: "mytko factory" in box-drawing letters, who built the site, a hint to open the console (no `--` inside, whatever the site name) |
| browser console | the wordmark on a dark card, a link to factory.mytko.dev and the way to `/humans.txt` |
| `/humans.txt` | the site owner, Mytko Website Factory and the studio, language, last build date, technology; ends with the hint to the footer mark (`<link rel="author">` points to it) |
| `<meta name="generator">` | `Mytko Website Factory <engine version>`; Astro's own generator tag stays as a second one |
| footer | "Powered by [mark] mytko factory" at the end of the bottom row; the link goes to factory.mytko.dev (`rel="noopener nofollow"`: a footer link on every client site must not look like a link scheme). The mark is a button that opens a native popover (no script) with a few words about how the site was made. |

---

## Version

Current version: **v3.7** (`3.7.0`), `schemaVersion` 1 (v3.0 sites work unchanged). The v2
starter is kept on the `v2` branch / tag `v2.0.0`.

v3.7: Factory signature — "Powered by mytko factory" with a secret mark in the footer (replaces
"Website by Mytko.dev"), a source comment, a console note, `/humans.txt` and the Factory's generator
meta tag, all in the site's language ([Factory Signature](#factory-signature)).

v3.6: editor preview bridge — a build with `PREVIEW_EDITOR_ORIGIN` lists its sections to the factory
editor and follows its panel (order, hidden sections, focus, selection) over `postMessage`;
production builds contain none of it ([Editor Preview Bridge](#editor-preview-bridge)).

v3.5: eight navbars (new `brand-bar`, `dark-bar`, `split`, `floating`, `minimal`) and eight footers
(new `cta-band`, `cards`, `contact-first`, `big-name`, `rounded-card`; prop `tone` auto | light |
dark | brand; optional `ctaTitle`, `ctaText`, `ctaAction`, `ctaImage`, `wordmark`). A site ships only
its own navbar and footer variant CSS (`virtual:navbar-style`, `virtual:layout-components`).

v3.4: 104 variants — six new hero layouts (`title-below`, `band`, `offset-card`, `rounded-card`,
`bold-type`, `giant-word`; new optional `word`) and five new about layouts (`textured`,
`experience`, `editorial`, `bio`, `milestones`; new optional `titleHighlight`, `secondImage`,
`points`, `quote`/`quoteAuthor`, `milestones`). Hero and about styles load per variant too.

v3.3 (layout review of the first generated sites):

- 18 section types, 93 variants (was 37): at least six clearly different layouts for features,
  stats, process, pricing, team, schedule, testimonials, gallery, logo cloud, FAQ, CTA, contact and
  hours & location; new optional content fields only (switching variants never loses content)
- new widgets: `Progress` (ring, bar), `Lightbox` (photo viewer on a native dialog), Slider with
  one-per-view and dots, live "open now" status in the business time zone, click-to-load maps in
  the contact and hours-location map variants
- phones: the hero shows the headline, text, then the photo, then the buttons; the menu is centered;
  navbar props `menuButton` (`label` | `icon`) and `hideOnScroll`; the columns footer has four
  columns with the contact details last; calmer counters
- lighter pages: a site ships only the CSS of the variants it uses (`virtual:section-components`,
  style files per variant, ~15 KB gzip instead of 41), `server.mjs` gzips in Astro server mode too
- colors mix in OKLab (accent tints keep their hue), card borders follow inverse/accent palettes
- every new interface text in all 12 languages

v3.2.1: lighter pages — photos encode at quality 72 (the cover hero at 55, under its overlay,
widths up to 1600), and `server.mjs` sends text files gzip-compressed in static mode, like the
Caddy sites, so the Lighthouse gate measures what visitors get.

v3.2 (design review of the first generated sites):

- wide content aims at 1224px (`container--lg`/`--xl` = 76.5rem, fluid `min()`), lower section
  rhythm (80/96px) so a section usually fits one screen
- the hero fills the first screen (`100svh` minus the sticky header, measured at runtime);
  pictures next to text take the text block's height (hero split, about)
- calmer motion (240/320/480ms), wider button paddings, secondary actions are ghost buttons,
  actions stack at full width on phones
- reusable widgets: `Counters` (count-up for `[data-counter]`: stats and highlights) and
  `Slider` (testimonials with more than 3 items)
- phone menu: full screen under the header, smooth open/close, staggered links, no page scroll
- wider contact form, smaller footer bottom padding, "Strona wykonana przez Mytko.dev" in the
  footer and a short signature in the browser console (pl/uk/en)

v3.1 adds:

- 6 section types — `schedule`, `team`, `stats`, `process`, `logo-cloud`, `embed` — and the
  hero variants `panel` and `minimal` (17 types, 37 variants)
- 149 Lucide icons in 12 business categories with keywords, per-site sprite
- distinct designs: accent families, recommended accents per archetype, `site:compare`
- `--out` outside the project (orchestrator workspace) for build, screenshot and report
- all sections render through `SectionShell` (the v2 widgets layer is gone)

v3.0 added to v2:

- the site engine: everything from `site.json`, Zod schemas, readable errors, untrusted input
- section catalog with navbar and footer variants and min/max boundary tests
- themes: 8 archetypes, generated OKLCH palettes with WCAG AA correction, shape tokens,
  12 font pairs with per-language subsets
- images: slots with proportions and minimum sizes, focal-point crops, generated app icons
  and Open Graph image
- business data → hours table, address, JSON-LD (openingHoursSpecification, FAQPage)
- contact modes: local Node API or remote form service (static site), CSP built per site
- orchestrator CLI: validate / build / preview / screenshot / report.json, AI catalog and
  JSON Schema, visual gallery, schema migrations
- six fixture sites and CI jobs for the catalog and fixtures
