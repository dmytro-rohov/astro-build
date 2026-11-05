import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Deep copy of the demo site.json, ready to be broken by a test. */
export function demoSite(): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.resolve("sites/_demo/site.json"), "utf8"));
}

/** Writes a temporary site directory (site.json + optional assets) and returns its path. */
export function writeSite(site: unknown, assets?: Record<string, { file: string; alt: string }>, files: string[] = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  fs.writeFileSync(path.join(dir, "site.json"), typeof site === "string" ? site : JSON.stringify(site));

  if (assets) {
    fs.mkdirSync(path.join(dir, "assets"));
    fs.writeFileSync(path.join(dir, "assets", "assets.json"), JSON.stringify(assets));
    for (const file of files) fs.writeFileSync(path.join(dir, "assets", file), "x");
  }

  return dir;
}
