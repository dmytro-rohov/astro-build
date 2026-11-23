/**
 * v3.10: the menu of `navigation.auto`. A site of several pages lists its pages (pages[].nav). A one-page site (one
 * page besides the blog's) lists the sections of that page as anchors (/#id): the visitor jumps to the offer, the
 * prices, the contact, on computers and in the phone menu alike. A section may say whether it is there and under
 * what word (sections[].nav); by default the types of MENU_SECTION_TYPES are, at most MENU_SECTIONS_MAX, each under
 * its type's word in the site's language (nav.sections of the dictionary). The blog's page follows them.
 */
import type { Site } from "./schema/site";

export type MenuLink = { label: string; href: string };

/** Section types in a one-page menu by default, the most wanted first (they stay when there are too many). */
export const MENU_SECTION_TYPES = ["services", "about", "pricing", "contact", "testimonials", "gallery", "team", "faq", "process", "schedule", "features", "hours-location", "posts"] as const;
export const MENU_SECTIONS_MAX = 6;
/** A section title short enough for the menu (a section shown there without a word of its type or its own label). */
const TITLE_MAX = 24;

/** The pages shown in the menu, in order. */
export function pageLinks(site: Site): MenuLink[] {
  return site.pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => page.nav.show)
    .sort((a, b) => (a.page.nav.order ?? a.index) - (b.page.nav.order ?? b.index))
    .map(({ page }) => ({ label: page.nav.label ?? page.title, href: page.slug }));
}

type Section = Site["pages"][number]["sections"][number];

/** The menu of `navigation.auto`; words: the menu words of the section types in the site's language. */
export function menuLinks(site: Site, words: Partial<Record<string, string>>): MenuLink[] {
  const blogPage = site.blog ? site.pages.find((page) => page.slug === site.blog?.path) : undefined;
  const content = site.pages.filter((page) => page !== blogPage);
  if (content.length !== 1) return pageLinks(site);

  const [page] = content;
  const label = (section: Section) => {
    if (section.nav?.label) return section.nav.label;
    const word = words[section.type];
    if (word) return word;
    const title = (section.content as { title?: string }).title?.trim();
    return title && title.length <= TITLE_MAX ? title : undefined;
  };
  const rank = (section: Section) => (section.nav?.show ? -1 : (MENU_SECTION_TYPES as readonly string[]).indexOf(section.type));
  // One link per word (two sections of one type: the first), the blog's latest posts only without the blog's link.
  const seen = new Set<string>();
  const candidates = page.sections.filter((section) => {
    const word = label(section);
    if (section.type === "hero" || section.nav?.show === false || !word || seen.has(word)) return false;
    if (blogPage && section.type === "posts") return false;
    if (section.nav?.show !== true && rank(section) < 0) return false;
    seen.add(word);
    return true;
  });
  // Too many: the explicitly shown ones and the most wanted types stay, in the page's order.
  const kept = new Set([...candidates].sort((a, b) => rank(a) - rank(b)).slice(0, MENU_SECTIONS_MAX));
  const anchor = page.slug === "/" ? "/" : page.slug;
  const links = candidates.filter((section) => kept.has(section)).map((section) => ({ label: label(section)!, href: `${anchor}#${section.id}` }));
  if (blogPage?.nav.show) links.push({ label: blogPage.nav.label ?? blogPage.title, href: blogPage.slug });
  return links;
}
