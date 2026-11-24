/**
 * v3.12: where the contact form is on a site (WCAG 3.3.1 / 3.3.3: a failed send leads back to it, never to a page that
 * does not exist): the page with a contact section and that section's anchor, "/#kontakt" or "/kontakt#form". Pure (the
 * site object only), used at build time by the "failed" result page and the form's return path for a form service.
 */
import type { Site } from "./schema/site";

/** Path and section anchor of the first contact section (on `pathname`'s page when given), else the home page. */
export function contactLink(site: Pick<Site, "pages">, pathname?: string): string {
  const normalize = (path: string) => (path === "/" ? "/" : path.replace(/\/+$/, ""));
  const pages = pathname === undefined ? site.pages : site.pages.filter((page) => normalize(page.slug) === normalize(pathname));
  for (const page of pages) {
    const section = page.sections.find((candidate) => candidate.type === "contact");
    if (section) return `${page.slug}#${section.id}`;
  }

  return pathname === undefined ? "/" : contactLink(site);
}
