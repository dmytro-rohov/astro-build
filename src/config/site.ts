/**
 * siteConfig — compatibility layer computed from site.json (virtual:site).
 *
 * All content lives in SITE_DIR/site.json. This module only reshapes it for the
 * layouts, SEO and JSON-LD code that existed in v2, so they keep working
 * unchanged. Do not put content here.
 */
import { site } from "virtual:site";
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

const t = getDictionary(site.lang);

/** Pages shown in the menu, in order, as links. */
function pageLinks(): SiteLink[] {
  return site.pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => page.nav.show)
    .sort((a, b) => (a.page.nav.order ?? a.index) - (b.page.nav.order ?? b.index))
    .map(({ page }) => ({ label: page.nav.label ?? page.title, href: page.slug }));
}

const nav: SiteLink[] = site.navigation.auto ? pageLinks() : (site.navigation.items ?? []);

const footerContent = site.layout.footer.content;

const footerGroups: SiteLinkGroup[] = footerContent.groups ?? [
  { title: site.meta.name, links: pageLinks() },
  { title: t.footer.legal, links: [{ label: t.footer.privacyPolicy, href: "/privacy" }] },
];

const { business } = site;

export const siteConfig = {
  name: site.meta.name,
  description: site.meta.description,
  lang: site.lang,

  author: "",
  keywords: [] as string[],

  colorScheme: site.theme.colorScheme as SiteColorScheme,

  seo: {
    image: "/og-cover.jpg",
    imageAlt: site.meta.seo.imageAlt ?? site.meta.name,
    imageWidth: 1200,
    imageHeight: 630,
  },

  organization: {
    type: business.type,
    name: business.name ?? "",
    logo: "/icons/icon-512.png",
    email: business.email ?? "",
    phone: business.phone ?? "",
    address: {
      street: business.address?.street ?? "",
      city: business.address?.city ?? "",
      postalCode: business.address?.postalCode ?? "",
      region: business.address?.region ?? "",
      country: business.address?.country ?? "",
    },
    openingHours: business.openingHours,
    priceRange: business.priceRange ?? "",
    sameAs: business.sameAs,
  },

  header: {
    nav,
    cta: site.layout.navbar.content.cta as SiteLink | undefined,
    sticky: site.layout.navbar.props.sticky ?? true,
  },

  footer: {
    description: footerContent.description ?? "",
    groups: footerGroups,
    socialLinks: (footerContent.socialLinks ?? []) as SiteSocialLink[],
  },
};

export type SiteConfig = typeof siteConfig;
