import { describe, expect, it } from "vitest";
import { availableLanguages, getDictionary } from "../../src/i18n/dictionaries";
import { FACTORY_URL, GENERATOR, commentSafe, humansTxt, sourceComment } from "../../src/site/signature";

const site = { name: "Studio Ania", url: "https://studio-ania.pl/", lang: "pl", updated: "2026-11-18" };

describe("factory signature", () => {
  it("has the easter egg texts in every language, with their placeholders", () => {
    for (const lang of availableLanguages) {
      const s = getDictionary(lang).signature;
      expect(s.comment, lang).toContain("{siteName}");
      expect(s.comment, lang).toContain("{url}");
      expect(s.console, lang).toContain("{url}");
      expect(s.consoleHint, lang).toContain("{url}");
      expect(s.text, lang).toContain("{siteName}");
      expect(s.poweredBy.trim().length, lang).toBeGreaterThan(0);
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
    // v3.12: no engine version anywhere.
    expect(text).not.toMatch(/\d+\.\d+\.\d+/);
  });

  it("names the factory as the generator, without a version", () => {
    expect(GENERATOR).toBe("Mytko Website Factory");
  });

  it('says "Powered by" in the site\'s language (v3.12)', () => {
    expect(getDictionary("en").signature.poweredBy).toBe("Powered by");
    expect(getDictionary("pl").signature.poweredBy).toBe("Stworzone w");
    expect(new Set(availableLanguages.map((lang) => getDictionary(lang).signature.poweredBy)).size).toBeGreaterThan(8);
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
