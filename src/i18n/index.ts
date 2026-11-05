import { siteConfig } from "@/config/site";
import { getDictionary, type Dictionary } from "./dictionaries";

export { availableLanguages, getDictionary, type Dictionary } from "./dictionaries";

/** Active site language — set once in src/config/site.ts (`lang`). */
export const lang = siteConfig.lang;

/** UI texts in the active language. */
export const t: Dictionary = getDictionary(lang);

export const ogLocale = t.meta.ogLocale;

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

/** Page title built from the language's title template. */
export function pageTitle(title?: string): string {
  if (!title || title === siteConfig.name) {
    return siteConfig.name;
  }

  return format(t.meta.titleTemplate, { title, siteName: siteConfig.name });
}
