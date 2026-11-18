import type { APIContext } from "astro";
import { site as siteJson } from "virtual:site";
import { getDictionary } from "@/i18n/dictionaries";
import { ENGINE_VERSION } from "@/site/engine";
import { humansTxt } from "@/site/signature";

export const prerender = true;

// v3.7: one of the Factory easter eggs (src/site/signature.ts), in the site's language.
export function GET({ site }: APIContext) {
  const body = humansTxt(getDictionary(siteJson.lang).signature, {
    name: siteJson.meta.name,
    url: new URL("/", site).href,
    lang: siteJson.lang,
    version: ENGINE_VERSION,
    updated: new Date().toISOString().slice(0, 10),
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
