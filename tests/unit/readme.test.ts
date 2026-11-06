import fs from "node:fs";
import { expect, test } from "vitest";
import { ICON_NAMES } from "../../src/design-system/icons/library";
import { sectionTypes } from "../../src/site/registry";

const readme = fs.readFileSync("README.md", "utf8");

test("README counts and the section table match the registry", () => {
  const variants = sectionTypes.reduce((sum, type) => sum + Object.keys(type.variants).length, 0);
  expect(readme).toContain(`**${sectionTypes.length} section types, ${variants} variants**`);
  expect(readme).toContain(`${ICON_NAMES.length} Lucide icons`);

  for (const type of sectionTypes) {
    const row = readme.split("\n").find((line) => line.startsWith(`| \`${type.type}\` |`));
    expect(row, `README row for ${type.type}`).toBeDefined();
    for (const variant of Object.keys(type.variants)) expect(row, `${type.type}/${variant}`).toContain(`\`${variant}\``);
  }
});
