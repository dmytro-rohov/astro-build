/**
 * Generates the AI / editor catalog from the schemas into dist-catalog/:
 * - site.schema.json      full JSON Schema of site.json (with editor metadata)
 * - site.schema.llm.json  the same, simplified for LLM structured output: length
 *                         and count limits moved into descriptions, regex
 *                         patterns removed (the result is always re-validated
 *                         with the full Zod schema, errors go back to the AI)
 * - catalog.json          section and layout types, variants ("fits"), content
 *                         fields with limits, archetypes, font pairs, icons,
 *                         reserved slugs — everything an orchestrator needs to
 *                         pick two clearly different designs for a brief
 *
 * Usage: npm run catalog [-- --out dist-catalog]
 */
import path from "node:path";
import { z } from "zod";
import { archetypes } from "../../src/design-system/archetypes";
import { ACCENT_FAMILIES, accentFamily } from "../../src/design-system/theme/families";
import { fontFamilies, fontPairs, pairScripts, type FontPairId } from "../../src/design-system/fonts/library";
import { icons } from "../../src/design-system/icons/library";
import { ENGINE_VERSION } from "../../src/site/engine";
import { layoutTypes, sectionTypes } from "../../src/site/registry";
import type { FieldMeta, ImageSlot } from "../../src/site/schema/fields";
import { RESERVED_SLUGS, SCHEMA_VERSION, SiteSchema } from "../../src/site/schema/site";
import { getFlag } from "./args";
import { writeJson } from "./lib";

const out = path.resolve(getFlag("out") ?? "dist-catalog");

type Field = {
  path: string;
  type: string;
  required: boolean;
  description?: string;
  label?: string;
  fieldType?: FieldMeta["fieldType"];
  editable?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  image?: ImageSlot;
};

function metaChain(schema: z.ZodType) {
  let description: string | undefined;
  let editor: (FieldMeta & { editable?: boolean }) | undefined;
  let image: ImageSlot | undefined;

  for (let current: z.ZodType | undefined = schema; current; ) {
    description ??= current.description;
    const meta = current.meta() as { editor?: FieldMeta; imageSlot?: ImageSlot } | undefined;
    editor ??= meta?.editor;
    image ??= meta?.imageSlot;
    current = (current as unknown as { def: { innerType?: z.ZodType } }).def.innerType;
  }

  return { description, editor, image };
}

/** Flat list of content fields with their limits (arrays as "items[]"). */
function fields(schema: z.ZodType, prefix = "", required = true, outer?: ReturnType<typeof metaChain>): Field[] {
  const def = (schema as unknown as { def: { type: string; innerType?: z.ZodType; in?: z.ZodType } }).def;
  // Metadata may sit on an optional/default wrapper (field(text().optional(), …)).
  const inherited = outer ?? metaChain(schema);

  if (def.type === "optional" || def.type === "default") return fields(def.innerType!, prefix, false, inherited);
  if (def.type === "pipe" && def.in) return fields(def.in, prefix, required, inherited);

  const own = metaChain(schema);
  const description = own.description ?? inherited.description;
  const editor = own.editor ?? inherited.editor;
  const image = own.image ?? inherited.image;
  const base: Field = { path: prefix, type: def.type, required, description, label: editor?.label, fieldType: editor?.fieldType, editable: editor?.editable, image };

  if (schema instanceof z.ZodObject) {
    const children = Object.entries(schema.shape).flatMap(([key, child]) => fields(child as z.ZodType, prefix ? `${prefix}.${key}` : key));
    return prefix ? [base, ...children] : children;
  }

  if (schema instanceof z.ZodArray) {
    const checks = (schema.def.checks ?? []) as unknown as { _zod: { def: { check: string; minimum?: number; maximum?: number } } }[];
    const min = checks.find((check) => check._zod.def.check === "min_length")?._zod.def.minimum;
    const max = checks.find((check) => check._zod.def.check === "max_length")?._zod.def.maximum;
    return [{ ...base, type: "array", min, max }, ...fields(schema.element as z.ZodType, `${prefix}[]`)];
  }

  if (schema instanceof z.ZodString) return [{ ...base, type: "string", min: schema.minLength ?? undefined, max: schema.maxLength ?? undefined }];
  if (schema instanceof z.ZodNumber) return [{ ...base, type: "number", min: schema.minValue ?? undefined, max: schema.maxValue ?? undefined }];
  if (schema instanceof z.ZodEnum) return [{ ...base, type: "enum", options: schema.options as string[] }];

  return [base];
}

const clean = <T extends object>(value: T) => JSON.parse(JSON.stringify(value)) as T;

const variantsOf = (type: (typeof sectionTypes)[number] | (typeof layoutTypes)[keyof typeof layoutTypes]) =>
  Object.entries(type.variants).map(([id, variant]) => ({
    id,
    description: variant.description,
    uses: variant.uses ?? [],
    props: "props" in variant && variant.props ? z.toJSONSchema(variant.props as z.ZodType, { io: "input" }) : undefined,
  }));

const catalog = {
  engineVersion: ENGINE_VERSION,
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  rules: [
    "Content belongs to the section type; a variant only adds props and shows a subset of optional fields — switching variants never loses content.",
    "Two designs for one brief must differ in archetype, accent color family (accentFamilies) and hero variant, and should differ in font pair, navbar, footer and section variants; they share the same content. Check with `npm run site:compare -- --site A --site B`.",
    "Without a brand color in the brief, take accents from archetypes[].recommendedAccents — each list spans different families.",
    "Links: https://, mailto:, tel:, site paths or #anchors only. Rich text: **bold**, *italic*, [text](link) — never HTML.",
    "Images are referenced as asset:<id> from assets/assets.json and cropped to each slot's proportions.",
    "Business data (contact, address, hours) lives only in `business`; sections read it from there.",
  ],
  sections: sectionTypes.map((type) => ({
    type: type.type,
    label: type.label,
    description: type.description,
    accentTone: type.accentTone ?? false,
    content: fields(type.content),
    variants: variantsOf(type),
  })),
  layout: Object.values(layoutTypes).map((type) => ({
    type: type.type,
    label: type.label,
    description: type.description,
    content: fields(type.content),
    variants: variantsOf(type),
  })),
  archetypes: Object.entries(archetypes).map(([id, archetype]) => ({
    id,
    label: archetype.label,
    description: archetype.description,
    fits: archetype.tags,
    colorScheme: archetype.colorScheme,
    accent: archetype.accent,
    recommendedAccents: archetype.recommendedAccents.map((hex) => ({ hex, family: accentFamily(hex) })),
    fontPair: archetype.fontPair,
    style: {
      radius: archetype.radius,
      buttons: archetype.buttonShape,
      images: archetype.imageStyle,
      cards: archetype.cards,
      density: archetype.density,
      headings: archetype.heading,
    },
    sectionTones: archetype.sectionTones,
  })),
  fontPairs: Object.entries(fontPairs).map(([id, pair]) => ({
    id,
    heading: fontFamilies[pair.heading].family,
    body: fontFamilies[pair.body].family,
    description: pair.description,
    fits: pair.tags,
    scripts: pairScripts(id as FontPairId),
  })),
  accentFamilies: ACCENT_FAMILIES,
  icons: Object.entries(icons).map(([name, icon]) => ({ name, category: icon.category, keywords: icon.keywords })),
  reservedSlugs: RESERVED_SLUGS,
};

const fullSchema = z.toJSONSchema(SiteSchema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;

/** LLM variant: limits as text, no regex patterns or editor metadata. */
function forLlm(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(forLlm);
  if (!node || typeof node !== "object") return node;

  const source = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const notes: string[] = [];

  for (const [key, value] of Object.entries(source)) {
    if (key === "minLength" && Number(value) > 1) notes.push(`at least ${value} characters`);
    else if (key === "maxLength") notes.push(`max ${value} characters`);
    else if (key === "minItems" && Number(value) > 0) notes.push(`at least ${value} items`);
    else if (key === "maxItems") notes.push(`max ${value} items`);
    else if (["minLength", "minItems", "pattern", "format", "editor", "imageSlot", "$schema"].includes(key)) continue;
    else result[key] = forLlm(value);
  }

  if (notes.length) {
    result.description = [source.description, `(${notes.join(", ")})`].filter(Boolean).join(" ");
  }

  return result;
}

writeJson(path.join(out, "site.schema.json"), { title: "Mytko site.json", ...fullSchema });
writeJson(path.join(out, "site.schema.llm.json"), { title: "Mytko site.json (for LLM structured output)", ...(forLlm(fullSchema) as object) });
writeJson(path.join(out, "catalog.json"), clean(catalog));

console.log(
  `✔ Catalog: ${catalog.sections.length} section types (${catalog.sections.reduce((sum, section) => sum + section.variants.length, 0)} variants), ` +
    `${catalog.archetypes.length} archetypes, ${catalog.fontPairs.length} font pairs → ${out}`,
);
