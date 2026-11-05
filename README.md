# Astro Starter V2

Reusable Astro starter for building landing pages and small websites faster.

The project includes a production-oriented frontend system with design tokens, SCSS architecture, layout primitives, UI components, media components, reusable widgets and a backend-ready contact form.

---

## Tech Stack

- Astro
- TypeScript
- SCSS / Sass
- Design tokens
- SVG sprite icons
- Local font pipeline (pure Node: subset-font + fontkit, no Python)
- Astro API routes
- Node adapter ready for VPS deployment

---

## Project Structure

```txt
src/
├─ assets/
│  ├─ fonts/
│  ├─ icons/
│  └─ images/
│
├─ components/
│  ├─ form/
│  ├─ layouts/
│  ├─ media/
│  ├─ ui/
│  └─ widgets/
│
├─ config/
│  ├─ analytics.ts
│  └─ site.ts
│
├─ design-system/
│  ├─ tokens/
│  └─ utils/
│
├─ i18n/
│  ├─ dictionaries/   (en.ts, pl.ts, uk.ts — one file per language)
│  └─ index.ts
│
├─ layouts/
│  ├─ BaseLayout.astro
│  ├─ Header.astro
│  └─ Footer.astro
│
├─ lib/
│  └─ contact/
│
├─ pages/
│  ├─ api/
│  ├─ 404.astro
│  ├─ 500.astro
│  ├─ robots.txt.ts
│  ├─ index.astro
│  ├─ contact.astro
│  ├─ playground.astro
│  └─ privacy.astro
│
└─ styles/
   ├─ abstracts/
   ├─ base/
   ├─ components/
   ├─ layouts/
   ├─ state/
   └─ widgets/

scripts/   - build scripts (tokens, icons, fonts) and client scripts
public/    - static files (fonts, icon sprite, og-cover.jpg)
```

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
messages, emails, 404/500, privacy page) come from dictionaries in
`src/i18n/dictionaries/`. The language is chosen in **one place**:

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
  - `noindexPaths` — `noindex` meta and left out of the sitemap (e.g. `/playground`)
  - `sitemapExcludedPaths` — indexable, but not in the sitemap (e.g. `/privacy`)
- Custom `404` (prerendered) and `500` pages, both `noindex`.
- Every page has exactly one `<h1>`.

---

## Structured Data (JSON-LD)

Every page gets one `@graph` built from `siteConfig` (`src/lib/seo/schema.ts`):

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
- `src/middleware.ts` adds `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` and HSTS
  (for an `https://` `SITE_URL` in production).
- Hashed assets in `/_astro/` are served with `Cache-Control: immutable` (1 year).
- Static files are served before middleware — set the same headers in the reverse proxy.

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
src/pages/api/contact.ts
  ↓
validateContactForm.ts
  ↓
sendContactMessage.ts
  ↓
console delivery / Resend
```

Server-side checks: required fields, email format, length limits
(`src/lib/contact/limits.ts`, also used as `maxlength` in the form), privacy
consent, honeypot and a rate limit of 5 messages per 10 minutes per IP.

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
/           - welcome page
/playground - widget playground
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

Preview production build:

```bash
npm run preview
```

---

## System Build

Before production build, the project can generate system assets:

```bash
npm run tokens
npm run build-icons
npm run build:fonts:latin
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
`icons/icon-32.png`, `icons/icon-192.png`, `icons/icon-512.png` and
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

2. Run one of:

```bash
npm run build:fonts:latin
npm run build:fonts:cyrillic
npm run build:fonts:all
```

3. Check generated font files in:

```txt
public/fonts/
```

4. Check generated `@font-face` rules in:

```txt
src/styles/abstracts/_fonts.scss
```

File names: `<family>-<weight or style>.<ext>`, e.g. `inter-regular.woff2`,
`inter-bold.woff2`, `roboto-500-italic.ttf`.

The script also generates:

- a metric-matched `"<Family> Fallback"` face (local Arial with `size-adjust` and
  ascent/descent overrides) — add it after the font in the typography tokens to
  limit layout shift while the web font loads;
- `src/design-system/fonts.generated.ts` — the regular face is preloaded in `BaseLayout`.

The starter ships the official Inter 4.1 (SIL Open Font License, see
`src/assets/fonts/raw/inter-LICENSE.txt`).

---

## Creating a New Widget

Recommended structure:

```txt
src/components/widgets/NewWidget.astro
src/styles/widgets/_new-widget.scss
```

Then import styles in:

```txt
src/styles/main.scss
```

Example:

```scss
@use "./widgets/new-widget";
```

Widget rules:

- use layout primitives
- use UI primitives
- use semantic design tokens
- accept `class?: string`
- spread `...restProps`
- do not import local SCSS inside `.astro`
- keep widget-specific styles in `src/styles/widgets/`

---

## Creating a New Page

Example:

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Hero from "@/components/widgets/Hero.astro";
import FeatureGrid from "@/components/widgets/FeatureGrid.astro";
---

<BaseLayout
  title="Page title"
  description="Page description"
>
  <Hero
    title="Page headline"
    description="Page intro text"
  />

  <FeatureGrid
    title="Features"
    items={[
      {
        title: "Feature one",
        description: "Feature description.",
      },
    ]}
  />
</BaseLayout>
```

---

## Testing

```bash
npm run validate     # lint, type check, build
npm run test:e2e     # Playwright: builds with test values and runs browser tests
npm run test:lighthouse  # Lighthouse CI on the test build (run after test:e2e)
npm run ci           # everything above, as in GitHub Actions
```

End-to-end tests (`tests/e2e/`, desktop and mobile Chrome):

- **pages** — status, one `<h1>`, `lang`, title, description, canonical, valid JSON-LD,
  404 page, trailing-slash redirect, `robots.txt`, sitemap, manifest, icons
- **a11y** — axe-core WCAG 2.2 AA on every page, light and dark scheme
- **cookies** — banner without focus stealing, reject, accept (GA loads only after
  consent), reopening from the footer, equal button weight
- **contact** — successful send, field errors from the server, consent and length
  validation, rate limit
- **keyboard** — skip link, mobile menu with Enter/Escape, visible focus
- **security** — security headers, CSP without `unsafe-inline`, immutable assets,
  no inline `style` attributes

Every test fails on console errors or CSP violations. Google Analytics requests are
blocked in tests.

Lighthouse thresholds (`lighthouserc.cjs`): performance ≥ 90, accessibility,
best practices and SEO ≥ 95.

GitHub Actions (`.github/workflows/ci.yml`) runs `validate`, e2e and Lighthouse on
every pull request and push to `main`; reports are uploaded when a step fails.

The first run needs Playwright's Chromium: `npx playwright install chromium`.

---

## Breakpoints

`@include mq(md)` is **mobile-first** — styles apply from the breakpoint up
(`min-width`). Use `@include mq-down(sm)` for styles below a breakpoint.
Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

---

## Deployment Notes

Because this project includes an Astro API route for the contact form, it is not purely static.
It runs as a Node server (`@astrojs/node`, standalone) inside Docker:

```bash
cp .env.example .env   # set SITE_URL, PUBLIC_GA_MEASUREMENT_ID, CONTACT_* values
docker compose up -d --build
```

`SITE_URL` and `PUBLIC_GA_MEASUREMENT_ID` are build-time values (passed as build args by
`compose.yaml`). The container listens on `127.0.0.1:4322` and is meant to sit behind a
reverse proxy (e.g. Caddy) that handles HTTPS.

---

## Version

Current version: **V2** (`2.0.0`).

V2 includes:

- design tokens with light and dark color schemes
- SCSS architecture
- layout, UI, form and media primitives
- reusable widgets (Hero, FeatureGrid, CTA, FAQ, ContactForm, Navbar, Accordion)
- one-switch site language (`siteConfig.lang`) with any number of dictionaries
- SEO: titles, canonical, Open Graph, Twitter Card, JSON-LD, sitemap, robots.txt, 404/500
- GDPR-friendly cookie banner with Consent Mode v2 and consent withdrawal
- ContactForm with server validation, rate limit and Resend delivery
- Docker deployment
- automated tests: Playwright e2e, axe-core accessibility, Lighthouse CI, GitHub Actions
