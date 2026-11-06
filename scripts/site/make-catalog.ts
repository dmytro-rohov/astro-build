/**
 * Generates the "catalog" test site from the schemas: one page per section type,
 * every variant twice — with MINIMUM content (required fields only, shortest
 * texts, fewest items) and MAXIMUM content (every field at its limit, longest
 * lists, very long Polish words). Placeholder images match each slot.
 *
 * Used by the boundary tests (nothing may overflow at 320/768/1440 px) and axe
 * in every archetype. Generated from the schemas, so it never drifts from them.
 *
 * Usage: tsx scripts/site/make-catalog.ts [--out .generated/catalog]
 *        [--archetype energetic] [--navbar simple] [--footer columns] [--lang pl]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { layoutTypes, sectionTypes } from "../../src/site/registry";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { ONE_PER_PAGE } from "../../src/site/schema/site";
import type { FieldMeta, ImageSlot } from "../../src/site/schema/fields";
import { getFlag } from "./args";

type Mode = "min" | "max";

const out = path.resolve(getFlag("out") ?? ".generated/catalog");
const archetype = getFlag("archetype") ?? "default";
const navbar = getFlag("navbar") ?? "simple";
const footer = getFlag("footer") ?? "columns";
const lang = getFlag("lang") ?? "pl";

// Long, real Polish words test hyphenation and wrapping.
const LONG_TEXT =
  "Najwyższej jakości usługi dla wymagających klientów w całej Polsce — konstantynopolitańczykowianeczka, " +
  "dziewięćdziesięciopięcioletni przedsiębiorca, niezapomniane doświadczenia i bezkonkurencyjne ceny. ";

const images: { file: string; width: number; height: number; hue: number }[] = [];
let imageCounter = 0;
let idCounter = 0;

function metaOf(schema: z.ZodType): { editor?: FieldMeta; imageSlot?: ImageSlot } {
  for (let current: z.ZodType | undefined = schema; current; ) {
    const meta = current.meta() as { editor?: FieldMeta; imageSlot?: ImageSlot } | undefined;
    if (meta?.editor || meta?.imageSlot) return meta;
    current = (current as unknown as { def: { innerType?: z.ZodType } }).def.innerType;
  }

  return {};
}

function textOf(length: number, multiline: boolean): string {
  if (length <= 3) return "Ok".slice(0, Math.max(1, length));

  let value = "";
  while (value.length < length) value += LONG_TEXT;
  value = value.slice(0, length).trimEnd();

  if (multiline && length > 160) {
    const middle = value.lastIndexOf(" ", Math.floor(value.length / 2));
    value = `${value.slice(0, middle)}\n\n${value.slice(middle + 1)}`;
  }

  return value.slice(0, length);
}

function richTextOf(length: number, mode: Mode): string {
  if (mode === "min") return "Krótko.";

  const sentence = "**Najwyższa jakość** i *bezkonkurencyjne* ceny — [sprawdź ofertę](/). ";
  let value = "";
  while (value.length + sentence.length < length - 4) {
    value += sentence;
    if (value.length > length / 2 && !value.includes("\n\n")) value = `${value.trimEnd()}\n\n`;
  }

  return value.trim();
}

function asset(slot: ImageSlot): string {
  const [w, h] = slot.aspect ?? [3, 2];
  const width = Math.ceil(Math.max(slot.minWidth * 1.25, 400));
  const height = Math.round((width * h) / w);
  const id = `img-${++imageCounter}`;

  images.push({ file: `${id}.jpg`, width, height, hue: (imageCounter * 47) % 360 });
  return `asset:${id}`;
}

function linkFor(key: string): string {
  return key === "mapUrl" ? "https://www.openstreetmap.org/" : "/";
}

/** Example value for a schema in min or max mode (undefined = leave the field out). */
function example(schema: z.ZodType, mode: Mode, key: string, index = 0): unknown {
  const meta = metaOf(schema);
  const def = (schema as unknown as { def: { type: string; innerType?: z.ZodType } }).def;

  if (def.type === "optional" || def.type === "default") {
    if (mode === "min") return undefined;
    return example(def.innerType!, mode, key, index);
  }

  if (meta.imageSlot) return asset(meta.imageSlot);

  if (schema instanceof z.ZodString) {
    const min = schema.minLength ?? 1;
    const max = schema.maxLength ?? 120;

    if (key === "mapUrl") return linkFor(key);
    // Schedule: a class every hour from 8:00, spread over the week.
    if (key === "start" || key === "end") return `${String(8 + (Math.floor(index / 7) % 13)).padStart(2, "0")}:${key === "start" ? "00" : "50"}`;
    if (key === "url") return "https://www.openstreetmap.org/export/embed.html?bbox=17.03%2C51.10%2C17.04%2C51.11&layer=mapnik";
    if (key === "href") return schema.safeParse("/").success ? "/" : "https://example.com/";
    if (key === "id") return `${mode}-${++idCounter}`;
    if (meta.editor?.fieldType === "richtext-lite") return richTextOf(max, mode);

    return textOf(mode === "min" ? Math.max(min, 2) : max, meta.editor?.fieldType === "textarea");
  }

  if (schema instanceof z.ZodNumber) {
    return mode === "min" ? (schema.minValue ?? 1) : (schema.maxValue ?? 5);
  }

  if (schema instanceof z.ZodBoolean) {
    return mode === "max" && (key !== "highlighted" || index === 0);
  }

  if (schema instanceof z.ZodEnum) {
    const options = schema.options as string[];
    if (key === "day") return options[index % options.length];
    return mode === "min" ? options[0] : options[options.length - 1];
  }

  if (schema instanceof z.ZodArray) {
    const checks = (schema.def.checks ?? []) as unknown as { _zod: { def: { check: string; minimum?: number; maximum?: number } } }[];
    const minimum = checks.find((check) => check._zod.def.check === "min_length")?._zod.def.minimum ?? 0;
    const maximum = checks.find((check) => check._zod.def.check === "max_length")?._zod.def.maximum ?? 6;
    const count = mode === "min" ? Math.max(minimum, 1) : maximum;

    return Array.from({ length: count }, (_, itemIndex) => example(schema.element as z.ZodType, mode, key, itemIndex));
  }

  if (schema instanceof z.ZodObject) {
    const result: Record<string, unknown> = {};

    for (const [childKey, child] of Object.entries(schema.shape)) {
      const value = example(child as z.ZodType, mode, childKey, index);
      if (value !== undefined) result[childKey] = value;
    }

    return result;
  }

  // Pipes / effects (e.g. refined lists) fall back to their input schema.
  const input = (schema as unknown as { def: { in?: z.ZodType; schema?: z.ZodType } }).def;
  if (input.in) return example(input.in, mode, key, index);

  throw new Error(`make-catalog: unsupported schema type "${def.type}" at "${key}"`);
}

const ONE_PER_PAGE_TYPES: readonly string[] = ONE_PER_PAGE;

const sectionsOf = (type: (typeof sectionTypes)[number]) =>
  Object.keys(type.variants).flatMap((variant) =>
    (["min", "max"] as const).map((mode) => {
      const definition = (type.variants as Record<string, { props?: z.ZodType }>)[variant];
      return {
        id: `${type.type}-${variant}-${mode}`,
        type: type.type,
        variant,
        // MAX also sets every variant prop (last option, toggles on), so props get rendered too.
        props: mode === "max" && definition.props ? example(definition.props, "max", "props") : {},
        content: example(type.content, mode, "content"),
      };
    }),
  );

// Two section types per page (pages are limited to 12). The first type on a
// page has a required title (it renders the page's h1, also in MIN mode).
const titleRequired = (type: (typeof sectionTypes)[number]) => {
  const title = (type.content.shape as Record<string, z.ZodType>).title;
  return Boolean(title) && !title.safeParse(undefined).success;
};
const pageTypes = sectionTypes.filter((type) => !ONE_PER_PAGE_TYPES.includes(type.type));
const leads = pageTypes.filter(titleRequired);
const followers = pageTypes.filter((type) => !titleRequired(type));
const groups: (typeof sectionTypes)[number][][] = [];

while (leads.length) {
  const lead = leads.shift()!;
  const follower = followers.shift() ?? (leads.length > followers.length ? leads.pop() : undefined);
  groups.push(follower ? [lead, follower] : [lead]);
}
if (followers.length) throw new Error("make-catalog: more optional-title types than pages");

// Types allowed once per page (contact, faq): instance N goes onto the N-th
// page after the home page.
const pages = groups.map((group, index) => ({
  id: index === 0 ? "home" : group[0].type,
  slug: index === 0 ? "/" : `/${group[0].type}`,
  title: group.map((type) => type.label).join(" + "),
  nav: { show: true, label: group[0].type },
  sections: group.flatMap(sectionsOf),
}));

for (const type of sectionTypes.filter((type) => ONE_PER_PAGE_TYPES.includes(type.type))) {
  sectionsOf(type).forEach((section, index) => pages[index + 1].sections.push(section));
}

const site = {
  schemaVersion: 1,
  engine: "^3.0.0",
  siteId: "catalog",
  lang,
  meta: {
    name: "Katalog sekcji — bardzo długa nazwa firmy",
    description: "Wygenerowana strona testowa: każdy wariant każdej sekcji z minimalną i maksymalną treścią.",
  },
  business: {
    type: "LocalBusiness",
    email: "kontakt@przyklad-bardzo-dluga-domena.pl",
    phone: "+48 600 100 200",
    address: { street: "ul. Konstantynopolitańska 123/45", city: "Wrocław", postalCode: "50-001", country: "PL" },
    hours: [
      { days: ["mo", "tu", "we", "th", "fr"], opens: "09:00", closes: "18:00" },
      { days: ["sa"], opens: "10:00", closes: "14:00" },
      { days: ["su"], closed: true },
    ],
  },
  theme: { archetype },
  layout: {
    navbar: { variant: navbar, props: {}, content: example(layoutTypes.navbar.content, "max", "content") },
    footer: { variant: footer, props: {}, content: example(layoutTypes.footer.content, "max", "content") },
  },
  navigation: { auto: true },
  pages,
};

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "assets"), { recursive: true });

const assets: Record<string, { file: string; alt: string }> = {};

for (const image of images) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${image.hue} 60% 45%)"/><stop offset="1" stop-color="hsl(${(image.hue + 60) % 360} 70% 70%)"/>
    </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toFile(path.join(out, "assets", image.file));
  assets[image.file.replace(/\.jpg$/, "")] = { file: image.file, alt: "Przykładowe zdjęcie" };
}

fs.writeFileSync(path.join(out, "assets", "assets.json"), `${JSON.stringify(assets, null, 2)}\n`);
fs.writeFileSync(path.join(out, "site.json"), `${JSON.stringify(site, null, 2)}\n`);

try {
  loadSite(out);
} catch (error) {
  if (error instanceof SiteValidationError) {
    console.error(`✖ Generated catalog is invalid — the generator is out of sync with the schemas:\n${error.message}`);
    process.exit(1);
  }

  throw error;
}

console.log(`Catalog site: ${pages.length} pages, ${pages.reduce((sum, page) => sum + page.sections.length, 0)} sections, ${images.length} images → ${out}`);
