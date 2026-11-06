/** Minimal types for the parts of fontkit used by the build scripts. */
declare module "fontkit" {
  export interface Glyph {
    advanceWidth: number;
  }

  export interface Font {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
    glyphForCodePoint(codePoint: number): Glyph;
  }

  export function create(buffer: Buffer | Uint8Array): Font;
}

declare module "svgstore" {
  type Sprite = { add(id: string, svg: string): Sprite; toString(options?: { inline?: boolean }): string };
  export default function svgstore(options?: { inline?: boolean; copyAttrs?: string[] }): Sprite;
}
