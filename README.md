# Astro Builder V1

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
│  ├─ site/
│  ├─ ui/
│  └─ widgets/
│
├─ design-system/
│  ├─ tokens/
│  └─ utils/
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
```

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
- `Accordion`

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
- `SiteHeader`
- `SiteFooter`

Widgets are larger reusable page sections built from smaller primitives.

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
console delivery / future email provider
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
CONTACT_DELIVERY_MODE=console
```

Future email delivery can use variables such as:

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

<Icon name="github" />
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