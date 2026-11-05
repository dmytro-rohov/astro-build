/**
 * site.json schema — the single source of truth for a website built by the engine.
 * Types, validation, the JSON Schema for AI and editor metadata all come from here.
 */
import { z } from "zod";
import { ENGINE_RANGE_PATTERN, ENGINE_VERSION, satisfiesEngine } from "../engine";
import { ARCHETYPE_IDS } from "../../design-system/archetypes";
import { fontPairs, type FontPairId } from "../../design-system/fonts/library";
import { OVERRIDABLE_KEYS } from "../../design-system/theme";
import { layoutTypes, sectionTypes } from "../registry";
import { Action, field, HttpsUrl, Id, imageSlot, Slug, text, type ImageSlot } from "./fields";

export const SCHEMA_VERSION = 1;

/** Image slots outside sections (checked by the loader like section slots). */
export const META_IMAGE_SLOTS = {
  logo: { minWidth: 160, svg: true },
  icon: { aspect: [1, 1], minWidth: 512, svg: true },
  ogImage: { aspect: [1200, 630], minWidth: 1200 },
} as const satisfies Record<string, ImageSlot>;

/**
 * Paths the engine owns. Pages in site.json cannot use them (exact match or prefix).
 */
export const RESERVED_SLUGS = [
  "/api", "/contact/sent", "/contact/failed", "/privacy", "/playground",
  "/404", "/500", "/robots.txt", "/site.webmanifest", "/_astro", "/fonts", "/icons",
] as const;

const RESERVED_PREFIXES = ["/api/", "/_astro/", "/fonts/", "/icons/", "/sitemap"];

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug) || RESERVED_PREFIXES.some((prefix) => slug.startsWith(prefix));
}

type SectionSchemas = (typeof sectionTypes)[number]["schema"];

/**
 * Discriminated by `type`, then by `variant` (nested unions give precise errors
 * such as "variant: Expected 'split-image'"). Zod's TS types do not model nested
 * unions, so the TS type is derived from the section type schemas directly.
 */
export const SectionSchema = z.discriminatedUnion(
  "type",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sectionTypes.map((type) => type.schema) as any,
) as unknown as z.ZodType<z.output<SectionSchemas>, z.input<SectionSchemas>>;

const Address = z.object({
  street: text(120).optional(),
  city: text(80).optional(),
  postalCode: text(16).optional(),
  region: text(80).optional(),
  country: z.string().regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2 code, e.g. PL.").optional(),
});

export const DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time as "HH:MM", e.g. "09:00".');

const HoursEntry = z
  .object({
    days: z.array(z.enum(DAYS)).min(1).max(7).describe('Days of the week: "mo", "tu", "we", "th", "fr", "sa", "su".'),
    opens: Time.optional(),
    closes: Time.optional(),
    closed: z.boolean().optional(),
  })
  .refine((entry) => (entry.closed ? !entry.opens && !entry.closes : Boolean(entry.opens && entry.closes)), {
    message: 'Set "opens" and "closes" (HH:MM), or "closed": true.',
  });

export const BusinessSchema = z.object({
  type: field(z.string().regex(/^[A-Z][A-Za-z]{2,40}$/, "A schema.org type, e.g. LocalBusiness, DanceSchool, AutoRepair."), {
    label: "Rodzaj działalności",
    fieldType: "select",
    editable: false,
    description: "schema.org type: Organization, LocalBusiness or a more specific type (DanceSchool, AutoRepair, CafeOrCoffeeShop…).",
  }),
  name: field(text(80).optional(), { label: "Nazwa firmy", fieldType: "text", description: "Legal or public business name; defaults to meta.name." }),
  email: field(z.email().max(254).optional(), { label: "E-mail", fieldType: "text", description: "Public contact email." }),
  phone: field(z.string().regex(/^\+?[\d\s()-]{6,20}$/, "Phone number, e.g. +48 600 100 200.").optional(), {
    label: "Telefon",
    fieldType: "text",
    description: "Public phone number in international format.",
  }),
  address: field(Address.optional(), { label: "Adres", fieldType: "text", description: "Postal address of the place." }),
  hours: field(
    z
      .array(HoursEntry)
      .max(7)
      .default([])
      .superRefine((entries, context) => {
        const seen = new Set<string>();
        entries.forEach((entry, index) =>
          entry.days.forEach((day) => {
            if (seen.has(day)) context.addIssue({ code: "custom", path: [index, "days"], message: `Day "${day}" is listed twice.` });
            seen.add(day);
          }),
        );
      }),
    {
      label: "Godziny otwarcia",
      fieldType: "list",
      description: 'Opening hours, e.g. [{ "days": ["mo","tu","we","th","fr"], "opens": "09:00", "closes": "17:00" }, { "days": ["su"], "closed": true }].',
    },
  ),
  priceRange: field(text(40).optional(), { label: "Przedział cen", fieldType: "text", description: 'e.g. "$$" or "100-300 PLN".' }),
  sameAs: field(z.array(HttpsUrl).max(10).default([]), { label: "Profile w sieci", fieldType: "list", description: "Facebook, Instagram, Google Maps… (https)." }),
});

const PageSchema = z.object({
  id: Id.describe("Stable page id, unique in the site."),
  slug: Slug.describe('URL path, "/" for the home page.'),
  title: field(text(70), { label: "Tytuł strony", fieldType: "text", description: "Page title (browser tab, search results, h1 on subpages)." }),
  description: field(text(160, 50).optional(), {
    label: "Opis dla wyszukiwarek",
    fieldType: "textarea",
    description: "Meta description, 50–160 characters. Defaults to meta.description.",
  }),
  nav: z
    .object({
      show: z.boolean().default(true),
      label: text(24).optional().describe("Menu label; defaults to the page title."),
      order: z.number().int().min(0).max(99).optional(),
    })
    .default({ show: true }),
  seo: z
    .object({
      image: imageSlot(META_IMAGE_SLOTS.ogImage).optional().describe("Open Graph image for this page (1200×630)."),
      noindex: z.boolean().default(false),
    })
    .default({ noindex: false }),
  sections: z.array(SectionSchema).min(1).max(20),
});

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color, e.g. #e4572e.").transform((value) => value.toLowerCase());

const ColorOverrides = z.partialRecord(z.enum(OVERRIDABLE_KEYS), Hex);

const ThemeSchema = z.object({
  archetype: z.enum(ARCHETYPE_IDS).default("default").describe("Style preset: colors, fonts, shapes, spacing, section tones."),
  colorScheme: z.enum(["light", "dark", "auto"]).optional().describe("Defaults to the archetype's scheme."),
  accent: Hex.optional().describe("Brand accent color; adjusted automatically when it fails WCAG AA."),
  fontPair: z
    .enum(Object.keys(fontPairs) as [FontPairId, ...FontPairId[]])
    .optional()
    .describe("Heading + body font pair; defaults to the archetype's pair."),
  overrides: z
    .object({ light: ColorOverrides.optional(), dark: ColorOverrides.optional() })
    .optional()
    .describe("Exceptional manual color tokens; must pass WCAG AA as they are (no auto-adjust)."),
});

const NavigationSchema = z.object({
  auto: z.boolean().default(true).describe("Build the menu from pages[].nav."),
  items: z.array(Action).max(8).optional().describe("Manual menu (used when auto is false)."),
});

export const SiteSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(SCHEMA_VERSION),
    engine: z
      .string()
      .regex(ENGINE_RANGE_PATTERN, 'Version range like "^3.0.0".')
      .refine((range) => satisfiesEngine(range), `Not compatible with this engine (version ${ENGINE_VERSION}).`),
    siteId: Id.describe("Unique site identifier, e.g. salon-tanca-rytm."),
    lang: z
      .string()
      .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Language code, e.g. "pl", "en", "pt-BR".')
      .describe("Site language; UI texts come from src/i18n/dictionaries/<lang>.ts."),
    meta: z.object({
      name: field(text(60), { label: "Nazwa strony", fieldType: "text", description: "Business or site name (titles, header, Open Graph)." }),
      description: field(text(160, 50), {
        label: "Opis strony",
        fieldType: "textarea",
        description: "Default meta description, 50–160 characters.",
      }),
      url: HttpsUrl.optional().describe("Public site URL (canonical, sitemap). The SITE_URL env variable overrides it."),
      logo: field(imageSlot(META_IMAGE_SLOTS.logo).optional(), {
        label: "Logo",
        fieldType: "image",
        description: "Logo (SVG or PNG). Without it the business name is shown in the heading font.",
      }),
      icon: field(imageSlot(META_IMAGE_SLOTS.icon).optional(), {
        label: "Ikona strony",
        fieldType: "image",
        description: "Square icon for the browser tab and phones (at least 512×512). Defaults to a monogram.",
      }),
      seo: z
        .object({
          image: imageSlot(META_IMAGE_SLOTS.ogImage).optional().describe("Default Open Graph image; generated from name and colors when empty."),
          imageAlt: text(120).optional(),
        })
        .default({}),
    }),
    business: BusinessSchema,
    theme: ThemeSchema.default({ archetype: "default" }),
    analytics: z
      .object({
        gaId: z.string().regex(/^G-[A-Z0-9]{4,}$/, "GA4 Measurement ID, e.g. G-ABC123XYZ.").optional(),
      })
      .default({}),
    contact: z
      .discriminatedUnion("mode", [
        z.object({ mode: z.literal("local").describe("Node server with /api/contact (Docker).") }),
        z.object({
          mode: z.literal("remote").describe("Static site; the form posts to a shared form service."),
          endpoint: HttpsUrl.describe("Form service URL (see the contact API contract in the README)."),
        }),
      ])
      .default({ mode: "local" }),
    layout: z.object({
      navbar: layoutTypes.navbar.schema,
      footer: layoutTypes.footer.schema,
    }),
    navigation: NavigationSchema.default({ auto: true }),
    pages: z.array(PageSchema).min(1).max(12),
  })
  .superRefine((site, context) => {
    const pageIds = new Set<string>();
    const slugs = new Set<string>();
    const sectionIds = new Map<string, string>();

    site.pages.forEach((page, pageIndex) => {
      const at = (...path: (string | number)[]) => ["pages", pageIndex, ...path];

      if (pageIds.has(page.id)) {
        context.addIssue({ code: "custom", path: at("id"), message: `Duplicate page id "${page.id}".` });
      }
      pageIds.add(page.id);

      if (slugs.has(page.slug)) {
        context.addIssue({ code: "custom", path: at("slug"), message: `Duplicate slug "${page.slug}".` });
      }
      slugs.add(page.slug);

      if (isReservedSlug(page.slug)) {
        context.addIssue({ code: "custom", path: at("slug"), message: `"${page.slug}" is reserved by the engine.` });
      }

      page.sections.forEach((section, sectionIndex) => {
        const previous = sectionIds.get(section.id);

        if (previous) {
          context.addIssue({
            code: "custom",
            path: at("sections", sectionIndex, "id"),
            message: `Duplicate section id "${section.id}" (also used on page "${previous}").`,
          });
        }

        sectionIds.set(section.id, page.id);
      });
    });

    if (!slugs.has("/")) {
      context.addIssue({ code: "custom", path: ["pages"], message: 'A home page with slug "/" is required.' });
    }

    if (site.navigation.auto === false && !site.navigation.items?.length) {
      context.addIssue({ code: "custom", path: ["navigation", "items"], message: "Add menu items or set navigation.auto to true." });
    }

    // Links to "/#anchor" or "/page#anchor" must point at an existing section id.
    const pageBySlug = new Map(site.pages.map((page) => [page.slug, page]));
    const checkLink = (href: string, path: (string | number)[]) => {
      const match = href.match(/^(\/[^#]*)?#([\w-]+)$/);
      if (!match) return;

      const page = pageBySlug.get(match[1] || "/");
      if (match[1] && !page) return;

      const exists = page?.sections.some((section) => section.id === match[2]);
      if (!exists) {
        context.addIssue({ code: "custom", path, message: `Anchor "#${match[2]}" does not match any section id on that page.` });
      }
    };

    site.navigation.items?.forEach((item, index) => checkLink(item.href, ["navigation", "items", index, "href"]));
    if (site.layout.navbar.content.cta) {
      checkLink(site.layout.navbar.content.cta.href, ["layout", "navbar", "content", "cta", "href"]);
    }
  });

export type Site = z.infer<typeof SiteSchema>;
export type SiteInput = z.input<typeof SiteSchema>;
export type Page = Site["pages"][number];
export type Section = z.infer<typeof SectionSchema>;
