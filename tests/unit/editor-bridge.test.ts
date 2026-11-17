import { describe, expect, test } from "vitest";
import { parseEditorMessage, previewEditorOrigin, sectionOrder } from "../../src/site/editor-bridge";

const page = ["hero", "features", "pricing", "faq", "cta"];

describe("sectionOrder", () => {
  test("listed ids first, the rest after them in their current order", () => {
    expect(sectionOrder(page, ["hero", "faq", "features"])).toEqual(["hero", "faq", "features", "pricing", "cta"]);
    expect(sectionOrder(page, ["hero", "cta", "faq", "pricing", "features"])).toEqual(["hero", "cta", "faq", "pricing", "features"]);
    expect(sectionOrder(page, [])).toEqual(page);
  });

  test("the first section stays first (the page's h1)", () => {
    expect(sectionOrder(page, ["cta", "hero", "faq"])).toEqual(["hero", "cta", "faq", "features", "pricing"]);
    expect(sectionOrder(page, ["faq"])).toEqual(["hero", "faq", "features", "pricing", "cta"]);
  });

  test("unknown and repeated ids are ignored", () => {
    expect(sectionOrder(page, ["gallery", "faq", "faq", "team", "features"])).toEqual(["hero", "faq", "features", "pricing", "cta"]);
    expect(sectionOrder([], ["hero"])).toEqual([]);
  });
});

describe("parseEditorMessage", () => {
  test("layout: string ids only, missing lists are empty", () => {
    expect(parseEditorMessage({ type: "factory:layout", order: ["faq", 3, "hero"], hidden: ["cta"] })).toEqual({ type: "factory:layout", order: ["faq", "hero"], hidden: ["cta"] });
    expect(parseEditorMessage({ type: "factory:layout", order: "faq" })).toEqual({ type: "factory:layout", order: [], hidden: [] });
  });

  test("focus: an id or null", () => {
    expect(parseEditorMessage({ type: "factory:focus", id: "faq" })).toEqual({ type: "factory:focus", id: "faq" });
    expect(parseEditorMessage({ type: "factory:focus", id: null })).toEqual({ type: "factory:focus", id: null });
    expect(parseEditorMessage({ type: "factory:focus" })).toBeUndefined();
    expect(parseEditorMessage({ type: "factory:focus", id: 3 })).toBeUndefined();
  });

  test("anything else is ignored", () => {
    for (const data of [null, "factory:layout", 42, {}, { type: "factory:ready" }, { type: "factory:select", id: "faq" }]) {
      expect(parseEditorMessage(data)).toBeUndefined();
    }
  });
});

describe("previewEditorOrigin", () => {
  test("the origin of an http(s) URL, empty when not set", () => {
    expect(previewEditorOrigin(undefined)).toBe("");
    expect(previewEditorOrigin("")).toBe("");
    expect(previewEditorOrigin("https://factory.mytko.dev")).toBe("https://factory.mytko.dev");
    expect(previewEditorOrigin("https://factory.mytko.dev/orders/12/")).toBe("https://factory.mytko.dev");
    expect(previewEditorOrigin("http://localhost:4339")).toBe("http://localhost:4339");
  });

  test("anything else stops the build", () => {
    for (const value of ["factory.mytko.dev", "*", "javascript:alert(1)", "file:///tmp"]) {
      expect(() => previewEditorOrigin(value), value).toThrow(/PREVIEW_EDITOR_ORIGIN/);
    }
  });
});
