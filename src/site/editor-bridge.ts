/**
 * v3.6: editor preview bridge — the factory editor shows a preview build of the site in an iframe
 * and drives it with window.postMessage (src/components/EditorBridge.astro, README "Editor preview
 * bridge"). No imports — the module is bundled into the bridge script.
 */

/** A section of the current page as the editor panel lists it. */
export type BridgeSection = { id: string; type: string; variant: string; title: string | null };

/** Messages from the editor; anything else is ignored. */
export type EditorMessage =
  | { type: "factory:layout"; order: string[]; hidden: string[] }
  | { type: "factory:focus"; id: string | null };

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

  return undefined;
}
