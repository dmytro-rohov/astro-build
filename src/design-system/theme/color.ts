/**
 * Color math for themes: hex ↔ OKLCH and WCAG contrast.
 * OKLCH keeps hue and chroma stable while lightness changes, so an accent can be
 * darkened or lightened for contrast without looking like a different color.
 */

export type Oklch = { l: number; c: number; h: number };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(clamp(channel) * 255).toString(16).padStart(2, "0")).join("")}`;
}

const toLinear = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
const fromLinear = (value: number) => (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055);

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return { l: L, c: Math.sqrt(A * A + B * B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((channel) => channel >= -0.0005 && channel <= 1.0005);

/** OKLCH → hex; reduces chroma until the color fits in sRGB. */
export function oklchToHex(color: Oklch): string {
  let { c } = color;
  let rgb = oklchToLinearRgb({ ...color, c });

  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.005);
    rgb = oklchToLinearRgb({ ...color, c });
  }

  return rgbToHex(rgb.map((channel) => fromLinear(clamp(channel))) as [number, number, number]);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio (1–21). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Mixes two colors in OKLCH (amount 0 → a, 1 → b). */
export function mix(a: string, b: string, amount: number): string {
  const x = hexToOklch(a);
  const y = hexToOklch(b);
  const hueDelta = ((((y.h - x.h) % 360) + 540) % 360) - 180;

  return oklchToHex({
    l: x.l + (y.l - x.l) * amount,
    c: x.c + (y.c - x.c) * amount,
    h: (x.h + hueDelta * amount + 360) % 360,
  });
}

/** Same hue and chroma with a different OKLCH lightness. */
export function withLightness(hex: string, lightness: number): string {
  return oklchToHex({ ...hexToOklch(hex), l: clamp(lightness) });
}

/**
 * Darkens (direction -1) or lightens (+1) `hex` in small OKLCH steps until it
 * reaches `min` contrast against every color in `against`.
 */
export function adjustForContrast(hex: string, against: string[], min: number, direction: -1 | 1): string {
  const start = hexToOklch(hex);
  let color = hex;

  for (let l = start.l; l >= 0 && l <= 1; l += direction * 0.01) {
    color = oklchToHex({ ...start, l });
    if (against.every((other) => contrast(color, other) >= min)) return color;
  }

  return direction < 0 ? "#000000" : "#ffffff";
}

/** Text color (from the candidates) with the highest contrast on `background`. */
export function bestText(background: string, candidates: string[]): string {
  return candidates.reduce((best, candidate) => (contrast(candidate, background) > contrast(best, background) ? candidate : best));
}
