import type { Page } from "@playwright/test";

/** A keyboard stop whose focus ring does not show (WCAG 2.4.7) or reads too faintly (1.4.11: 3:1). */
export type RingProblem = { element: string; problem: string };

/**
 * v3.12: tabs through the whole page and measures every focus ring against the background it is drawn
 * on: the page, a card, a brand-colored panel (where a ring in the accent color would vanish). A ring
 * drawn by a parent (a card around its link, :has()) counts for the link. Stops over a photo or a
 * gradient are skipped (no single background color to measure).
 */
export async function focusRingProblems(page: Page, maxStops = 400): Promise<RingProblem[]> {
  const problems: RingProblem[] = [];
  let first: string | undefined;

  for (let stop = 0; stop < maxStops; stop++) {
    await page.keyboard.press("Tab");
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      // The ring as it ends up, not the first frame of a color transition.
      for (const animation of document.getAnimations()) {
        try {
          animation.finish();
        } catch {
          // An endless animation cannot finish: it does not draw the ring either.
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      // Any CSS color (oklch, color-mix…) as sRGB with alpha, through the canvas.
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      };
      type Rgba = ReturnType<typeof rgba>;
      const over = (top: Rgba, bottom: Rgba): Rgba => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
      const luminance = ({ r, g, b }: Rgba) =>
        [r, g, b].map((value) => (value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4)).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const ratio = (a: Rgba, b: Rgba) => {
        const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (light + 0.05) / (dark + 0.05);
      };
      const css = ({ r, g, b }: Rgba) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

      const name = `${element.tagName.toLowerCase()}${[...element.classList].slice(0, 2).map((value) => `.${value}`).join("")}`;
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return { name, key: element.outerHTML.slice(0, 160), problem: null };

      // The element's own ring, else one its card draws around it.
      const hasRing = (node: HTMLElement) => getComputedStyle(node).outlineStyle !== "none" && parseFloat(getComputedStyle(node).outlineWidth) > 0;
      let ringed: HTMLElement | null = element;
      for (let depth = 0; ringed && depth < 3 && !hasRing(ringed); depth++) ringed = ringed.parentElement;
      if (!ringed || !hasRing(ringed)) return { name, key: element.outerHTML.slice(0, 160), problem: "no focus ring" };

      const style = getComputedStyle(ringed);
      const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
      // What the ring is drawn on: the element itself for a ring inside it, else the nearest box around the ring
      // (a link that fills its tile draws its ring outside the tile, on the page).
      const rect = ringed.getBoundingClientRect();
      const around = (node: HTMLElement) => {
        const box = node.getBoundingClientRect();
        return box.left <= rect.left - reach + 0.5 && box.top <= rect.top - reach + 0.5 && box.right >= rect.right + reach - 0.5 && box.bottom >= rect.bottom + reach - 0.5;
      };
      let start: HTMLElement | null = reach <= 0 ? ringed : ringed.parentElement;
      while (start && start.parentElement && !around(start)) start = start.parentElement;
      const layers: Rgba[] = [];
      for (let node: HTMLElement | null = start; node; node = node.parentElement) {
        const own = getComputedStyle(node);
        if (own.backgroundImage !== "none") return { name, key: element.outerHTML.slice(0, 160), problem: null };
        const color = rgba(own.backgroundColor);
        if (color.a > 0) layers.push(color);
        if (color.a >= 1) break;
      }
      const background = layers.reverse().reduce((under, layer) => over(layer, under), { r: 255, g: 255, b: 255, a: 1 });
      const ring = over(rgba(style.outlineColor), background);
      const value = ratio(ring, background);
      return { name, key: element.outerHTML.slice(0, 160), problem: value < 3 ? `ring ${css(ring)} has ${value.toFixed(2)}:1 on ${css(background)}` : null };
    });

    if (!result) continue;
    // Back at the first stop: the whole page has been tabbed through.
    if (first === undefined) first = result.key;
    else if (result.key === first) break;
    if (result.problem) problems.push({ element: result.name, problem: result.problem });
  }

  return problems;
}
