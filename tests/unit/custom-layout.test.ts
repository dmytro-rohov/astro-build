import { describe, expect, it } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { SiteSchema } from "../../src/site/schema/site";
import { findImageSlots } from "../../src/site/schema/slots";
import { compileCss } from "../../src/sections/custom/css";
import { BEFORE_AFTER } from "../../src/sections/custom/examples";
import { contentSchemaOf, CustomLayoutSchema } from "../../src/sections/custom/layout";
import { compileTemplate } from "../../src/sections/custom/template";
import { demoSite, writeSite } from "./helpers";

const layout = CustomLayoutSchema.parse(BEFORE_AFTER);
const content = {
  eyebrow: "Metamorfozy",
  title: "Zobacz efekty naszej pracy",
  pairs: [{ id: "drzwi", before: "asset:hero", after: "asset:hero", caption: "Drzwi po lakierowaniu" }],
  action: { label: "Umów wycenę", href: "tel:+48600100200" },
};

/** The demo site with a before/after section after its first one. */
function siteWithCustom(overrides: { content?: unknown; variant?: string; layout?: unknown } = {}) {
  const site = demoSite();
  site.customLayouts = { "before-after": overrides.layout ?? BEFORE_AFTER };
  site.pages[0].sections.splice(1, 0, { id: "efekty", type: "custom", variant: overrides.variant ?? "before-after", content: overrides.content ?? content });
  return site;
}

const templateIssues = (template: string, fields = layout.fields) => compileTemplate(template, fields).issues;
const cssIssues = (css: string) => compileCss("demo", css).issues;
const titled = (body: string) => `<h2 data-text="title"></h2>${body}`;

describe("custom layouts (v3.13)", () => {
  it("the example layout is valid and a site uses it in a section", () => {
    expect(compileTemplate(layout.template, layout.fields).issues).toEqual([]);
    expect(compileCss("before-after", layout.css).issues).toEqual([]);
    expect(SiteSchema.safeParse(siteWithCustom()).success).toBe(true);
  });

  it("the section's content follows the layout's fields, with paths the factory can repair", () => {
    const result = SiteSchema.safeParse(siteWithCustom({ content: { pairs: [] } }));
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("pages.0.sections.1.content.title");
    expect(paths).toContain("pages.0.sections.1.content.pairs");

    const extra = SiteSchema.safeParse(siteWithCustom({ content: { ...content, price: "100 zł" } }));
    expect(extra.success).toBe(false);
  });

  it("a section names a layout of the site", () => {
    const result = SiteSchema.safeParse(siteWithCustom({ variant: "gallery-wall" }));
    expect(result.error?.issues.map((issue) => issue.message)).toContain('No layout "gallery-wall" in customLayouts.');
  });

  it("finds the image slots of a layout, so the loader checks their size and proportions", () => {
    const slots = findImageSlots(contentSchemaOf(layout.fields));
    expect(slots.map((slot) => slot.path.join("."))).toEqual(["pairs.[].before", "pairs.[].after"]);
    expect(slots[0].slot).toEqual({ aspect: [4, 3], minWidth: 800 });
  });

  it("the loader checks a custom section's images like any section's", () => {
    // The demo hero.jpg is 960 px wide: too small for a 2400 px slot.
    const big = { ...BEFORE_AFTER, fields: BEFORE_AFTER.fields.map((item) => (item.type === "list" ? { ...item, fields: item.fields.map((child) => (child.type === "image" ? { ...child, minWidth: 2400 } : child)) } : item)) };
    const dir = writeSite(siteWithCustom({ layout: big }), { hero: { file: "hero.jpg", alt: "Zdjęcie" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]);
    expect(() => loadSite(dir)).toThrow(SiteValidationError);
    try {
      loadSite(dir);
    } catch (error) {
      expect((error as SiteValidationError).issues.join("\n")).toMatch(/pages\[0\]\.sections\[1\]\.content\.pairs\[0\]\.before/);
    }
  });

  it("refuses fields with the same key, list items with their own id and min above max", () => {
    const result = CustomLayoutSchema.safeParse({
      ...BEFORE_AFTER,
      fields: [
        { key: "title", type: "text", label: "Tytuł", required: true },
        { key: "title", type: "text", label: "Tytuł 2" },
        { key: "items", type: "list", label: "Elementy", min: 5, max: 2, fields: [{ key: "id", type: "text", label: "Id" }] },
      ],
    });
    const messages = result.error!.issues.map((issue) => issue.message);
    expect(messages).toContain('Duplicate field key "title".');
    expect(messages).toContain("min is above max.");
    expect(messages).toContain('Every list item has its "id" already: use another key.');
  });
});

describe("custom layout templates", () => {
  it("refuses scripts, handlers, inline styles, own links and images, ids", () => {
    const issues = templateIssues(titled(`
      <script>alert(1)</script>
      <div onclick="x()" style="color:red" id="x"></div>
      <a href="https://example.com">x</a>
      <img src="/x.jpg">
      <iframe></iframe>
      <svg></svg>`));
    expect(issues.join("\n")).toMatch(/<script> is not allowed/);
    expect(issues.join("\n")).toMatch(/Attribute "onclick" is not allowed/);
    expect(issues.join("\n")).toMatch(/Attribute "style" is not allowed/);
    expect(issues.join("\n")).toMatch(/Attribute "id" is not allowed/);
    expect(issues.join("\n")).toMatch(/An <a> shows an action field/);
    expect(issues.join("\n")).toMatch(/An <img> shows an image field/);
    expect(issues.join("\n")).toMatch(/<iframe> is not allowed/);
    expect(issues.join("\n")).toMatch(/no SVG/);
    // Every refusal says where.
    expect(issues.every((issue) => /^line \d+: /.test(issue))).toBe(true);
  });

  it("every text comes from a field, every binding names a field of the right type", () => {
    expect(templateIssues(titled("<p>Zadzwoń do nas</p>"))[0]).toMatch(/must come from a field/);
    expect(templateIssues(titled('<p data-text="phone"></p>'))[0]).toMatch(/names no field here/);
    expect(templateIssues(titled('<p data-text="pairs"></p>'))[0]).toMatch(/needs a text or textarea field, "pairs" is list/);
    expect(templateIssues(titled('<p data-text="description">x</p>')).join()).toMatch(/leave it empty/);
    // Inside data-each the keys are the item's.
    expect(templateIssues(titled('<ul><li data-each="pairs"><p data-text="caption"></p></li></ul>'))).toEqual([]);
    expect(templateIssues(titled('<ul><li data-each="pairs"><p data-text="title"></p></li></ul>'))[0]).toMatch(/names no field here/);
  });

  it("needs the section title as an h2 and never an h1", () => {
    expect(templateIssues('<p data-text="description"></p>')[0]).toMatch(/needs its title/);
    expect(templateIssues('<h1 data-text="title"></h1>')[0]).toMatch(/<h1> is not allowed/);
    // A title bound to an optional field could be empty: it does not count.
    expect(templateIssues('<h2 data-text="eyebrow"></h2>')[0]).toMatch(/needs its title/);
    const { nodes } = compileTemplate(titled(""), layout.fields);
    expect(nodes[0]).toMatchObject({ tag: "h2", primary: true });
  });

  it("checks classes, lists, behaviors and the HTML structure", () => {
    expect(templateIssues(titled('<div class="grid"></div>'))[0]).toMatch(/classes start with c-/);
    expect(templateIssues(titled("<li></li>"))[0]).toMatch(/belongs directly in a <ul>/);
    expect(templateIssues(titled("<ul><div></div></ul>"))[0]).toMatch(/Only <li> directly inside <ul>/);
    expect(templateIssues(titled('<ul><li data-each="pairs"><div data-behavior="compare" data-before="caption" data-after="after"></div></li></ul>'))[0]).toMatch(/needs a image field/);
    expect(templateIssues(titled('<div data-behavior="tabs"></div>'))[0]).toMatch(/not a behavior/);
    expect(templateIssues(titled('<div data-behavior="slider"><li data-each="pairs"></li></div>'))).toEqual([]);
    expect(templateIssues(titled('<div data-foo="x"></div>'))[0]).toMatch(/data-foo is not a binding/);
  });
});

describe("custom layout CSS", () => {
  it("scopes every rule to the section, inside the widgets layer", () => {
    const { css, issues } = compileCss("before-after", ":scope { padding: var(--spacing-md); }\n.c-pair, .c-pair__caption:hover { gap: var(--spacing-sm); }\n@media (min-width: 48rem) { .c-pair { gap: 0; } }");
    expect(issues).toEqual([]);
    expect(css).toMatch(/^@layer widgets \{/);
    expect(css).toContain(".s-custom--before-after {");
    expect(css).toContain(".s-custom--before-after .c-pair, .s-custom--before-after .c-pair__caption:hover");
    expect(css).toContain("@media (min-width: 48rem) { .s-custom--before-after .c-pair { gap: 0; } }");
  });

  it("renames keyframes per layout", () => {
    const { css } = compileCss("demo", "@keyframes rise { from { opacity: 0; } to { opacity: 1; } }\n.c-a { animation: rise 1s ease-out; }");
    expect(css).toContain("@keyframes c-demo-rise");
    expect(css).toContain("animation: c-demo-rise 1s ease-out");
  });

  it("takes colors and fonts from the theme only", () => {
    expect(cssIssues(".c-a { color: #ff0000; }")[0]).toMatch(/color of its own/);
    expect(cssIssues(".c-a { background: rgb(0 0 0); }")[0]).toMatch(/color of its own/);
    expect(cssIssues(".c-a { border: 1px solid red; }")[0]).toMatch(/color of its own/);
    expect(cssIssues(".c-a { color: var(--c-ink, white); }")[0]).toMatch(/color of its own/);
    expect(cssIssues(".c-a { font-family: Arial; }")[0]).toMatch(/font-family: only/);
    expect(cssIssues(".c-a { font: 12px serif; }")[0]).toMatch(/"font" is not allowed/);
    expect(cssIssues(".c-a { color: var(--brand); }")[0]).toMatch(/is not a theme token/);
    expect(cssIssues(".c-a { --color-text-primary: var(--color-action-primary); }")[0]).toMatch(/tokens are read-only/);
    expect(cssIssues("@media (prefers-color-scheme: dark) { .c-a { color: var(--color-text-primary); } }")[0]).toMatch(/No prefers-color-scheme/);
    expect(cssIssues(".c-a { color: color-mix(in oklab, var(--color-action-primary) 40%, transparent); border-color: currentColor; }")).toEqual([]);
  });

  it("refuses anything that loads, escapes the section or covers the page", () => {
    expect(cssIssues(".c-a { background: url(https://example.com/x.png); }")[0]).toMatch(/no url\(\)/);
    expect(cssIssues("@import url(x.css);")[0]).toMatch(/@import is not allowed/);
    expect(cssIssues("@font-face { font-family: x; }")[0]).toMatch(/@font-face is not allowed/);
    expect(cssIssues("body { margin: 0; }")[0]).toMatch(/no ids, html, body/);
    expect(cssIssues("#kontakt { margin: 0; }")[0]).toMatch(/no ids/);
    expect(cssIssues(".button { margin: 0; }")[0]).toMatch(/not the template's/);
    expect(cssIssues(".c-a { color: var(--color-text-primary) !important; }")[0]).toMatch(/No !important/);
    expect(cssIssues(".c-a { position: fixed; }")[0]).toMatch(/position: fixed/);
    expect(cssIssues('.c-a::before { content: "Nowość"; }')[0]).toMatch(/no text in CSS/);
    expect(cssIssues(".c-a { .c-b { margin: 0; } }")[0]).toMatch(/Nested rules/);
    expect(cssIssues(".c-a { z-index: 9999; }")[0]).toMatch(/at most 10/);
    expect(cssIssues(".c-a { color: var(--color-text-primary)")[0]).toMatch(/Unclosed block/);
  });
});
