/**
 * Checks that two designs for one brief are clearly different (see src/site/compare.ts).
 * Usage: npm run site:compare -- --site <dirA> --site <dirB> [--same-brand-accent] [--json]
 * Exit code 0 when the designs are distinct, 1 otherwise.
 */
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { compareDesigns } from "../../src/site/compare";

const args = process.argv.slice(2);
const dirs = args.flatMap((arg, index) => (arg === "--site" ? [args[index + 1]] : arg.startsWith("--site=") ? [arg.slice(7)] : []));

if (dirs.length !== 2) {
  console.error("Usage: npm run site:compare -- --site <dirA> --site <dirB> [--same-brand-accent] [--json]");
  process.exit(1);
}

let sites;
try {
  sites = dirs.map((dir) => loadSite(resolveSiteDir(dir)).site);
} catch (error) {
  if (!(error instanceof SiteValidationError)) throw error;
  console.error(`✖ ${error.message}`);
  process.exit(1);
}

const result = compareDesigns(sites[0], sites[1], { sameBrandAccent: args.includes("--same-brand-accent") });

if (args.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const item of result.checks) {
    console.log(`${item.differs ? "✔" : item.required ? "✖" : "•"} ${item.name.padEnd(16)} ${item.a}${item.b ? `  vs  ${item.b}` : ""}`);
  }
  for (const problem of result.problems) console.log(`✖ ${problem}`);
  for (const suggestion of result.suggestions) console.log(`• ${suggestion}`);
  console.log(result.distinct ? "✔ The designs are clearly different." : "✖ The designs are too similar.");
}

process.exit(result.distinct ? 0 : 1);
