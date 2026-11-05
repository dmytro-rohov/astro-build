import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { hero } from "../../src/sections/hero/schema";
import { findImageSlots } from "../../src/site/schema/slots";
import { demoSite, writeSite } from "./helpers";

async function image(dir: string, file: string, width: number, height: number) {
  await sharp({ create: { width, height, channels: 3, background: "#888" } }).jpeg().toFile(path.join(dir, "assets", file));
}

function issues(dir: string) {
  try {
    loadSite(dir);
    return [];
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }
}

test("image slots are found in content schemas", () => {
  expect(findImageSlots(hero.content)).toEqual([{ path: ["image"], slot: { aspect: [4, 3], minWidth: 960 } }]);
});

describe("image slot checks", () => {
  test("too small for the slot after cropping", async () => {
    const dir = writeSite(demoSite(), { hero: { file: "small.jpg", alt: "x" }, icon: { file: "icon.png", alt: "" } }, ["icon.png"]);
    await image(dir, "small.jpg", 1600, 600); // 4:3 crop leaves 800px

    expect(issues(dir)).toEqual([
      'pages[0].sections[0].content.image: "asset:hero" is 1600×600px; this slot needs at least 960px width cropped to 4:3 (got 800px).',
    ]);
  });

  test("SVG in a photo slot", () => {
    const dir = writeSite(demoSite(), { hero: { file: "hero.svg", alt: "x" }, icon: { file: "icon.png", alt: "" } }, ["icon.png"]);
    fs.writeFileSync(path.join(dir, "assets", "hero.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"/>');

    expect(issues(dir)[0]).toMatch(/content\.image: "asset:hero" is an SVG; this slot needs a photo/);
  });

  test("icon must be square and large enough", async () => {
    const dir = writeSite(demoSite(), { hero: { file: "hero.jpg", alt: "x" }, icon: { file: "icon.jpg", alt: "" } }, ["hero.jpg"]);
    await image(dir, "icon.jpg", 600, 300);

    expect(issues(dir)).toEqual(['meta.icon: "asset:icon" is 600×300px; this slot needs at least 512px width cropped to 1:1 (got 300px).']);
  });

  test("focal point must be in 0–100 %", () => {
    const dir = writeSite(demoSite(), { hero: { file: "hero.jpg", alt: "x", focal: { x: 120, y: 50 } } as never, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]);

    expect(issues(dir)[0]).toMatch(/^hero\.focal\.x: Too big/);
  });
});

test("demo assets pass all checks", () => {
  expect(() => loadSite()).not.toThrow();
});
