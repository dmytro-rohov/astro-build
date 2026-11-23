/**
 * v3.6: the editor preview bridge (src/components/EditorBridge.astro).
 * With PREVIEW_EDITOR_ORIGIN (npm run test:bridge, http://localhost:<port>) the demo site is loaded
 * in an iframe of a tiny editor page served on that origin, next to a frame of another origin whose
 * messages must be ignored. Without it (the normal e2e run) the build must have no bridge at all.
 */
import http from "node:http";
import type { Frame, Page } from "@playwright/test";
import { test, expect } from "./fixtures";

const editorOrigin = process.env.PREVIEW_EDITOR_ORIGIN ?? "";
// The editor page server under another host name: another origin.
const intruderUrl = editorOrigin ? Object.assign(new URL("/intruder", editorOrigin), { hostname: "127.0.0.1" }).href : "";

type Received = { origin: string; data: { type?: string; [key: string]: unknown } };
type Section = { id: string; type: string; variant: string; title: string | null };

declare global {
  interface Window {
    received: Received[];
  }
}

const editorPage = (siteUrl: string) => `<!doctype html>
<html lang="en">
<title>Editor</title>
<link rel="icon" href="data:,">
<script>
  window.received = [];
  addEventListener("message", (event) => received.push({ origin: event.origin, data: event.data }));
</script>
<iframe id="preview" title="Preview" src="${siteUrl}" width="1200" height="600"></iframe>
<iframe id="intruder" title="Intruder" src="${intruderUrl}" width="100" height="100"></iframe>
</html>`;

const intruderPage = `<!doctype html><html lang="en"><title>Intruder</title><link rel="icon" href="data:,"></html>`;

/** Messages of one type the editor page has received. */
const received = (page: Page, type: string) => page.evaluate((type) => window.received.filter((message) => message.data?.type === type), type);

/** Posts a message from the editor page to the preview. */
const send = (page: Page, message: object, siteOrigin: string) =>
  page.evaluate(([message, siteOrigin]) => document.querySelector<HTMLIFrameElement>("#preview")?.contentWindow?.postMessage(message, siteOrigin), [message, siteOrigin] as const);

const sectionIds = (frame: Frame) => frame.locator("main > [data-section-type]").evaluateAll((sections) => sections.map((section) => section.id));

test.describe("editor bridge", () => {
  test.skip(!editorOrigin, "set PREVIEW_EDITOR_ORIGIN (npm run test:bridge)");
  // One editor page server on the editor's port: the tests run one after another, on desktop.
  test.skip(({ isMobile }) => isMobile, "desktop only");
  test.describe.configure({ mode: "default" });

  let editor: http.Server;
  let siteOrigin = "";
  let preview: Frame;
  let sections: Section[] = [];

  // A real local server: Chrome does not let a page Playwright fulfils frame a localhost site.
  test.beforeAll(async ({ baseURL }) => {
    siteOrigin = new URL(baseURL!).origin;
    editor = http.createServer((request, response) => {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(request.url === "/intruder" ? intruderPage : editorPage(`${siteOrigin}/`));
    });
    await new Promise<void>((resolve) => editor.listen(Number(new URL(editorOrigin).port), "127.0.0.1", resolve));
  });

  test.afterAll(() => {
    editor.closeAllConnections();
    editor.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${editorOrigin}/`);

    await expect.poll(() => received(page, "factory:ready")).toHaveLength(1);
    const [ready] = await received(page, "factory:ready");
    expect(ready.origin).toBe(siteOrigin);
    sections = ready.data.sections as Section[];
    preview = page.frame({ url: `${siteOrigin}/` })!;
  });

  test("ready: the page and its sections in DOM order", async () => {
    const expected = await preview.locator("main > [data-section-type]").evaluateAll((elements) =>
      elements.map((element) => ({ id: element.id, type: element.dataset.sectionType, variant: element.dataset.sectionVariant })),
    );

    expect(expected.length).toBeGreaterThan(2);
    expect(sections.map(({ id, type, variant }) => ({ id, type, variant }))).toEqual(expected);
    expect(sections[0].title).toBe((await preview.locator("h1").textContent())?.replace(/\s+/g, " ").trim());
  });

  test("layout: reorders and hides sections without a reload, the first one stays first", async ({ page }) => {
    const [first, second, third, ...others] = sections.map((section) => section.id);
    const last = others.at(-1)!;

    await send(page, { type: "factory:layout", order: [last, first, second], hidden: [second] }, siteOrigin);
    await expect.poll(() => received(page, "factory:layout-applied")).toHaveLength(1);

    expect(await sectionIds(preview)).toEqual([first, last, second, third, ...others.slice(0, -1)]);
    await expect(preview.locator(`#${second}`)).toBeHidden();
    await expect(preview.locator(`#${third}`)).toBeVisible();

    await send(page, { type: "factory:layout", order: [], hidden: [] }, siteOrigin);
    await expect.poll(() => received(page, "factory:layout-applied")).toHaveLength(2);
    await expect(preview.locator(`#${second}`)).toBeVisible();
    expect(await received(page, "factory:ready"), "no reload").toHaveLength(1);
  });

  test("focus: scrolls to the section and outlines it until cleared", async ({ page }) => {
    const target = preview.locator(`#${sections.at(-1)!.id}`);

    await send(page, { type: "factory:focus", id: sections.at(-1)!.id }, siteOrigin);
    await expect(target).toHaveClass(/\bis-editor-focus\b/);
    await expect(target).toBeInViewport();
    expect(await preview.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await send(page, { type: "factory:focus", id: sections[1].id }, siteOrigin);
    await expect(preview.locator(`#${sections[1].id}`)).toHaveClass(/\bis-editor-focus\b/);
    await expect(target).not.toHaveClass(/\bis-editor-focus\b/);

    await send(page, { type: "factory:focus", id: null }, siteOrigin);
    await expect(preview.locator(".is-editor-focus")).toHaveCount(0);
  });

  test("select: a click selects its section, links do not navigate", async ({ page, baseURL }) => {
    // The cookie banner (a button outside the sections) works as usual and selects nothing.
    await preview.locator("[data-consent-reject]").click();
    await expect(preview.locator("[data-cookie-consent]")).toBeHidden();
    // A link to another page in the header: no navigation, nothing selected (not a section).
    await preview.locator('header a[href="/contact"]:visible').first().click();
    // A link to another page inside a section (not a button, v3.11): no navigation, the section is selected.
    const link = preview.locator('main > [data-section-type] a[href^="/blog/"]:not(.button)').first();
    const linkSection = await link.evaluate((element) => element.closest("[data-section-type]")!.id);
    await link.click();
    // Plain text inside a section.
    await preview.locator(`#${sections[1].id} h2`).first().click();

    await expect.poll(async () => (await received(page, "factory:select")).map((message) => message.data)).toEqual([
      { type: "factory:select", id: linkSection },
      { type: "factory:select", id: sections[1].id },
    ]);
    expect(preview.url()).toBe(`${baseURL}/`);
    expect(await received(page, "factory:ready"), "no navigation").toHaveLength(1);

    // A link within the page works as usual (the header's: it scrolls, selects nothing).
    await preview.locator('header a[href^="/#"]:visible').first().click();
    await expect.poll(() => preview.url()).toMatch(/\/#.+$/);
    expect(await received(page, "factory:select")).toHaveLength(2);
  });

  test("buttons (v3.11): a click reports the kind and does nothing else, a kind is highlighted, a style shows live", async ({ page, baseURL }) => {
    await preview.locator("[data-consent-reject]").click();
    expect(await received(page, "factory:ready").then(([ready]) => ready.data.features)).toEqual(["buttons"]);
    const cta = preview.locator('main > [data-section-type] a.button--primary[href="/contact"]').first();
    const ctaSection = await cta.evaluate((element) => element.closest("[data-section-type]")!.id);
    await cta.click();
    await preview.locator("main a.button--ghost").first().click();

    await expect.poll(async () => (await received(page, "factory:button")).map((message) => message.data)).toEqual([
      { type: "factory:button", kind: "primary", section: ctaSection },
      { type: "factory:button", kind: "ghost", section: expect.any(String) },
    ]);
    expect(await received(page, "factory:select"), "a button selects no section").toHaveLength(0);
    expect(preview.url(), "a button does not navigate").toBe(`${baseURL}/`);
    await expect(preview.locator("html")).toHaveAttribute("data-editor-buttons", "ghost");

    await send(page, { type: "factory:focus-buttons", kind: "secondary" }, siteOrigin);
    await expect(preview.locator("html")).toHaveAttribute("data-editor-buttons", "secondary");
    await send(page, { type: "factory:focus-buttons", kind: null }, siteOrigin);
    await expect(preview.locator("html")).not.toHaveAttribute("data-editor-buttons");

    // The colors a button shows (custom properties, not the transition of its background).
    const shown = () => cta.evaluate((element) => getComputedStyle(element).getPropertyValue("--button-current-bg").trim());
    await send(page, { type: "factory:button-style", styles: { primary: { background: "#123456", radius: "pill" } } }, siteOrigin);
    await expect.poll(async () => (await received(page, "factory:button-style-applied")).length).toBe(1);
    await expect.poll(shown).toBe("#123456");
    // Text that would be CSS never reaches the page.
    await send(page, { type: "factory:button-style", styles: { primary: { background: "red;} body { display: none" } } }, siteOrigin);
    await expect.poll(async () => (await received(page, "factory:button-style-applied")).length).toBe(2);
    expect(await preview.locator("body").evaluate((body) => getComputedStyle(body).display)).not.toBe("none");
    // null: back to the built style.
    await send(page, { type: "factory:button-style", styles: null }, siteOrigin);
    await expect.poll(async () => (await received(page, "factory:button-style-applied")).length).toBe(3);
    await expect.poll(shown).not.toBe("#123456");
  });

  test("messages from another origin are ignored", async ({ page }) => {
    const ids = sections.map((section) => section.id);
    const intruder = page.frame({ url: intruderUrl })!;

    // A sibling frame of another origin talks to the preview; "*" so the browser delivers it.
    await intruder.evaluate((ids) => {
      parent.frames[0].postMessage({ type: "factory:layout", order: [...ids].reverse(), hidden: ids }, "*");
      parent.frames[0].postMessage({ type: "factory:focus", id: ids[1] }, "*");
    }, ids);
    // Then the editor: its message is handled after the intruder's.
    await send(page, { type: "factory:layout", order: ids, hidden: [] }, siteOrigin);

    await expect.poll(() => received(page, "factory:layout-applied")).toHaveLength(1);
    expect(await sectionIds(preview)).toEqual(ids);
    await expect(preview.locator("main > [data-section-type][hidden]")).toHaveCount(0);
    await expect(preview.locator(".is-editor-focus")).toHaveCount(0);
  });

  test("only the editor may frame the preview", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toBe(`frame-ancestors ${editorOrigin}`);
    expect(headers["x-frame-options"]).toBeUndefined();
  });
});

test.describe("without an editor origin", () => {
  test.skip(Boolean(editorOrigin), "a preview build for the editor");

  test("the build has no bridge code", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator("[data-editor-origin]")).toHaveCount(0);

    const files = await page.locator('script[src], link[rel="stylesheet"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("src") ?? element.getAttribute("href")!),
    );
    const sources = [await page.content(), ...(await Promise.all(files.map(async (file) => (await request.get(file)).text())))];

    for (const source of sources) {
      expect(source).not.toMatch(/factory:ready|is-editor-focus/);
    }
  });
});
