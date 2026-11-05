/** Resolved theme of the site being built (Vite side). */
import { site } from "virtual:site";
import { resolveTheme } from "@/design-system/theme";
import type { SectionTone } from "@/design-system/archetypes";

export const siteTheme = resolveTheme(site.theme);

/** Section tone: the section's own props.tone, else the archetype default for its type. */
export function toneFor(type: string, tone: SectionTone | undefined): SectionTone | undefined {
  return tone ?? siteTheme.archetype.sectionTones[type];
}
