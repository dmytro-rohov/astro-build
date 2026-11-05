import type { Dictionary } from "./en";

export type { Dictionary };

/**
 * Every file in this folder (except index.ts) is a language.
 * The file name is the language code: pl.ts → "pl", pt-BR.ts → "pt-BR".
 * To add a language, copy en.ts, translate it and save it under the new code.
 */
const modules = import.meta.glob<{ default: Dictionary }>(
  ["./*.ts", "!./index.ts"],
  { eager: true },
);

export const dictionaries: Record<string, Dictionary> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [
    path.replace(/^\.\/|\.ts$/g, ""),
    module.default,
  ]),
);

export const availableLanguages = Object.keys(dictionaries).sort();

export function getDictionary(lang: string): Dictionary {
  const dictionary = dictionaries[lang];

  if (!dictionary) {
    throw new Error(
      `[i18n] No dictionary for language "${lang}". ` +
        `Add src/i18n/dictionaries/${lang}.ts or use one of: ${availableLanguages.join(", ")}.`,
    );
  }

  return dictionary;
}
