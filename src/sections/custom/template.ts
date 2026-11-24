/**
 * v3.13: the template of a custom layout (layout.ts). HTML from a short list of elements, every text, image and link
 * filled from the layout's fields with data-* bindings; the engine's widgets with data-behavior:
 *   <h2 class="c-title" data-text="title"></h2>
 *   <ul class="c-pairs"><li class="c-pair" data-each="pairs">
 *     <div data-behavior="compare" data-before="before" data-after="after"></div>
 *     <p class="c-caption" data-text="caption" data-if="caption"></p>
 *   </li></ul>
 * Bindings: data-text (text, textarea), data-rich (richtext, on a div), data-image (image, on an img), data-action
 * (action, on an a; data-button="primary|secondary|ghost" draws it as a button), data-icon (icon, on a span), data-each
 * (repeats the element for each item of a list; inside, keys are the item's), data-if / data-unless (shown only when a
 * field has / has no value), data-counter (a number that counts up, with data-text).
 * Behaviors: data-behavior="compare" (data-before, data-after: image fields; data-before-label, data-after-label: text
 * fields, by default "before" / "after" in the site's language) and data-behavior="slider" (its children are <li>;
 * data-label: a text field naming it; data-single: one item per view; data-dots: a dot per item).
 *
 * Anything else is refused with a line number, so the AI can fix it: no scripts, no inline styles, no attributes of its
 * own (no ids, no on…), no text that is not a field (the client edits everything, in every language), no h1 (the
 * section title, an <h2 data-text> outside any data-each bound to a required text field, becomes the page's h1 when the
 * section opens a page). Whitespace between elements stays as one space.
 */
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import type { CustomField, CustomItemField } from "./layout";

type Parse5Node = DefaultTreeAdapterMap["childNode"];
type Parse5Element = DefaultTreeAdapterMap["element"];

export const TEMPLATE_ELEMENTS_MAX = 400;
export const TEMPLATE_DEPTH_MAX = 16;

/** Elements a template may use. */
export const TEMPLATE_TAGS = [
  "div", "span", "p", "h2", "h3", "h4", "ul", "ol", "li", "figure", "figcaption", "blockquote", "strong", "em", "small",
  "br", "hr", "dl", "dt", "dd", "details", "summary", "article", "header", "footer", "a", "img",
] as const;

/** Elements whose text data-text may set. */
const TEXT_TAGS = new Set(["div", "span", "p", "h2", "h3", "h4", "li", "figcaption", "blockquote", "strong", "em", "small", "dt", "dd", "summary"]);
const VOID_TAGS = new Set(["br", "hr", "img"]);
export const TEMPLATE_ROLES = ["list", "listitem", "group", "presentation", "note"] as const;
export const BUTTON_KINDS = ["primary", "secondary", "ghost"] as const;
export const BEHAVIORS = ["compare", "slider"] as const;

/** A class of a template: c-<name>, BEM style (c-pair, c-pair__label, c-pair--wide). */
export const CLASS_PATTERN = /^c-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const KEY_PATTERN = /^[a-z][a-zA-Z0-9]{0,31}$/;
const SIZES_PATTERN = /^[\w\s(),.%:-]{1,200}$/;

export type Behavior =
  | { name: "compare"; before: string; after: string; beforeLabel?: string; afterLabel?: string }
  | { name: "slider"; label?: string; single: boolean; dots: boolean };

export type TemplateElement = {
  tag: string;
  /** Static attributes that passed the checks: class, role, aria-hidden, open, sizes. */
  attrs: Record<string, string>;
  children: TemplateChild[];
  each?: string;
  when?: string;
  unless?: string;
  text?: string;
  rich?: string;
  image?: string;
  action?: string;
  button?: (typeof BUTTON_KINDS)[number];
  icon?: string;
  counter?: boolean;
  behavior?: Behavior;
  /** The section's title: h1 when the section opens the page. */
  primary?: boolean;
};

export type TemplateChild = TemplateElement | " ";

type AnyField = CustomField | CustomItemField;
type Scope = Map<string, AnyField>;

const scopeOf = (fields: readonly AnyField[]): Scope => new Map(fields.map((item) => [item.key, item]));

const isElement = (node: Parse5Node): node is Parse5Element => "tagName" in node;
const hasContent = (node: Parse5Element) => node.childNodes.some((child) => isElement(child) || ("value" in child && child.nodeName === "#text" && child.value.trim()));

export function compileTemplate(template: string, fields: readonly CustomField[]): { nodes: TemplateChild[]; issues: string[] } {
  const issues: string[] = [];
  let elements = 0;
  let primary: TemplateElement | undefined;
  const fragment = parseFragment(template, { sourceCodeLocationInfo: true });

  const at = (node: Parse5Node) => (node.sourceCodeLocation ? `line ${node.sourceCodeLocation.startLine}: ` : "");
  const fail = (node: Parse5Node, message: string) => issues.push(`${at(node)}${message}`);

  /** The field a binding names, of one of the given types; reports it otherwise. */
  const bound = (node: Parse5Element, attr: string, key: string, scope: Scope, types: readonly string[]): string | undefined => {
    const found = KEY_PATTERN.test(key) ? scope.get(key) : undefined;
    if (!found) {
      fail(node, `${attr}="${key}" names no field here (fields: ${[...scope.keys()].join(", ") || "none"}).`);
      return undefined;
    }
    if (!types.includes(found.type)) {
      fail(node, `${attr}="${key}" needs a ${types.join(" or ")} field, "${key}" is ${found.type}.`);
      return undefined;
    }
    return key;
  };

  const walk = (nodes: Parse5Node[], scope: Scope, parent: Parse5Element | undefined, depth: number, inLoop: boolean): TemplateChild[] => {
    const result: TemplateChild[] = [];

    for (const node of nodes) {
      if (node.nodeName === "#comment") continue;

      if (node.nodeName === "#text" && "value" in node) {
        const value = node.value.trim();
        if (value) fail(node, `Text "${value.slice(0, 40)}" must come from a field (data-text): the client edits every text.`);
        else if (result.length && result.at(-1) !== " ") result.push(" ");
        continue;
      }

      if (!isElement(node)) continue;
      const element = visitElement(node, scope, parent, depth, inLoop);
      if (element) result.push(element);
    }

    if (result.at(-1) === " ") result.pop();
    return result;
  };

  const visitElement = (node: Parse5Element, outer: Scope, parent: Parse5Element | undefined, depth: number, inLoop: boolean): TemplateElement | undefined => {
    const tag = node.tagName;

    if (node.namespaceURI !== "http://www.w3.org/1999/xhtml") {
      fail(node, `<${tag}> is not allowed (no SVG or MathML; icons come from data-icon).`);
      return undefined;
    }
    if (!(TEMPLATE_TAGS as readonly string[]).includes(tag)) {
      fail(node, tag === "h1"
        ? "<h1> is not allowed: the section title is an <h2> (it becomes the h1 when the section opens a page)."
        : `<${tag}> is not allowed. Elements: ${TEMPLATE_TAGS.join(", ")}.`);
      return undefined;
    }
    if (++elements > TEMPLATE_ELEMENTS_MAX) {
      if (elements === TEMPLATE_ELEMENTS_MAX + 1) fail(node, `At most ${TEMPLATE_ELEMENTS_MAX} elements.`);
      return undefined;
    }
    if (depth > TEMPLATE_DEPTH_MAX) {
      fail(node, `Nested too deep (at most ${TEMPLATE_DEPTH_MAX} levels).`);
      return undefined;
    }

    const attrs: Record<string, string> = {};
    const data: Record<string, string> = {};

    for (const { name, value } of node.attrs) {
      if (name === "class") {
        const classes = value.split(/\s+/).filter(Boolean);
        const wrong = classes.filter((item) => !CLASS_PATTERN.test(item));
        if (wrong.length) fail(node, `Class "${wrong[0]}": classes start with c- (e.g. c-pair, c-pair__label, c-pair--wide).`);
        else if (classes.length > 8) fail(node, "At most 8 classes on an element.");
        else if (classes.length) attrs.class = classes.join(" ");
      } else if (name === "role") {
        if ((TEMPLATE_ROLES as readonly string[]).includes(value)) attrs.role = value;
        else fail(node, `role="${value}" is not allowed (${TEMPLATE_ROLES.join(", ")}).`);
      } else if (name === "aria-hidden") {
        if (value === "true") attrs["aria-hidden"] = "true";
        else fail(node, 'aria-hidden only as aria-hidden="true".');
      } else if (name === "open" && tag === "details") {
        attrs.open = "";
      } else if (name === "sizes" && tag === "img") {
        if (SIZES_PATTERN.test(value)) attrs.sizes = value;
        else fail(node, `sizes="${value}" is not a valid sizes list.`);
      } else if (name.startsWith("data-")) {
        data[name.slice(5)] = value.trim();
      } else {
        fail(node, `Attribute "${name}" is not allowed on <${tag}> (only class, role, aria-hidden and the data-* bindings).`);
      }
    }

    const element: TemplateElement = { tag, attrs, children: [] };
    let scope = outer;
    let loop = inLoop;

    if ("each" in data) {
      const key = bound(node, "data-each", data.each, outer, ["list"]);
      if ("if" in data || "unless" in data) fail(node, "data-each and data-if/data-unless on one element: put the condition on an element inside.");
      if (key) {
        element.each = key;
        scope = scopeOf((outer.get(key) as Extract<CustomField, { type: "list" }>).fields);
        loop = true;
      }
    }
    if ("if" in data) element.when = bound(node, "data-if", data.if, scope, ["text", "textarea", "richtext", "image", "action", "icon", "toggle", "list"]);
    if ("unless" in data) element.unless = bound(node, "data-unless", data.unless, scope, ["text", "textarea", "richtext", "image", "action", "icon", "toggle", "list"]);

    const empty = (what: string) => hasContent(node) && fail(node, `<${tag} ${what}> gets its content from the field: leave it empty.`);

    if ("text" in data) {
      if (!TEXT_TAGS.has(tag)) fail(node, `data-text is not for <${tag}> (${[...TEXT_TAGS].join(", ")}).`);
      element.text = bound(node, "data-text", data.text, scope, ["text", "textarea"]);
      empty("data-text");
    }
    if ("rich" in data) {
      if (tag !== "div") fail(node, "data-rich is only for a <div> (the text has its own paragraphs).");
      element.rich = bound(node, "data-rich", data.rich, scope, ["richtext"]);
      empty("data-rich");
    }
    if (tag === "img") {
      if (!("image" in data)) fail(node, "An <img> shows an image field: data-image=\"<field>\" (no src).");
      else element.image = bound(node, "data-image", data.image, scope, ["image"]);
    } else if ("image" in data) fail(node, "data-image is only for an <img>.");
    if (tag === "a") {
      if (!("action" in data)) fail(node, "An <a> shows an action field: data-action=\"<field>\" (no href).");
      else element.action = bound(node, "data-action", data.action, scope, ["action"]);
      if ("button" in data) {
        if ((BUTTON_KINDS as readonly string[]).includes(data.button)) element.button = data.button as TemplateElement["button"];
        else fail(node, `data-button="${data.button}": ${BUTTON_KINDS.join(", ")}.`);
      }
      empty("data-action");
      if (parentChain(node).includes("a")) fail(node, "A link inside a link is not allowed.");
    } else if ("action" in data || "button" in data) fail(node, "data-action and data-button are only for an <a>.");
    if ("icon" in data) {
      if (tag !== "span") fail(node, "data-icon is only for a <span>.");
      element.icon = bound(node, "data-icon", data.icon, scope, ["icon"]);
      empty("data-icon");
    }
    if ("counter" in data) {
      if (!element.text) fail(node, "data-counter needs data-text (a field with a number).");
      element.counter = true;
    }
    if ("behavior" in data) element.behavior = behavior(node, tag, data, scope);

    const known = new Set(["each", "if", "unless", "text", "rich", "image", "action", "button", "icon", "counter", "behavior"]);
    if (element.behavior?.name === "compare") ["before", "after", "before-label", "after-label"].forEach((name) => known.add(name));
    if (element.behavior?.name === "slider" || data.behavior === "slider") ["label", "single", "dots"].forEach((name) => known.add(name));
    for (const name of Object.keys(data)) if (!known.has(name)) fail(node, `data-${name} is not a binding (data-text, data-rich, data-image, data-action, data-icon, data-each, data-if, data-unless, data-counter, data-behavior).`);

    // HTML the browser and screen readers rely on.
    const parentTag = parent?.tagName;
    const sliderParent = parent && parent.attrs.some((attr) => attr.name === "data-behavior" && attr.value === "slider");
    if (tag === "li" && parentTag !== "ul" && parentTag !== "ol" && !sliderParent) fail(node, "An <li> belongs directly in a <ul>, an <ol> or a slider.");
    if ((tag === "dt" || tag === "dd") && parentTag !== "dl") fail(node, `A <${tag}> belongs directly in a <dl>.`);
    if (tag === "summary" && parentTag !== "details") fail(node, "A <summary> belongs directly in a <details>.");
    if (tag === "figcaption" && parentTag !== "figure") fail(node, "A <figcaption> belongs directly in a <figure>.");
    if (tag === "details" && !node.childNodes.some((child) => isElement(child) && child.tagName === "summary")) fail(node, "A <details> needs its <summary> (the visible question).");
    if (tag === "ul" || tag === "ol" || element.behavior?.name === "slider") {
      if (node.childNodes.some((child) => isElement(child) && child.tagName !== "li")) fail(node, `Only <li> directly inside ${element.behavior ? "a slider" : `<${tag}>`}.`);
    }

    if (tag === "h2" && !loop && !primary && element.text) {
      const titled = scope.get(element.text);
      if (titled && "required" in titled && titled.required) {
        element.primary = true;
        primary = element;
      }
    }

    if (!VOID_TAGS.has(tag) && !element.text && !element.rich && !element.icon && !element.action && element.behavior?.name !== "compare") {
      element.children = walk(node.childNodes, scope, node, depth + 1, loop);
    }

    return element;
  };

  const parentChain = (node: Parse5Element): string[] => {
    const chain: string[] = [];
    for (let current = node.parentNode; current && "tagName" in current; current = (current as Parse5Element).parentNode) chain.push((current as Parse5Element).tagName);
    return chain;
  };

  const behavior = (node: Parse5Element, tag: string, data: Record<string, string>, scope: Scope): Behavior | undefined => {
    if (tag !== "div") {
      fail(node, "data-behavior is only for a <div>.");
      return undefined;
    }
    if (data.behavior === "compare") {
      const before = data.before ? bound(node, "data-before", data.before, scope, ["image"]) : undefined;
      const after = data.after ? bound(node, "data-after", data.after, scope, ["image"]) : undefined;
      if (!data.before || !data.after) fail(node, 'The compare needs data-before and data-after (two image fields).');
      if (hasContent(node)) fail(node, "The compare draws itself: leave its <div> empty.");
      const beforeLabel = data["before-label"] ? bound(node, "data-before-label", data["before-label"], scope, ["text"]) : undefined;
      const afterLabel = data["after-label"] ? bound(node, "data-after-label", data["after-label"], scope, ["text"]) : undefined;
      return before && after ? { name: "compare", before, after, beforeLabel, afterLabel } : undefined;
    }
    if (data.behavior === "slider") {
      for (const flag of ["single", "dots"] as const) if (flag in data && data[flag] !== "") fail(node, `data-${flag} takes no value.`);
      const label = data.label ? bound(node, "data-label", data.label, scope, ["text"]) : undefined;
      return { name: "slider", label, single: "single" in data, dots: "dots" in data };
    }
    fail(node, `data-behavior="${data.behavior}" is not a behavior (${BEHAVIORS.join(", ")}).`);
    return undefined;
  };

  const nodes = walk(fragment.childNodes, scopeOf(fields), undefined, 1, false);

  if (!issues.length && !primary) {
    issues.push('The section needs its title: an <h2 data-text="…"> outside any data-each, bound to a required text field.');
  }

  return { nodes, issues };
}

/** Every field a template shows (for the catalog and the checks of a layout). */
export function boundKeys(nodes: readonly TemplateChild[]): Set<string> {
  const keys = new Set<string>();
  const visit = (node: TemplateChild) => {
    if (node === " ") return;
    for (const key of [node.each, node.when, node.unless, node.text, node.rich, node.image, node.action, node.icon]) if (key) keys.add(key);
    if (node.behavior?.name === "compare") [node.behavior.before, node.behavior.after, node.behavior.beforeLabel, node.behavior.afterLabel].forEach((key) => key && keys.add(key));
    if (node.behavior?.name === "slider" && node.behavior.label) keys.add(node.behavior.label);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return keys;
}
