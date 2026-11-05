# Astro Starter v3

A website engine for small business sites: one `site.json` (content, business data,
theme, layout) in, a fast, accessible, secure static site out. Built for an
orchestrator (Mytko Website Factory) that turns a client brief into two clearly
different designs from the same content — but just as usable by hand.

- **11 section types, 23 variants**, 3 navbars and 3 footers, all validated by Zod schemas
- **8 archetypes** (style presets) × brand accent with automatic WCAG AA correction,
  12 local font pairs (Latin, Latin Extended, Cyrillic), light / dark / auto schemes
- SEO and JSON-LD from business data (opening hours, address, FAQ), GDPR cookie banner,
  CSP without `unsafe-inline`, contact form — own Node API or any form service
- CLI for the orchestrator: validate, build, screenshots, `report.json` with axe and
  Lighthouse gates, AI catalog and JSON Schema, schema migrations
- Tests on every change: 230 unit tests, Playwright e2e + axe, Lighthouse, a generated
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
├─ components/        layout, UI, form, media primitives and widgets
├─ layouts/           BaseLayout, Header, Footer
├─ i18n/dictionaries/ one file per language (en, pl, uk)
├─ lib/contact/       contact form validation and delivery
├─ pages/             [...slug].astro (all site pages), privacy, contact results, 404/500
└─ styles/

scripts/
├─ site/              CLI: validate, build, preview, screenshot, report, migrate,
│                     catalog, gallery, make-catalog, make-fixtures, test scripts
└─ build-*.ts|js      per-site system assets: tokens, fonts, icons, app icons, OG image

tests/unit/           Vitest (schemas, theme, fonts, CSP, migrations, catalog…)
tests/e2e/            Playwright (pages, a11y, cookies, contact, keyboard, security, site.spec)
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
npm run site:screenshot -- --site <dir> [--out <dir>]  # desktop + mobile PNG of every page
npm run site:report -- --site <dir> [--out <dir>]   # build + axe + Lighthouse + screenshots → report.json
```

`site:report` writes `<out>/report.json` for the orchestrator (default out:
`.generated/sites/<siteId>`): engine and schema version, validation issues and warnings
(legal review of the privacy template, missing data, accent adjustments), resolved theme,
per page axe violations, Lighthouse scores and screenshot paths, and the quality gates
(`build`, `a11y`, `lighthouse` ≥ 90/95/95/95). Exit code 1 when a gate fails; an invalid
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
| `hero` | `split-image`, `centered`, `cover-image` (photo behind text, accent tone allowed) |
| `about` | `image-side`, `centered` |
| `services` | `cards`, `price-list` |
| `features` | `cards-grid`, `icon-list` |
| `testimonials` | `cards`, `spotlight` |
| `gallery` | `grid`, `mosaic` |
| `pricing` | `cards`, `compact` |
| `faq` | `accordion`, `two-column` (both publish FAQPage JSON-LD) |
| `cta` | `boxed`, `banner` |
| `contact` | `form-split`, `form-centered` (details from `business`) |
| `hours-location` | `card`, `compact` (hours, address, phone from `business`) |
| layout `navbar` | `simple`, `centered`, `topbar` (phone/email bar) |
| layout `footer` | `columns`, `simple`, `centered` |

Common section props: `tone` (`default`, `muted`, `inverse`; `accent` for hero, about, cta),
`spacing`, `align`. Without `tone` the archetype default for the type is used.

**Adding a variant:** add it to `variants` in `src/sections/<type>/schema.ts` (description,
used optional fields, own props), create `src/sections/<type>/<Variant>.astro` with
`SectionShell` + `SectionHeader`, register it in `src/site/components.ts` and add styles in
`src/styles/sections/`. Content stays the type's content — never add variant-only content fields.

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

Per-project content lives in one file: `src/config/site.ts`.

- `lang` — **the one switch for the site language** (see Language below)
- `name`, `description` — site name (used in titles) and default meta description
- `author`, `keywords` — optional meta tags (empty = not rendered)
- `colorScheme` — `"light"`, `"dark"` or `"auto"` (follows system preference)
- `seo.image`, `seo.imageAlt` — default Open Graph image
- `header.nav`, `header.cta` — main navigation
- `footer` — footer description, link groups, social links

The public site URL is **not** stored in code. Set `SITE_URL` in `.env`
(and as a Docker build arg). It is used for `Astro.site`, canonical links,
sitemap, Open Graph URLs and `security.allowedDomains` (`www.` is added automatically).

Replace `public/og-cover.jpg` (1200×630) with the project cover.

---

## Language

All UI texts (navigation, footer, cookie banner, contact form, validation
messages, emails, 404/500, contact result pages, privacy page) come from
dictionaries in `src/i18n/dictionaries/`. The language is chosen in **one place**:

```ts
// src/config/site.ts
const lang = "pl";
```

Any language works. The file name is the language code:

1. Copy `en.ts` to `<code>.ts` (e.g. `de.ts`, `pt-BR.ts`).
2. Translate the texts and set `meta.ogLocale` (e.g. `de_DE`) and `meta.dir`
   (`"rtl"` for Arabic, Hebrew…).
3. Set `lang` in `site.ts`.

No registration is needed — dictionaries are picked up automatically.

Project **content** is not part of the dictionaries and must be written in the
site language: `name`, `description`, `footer.description`, `seo.imageAlt` and
`organization` in `site.ts`, plus the page content itself.
TypeScript checks that every dictionary has the same keys as `en.ts`.
An unknown `lang` stops the build with a clear error.

In components use:

```astro
---
import { t, format } from "@/i18n";
---
<p>{t.footer.cookieSettings}</p>
<p>{format(t.footer.copyright, { year: 2026, siteName: "Acme" })}</p>
```

Page titles follow `t.meta.titleTemplate` (`"{title} | {siteName}"`) — pass only
the page part: `<BaseLayout title="Contact">`.

---

## SEO and Indexing

- `robots.txt` is generated with the sitemap URL; `/api/` is disallowed.
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
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
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

The icon system uses an SVG sprite generated from raw SVG files.

---

### Widgets

Available page widgets:

- `Hero`
- `FeatureGrid`
- `CTA`
- `FAQ`
- `ContactForm`
- `Navbar`
- `Accordion`

Widgets are larger reusable page sections built from smaller primitives.

Site layouts (`src/layouts/`): `BaseLayout`, `Header`, `Footer`.

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

Server-side checks: required fields, email format, length limits
(`src/lib/contact/limits.ts`, also used as `maxlength` in the form), privacy
consent, honeypot, line breaks removed from name/subject (email header safety) and
a rate limit of 5 valid messages per 10 minutes per IP (invalid attempts do not count).
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

#### Contact API contract (for the shared form service)

`POST <endpoint>` with `multipart/form-data` or `application/x-www-form-urlencoded`:

| Field | Required | Notes |
|---|---|---|
| `siteId` | yes | `site.json` siteId — the service maps it to the site's domain and recipient |
| `lang` | yes | site language, for messages and emails |
| `name` | yes | 2–100 chars, single line |
| `email` | yes | valid email, ≤ 254 chars |
| `subject` | no | ≤ 150 chars, single line |
| `message` | yes | 10–5000 chars |
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

## Adding a New Icon

The icon name is the SVG file name without `.svg`.

1. Add raw SVG to:

```txt
src/assets/icons/raw/
```

2. Run:

```bash
npm run build-icons
```

3. Use icon:

```astro
---
import Icon from "@/components/media/Icon.astro";
---

<Icon name="mail" />
```

Included icons: `menu`, `close`, `check`, `arrow-right`, `chevron-down`,
`external-link`, `star`, `grid`, `blocks`, `image`, `code`, `mail`, `phone`,
`map-pin`, `clock`.

Icon rules (enforced by `svgo.config.js`): 24×24 `viewBox`, every color is turned
into `currentColor`, so icons follow the text color in light and dark schemes.
Brand logos (Facebook, Instagram…) are not included — add them from the brand's
official assets.

---

## App Icons and Manifest

One source file: `src/assets/brand/app-icon.svg` (preferred) or `app-icon.png`
(square, at least 512×512, transparent background). `npm run build:app-icons`
(part of `build:system`) generates `favicon.ico`, `favicon.svg` (SVG source only),
`icons/icon-192.png`, `icons/icon-512.png` and
`icons/apple-touch-icon.png` (opaque, background taken from the icon).

The starter ships the Mytko Workflow logo as its icon — replace it with the
client's logo mark in every project. The 512 px icon is also the
default logo in structured data. `site.webmanifest` is generated from `siteConfig`.

---

## Adding a New Font

1. Add raw font files to:

```txt
src/assets/fonts/raw/
```

2. Run:

```bash
npm run build:fonts            # auto: latin + latin-ext, plus cyrillic for uk/ru/bg/…
node scripts/build-fonts.js all  # force all subsets
```

Subsets follow Google Fonts: `latin` (incl. „ ” ’ – — … € ™), `latin-ext`
(Polish, Czech, Romanian… — downloaded only when a page uses these characters) and
`cyrillic`. The language comes from `const lang` in `site.ts`; the regular face of
the main script is preloaded.

3. Check generated font files in:

```txt
public/fonts/
```

4. Check generated `@font-face` rules in:

```txt
src/styles/abstracts/_fonts.scss
```

Generated file names contain a content hash (`inter-400-latin.1a2b3c4d.woff2`).

Raw file names: `<family>-<weight or style>.<ext>`, e.g. `inter-regular.woff2`,
`inter-bold.woff2`, `roboto-500-italic.ttf`.

The script also generates:

- a metric-matched `"<Family> Fallback"` face (local Arial with `size-adjust` and
  ascent/descent overrides) — add it after the font in the typography tokens to
  limit layout shift while the web font loads;
- `src/design-system/fonts.generated.ts` — the regular face is preloaded in `BaseLayout`.

The starter ships the official Inter 4.1 (SIL Open Font License, see
`src/assets/fonts/raw/inter-LICENSE.txt`).

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
npm run test:catalog     # generated min/max catalog in all 8 archetypes
npm run test:fixtures    # the six fixture sites (+ report gates for three of them)
npm run ci               # validate + broken-site + remote + e2e + Lighthouse
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
- **site** (`SITE_SMOKE=1`, any `SITE_DIR`) — one `<h1>` and valid JSON-LD per page,
  nothing overflows and no section container collapses at 320/768/1440 px, axe clean;
  used by the catalog and fixture tests

Every test fails on console errors or CSP violations. Google Analytics requests are
blocked in tests.

### Fixture sites

`sites/_fixtures/` holds six realistic Polish sites — a dance school (4 pages), a car
repair shop (one page) and a café (2 pages), each in two designs built from **the same
content**, like the two proposals the orchestrator makes for a brief:

| Site | Archetype | Notes |
|---|---|---|
| `dance-elegant` / `dance-energetic` | elegant / energetic | multi-page, local contact API |
| `auto-corporate` / `auto-bold` | corporate / bold | corporate uses contact mode `remote` (static) |
| `cafe-warm` / `cafe-premium-dark` | warm / premium-dark | premium-dark is a dark site |

Images are generated abstract compositions (no stock photos or licences). The content
lives in `scripts/site/make-fixtures.ts`; after changing it run
`npx tsx scripts/site/make-fixtures.ts` and commit the result.

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

## Version

Current version: **v3** (`3.0.0`), `schemaVersion` 1. The v2 starter is kept on the
`v2` branch / tag `v2.0.0`.

v3 adds to v2:

- the site engine: everything from `site.json`, Zod schemas, readable errors, untrusted input
- section catalog: 11 types, 23 variants, navbar and footer variants, min/max boundary tests
- themes: 8 archetypes, generated OKLCH palettes with WCAG AA correction, shape tokens,
  12 font pairs with per-language subsets
- images: slots with proportions and minimum sizes, focal-point crops, generated app icons
  and Open Graph image
- business data → hours table, address, JSON-LD (openingHoursSpecification, FAQPage)
- contact modes: local Node API or remote form service (static site), CSP built per site
- orchestrator CLI: validate / build / preview / screenshot / report.json, AI catalog and
  JSON Schema, visual gallery, schema migrations
- six fixture sites and CI jobs for the catalog and fixtures
