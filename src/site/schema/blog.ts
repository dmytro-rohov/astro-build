/**
 * v3.9: the blog in site.json. Posts live in `blog.posts`, outside pages[] (no 12-page limit, own
 * date, author, cover). The list of posts is the "posts" section (src/sections/posts) on the page at
 * `blog.path`, and may be repeated elsewhere (e.g. "latest posts" on the home page). Every post gets
 * its own page at `<blog.path>/<slug>` in the site's article layout (`layout.article`).
 *
 * A post's body is a list of blocks: text the engine renders and escapes itself (no HTML), images
 * from the site's assets, videos from the allowed embed providers.
 */
import { z } from "zod";
import { embedProvider } from "../embeds";
import { Action, field, HttpsUrl, Id, imageSlot, listWithIds, multilineText, richTextLite, Slug, text } from "./fields";
import { TITLE_MAX } from "../seo";

/** At most this many posts per site (each one is a page with its own images). */
export const MAX_POSTS = 60;

/** Image slots of the blog (checked by the loader like section slots). */
export const BLOG_IMAGE_SLOTS = {
  cover: { aspect: [3, 2], minWidth: 800 },
  image: { minWidth: 640 },
  gallery: { aspect: [1, 1], minWidth: 400 },
  author: { aspect: [1, 1], minWidth: 160 },
} as const;

/** A post's address under the blog page: lowercase letters, digits and dashes. */
export const PostSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, digits and dashes, e.g. "jak-dbac-o-wlosy".')
  .max(80);

const Paragraph = z.strictObject({
  type: z.literal("paragraph"),
  text: field(richTextLite(2000), { label: "Akapit", fieldType: "richtext-lite", description: "One paragraph (blank lines start new ones); **bold**, *italic*, [links](/path)." }),
});

const Heading = z.strictObject({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]).default(2).describe("2 = chapter (listed in the table of contents), 3 = sub-chapter."),
  text: field(text(120), { label: "Nagłówek", fieldType: "text", description: "Chapter title." }),
});

const List = z.strictObject({
  type: z.literal("list"),
  ordered: z.boolean().default(false).describe("Numbered list (steps) instead of bullets."),
  items: field(z.array(richTextLite(400)).min(1).max(20), { label: "Punkty", fieldType: "list", description: "1–20 points." }),
});

const Quote = z.strictObject({
  type: z.literal("quote"),
  text: field(multilineText(600), { label: "Cytat", fieldType: "textarea", description: "A quotation or a key sentence to stand out." }),
  cite: field(text(80).optional(), { label: "Kto powiedział", fieldType: "text", description: "Who said it." }),
});

const Image = z.strictObject({
  type: z.literal("image"),
  image: field(imageSlot(BLOG_IMAGE_SLOTS.image), { label: "Zdjęcie", fieldType: "image", description: "A photo in the text (any proportions)." }),
  caption: field(text(200).optional(), { label: "Podpis", fieldType: "text", description: "Caption under the photo." }),
  wide: z.boolean().default(false).describe("Wider than the text column where the layout allows it."),
});

const Gallery = z.strictObject({
  type: z.literal("gallery"),
  images: field(z.array(imageSlot(BLOG_IMAGE_SLOTS.gallery)).min(2).max(12), { label: "Zdjęcia", fieldType: "list", description: "2–12 photos shown as square tiles; a click opens them large." }),
  caption: field(text(200).optional(), { label: "Podpis", fieldType: "text", description: "Caption under the gallery." }),
});

const Video = z.strictObject({
  type: z.literal("video"),
  url: HttpsUrl.refine((value) => embedProvider(value)?.kind === "video", "A YouTube (https://www.youtube.com/embed/…) or Vimeo (https://player.vimeo.com/video/…) player address.")
    .describe("YouTube or Vimeo player URL; loads only after a click."),
  title: field(text(120), { label: "Tytuł filmu", fieldType: "text", description: "What the video shows (for screen readers and the play button)." }),
});

const Callout = z.strictObject({
  type: z.literal("callout"),
  title: field(text(80).optional(), { label: "Tytuł ramki", fieldType: "text", description: 'e.g. "Wskazówka".' }),
  text: field(richTextLite(800), { label: "Treść ramki", fieldType: "richtext-lite", description: "A tip or a warning in a highlighted box." }),
});

const Cta = z.strictObject({
  type: z.literal("cta"),
  title: field(text(90).optional(), { label: "Tytuł", fieldType: "text", description: 'e.g. "Chcesz to zrobić z nami?"' }),
  text: field(multilineText(200).optional(), { label: "Tekst", fieldType: "textarea", description: "One sentence." }),
  action: field(Action, { label: "Przycisk", fieldType: "link", description: "Booking, contact section or a phone link." }),
});

export const BLOCK_TYPES = ["paragraph", "heading", "list", "quote", "image", "gallery", "video", "callout", "cta"] as const;

export const PostBlock = z.discriminatedUnion("type", [Paragraph, Heading, List, Quote, Image, Gallery, Video, Callout, Cta]);

export const PostSchema = z.strictObject({
  id: Id.describe("Stable post id, unique in the site."),
  slug: PostSlug.describe("Address of the post under the blog page: <blog.path>/<slug>."),
  title: field(text(110), { label: "Tytuł wpisu", fieldType: "text", description: "Post headline (h1, browser tab, search results)." }),
  excerpt: field(multilineText(240, 20), { label: "Zajawka", fieldType: "textarea", description: "1–2 sentences for the post lists, search results and sharing." }),
  date: z.iso.date().describe("Publication date (YYYY-MM-DD)."),
  updated: z.iso.date().optional().describe("Date of the last real change (YYYY-MM-DD), on or after `date`."),
  format: z
    .enum(["article", "short"])
    .default("article")
    .describe('"article": a text with chapters; "short": a photo post (one photo or a gallery and a few sentences, like an Instagram post).'),
  cover: field(imageSlot(BLOG_IMAGE_SLOTS.cover).optional(), { label: "Okładka", fieldType: "image", description: "Main photo: post lists, top of the post, sharing (at least 800 px wide)." }),
  category: Id.optional().describe("Id of one of blog.categories."),
  tags: field(z.array(text(30)).max(5).default([]), { label: "Tagi", fieldType: "list", description: "Up to 5 short keywords." }),
  body: field(z.array(PostBlock).min(1).max(120), { label: "Treść", fieldType: "list", description: "The post as blocks: paragraph, heading, list, quote, image, gallery, video, callout, cta." }),
  seo: z
    .strictObject({
      title: text(TITLE_MAX).optional().describe(`v3.12: title in search results and when shared, used as is (no site name added), at most ${TITLE_MAX} characters. Default: the post title with " | site name" while the whole fits, else the post title alone.`),
      description: text(160, 50).optional().describe("Meta description, 50–160 characters. Defaults to the excerpt."),
      noindex: z.boolean().default(false),
    })
    .default({ noindex: false }),
});

const Category = z.strictObject({
  id: Id,
  name: field(text(32), { label: "Nazwa kategorii", fieldType: "text", description: 'Short, e.g. "Pielęgnacja".' }),
});

const Author = z.strictObject({
  name: field(text(60), { label: "Autor", fieldType: "text", description: "Who writes the blog: the owner or the business." }),
  role: field(text(60).optional(), { label: "Kim jest", fieldType: "text", description: 'e.g. "fryzjerka, właścicielka salonu".' }),
  bio: field(multilineText(240).optional(), { label: "O autorze", fieldType: "textarea", description: "One or two sentences about the author." }),
  photo: field(imageSlot(BLOG_IMAGE_SLOTS.author).optional(), { label: "Zdjęcie autora", fieldType: "image", description: "Square portrait." }),
});

export const BlogSchema = z.strictObject({
  path: Slug.refine((value) => value !== "/", "The blog needs its own page, e.g. /blog.")
    .default("/blog")
    .describe("The page that lists all posts (a page in pages[] with a posts section); posts live at <path>/<slug>."),
  author: field(Author.optional(), { label: "Autor", fieldType: "text", description: "One author for every post. Without it the business is the author." }),
  categories: field(listWithIds(Category, 0, 12).default([]), { label: "Kategorie", fieldType: "list", description: "0–12 categories; each post may belong to one." }),
  posts: field(listWithIds(PostSchema, 0, MAX_POSTS).default([]), {
    label: "Wpisy",
    fieldType: "list",
    description: `Up to ${MAX_POSTS} posts. Only real content from the business: never invent posts, dates, prices or results.`,
  }),
});

export type Blog = z.infer<typeof BlogSchema>;
export type Post = z.infer<typeof PostSchema>;
export type PostBlockOf<Type extends Post["body"][number]["type"]> = Extract<Post["body"][number], { type: Type }>;
