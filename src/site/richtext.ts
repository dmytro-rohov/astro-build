/**
 * Renders "richtext-lite" from site.json to HTML.
 * Supported: paragraphs (blank line), **bold**, *italic*, [text](link).
 * The whole text is HTML-escaped first, so no markup from the input survives;
 * links are re-checked against the SafeUrl rule. Pure TS (also used in tests).
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

function renderInline(escaped: string): string {
  return escaped
    // Link target may contain one level of parentheses, e.g. /a_(b).
    .replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_match, label: string, href: string) => {
      // href is already HTML-escaped; decode &amp; only for validation.
      const raw = href.replaceAll("&amp;", "&");

      if (!SafeUrl.safeParse(raw).success) {
        return label;
      }

      const external = /^https:/.test(raw);
      const rel = external ? ' rel="noopener noreferrer" target="_blank"' : "";

      return `<a class="link" href="${href}"${rel}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** HTML string for set:html. Paragraphs become <p>, single line breaks <br>. */
export function renderRichTextLite(value: string): string {
  return value
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${renderInline(escapeHtml(paragraph.trim())).replace(/\n/g, "<br>")}</p>`)
    .join("");
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
