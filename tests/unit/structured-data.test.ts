import { describe, expect, test } from "vitest";
import { isoDateTime } from "../../src/site/dates";
import { mapsUrl, organizationKind, ownerId, ownerNodes } from "../../src/site/structured-data";
import { BUSINESS_TYPES, type Site } from "../../src/site/schema/site";

const URL_ = "https://example.com";

const site = (business: Partial<Site["business"]>, meta: Partial<Site["meta"]> = {}) =>
  ({
    meta: { name: "Studio Ania", description: "Fizjoterapia i masaż sportowy we Wrocławiu, wizyty od poniedziałku do soboty.", seo: {}, ...meta },
    business: { type: "Physiotherapy", hours: [], sameAs: [], ...business },
  }) as Pick<Site, "meta" | "business">;

const address = { street: "ul. Ruska 19", city: "Wrocław", postalCode: "50-079", country: "PL" };
const maps = "https://maps.app.goo.gl/abc123";

describe("the owner's schema.org type", () => {
  test("a local type with an address or a service area is a local business, without either an organization", () => {
    expect(organizationKind("HairSalon", true)).toEqual({ types: ["HairSalon"], local: true, place: true });
    expect(organizationKind("HairSalon", false)).toEqual({ types: ["Organization"], local: false, place: false });
    expect(organizationKind("OnlineStore", false)).toEqual({ types: ["OnlineStore"], local: false, place: false });
    expect(organizationKind("School", true)).toEqual({ types: ["School"], local: false, place: true });
  });

  test("engine types that are no schema.org type become real ones", () => {
    expect(organizationKind("DanceSchool", true).types).toEqual(["LocalBusiness", "EducationalOrganization"]);
    expect(organizationKind("DanceSchool", false).types).toEqual(["EducationalOrganization"]);
    expect(organizationKind("YogaStudio", true).types).toEqual(["SportsActivityLocation"]);
    expect(organizationKind("EventVenue", true)).toMatchObject({ types: ["EventVenue", "LocalBusiness"], local: true });
  });

  test("every engine type resolves to schema.org types", () => {
    for (const type of BUSINESS_TYPES) {
      for (const located of [true, false]) {
        const { types } = organizationKind(type, located);
        expect(types.length, type).toBeGreaterThan(0);
        expect(types.some((item) => ["DanceSchool", "MusicSchool", "LanguageSchool", "YogaStudio"].includes(item)), type).toBe(false);
      }
    }
  });
});

describe("owner nodes", () => {
  test("a local business: address, hours, price range, map, both names, logo and photo", () => {
    const [node, ...rest] = ownerNodes({
      site: site(
        { name: "Fizjoterapia Ania Kowalska", address, priceRange: "$$", sameAs: ["https://www.facebook.com/ania", maps], hours: [{ days: ["mo"], opens: "09:00", closes: "17:00" }] },
        { name: "Studio Ania" },
      ),
      siteUrl: URL_,
      logo: `${URL_}/icons/logo.png`,
      image: `${URL_}/og-cover.jpg`,
    });

    expect(rest).toEqual([]);
    expect(node).toMatchObject({
      "@type": "Physiotherapy",
      "@id": `${URL_}/#organization`,
      name: "Fizjoterapia Ania Kowalska",
      alternateName: "Studio Ania",
      logo: `${URL_}/icons/logo.png`,
      image: `${URL_}/og-cover.jpg`,
      address: { "@type": "PostalAddress", addressLocality: "Wrocław" },
      priceRange: "$$",
      hasMap: maps,
    });
    expect(node.openingHoursSpecification).toHaveLength(1);
  });

  test("without an address: an Organization without place properties or a second name", () => {
    const [node] = ownerNodes({ site: site({ priceRange: "$$", sameAs: [maps], hours: [{ days: ["mo"], opens: "09:00", closes: "17:00" }] }), siteUrl: URL_ });

    expect(node["@type"]).toBe("Organization");
    expect(node).not.toHaveProperty("alternateName");
    expect(node).not.toHaveProperty("logo");
    for (const key of ["address", "openingHoursSpecification", "priceRange", "hasMap"]) expect(node, key).not.toHaveProperty(key);
  });

  test("a service area keeps a local business local", () => {
    const [node] = ownerNodes({ site: site({ type: "Plumber", areaServed: ["Wrocław", "powiat wrocławski"] }), siteUrl: URL_ });
    expect(node).toMatchObject({ "@type": "Plumber", areaServed: ["Wrocław", "powiat wrocławski"] });
  });

  test("a personal site is a Person; with a place, the practice too", () => {
    const personal = site({ kind: "personal", name: "Anna Kowalska", jobTitle: "Fizjoterapeutka", knowsAbout: ["rehabilitacja kolana"], email: "anna@example.com" });
    const [person, ...rest] = ownerNodes({ site: personal, siteUrl: URL_, logo: `${URL_}/icons/logo.png`, portrait: `${URL_}/a.jpg` });

    expect(rest).toEqual([]);
    expect(person).toMatchObject({ "@type": "Person", "@id": `${URL_}/#person`, name: "Anna Kowalska", jobTitle: "Fizjoterapeutka", knowsAbout: ["rehabilitacja kolana"], image: `${URL_}/a.jpg` });
    expect(person).not.toHaveProperty("logo");
    expect(person).not.toHaveProperty("worksFor");
    expect(ownerId(personal, URL_)).toBe(`${URL_}/#person`);

    const [withPlace, practice] = ownerNodes({ site: site({ kind: "personal", name: "Anna Kowalska", address }), siteUrl: URL_ });
    expect(withPlace.worksFor).toEqual({ "@id": `${URL_}/#organization` });
    expect(withPlace).not.toHaveProperty("address");
    expect(practice).toMatchObject({ "@type": "Physiotherapy", founder: { "@id": `${URL_}/#person` }, address: { addressLocality: "Wrocław" } });
  });

  test("Google Maps links among the profiles", () => {
    expect(mapsUrl(["https://www.instagram.com/x", "https://www.google.com/maps/place/Studio"])).toBe("https://www.google.com/maps/place/Studio");
    expect(mapsUrl(["https://maps.google.com/?cid=123"])).toBe("https://maps.google.com/?cid=123");
    expect(mapsUrl(["https://g.page/r/abc"])).toBe("https://g.page/r/abc");
    expect(mapsUrl(["https://www.google.com/search?q=maps", "https://www.facebook.com/maps"])).toBeUndefined();
  });
});

test("post dates get noon in the business time zone, with its offset that day", () => {
  expect(isoDateTime("2026-11-18", "Europe/Warsaw")).toBe("2026-11-18T12:00:00+01:00");
  expect(isoDateTime("2026-07-01", "Europe/Warsaw")).toBe("2026-07-01T12:00:00+02:00");
  expect(isoDateTime("2026-07-01", "Europe/London")).toBe("2026-07-01T12:00:00+01:00");
  expect(isoDateTime("2026-01-10", "Europe/London")).toBe("2026-01-10T12:00:00+00:00");
});
