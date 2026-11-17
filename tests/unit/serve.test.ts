/**
 * serve() (scripts/site/lib.ts): reports running in parallel each get a server of their own on a
 * free port, and a taken port fails the run instead of measuring the server already on it.
 */
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, expect, test } from "vitest";
import { serve, type SiteContext } from "../../scripts/site/lib";
import { takeScreenshots } from "../../scripts/site/screenshot";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "serve-test-"));
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

/** A built static site (no Astro server: server.mjs serves the files) of one page in one colour. */
function site(siteId: string, color: string): SiteContext {
  const out = path.join(root, siteId);
  fs.mkdirSync(path.join(out, "dist"), { recursive: true });
  fs.writeFileSync(
    path.join(out, "dist", "index.html"),
    `<!doctype html><html lang="en"><title>${siteId}</title><style>html { min-height: 100%; background: ${color}; }</style></html>`,
  );
  return { dir: out, out, loaded: { site: { siteId, pages: [{ id: "home", slug: "/", title: siteId }] } } } as unknown as SiteContext;
}

/** Mean red and blue (0–255) of a screenshot. */
async function colorOf(file: string) {
  const { channels } = await sharp(file).stats();
  return { red: channels[0].mean, blue: channels[2].mean };
}

test("two reports in parallel each screenshot their own site", async () => {
  const sites = [site("red-site", "#ff0000"), site("blue-site", "#0000ff")];
  const servers = await Promise.all(sites.map((context) => serve(context)));

  try {
    expect(servers[0].url).not.toBe(servers[1].url);
    const [[red], [blue]] = await Promise.all(sites.map((context, index) => takeScreenshots(context, servers[index].url)));

    const [redShot, blueShot] = await Promise.all([colorOf(red.desktop), colorOf(blue.desktop)]);
    expect(redShot.red).toBeGreaterThan(200);
    expect(redShot.blue).toBeLessThan(50);
    expect(blueShot.blue).toBeGreaterThan(200);
    expect(blueShot.red).toBeLessThan(50);
  } finally {
    for (const server of servers) server.stop();
  }
}, 60_000);

test("a taken port fails instead of serving the other server's site", async () => {
  const other = http.createServer((_request, response) => response.end("another site"));
  await new Promise<void>((resolve) => other.listen(0, "localhost", resolve));
  const { port } = other.address() as AddressInfo;

  try {
    await expect(serve(site("late-site", "#00ff00"), port)).rejects.toThrow(/late-site exited before it listened/);
  } finally {
    other.close();
  }
}, 30_000);

test("an explicit port is used as is", async () => {
  const probe = http.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "localhost", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));

  const server = await serve(site("fixed-site", "#ffffff"), port);
  try {
    expect(server.url).toBe(`http://localhost:${port}`);
    expect(await (await fetch(server.url)).text()).toContain("<title>fixed-site</title>");
  } finally {
    server.stop();
  }
}, 30_000);
