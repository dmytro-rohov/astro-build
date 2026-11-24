import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { clip, composeTitle, pageSummary, TITLE_MAX } from "../../src/site/seo";
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
