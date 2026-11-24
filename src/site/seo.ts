/**
 * v3.12: the texts search engines show for a page: its title and its description. Pure TS (tests).
 */
import { richTextLiteToPlain } from "./richtext";
import type { Page } from "./schema/site";

/** Longest title that search results show whole (about 60 characters). */
export const TITLE_MAX = 60;

/** Longest description that search results show whole (about 155 characters). */
export const DESCRIPTION_MAX = 155;

/** A derived description shorter than this says too little: the site's own description is better. */
const DESCRIPTION_MIN = 50;

/** Reads well as a description once this long; shorter texts take the next one too. */
const DESCRIPTION_ENOUGH = 70;

/**
 * The <title> (and og:title) of a page from the language's template ("{title} | {siteName}"). When the whole
 * would not fit in TITLE_MAX characters, the page's own title goes alone: the site name is cut off anyway.
 */
export function composeTitle(template: string, title: string | undefined, siteName: string): string {
  if (!title || title === siteName) return siteName;

  const full = template.replace(/\{(title|siteName)\}/g, (_match, key: string) => (key === "title" ? title : siteName));
  return full.length <= TITLE_MAX ? full : title;
}

/** One line of text, cut at a word to at most `max` characters (with "…" when cut). */
export function clip(text: string, max: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= max) return line;

  // Room for the "…"; a word cut in the middle goes (unless it is the only one).
  const cut = line.slice(0, max - 1);
  const atWord = /\s/.test(line.charAt(max - 1)) || !cut.includes(" ");
  return `${(atWord ? cut : cut.slice(0, cut.lastIndexOf(" "))).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * A description for a page without its own: the texts of its sections in order (section descriptions, the about
 * text), joined until they read well, cut to DESCRIPTION_MAX. Undefined when the page has too little text: the
 * site's description stays then.
 */
export function pageSummary(page: Pick<Page, "sections">): string | undefined {
  const texts = page.sections.flatMap((section) => {
    const content = section.content as { description?: unknown; body?: unknown };
    return [content.description, content.body]
      .filter((value): value is string => typeof value === "string")
      .map((value) => richTextLiteToPlain(value).replace(/\s+/g, " ").trim())
      .filter(Boolean);
  });

  let summary = "";
  for (const text of texts) {
    // Sentences from two sections: the first one ends with a full stop.
    summary = summary ? `${/[.!?…]$/.test(summary) ? summary : `${summary}.`} ${text}` : text;
    if (summary.length >= DESCRIPTION_ENOUGH) break;
  }

  return summary.length >= DESCRIPTION_MIN ? clip(summary, DESCRIPTION_MAX) : undefined;
}
