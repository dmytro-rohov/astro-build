import fs from "fs"
import path from "path"
import { tokens } from "../tokens/index.js"

type TokenObject = Record<string, string | TokenObject>

function toKebab(str: string) {
  return str.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
}

function flatten(
  obj: TokenObject,
  prefix = ""
): Record<string, string> {

  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {

    const kebabKey = toKebab(key)

    const newKey = prefix
      ? `${prefix}-${kebabKey}`
      : kebabKey

    if (typeof value === "object" && value !== null) {
      Object.assign(result, flatten(value, newKey))
    } else {
      result[newKey] = value
    }
  }

  return result
}

const flatTokens = flatten(tokens)

const outputDir = path.resolve("src/styles/abstracts")

fs.mkdirSync(outputDir, { recursive: true })

/* ---------------------------------- */
/* CSS VARIABLES */
/* ---------------------------------- */

const cssLines = Object.entries(flatTokens).map(
  ([key, value]) => `  --${key}: ${value};`
)

const css = `:root {\n${cssLines.join("\n")}\n}\n`

/* ---------------------------------- */
/* SCSS MAP */
/* ---------------------------------- */

const scssLines = Object.entries(flatTokens).map(
  ([key], i, arr) => {

    const comma = i === arr.length - 1 ? "" : ","

    return `  "${key}": var(${key})${comma}`
  }
)

const scssMap = `$tokens: (\n${scssLines.join("\n")}\n);\n`

/* ---------------------------------- */
/* TS TYPE */
/* ---------------------------------- */

const typeLines = Object.keys(flatTokens)
  .map(token => `  | "${token}"`)
  .join("\n")

const tsTypes = `export type ColorToken =
${typeLines}
`

/* ---------------------------------- */
/* WRITE FILES */
/* ---------------------------------- */

fs.writeFileSync(
  path.join(outputDir, "_tokens.scss"),
  css + "\n" + scssMap
)

fs.writeFileSync(
  path.resolve("src/design-system/cssVars.ts"),
  tsTypes
)

console.log("✅ Tokens generated")