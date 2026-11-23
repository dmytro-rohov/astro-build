import { describe, expect, test } from "vitest";
import { getDictionary } from "../../src/i18n/dictionaries";
import { MENU_SECTIONS_MAX, menuLinks } from "../../src/site/menu";
import { SectionSchema, type Site } from "../../src/site/schema/site";
import { demoSite } from "./helpers";

// v3.10: the menu of navigation.auto. A one-page site showed only its home page; now its sections are the menu.
const words = getDictionary("pl").nav.sections;
const section = (id: string, type: string, title: string, nav?: { show?: boolean; label?: string }) => ({ id, type, variant: "default", props: {}, content: { title }, ...(nav ? { nav } : {}) });
const page = (slug: string, title: string, sections: unknown[], nav: Record<string, unknown> = { show: true }) => ({ id: slug === "/" ? "home" : slug.slice(1), slug, title, nav, sections });
/** The parts of a parsed site the menu reads. */
const site = (pages: unknown[], blog?: { path: string }) => ({ pages, ...(blog ? { blog } : {}) }) as unknown as Site;

describe("the menu of a one-page site", () => {
  test("its sections as anchors under their type's word, in the page's order; the hero and a call to action are not there", () => {
    const one = site([page("/", "Matma z Martą", [section("start", "hero", "Matma"), section("o-mnie", "about", "Cześć, jestem Marta"), section("lekcje", "services", "Lekcje matematyki"), section("ceny", "pricing", "Ile to kosztuje"), section("zapisz", "cta", "Zapisz się"), section("kontakt", "contact", "Napisz do mnie")])]);
    expect(menuLinks(one, words)).toEqual([
      { label: "O nas", href: "/#o-mnie" },
      { label: "Oferta", href: "/#lekcje" },
      { label: "Cennik", href: "/#ceny" },
      { label: "Kontakt", href: "/#kontakt" },
    ]);
  });

  test("a section's own word, a section kept out, any section put in (its short title when its type has no word)", () => {
    const one = site([page("/", "Start", [section("o-mnie", "about", "Cześć", { label: "O mnie" }), section("lekcje", "services", "Lekcje", { show: false }), section("liczby", "stats", "W liczbach", { show: true }), section("baner", "cta", "Bardzo długi tytuł wezwania do działania", { show: true })])]);
    expect(menuLinks(one, words)).toEqual([
      { label: "O mnie", href: "/#o-mnie" },
      { label: "W liczbach", href: "/#liczby" },
    ]);
  });

  test(`at most ${MENU_SECTIONS_MAX}: the most wanted types stay, in the page's order; one link per word`, () => {
    const one = site([page("/", "Start", [
      section("zalety", "features", "Zalety"), section("o-nas", "about", "O nas"), section("oferta", "services", "Oferta"),
      section("proces", "process", "Jak"), section("galeria", "gallery", "Galeria"), section("opinie", "testimonials", "Opinie"),
      section("pytania", "faq", "Pytania"), section("ceny", "pricing", "Ceny"), section("kontakt", "contact", "Kontakt"),
      section("oferta-2", "services", "Więcej usług"),
    ])]);
    expect(menuLinks(one, words).map((link) => link.href)).toEqual(["/#o-nas", "/#oferta", "/#galeria", "/#opinie", "/#ceny", "/#kontakt"]);
  });

  test("with a blog: the sections, then the blog's page (no anchor to the latest posts)", () => {
    const one = site([page("/", "Start", [section("oferta", "services", "Oferta"), section("wpisy", "posts", "Z bloga"), section("kontakt", "contact", "Kontakt")]), page("/blog", "Blog", [section("lista", "posts", "Blog")], { show: true, label: "Blog" })], { path: "/blog" });
    expect(menuLinks(one, words)).toEqual([
      { label: "Oferta", href: "/#oferta" },
      { label: "Kontakt", href: "/#kontakt" },
      { label: "Blog", href: "/blog" },
    ]);
  });

  test("the words follow the site's language", () => {
    const one = site([page("/", "Start", [section("about", "about", "About"), section("contact", "contact", "Contact")])]);
    expect(menuLinks(one, getDictionary("uk").nav.sections).map((link) => link.label)).toEqual(["Про нас", "Контакти"]);
  });
});

test("a site of several pages: its pages, as before", () => {
  const many = site([page("/", "Start", [section("o-nas", "about", "O nas")]), page("/oferta", "Oferta", [section("lista", "services", "Usługi")], { show: true, label: "Usługi", order: 1 }), page("/kontakt", "Kontakt", [section("k", "contact", "Kontakt")])]);
  expect(menuLinks(many, words)).toEqual([
    { label: "Start", href: "/" },
    { label: "Usługi", href: "/oferta" },
    { label: "Kontakt", href: "/kontakt" },
  ]);
});

test("a section's nav in site.json: show and a word of at most 24 characters", () => {
  const demo = demoSite().pages[0].sections.find((item: { type: string }) => item.type !== "hero");
  expect(SectionSchema.safeParse({ ...demo, nav: { show: true, label: "O mnie" } }).success).toBe(true);
  expect(SectionSchema.safeParse({ ...demo, nav: { label: "x".repeat(25) } }).success).toBe(false);
  expect(SectionSchema.safeParse({ ...demo, nav: { order: 1 } }).success).toBe(false);
});

test("every language has a word for every section type of the one-page menu", () => {
  const en = Object.keys(getDictionary("en").nav.sections).sort();
  for (const lang of ["cs", "de", "es", "fr", "it", "nl", "pl", "pt", "ru", "tr", "uk"]) {
    expect(Object.keys(getDictionary(lang).nav.sections).sort()).toEqual(en);
  }
});
