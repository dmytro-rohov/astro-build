import { describe, expect, test } from "vitest";
import { parseButtonStyles, parseEditorMessage, previewEditorOrigin, sectionOrder } from "../../src/site/editor-bridge";

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

describe("v3.11 button styles", () => {
  test("a style is kept value by value; anything else is dropped", () => {
    expect(parseButtonStyles({
      primary: { background: "#12AB56", text: "#ffffff", border: "transparent", hover: { background: "#000000", text: "red" }, paddingX: 1.5, radius: "pill", weight: 700, uppercase: true, hoverEffect: "glow" },
      ghost: { text: "transparent", paddingX: 9, radius: "3", weight: 800, shadow: "huge", letterSpacing: Number.NaN },
      danger: { text: "#ffffff" },
    })).toEqual({
      primary: { background: "#12ab56", text: "#ffffff", border: "transparent", hover: { background: "#000000" }, paddingX: 1.5, radius: "pill", weight: 700, uppercase: true, hoverEffect: "glow" },
      ghost: {},
    });
  });

  test("numbers snap to their step (only what can be saved is shown)", () => {
    expect(parseButtonStyles({ primary: { paddingX: 1.3, borderWidth: 1.5, letterSpacing: 0.055 } })).toEqual({ primary: { paddingX: 1.25, borderWidth: 2, letterSpacing: 0.06 } });
  });

  test("text that would be CSS never passes", () => {
    expect(parseButtonStyles({ primary: { background: "red;} body{display:none", text: "url(x)", radius: "0; color: red" } })).toEqual({ primary: {} });
    expect(parseButtonStyles("primary")).toBeUndefined();
    expect(parseButtonStyles([])).toBeUndefined();
  });

  test("messages: a style (or null), a kind to highlight (or null)", () => {
    expect(parseEditorMessage({ type: "factory:button-style", styles: { primary: { radius: "0" } } })).toEqual({ type: "factory:button-style", styles: { primary: { radius: "0" } } });
    expect(parseEditorMessage({ type: "factory:button-style", styles: null })).toEqual({ type: "factory:button-style", styles: null });
    expect(parseEditorMessage({ type: "factory:button-style", styles: "x" })).toBeUndefined();
    expect(parseEditorMessage({ type: "factory:focus-buttons", kind: "ghost" })).toEqual({ type: "factory:focus-buttons", kind: "ghost" });
    expect(parseEditorMessage({ type: "factory:focus-buttons", kind: null })).toEqual({ type: "factory:focus-buttons", kind: null });
    expect(parseEditorMessage({ type: "factory:focus-buttons", kind: "danger" })).toBeUndefined();
  });
});
