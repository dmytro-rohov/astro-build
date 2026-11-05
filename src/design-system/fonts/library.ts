/**
 * Font library: OFL variable fonts from @fontsource-variable packages.
 * Only the families of the selected pair are copied into a site build.
 * `scripts` are the writing systems a family covers (checked by a unit test
 * against the installed packages).
 */

export type Script = "latin" | "latin-ext" | "cyrillic";

export type FontFamily = {
  /** CSS font-family name used in the generated @font-face rules. */
  family: string;
  /** Package directory under node_modules/@fontsource-variable/. */
  package: string;
  category: "sans-serif" | "serif";
  scripts: readonly Script[];
};

export const fontFamilies = {
  inter: { family: "Inter", package: "inter", category: "sans-serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  manrope: { family: "Manrope", package: "manrope", category: "sans-serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  "space-grotesk": { family: "Space Grotesk", package: "space-grotesk", category: "sans-serif", scripts: ["latin", "latin-ext"] },
  "playfair-display": { family: "Playfair Display", package: "playfair-display", category: "serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  "cormorant-garamond": { family: "Cormorant Garamond", package: "cormorant-garamond", category: "serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  fraunces: { family: "Fraunces", package: "fraunces", category: "serif", scripts: ["latin", "latin-ext"] },
  "work-sans": { family: "Work Sans", package: "work-sans", category: "sans-serif", scripts: ["latin", "latin-ext"] },
  oswald: { family: "Oswald", package: "oswald", category: "sans-serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  lora: { family: "Lora", package: "lora", category: "serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  nunito: { family: "Nunito", package: "nunito", category: "sans-serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  "dm-sans": { family: "DM Sans", package: "dm-sans", category: "sans-serif", scripts: ["latin", "latin-ext"] },
  sora: { family: "Sora", package: "sora", category: "sans-serif", scripts: ["latin", "latin-ext"] },
  "source-serif-4": { family: "Source Serif 4", package: "source-serif-4", category: "serif", scripts: ["latin", "latin-ext", "cyrillic"] },
  rubik: { family: "Rubik", package: "rubik", category: "sans-serif", scripts: ["latin", "latin-ext", "cyrillic"] },
} as const satisfies Record<string, FontFamily>;

export type FontFamilyId = keyof typeof fontFamilies;

export type FontPair = {
  heading: FontFamilyId;
  body: FontFamilyId;
  description: string;
  tags: readonly string[];
};

export const fontPairs = {
  inter: { heading: "inter", body: "inter", description: "Neutral, very readable sans-serif.", tags: ["neutral", "corporate", "default"] },
  "manrope+inter": { heading: "manrope", body: "inter", description: "Modern geometric headings, calm body text.", tags: ["modern", "minimal", "corporate"] },
  "space-grotesk+inter": { heading: "space-grotesk", body: "inter", description: "Quirky technical headings with energy.", tags: ["energetic", "tech", "creative"] },
  "playfair-display+inter": { heading: "playfair-display", body: "inter", description: "High-contrast serif headings, classic and premium.", tags: ["elegant", "premium", "fashion"] },
  "cormorant-garamond+manrope": { heading: "cormorant-garamond", body: "manrope", description: "Refined, airy serif headings for luxury brands.", tags: ["luxury", "elegant", "beauty"] },
  "fraunces+work-sans": { heading: "fraunces", body: "work-sans", description: "Soft, friendly serif headings with a warm feel.", tags: ["warm", "food", "craft"] },
  "oswald+inter": { heading: "oswald", body: "inter", description: "Condensed, strong headings — bold and loud.", tags: ["bold", "sport", "automotive"] },
  "lora+nunito": { heading: "lora", body: "nunito", description: "Gentle serif headings and rounded body text.", tags: ["warm", "family", "health"] },
  "dm-sans": { heading: "dm-sans", body: "dm-sans", description: "Clean low-contrast sans-serif, very minimal.", tags: ["minimal", "modern"] },
  "sora+inter": { heading: "sora", body: "inter", description: "Wide futuristic headings, polished tech look.", tags: ["premium", "tech", "modern"] },
  "source-serif-4+inter": { heading: "source-serif-4", body: "inter", description: "Trustworthy serif headings for professional services.", tags: ["corporate", "legal", "editorial"] },
  rubik: { heading: "rubik", body: "rubik", description: "Rounded, friendly sans-serif.", tags: ["friendly", "energetic", "kids"] },
} as const satisfies Record<string, FontPair>;

export type FontPairId = keyof typeof fontPairs;

/** Scripts covered by both fonts of a pair. */
export function pairScripts(pairId: FontPairId): Script[] {
  const pair = fontPairs[pairId];
  const heading: readonly Script[] = fontFamilies[pair.heading].scripts;
  const body: readonly Script[] = fontFamilies[pair.body].scripts;

  return heading.filter((script) => body.includes(script));
}

/** Languages written in Cyrillic script (ISO 639-1). */
export const CYRILLIC_LANGUAGES = ["uk", "ru", "be", "bg", "sr", "mk", "kk", "ky", "mn", "tg"];

export function scriptsForLanguage(lang: string): Script[] {
  return CYRILLIC_LANGUAGES.includes(lang.split("-")[0]) ? ["latin", "cyrillic"] : ["latin", "latin-ext"];
}

/** CSS font stack with the generated metric-matched fallback. */
export function fontStack(id: FontFamilyId): string {
  const { family, category } = fontFamilies[id];
  const system = category === "serif" ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif';

  return `"${family}", "${family} Fallback", ${system}`;
}
