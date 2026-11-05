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
- Local font pipeline
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

- `name`, `description` — default page title, meta description, Open Graph site name
- `lang`, `locale` — HTML `lang` and `og:locale`
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

In development mode, the contact form can log submissions to the terminal.

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

<Icon name="ic-burger" />
```

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

## Deployment Notes

Because this project includes an Astro API route for the contact form, it is not purely static.

For VPS deployment, use the Astro Node adapter:

```js
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
});
```

Typical VPS setup:

```txt
VPS Ubuntu
↓
Node.js
↓
Astro standalone server
↓
PM2 process manager
↓
Nginx reverse proxy
↓
SSL certificate
```

---

## Version

Current version:

```txt
V1
```

V1 includes:

- design tokens
- SCSS architecture
- layout primitives
- UI primitives
- form primitives
- media primitives
- reusable widgets
- backend-ready ContactForm
- playground page
- welcome page
- contact page

Future improvements:

- email provider integration
- rate limiting
- advanced spam protection
- dark mode
- animations
- CMS/blog
- deployment automation