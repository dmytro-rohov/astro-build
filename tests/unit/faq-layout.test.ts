import { expect, test } from "vitest";
import { contactHref, faqGroups, matchesSearch, normalizeSearch } from "../../src/sections/faq/layout";
import { faq } from "../../src/sections/faq/schema";

const item = (id: string, category?: string) => ({ id, category });

test("groups: by category in order of appearance, uncategorized questions last as 'other'", () => {
  const items = [item("a", "Wizyty"), item("b", "Płatności"), item("c"), item("d", "Wizyty"), item("e", " Płatności ")];

  expect(faqGroups(items, "Pozostałe")).toEqual([
    { name: "Wizyty", items: [items[0], items[3]] },
    { name: "Płatności", items: [items[1], items[4]] },
    { name: "Pozostałe", items: [items[2]] },
  ]);
});

test("groups: no categories, or all in one, means no groups", () => {
  expect(faqGroups([item("a"), item("b")], "Inne")).toEqual([]);
  expect(faqGroups([item("a", "Wizyty"), item("b", "Wizyty")], "Inne")).toEqual([]);
  expect(faqGroups([item("a", "Wizyty"), item("b")], "Inne").map((group) => group.name)).toEqual(["Wizyty", "Inne"]);
});

test("search text: lower case, no diacritics, punctuation and spaces collapsed", () => {
  expect(normalizeSearch("  Ile kosztuje… WIZYTA? ")).toBe("ile kosztuje wizyta");
  expect(normalizeSearch("Źródło, Łódź i żółw")).toBe("zrodlo lodz i zolw");
  expect(normalizeSearch("PIT-11 (2025)")).toBe("pit 11 2025");
  expect(normalizeSearch("Пошук у питаннях")).toBe("пошук у питаннях");
});

test("search: every word of the query, in any order and form of accents", () => {
  const text = normalizeSearch("Jak mogę zapłacić? Gotówką, kartą lub BLIK-iem na miejscu.");

  expect(matchesSearch(text, "")).toBe(true);
  expect(matchesSearch(text, "   ")).toBe(true);
  expect(matchesSearch(text, "zaplacic")).toBe(true);
  expect(matchesSearch(text, "KARTĄ blik")).toBe(true);
  expect(matchesSearch(text, "karta przelew")).toBe(false);
  expect(matchesSearch(text, "zapł")).toBe(true);
});

test("contact link: the action, else the contact section, else e-mail, else phone", () => {
  const pages = [
    { slug: "/", sections: [{ id: "hero", type: "hero" }] },
    { slug: "/kontakt", sections: [{ id: "napisz", type: "contact" }] },
  ];
  const business = { email: "biuro@example.pl", phone: "+48 600 100 200" };

  expect(contactHref({ href: "/rezerwacja" }, pages, business)).toBe("/rezerwacja");
  expect(contactHref(undefined, pages, business)).toBe("/kontakt#napisz");
  expect(contactHref(undefined, pages.slice(0, 1), business)).toBe("mailto:biuro@example.pl");
  expect(contactHref(undefined, [], { phone: "+48 600 100 200" })).toBe("tel:+48600100200");
  expect(contactHref(undefined, [], {})).toBeUndefined();
});

test("categories, image and action are optional content shared by every variant", () => {
  const content = { title: "Pytania", items: [{ id: "a", question: "Czy trzeba się umówić?", answer: "Tak." }] };

  expect(faq.content.safeParse(content).success).toBe(true);
  expect(
    faq.content.safeParse({
      ...content,
      items: [{ ...content.items[0], category: "Wizyty" }],
      image: "asset:gabinet",
      action: { label: "Umów wizytę", href: "/kontakt" },
    }).success,
  ).toBe(true);
  expect(faq.content.safeParse({ ...content, items: [{ ...content.items[0], category: "x".repeat(41) }] }).success).toBe(false);
  expect(Object.keys(faq.variants)).toEqual(["two-column", "accordion", "split-contact", "categories", "with-image", "search"]);
});
