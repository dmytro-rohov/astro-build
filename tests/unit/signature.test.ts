import { describe, expect, it } from "vitest";
import { availableLanguages, getDictionary } from "../../src/i18n/dictionaries";
import { FACTORY_URL, commentSafe, generatorName, humansTxt, sourceComment } from "../../src/site/signature";

const site = { name: "Studio Ania", url: "https://studio-ania.pl/", lang: "pl", version: "3.7.0", updated: "2026-11-18" };

describe("factory signature", () => {
  it("has the easter egg texts in every language, with their placeholders", () => {
    for (const lang of availableLanguages) {
      const s = getDictionary(lang).signature;
      expect(s.comment, lang).toContain("{siteName}");
      expect(s.comment, lang).toContain("{url}");
      expect(s.console, lang).toContain("{url}");
      expect(s.consoleHint, lang).toContain("{url}");
      expect(s.text, lang).toContain("{siteName}");
      expect(s.factEngine, lang).toContain("{version}");
      expect(Object.values(s.humans).every((value) => value.trim().length > 0), lang).toBe(true);
    }
  });

  it("writes a comment that nothing can close early", () => {
    for (const lang of availableLanguages) {
      const comment = sourceComment(getDictionary(lang).signature, "A--B --> <!-- C");
      const body = comment.slice("<!--".length, -"-->".length);
      expect(comment.startsWith("<!--\n")).toBe(true);
      expect(body).not.toContain("--");
      expect(body).toContain(FACTORY_URL);
    }

    expect(commentSafe("a---b")).toBe("a- - -b");
  });

  it("builds humans.txt in the site's language", () => {
    const text = humansTxt(getDictionary("pl").signature, site);
    expect(text).toContain("/* ZESPÓŁ */");
    expect(text).toContain("Właściciel strony: Studio Ania");
    expect(text).toContain(`Mytko Website Factory, ${FACTORY_URL}`);
    expect(text).toContain("Ostatnia aktualizacja: 2026-11-18");
    expect(text.trimEnd().split("\n").at(-1)).toContain("Kliknij");
  });

  it("names the factory as the generator", () => {
    expect(generatorName("3.7.0")).toBe("Mytko Website Factory 3.7.0");
  });
});

describe("dictionary texts", () => {
  it("never use an em dash (house style: comma, colon or a new sentence instead)", () => {
    const texts = (value: unknown): string[] =>
      typeof value === "string" ? [value] : Object.values(value as Record<string, unknown>).flatMap(texts);

    for (const lang of availableLanguages) {
      expect(texts(getDictionary(lang)).filter((text) => text.includes("—")), lang).toEqual([]);
    }
  });
});
