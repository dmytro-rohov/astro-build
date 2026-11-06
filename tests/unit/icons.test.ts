import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { ENGINE_ICONS, ICON_NAMES, icons, lucideName } from "../../src/design-system/icons/library";

const LUCIDE = path.resolve("node_modules/lucide-static/icons");

test("every icon of the set exists in lucide-static and has keywords", () => {
  expect(ICON_NAMES.length).toBeGreaterThanOrEqual(100);

  for (const name of ICON_NAMES) {
    expect(fs.existsSync(path.join(LUCIDE, `${lucideName(name)}.svg`)), name).toBe(true);
    expect(icons[name].keywords.split(",").length, name).toBeGreaterThanOrEqual(2);
  }
});

test("the engine's own icons are part of the set", () => {
  for (const name of ENGINE_ICONS) expect(ICON_NAMES).toContain(name);
});
