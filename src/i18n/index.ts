import { siteConfig } from "@/config/site";
import { getDictionary, type Dictionary } from "./dictionaries";
import { composeTitle } from "@/site/seo";

export { availableLanguages, getDictionary, type Dictionary } from "./dictionaries";

/** Active site language — set once in src/config/site.ts (`lang`). */
export const lang = siteConfig.lang;

/** UI texts in the active language. */
export const t: Dictionary = getDictionary(lang);

/** v3.12: the site's own region (meta.locale, e.g. en_GB), else the language's usual one. */
export const ogLocale = siteConfig.locale ?? t.meta.ogLocale;

export const dir = t.meta.dir === "rtl" ? "rtl" : "ltr";

/**
 * Fills {placeholders} in a dictionary string.
 * format("Hello {name}", { name: "Ana" }) → "Hello Ana"
 */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Page title built from the language's title template; v3.12 without the site name when too long (src/site/seo.ts). */
export function pageTitle(title?: string): string {
  return composeTitle(t.meta.titleTemplate, title, siteConfig.name);
}
