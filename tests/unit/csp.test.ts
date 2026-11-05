import { expect, test } from "vitest";
import { cspForSite } from "../../src/site/csp";

const local = { contact: { mode: "local" as const } };

test("no Google hosts without analytics", () => {
  const csp = cspForSite(local, "");
  expect(csp.directives.join(";")).not.toContain("google");
  expect(csp.scriptResources).toEqual(["'self'"]);
  expect(csp.directives).toContain("frame-src 'none'");
});

test("Google Analytics hosts when analytics is configured", () => {
  const csp = cspForSite(local, "G-ABC123");
  expect(csp.scriptResources).toContain("https://www.googletagmanager.com");
  expect(csp.directives.find((directive) => directive.startsWith("connect-src"))).toContain("https://*.google-analytics.com");
});

test("remote contact mode allows the form service origin only", () => {
  const csp = cspForSite({ contact: { mode: "remote", endpoint: "https://forms.mytko.dev/api/v1/submit" } }, "");
  expect(csp.directives).toContain("form-action 'self' https://forms.mytko.dev");
  expect(csp.directives.find((directive) => directive.startsWith("connect-src"))).toBe("connect-src 'self' https://forms.mytko.dev");
});
