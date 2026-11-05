import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { migrateSite, migrationPath, migrations, schemaVersionProblem, type Migration } from "../../src/site/migrations";
import { SCHEMA_VERSION } from "../../src/site/schema/site";
import { demoSite, writeSite } from "./helpers";

// Synthetic future migrations (listed out of order on purpose): 1 → 2 renames
// meta.name to meta.title, 2 → 3 adds a field.
const synthetic: Migration[] = [
  {
    from: 2,
    to: 3,
    description: "add meta.tagline",
    migrate: (site) => ({ ...site, meta: { ...(site.meta as object), tagline: "" } }),
  },
  {
    from: 1,
    to: 2,
    description: "rename meta.name → meta.title",
    migrate: (site) => {
      const { name, ...meta } = site.meta as Record<string, unknown>;
      return { ...site, meta: { ...meta, title: name } };
    },
  },
];

const v1 = () => ({ schemaVersion: 1, meta: { name: "Studio" } });

describe("migrateSite", () => {
  test("applies the chain in order and sets schemaVersion", () => {
    const { site, applied } = migrateSite(v1(), { target: 3, list: synthetic });

    expect(applied.map((step) => step.description)).toEqual(["rename meta.name → meta.title", "add meta.tagline"]);
    expect(site).toEqual({ schemaVersion: 3, meta: { title: "Studio", tagline: "" } });
  });

  test("stops at the target and never mutates the input", () => {
    const input = v1();
    const { site } = migrateSite(input, { target: 2, list: synthetic });

    expect(site).toEqual({ schemaVersion: 2, meta: { title: "Studio" } });
    expect(input).toEqual(v1());
  });

  test("an up-to-date site is returned unchanged", () => {
    expect(migrateSite(v1(), { target: 1, list: synthetic })).toEqual({ site: v1(), applied: [] });
  });

  test("readable errors: missing step, newer site, no version", () => {
    expect(migrationPath(1, 3, [synthetic[0]])).toBe("no migration from schemaVersion 1 to 2");
    expect(() => migrateSite(v1(), { target: 3, list: [synthetic[0]] })).toThrow("no migration from schemaVersion 1 to 2");
    expect(() => migrateSite({ schemaVersion: 4 }, { target: 3, list: synthetic })).toThrow(/newer than 3/);
    expect(() => migrateSite({}, { target: 3, list: synthetic })).toThrow(/missing/);
  });

  test("the registered migrations reach the current schemaVersion", () => {
    expect(typeof migrationPath(1, SCHEMA_VERSION, migrations)).not.toBe("string");
  });
});

describe("loader and CLI", () => {
  test("older and newer sites get a readable schemaVersion error", () => {
    expect(schemaVersionProblem({ schemaVersion: 1 }, 2)).toMatch(/older than 2\. Run `npm run site:migrate/);
    expect(schemaVersionProblem({ schemaVersion: 3 }, 2)).toMatch(/newer than this engine supports \(2\)/);

    const site = demoSite();
    site.schemaVersion = SCHEMA_VERSION + 1;

    try {
      loadSite(writeSite(site));
      throw new Error("expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(SiteValidationError);
      expect((error as SiteValidationError).issues).toEqual([expect.stringMatching(/^schemaVersion: \d+ is newer/)]);
    }
  });

  test("site:migrate leaves an up-to-date site alone and refuses a newer one", () => {
    const current = writeSite(demoSite());
    const before = fs.readFileSync(path.join(current, "site.json"), "utf8");
    expect(execFileSync("npx", ["tsx", "scripts/site/migrate.ts", "--site", current], { encoding: "utf8" })).toMatch(/already at schemaVersion/);
    expect(fs.readFileSync(path.join(current, "site.json"), "utf8")).toBe(before);

    const newer = writeSite({ ...demoSite(), schemaVersion: SCHEMA_VERSION + 1 });
    expect(() => execFileSync("npx", ["tsx", "scripts/site/migrate.ts", "--site", newer], { stdio: "pipe" })).toThrow();
    expect(fs.readdirSync(newer)).toEqual(["site.json"]);
  }, 60_000);
});
