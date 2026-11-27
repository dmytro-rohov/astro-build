# Astro Starter v3.1

A website engine for small business sites: one `site.json` (content, business data,
theme, layout) in, a fast, accessible, secure static site out. Built for an
orchestrator (Mytko Website Factory) that turns a client brief into two clearly
different designs from the same content — but just as usable by hand.

- **19 section types, 112 variants**, 8 navbars, 8 footers and 7 blog post layouts, all validated by Zod schemas
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
npm run site:check-section -- --site <dir> --section <id> [--out <dir>] [--no-build]  # v3.13: gates of one section at 320/390/768/1440 → section.json
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
- **The menu** (`navigation.auto`, the default; `src/site/menu.ts`): a site of several pages lists
  its pages (`pages[].nav`). v3.10: a one-page site (one page besides the blog's) lists that page's
  sections as anchors (`/#id`), on computers and in the phone menu: by default `services`, `about`,
  `pricing`, `contact`, `testimonials`, `gallery`, `team`, `faq`, `process`, `schedule`, `features`,
  `hours-location`, `posts`, at most 6 (those first in this list stay), each under its type's word
  in the site's language; then the blog's page. A section's `nav` decides for it:
  `"nav": { "show": false }` keeps it out, `"show": true` puts any section in, `"label"` (24 characters)
  is its own word (e.g. "O mnie" on a personal site). The footer's default link group follows the menu.
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
| `posts` | `cards`, `featured` (the newest post large, cards below), `rows` (photo left, text right), `magazine` (one big post with its title on the photo, two medium, small cards), `minimal` (typographic rows without photos), `photo-grid` (square photo tiles like an Instagram profile), `carousel` (cards in a slider), `timeline` (posts by month on a vertical line). The blog's posts from `blog.posts` (v3.9, [Blog](#blog)); props `limit`, `category`, `filter` (category buttons), `perPage` ("show more") |
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

### Custom sections (`customLayouts`, since 3.13)

A section no variant can draw (before/after photos, an unusual comparison) is a **custom section**:
a layout of the site's own in `customLayouts.<name>`, drawn by every section `{ "type": "custom",
"variant": "<name>" }` with that layout's content. The factory's AI writes it when a client asks for
something the catalog does not have; a person reviews it later; a layout that proves itself becomes a
real variant almost 1:1 (its parts mirror a variant's `.astro`, `.scss` and `schema.ts`).

```json
"customLayouts": {
  "before-after": {
    "version": 1,
    "label": "Przed i po",
    "fields": [
      { "key": "title", "type": "text", "label": "Tytuł sekcji", "required": true },
      { "key": "pairs", "type": "list", "label": "Pary zdjęć", "min": 1, "max": 6, "fields": [
        { "key": "before", "type": "image", "label": "Przed", "aspect": [4, 3], "minWidth": 800, "required": true },
        { "key": "after", "type": "image", "label": "Po", "aspect": [4, 3], "minWidth": 800, "required": true }
      ] }
    ],
    "template": "<h2 class=\"c-title\" data-text=\"title\"></h2><ul class=\"c-pairs\"><li data-each=\"pairs\"><div data-behavior=\"compare\" data-before=\"before\" data-after=\"after\"></div></li></ul>",
    "css": ".c-pairs { display: grid; gap: var(--spacing-lg); margin: 0; padding: 0; list-style: none; }"
  }
}
```

Every part is checked, so a layout can never break a site, its look or its safety
(`src/sections/custom/`):

- **fields** (`layout.ts`): the content, in the engine's field vocabulary (text, textarea,
  richtext, image with aspect and minimum width, action, icon, toggle, list of items with ids).
  The section's content is validated against them, its images get the usual size checks.
- **template** (`template.ts`): HTML from a short list of elements; every text, image and link
  comes from a field (`data-text`, `data-rich`, `data-image`, `data-action`, `data-icon`,
  `data-each`, `data-if`, `data-unless`, `data-counter`). No scripts, styles, ids, handlers, URLs
  or text of its own; the title is an `<h2 data-text>` (the page's h1 when the section opens it).
  Classes start with `c-`.
- **css** (`css.ts`): scoped to the section (`.s-custom--<name>`, `:scope` for the section itself)
  in `@layer widgets`; colors and fonts only from the theme's tokens (so tones and dark mode just
  work), no `url()`, `!important`, `position: fixed`, `@import`, text in `content`. Compiled into
  the site's stylesheet (`virtual:custom-layouts.css`): the CSP stays without `unsafe-inline`.
- **interactions** are the engine's widgets, picked with `data-behavior`: `compare` (before/after
  photos with a slider, `components/widgets/Compare.astro`) and `slider`; questions open with
  `<details>`.

Refusals name the line and what to change, for the AI to fix. `catalog.json` `custom` holds the
whole contract with an example; `npm run site:check-section` runs the gates of one section
(drawn, nothing overflowing at 320/390/768/1440 px, images loaded, axe in every scheme) and writes
`section.json` with one readable line per issue. The fixture `auto-bold` has one.

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

#### Button styles (`theme.buttons`, since 3.11)

A site may give each kind of button its own look, for every button of that kind: `primary` (the
main action), `secondary` (a quieter button) and `ghost` (a button that looks like a link; `danger`
is not styled by sites). Every property is optional; what is not set stays the theme's design.

```json
"theme": {
  "archetype": "warm",
  "accent": "#c2410c",
  "buttons": {
    "primary": { "background": "#123456", "text": "#ffffff", "radius": "pill", "paddingX": 1.75, "uppercase": true, "letterSpacing": 0.05, "hoverEffect": "glow" },
    "secondary": { "background": "transparent", "border": "#123456", "text": "#123456", "borderWidth": 2 },
    "ghost": { "text": "#123456" }
  }
}
```

| Property | Values |
|---|---|
| `text`, `background`, `border` | `#rrggbb`; `background` and `border` also `"transparent"` |
| `hover.text`, `hover.background`, `hover.border` | the same; not set: the resting color (the background a shade darker; a primary border follows its background) |
| `paddingX` | 0.5 to 2.5 rem, step 0.125: the usual size; small and large buttons scale (×2/3, ×4/3) |
| `paddingY` | 0 to 1.25 rem, step 0.125, added inside the minimum height (a button never gets smaller) |
| `borderWidth` | 0 to 3 px |
| `radius` | `"0"`, `"0.25"`, `"0.5"`, `"0.75"`, `"1"`, `"1.5"` (rem) or `"pill"` |
| `weight` | 400, 500, 600, 700 (the fonts are variable) |
| `uppercase`, `letterSpacing` | true/false; 0 to 0.12 em, step 0.01 |
| `shadow` | `"none"`, `"soft"`, `"strong"` |
| `hoverEffect` | `"lift"` (the theme's own), `"glow"`, `"none"`; no lift with reduced motion |

- The properties become CSS custom properties `--button-<kind>-<name>`, only for what the site sets
  (`design-system/theme/buttons.ts`); `styles/components/_button.scss` reads them with the theme's
  tokens as the fallback. A site without `theme.buttons` looks exactly as before.
- **Contrast is a warning, not an error** (the build goes on): the label against its background, on
  hover too (4.5:1), and the button against the page (3:1, by its background or its border). Only
  colors the site sets are judged.
- **v3.12: failing colors are fixed in the build**, in the scheme the site shows first: the nearest
  colors that pass (only the lightness moves; `fixButtonStyles` in `design-system/theme/buttons.ts`),
  the shape first (the background the site set, else the border), then the label, then the label on
  hover. The warning says which colors the build used. The editor preview shows the same fixed colors.
  Only the operator keeps a client's failing colors: `"theme": { "allowLowContrastButtons": true }`
  (never set it from a brief or the client's panel; the warning stays).
- **Parts of the page with their own palette** (inverse and accent sections, the brand and dark bars,
  footers, the cover hero, the other color scheme): a kind keeps the site's colors there unless they
  would vanish (the same checks against that palette); then the theme's button adapted to that part
  stays. Its shape, text and effects still follow the site.
- Section styles follow the site's buttons: the CTA's knob and the bold hero's arrow take the button's
  colors (`--button-current-*`), the floating navbar's and the bold hero's pills keep their pill until
  the site sets a radius. Exceptions: the brand-bar navbar button keeps its outlined colors, and the
  narrow pricing table keeps its own side padding.
- `npm run catalog` writes `dist-catalog/button-styles.mjs` (the same code bundled into one plain ES
  module) for an editor: the properties and ranges, `buttonVars`, `buttonIssues`, `fixContrast` and
  `buttonDefaults(theme)` (each kind's colors in both schemes, the page, the theme's radius).

#### Entrance animations (`theme.motion`, since 3.14)

How the blocks of the sections come in while the page scrolls:

```json
"theme": { "archetype": "energetic", "motion": "lively" }
```

| Value | What a visitor sees |
| --- | --- |
| `subtle` (the default) | a short rise (1.75 rem) with a fade, once; neighbours (a row of cards) one after another |
| `lively` | more movement (3.5 rem), pictures grow in (92 % to 100 %); a block that leaves at the top goes out and comes back when it is scrolled to again |
| `none` | no entrance animations (the script is not on the page) |

Only blocks below the first screen wait hidden: nothing on the first screen moves or blinks, and
without JavaScript nothing is hidden at all. Blocks are section headers, list items, cards, tiles and
pictures (`src/components/widgets/Reveal.astro`); nothing inside a block is marked again. The hero,
custom sections (their own motion), the logo cloud and anything inside `[data-no-reveal]` stay still.
Visitors who reduce motion, print, the editor (`html[data-editor]`, set by the bridge) and keyboard
focus always show a block as it is; the factory's screenshots reduce motion. The script sets data
attributes only (`data-reveal`, `data-reveal-order`, `data-reveal-kind`), never `style=""` (CSP); the
styles are animations, not transitions, so a section's own hover transitions stay as they are
(`src/styles/components/_reveal.scss`, cascade layer `motion`, after `tokens`).

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
  `og-cover.jpg` is generated: v3.12 from the home page's hero photo (cropped around its focal
  point, its alt text as `og:image:alt`), without one from the name, description and colors.
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

Without `meta.seo.image` the build generates `og-cover.jpg` (1200×630) from the home page's
hero photo (v3.12), without one from the site name, description and colors.

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
- `rss.xml` lists the blog's posts (v3.9, only on sites with posts); every page announces it with
  `<link rel="alternate" type="application/rss+xml">`. Posts are in the sitemap like pages.
- URLs have no trailing slash (`trailingSlash: "never"`) — canonical links and the
  sitemap use the same form; `/contact/` redirects to `/contact`.
- `src/config/indexing.ts`:
  - `noindexPaths`: `noindex, follow` meta and left out of the sitemap (`/contact/sent`,
    `/contact/failed`; v3.12 `/privacy` too: the same template on every Factory site)
  - `sitemapExcludedPaths`: indexable, but not in the sitemap (empty by default)
- Custom `404` (prerendered) and `500` pages, both `noindex`.
- v3.12: `SITE_NOINDEX=1` (or `true`) at build time makes a site no search engine may index (the
  factory's previews): every route (pages, blog posts, privacy, contact results, 404, 500) gets
  `<meta name="robots" content="noindex, nofollow">` and no canonical, no sitemap is written and
  `robots.txt` has no `Sitemap` line. Crawling stays allowed on purpose: a crawler must fetch a page to
  see its `noindex` (a `Disallow` would keep a shared link in the results). Empty, `0` or `false` is
  a normal build; any other value stops the build.
- v3.12 webmaster tools: `meta.verification` (`google`, `bing`, `yandex`, `seznam`: only the
  `content` value) renders `google-site-verification`, `msvalidate.01`, `yandex-verification` and
  `seznam-wmt` meta tags; `meta.indexNow` (an 8 to 128 character key) makes the build write
  `/<key>.txt` containing the key, so a publish can ping IndexNow. Neither in a `SITE_NOINDEX`
  build.
- v3.12 `meta.locale` (e.g. `en_GB`, `pt_BR`, in the site's language) sets `og:locale`; default:
  the language's usual one (`en_US`, `pt_PT`…). `<html lang>` stays the language.
- v3.12 sitemap: the home page as `https://host/` (as its canonical link) and `<lastmod>` only
  where the site knows when a page changed: a post's `updated`, else its `date`; a page's own
  `pages[].updated` (YYYY-MM-DD, set when its content changes); a page listing posts also moves
  with its newest post. Never the build time (that would say every page changes on every build).
- v3.12 titles: `{title} | {site name}` only while the whole fits in 60 characters, else the title
  alone (search results cut longer ones). `pages[].seo.title` and `blog.posts[].seo.title` (at most
  60 characters) replace the whole `<title>` and `og:title` as they are.
- v3.12 descriptions: a subpage without its own `description` gets the start of its sections' texts
  (section descriptions, the about text, cut at a word to 155 characters) instead of repeating
  `meta.description` on every page; the home page keeps `meta.description`.
- Every page has exactly one `<h1>`.

---

## Structured Data (JSON-LD)

Every page gets one `@graph` built from `siteConfig` (`src/lib/seo/schema.ts`);
the FAQ widget adds a separate `FAQPage` block:

- The site's owner from `business` (v3.12, `src/site/structured-data.ts`; empty fields are skipped):
  - `business.kind: "personal"` (a site about one person): a `Person` (`name`, `jobTitle`,
    `knowsAbout`, contact, `sameAs`, the blog author's photo as `image`); when the person has a
    place (see below) also the practice as a local business, linked by `worksFor` / `founder`
  - a business with an address or a service area (`business.areaServed`): its `LocalBusiness`
    subtype with the address, opening hours, price range and `hasMap` (the Google Maps link
    among `sameAs`); engine types schema.org does not have become real ones (`DanceSchool`,
    `MusicSchool`, `LanguageSchool`: `LocalBusiness` + `EducationalOrganization`, `YogaStudio`:
    `SportsActivityLocation`)
  - without either: an `Organization` (Google wants an address for every `LocalBusiness`);
    `OnlineBusiness` / `OnlineStore` and `Organization` types stay as they are
  - `name` is `business.name` with `meta.name` as `alternateName` when they differ; `logo` is
    `meta.logo` as a PNG of at least 112 px (`/icons/logo.png`), else an uploaded `meta.icon`,
    none for a monogram; `image` is the sharing photo (the hero photo or `meta.seo.image`, not
    the text card)
- `WebSite` and `WebPage` (with language)
- `BreadcrumbList` — automatic Home › page on subpages; override with
  `<BaseLayout breadcrumbs={[...]}>` or turn off with `breadcrumbs={false}`
- `FAQPage` — added by the `FAQ` widget (`structuredData={false}` to turn off)
- v3.9: `BlogPosting` on every post page (headline, dates, image, category, tags, word count, the
  blog's author as a `Person` or the business), `Blog` with its posts on the blog page; post pages
  have `og:type` article with `article:published_time`, `modified_time`, `section` and `tag`, and
  the trail Home › Blog › post. v3.12: dates with the time and zone (noon in the business time
  zone, e.g. `2026-11-18T12:00:00+01:00`); the author's `url` is the site's about section; on a
  personal site an author with the person's name is the `Person` node

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
- v3.12 (WCAG 2.4.11, 2.4.3): the banner comes right after the skip link (first in the Tab
  order); Escape minimises it to a small "Cookie settings" button for the session (no choice
  is stored); while it shows, focused elements scroll above it (`scroll-padding-bottom` and
  room under the footer); it never gets taller than the screen (it scrolls, compact on phones);
  after a choice focus returns to the control it was opened from.

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
visitor is redirected to `/contact/sent` or `/contact/failed`. v3.12: the "failed" page links back
to the page that holds the contact section, at that section (`/#kontakt`), found at build time
(`src/site/contact-link.ts`).

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
| `returnTo` | no | v3.12: the path of the form on the site with its section (`/#kontakt`, `/kontakt#form`): where a "failed" answer may send the visitor back (a path only; the service puts the site's domain in front) |

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

v3.12: builds no search engine may index, e.g. the factory's previews ([SEO and Indexing](#seo-and-indexing)):

```env
SITE_NOINDEX=1
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
`meta.seo.image` is not set (v3.12: the home page's hero photo cropped to 1200×630 around its
focal point, the text card only without one), and `icons/logo.png` from `meta.logo` for structured
data (v3.12; an uploaded icon serves without a logo, a monogram never);
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
- `src/design-system/fonts.generated.ts`: the regular face of the main script is preloaded
  (v3.12: `latin-ext` too for languages whose letters are in it, e.g. Polish, Czech, Turkish:
  `preloadSubsets` in `library.ts`, so ą ę ł ś ż come without a second font swap);
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
  consent), reopening from the footer, equal button weight; v3.12: right after the skip
  link, Escape minimises it, focus back to "Cookie settings", focused elements above it
- **contact** — successful send, field errors (focus on the first invalid field),
  consent and length validation, rate limit, honeypot, header injection, no-JS
  redirect, `405` with `Allow`; v3.12: the form's own check in the site's language
  (`novalidate`), the required note, focus on the status line after sending
- **keyboard** — skip link, mobile menu (Enter, Tab into links, Escape returns focus,
  outside click closes; v3.12: the page behind is inert, a section link focuses the
  section's heading), navigation without JavaScript, visible focus
- **focus** (v3.12): every keyboard stop shows its focus ring with 3:1 against what it
  is drawn on (also brand-colored panels); the generic site tests run it on every page
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
| preview → editor | `{ type: "factory:button", kind, section }` | v3.11: a click on a button the site styles (`primary`, `secondary`, `ghost`): nothing else happens (no link, no form, no frame); its kind is highlighted; `section` is the section's id or `null` (header, footer) |
| editor → preview | `{ type: "factory:button-style", styles }` | v3.11: a `theme.buttons` value shown live, without a rebuild: checked value by value (anything else dropped) and set as the same custom properties the build makes, with the same rule for parts with their own palette; `styles: null` goes back to the built style |
| preview → editor | `{ type: "factory:button-style-applied" }` | after every style message |
| editor → preview | `{ type: "factory:focus-buttons", kind }` | v3.11: a dashed outline on every button of the kind; `kind: null` clears it |

`factory:ready` also carries `features: ["buttons"]` since 3.11 (an editor offers button styles only
then).

In the editor, links do not leave the page: a click on a link to another page, `tel:`, `mailto:` or
a new tab only selects its section (the panel is the place to edit; header and footer links do
nothing). Links within the page, buttons, forms and widgets (menu, sliders, lightbox, FAQ) work as
usual. Opened on its own, outside a frame, a preview build behaves like a normal site.
v3.14: in the editor the bridge sets `html[data-editor]`, and every block shows as it is, without
entrance animations.

---

## Blog

v3.9: a site may have a blog. The posts live in `blog` in site.json, outside `pages` (no page limit,
each post has its own date, cover, category and tags); every post gets its own page at
`<blog.path>/<slug>`.

```jsonc
"blog": {
  "path": "/blog",                       // a page in pages[] with a "posts" section
  "author": { "name": "Anna Kowalska", "role": "instruktorka", "bio": "…", "photo": "asset:anna" },
  "categories": [{ "id": "porady", "name": "Porady" }],
  "posts": [{
    "id": "pierwsza-lekcja", "slug": "jak-przygotowac-sie-do-pierwszej-lekcji",
    "title": "…", "excerpt": "…", "date": "2026-11-15", "updated": "2026-11-18",
    "format": "article",                 // or "short": a photo post (photos and a few sentences)
    "cover": "asset:hero", "category": "porady", "tags": ["początkujący"],
    "body": [
      { "type": "paragraph", "text": "**bold**, *italic*, [link](/cennik)" },
      { "type": "heading", "level": 2, "text": "Co założyć" },
      { "type": "list", "ordered": true, "items": ["…"] },
      { "type": "quote", "text": "…", "cite": "Anna" },
      { "type": "image", "image": "asset:sala", "caption": "…", "wide": true },
      { "type": "gallery", "images": ["asset:g-1", "asset:g-2"] },
      { "type": "video", "url": "https://www.youtube.com/embed/…", "title": "…" },
      { "type": "callout", "title": "Wskazówka", "text": "…" },
      { "type": "cta", "title": "…", "action": { "label": "Zapisz się", "href": "/kontakt" } }
    ]
  }]
}
```

- **The list** is the `posts` section (8 layouts, see the section table). On the blog page it shows
  every post with category buttons and "show more" (`perPage`, default 9); anywhere else
  `limit` gives "latest posts" (e.g. 3 on the home page) and `link` points to the blog. A blog
  without posts shows "coming soon". Without JavaScript every post is shown.
- **The post page** uses the site's article layout, `layout.article` (default `classic`; one per
  site, only sites with a blog load it):

| Layout | Look |
|---|---|
| `toc` | the text left, a sticky table of contents right that marks the chapter being read (phones: a folded list above the text); posts with fewer than two chapters get one column |
| `classic` | one narrow column: meta, title, lead, the cover, the text |
| `cover` | the cover across the first screen with the title on it, the text below |
| `split` | desktops: the cover sticky in the left half, the text scrolling on the right |
| `editorial` | a very large centered title, a wide cover, a drop cap, large pull quotes, wide photos |
| `author` | the text with a sticky card: the author and the call to action button |
| `photo` | photo posts like on Instagram: the photos (a slider) left, the short text right |

  Every layout has the trail Home › Blog › post, category, date and reading time, the byline, tags,
  share links (Facebook, LinkedIn, WhatsApp, e-mail, copy link: plain links, no third-party
  scripts), a call to action box (`layout.article.content.ctaTitle` / `ctaText` / `ctaAction`,
  default: the contact section), older/newer post and "read also" (the same category first).
  Props `progress` (reading bar), `share` and `related` turn those off.
- **Rules:** at most 60 posts; slugs unique and free (not a page, not an engine path); categories
  must exist; `updated` not before `date`; text is richtext-lite (no HTML); videos only from the
  allowed players (they load on click and join the CSP's `frame-src`); covers at least 800 px wide
  (3:2), photos in the text 640 px, gallery tiles 400 px (checked like section images). Post dates
  are shown in the site's language (`src/site/dates.ts`).
- **Pure helpers** (`src/site/blog.ts`, tested): order, chapters and their ids, reading time,
  related and adjacent posts, months, the post's photos, its meta description.
- **Tooling:** `scripts/site/lib.ts` lists posts as pages (report, screenshots), the site e2e test
  checks every post page (one h1, JSON-LD, nothing sticking out at 320/768/1440 px, axe), and the
  generated catalog has a blog at its limits shown in a different article layout per archetype.

---

## Factory Signature

v3.7: every site carries a few quiet easter eggs that lead to one another (`src/site/signature.ts`).
Their texts are in the site's language (`signature` in every dictionary); the "Mytko Factory"
lockup is a brand name and stays the same everywhere (v3.12: the words before it, "Powered by",
are `signature.poweredBy` in every language). v3.12: no engine version anywhere on a site.

| Where | What |
|---|---|
| page source | a comment under the viewport meta: "mytko factory" in box-drawing letters, who built the site, a hint to open the console (no `--` inside, whatever the site name) |
| browser console | the wordmark on a dark card, a link to factory.mytko.dev and the way to `/humans.txt` |
| `/humans.txt` | the site owner, Mytko Website Factory and the studio, language, last build date, technology; ends with the hint to the footer mark (`<link rel="author">` points to it) |
| `<meta name="generator">` | `Mytko Website Factory`, the only generator tag (v3.12: no versions, no Astro tag) |
| footer | "Powered by [mark] Mytko Factory" at the end of the bottom row; the link goes to factory.mytko.dev (`rel="noopener nofollow"`: a footer link on every client site must not look like a link scheme). The mark is a button that opens a native popover (no script) with a few words about how the site was made. |

---

## Version

Current version: **v3.14** (`3.14.0`), `schemaVersion` 1 (v3.0 sites work unchanged). The v2
starter is kept on the `v2` branch / tag `v2.0.0`.

v3.14: entrance animations (`theme.motion`: `subtle` by default, `lively` or `none`;
[Entrance animations](#entrance-animations-thememotion-since-314)). The CSS minifier gets its
browsers written out (`src/site/css-target.ts`, `vite.build.cssTarget`): without them Lightning CSS
folded `animation-timeline` into the `animation` shorthand, browsers dropped the whole declaration and
the scroll-driven animations of custom sections never ran. Sites that set `theme.motion` should ask
for `"engine": "^3.14.0"`; sites without it get `subtle`.

v3.13: custom sections, layouts of the site's own (`customLayouts`: fields, template, CSS), checked
by the engine and drawn like its variants ([Custom sections](#custom-sections-customlayouts-since-313));
the before/after compare widget; `catalog.json` `custom`; `npm run site:check-section`. Sites with
custom sections should ask for `"engine": "^3.13.0"`.

v3.12: SEO and accessibility review (the v3.12 notes in the sections above).

v3.11: the site's own button styles (`theme.buttons`: colors with hover, padding, border, radius,
weight, uppercase and letter spacing, shadow, hover effect, per kind of button), contrast as
warnings, the theme's buttons kept where the site's would vanish ([Button styles](#button-styles-themebuttons-since-311));
the editor bridge reports clicks on buttons and shows a button style live; the catalog's
`button-styles.mjs`. Sites with button styles should ask for `"engine": "^3.11.0"`.

v3.10: a one-page site's menu lists its sections as anchors (it showed only the home page), with a
section-level `nav` (`show`, `label`) and the section words in all 12 languages; anchor targets clear
the real height of the sticky header; "Powered by Mytko Factory" with a capital M.

v3.9: blog. Posts in `blog` (own pages at `<blog.path>/<slug>`, blocks: paragraph, heading, list,
quote, image, gallery, video, callout, cta), the `posts` section in 8 layouts, 7 article layouts
(`layout.article`), RSS, BlogPosting JSON-LD and article meta, the blog's menu link marked on its
posts ([Blog](#blog)). Sites with a blog should ask for `"engine": "^3.9.0"`.

v3.8: the contact form's own fields (`contact.form`: on/off, up to 12 fields of 8 types, the button
text), validated the same way by the engine and the form service.

v3.7: Factory signature — "Powered by Mytko Factory" with a secret mark in the footer (replaces
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
