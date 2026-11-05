/**
 * Site configuration — the single place to change per-project content.
 *
 * Site URL is not set here. It comes from the SITE_URL environment
 * variable (see .env.example) and is available as Astro.site.
 */
import { getDictionary } from "@/i18n/dictionaries";

export type SiteLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteLinkGroup = {
  title: string;
  links: SiteLink[];
};

export type SiteSocialLink = {
  label: string;
  href: string;
  icon: string;
};

export type SiteColorScheme = "light" | "dark" | "auto";

/**
 * Site language — the ONE place that decides the language of all UI texts.
 * Any code with a file in src/i18n/dictionaries/ works, e.g. "pl", "en", "uk".
 * To add a new language, copy en.ts to <code>.ts and translate it.
 */
const lang = "en";

const t = getDictionary(lang);

export const siteConfig = {
  name: "Astro Starter",
  description: "Professional landing page built with Astro.",

  lang,

  author: "",
  keywords: [] as string[],

  /**
   * "light" | "dark" — always use that color scheme.
   * "auto" — follow the visitor's system preference.
   */
  colorScheme: "light" as SiteColorScheme,

  seo: {
    image: "/og-cover.jpg",
    imageAlt: "Astro Starter preview",
    imageWidth: 1200,
    imageHeight: 630,
  },

  /**
   * Business data for structured data (JSON-LD) on every page.
   * Empty fields are left out of the output.
   */
  organization: {
    /**
     * Schema.org type: "Organization", "LocalBusiness" or a more specific
     * LocalBusiness type, e.g. "Restaurant", "BeautySalon", "Dentist", "LegalService".
     */
    type: "Organization",
    /** Defaults to `name` when empty. */
    name: "",
    /** Square raster logo, at least 112×112 px. */
    logo: "/icons/icon-512.png",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      postalCode: "",
      region: "",
      /** ISO 3166-1 alpha-2, e.g. "PL". */
      country: "",
    },
    /** Opening hours in schema.org format, e.g. "Mo-Fr 09:00-17:00". */
    openingHours: [] as string[],
    /** e.g. "$$" or "100-300 PLN". */
    priceRange: "",
    /** Profiles on other sites: Facebook, Instagram, LinkedIn, Google Maps… */
    sameAs: [] as string[],
  },

  header: {
    nav: [
      { label: t.nav.home, href: "/" },
      { label: t.nav.features, href: "/#features" },
      { label: t.nav.components, href: "/playground" },
      { label: t.nav.contact, href: "/contact" },
    ] as SiteLink[],
    cta: undefined as SiteLink | undefined,
  },

  footer: {
    description: "Reusable Astro frontend system for professional landing pages.",
    groups: [
      {
        title: t.footer.product,
        links: [
          { label: t.nav.features, href: "/#features" },
          { label: t.nav.components, href: "/playground" },
          { label: t.nav.contact, href: "/contact" },
        ],
      },
      {
        title: t.footer.legal,
        links: [{ label: t.footer.privacyPolicy, href: "/privacy" }],
      },
    ] as SiteLinkGroup[],
    socialLinks: [] as SiteSocialLink[],
  },
};

export type SiteConfig = typeof siteConfig;
