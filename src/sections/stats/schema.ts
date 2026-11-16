import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Stat = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short number or fact, e.g. "25 lat", "4,9/5", "12 000+".' }),
  label: field(text(48), { label: "Opis wartości", fieldType: "text", description: "What the value means." }),
  description: field(multilineText(160).optional(), { label: "Szczegóły", fieldType: "textarea", description: "Optional sentence of context." }),
  progress: field(z.number().int().min(0).max(100).optional(), {
    label: "Postęp (%)",
    fieldType: "text",
    description: "Share or percentage 0–100 drawn as a ring or a bar (rings, bars), e.g. 98 for 98% satisfied clients. Only when the value really is a share.",
  }),
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
    rings: {
      description:
        "Circular progress rings with the number inside and the label below — friendly and visual, best for percentages (satisfaction, success rate). Each ring is filled to items.progress; without it the ring is drawn full as a frame around the number.",
      uses: ["eyebrow", "description", "items.description", "items.progress"],
    },
    bars: {
      description:
        "Label and number on one line with a horizontal progress bar below, two columns on wide screens — reads like a report, good for shares and results. The bar shows items.progress; items without it show no bar, just a thin rule.",
      uses: ["eyebrow", "description", "items.description", "items.progress"],
    },
    "chart-cards": {
      description:
        "Cards with a big number and a small decorative chart (bars or a line, generated, not real data) — a modern dashboard look for growth figures. Works best with 3–4 numbers.",
      uses: ["eyebrow", "description", "items.description"],
      props: z.strictObject({ chart: z.enum(["bars", "line"]).optional().describe("Mini chart in every card: bars (default) or a line.") }),
    },
    highlight: {
      description:
        "Title and intro on the left, the FIRST number very large on the right with the others small below it — editorial, for one headline result. Put the most impressive number first; its description is shown.",
      uses: ["eyebrow", "description", "items.description"],
    },
    bento: {
      description:
        "Bento grid: a title tile plus number tiles of different sizes, the first number on the brand color — bold and contemporary. Best with a title and 3–5 numbers.",
      uses: ["eyebrow", "description", "items.description"],
    },
  },
});
