import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { sectionTypes } from "../../src/site/registry";

test("the generated catalog covers every variant with min and max content and validates", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-"));
  // make-catalog validates its own output and exits with 1 when it is invalid.
  execFileSync("npx", ["tsx", "scripts/site/make-catalog.ts", "--out", out], { stdio: "pipe" });

  const site = JSON.parse(fs.readFileSync(path.join(out, "site.json"), "utf8"));
  const ids = new Set(site.pages.flatMap((page: { sections: { id: string }[] }) => page.sections.map((section) => section.id)));

  for (const type of sectionTypes) {
    for (const variant of Object.keys(type.variants)) {
      expect(ids.has(`${type.type}-${variant}-min`), `${type.type}/${variant} min`).toBe(true);
      expect(ids.has(`${type.type}-${variant}-max`), `${type.type}/${variant} max`).toBe(true);
    }
  }
}, 60_000);
