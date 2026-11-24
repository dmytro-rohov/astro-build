/**
 * v3.13: what a custom layout may be (layout.ts, template.ts, css.ts) in one object, for catalog.json "custom": the
 * factory's AI writes layouts from it, and the factory checks them with the engine (site:validate, check-section).
 */
import { CSS_RULES_MAX, TOKEN_PREFIXES } from "./css";
import { BEFORE_AFTER } from "./examples";
import { CSS_MAX, CUSTOM_TYPE, FIELDS_MAX, LIST_MAX, TEMPLATE_MAX } from "./layout";
import { BEHAVIORS, BUTTON_KINDS, TEMPLATE_DEPTH_MAX, TEMPLATE_ELEMENTS_MAX, TEMPLATE_ROLES, TEMPLATE_TAGS } from "./template";

export function customContract(tokens: readonly string[]) {
  return {
    type: CUSTOM_TYPE,
    description:
      "A section the catalog's variants cannot draw (e.g. before/after photos): a layout of the site's own in site.json customLayouts.<name> " +
      '({ version, label, description, fields, template, css }), used by sections { "type": "custom", "variant": "<name>", "props": { tone, spacing, width }, "content": { …values of its fields } }. ' +
      "The engine draws it in the frame of every section (tone, spacing, anchor, one-page menu) and checks all three parts; prefer a catalog variant whenever one fits.",
    fieldTypes: [
      { type: "text", description: "One line of plain text.", options: "max (1-300, default 120), required" },
      { type: "textarea", description: "Plain text with line breaks.", options: "max (1-1200, default 400), required" },
      { type: "richtext", description: "Paragraphs with **bold**, *italic*, [links](/path); shown with data-rich on a div.", options: "max (1-3000, default 1200), required" },
      { type: "image", description: "asset:<id> from the site's images, cropped to aspect.", options: "aspect [w, h] (optional), minWidth (160-2400, default 800), required" },
      { type: "action", description: "A button or link { label, href }.", options: "required" },
      { type: "icon", description: "An icon name from catalog.json icons.", options: "required" },
      { type: "toggle", description: "true or false (default false), for data-if / data-unless.", options: "" },
      { type: "list", description: "Repeated items, each with its own id; shown with data-each.", options: `min (0-${LIST_MAX}, default 1), max (1-${LIST_MAX}, default 12), fields (1-12 item fields, no list inside a list, no key "id")` },
    ],
    fieldRules: [
      `At most ${FIELDS_MAX} fields; keys are camelCase (e.g. "title", "beforeImage"), once per level; labels in Polish (the panel shows them).`,
      'The section title is a required text field shown in an <h2 data-text="…"> outside any data-each.',
      "Every text the visitor reads is a field: the client edits it, in any language.",
    ],
    template: {
      elements: TEMPLATE_TAGS,
      attributes: ["class (c-… classes, at most 8)", `role (${TEMPLATE_ROLES.join(", ")})`, 'aria-hidden="true"', "open (details)", "sizes (img)"],
      bindings: [
        { attribute: "data-text", on: "div, span, p, h2-h4, li, figcaption, blockquote, strong, em, small, dt, dd, summary", field: "text, textarea", description: "The element's text (empty in the template)." },
        { attribute: "data-rich", on: "div", field: "richtext", description: "Paragraphs of rich text." },
        { attribute: "data-image", on: "img", field: "image", description: "A responsive image with its alt text (no src)." },
        { attribute: "data-action", on: "a", field: "action", description: `A link with its label (no href); data-button="${BUTTON_KINDS.join("|")}" draws it as a button.` },
        { attribute: "data-icon", on: "span", field: "icon", description: "The icon." },
        { attribute: "data-each", on: "any element", field: "list", description: "Repeats the element for each item; inside, keys are the item's fields." },
        { attribute: "data-if / data-unless", on: "any element", field: "any", description: "Shown only when the field has / has no value (not with data-each on the same element)." },
        { attribute: "data-counter", on: "with data-text", field: "text", description: "A number that counts up when it comes into view." },
      ],
      rules: [
        "No text of its own, no ids, no style, no on… handlers, no href or src: everything comes from the fields.",
        "No h1 (the title h2 becomes the page's h1 when the section opens a page); headings h2, h3, h4 in order.",
        "<li> directly in <ul>, <ol> or a slider; <dt>/<dd> in <dl>; <summary> first in <details>; <figcaption> in <figure>.",
        `At most ${TEMPLATE_ELEMENTS_MAX} elements, ${TEMPLATE_DEPTH_MAX} levels, ${TEMPLATE_MAX} characters.`,
      ],
    },
    behaviors: [
      {
        name: "compare",
        markup: '<div data-behavior="compare" data-before="before" data-after="after"></div>',
        description: "Before/after photos with a slider that moves the line between them (keyboard and touch); side by side without JavaScript. data-before, data-after: image fields (the before field's aspect is used); optional data-before-label, data-after-label: text fields (default before/after in the site's language). Empty div.",
      },
      {
        name: "slider",
        markup: '<div data-behavior="slider" data-label="title" data-dots><li class="c-card" data-each="items">…</li></div>',
        description: "A horizontal slider with arrows: its children are <li>; data-label: a text field naming it; data-single: one item per view; data-dots: a dot per item.",
      },
    ],
    accordion: "Questions and answers: <details><summary data-text=\"question\"></summary><div data-rich=\"answer\"></div></details> (no script).",
    css: {
      rules: [
        "Rules for this section only: selectors use the template's c-… classes and elements; :scope at the start is the section itself. No ids, html, body, :root, nested rules.",
        "Colors only from tokens: var(--color-…), color-mix(in oklab, var(--color-…) N%, transparent), transparent, currentColor. They follow the section's tone and the site's dark mode.",
        "Fonts: var(--font-family-base|heading|mono), sizes var(--font-size-…), weights var(--font-weight-…); spacing var(--spacing-…), corners var(--radius-…), shadows var(--shadow-…).",
        "Own custom properties start with --c-; theme tokens are read-only.",
        "@media (min-width: 48rem) and other size or motion queries, @supports, @container, @keyframes; no prefers-color-scheme, @import, @font-face, @layer.",
        "No url() or other loading, no text in content (only \"\" or counter()), no !important, no position: fixed, z-index at most 10.",
        "Mobile first: the base rules are for a 320 px phone, wider screens in @media (min-width: …). Images and grids must never overflow: minmax(0, 1fr), max-width: 100%.",
        `At most ${CSS_RULES_MAX} rules and ${CSS_MAX} characters.`,
      ],
      tokenPrefixes: TOKEN_PREFIXES.map((prefix) => `--${prefix}`),
      tokens: tokens.map((token) => `--${token}`),
    },
    example: {
      layout: BEFORE_AFTER,
      section: {
        id: "efekty",
        type: CUSTOM_TYPE,
        variant: "before-after",
        props: {},
        content: {
          eyebrow: "Metamorfozy",
          title: "Przed i po naprawie",
          pairs: [{ id: "blotnik", before: "asset:blotnik-przed", after: "asset:blotnik-po", caption: "Błotnik po stłuczce: naprawa w 3 dni" }],
          action: { label: "Umów wycenę", href: "#kontakt" },
        },
      },
    },
    behaviorNames: BEHAVIORS,
  };
}
