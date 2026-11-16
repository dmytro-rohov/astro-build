import { expect, test } from "vitest";
import pl from "../../src/i18n/dictionaries/pl";
import { loadSite } from "../../src/site/loader";
import { contact } from "../../src/sections/contact/schema";
import { addressLine, contactDetails, contactHeader, contactMethods, directionsHref, hoursSummary } from "../../src/sections/contact/details";
import { demoSite, writeSite } from "./helpers";

/** The summary keeps each day's hours on one line (no-break space, word joiners around dashes). */
const unbroken = (text: string) => text.replaceAll(" ", "\u00a0").replaceAll("–", "\u2060–\u2060");
const SUMMARY = `${unbroken("Pn–Pt 08:00–20:00")} · ${unbroken("Sb 09:00–14:00")}`;

const business = {
  type: "Physiotherapy" as const,
  phone: "+48 600 100 200",
  email: "recepcja@fizjo.pl",
  address: { street: "ul. Długa 42", postalCode: "31-146", city: "Kraków", country: "PL" },
  hours: [
    { days: ["mo", "tu", "we", "th", "fr"], opens: "08:00", closes: "20:00" },
    { days: ["sa"], opens: "09:00", closes: "14:00" },
    { days: ["su"], closed: true },
  ] as never,
  sameAs: [] as string[],
};

test("details: phone first, links for phone and e-mail, directions for the address, open hours only", () => {
  expect(contactDetails(business, pl)).toEqual([
    { kind: "phone", icon: "phone", label: "Telefon", value: "+48 600 100 200", href: "tel:+48600100200" },
    { kind: "email", icon: "mail", label: "E-mail", value: "recepcja@fizjo.pl", href: "mailto:recepcja@fizjo.pl" },
    {
      kind: "address",
      icon: "map-pin",
      label: "Adres",
      value: "ul. Długa 42, 31-146 Kraków",
      href: "https://www.google.com/maps/search/?api=1&query=ul.%20D%C5%82uga%2042%2C%2031-146%20Krak%C3%B3w%2C%20PL",
    },
    {
      kind: "hours",
      icon: "clock",
      label: "Godziny otwarcia",
      value: SUMMARY,
      lines: ["Pn–Pt 08:00–20:00", "Sb 09:00–14:00", "Nd Zamknięte"],
    },
  ]);
  expect(contactDetails({ type: "LocalBusiness", email: "a@b.pl", hours: [], sameAs: [] }, pl).map((detail) => detail.kind)).toEqual(["email"]);
});

test("address line and hours summary skip what is missing", () => {
  expect(addressLine({ city: "Kraków" })).toBe("Kraków");
  expect(addressLine({ street: "ul. Długa 42" })).toBe("ul. Długa 42");
  expect(addressLine(undefined)).toBe("");
  expect(hoursSummary([], pl)).toBe("");
});

test("directions: the business's own map profile first, else a search for the address", () => {
  const profile = "https://maps.app.goo.gl/AbCdEf123";
  expect(directionsHref({ ...business, sameAs: ["https://www.facebook.com/fizjo", profile] })).toBe(profile);
  expect(directionsHref({ ...business, sameAs: ["https://www.google.com/search?q=fizjo"] })).toMatch(/^https:\/\/www\.google\.com\/maps\/search\//);
  expect(directionsHref({ address: undefined, sameAs: [] })).toBeUndefined();
});

test("methods: call with the hours, write, visit with directions; the hours go to the visit card without a phone", () => {
  const methods = contactMethods(contactDetails(business, pl), pl);
  expect(methods.map((method) => [method.title, method.lines, method.action.label])).toEqual([
    ["Zadzwoń", [SUMMARY], "+48 600 100 200"],
    ["Napisz e-mail", [], "recepcja@fizjo.pl"],
    ["Odwiedź nas", ["ul. Długa 42, 31-146 Kraków"], "Wyznacz trasę"],
  ]);

  const noPhone = contactMethods(contactDetails({ ...business, phone: undefined }, pl), pl);
  expect(noPhone.at(-1)?.lines).toEqual(["ul. Długa 42, 31-146 Kraków", SUMMARY]);
});

test("the heading falls back to the dictionary", () => {
  expect(contactHeader({}, pl)).toEqual({ eyebrow: pl.contactForm.eyebrow, title: pl.contactForm.title, description: pl.contactForm.description });
  expect(contactHeader({ title: "Umów wizytę" }, pl).title).toBe("Umów wizytę");
});

test("mapUrl accepts only map embeds", () => {
  const parse = (mapUrl: string) => contact.content.safeParse({ mapUrl }).success;

  expect(parse("https://www.openstreetmap.org/export/embed.html?bbox=19.93%2C50.05%2C19.95%2C50.07&marker=50.06%2C19.94")).toBe(true);
  expect(parse("https://www.google.com/maps/embed?pb=!1m18")).toBe(true);
  expect(parse("https://www.youtube.com/embed/abc123")).toBe(false);
  expect(parse("https://maps.app.goo.gl/AbCdEf123")).toBe(false);
});

test("a map without mapUrl and address is reported", () => {
  const site = demoSite();
  delete site.business.address;
  site.pages[0].sections.push({ id: "mapa", type: "contact", variant: "map", props: {}, content: {} });

  const warnings = loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"])).warnings;
  expect(warnings.filter((warning) => warning.includes('"map"'))).toEqual([expect.stringMatching(/no place to show/)]);
});
