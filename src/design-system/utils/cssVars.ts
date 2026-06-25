import fs from "fs";
import path from "path";
import { tokens } from "../tokens/index";

type TokenValue = string | number;
type TokenObject = Record<string, TokenValue | TokenObject>;

function toKebab(str: string) {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function flatten(
  obj: TokenObject,
  prefix = ""
): Record<string, TokenValue> {
  const result: Record<string, TokenValue> = {};

  for (const [key, value] of Object.entries(obj)) {
    const kebabKey = toKebab(key);

    const newKey = prefix
      ? `${prefix}-${kebabKey}`
      : kebabKey;

    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flatten(value as TokenObject, newKey));
    } else {
      result[newKey] = value as TokenValue;
    }
  }

  return result;
}

const flatTokens = flatten(tokens as TokenObject);

const outputDir = path.resolve("src/styles/abstracts");
const cssVarsOutput = path.join(outputDir, "_tokens.scss");
const tsTypesOutput = path.resolve("src/design-system/cssVars.ts");

fs.mkdirSync(outputDir, { recursive: true });

const cssLines = Object.entries(flatTokens).map(
  ([key, value]) => `  --${key}: ${value};`
);

const css = `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: src/design-system/utils/cssVars.ts */

:root {
${cssLines.join("\n")}
}
`;

const scssLines = Object.keys(flatTokens).map((key, index, arr) => {
  const comma = index === arr.length - 1 ? "" : ",";
  return `  "${key}": var(--${key})${comma}`;
});

const scssMap = `$tokens: (
${scssLines.join("\n")}
);
`;

const typeLines = Object.keys(flatTokens)
  .map((token) => `  | "${token}"`)
  .join("\n");

const tsTypes = `/* AUTO-GENERATED FILE – DO NOT EDIT */
/* Source: src/design-system/utils/cssVars.ts */

export type CssToken =
${typeLines};

export type CssVar = \`var(--\${CssToken})\`;
`;

fs.writeFileSync(cssVarsOutput, `${css}\n${scssMap}`);
fs.writeFileSync(tsTypesOutput, tsTypes);

console.log("✅ Tokens generated");
console.log(`Generated SCSS: ${cssVarsOutput}`);
console.log(`Generated TS types: ${tsTypesOutput}`);