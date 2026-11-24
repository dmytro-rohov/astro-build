/**
 * v3.13: the CSS of a custom layout (layout.ts), checked and compiled into the site's stylesheet ("virtual:custom-layouts.css",
 * src/site/vite-plugin.ts): no inline styles, so the CSP stays strict.
 *
 * Rules apply to this section only: every selector is put under the section (.s-custom--<name>), ":scope" names the
 * section itself, classes are the template's (c-…). Inside @layer widgets, like the engine's own sections. Allowed:
 * plain rules, @media (sizes, motion), @supports, @container, @keyframes (renamed per layout).
 * Refused, with a line number so the AI can fix it:
 * - colors other than the theme's tokens (var(--color-…), color-mix() of them, transparent, currentColor): the
 *   section must follow the site's palette, its tones and its dark mode (prefers-color-scheme is the theme's job);
 * - fonts other than var(--font-family-…); text in `content`; !important; position: fixed; url() and other ways to
 *   load or run anything; ids, html, body, :root and nested rules; custom properties other than the layout's own
 *   (--c-…): the theme's tokens are read-only.
 */
import postcss, { type AtRule, type ChildNode, type Container, type Declaration, type Root, type Rule } from "postcss";

export const CSS_RULES_MAX = 400;

/** Prefixes of the theme's tokens a layout may read (src/design-system/cssVars.ts), and its own --c-… properties. */
export const TOKEN_PREFIXES = [
  "color-", "font-", "spacing-", "space-", "radius-", "shadow-", "elevation-", "card-", "image-", "heading-",
  "letter-spacing-", "line-height-", "motion-", "z-index-", "button-", "logo-", "c-",
] as const;

const AT_RULES = new Set(["media", "supports", "container", "keyframes"]);

// The CSS named colors: a section takes its colors from the theme.
const NAMED_COLORS = new Set(
  ("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
    "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
    "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
    "greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey " +
    "lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
    "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow " +
    "springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen").split(" "),
);
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|light-dark)\(/i;
const HEX_COLOR = /#[0-9a-f]{3,8}\b/i;
const LOADS = /\b(?:url|image-set|-webkit-image-set|image|cross-fade|element|expression|paint|src|attr)\(|javascript:|@import|\\/i;
const CONTENT_VALUES = /^(?:""|''|none|normal|open-quote|close-quote|no-open-quote|no-close-quote|counters?\([^)]*\)(?:\s+(?:""|''|counters?\([^)]*\)))*)$/;
const FORBIDDEN_SELECTOR = /#|(?:^|[\s>+~(,])(?:html|body|head|main)\b|:root\b|:host\b|::?(?:slotted|part|view-transition)|\[\s*style|\bnav\b/i;
const FORBIDDEN_PROPERTIES = new Set(["behavior", "-moz-binding", "font", "src", "unicode-range"]);

const line = (node: ChildNode | Declaration) => (node.source?.start ? `line ${node.source.start.line}: ` : "");

/** The value without the var() names and strings, for the color checks. */
const bare = (value: string) => value.replace(/var\(\s*--[\w-]+/g, "var(").replace(/"[^"]*"|'[^']*'/g, '""');

export function compileCss(name: string, css: string): { css: string; issues: string[] } {
  const issues: string[] = [];
  if (!css.trim()) return { css: "", issues };

  let root: Root;
  try {
    root = postcss.parse(css);
  } catch (error) {
    const syntax = error as { line?: number; reason?: string; message: string };
    return { css: "", issues: [`${syntax.line ? `line ${syntax.line}: ` : ""}${syntax.reason ?? syntax.message}`] };
  }

  const scope = `.s-custom--${name}`;
  const keyframes = new Map<string, string>();
  root.walkAtRules("keyframes", (rule) => {
    const own = rule.params.trim();
    if (/^[a-z][a-z0-9-]{0,40}$/.test(own)) keyframes.set(own, `c-${name}-${own}`);
  });

  let rules = 0;

  const visit = (container: Container, inKeyframes: boolean) => {
    container.each((node) => {
      if (node.type === "comment") {
        node.remove();
        return;
      }

      if (node.type === "atrule") {
        visitAtRule(node, inKeyframes);
        return;
      }

      if (node.type === "rule") {
        visitRule(node, container, inKeyframes);
        return;
      }

      if (node.type === "decl") {
        issues.push(`${line(node)}"${node.prop}" outside a rule: put it in a selector, e.g. :scope { … }.`);
      }
    });
  };

  const visitAtRule = (rule: AtRule, inKeyframes: boolean) => {
    const kind = rule.name.toLowerCase();
    if (inKeyframes || !AT_RULES.has(kind)) {
      issues.push(`${line(rule)}@${rule.name} is not allowed (only @media, @supports, @container, @keyframes).`);
      return;
    }
    if (kind === "media" && /prefers-color-scheme/i.test(rule.params)) {
      issues.push(`${line(rule)}No prefers-color-scheme: the theme's tokens already follow the site's light and dark mode.`);
      return;
    }
    if (kind === "keyframes") {
      const renamed = keyframes.get(rule.params.trim());
      if (!renamed) issues.push(`${line(rule)}@keyframes name "${rule.params}": lowercase letters, digits and "-".`);
      else rule.params = renamed;
      visit(rule, true);
      return;
    }
    visit(rule, false);
  };

  const visitRule = (rule: Rule, parent: Container, inKeyframes: boolean) => {
    if (++rules > CSS_RULES_MAX) {
      if (rules === CSS_RULES_MAX + 1) issues.push(`At most ${CSS_RULES_MAX} rules.`);
      return;
    }
    if (parent.type === "rule") {
      issues.push(`${line(rule)}Nested rules are not allowed: write each selector in full.`);
      return;
    }

    if (inKeyframes) {
      if (!rule.selectors.every((selector) => /^(?:from|to|\d{1,3}(?:\.\d+)?%)$/.test(selector.trim()))) {
        issues.push(`${line(rule)}Keyframes are from, to or percentages.`);
      }
    } else {
      const scoped: string[] = [];
      for (const raw of rule.selectors) {
        const selector = raw.trim();
        const classes = [...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]);
        const foreign = classes.find((item) => !item.startsWith("c-"));

        if (FORBIDDEN_SELECTOR.test(selector)) issues.push(`${line(rule)}Selector "${selector}": no ids, html, body, :root or [style]; the section is :scope.`);
        else if (foreign) issues.push(`${line(rule)}Selector "${selector}": the class ".${foreign}" is not the template's (classes start with c-).`);
        else if (/:scope\b/.test(selector.replace(/^:scope\b/, ""))) issues.push(`${line(rule)}Selector "${selector}": :scope only at the start.`);
        else scoped.push(selector.startsWith(":scope") ? `${scope}${selector.slice(6)}` : `${scope} ${selector}`);
      }
      rule.selectors = scoped.length ? scoped : [`${scope}`];
    }

    rule.each((child) => {
      if (child.type === "decl") checkDeclaration(child);
      else if (child.type === "comment") child.remove();
      else issues.push(`${line(child)}Nested rules are not allowed: write each selector in full.`);
    });
  };

  const checkDeclaration = (declaration: Declaration) => {
    const property = declaration.prop.toLowerCase();
    const value = declaration.value.trim();
    const at = line(declaration);

    if (declaration.important) issues.push(`${at}No !important (${property}).`);

    if (property.startsWith("--")) {
      if (!property.startsWith("--c-")) issues.push(`${at}"${declaration.prop}": the theme's tokens are read-only; a layout's own properties start with --c-.`);
    } else if (FORBIDDEN_PROPERTIES.has(property)) {
      issues.push(`${at}"${property}" is not allowed${property === "font" ? " (use font-size, font-weight…; the family comes from var(--font-family-…))" : ""}.`);
      return;
    }

    if (LOADS.test(value)) {
      issues.push(`${at}${property}: no url(), attr(), image-set(), escapes or anything that loads a file (images are fields).`);
      return;
    }

    const plain = bare(value);
    const named = plain.toLowerCase().match(/-?[a-z][a-z-]*/g)?.find((word) => NAMED_COLORS.has(word));
    if (HEX_COLOR.test(plain) || COLOR_FUNCTION.test(plain) || named) {
      issues.push(`${at}${property}: "${value}" is a color of its own; use the theme's tokens, e.g. var(--color-text-primary), var(--color-action-primary) or color-mix(in oklab, var(--color-…) 40%, transparent).`);
    }

    for (const match of value.matchAll(/var\(\s*--([\w-]+)/g)) {
      if (!TOKEN_PREFIXES.some((prefix) => match[1].startsWith(prefix))) issues.push(`${at}var(--${match[1]}) is not a theme token (see catalog.json custom.tokens) nor the layout's own --c-….`);
    }

    if (property === "font-family" && !/^(?:var\(--font-family-[a-z-]+\)|inherit)$/.test(value)) {
      issues.push(`${at}font-family: only var(--font-family-base), var(--font-family-heading) or var(--font-family-mono).`);
    }
    if (property === "position" && /fixed/i.test(value)) issues.push(`${at}position: fixed is not allowed (it would cover the page).`);
    if (property === "content" && !CONTENT_VALUES.test(value)) issues.push(`${at}content: no text in CSS (put it in a field); "" or counter() only.`);
    if (property === "z-index" && /^\d+$/.test(value) && Number(value) > 10) issues.push(`${at}z-index ${value}: at most 10 (above it is the page's header and dialogs).`);

    if ((property === "animation" || property === "animation-name") && keyframes.size) {
      declaration.value = value.replace(/[a-z][a-z0-9-]*/g, (word) => keyframes.get(word) ?? word);
    }
  };

  visit(root, false);

  if (issues.length) return { css: "", issues };
  return { css: `@layer widgets {\n${root.toString().trim()}\n}\n`, issues };
}
