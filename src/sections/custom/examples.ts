/**
 * v3.13: a complete custom layout (layout.ts), the reference for the AI (catalog.json custom.example), the tests and
 * the fixture site auto-bold: pairs of photos before and after, each in the engine's compare.
 */
import type { z } from "zod";
import type { CustomLayoutSchema } from "./layout";

export const BEFORE_AFTER = {
  version: 1,
  label: "Przed i po",
  description: "Pary zdjęć przed i po (suwak porównania) z krótkim podpisem efektu; nad nimi nadtytuł, tytuł i opis, pod nimi przycisk.",
  fields: [
    { key: "eyebrow", type: "text", label: "Nadtytuł", max: 40 },
    { key: "title", type: "text", label: "Tytuł sekcji", max: 90, required: true },
    { key: "description", type: "textarea", label: "Opis", max: 240 },
    {
      key: "pairs",
      type: "list",
      label: "Pary zdjęć",
      min: 1,
      max: 6,
      fields: [
        { key: "before", type: "image", label: "Zdjęcie przed", aspect: [4, 3], minWidth: 800, required: true },
        { key: "after", type: "image", label: "Zdjęcie po", aspect: [4, 3], minWidth: 800, required: true },
        { key: "caption", type: "text", label: "Podpis", max: 90 },
      ],
    },
    { key: "action", type: "action", label: "Przycisk" },
  ],
  template: `<header class="c-head">
  <p class="c-eyebrow" data-text="eyebrow"></p>
  <h2 class="c-title" data-text="title"></h2>
  <p class="c-lead" data-text="description"></p>
</header>
<ul class="c-pairs">
  <li class="c-pair" data-each="pairs">
    <div data-behavior="compare" data-before="before" data-after="after"></div>
    <p class="c-pair__caption" data-text="caption"></p>
  </li>
</ul>
<div class="c-actions" data-if="action">
  <a data-action="action" data-button="primary"></a>
</div>`,
  css: `:scope .c-head {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 42rem;
  margin-bottom: var(--spacing-2xl);
}

.c-eyebrow {
  margin: 0;
  color: var(--color-action-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
}

.c-title,
.c-lead {
  margin: 0;
}

.c-lead {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.c-pairs {
  display: grid;
  gap: var(--spacing-xl);
  margin: 0;
  padding: 0;
  list-style: none;
}

.c-pair {
  display: grid;
  gap: var(--spacing-sm);
}

.c-pair__caption {
  margin: 0;
  color: var(--color-text-secondary);
}

.c-actions {
  margin-top: var(--spacing-2xl);
}

@media (min-width: 48rem) {
  .c-pairs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}`,
} satisfies z.input<typeof CustomLayoutSchema>;
