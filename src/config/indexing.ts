/**
 * Search engine indexing rules.
 * Kept free of imports so astro.config.mjs can use it too.
 * Paths are written without a trailing slash (trailingSlash: "never").
 */

/** Pages hidden from search engines: `noindex` meta and left out of the sitemap. */
export const noindexPaths = ["/contact/sent", "/contact/failed"];

/** Pages that stay indexable but are left out of the sitemap. */
export const sitemapExcludedPaths = ["/privacy"];

export function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
}

export function isNoindexPath(pathname: string): boolean {
  return noindexPaths.includes(normalizePath(pathname));
}
