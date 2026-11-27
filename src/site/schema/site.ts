/**
 * site.json schema — the single source of truth for a website built by the engine.
 * Types, validation, the JSON Schema for AI and editor metadata all come from here.
 */
import { z } from "zod";
import { ENGINE_RANGE_PATTERN, ENGINE_VERSION, satisfiesEngine } from "../engine";
import { ARCHETYPE_IDS } from "../../design-system/archetypes";
import { fontPairs, type FontPairId } from "../../design-system/fonts/library";
import { MOTION_LEVELS, OVERRIDABLE_KEYS } from "../../design-system/theme";
import { BUTTON_HOVER_EFFECTS, BUTTON_KINDS, BUTTON_RADII, BUTTON_RANGES, BUTTON_SHADOWS, BUTTON_WEIGHTS, TRANSPARENT } from "../../design-system/theme/buttons";
import { layoutTypes, sectionTypes } from "../registry";
import { Action, DAYS, field, HttpsUrl, Id, imageSlot, Slug, text, Time, type ImageSlot } from "./fields";
import { ICON_NAMES } from "../../design-system/icons/library";
import { BlogSchema } from "./blog";
import { contentSchemaOf, CUSTOM_TYPE, CustomLayoutSchema, CustomSectionSchema } from "../../sections/custom/layout";
import { TITLE_MAX } from "../seo";
import { AUTOCOMPLETE_TOKENS, DEFAULT_FIELDS, FIELD_ID, FORM_DOM_IDS, FORM_FIELD_TYPES, ICON_TYPES, LENGTH_TYPES, MAX_FORM_FIELDS, PLACEHOLDER_TYPES, RESERVED_FIELD_IDS, TYPE_MAX, domIdsOf, fieldsOf } from "../../lib/contact/fields";

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
  "/404", "/500", "/robots.txt", "/humans.txt", "/rss.xml", "/site.webmanifest", "/_astro", "/fonts", "/icons",
] as const;

const RESERVED_PREFIXES = ["/api/", "/_astro/", "/fonts/", "/icons/", "/sitemap"];

/**
 * DOM ids the engine renders itself; section ids (also DOM ids) cannot take them. The default form's ids here; a site's
 * own form fields add theirs (the site's superRefine).
 */
export const RESERVED_IDS: readonly string[] = [
  "main-content",
  "navbar-menu",
  "cookie-consent-title",
  "cookie-consent-description",
  // v3.12: the titles of the footer's link groups (at most 4).
  "footer-group-1",
  "footer-group-2",
  "footer-group-3",
  "footer-group-4",
  ...DEFAULT_FIELDS.flatMap(domIdsOf),
  ...FORM_DOM_IDS,
  "contact-website-error",
];

export const isReservedId = (id: string) => RESERVED_IDS.includes(id);

/**
 * One field of the contact form (lib/contact/fields.ts has its rules): what it asks, how it looks, whether it must be
 * filled in. The privacy consent, the honeypot and the submit button are always there and are not fields.
 */
const FormFieldSchema = z.strictObject({
  id: field(z.string().regex(FIELD_ID, 'Lowercase letters, digits and "-", starting with a letter, at most 32 characters.'), {
    label: "Identyfikator", fieldType: "text", editable: false,
    description: 'The field\'s name in the submission (e.g. "phone", "service"): lowercase letters, digits and "-", starting with a letter, at most 32 characters; unique in the form; not action, method, submit, reset or another name the form uses itself.',
  }),
  type: field(z.enum(FORM_FIELD_TYPES), { label: "Rodzaj pola", fieldType: "select", description: "text, email, tel, textarea (several lines), select (one of options), checkbox, date or number." }),
  label: field(text(80), { label: "Etykieta", fieldType: "text", description: "The visible label in the site's language; for a checkbox its text." }),
  placeholder: field(text(120).optional(), { label: "Podpowiedź w polu", fieldType: "text", description: "An example shown in the empty field; for a select the text of its empty first choice (\"Choose…\" by default). Not for checkbox and date." }),
  hint: field(text(160).optional(), { label: "Opis pod polem", fieldType: "text", description: "A short help line under the field." }),
  required: field(z.boolean().default(false), { label: "Wymagane", fieldType: "toggle", description: "The form is not sent without it." }),
  width: field(z.enum(["full", "half"]).default("full"), { label: "Szerokość", fieldType: "select", description: '"half": next to another half field when the form is wide enough.' }),
  icon: field(z.enum(ICON_NAMES).optional(), { label: "Ikona", fieldType: "select", description: "An icon at the start of the field (text, email, tel, date, number)." }),
  options: field(z.array(text(80)).min(2).max(20).optional(), { label: "Opcje", fieldType: "list", description: "The choices of a select (2 to 20)." }),
  minLength: field(z.number().int().min(1).max(TYPE_MAX.textarea).optional(), { label: "Najmniej znaków", fieldType: "text", description: "For text, textarea and tel." }),
  maxLength: field(z.number().int().min(1).max(TYPE_MAX.textarea).optional(), { label: "Najwięcej znaków", fieldType: "text", description: "For text, textarea and tel; never above the type's own limit." }),
  autocomplete: field(z.enum(AUTOCOMPLETE_TOKENS).optional(), {
    label: "Autouzupełnianie", fieldType: "select",
    description: 'The browser\'s autofill (e.g. "organization", "postal-code"); without it the engine picks one by type and id ("company", "city", "postal-code", "firma", "miasto"…).',
  }),
});

/** The contact form: on or off, its fields, its button. Without it: the form as before 3.8 (name, e-mail, subject, message). */
const ContactFormSchema = z
  .strictObject({
    enabled: field(z.boolean().default(true), {
      label: "Formularz na stronie", fieldType: "toggle",
      description: "false: the contact sections show the contact details only (a business card site, reached by phone or e-mail).",
    }),
    fields: field(z.array(FormFieldSchema).min(1).max(MAX_FORM_FIELDS).optional(), {
      label: "Pola formularza", fieldType: "list",
      description: `The form's fields in order, at most ${MAX_FORM_FIELDS}; at least one required email or tel field (so the reply can reach the visitor).`,
    }),
    submitLabel: field(text(40).optional(), { label: "Tekst przycisku", fieldType: "text", description: "The submit button; a default from the language dictionary when empty." }),
  })
  .superRefine((form, context) => {
    if (!form.fields?.length) return;
    const ids = new Set<string>();
    // Every DOM id the form renders, once: "email-error" as a field would clash with the e-mail field's error line.
    const domIds = new Set<string>(FORM_DOM_IDS);
    form.fields.forEach((item, index) => {
      const at = (key: string) => ["fields", index, key];
      if (ids.has(item.id)) context.addIssue({ code: "custom", path: at("id"), message: `Duplicate field id "${item.id}".` });
      else if (domIdsOf(item).some((id) => domIds.has(id))) context.addIssue({ code: "custom", path: at("id"), message: `Field id "${item.id}" clashes with an id the form already renders (contact-…-error, contact-…-hint).` });
      ids.add(item.id);
      for (const id of domIdsOf(item)) domIds.add(id);
      if (RESERVED_FIELD_IDS.includes(item.id)) context.addIssue({ code: "custom", path: at("id"), message: `"${item.id}" is used by the form itself, choose another id.` });
      if (item.type === "select" && !item.options) context.addIssue({ code: "custom", path: at("options"), message: "A select needs its options (2 to 20)." });
      if (item.type !== "select" && item.options) context.addIssue({ code: "custom", path: at("options"), message: "Only a select has options." });
      if (item.options && new Set(item.options).size !== item.options.length) context.addIssue({ code: "custom", path: at("options"), message: "Each option once." });
      if (item.autocomplete && (item.type === "checkbox" || item.type === "select")) context.addIssue({ code: "custom", path: at("autocomplete"), message: `No autofill for a ${item.type} field.` });
      if (item.icon && !ICON_TYPES.includes(item.type)) context.addIssue({ code: "custom", path: at("icon"), message: `No icon for a ${item.type} field.` });
      if (item.placeholder && !PLACEHOLDER_TYPES.includes(item.type)) context.addIssue({ code: "custom", path: at("placeholder"), message: `No placeholder for a ${item.type} field.` });
      if ((item.minLength || item.maxLength) && !LENGTH_TYPES.includes(item.type)) context.addIssue({ code: "custom", path: at(item.maxLength ? "maxLength" : "minLength"), message: `Lengths are only for text, textarea and tel fields.` });
      if (item.maxLength && item.maxLength > TYPE_MAX[item.type]) context.addIssue({ code: "custom", path: at("maxLength"), message: `At most ${TYPE_MAX[item.type]} for a ${item.type} field.` });
      if (item.minLength && item.maxLength && item.minLength > item.maxLength) context.addIssue({ code: "custom", path: at("minLength"), message: "minLength is above maxLength." });
      // A minimum the field can never reach (a tel field takes 30 characters): the form could never be sent.
      else if (item.minLength && item.minLength > TYPE_MAX[item.type]) context.addIssue({ code: "custom", path: at("minLength"), message: `At most ${TYPE_MAX[item.type]} for a ${item.type} field.` });
    });
    // A form that is off sends nothing: its fields wait for it to be switched on.
    if (form.enabled !== false && !form.fields.some((item) => item.required && (item.type === "email" || item.type === "tel"))) {
      context.addIssue({ code: "custom", path: ["fields"], message: "Add a required email or tel field: the reply has to reach the visitor." });
    }
  });

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
  // v3.12: a business that works online only (no place customers visit).
  "OnlineBusiness", "OnlineStore",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug) || RESERVED_PREFIXES.some((prefix) => slug.startsWith(prefix));
}

// v3.13: and the custom section, drawn by one of the site's own layouts (src/sections/custom/layout.ts).
type SectionSchemas = (typeof sectionTypes)[number]["schema"] | typeof CustomSectionSchema;

/**
 * Discriminated by `type`, then by `variant` (nested unions give precise errors
 * such as "variant: Expected 'split-image'"). Zod's TS types do not model nested
 * unions, so the TS type is derived from the section type schemas directly.
 */
export const SectionSchema = z.discriminatedUnion(
  "type",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [...sectionTypes.map((type) => type.schema), CustomSectionSchema] as any,
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
    description:
      "schema.org type: Organization, LocalBusiness or a more specific subtype (DanceSchool, AutoRepair, CafeOrCoffeeShop…); " +
      "v3.12: OnlineBusiness or OnlineStore for a business customers never visit.",
  }),
  // v3.12: who the site is about, for the structured data (src/site/structured-data.ts).
  kind: field(z.enum(["business", "personal"]).optional(), {
    label: "Strona firmy czy osoby",
    fieldType: "select",
    editable: false,
    description:
      '"personal": a site about one person (specialist, freelancer, artist, portfolio); the structured data then describe a Person ' +
      '(name = business.name, with jobTitle and knowsAbout) and type keeps choosing the look. Default "business".',
  }),
  name: field(text(80).optional(), { label: "Nazwa firmy", fieldType: "text", description: "Legal or public business name; defaults to meta.name." }),
  jobTitle: field(text(80).optional(), {
    label: "Zawód",
    fieldType: "text",
    description: 'v3.12, personal sites: what the person does, e.g. "Fizjoterapeutka" (schema.org jobTitle).',
  }),
  knowsAbout: field(z.array(text(60)).max(10).optional(), {
    label: "Specjalizacje",
    fieldType: "list",
    description: 'v3.12: up to 10 fields of expertise of the person or the business, e.g. ["rehabilitacja kolana", "masaż sportowy"].',
  }),
  areaServed: field(z.array(text(80)).max(10).optional(), {
    label: "Obszar działania",
    fieldType: "list",
    description:
      'v3.12: up to 10 places served, e.g. ["Wrocław", "powiat wrocławski"]; for a business that comes to its customers without a ' +
      "public address. A local type (Plumber, HairSalon…) is described as a local business only with an address or this.",
  }),
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

/** v3.12: a page's or a post's own title for search results and sharing. */
const SEO_TITLE = `Title in search results and when shared, used as is (no site name added), at most ${TITLE_MAX} characters. Default: the title with " | site name" while the whole fits in ${TITLE_MAX} characters, else the title alone.`;

const VERIFICATION_HINT = "Paste only the code from the content=\"…\" part of the verification meta tag.";

const PageSchema = z.strictObject({
  id: Id.describe("Stable page id, unique in the site."),
  slug: Slug.describe('URL path, "/" for the home page.'),
  title: field(text(70), { label: "Tytuł strony", fieldType: "text", description: "Page title (browser tab, search results, h1 on subpages)." }),
  description: field(text(160, 50).optional(), {
    label: "Opis dla wyszukiwarek",
    fieldType: "textarea",
    description: "Meta description, 50–160 characters. Defaults to the home page: meta.description; other pages: the start of their sections' texts (v3.12), else meta.description.",
  }),
  updated: z.iso
    .date()
    .optional()
    .describe(
      "v3.12: date of the last real change of the page's content (YYYY-MM-DD), the sitemap's lastmod. Without it the page has none " +
        "(a page listing posts: its newest post). Set it when the content changes, never to the build date.",
    ),
  nav: z
    .strictObject({
      show: z.boolean().default(true),
      label: text(24).optional().describe("Menu label; defaults to the page title."),
      order: z.number().int().min(0).max(99).optional(),
    })
    .default({ show: true }),
  seo: z
    .strictObject({
      title: text(TITLE_MAX).optional().describe(SEO_TITLE),
      image: imageSlot(META_IMAGE_SLOTS.ogImage).optional().describe("Open Graph image for this page (1200×630)."),
      noindex: z.boolean().default(false),
    })
    .default({ noindex: false }),
  sections: z.array(SectionSchema).min(1).max(20),
});

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color, e.g. #e4572e.").transform((value) => value.toLowerCase());

const ColorOverrides = z.partialRecord(z.enum(OVERRIDABLE_KEYS), Hex);

/** v3.11: a number of a button property, within its range and on its step (BUTTON_RANGES). */
const stepped = ({ min, max, step, unit }: { min: number; max: number; step: number; unit: string }, what: string) =>
  z
    .number()
    .min(min)
    .max(max)
    .refine((value) => Math.abs(value / step - Math.round(value / step)) < 1e-6, `${what}: a multiple of ${step}${unit}.`)
    .describe(`${what} in ${unit} (${min} to ${max}, step ${step}).`);
const ButtonColor = z.union([Hex, z.literal(TRANSPARENT)]);
const ButtonColors = z.strictObject({
  text: Hex.optional().describe("The label."),
  background: ButtonColor.optional().describe('Hex, or "transparent".'),
  border: ButtonColor.optional().describe("Hex, or \"transparent\"; a primary button's follows its background."),
});
const ButtonStyleSchema = ButtonColors.extend({
  hover: ButtonColors.optional().describe("On hover; colors not set follow the resting ones (the background a shade darker)."),
  paddingX: stepped(BUTTON_RANGES.paddingX, "Side padding of the usual size (small and large buttons scale)").optional(),
  paddingY: stepped(BUTTON_RANGES.paddingY, "Top and bottom padding, added inside the minimum height").optional(),
  borderWidth: stepped(BUTTON_RANGES.borderWidth, "Border width").optional(),
  radius: z.enum(BUTTON_RADII).optional().describe('Corners in rem, or "pill".'),
  weight: z.union(BUTTON_WEIGHTS.map((weight) => z.literal(weight)) as [z.ZodLiteral<400>, z.ZodLiteral<500>, z.ZodLiteral<600>, z.ZodLiteral<700>]).optional(),
  uppercase: z.boolean().optional(),
  letterSpacing: stepped(BUTTON_RANGES.letterSpacing, "Letter spacing").optional(),
  shadow: z.enum(BUTTON_SHADOWS).optional(),
  hoverEffect: z.enum(BUTTON_HOVER_EFFECTS).optional().describe("\"lift\" is the theme's own."),
});
const ButtonStylesSchema = z
  .strictObject(Object.fromEntries(BUTTON_KINDS.map((kind) => [kind, ButtonStyleSchema.optional()])) as Record<(typeof BUTTON_KINDS)[number], z.ZodOptional<typeof ButtonStyleSchema>>)
  .describe(
    "v3.11: the site's own look of each kind of button, for every button of that kind. v3.12: colors that fail WCAG contrast are replaced in the build by the nearest ones that pass (a warning says which), unless theme.allowLowContrastButtons.",
  );

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
  buttons: ButtonStylesSchema.optional(),
  allowLowContrastButtons: z
    .boolean()
    .optional()
    .describe("v3.12, operator only: keep the button colors of theme.buttons as they are even where they fail WCAG contrast (by default the build fixes them)."),
  motion: z
    .enum(MOTION_LEVELS)
    .optional()
    .describe("v3.14: how the sections come in while the page scrolls: none, subtle (the default: a short rise with a fade) or lively (more movement, pictures grow in, out at the top and back). Never for visitors who reduce motion, in the editor or in print."),
});

const NavigationSchema = z.strictObject({
  auto: z.boolean().default(true).describe("Build the menu: the pages (pages[].nav), on a one-page site its sections as anchors (sections[].nav)."),
  items: z.array(Action).max(8).optional().describe("Manual menu (used when auto is false)."),
});

const SiteBase = z
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
      // v3.12: the webmaster tools (src/site/seo.ts).
      verification: z
        .strictObject({
          google: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/, VERIFICATION_HINT).optional().describe("Google Search Console: the content of google-site-verification."),
          bing: z.string().regex(/^[0-9A-Fa-f]{32}$/, VERIFICATION_HINT).optional().describe("Bing Webmaster Tools: the content of msvalidate.01 (32 hexadecimal characters)."),
          yandex: z.string().regex(/^[0-9A-Fa-f]{16,32}$/, VERIFICATION_HINT).optional().describe("Yandex Webmaster: the content of yandex-verification (hexadecimal)."),
          seznam: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, VERIFICATION_HINT).optional().describe("Seznam Webmaster: the content of seznam-wmt."),
        })
        .optional()
        .describe("v3.12: site verification codes of the webmaster tools, rendered as their meta tags: only the content value of each tag."),
      indexNow: z
        .string()
        .regex(/^[A-Za-z0-9-]{8,128}$/, "The IndexNow key: 8 to 128 letters, digits or dashes.")
        .optional()
        .describe("v3.12: IndexNow key; the build writes /<key>.txt containing it, so a publish can ping IndexNow (Bing, Yandex, Seznam…) with the changed URLs."),
      locale: z
        .string()
        .regex(/^[a-z]{2,3}_[A-Z]{2}$/, 'Open Graph locale: language_REGION, e.g. "en_GB", "pt_BR".')
        .optional()
        .describe("v3.12: the site's region for og:locale, e.g. en_GB or pt_BR, in the site's language. Default: the language's usual one (en_US, pt_PT…)."),
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
        z.strictObject({ mode: z.literal("local").describe("Node server with /api/contact (Docker)."), form: ContactFormSchema.optional() }),
        z.strictObject({
          mode: z.literal("remote").describe("Static site; the form posts to a shared form service."),
          endpoint: HttpsUrl.describe("Form service URL (see the contact API contract in the README)."),
          form: ContactFormSchema.optional(),
        }),
      ])
      .default({ mode: "local" }),
    layout: z.strictObject({
      navbar: layoutTypes.navbar.schema,
      footer: layoutTypes.footer.schema,
      // v3.9: the page of one blog post; "classic" when the site has a blog but no choice.
      article: layoutTypes.article.schema.optional(),
    }),
    navigation: NavigationSchema.default({ auto: true }),
    pages: z.array(PageSchema).min(1).max(12),
    // v3.9: posts and their page (src/site/schema/blog.ts).
    blog: BlogSchema.optional(),
    // v3.13: the site's own layouts by name, drawn by its "custom" sections (src/sections/custom/layout.ts).
    customLayouts: z
      .record(Id, CustomLayoutSchema)
      .optional()
      .describe("v3.13: layouts made for this site (fields, template, css), each drawn by the sections of type \"custom\" whose variant names it."),
  });

export const SiteSchema = SiteBase
  .superRefine((site, context) => {
    const pageIds = new Set<string>();
    const slugs = new Set<string>();
    const sectionIds = new Map<string, string>();
    // The form's own DOM ids (contact-<field>, its error and its hint): no section may take them.
    const formIds = new Set(fieldsOf(site.contact.form).flatMap(domIdsOf));

    // v3.12: og:locale names the site's language with a region.
    if (site.meta.locale && site.meta.locale.split("_")[0] !== site.lang.split("-")[0]) {
      context.addIssue({ code: "custom", path: ["meta", "locale"], message: `"${site.meta.locale}" is not in the site's language "${site.lang}".` });
    }

    // Without a form visitors call or write: the business needs a phone or an e-mail address.
    if (site.contact.form?.enabled === false && !site.business.phone && !site.business.email) {
      context.addIssue({ code: "custom", path: ["contact", "form", "enabled"], message: "The form is off: add business.phone or business.email so visitors can reach the business." });
    }

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
        // v3.13: a custom section names a layout of the site and fills its fields.
        if (section.type === CUSTOM_TYPE) {
          const layout = site.customLayouts?.[section.variant];
          if (!layout) {
            context.addIssue({ code: "custom", path: at("sections", sectionIndex, "variant"), message: `No layout "${section.variant}" in customLayouts.` });
          } else {
            const parsed = contentSchemaOf(layout.fields).safeParse(section.content);
            for (const issue of parsed.success ? [] : parsed.error.issues) {
              context.addIssue({ code: "custom", path: at("sections", sectionIndex, "content", ...(issue.path as (string | number)[])), message: issue.message });
            }
          }
        }

        const previous = sectionIds.get(section.id);

        // The first section renders the page's only <h1>; these types have an optional title.
        if (sectionIndex === 0 && (OPTIONAL_TITLE_TYPES as readonly string[]).includes(section.type) && !("title" in section.content && section.content.title)) {
          context.addIssue({ code: "custom", path: at("sections", 0, "content", "title"), message: `The first section of a page needs a title (it becomes the page's h1).` });
        }

        if (isReservedId(section.id) || formIds.has(section.id)) {
          context.addIssue({ code: "custom", path: at("sections", sectionIndex, "id"), message: `Section id "${section.id}" is used by the engine — choose another.` });
        }

        // Without a form a contact section shows the details only: they cannot be switched off too.
        if (section.type === "contact" && site.contact.form?.enabled === false && "showDetails" in section.content && section.content.showDetails === false) {
          context.addIssue({ code: "custom", path: at("sections", sectionIndex, "content", "showDetails"), message: "The form is off (contact.form.enabled): the contact details must be shown." });
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

    checkBlog(site, context);

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

/** v3.9: the blog page exists and lists the posts, post addresses are free, categories exist. */
function checkBlog(site: z.output<typeof SiteBase>, context: z.core.$RefinementCtx) {
  const listed = site.pages.flatMap((page, pageIndex) =>
    page.sections.flatMap((section, sectionIndex) => (section.type === "posts" ? [{ page, pageIndex, section, sectionIndex }] : [])),
  );
  const { blog } = site;

  if (!blog) {
    for (const { pageIndex, sectionIndex } of listed) {
      context.addIssue({ code: "custom", path: ["pages", pageIndex, "sections", sectionIndex, "type"], message: 'A "posts" section needs the site\'s blog (add "blog" with its posts).' });
    }
    return;
  }

  const blogPage = site.pages.find((page) => page.slug === blog.path);
  if (!blogPage) {
    context.addIssue({ code: "custom", path: ["blog", "path"], message: `No page "${blog.path}": add the blog page (with a posts section) to pages.` });
  } else if (!blogPage.sections.some((section) => section.type === "posts")) {
    context.addIssue({ code: "custom", path: ["blog", "path"], message: `The blog page "${blog.path}" needs a "posts" section that lists the posts.` });
  }

  const categories = new Set(blog.categories.map((category) => category.id));
  for (const { pageIndex, section, sectionIndex } of listed) {
    const category = (section.props as { category?: string }).category;
    if (category && !categories.has(category)) {
      context.addIssue({ code: "custom", path: ["pages", pageIndex, "sections", sectionIndex, "props", "category"], message: `No category "${category}" in blog.categories.` });
    }
  }

  const pageSlugs = new Set(site.pages.map((page) => page.slug));
  const postSlugs = new Set<string>();
  blog.posts.forEach((post, index) => {
    const at = (...path: (string | number)[]) => ["blog", "posts", index, ...path];
    const path = `${blog.path}/${post.slug}`;

    if (postSlugs.has(post.slug)) context.addIssue({ code: "custom", path: at("slug"), message: `Duplicate post slug "${post.slug}".` });
    postSlugs.add(post.slug);
    if (pageSlugs.has(path)) context.addIssue({ code: "custom", path: at("slug"), message: `"${path}" is already a page.` });
    if (isReservedSlug(path)) context.addIssue({ code: "custom", path: at("slug"), message: `"${path}" is reserved by the engine.` });
    if (post.category && !categories.has(post.category)) context.addIssue({ code: "custom", path: at("category"), message: `No category "${post.category}" in blog.categories.` });
    if (post.updated && post.updated < post.date) context.addIssue({ code: "custom", path: at("updated"), message: "The update date is before the publication date." });
  });
}

export type Site = z.infer<typeof SiteSchema>;
export type SiteInput = z.input<typeof SiteSchema>;
export type Page = Site["pages"][number];
export type Section = z.infer<typeof SectionSchema>;
