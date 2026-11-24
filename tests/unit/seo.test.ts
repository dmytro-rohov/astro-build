import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { clip, composeTitle, pageSummary, TITLE_MAX, verificationTags } from "../../src/site/seo";
import { demoSite, writeSite } from "./helpers";

/** Issues of the demo site after `change` ([] when it is valid). */
function issuesFor(change: (site: Record<string, any>) => void): string[] {
  const site = demoSite();
  change(site);

  try {
    loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]));
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }

  return [];
}

describe("titles", () => {
  const template = "{title} | {siteName}";

  test("the site name follows the title while the whole fits", () => {
    expect(composeTitle(template, "Contact", "Studio Ania")).toBe("Contact | Studio Ania");
    expect(composeTitle(template, undefined, "Studio Ania")).toBe("Studio Ania");
    expect(composeTitle(template, "Studio Ania", "Studio Ania")).toBe("Studio Ania");
  });

  test("a title that would not fit goes alone", () => {
    const title = "Physiotherapy after knee surgery: how long it takes";
    expect(composeTitle(template, title, "Fizjoterapia Anna Kowalska")).toBe(title);
    // " | AB" is 5 characters: 55 + 5 fit exactly, 56 + 5 do not.
    expect(composeTitle(template, "x".repeat(TITLE_MAX - 5), "AB")).toBe(`${"x".repeat(TITLE_MAX - 5)} | AB`);
    expect(composeTitle(template, "x".repeat(TITLE_MAX - 4), "AB")).toBe("x".repeat(TITLE_MAX - 4));
  });

  test("pages and posts may set their own title, at most 60 characters", () => {
    expect(issuesFor((site) => (site.pages[0].seo = { title: "Studio Ania: fast websites" }))).toEqual([]);
    expect(issuesFor((site) => (site.pages[0].seo = { title: "x".repeat(61) }))[0]).toMatch(/^pages\[0\]\.seo\.title: Too big/);
    expect(issuesFor((site) => (site.blog.posts[0].seo = { title: "x".repeat(61) }))[0]).toMatch(/^blog\.posts\[0\]\.seo\.title: Too big/);
  });
});

describe("descriptions", () => {
  test("clip cuts at a word", () => {
    expect(clip("  one   two  ", 20)).toBe("one two");
    expect(clip("Lorem ipsum dolor sit amet, consectetur", 28)).toBe("Lorem ipsum dolor sit amet…");
    expect(clip("Lorem ipsum dolor sit amet", 26)).toBe("Lorem ipsum dolor sit amet");
  });

  const section = (content: Record<string, unknown>) => ({ id: "s", type: "features", variant: "cards", props: {}, content }) as never;

  test("a page without its own description says what its sections say", () => {
    const summary = pageSummary({
      sections: [
        section({ title: "Offer", description: "Massage, physiotherapy and training after injuries" }),
        section({ title: "About", body: "I have worked with **athletes** for 12 years.\n\nSee [the prices](/prices)." }),
      ],
    });
    expect(summary).toBe("Massage, physiotherapy and training after injuries. I have worked with athletes for 12 years. See the prices.");
  });

  test("a long text is cut to 155 characters, too little text gives nothing", () => {
    const long = pageSummary({ sections: [section({ description: "word ".repeat(60) })] });
    expect(long!.length).toBeLessThanOrEqual(155);
    expect(long!.endsWith("…")).toBe(true);
    expect(pageSummary({ sections: [section({ title: "Gallery", description: "Our work." })] })).toBeUndefined();
  });
});

describe("business for the structured data", () => {
  test("a personal site, its job and expertise, a service area and online types", () => {
    expect(
      issuesFor((site) => Object.assign(site.business, { kind: "personal", name: "Anna Kowalska", jobTitle: "Fizjoterapeutka", knowsAbout: ["masaż sportowy"], areaServed: ["Wrocław"] })),
    ).toEqual([]);
    expect(issuesFor((site) => (site.business.type = "OnlineStore"))).toEqual([]);
    expect(issuesFor((site) => (site.business.kind = "person"))[0]).toMatch(/^business\.kind: /);
    expect(issuesFor((site) => (site.business.areaServed = Array(11).fill("Wrocław")))[0]).toMatch(/^business\.areaServed: Too big/);
  });
});

describe("webmaster tools", () => {
  const codes = { google: "3ndRkO8rjf2D3xEh-jg0bOoTLtCXg9ZRAKeYbjK7FWA", bing: "0123456789ABCDEF0123456789ABCDEF", yandex: "5c9e2f1a0b3d4e6f", seznam: "kfa9WbX3_t0Qm1Nz7Lp2Yc4" };

  test("verification codes become their meta tags", () => {
    expect(issuesFor((site) => (site.meta.verification = codes))).toEqual([]);
    expect(verificationTags(codes)).toEqual([
      ["google-site-verification", codes.google],
      ["msvalidate.01", codes.bing],
      ["yandex-verification", codes.yandex],
      ["seznam-wmt", codes.seznam],
    ]);
    expect(verificationTags({ bing: codes.bing })).toEqual([["msvalidate.01", codes.bing]]);
    expect(verificationTags(undefined)).toEqual([]);
  });

  test("a pasted whole tag or a wrong code is an error", () => {
    expect(issuesFor((site) => (site.meta.verification = { google: `<meta name="google-site-verification" content="${codes.google}" />` }))[0]).toMatch(
      /^meta\.verification\.google: Paste only the code/,
    );
    expect(issuesFor((site) => (site.meta.verification = { bing: "xyz" }))[0]).toMatch(/^meta\.verification\.bing: /);
    expect(issuesFor((site) => (site.meta.verification = { other: "abc" }))[0]).toMatch(/^meta\.verification: Unrecognized key/);
  });

  test("an IndexNow key: 8 to 128 letters, digits or dashes", () => {
    expect(issuesFor((site) => (site.meta.indexNow = "f3a9c1e7b2d84a6f9e0c5b1d7a3e8f42"))).toEqual([]);
    expect(issuesFor((site) => (site.meta.indexNow = "short"))[0]).toMatch(/^meta\.indexNow: The IndexNow key/);
    expect(issuesFor((site) => (site.meta.indexNow = "../robots"))[0]).toMatch(/^meta\.indexNow: /);
  });

  test("og:locale with a region of the site's language", () => {
    expect(issuesFor((site) => (site.meta.locale = "en_GB"))).toEqual([]);
    expect(issuesFor((site) => (site.meta.locale = "pt_BR"))[0]).toMatch(/^meta\.locale: "pt_BR" is not in the site's language "en"/);
    expect(issuesFor((site) => (site.meta.locale = "en-GB"))[0]).toMatch(/^meta\.locale: Open Graph locale/);
  });
});
