/**
 * Validates a site directory without building it.
 * Usage: npm run site:validate -- --site sites/_demo
 * Exit code 0 when valid, 1 with one readable line per problem otherwise.
 */
import { loadSite, resolveSiteDir, SiteValidationError } from "../../src/site/loader";
import { getFlag } from "./args";

const dir = resolveSiteDir(getFlag("site"));

try {
  const { site } = loadSite(dir);
  console.log(`✔ ${site.siteId} (${dir}) is valid: ${site.pages.length} page(s), language "${site.lang}".`);
} catch (error) {
  if (error instanceof SiteValidationError) {
    console.error(`✖ ${dir}\n${error.message}`);
    process.exit(1);
  }

  throw error;
}
