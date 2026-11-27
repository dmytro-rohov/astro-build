import { describe, expect, test } from "vitest";
import { transform } from "lightningcss";
import { DEFAULT_MOTION, MOTION_LEVELS } from "../../src/design-system/theme";
import { CSS_TARGET } from "../../src/site/css-target";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { demoSite, writeSite } from "./helpers";

// v3.14: entrance animations (theme.motion, widgets/Reveal.astro) and the CSS minifier's browsers.
function issuesOf(motion: unknown): string[] {
  const site = demoSite();
  site.theme = { ...site.theme, ...(motion === undefined ? {} : { motion }) };
  try {
    loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]));
    return [];
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }
}

describe("theme.motion in site.json", () => {
  test("none, subtle and lively; not set means subtle", () => {
    for (const motion of [...MOTION_LEVELS, undefined]) expect(issuesOf(motion)).toEqual([]);
    expect(DEFAULT_MOTION).toBe("subtle");
  });

  test("anything else is refused", () => {
    expect(issuesOf("fast").join("\n")).toContain("motion");
  });
});

describe("the CSS minifier's browsers (src/site/css-target.ts)", () => {
  // Vite gives Lightning CSS the same numbers for "chrome111", "safari16.4", "ios16.4": major << 16 | minor << 8.
  const targets = Object.fromEntries(
    CSS_TARGET.map((target) => {
      const [, name, major, minor = "0"] = /^([a-z]+)(\d+)(?:\.(\d+))?$/.exec(target) ?? [];
      return [name === "ios" ? "ios_saf" : name, (Number(major) << 16) | (Number(minor) << 8)];
    }),
  );

  test("animation-timeline stays a declaration of its own: browsers refuse it inside the animation shorthand", () => {
    const css = ".a{animation:rise linear both;animation-timeline:view();animation-range:entry 0% cover 25%}";
    const code = transform({ filename: "a.css", code: Buffer.from(css), minify: true, targets }).code.toString();
    expect(code).toContain("animation-timeline:view()");
    expect(code).not.toMatch(/animation:[^;}]*view\(\)/);
  });
});
