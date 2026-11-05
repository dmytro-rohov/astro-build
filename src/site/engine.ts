/** Engine version and a minimal check of `site.json.engine` ranges. */
import packageJson from "../../package.json" with { type: "json" };

export const ENGINE_VERSION: string = packageJson.version;

type Version = [number, number, number];

function parse(version: string): Version | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function compare(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }

  return 0;
}

/**
 * Supports "^3.0.0" (same major, at least this version), "~3.1.0" (same minor),
 * ">=3.0.0" and an exact "3.0.0".
 */
export function satisfiesEngine(range: string, version = ENGINE_VERSION): boolean {
  const current = parse(version);
  const match = range.trim().match(/^(\^|~|>=)?(\d+\.\d+\.\d+)$/);
  const wanted = match ? parse(match[2]) : null;

  if (!current || !match || !wanted) return false;

  const operator = match[1] ?? "";
  const atLeast = compare(current, wanted) >= 0;

  if (operator === "^") return atLeast && current[0] === wanted[0];
  if (operator === "~") return atLeast && current[0] === wanted[0] && current[1] === wanted[1];
  if (operator === ">=") return atLeast;

  return compare(current, wanted) === 0;
}

export const ENGINE_RANGE_PATTERN = /^(\^|~|>=)?\d+\.\d+\.\d+$/;
