/**
 * v3.13 custom sections: a layout made for one site (by the factory's AI, reviewed by a person later) that the engine
 * renders like one of its own variants. site.json carries the layouts by name, and a section of type "custom" names one
 * as its variant:
 *   "customLayouts": { "before-after": { "version": 1, "label": "Przed i po", "fields": [...], "template": "<div …>", "css": "…" } }
 *   { "id": "efekty", "type": "custom", "variant": "before-after", "content": { "title": "…", "pairs": [...] } }
 *
 * A layout has three parts, each checked here so it can never break a site, its look or its safety:
 * - fields: the content it shows, in the engine's field vocabulary (text, image with its proportions, list…), so the
 *   content is validated, its images are size-checked and the panel edits it like any other section's;
 * - template: HTML from a short list of elements, filled from the fields through data-* bindings (template.ts): no
 *   scripts, no inline styles, no links, images or text of its own;
 * - css: rules for this section only, colors and fonts from the theme's tokens (css.ts), compiled into the site's
 *   stylesheet, so the CSP stays strict.
 * Interactions are the engine's own widgets, picked in the template with data-behavior (the before/after compare, the
 * slider), never scripts.
 *
 * The format mirrors an engine variant (markup, a style file, a content schema), so a layout that proves itself becomes
 * one almost 1:1. Pure Zod and parsers, no Astro: it runs in the schema, the loader, Node scripts and tests.
 */
import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { Action, field, Id, imageSlot, listWithIds, multilineText, richTextLite, text, type FieldType } from "../../site/schema/fields";
import { compileCss } from "./css";
import { compileTemplate } from "./template";

export const CUSTOM_TYPE = "custom";
export const TEMPLATE_MAX = 20_000;
export const CSS_MAX = 20_000;
export const FIELDS_MAX = 24;
export const LIST_MAX = 24;

/** A field's key: the name of its value in the section's content. */
export const FieldKey = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]{0,31}$/, 'A field key is camelCase letters and digits starting with a lowercase letter, e.g. "title" or "beforeImage" (max 32).');

const common = {
  key: FieldKey,
  label: text(40).describe("The field's name in the panel, in Polish, e.g. \"Tytuł sekcji\"."),
  required: z.boolean().default(false).describe("The section cannot be saved without it."),
};

const TextField = z.strictObject({
  ...common,
  type: z.literal("text").describe("One line of plain text (titles, labels, short facts)."),
  max: z.number().int().min(1).max(300).default(120).describe("Most characters."),
});
const TextareaField = z.strictObject({
  ...common,
  type: z.literal("textarea").describe("Plain text with line breaks (descriptions)."),
  max: z.number().int().min(1).max(1200).default(400),
});
const RichField = z.strictObject({
  ...common,
  type: z.literal("richtext").describe("Paragraphs with **bold**, *italic* and [links](/path)."),
  max: z.number().int().min(1).max(3000).default(1200),
});
const ImageField = z.strictObject({
  ...common,
  type: z.literal("image").describe("An image from the site's library, cropped to `aspect`."),
  aspect: z.tuple([z.number().int().min(1).max(32), z.number().int().min(1).max(32)]).optional().describe("Width : height, e.g. [4, 3]; without it any proportions."),
  minWidth: z.number().int().min(160).max(2400).default(800).describe("The smallest width in px that stays sharp at the size the template shows it."),
});
const ActionField = z.strictObject({ ...common, type: z.literal("action").describe("A button or link: { label, href }.") });
const IconField = z.strictObject({ ...common, type: z.literal("icon").describe("An icon from the engine's library (catalog.json icons).") });
const ToggleField = z.strictObject({
  key: FieldKey,
  label: common.label,
  type: z.literal("toggle").describe("Yes or no, for data-if / data-unless."),
});

const ItemField = z.discriminatedUnion("type", [TextField, TextareaField, RichField, ImageField, ActionField, IconField, ToggleField]);

const ListField = z.strictObject({
  key: FieldKey,
  label: common.label,
  type: z.literal("list").describe("Repeated items (cards, pairs of photos, steps), shown with data-each; every item gets an id."),
  min: z.number().int().min(0).max(LIST_MAX).default(1),
  max: z.number().int().min(1).max(LIST_MAX).default(12),
  fields: z.array(ItemField).min(1).max(12).describe("The fields of one item (no lists inside lists)."),
});

export const CustomField = z.discriminatedUnion("type", [TextField, TextareaField, RichField, ImageField, ActionField, IconField, ToggleField, ListField]);
export type CustomField = z.output<typeof CustomField>;
export type CustomItemField = z.output<typeof ItemField>;
export type CustomFieldType = CustomField["type"];
export const CUSTOM_FIELD_TYPES = ["text", "textarea", "richtext", "image", "action", "icon", "toggle", "list"] as const satisfies readonly CustomFieldType[];

/** The panel's kind of editor for each field type (the engine's FieldType). */
const EDITOR: Record<CustomFieldType, FieldType> = {
  text: "text", textarea: "textarea", richtext: "richtext-lite", image: "image", action: "link", icon: "select", toggle: "toggle", list: "list",
};

/** Problems of a field list: keys once per level, "id" kept for list items, a list's min not above its max. */
function fieldIssues(fields: readonly { key: string; type: string; min?: number; max?: number; fields?: readonly { key: string }[] }[]) {
  const issues: { path: (string | number)[]; message: string }[] = [];
  const seen = new Set<string>();

  fields.forEach((item, index) => {
    if (seen.has(item.key)) issues.push({ path: [index, "key"], message: `Duplicate field key "${item.key}".` });
    seen.add(item.key);

    if (item.type !== "list") return;
    if ((item.min ?? 1) > (item.max ?? 12)) issues.push({ path: [index, "min"], message: "min is above max." });
    const inner = new Set<string>();
    item.fields?.forEach((child, childIndex) => {
      if (child.key === "id") issues.push({ path: [index, "fields", childIndex, "key"], message: 'Every list item has its "id" already: use another key.' });
      if (inner.has(child.key)) issues.push({ path: [index, "fields", childIndex, "key"], message: `Duplicate field key "${child.key}".` });
      inner.add(child.key);
    });
  });

  return issues;
}

export const CustomLayoutSchema = z
  .strictObject({
    version: z.number().int().min(1).max(9999).describe("The layout's version in the factory's library; a fix makes a new one, a site keeps the version it was built with."),
    label: text(60).describe('What it is, in Polish, e.g. "Przed i po".'),
    description: multilineText(400).optional().describe("What it shows and when it fits (for people and for the AI)."),
    fields: z.array(CustomField).min(1).max(FIELDS_MAX).describe("The content the section shows (its content schema)."),
    template: z.string().min(1).max(TEMPLATE_MAX).describe("The markup: allowed elements filled from the fields with data-* bindings (catalog.json custom)."),
    css: z.string().max(CSS_MAX).default("").describe("Styles of this section only: classes starting with c-, colors and fonts from theme tokens (catalog.json custom)."),
  })
  .superRefine((layout, context) => {
    const fields = fieldIssues(layout.fields);
    for (const issue of fields) context.addIssue({ code: "custom", path: ["fields", ...issue.path], message: issue.message });
    // A template is only read against a sound field list.
    if (!fields.length) {
      for (const message of compileTemplate(layout.template, layout.fields).issues) context.addIssue({ code: "custom", path: ["template"], message });
    }
    for (const message of compileCss("layout", layout.css).issues) context.addIssue({ code: "custom", path: ["css"], message });
  });

export type CustomLayout = z.output<typeof CustomLayoutSchema>;

/** The custom section in pages[].sections: its variant names a layout of the site (checked by the site schema). */
export const CustomSectionSchema = z.strictObject({
  id: Id.describe("Stable section id, unique in the site. Also used as the HTML anchor (#id)."),
  type: z.literal(CUSTOM_TYPE).describe("v3.13: a section drawn by one of the site's own layouts (customLayouts)."),
  nav: z
    .strictObject({ show: z.boolean().optional(), label: text(24).optional() })
    .optional()
    .describe("v3.10: the one-page site's menu (anchor links to the sections)."),
  variant: Id.describe("The name of the layout in customLayouts."),
  props: z
    .strictObject({
      tone: z.enum(["default", "muted", "inverse"]).optional().describe("Background tone of the section."),
      spacing: z.enum(["sm", "md", "lg", "xl"]).optional().describe("Vertical padding of the section."),
      width: z.enum(["md", "lg", "xl", "full"]).optional().describe("Width of the content (default lg)."),
    })
    .default({}),
  content: z.record(z.string(), z.unknown()).describe("The values of the layout's fields."),
});

export type CustomSection = z.output<typeof CustomSectionSchema>;

function itemSchema(spec: CustomItemField | CustomField): z.ZodType {
  switch (spec.type) {
    case "text":
      return text(spec.max);
    case "textarea":
      return multilineText(spec.max);
    case "richtext":
      return richTextLite(spec.max);
    case "image":
      return imageSlot({ aspect: spec.aspect, minWidth: spec.minWidth });
    case "action":
      return Action;
    case "icon":
      return z.enum(ICON_NAMES);
    case "toggle":
      return z.boolean();
    case "list": {
      const item = z.strictObject({ id: Id, ...Object.fromEntries(spec.fields.map((child) => [child.key, fieldSchema(child)])) });
      return listWithIds(item, spec.min, spec.max);
    }
  }
}

function fieldSchema(spec: CustomItemField | CustomField): z.ZodType {
  const base = itemSchema(spec);
  const value =
    spec.type === "toggle" ? (base as z.ZodBoolean).default(false)
    : spec.type === "list" ? (spec.min > 0 ? base : (base as z.ZodArray).default([]))
    : spec.required ? base
    : base.optional();

  return field(value, { label: spec.label, fieldType: EDITOR[spec.type], description: spec.label });
}

const schemas = new WeakMap<readonly CustomField[], z.ZodObject>();

/** The content schema of a layout: the engine's own field rules, built from its field list (cached per list). */
export function contentSchemaOf(fields: readonly CustomField[]): z.ZodObject {
  let schema = schemas.get(fields);
  if (!schema) {
    schema = z.strictObject(Object.fromEntries(fields.map((spec) => [spec.key, fieldSchema(spec)])));
    schemas.set(fields, schema);
  }
  return schema;
}
