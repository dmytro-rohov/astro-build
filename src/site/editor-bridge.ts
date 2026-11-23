/**
 * v3.6: editor preview bridge — the factory editor shows a preview build of the site in an iframe
 * and drives it with window.postMessage (src/components/EditorBridge.astro, README "Editor preview
 * bridge"). It imports only pure modules: it is bundled into the bridge script.
 * v3.11: the site's button styles (theme.buttons) in the editor: a click on a button reports its
 * kind, the editor highlights a kind and shows a style live, before it is saved and built.
 */
import {
  BUTTON_HOVER_EFFECTS, BUTTON_KINDS, BUTTON_RADII, BUTTON_RANGES, BUTTON_SHADOWS, BUTTON_WEIGHTS, TRANSPARENT,
  type ButtonColors, type ButtonKind, type ButtonStyle, type ButtonStyles,
} from "../design-system/theme/buttons";

/** A section of the current page as the editor panel lists it. */
export type BridgeSection = { id: string; type: string; variant: string; title: string | null };

/** Messages from the editor; anything else is ignored. */
export type EditorMessage =
  | { type: "factory:layout"; order: string[]; hidden: string[] }
  | { type: "factory:focus"; id: string | null }
  /** v3.11: a button style shown live (null: back to the built one). */
  | { type: "factory:button-style"; styles: ButtonStyles | null }
  /** v3.11: the buttons of a kind highlighted (null: none). */
  | { type: "factory:focus-buttons"; kind: ButtonKind | null };

/** Origin of PREVIEW_EDITOR_ORIGIN ("" when not set); throws for anything but an http(s) URL. */
export function previewEditorOrigin(value: string | undefined): string {
  if (!value) return "";

  const url = URL.canParse(value) ? new URL(value) : undefined;
  if (!url || !["http:", "https:"].includes(url.protocol)) {
    throw new Error(`PREVIEW_EDITOR_ORIGIN must be an http(s) origin, e.g. https://factory.mytko.dev (got "${value}").`);
  }

  return url.origin;
}

/**
 * Section ids in the editor's order: the listed ones first, the rest after them in their
 * current order; unknown ids are ignored. The first section stays first — it has the
 * page's only <h1>.
 */
export function sectionOrder(current: string[], order: string[]): string[] {
  const [first, ...rest] = current;
  if (first === undefined) return [];

  const listed = [...new Set(order)].filter((id) => rest.includes(id));
  return [first, ...listed, ...rest.filter((id) => !listed.includes(id))];
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);

const HEX = /^#[0-9a-fA-F]{6}$/;
const isKind = (value: unknown): value is ButtonKind => BUTTON_KINDS.includes(value as ButtonKind);
/** A number within the range, on its step (the schema's rule): the preview shows only what can be saved. */
const inRange = (value: unknown, range: { min: number; max: number; step: number }) =>
  typeof value === "number" && Number.isFinite(value) && value >= range.min && value <= range.max
    ? Number((Math.round(value / range.step) * range.step).toFixed(4))
    : undefined;
const oneOf = <T>(value: unknown, options: readonly T[]) => (options.includes(value as T) ? (value as T) : undefined);
const colorOf = (value: unknown, transparent: boolean) =>
  typeof value === "string" && (HEX.test(value) || (transparent && value === TRANSPARENT)) ? value.toLowerCase() : undefined;

function colors(value: unknown): ButtonColors {
  const input = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  return { text: colorOf(input.text, false), background: colorOf(input.background, true), border: colorOf(input.border, true) };
}

const defined = <T extends object>(value: T) => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;

/**
 * A button style from the editor, checked value by value like theme.buttons (anything else is
 * dropped): it only ever becomes custom properties built by buttonVars, never text put into CSS.
 */
export function parseButtonStyles(value: unknown): ButtonStyles | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const styles: ButtonStyles = {};

  for (const [kind, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!isKind(kind) || typeof raw !== "object" || raw === null) continue;
    const input = raw as Record<string, unknown>;
    const hover = defined(colors(input.hover));
    const style: ButtonStyle = defined({
      ...colors(input),
      hover: Object.keys(hover).length ? hover : undefined,
      paddingX: inRange(input.paddingX, BUTTON_RANGES.paddingX),
      paddingY: inRange(input.paddingY, BUTTON_RANGES.paddingY),
      borderWidth: inRange(input.borderWidth, BUTTON_RANGES.borderWidth),
      radius: oneOf(input.radius, BUTTON_RADII),
      weight: oneOf(input.weight, BUTTON_WEIGHTS),
      uppercase: typeof input.uppercase === "boolean" ? input.uppercase : undefined,
      letterSpacing: inRange(input.letterSpacing, BUTTON_RANGES.letterSpacing),
      shadow: oneOf(input.shadow, BUTTON_SHADOWS),
      hoverEffect: oneOf(input.hoverEffect, BUTTON_HOVER_EFFECTS),
    });
    styles[kind] = style;
  }

  return styles;
}

/** The kind of a button (its class button--<kind>), or undefined for anything that is not one a site styles. */
export function buttonKindOf(element: Element | null | undefined): ButtonKind | undefined {
  const button = element?.closest(".button");
  return BUTTON_KINDS.find((kind) => button?.classList.contains(`button--${kind}`));
}

/** A message from the editor, or undefined when it is not one the bridge knows. */
export function parseEditorMessage(data: unknown): EditorMessage | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const message = data as Record<string, unknown>;

  if (message.type === "factory:layout") {
    return { type: "factory:layout", order: strings(message.order), hidden: strings(message.hidden) };
  }

  if (message.type === "factory:focus" && (typeof message.id === "string" || message.id === null)) {
    return { type: "factory:focus", id: message.id };
  }

  if (message.type === "factory:button-style") {
    const styles = message.styles === null ? null : parseButtonStyles(message.styles);
    return styles === undefined ? undefined : { type: "factory:button-style", styles };
  }

  if (message.type === "factory:focus-buttons" && (isKind(message.kind) || message.kind === null)) {
    return { type: "factory:focus-buttons", kind: message.kind };
  }

  return undefined;
}
