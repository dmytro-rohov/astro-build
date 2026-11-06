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
import { Action, DAYS, field, HttpsUrl, Id, imageSlot, Slug, text, Time, type ImageSlot } from "./fields";

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
  "/api", "/contact/sent", "/contact/failed", "/privacy",
  "/404", "/500", "/robots.txt", "/site.webmanifest", "/_astro", "/fonts", "/icons",
] as const;

const RESERVED_PREFIXES = ["/api/", "/_astro/", "/fonts/", "/icons/", "/sitemap"];

/** DOM ids the engine renders itself; section ids (also DOM ids) cannot take them. */
const CONTACT_FIELDS = ["name", "email", "subject", "message", "website", "privacy"];

export const RESERVED_IDS: readonly string[] = [
  "main-content",
  "navbar-menu",
  "cookie-consent-title",
  "cookie-consent-description",
  "contact-email-hint",
  ...CONTACT_FIELDS.flatMap((name) => [`contact-${name}`, `contact-${name}-error`]),
];

export const isReservedId = (id: string) => RESERVED_IDS.includes(id);

/** Section types whose title is optional and has no fallback. */
const OPTIONAL_TITLE_TYPES = ["stats", "logo-cloud", "embed"] as const;

/** At most one per page: the form has fixed field ids, FAQPage JSON-LD must be unique. */
export const ONE_PER_PAGE = ["contact", "faq"] as const;

/** schema.org types for `business.type` (Organization, LocalBusiness and common subtypes). */
export const BUSINESS_TYPES = [
  "Organization", "LocalBusiness", "ProfessionalService",
  "AutoRepair", "AutoBodyShop", "AutoDealer", "AutoWash", "AutoPartsStore",
  "FoodEstablishment", "Restaurant", "CafeOrCoffeeShop", "Bakery", "BarOrPub", "FastFoodRestaurant", "IceCreamShop", "Winery",
  "EducationalOrganization", "School", "DanceSchool", "MusicSchool", "LanguageSchool", "ChildCare",
  "SportsActivityLocation", "ExerciseGym", "HealthClub", "SportsClub", "YogaStudio",
  "HealthAndBeautyBusiness", "BeautySalon", "HairSalon", "NailSalon", "DaySpa", "TattooParlor",
  "MedicalBusiness", "MedicalClinic", "Dentist", "Physician", "Optician", "Pharmacy", "Physiotherapy", "VeterinaryCare",
  "LegalService", "Attorney", "Notary", "AccountingService", "FinancialService", "InsuranceAgency", "RealEstateAgent",
  "HomeAndConstructionBusiness", "GeneralContractor", "Electrician", "Plumber", "HVACBusiness", "RoofingContractor",
  "HousePainter", "Locksmith", "MovingCompany",
  "Store", "ClothingStore", "Florist", "BookStore", "ElectronicsStore", "FurnitureStore", "GardenStore",
  "HardwareStore", "JewelryStore", "PetStore", "SportingGoodsStore", "BikeStore",
  "LodgingBusiness", "Hotel", "BedAndBreakfast", "Hostel", "TravelAgency",
  "DryCleaningOrLaundry", "EmploymentAgency", "EntertainmentBusiness", "EventVenue", "SelfStorage",
] as const;

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

const Address = z.strictObject({
  street: text(120).optional(),
  city: text(80).optional(),
  postalCode: text(16).optional(),
  region: text(80).optional(),
  country: z.string().regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2 code, e.g. PL.").optional(),
});

export { DAYS };

const HoursEntry = z
  .strictObject({
    days: z.array(z.enum(DAYS)).min(1).max(7).describe('Days of the week: "mo", "tu", "we", "th", "fr", "sa", "su".'),
    opens: Time.optional(),
    closes: Time.optional(),
    closed: z.boolean().optional(),
  })
  .refine((entry) => (entry.closed ? !entry.opens && !entry.closes : Boolean(entry.opens && entry.closes)), {
    message: 'Set "opens" and "closes" (HH:MM), or "closed": true.',
  });

export const BusinessSchema = z.strictObject({
  type: field(z.enum(BUSINESS_TYPES), {
    label: "Rodzaj działalności",
    fieldType: "select",
    editable: false,
    description: "schema.org type: Organization, LocalBusiness or a more specific subtype (DanceSchool, AutoRepair, CafeOrCoffeeShop…).",
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

const PageSchema = z.strictObject({
  id: Id.describe("Stable page id, unique in the site."),
  slug: Slug.describe('URL path, "/" for the home page.'),
  title: field(text(70), { label: "Tytuł strony", fieldType: "text", description: "Page title (browser tab, search results, h1 on subpages)." }),
  description: field(text(160, 50).optional(), {
    label: "Opis dla wyszukiwarek",
    fieldType: "textarea",
    description: "Meta description, 50–160 characters. Defaults to meta.description.",
  }),
  nav: z
    .strictObject({
      show: z.boolean().default(true),
      label: text(24).optional().describe("Menu label; defaults to the page title."),
      order: z.number().int().min(0).max(99).optional(),
    })
    .default({ show: true }),
  seo: z
    .strictObject({
      image: imageSlot(META_IMAGE_SLOTS.ogImage).optional().describe("Open Graph image for this page (1200×630)."),
      noindex: z.boolean().default(false),
    })
    .default({ noindex: false }),
  sections: z.array(SectionSchema).min(1).max(20),
});

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color, e.g. #e4572e.").transform((value) => value.toLowerCase());

const ColorOverrides = z.partialRecord(z.enum(OVERRIDABLE_KEYS), Hex);

const ThemeSchema = z.strictObject({
  archetype: z.enum(ARCHETYPE_IDS).default("default").describe("Style preset: colors, fonts, shapes, spacing, section tones."),
  colorScheme: z.enum(["light", "dark", "auto"]).optional().describe("Defaults to the archetype's scheme."),
  accent: Hex.optional().describe("Brand accent color; adjusted automatically when it fails WCAG AA."),
  fontPair: z
    .enum(Object.keys(fontPairs) as [FontPairId, ...FontPairId[]])
    .optional()
    .describe("Heading + body font pair; defaults to the archetype's pair."),
  overrides: z
    .strictObject({ light: ColorOverrides.optional(), dark: ColorOverrides.optional() })
    .optional()
    .describe("Exceptional manual color tokens; must pass WCAG AA as they are (no auto-adjust)."),
});

const NavigationSchema = z.strictObject({
  auto: z.boolean().default(true).describe("Build the menu from pages[].nav."),
  items: z.array(Action).max(8).optional().describe("Manual menu (used when auto is false)."),
});

export const SiteSchema = z
  .strictObject({
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
    meta: z.strictObject({
      name: field(text(60), { label: "Nazwa strony", fieldType: "text", description: "Business or site name (titles, header, Open Graph)." }),
      description: field(text(160, 50), {
        label: "Opis strony",
        fieldType: "textarea",
        description: "Default meta description, 50–160 characters.",
      }),
      url: HttpsUrl.refine((value) => {
        const url = new URL(value);
        return url.pathname === "/" && !url.search && !url.hash;
      }, "Use the site origin only, e.g. https://example.com (no path, query or hash).")
        .optional()
        .describe("Public site URL (canonical, sitemap). The SITE_URL env variable overrides it."),
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
        .strictObject({
          image: imageSlot(META_IMAGE_SLOTS.ogImage).optional().describe("Default Open Graph image; generated from name and colors when empty."),
          imageAlt: text(120).optional(),
        })
        .default({}),
      privacyUpdated: z.iso
        .date()
        .optional()
        .describe('Date of the last change of the privacy policy (YYYY-MM-DD), shown on /privacy. Default: the build date.'),
    }),
    business: BusinessSchema,
    theme: ThemeSchema.default({ archetype: "default" }),
    analytics: z
      .strictObject({
        gaId: z.string().regex(/^G-[A-Z0-9]{4,}$/, "GA4 Measurement ID, e.g. G-ABC123XYZ.").optional(),
      })
      .default({}),
    contact: z
      .discriminatedUnion("mode", [
        z.strictObject({ mode: z.literal("local").describe("Node server with /api/contact (Docker).") }),
        z.strictObject({
          mode: z.literal("remote").describe("Static site; the form posts to a shared form service."),
          endpoint: HttpsUrl.describe("Form service URL (see the contact API contract in the README)."),
        }),
      ])
      .default({ mode: "local" }),
    layout: z.strictObject({
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

      const perPage = new Map<string, number>();

      page.sections.forEach((section, sectionIndex) => {
        const previous = sectionIds.get(section.id);

        // The first section renders the page's only <h1>; these types have an optional title.
        if (sectionIndex === 0 && (OPTIONAL_TITLE_TYPES as readonly string[]).includes(section.type) && !("title" in section.content && section.content.title)) {
          context.addIssue({ code: "custom", path: at("sections", 0, "content", "title"), message: `The first section of a page needs a title (it becomes the page's h1).` });
        }

        if (isReservedId(section.id)) {
          context.addIssue({ code: "custom", path: at("sections", sectionIndex, "id"), message: `Section id "${section.id}" is used by the engine — choose another.` });
        }

        if ((ONE_PER_PAGE as readonly string[]).includes(section.type)) {
          const count = (perPage.get(section.type) ?? 0) + 1;
          perPage.set(section.type, count);
          if (count > 1) {
            context.addIssue({ code: "custom", path: at("sections", sectionIndex, "type"), message: `Only one "${section.type}" section per page.` });
          }
        }

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

    /** Every `href` below `value` (actions, plan buttons, footer links…). */
    const eachHref = (value: unknown, path: (string | number)[], visit: (href: string, path: (string | number)[]) => void) => {
      if (Array.isArray(value)) value.forEach((item, index) => eachHref(item, [...path, index], visit));
      else if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) {
          if (key === "href" && typeof item === "string") visit(item, [...path, key]);
          else eachHref(item, [...path, key], visit);
        }
      }
    };

    // Menu and layout links: "#id" means the home page.
    site.navigation.items?.forEach((item, index) => checkLink(item.href, ["navigation", "items", index, "href"]));
    eachHref(site.layout, ["layout"], checkLink);

    // Section links: "#id" means the same page.
    site.pages.forEach((page, pageIndex) =>
      eachHref(page.sections, ["pages", pageIndex, "sections"], (href, path) => checkLink(href.startsWith("#") ? `${page.slug}${href}` : href, path)),
    );
  });

export type Site = z.infer<typeof SiteSchema>;
export type SiteInput = z.input<typeof SiteSchema>;
export type Page = Site["pages"][number];
export type Section = z.infer<typeof SectionSchema>;
