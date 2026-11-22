import { z } from "zod";
import { defineLayoutType } from "../../site/schema/define";
import { Action, field, multilineText, text } from "../../site/schema/fields";

/** v3.9: what every article layout can switch off. */
const ArticleProps = z.strictObject({
  progress: z.boolean().optional().describe("Reading progress bar at the top of the screen (default on)."),
  share: z.boolean().optional().describe("Share links (Facebook, LinkedIn, e-mail, copy link) (default on)."),
  related: z.boolean().optional().describe('"Read also": up to 3 other posts, the same category first (default on).'),
});

export const article = defineLayoutType({
  type: "article",
  label: "Wygląd wpisu",
  description: "The page of one blog post: one layout for every post of the site.",
  content: z.strictObject({
    ctaTitle: field(text(70).optional(), {
      label: "Wezwanie pod wpisem",
      fieldType: "text",
      description: 'Title of the box at the end of every post, e.g. "Masz pytania? Umów konsultację". Default from the dictionary.',
    }),
    ctaText: field(multilineText(160).optional(), { label: "Tekst wezwania", fieldType: "textarea", description: "One sentence in that box." }),
    ctaAction: field(Action.optional(), {
      label: "Przycisk wezwania",
      fieldType: "link",
      description: "Its button: booking, the contact section or a tel: link. Default: the contact section, else the phone number.",
    }),
  }),
  variants: {
    toc: {
      description:
        "The text on the left, a sticky table of contents on the right that highlights the chapter being read. For long " +
        "guides with 3+ chapters (heading blocks); without chapters it is a single centered column.",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    classic: {
      description: "One narrow, comfortable column: category and date, title, excerpt, the cover, then the text. Works for every post.",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    cover: {
      description: "The cover across the whole first screen with the title on it (darkened), the text below. Striking; needs good cover photos.",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    split: {
      description:
        "Split screen on desktops: the cover fills the left half and stays while the text scrolls on the right. Calm and " +
        "visual; for photo-led businesses (interiors, beauty, food).",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    editorial: {
      description:
        "Magazine style: a very large centered title and lead, a wide cover, a drop cap, large pull quotes and photos wider than the text. " +
        "For storytelling posts and interviews.",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    author: {
      description:
        "The text with a sticky side card: the author (photo, role, a sentence) and the call to action button. For experts " +
        "whose posts should bring clients (therapists, lawyers, trainers).",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
    photo: {
      description:
        "For photo posts (format \"short\"): the photos large on the left (a gallery as a slider), the short text, date and " +
        "tags beside them, like an Instagram post. Long articles get the photo on top and the text below.",
      uses: ["ctaTitle", "ctaText", "ctaAction"],
      props: ArticleProps,
    },
  },
});
