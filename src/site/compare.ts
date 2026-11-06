/**
 * Compares two designs made for one brief. The orchestrator presents two
 * proposals; they must look clearly different at first glance:
 * - required: different archetype, accent from a different color family
 *   (unless the brief fixes a brand color), different hero variant;
 * - recommended: different font pair, navbar and footer variants, and at least
 *   half of the shared section types in different variants.
 */
import { resolveTheme } from "../design-system/theme";
import { accentFamily } from "../design-system/theme/families";
import type { Site } from "./schema/site";

export type CompareCheck = { name: string; a: string; b: string; differs: boolean; required: boolean };
export type CompareResult = { distinct: boolean; checks: CompareCheck[]; problems: string[]; suggestions: string[] };

export function compareDesigns(a: Site, b: Site, { sameBrandAccent = false } = {}): CompareResult {
  const themeA = resolveTheme(a.theme);
  const themeB = resolveTheme(b.theme);
  const hero = (site: Site) => site.pages[0].sections.find((section) => section.type === "hero")?.variant ?? site.pages[0].sections[0].type;
  const variants = (site: Site) => new Map(site.pages.flatMap((page) => page.sections).map((section) => [section.type, section.variant]));

  const check = (name: string, valueA: string, valueB: string, required: boolean): CompareCheck => ({ name, a: valueA, b: valueB, differs: valueA !== valueB, required });

  const variantsA = variants(a);
  const variantsB = variants(b);
  const shared = [...variantsA.keys()].filter((type) => variantsB.has(type));
  const differentVariants = shared.filter((type) => variantsA.get(type) !== variantsB.get(type));

  const checks = [
    check("archetype", themeA.archetypeId, themeB.archetypeId, true),
    check("accentFamily", accentFamily(themeA.accent), accentFamily(themeB.accent), !sameBrandAccent),
    check("heroVariant", hero(a), hero(b), true),
    check("fontPair", themeA.fontPair, themeB.fontPair, sameBrandAccent),
    check("navbar", a.layout.navbar.variant, b.layout.navbar.variant, false),
    check("footer", a.layout.footer.variant, b.layout.footer.variant, false),
    {
      name: "sectionVariants",
      a: `${differentVariants.length}/${shared.length} different`,
      b: "",
      differs: shared.length === 0 || differentVariants.length * 2 >= shared.length,
      required: false,
    },
  ];

  const problems = checks.filter((item) => item.required && !item.differs).map((item) => `${item.name}: both designs use "${item.a}".`);
  const suggestions = checks.filter((item) => !item.required && !item.differs).map((item) => (item.name === "sectionVariants" ? `sectionVariants: only ${item.a} — vary more sections.` : `${item.name}: both use "${item.a}".`));

  if (!checks[1].differs && !sameBrandAccent) {
    const used = accentFamily(themeA.accent);
    const options = themeB.archetype.recommendedAccents.filter((hex) => accentFamily(hex) !== used);
    const index = problems.findIndex((problem) => problem.startsWith("accentFamily"));
    problems[index] = `accentFamily: both accents are "${used}" — pick one for design B from another family, e.g. ${options.join(", ")} (recommended for "${themeB.archetypeId}").`;
  }

  return { distinct: problems.length === 0, checks, problems, suggestions };
}
