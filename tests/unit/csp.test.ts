import { expect, test } from "vitest";
import { cspForSite, embedOrigins } from "../../src/site/csp";

const local = { contact: { mode: "local" as const }, pages: [] };

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
  const csp = cspForSite({ contact: { mode: "remote", endpoint: "https://forms.mytko.dev/api/v1/submit" }, pages: [] }, "");
  expect(csp.directives).toContain("form-action 'self' https://forms.mytko.dev");
  expect(csp.directives.find((directive) => directive.startsWith("connect-src"))).toBe("connect-src 'self' https://forms.mytko.dev");
});

test("frames are allowed only for the providers of the site's embeds", () => {
  const embed = (url: string) => ({ type: "embed", content: { url } });
  const site = { ...local, pages: [{ sections: [embed("https://www.youtube.com/embed/abc123"), embed("https://calendly.com/studio/30min")] }] } as never;

  expect(embedOrigins(site)).toEqual(["https://calendly.com", "https://www.youtube-nocookie.com"]);
  expect(cspForSite(site, "").directives).toContain("frame-src https://calendly.com https://www.youtube-nocookie.com");
});

