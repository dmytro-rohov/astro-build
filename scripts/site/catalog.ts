/**
 * Generates the AI / editor catalog from the schemas into dist-catalog/:
 * - site.schema.json      full JSON Schema of site.json (with editor metadata)
 * - site.schema.llm.json  the same, simplified for LLM structured output: length
 *                         and count limits moved into descriptions, regex
 *                         patterns removed (the result is always re-validated
 *                         with the full Zod schema, errors go back to the AI)
 * - catalog.json          section and layout types, variants ("fits"), content
 *                         fields with limits, archetypes, font pairs, icons,
 *                         reserved slugs, site languages — everything an
 *                         orchestrator needs to pick two clearly different
 *                         designs for a brief
 *
 * Usage: npm run catalog [-- --out dist-catalog]
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import ts from "typescript";
import { z } from "zod";
import { archetypes } from "../../src/design-system/archetypes";
import { ACCENT_FAMILIES, accentFamily } from "../../src/design-system/theme/families";
import { fontFamilies, fontPairs, pairScripts, scriptsForLanguage, type FontPairId } from "../../src/design-system/fonts/library";
import { icons } from "../../src/design-system/icons/library";
import { ENGINE_VERSION } from "../../src/site/engine";
import { layoutTypes, sectionTypes } from "../../src/site/registry";
import type { FieldMeta, ImageSlot } from "../../src/site/schema/fields";
import { RESERVED_SLUGS, SCHEMA_VERSION, SiteSchema } from "../../src/site/schema/site";
import {
  AUTOCOMPLETE_BY_ID, AUTOCOMPLETE_TOKENS, DATE, DEFAULT_FIELDS, EMAIL, FIELD_ID, FORM_DOM_IDS, FORM_FIELD_TYPES, ICON_TYPES,
  LENGTH_TYPES, MAX_FORM_FIELDS, NUMBER, PLACEHOLDER_TYPES, RESERVED_FIELD_IDS, TEL, TYPE_MAX,
} from "../../src/lib/contact/fields";
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

/**
 * Site languages: one dictionary file per language (src/i18n/dictionaries/<code>.ts, the same list the site build
 * uses). Names come from Intl, so adding a dictionary is all it takes for a language to show up here.
 */
const dictionaryDir = path.resolve("src/i18n/dictionaries");
const languages = await Promise.all(
  fs.readdirSync(dictionaryDir).filter((file) => file.endsWith(".ts") && file !== "index.ts").sort().map(async (file) => {
    const code = file.slice(0, -3);
    const { default: dictionary } = (await import(pathToFileURL(path.join(dictionaryDir, file)).href)) as { default: { meta: { ogLocale: string; dir: string } } };
    return {
      code,
      name: new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code,
      englishName: new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code,
      ogLocale: dictionary.meta.ogLocale,
      dir: dictionary.meta.dir,
      scripts: scriptsForLanguage(code),
    };
  }),
);

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
  languages,
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
    // A map of property names (a form field has properties named "minLength" and "maxLength"): the names stay, each
    // value is a schema of its own.
    if ((key === "properties" || key === "$defs" || key === "definitions") && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, child]) => [name, forLlm(child)]));
      continue;
    }
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

/**
 * The contact form's contract (contact.form, engine 3.8) for a form service and a generator outside the engine: the
 * field types, limits and rules, the default form, the messages and e-mail texts of every language, and the check
 * itself as one plain ES module (form-check.mjs: lib/contact/fields.ts + checkSubmission.ts compiled), so the
 * service judges a submission exactly as this engine's own /api/contact does. Regenerated with the catalog.
 */
type FormDictionary = { contactForm: Record<string, unknown> & { errors: Record<string, string> }; email: Record<string, string> };
const formMessages = Object.fromEntries(await Promise.all(languages.map(async (language) => {
  const { default: dictionary } = (await import(pathToFileURL(path.join(dictionaryDir, `${language.code}.ts`)).href)) as { default: FormDictionary };
  const m = dictionary.contactForm;
  const pick = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, m[key]]));
  return [language.code, {
    ...pick(["nameLabel", "emailLabel", "subjectLabel", "messageLabel", "emailHint", "selectPlaceholder", "submit", "sending", "success", "correctFields", "invalidSubmission", "genericError", "rateLimited"]),
    errors: m.errors,
    email: { heading: dictionary.email.heading, subjectWithTopic: dictionary.email.subjectWithTopic, subjectFromName: dictionary.email.subjectFromName, checked: dictionary.email.checked },
  }] as const;
})));
const formContract = {
  engine: ENGINE_VERSION,
  check: "form-check.mjs",
  fieldTypes: FORM_FIELD_TYPES,
  maxFields: MAX_FORM_FIELDS,
  typeMax: TYPE_MAX,
  iconTypes: ICON_TYPES,
  placeholderTypes: PLACEHOLDER_TYPES,
  lengthTypes: LENGTH_TYPES,
  reservedFieldIds: RESERVED_FIELD_IDS,
  formDomIds: FORM_DOM_IDS,
  patterns: { id: FIELD_ID.source, tel: TEL.source, email: EMAIL.source, date: DATE.source, number: NUMBER.source },
  autocomplete: { tokens: AUTOCOMPLETE_TOKENS, byId: AUTOCOMPLETE_BY_ID },
  defaultFields: DEFAULT_FIELDS,
  rules: [
    `At most ${MAX_FORM_FIELDS} fields, ids unique and matching "id", none of reservedFieldIds.`,
    "At least one required email or tel field while the form is on (enabled not false).",
    "options (2 to 20, each once) only on a select; icon only on iconTypes; placeholder only on placeholderTypes.",
    "minLength/maxLength only on lengthTypes, within typeMax; no autocomplete on checkbox and select.",
    "No field's DOM ids (contact-<id>, contact-<id>-error, contact-<id>-hint with a hint) may repeat another's or formDomIds.",
    "Without fields the form is defaultFields, with the dictionary's labels (messages.<lang>.nameLabel…).",
    "enabled false: no form; the business needs a phone or an e-mail; the service sends nothing for that site.",
  ],
  messages: formMessages,
};

/** lib/contact/fields.ts and checkSubmission.ts as one ES module, types gone (no imports left). */
function formCheckModule() {
  const compile = (file: string) =>
    ts.transpileModule(fs.readFileSync(path.resolve("src/lib/contact", file), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText.replace(/^import [^;]+ from "\.\/[\w.]+";\n/gm, "");
  return [
    `// Generated by scripts/site/catalog.ts from src/lib/contact (engine ${ENGINE_VERSION}). Do not edit: regenerate the catalog.`,
    compile("fields.ts"),
    compile("checkSubmission.ts"),
  ].join("\n");
}

writeJson(path.join(out, "form-contract.json"), formContract);
fs.writeFileSync(path.join(out, "form-check.mjs"), formCheckModule());

/**
 * v3.11: what an editor of theme.buttons needs (the factory panel): the properties and their ranges,
 * the custom properties, the contrast checks and fixes, and a site's theme buttons, from the engine's
 * own design-system/theme, bundled into one plain ES module (no imports left).
 */
const buttonStyles = await build({
  entryPoints: [path.resolve("src/design-system/theme/button-styles-module.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  legalComments: "none",
  write: false,
});
fs.writeFileSync(
  path.join(out, "button-styles.mjs"),
  `// Generated by scripts/site/catalog.ts from src/design-system/theme (engine ${ENGINE_VERSION}). Do not edit: regenerate the catalog.\n${buttonStyles.outputFiles[0].text}`,
);

writeJson(path.join(out, "site.schema.json"), { title: "Mytko site.json", ...fullSchema });
writeJson(path.join(out, "site.schema.llm.json"), { title: "Mytko site.json (for LLM structured output)", ...(forLlm(fullSchema) as object) });
writeJson(path.join(out, "catalog.json"), clean(catalog));

console.log(
  `✔ Catalog: ${catalog.sections.length} section types (${catalog.sections.reduce((sum, section) => sum + section.variants.length, 0)} variants), ` +
    `${catalog.archetypes.length} archetypes, ${catalog.fontPairs.length} font pairs → ${out}`,
);
