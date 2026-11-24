import { describe, expect, test } from "vitest";
import { isNoindexPath, parseNoindex } from "../../src/config/indexing";

describe("SITE_NOINDEX", () => {
  test("1 and true switch it on, empty, 0 and false leave a normal build", () => {
    for (const value of ["1", "true", "TRUE", " 1 "]) expect(parseNoindex(value), value).toBe(true);
    for (const value of [undefined, "", "0", "false", "False"]) expect(parseNoindex(value), String(value)).toBe(false);
  });

  test("anything else stops the build", () => {
    expect(() => parseNoindex("yes")).toThrow(/SITE_NOINDEX/);
    expect(() => parseNoindex("2")).toThrow(/SITE_NOINDEX/);
  });
});

test("the privacy policy and the contact results are noindex (and so out of the sitemap)", () => {
  for (const path of ["/privacy", "/privacy/", "/contact/sent", "/contact/failed"]) expect(isNoindexPath(path), path).toBe(true);
  expect(isNoindexPath("/")).toBe(false);
  expect(isNoindexPath("/contact")).toBe(false);
});
