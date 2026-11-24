/**
 * Renders "richtext-lite" from site.json to HTML.
 * Supported: paragraphs (blank line), **bold**, *italic*, [text](link).
 * The whole text is HTML-escaped first, so no markup from the input survives;
 * links are re-checked against the SafeUrl rule. Pure TS (also used in tests).
 * v3.12: `newTab` (the dictionary's "(opens in a new tab)") is added, visually hidden, to links that open a new tab.
 */
import { SafeUrl } from "./schema/fields";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type RichTextOptions = { newTab?: string };

const emphasis = (value: string) => value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

function renderInline(escaped: string, { newTab }: RichTextOptions = {}): string {
  // Links are rendered first and replaced by placeholders, so **/* inside a URL
  // never turn into markup in the href. (Validated text has no U+0000.)
  const links: string[] = [];

  const text = escaped.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_match, label: string, href: string) => {
    // href is already HTML-escaped; decode &amp; only for validation.
    const raw = href.replaceAll("&amp;", "&");
    let html = emphasis(label);

    if (SafeUrl.safeParse(raw).success) {
      const external = /^https:/.test(raw);
      const rel = external ? ' rel="noopener noreferrer" target="_blank"' : "";
      const note = external && newTab ? `<span class="visually-hidden-inline"> ${escapeHtml(newTab)}</span>` : "";
      html = `<a class="link" href="${href}"${rel}>${html}${note}</a>`;
    }

    links.push(html);
    return `\u0000${links.length - 1}\u0000`;
  });

  // eslint-disable-next-line no-control-regex -- U+0000 delimits the link placeholders
  return emphasis(text).replace(/\u0000(\d+)\u0000/g, (_match, index: string) => links[Number(index)]);
}

/** HTML string for set:html. Paragraphs become <p>, single line breaks <br>. */
export function renderRichTextLite(value: string, options?: RichTextOptions): string {
  return value
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${renderInline(escapeHtml(paragraph.trim()), options).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** v3.9: one line of richtext-lite without the <p> (list items): line breaks become <br>. */
export function renderRichTextInline(value: string, options?: RichTextOptions): string {
  return renderInline(escapeHtml(value.trim()), options).replace(/\s*\n\s*/g, "<br>");
}

/** Plain text without the markers (meta tags, JSON-LD). */
export function richTextLiteToPlain(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\((?:[^()\s]|\([^()\s]*\))+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}
