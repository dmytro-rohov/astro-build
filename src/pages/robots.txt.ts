import type { APIContext } from "astro";
import { noindex } from "virtual:site";

export const prerender = true;

export function GET({ site }: APIContext) {
  const sitemapUrl = new URL("/sitemap-index.xml", site);

  // v3.12: a SITE_NOINDEX build has no sitemap. Crawling stays allowed: only a crawled page shows its noindex.
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    ...(noindex ? [] : [`Sitemap: ${sitemapUrl.href}`, ""]),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
