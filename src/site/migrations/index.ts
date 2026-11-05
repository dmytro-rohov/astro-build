/**
 * site.json schema migrations. SCHEMA_VERSION is the format the engine reads;
 * every breaking change to the schema bumps it and adds a migration from the
 * previous version, so old sites keep working after `npm run site:migrate`.
 *
 * Adding a migration (e.g. 1 → 2):
 *   1. bump SCHEMA_VERSION in src/site/schema/site.ts,
 *   2. create src/site/migrations/v1-to-v2.ts exporting a Migration,
 *   3. add it to `migrations` below (ordered by `from`),
 *   4. run `npm run site:migrate -- --site <dir>` on sites/_demo and sites/_fixtures/*.
 * A migration is a pure function on the raw JSON — it must not read files.
 */
import { SCHEMA_VERSION } from "../schema/site";

export type RawSite = Record<string, unknown>;

export type Migration = {
  from: number;
  to: number;
  description: string;
  migrate: (site: RawSite) => RawSite;
};

/** Version 1 is the first v3 format — no migrations yet. */
export const migrations: Migration[] = [];

export function schemaVersionOf(raw: unknown): number | undefined {
  const version = raw && typeof raw === "object" ? (raw as RawSite).schemaVersion : undefined;
  return Number.isInteger(version) ? (version as number) : undefined;
}

/** Migrations from `from` to `target` in order, or a readable reason why there is no path. */
export function migrationPath(from: number, target = SCHEMA_VERSION, list = migrations): Migration[] | string {
  const steps: Migration[] = [];

  for (let version = from; version < target; ) {
    const step = list.find((migration) => migration.from === version);
    if (!step) return `no migration from schemaVersion ${version} to ${version + 1}`;
    steps.push(step);
    version = step.to;
  }

  return steps;
}

/**
 * Readable problem with the site's schemaVersion for this engine, or undefined
 * when the site can be validated as is.
 */
export function schemaVersionProblem(raw: unknown, current = SCHEMA_VERSION): string | undefined {
  const version = schemaVersionOf(raw);

  if (version === undefined) return `schemaVersion: missing or not an integer — this engine reads schemaVersion ${current}.`;
  if (version > current) {
    return `schemaVersion: ${version} is newer than this engine supports (${current}). Update the starter to a version that reads schemaVersion ${version}.`;
  }
  if (version < current) {
    return `schemaVersion: ${version} is older than ${current}. Run \`npm run site:migrate -- --site <dir>\` (a backup of site.json is kept).`;
  }

  return undefined;
}

/** Applies every migration from the site's version to `target`. Never mutates the input. */
export function migrateSite(raw: RawSite, { target = SCHEMA_VERSION, list = migrations } = {}): { site: RawSite; applied: Migration[] } {
  const from = schemaVersionOf(raw);
  if (from === undefined) throw new Error("schemaVersion: missing or not an integer.");
  if (from > target) throw new Error(`schemaVersion ${from} is newer than ${target} — downgrades are not supported.`);

  const steps = migrationPath(from, target, list);
  if (typeof steps === "string") throw new Error(steps);

  let site = structuredClone(raw);

  for (const step of steps) {
    site = { ...step.migrate(site), schemaVersion: step.to };
  }

  return { site, applied: steps };
}
