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
 *        [--archetype energetic] [--navbar simple] [--footer columns] [--footer-tone dark] [--lang pl]
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
const footerTone = getFlag("footer-tone");
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

// An OpenStreetMap embed link: a map link (hours-location) and a map embed (contact) at once.
const MAP_EMBED = "https://www.openstreetmap.org/export/embed.html?bbox=17.03%2C51.10%2C17.04%2C51.11&layer=mapnik";

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

    if (key === "mapUrl") return MAP_EMBED;
    // Schedule: a class every hour from 8:00, spread over the week.
    if (key === "start" || key === "end") return `${String(8 + (Math.floor(index / 7) % 13)).padStart(2, "0")}:${key === "start" ? "00" : "50"}`;
    if (key === "url" || key === "mapEmbed") return MAP_EMBED;
    if (key === "href") return schema.safeParse("/").success ? "/" : "https://example.com/";
    if (key === "id") return `${mode}-${++idCounter}`;
    // FAQ: three long categories, so the grouped layouts get several groups.
    if (key === "category") return `${textOf(max - 2, false)} ${(index % 3) + 1}`;
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

// Sections are packed onto at most 12 pages (the schema's limit). The first section of a page
// renders its h1, so every page starts with sections of types whose title is required; the
// types with an optional title fill the remaining room. A type may span several pages.
const titleRequired = (type: (typeof sectionTypes)[number]) => {
  const title = (type.content.shape as Record<string, z.ZodType>).title;
  return Boolean(title) && !title.safeParse(undefined).success;
};
const pageTypes = sectionTypes.filter((type) => !ONE_PER_PAGE_TYPES.includes(type.type));
const leadSections = pageTypes.filter(titleRequired).flatMap(sectionsOf);
const followerSections = pageTypes.filter((type) => !titleRequired(type)).flatMap(sectionsOf);

// A page holds at most 20 sections, and every page may also get a contact and a faq section.
const MAX_PAGES = 12;
const PAGE_ROOM = 18;
const perPage = Math.ceil(leadSections.length / MAX_PAGES);
const groups: ReturnType<typeof sectionsOf>[] = [];
for (let index = 0; index < leadSections.length; index += perPage) groups.push(leadSections.slice(index, index + perPage));
for (const section of followerSections) {
  const group = groups.find((sections) => sections.length < PAGE_ROOM);
  if (!group) throw new Error("make-catalog: optional-title sections left without a page (too many sections)");
  group.push(section);
}

type CatalogPage = { id: string; slug: string; title: string; nav: { show: boolean; label: string }; sections: ReturnType<typeof sectionsOf> };

const typeLabel = (type: string) => sectionTypes.find((entry) => entry.type === type)?.label ?? type;
const usedSlugs = new Set<string>();
const pages: CatalogPage[] = groups.map((sections, index) => {
  const types = [...new Set(sections.map((section) => section.type))];
  let id = index === 0 ? "home" : types[0];
  for (let n = 2; usedSlugs.has(id); n++) id = `${types[0]}-${n}`;
  usedSlugs.add(id);
  return { id, slug: index === 0 ? "/" : `/${id}`, title: types.map(typeLabel).join(" + ").slice(0, 70), nav: { show: true, label: id }, sections };
});

// Types allowed once per page (contact, faq): instance N goes onto page N, the home page
// included. When they have more instances than there are pages, pages holding only them
// are added (their first section renders the h1: faq has a title, contact a default one).
const onePerPage = sectionTypes.filter((type) => ONE_PER_PAGE_TYPES.includes(type.type)).map(sectionsOf);

for (let index = pages.length; index < Math.max(...onePerPage.map((sections) => sections.length)); index++) {
  pages.push({ id: `extra-${index}`, slug: `/extra-${index}`, title: `Kontakt i FAQ ${index}`, nav: { show: true, label: `extra-${index}` }, sections: [] });
}

for (const sections of onePerPage) {
  sections.forEach((section, index) => pages[index].sections.push(section));
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
    footer: { variant: footer, props: footerTone ? { tone: footerTone } : {}, content: example(layoutTypes.footer.content, "max", "content") },
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
