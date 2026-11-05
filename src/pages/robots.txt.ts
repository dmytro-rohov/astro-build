import type { APIContext } from "astro";

export const prerender = true;

export function GET({ site }: APIContext) {
  const sitemapUrl = new URL("/sitemap-index.xml", site);

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${sitemapUrl.href}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
