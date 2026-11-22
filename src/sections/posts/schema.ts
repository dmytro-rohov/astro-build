import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, multilineText, text } from "../../site/schema/fields";

/** v3.9: props every list layout shares (which posts, how many, the category filter). */
const ListProps = {
  limit: z.number().int().min(1).max(60).optional().describe("Show only the newest N posts (e.g. 3 on the home page). Default: all."),
  category: Id.optional().describe("Only posts of this category (an id from blog.categories)."),
  filter: z.boolean().optional().describe("Category buttons above the list. Default: on when the list shows all posts of 2+ categories."),
  perPage: z.number().int().min(3).max(24).optional().describe('Posts shown before "show more" (default 9; the rest appear on click).'),
};

const props = z.strictObject(ListProps);

export const posts = defineSectionType({
  type: "posts",
  label: "Wpisy na blogu",
  description:
    "A list of the site's blog posts (blog.posts): on the blog page all of them, elsewhere the newest few (props.limit). " +
    "The posts come from blog.posts, never from this section; the section only sets the title and the look.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: 'Section headline, e.g. "Blog" or "Najnowsze wpisy".' }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "What the blog is about, one or two sentences." }),
    link: field(Action.optional(), {
      label: "Link do bloga",
      fieldType: "link",
      description: 'Link under a short list, e.g. { "label": "Wszystkie wpisy", "href": "/blog" } (home page).',
    }),
  }),
  variants: {
    cards: {
      description: "Cards in a grid (3 per row on desktops): cover, category, date, title and excerpt. The safe default for any blog.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    featured: {
      description:
        "The newest post large across the full width (cover beside the text), the rest as smaller cards below. For blogs with " +
        "good cover photos; strong on the blog page.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    rows: {
      description: "One post per row: cover on the left, category, date, title and excerpt on the right. Calm and readable, for longer excerpts.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    magazine: {
      description:
        "Magazine grid: one big post with the title on its photo, two medium ones beside it, then small cards. Lively, " +
        "news-like; for blogs with 4+ posts and photos.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    minimal: {
      description:
        "A typographic list without photos: date, category and a large title per row, a thin line between them. For expert " +
        "blogs (lawyers, advisers, therapists) and posts without photos.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    "photo-grid": {
      description:
        "Square photo tiles like an Instagram profile; the title shows on the photo. For photo posts (format \"short\") of " +
        "salons, studios, restaurants, makers. Posts without a cover show their title on a brand-colored tile.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    carousel: {
      description: "Cards in a sideways slider with arrows. For the home page (\"latest posts\") with 3–9 posts.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
    timeline: {
      description: "Posts grouped by month on a vertical line: date, title and excerpt, a small photo. For news and diaries of a business.",
      uses: ["eyebrow", "description", "link"],
      props,
    },
  },
});
