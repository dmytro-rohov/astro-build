import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

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
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    items: field(listWithIds(Testimonial, 1, 9), { label: "Opinie", fieldType: "list", description: "1–9 reviews; 3 or 6 look best in cards." }),
  }),
  variants: {
    cards: {
      description: "Review cards in a grid with stars and author.",
      uses: ["eyebrow", "description", "items.role", "items.rating", "items.avatar"],
    },
    spotlight: {
      description: "The first three quotes, large and stacked, magazine style (more items: use cards).",
      uses: ["eyebrow", "items.role", "items.rating", "items.avatar"],
    },
  },
});
