/**
 * Migrates a site's site.json to the engine's current schemaVersion.
 * Usage: npm run site:migrate -- --site <dir> [--dry-run]
 * The original is kept as site.v<N>.backup.json next to site.json; the result
 * is validated like any build.
 */
import fs from "node:fs";
import path from "node:path";
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { migrateSite, schemaVersionOf, type RawSite } from "../../src/site/migrations";
import { SCHEMA_VERSION } from "../../src/site/schema/site";
import { getFlag } from "./args";

const dir = resolveSiteDir(getFlag("site"));
const file = path.join(dir, "site.json");
if (!fs.existsSync(file)) {
  console.error(`✖ ${dir}\nFile not found: ${file}`);
  process.exit(1);
}

let raw: RawSite;

try {
  raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawSite;
} catch (error) {
  console.error(`✖ ${file}: not valid JSON: ${(error as Error).message}`);
  process.exit(1);
}
const from = schemaVersionOf(raw);

if (from === SCHEMA_VERSION) {
  console.log(`✔ ${file} is already at schemaVersion ${SCHEMA_VERSION}.`);
  process.exit(0);
}

let result;

try {
  result = migrateSite(raw);
} catch (error) {
  console.error(`✖ ${file}: ${(error as Error).message}`);
  process.exit(1);
}

for (const step of result.applied) console.log(`  ${step.from} → ${step.to}: ${step.description}`);

if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify(result.site, null, 2));
  process.exit(0);
}

const backup = path.join(dir, `site.v${from}.backup.json`);
fs.copyFileSync(file, backup);
fs.writeFileSync(file, `${JSON.stringify(result.site, null, 2)}\n`);

try {
  loadSite(dir);
  console.log(`✔ ${file}: schemaVersion ${from} → ${SCHEMA_VERSION} (backup: ${path.basename(backup)}).`);
} catch (error) {
  if (!(error instanceof SiteValidationError)) throw error;
  console.error(`✖ Migrated ${file} does not validate — fix it by hand (original: ${path.basename(backup)}):\n${error.message}`);
  process.exit(1);
}
