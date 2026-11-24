/**
 * Search engine indexing rules.
 * Kept free of imports so astro.config.mjs can use it too.
 * Paths are written without a trailing slash (trailingSlash: "never").
 */

/**
 * Pages hidden from search engines: `noindex` meta and left out of the sitemap. v3.12: /privacy too, it is the
 * same template on every Factory site (indexing it would only add near-duplicates).
 */
export const noindexPaths = ["/contact/sent", "/contact/failed", "/privacy"];

/** Pages that stay indexable but are left out of the sitemap. */
export const sitemapExcludedPaths: string[] = [];

/** v3.12: the robots meta of every page of a SITE_NOINDEX build. */
export const NOINDEX_ROBOTS = "noindex, nofollow";

/**
 * v3.12: SITE_NOINDEX makes a build no search engine may index (the factory's previews): every page gets
 * `noindex, nofollow` and no canonical, no sitemap is written and robots.txt has no Sitemap line.
 * "1" or "true" switch it on; empty, "0" or "false" is a normal build; anything else is a mistake.
 */
export function parseNoindex(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();

  if (["", "0", "false"].includes(normalized)) return false;
  if (["1", "true"].includes(normalized)) return true;

  throw new Error(`SITE_NOINDEX must be 1, true, 0, false or empty (got "${value}").`);
}

export function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
}

export function isNoindexPath(pathname: string): boolean {
  return noindexPaths.includes(normalizePath(pathname));
}
