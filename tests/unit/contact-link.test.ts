import { describe, expect, test } from "vitest";
import { contactLink } from "../../src/site/contact-link";
import type { Site } from "../../src/site/schema/site";

// v3.12: the "failed" page and a remote form's return path lead to the form, never to a /contact that is not there.
const page = (slug: string, sections: { id: string; type: string }[]) => ({ slug, sections });
const site = (...pages: ReturnType<typeof page>[]) => ({ pages }) as unknown as Pick<Site, "pages">;

describe("where the contact form is", () => {
  test("the first page with a contact section, at that section", () => {
    expect(contactLink(site(page("/", [{ id: "start", type: "hero" }, { id: "kontakt", type: "contact" }])))).toBe("/#kontakt");
    expect(contactLink(site(page("/", [{ id: "start", type: "hero" }]), page("/kontakt", [{ id: "form", type: "contact" }])))).toBe("/kontakt#form");
  });

  test("on a given page: its own contact section, else the site's; no contact section at all: the home page", () => {
    const multi = site(page("/", [{ id: "kontakt", type: "contact" }]), page("/oferta", [{ id: "napisz", type: "contact" }]), page("/cennik", [{ id: "ceny", type: "pricing" }]));
    expect(contactLink(multi, "/oferta/")).toBe("/oferta#napisz");
    expect(contactLink(multi, "/cennik/")).toBe("/#kontakt");
    expect(contactLink(site(page("/", [{ id: "start", type: "hero" }])))).toBe("/");
  });
});
