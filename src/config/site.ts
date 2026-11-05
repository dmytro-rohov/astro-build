/**
 * Site configuration — the single place to change per-project content.
 *
 * Site URL is not set here. It comes from the SITE_URL environment
 * variable (see .env.example) and is available as Astro.site.
 */

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

export const siteConfig = {
  name: "Astro Starter",
  description: "Professional landing page built with Astro.",

  /** HTML lang attribute, e.g. "en", "pl". */
  lang: "en",
  /** Open Graph locale, e.g. "en_US", "pl_PL". */
  locale: "en_US",

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
  },

  labels: {
    skipToContent: "Skip to content",
  },

  header: {
    nav: [
      { label: "Home", href: "/" },
      { label: "Features", href: "/#features" },
      { label: "Components", href: "/playground" },
      { label: "Contact", href: "/contact" },
    ] as SiteLink[],
    cta: undefined as SiteLink | undefined,
  },

  footer: {
    description: "Reusable Astro frontend system for professional landing pages.",
    groups: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/#features" },
          { label: "Components", href: "/playground" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [{ label: "Privacy policy", href: "/privacy" }],
      },
    ] as SiteLinkGroup[],
    socialLinks: [] as SiteSocialLink[],
  },
};

export type SiteConfig = typeof siteConfig;
