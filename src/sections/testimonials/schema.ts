import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

/** Quotes shown by the "spotlight" variant; the loader warns when there are more. */
export const SPOTLIGHT_ITEMS = 3;

const Testimonial = z.strictObject({
  id: Id,
  quote: field(multilineText(420), { label: "Opinia", fieldType: "textarea", description: "The client's words (real review)." }),
  author: field(text(60), { label: "Autor", fieldType: "text", description: "Name, e.g. \"Anna K.\"." }),
  role: field(text(60).optional(), { label: "Kim jest", fieldType: "text", description: 'e.g. "klientka od 2021".' }),
  rating: field(z.number().int().min(1).max(5).optional(), { label: "Ocena", fieldType: "select", description: "Stars 1–5 (from a real review)." }),
  avatar: field(imageSlot({ aspect: [1, 1], minWidth: 160 }).optional(), { label: "Zdjęcie", fieldType: "image", description: "Optional square photo." }),
});

export const testimonials = defineSectionType({
  type: "testimonials",
  label: "Opinie klientów",
  description: "Reviews from real clients (social proof).",
  content: z
    .strictObject({
      eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
      title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
      description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
      items: field(listWithIds(Testimonial, 1, 9), { label: "Opinie", fieldType: "list", description: "1–9 reviews; 3 or 6 look best in cards." }),
      ratingAverage: field(z.number().min(1).max(5).optional(), {
        label: "Średnia ocena",
        fieldType: "text",
        description: "Overall score 1–5 (one decimal, e.g. 4.9) from the business's real review profile (Google, Booksy…). Only a real figure from the brief — never estimate it.",
      }),
      ratingCount: field(z.number().int().min(1).max(100000).optional(), {
        label: "Liczba opinii",
        fieldType: "text",
        description: "How many reviews that score is based on, e.g. 127 (needs ratingAverage).",
      }),
      ratingSource: field(text(30).optional(), { label: "Źródło opinii", fieldType: "text", description: 'Where the reviews are, e.g. "Google" (needs ratingAverage).' }),
      ratingLink: field(Action.optional(), {
        label: "Link do opinii",
        fieldType: "link",
        description: 'Optional link to all reviews, e.g. { "label": "Zobacz opinie w Google", "href": "https://g.page/…" }.',
      }),
    })
    .superRefine((content, context) => {
      for (const key of ["ratingCount", "ratingSource"] as const) {
        if (content[key] !== undefined && content.ratingAverage === undefined) {
          context.addIssue({ code: "custom", message: "Set ratingAverage too — the count and source describe that score.", path: [key] });
        }
      }
    }),
  variants: {
    cards: {
      description:
        "Review cards with stars, a quote mark and the author (photo or initials) — the safe default for any number of reviews: " +
        "1–3 sit in one centered row, more become a swipeable slider with arrows.",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar"],
    },
    spotlight: {
      description: "The first three quotes, large and stacked, magazine style — for 1–3 longer, strong reviews (more items: use cards).",
      uses: ["eyebrow", "items.role", "items.rating", "items.avatar"],
    },
    carousel: {
      description:
        "One large quote at a time on a brand-colored panel: the client's photo (or a quote badge), stars, author, arrows and dots — " +
        "calm and focused; best for 2–6 reviews, photos optional. A single review is shown as one big quote without controls.",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar"],
    },
    portraits: {
      description:
        "Every review as a portrait photo tile with the name under it, next to a brand-colored quote card, the pairs in a checkerboard — " +
        "personal and photo-driven; for 1–4 reviews WITH client photos (avatar, ideally 480 px or larger). Without a photo a tile shows big initials.",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar"],
    },
    "quote-cards": {
      description:
        "Centered cards with a big quote mark in a curved corner, stars, and the client's photo (or initials) with the name at the bottom; " +
        "one card (the first, or `highlight`) is on the brand color — friendly and polished; for 1–6 reviews (four as 2 × 2).",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar"],
      props: z.strictObject({
        highlight: z.number().int().min(1).max(9).optional().describe("Number of the review on the brand-colored card (1 = first, the default)."),
      }),
    },
    rating: {
      description:
        "Title and an overall score on the left (ratingAverage, ratingCount and ratingSource from a real review profile, else the " +
        "average of the reviews' own stars; no score when nothing is rated), compact review rows on the right — trustworthy, " +
        "like a Google reviews panel; for 2–9 reviews, photos optional. Set ratingLink to point to all reviews.",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar", "ratingAverage", "ratingCount", "ratingSource", "ratingLink"],
    },
  },
});
