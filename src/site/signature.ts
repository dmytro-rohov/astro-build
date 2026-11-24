/**
 * v3.7: the Factory signature — small easter eggs every site carries: a comment with ASCII art in
 * the page source, a note in the browser console, /humans.txt and the secret mark in the footer.
 * Each one points to the next. The texts come from the site's dictionary (`t.signature`), so they
 * are in the site's language; the "mytko factory" lockup itself is a brand name.
 */
import type { Dictionary } from "@/i18n/dictionaries";

export const FACTORY_URL = "https://factory.mytko.dev";
export const STUDIO_URL = "https://mytko.dev";

/** "mytko factory" in box-drawing letters (toilet, font "future"). */
export const WORDMARK = [
  "┏┳┓╻ ╻╺┳╸╻┏ ┏━┓   ┏━╸┏━┓┏━╸╺┳╸┏━┓┏━┓╻ ╻",
  "┃┃┃┗┳┛ ┃ ┣┻┓┃ ┃   ┣╸ ┣━┫┃   ┃ ┃ ┃┣┳┛┗┳┛",
  "╹ ╹ ╹  ╹ ╹ ╹┗━┛   ╹  ╹ ╹┗━╸ ╹ ┗━┛╹┗╸ ╹",
].join("\n");

type Texts = Dictionary["signature"];

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** The Factory's `<meta name="generator">`. v3.12: no version (it only helps to fingerprint the stack), and no Astro tag. */
export const GENERATOR = "Mytko Website Factory";

/** Text that cannot end or break an HTML comment: no "--" anywhere (a site name could have one). */
export function commentSafe(text: string): string {
  return text.replace(/-(?=-)/g, "- ");
}

/** The comment at the top of every page: the wordmark, who built the site and the hint to the console. */
export function sourceComment(t: Texts, siteName: string): string {
  const lines = [
    "",
    ...WORDMARK.split("\n"),
    "",
    fill(t.comment, { siteName, url: FACTORY_URL }),
    t.commentHint,
    "",
  ];
  return `<!--\n${commentSafe(lines.map((line) => (line ? `  ${line}` : line)).join("\n"))}\n-->`;
}

export type HumansSite = {
  name: string;
  url: string;
  lang: string;
  /** YYYY-MM-DD of the build. */
  updated: string;
};

/** /humans.txt (humanstxt.org): the site, the people behind it and the hint to the footer mark. */
export function humansTxt(t: Texts, site: HumansSite): string {
  const h = t.humans;
  return [
    `/* ${h.team} */`,
    `  ${h.owner}: ${site.name}`,
    `  ${h.website}: ${site.url}`,
    `  ${h.madeWith}: Mytko Website Factory, ${FACTORY_URL}`,
    `  ${h.studio}: Mytko, ${STUDIO_URL}`,
    "",
    `/* ${h.site} */`,
    `  ${h.language}: ${site.lang}`,
    `  ${h.updated}: ${site.updated}`,
    `  ${h.technology}: Astro, TypeScript, Sass`,
    "",
    `/* ${h.secret} */`,
    `  ${h.hint}`,
    "",
  ].join("\n");
}
