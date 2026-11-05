import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { demoSite, writeSite } from "./helpers";

/** Loads a modified demo site and returns the readable issue lines. */
function issuesFor(change: (site: Record<string, any>) => void, assets?: Record<string, { file: string; alt: string }>, files?: string[]) {
  const site = demoSite();
  change(site);

  try {
    loadSite(writeSite(site, assets ?? { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, files ?? ["hero.jpg", "icon.png"]));
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }

  return [];
}

const home = (site: Record<string, any>) => site.pages[0];
const heroSection = (site: Record<string, any>) => home(site).sections[0];

test("demo site is valid", () => {
  expect(loadSite().site.siteId).toBe("demo");
  expect(issuesFor(() => {})).toEqual([]);
});

describe("readable errors with field paths", () => {
  test("too long text", () => {
    expect(issuesFor((site) => (heroSection(site).content.title = "x".repeat(81)))).toEqual([
      expect.stringMatching(/^pages\[0\]\.sections\[0\]\.content\.title: Too big/),
    ]);
  });

  test("unknown section type", () => {
    expect(issuesFor((site) => (heroSection(site).type = "carousel"))[0]).toMatch(/^pages\[0\]\.sections\[0\]\.type: .*hero/);
  });

  test("unknown variant", () => {
    expect(issuesFor((site) => (heroSection(site).variant = "fancy"))[0]).toMatch(/^pages\[0\]\.sections\[0\]\.variant: .*split-image/);
  });

  test("prop that the variant does not have", () => {
    expect(issuesFor((site) => (heroSection(site).props.columns = "3"))[0]).toMatch(/^pages\[0\]\.sections\[0\]\.props: Unrecognized key/);
  });

  test("javascript: link", () => {
    expect(issuesFor((site) => (heroSection(site).content.primaryAction.href = "javascript:alert(1)"))[0]).toMatch(
      /^pages\[0\]\.sections\[0\]\.content\.primaryAction\.href: Links must be/,
    );
  });

  test("HTML in rich text", () => {
    expect(issuesFor((site) => (home(site).sections[3].content.items[0].answer = "<b>x</b>"))[0]).toMatch(
      /^pages\[0\]\.sections\[3\]\.content\.items\[0\]\.answer: HTML is not allowed/,
    );
  });

  test("too few list items", () => {
    expect(issuesFor((site) => (home(site).sections[1].content.items = [home(site).sections[1].content.items[0]]))[0]).toMatch(
      /^pages\[0\]\.sections\[1\]\.content\.items: Too small/,
    );
  });
});

describe("site-wide rules", () => {
  test("duplicate section id", () => {
    expect(issuesFor((site) => (home(site).sections[1].id = "hero"))).toContain('pages[0].sections[1].id: Duplicate section id "hero" (also used on page "home").');
  });

  test("duplicate list item id", () => {
    expect(issuesFor((site) => (home(site).sections[1].content.items[1].id = "tokens"))[0]).toMatch(/items\[1\]\.id: Duplicate id "tokens"/);
  });

  test("duplicate slug and page id", () => {
    const issues = issuesFor((site) => site.pages.push({ ...site.pages[1] }));
    expect(issues).toContain('pages[2].id: Duplicate page id "contact".');
    expect(issues).toContain('pages[2].slug: Duplicate slug "/contact".');
  });

  test.each(["/privacy", "/api/contact", "/contact/sent", "/playground", "/fonts/x"])("reserved slug %s", (slug) => {
    expect(issuesFor((site) => (site.pages[1].slug = slug))).toContain(`pages[1].slug: "${slug}" is reserved by the engine.`);
  });

  test("home page is required", () => {
    expect(issuesFor((site) => (home(site).slug = "/start"))).toContain('pages: A home page with slug "/" is required.');
  });

  test("anchor links must point at a section", () => {
    expect(issuesFor((site) => (site.navigation.items[1].href = "/#nope"))).toContain(
      'navigation.items[1].href: Anchor "#nope" does not match any section id on that page.',
    );
  });

  test("incompatible engine", () => {
    expect(issuesFor((site) => (site.engine = "^4.0.0"))[0]).toMatch(/^engine: Not compatible with this engine/);
  });

  test("schemaVersion must match", () => {
    expect(issuesFor((site) => (site.schemaVersion = 2))[0]).toMatch(/^schemaVersion:/);
  });

  test("language without a dictionary", () => {
    expect(issuesFor((site) => (site.lang = "de"))[0]).toMatch(/^lang: no dictionary for "de"/);
  });
});

describe("theme", () => {
  test("unknown archetype", () => {
    expect(issuesFor((site) => (site.theme = { archetype: "rainbow" }))[0]).toMatch(/^theme\.archetype: /);
  });

  test("font pair without the language's script", () => {
    const issues = issuesFor((site) => {
      site.lang = "uk";
      site.theme = { archetype: "warm" };
    });
    expect(issues[0]).toMatch(/^theme\.fontPair: "fraunces\+work-sans" .* no cyrillic glyphs needed for lang "uk"\. Use one of: .*inter/);
  });

  test("manual override must pass contrast", () => {
    const issues = issuesFor((site) => (site.theme = { archetype: "minimal", overrides: { light: { "text.muted": "#bbbbbb" } } }));
    expect(issues.some((issue) => /^theme\.overrides\.light: text\.muted #bbbbbb on background\.\w+ .* has contrast/.test(issue))).toBe(true);
  });

  test("an accent with poor contrast is accepted (adjusted at build)", () => {
    expect(issuesFor((site) => (site.theme = { archetype: "energetic", accent: "#FDE047" }))).toEqual([]);
  });
});

describe("assets", () => {
  test("unknown asset reference", () => {
    expect(issuesFor((site) => (heroSection(site).content.image = "asset:missing"))).toContain(
      'pages[0].sections[0].content.image: unknown asset "asset:missing" (add it to assets/assets.json).',
    );
  });

  test("asset file missing on disk", () => {
    expect(issuesFor(() => {}, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["icon.png"])).toContain(
      'assets/assets.json: "hero" points to a missing file assets/hero.jpg.',
    );
  });
});

test("invalid JSON gives a readable error", () => {
  try {
    loadSite(writeSite("{ not json"));
    expect.unreachable();
  } catch (error) {
    expect((error as SiteValidationError).issues[0]).toMatch(/^Not valid JSON/);
  }
});
