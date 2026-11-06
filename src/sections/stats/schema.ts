import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Stat = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short number or fact, e.g. "25 lat", "4,9/5", "12 000+".' }),
  label: field(text(48), { label: "Opis wartości", fieldType: "text", description: "What the value means." }),
  description: field(multilineText(160).optional(), { label: "Szczegóły", fieldType: "textarea", description: "Optional sentence of context." }),
});

export const stats = defineSectionType({
  type: "stats",
  label: "Liczby",
  description: "Key numbers that build trust: years, clients, ratings, results.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90).optional(), { label: "Tytuł sekcji", fieldType: "text", description: "Optional headline; without it the numbers stand alone." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    items: field(listWithIds(Stat, 2, 6), { label: "Liczby", fieldType: "list", description: "2–6 numbers; 3 or 4 look best." }),
  }),
  accentTone: true,
  variants: {
    row: {
      description: "Big numbers in one row with dividers — a strong band between sections (works on accent tone).",
      uses: ["eyebrow", "description"],
    },
    cards: {
      description: "Numbers in cards with an extra sentence of context.",
      uses: ["eyebrow", "description", "items.description"],
    },
  },
});
