/** Layout decisions shared by the hero variants (pure functions, unit-tested). */

/**
 * Size step of an oversized headline by its length: short titles (up to ~4 words) get the
 * biggest type, long ones step down so 80 characters still fit about one screen.
 */
export function titleScale(title: string): "short" | "medium" | "long" {
  const length = [...title.trim()].length;
  return length <= 28 ? "short" : length <= 52 ? "medium" : "long";
}

/**
 * The giant word of giant-word: `word`, else the eyebrow; its length (in characters, not
 * UTF-16 units) sets the type size so it always spans the width in one line.
 */
export function giantWord(word?: string, eyebrow?: string): { text: string; chars: number } | undefined {
  const text = (word ?? eyebrow)?.trim().replace(/\s+/g, " ");
  if (!text) return undefined;

  return { text, chars: Math.min([...text].length, 40) };
}
