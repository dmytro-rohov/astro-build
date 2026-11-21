/**
 * v3.9: what the blog layouts need from blog.posts: order, addresses, chapters, reading time,
 * related posts. Pure TS (also used in tests, the RSS feed and the build scripts).
 */
import { richTextLiteToPlain } from "./richtext";
import type { Blog, Post } from "./schema/blog";

/** Words per minute for the reading time (a calm reading pace). */
const WORDS_PER_MINUTE = 200;

export const postPath = (blog: Pick<Blog, "path">, post: Pick<Post, "slug">) => `${blog.path}/${post.slug}`;

/** Newest first; the same day: the later in blog.posts first (it was added later). */
export function sortPosts(posts: readonly Post[]): Post[] {
  return posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => b.post.date.localeCompare(a.post.date) || b.index - a.index)
    .map(({ post }) => post);
}

/** The posts a list shows: newest first, of one category, at most `limit`. */
export function selectPosts(posts: readonly Post[], { limit, category }: { limit?: number; category?: string } = {}): Post[] {
  const sorted = sortPosts(posts).filter((post) => !category || post.category === category);
  return limit ? sorted.slice(0, limit) : sorted;
}

/** Plain text of every block that is read (for the reading time and the feed). */
export function postText(post: Pick<Post, "body">): string {
  return post.body
    .flatMap((block) => {
      switch (block.type) {
        case "paragraph":
          return [richTextLiteToPlain(block.text)];
        case "callout":
          return [block.title ?? "", richTextLiteToPlain(block.text)];
        case "heading":
          return [block.text];
        case "list":
          return block.items.map(richTextLiteToPlain);
        case "quote":
          return [block.text];
        case "cta":
          return [block.title ?? "", block.text ?? ""];
        default:
          return [];
      }
    })
    .filter(Boolean)
    .join(" ");
}

/** Reading time in whole minutes, at least 1. */
export function readingMinutes(post: Pick<Post, "body">): number {
  const words = postText(post).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Latin letters with marks lose them (NFD); these have no decomposition. Cyrillic is spelled in Latin letters.
const LETTERS: Record<string, string> = {
  ł: "l", đ: "d", ø: "o", ß: "ss", æ: "ae", œ: "oe", ı: "i",
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ё: "e", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "iu", я: "ia",
};

/** "Jak dbać o włosy?" → "jak-dbac-o-wlosy": an id or an address part from a title. */
export function slugify(value: string): string {
  return [...value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")]
    .map((letter) => LETTERS[letter] ?? letter)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export type Chapter = { id: string; text: string; level: 2 | 3; block: number };

/** The post's headings with unique ids (the table of contents and the anchors). */
/** Ids of the engine's own parts on a post page: a chapter never takes one. */
const RESERVED_IDS = new Set([
  "main-content", "navbar-menu", "cookie-consent-title", "cookie-consent-description",
  "article-toc-title", "article-cta-title", "article-related-title",
]);

export function postChapters(post: Pick<Post, "body">): Chapter[] {
  const used = new Set<string>();

  return post.body.flatMap((block, index) => {
    if (block.type !== "heading") return [];

    const base = slugify(block.text) || "rozdzial";
    // An id must not start with a digit for CSS selectors, nor clash with the engine's own ids.
    const start = /^\d/.test(base) ? `r-${base}` : base;
    let id = start;
    for (let n = 2; used.has(id) || RESERVED_IDS.has(id); n++) id = `${start}-${n}`;
    used.add(id);

    return [{ id, text: block.text, level: block.level, block: index }];
  });
}

/** Up to `count` other posts: the same category first, then the newest. */
export function relatedPosts(posts: readonly Post[], post: Post, count = 3): Post[] {
  const others = sortPosts(posts).filter((other) => other.id !== post.id);
  const same = post.category ? others.filter((other) => other.category === post.category) : [];
  return [...same, ...others.filter((other) => !same.includes(other))].slice(0, count);
}

/** The posts before (older) and after (newer) this one. */
export function adjacentPosts(posts: readonly Post[], post: Post): { older?: Post; newer?: Post } {
  const sorted = sortPosts(posts);
  const index = sorted.findIndex((other) => other.id === post.id);
  return { newer: sorted[index - 1], older: sorted[index + 1] };
}

/** Posts by month ("2026-11"), newest month first. */
export function postsByMonth(posts: readonly Post[]): { month: string; posts: Post[] }[] {
  const groups: { month: string; posts: Post[] }[] = [];

  for (const post of sortPosts(posts)) {
    const month = post.date.slice(0, 7);
    const group = groups.at(-1);
    if (group?.month === month) group.posts.push(post);
    else groups.push({ month, posts: [post] });
  }

  return groups;
}

/** The post's main photo: the cover, else its first photo or gallery photo. */
export function postImage(post: Pick<Post, "cover" | "body">): string | undefined {
  if (post.cover) return post.cover;

  for (const block of post.body) {
    if (block.type === "image") return block.image;
    if (block.type === "gallery") return block.images[0];
  }

  return undefined;
}

/** Every photo of a short post, cover first (the photo layout shows them all). */
export function postPhotos(post: Pick<Post, "cover" | "body">): string[] {
  const photos = post.body.flatMap((block) => (block.type === "image" ? [block.image] : block.type === "gallery" ? block.images : []));
  return [...new Set([...(post.cover ? [post.cover] : []), ...photos])];
}

/** Meta description: seo.description, else the excerpt cut at a word to 160 characters. */
export function postDescription(post: Pick<Post, "excerpt" | "seo">): string {
  if (post.seo.description) return post.seo.description;

  const text = post.excerpt.replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;

  const cut = text.slice(0, 159);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}
